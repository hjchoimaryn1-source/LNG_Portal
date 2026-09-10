// src/adapters/assetStagingWriter.ts
//
// PURPOSE
//   assetAdapter.ts는 의도적으로 "읽기 전용" 계약을 유지한다 (파일 상단 GUARANTEES:
//   "DB 쓰기, 네트워크 호출, 상태 변경 없음"). 이 파일이 그 결과값(SafeAssetView)을
//   실제로 staging_legacy_assets에 적재하는 책임을 분리해서 담당한다.
//   (permitPersistenceAdapter.ts가 ptwStatusMapper.ts의 순수 계산과 영속화를
//   분리한 것과 동일한 패턴.)
//
// IDEMPOTENCY (Phase 0 매일 재실행 대비)
//   같은 legacy_tag가 매일 재적재되어 staging 테이블이 무한정 불어나는 것을 막기 위해,
//   "아직 PROMOTED/REJECTED 되지 않은 최신 행"이 있으면 그 행을 UPDATE하고,
//   없으면(최초이거나 이미 PROMOTED된 경우) 새 행을 INSERT한다.
//   이미 PROMOTED된 legacy_tag는 재작성하지 않고 스킵으로 보고한다 — 정식 assets
//   테이블로 승격된 자산의 스테이징 이력을 되돌리지 않기 위함이다.

import type { SqlExecutor } from './db/sqlExecutor';
import { toSafeAssetView, type StagingAssetRowInput, type SafeAssetView } from './assetAdapter';
import { normalizeTag } from './tagNormalizationService';
import { resolveSystemCodeForLegacyTag } from './locationToSystemCode';

export type StagingWriteOutcome = 'INSERTED' | 'UPDATED' | 'SKIPPED_ALREADY_PROMOTED';

export interface StagingWriteResult {
  legacyTag: string;
  outcome: StagingWriteOutcome;
  view: SafeAssetView;
}

interface ExistingStagingRow {
  staging_id: number;
  mapping_status: string;
}

const FIND_LATEST_SQL = `
  SELECT staging_id, mapping_status
  FROM staging_legacy_assets
  WHERE legacy_tag = @legacyTag
  ORDER BY created_at DESC
  LIMIT 1
`;

const INSERT_SQL = `
  INSERT INTO staging_legacy_assets (
    legacy_tag, legacy_name, legacy_location_raw, legacy_maker,
    legacy_criticality_raw, legacy_status_raw, legacy_type_filter, legacy_impa_code_raw,
    proposed_equipment_tag, proposed_kks_code, proposed_iso14224_class, proposed_criticality, proposed_impa_code,
    mapping_status, needs_review, source_file_key
  ) VALUES (
    @legacyTag, @legacyName, @legacyLocationRaw, @legacyMaker,
    @legacyCriticalityRaw, @legacyStatusRaw, @legacyTypeFilter, @legacyImpaCodeRaw,
    @proposedEquipmentTag, @proposedKksCode, @proposedIso14224Class, @proposedCriticality, @proposedImpaCode,
    @mappingStatus, @needsReview, @sourceFileKey
  )
`;

const UPDATE_SQL = `
  UPDATE staging_legacy_assets SET
    legacy_name = @legacyName,
    legacy_location_raw = @legacyLocationRaw,
    legacy_maker = @legacyMaker,
    legacy_criticality_raw = @legacyCriticalityRaw,
    legacy_status_raw = @legacyStatusRaw,
    legacy_type_filter = @legacyTypeFilter,
    legacy_impa_code_raw = @legacyImpaCodeRaw,
    proposed_equipment_tag = @proposedEquipmentTag,
    proposed_kks_code = @proposedKksCode,
    proposed_iso14224_class = @proposedIso14224Class,
    proposed_criticality = @proposedCriticality,
    proposed_impa_code = @proposedImpaCode,
    mapping_status = @mappingStatus,
    needs_review = @needsReview,
    source_file_key = @sourceFileKey,
    updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE staging_id = @stagingId
`;

/**
 * 단일 레거시 자산 행을 안전 변환(assetAdapter.toSafeAssetView) 후
 * staging_legacy_assets에 멱등적으로 반영한다.
 *
 * "PROMOTED" 상태인 legacy_tag는 절대 덮어쓰지 않는다 — 이미 assets 테이블로
 * 승격되어 asset_tag_alias로 참조되고 있을 수 있기 때문이다.
 */
export function upsertStagingAssetRow(
  db: SqlExecutor,
  input: StagingAssetRowInput & { legacyTag: string; sourceFileKey?: string }
): StagingWriteResult {
  const view = toSafeAssetView(input);

  // Tag Normalization: legacy_tag + location -> systemCode -> normalizeTag
  // (ISO Tank 같은 이동식 자산은 location 텍스트 대신 태그 prefix로 System 10 강제)
  const systemCodeInfo = resolveSystemCodeForLegacyTag(input.legacyTag, input.legacyLocationRaw);
  const normResult = normalizeTag(input.legacyTag, systemCodeInfo.systemCode, input.legacyTypeFilter ?? undefined);

  // needsReview 게이트: assetAdapter의 fallbackFields 중 'impaCode'는 제외한다.
  // IMPA(자재 카탈로그) 코드는 MRO/구매 도메인 관심사이지 자산 정체성(Tag/KKS/Class/
  // Criticality) 매핑 품질과 무관하다 — IMPA 미매핑만으로 자산 승격 자체를 막으면
  // 실질적으로 모든 자산이 영원히 PENDING_REVIEW에 머무르게 되어 게이트가 무의미해진다.
  const blockingFallbacks = view.fallbackFields.filter((f) => f !== 'impaCode');
  const hasReviewNeeded = blockingFallbacks.length > 0 || normResult.hasFallback;
  const mappingStatus = hasReviewNeeded ? 'PENDING_REVIEW' : 'AUTO_MAPPED';
  const needsReview = hasReviewNeeded ? 1 : 0;

  const params = {
    legacyTag: input.legacyTag,
    legacyName: input.legacyName ?? null,
    legacyLocationRaw: input.legacyLocationRaw ?? null,
    legacyMaker: input.legacyMaker ?? null,
    legacyCriticalityRaw: input.legacyCriticalityRaw ?? null,
    legacyStatusRaw: input.legacyStatusRaw ?? null,
    legacyTypeFilter: input.legacyTypeFilter ?? null,
    legacyImpaCodeRaw: input.legacyImpaCodeRaw ?? null,
    // proposed_* 컬럼:
    //   - equipmentTag/kksCode는 이제 tagNormalizationService로 자동 생성
    //   - iso14224Class/criticality/impaCode는 여전히 assetAdapter 결과 사용
    proposedEquipmentTag: normResult.hasFallback ? null : normResult.equipmentTag,
    proposedKksCode: normResult.hasFallback ? null : normResult.kksCode,
    proposedIso14224Class: view.fallbackFields.includes('iso14224Class') ? null : view.iso14224Class,
    proposedCriticality: view.fallbackFields.includes('criticality') ? null : view.criticality,
    proposedImpaCode: view.fallbackFields.includes('impaCode') ? null : view.impaCode,
    mappingStatus,
    needsReview,
    sourceFileKey: input.sourceFileKey ?? null,
  };

  const existing = db.get<ExistingStagingRow>(FIND_LATEST_SQL, { legacyTag: input.legacyTag });

  if (existing?.mapping_status === 'PROMOTED') {
    return { legacyTag: input.legacyTag, outcome: 'SKIPPED_ALREADY_PROMOTED', view };
  }

  if (existing) {
    // UPDATE_SQL은 legacy_tag를 SET하지 않으므로(불변 식별자), 바인딩 파라미터도
    // legacyTag를 제외한 UPDATE_SQL 참조 컬럼만 정확히 맞춰서 전달해야 한다.
    // (node:sqlite / better-sqlite3 등 다수의 드라이버가 SQL에 없는 named parameter를
    // 넘기면 엄격하게 에러를 던진다 — spread로 통째로 넘기지 않도록 주의)
    const { legacyTag, ...updateParams } = params;
    db.run(UPDATE_SQL, { ...updateParams, stagingId: existing.staging_id });
    return { legacyTag: input.legacyTag, outcome: 'UPDATED', view };
  }

  db.run(INSERT_SQL, params);
  return { legacyTag: input.legacyTag, outcome: 'INSERTED', view };
}
