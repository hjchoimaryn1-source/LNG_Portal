// src/adapters/promoteStagingAssetToAssets.ts
//
// PURPOSE
//   staging_legacy_assets 행을 실제 assets + asset_tag_alias 테이블로
//   승격하는 영속화 로직. Phase 0에서 staging한 후, 사람이 검토/확정한
//   데이터를 정식 CMMS 테이블로 옮기는 단계.
//
// 정책
//   mapping_status='AUTO_MAPPED': 검토 불필요 → 즉시 승격
//   mapping_status='MANUAL_OVERRIDE': 사람이 검토 후 수정 → 승격 가능
//   mapping_status='PENDING_REVIEW': 아직 확정 안 됨 → 스킵
//   mapping_status='PROMOTED': 이미 승격 → 스킵
//   mapping_status='REJECTED': 거절됨 → 스킵

import type { SqlExecutor } from './db/sqlExecutor';
import { resolveStatus } from './assetAdapter';

interface PromotableRow {
  staging_id: number;
  legacy_tag: string;
  legacy_name: string;
  proposed_equipment_tag: string | null;
  proposed_kks_code: string | null;
  proposed_iso14224_class: string | null;
  proposed_criticality: string | null;
  proposed_impa_code: string | null;
  legacy_location_raw: string | null;
  legacy_maker: string | null;
  legacy_status_raw: string | null;
  mapping_status: string;
}

export interface PromoteResult {
  promotedCount: number;
  skippedCount: number;
  failureCount: number;
  errors: { legacyTag: string; message: string }[];
}

/**
 * staging_legacy_assets에서 승격 가능한 행(AUTO_MAPPED / MANUAL_OVERRIDE)을
 * 조회한다. proposed_equipment_tag가 NULL이면 승격 불가 (proposed_* 컬럼이
 * 완전히 채워져야 assets 테이블 NOT NULL 제약을 통과).
 */
function fetchPromotableStagingRows(db: SqlExecutor): PromotableRow[] {
  return db.all<PromotableRow>(
    `SELECT staging_id, legacy_tag, legacy_name, proposed_equipment_tag, proposed_kks_code,
            proposed_iso14224_class, proposed_criticality, proposed_impa_code,
            legacy_location_raw, legacy_maker, legacy_status_raw, mapping_status
     FROM staging_legacy_assets
     WHERE mapping_status IN ('AUTO_MAPPED', 'MANUAL_OVERRIDE')
       AND proposed_equipment_tag IS NOT NULL
     ORDER BY created_at ASC`
  );
}

const INSERT_ASSET_SQL = `
  INSERT INTO assets (
    equipment_tag, asset_name, iso_14224_class, kks_code, criticality, location_area, status, manufacturer
  ) VALUES (
    @equipmentTag, @assetName, @iso14224Class, @kksCode, @criticality, @locationArea, @status, @manufacturer
  )
`;

const INSERT_ALIAS_SQL = `
  INSERT INTO asset_tag_alias (legacy_tag, equipment_tag)
  VALUES (@legacyTag, @equipmentTag)
`;

const MARK_PROMOTED_SQL = `
  UPDATE staging_legacy_assets
  SET mapping_status = 'PROMOTED', updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE staging_id = @stagingId
`;

/**
 * 단일 staging 행을 assets + asset_tag_alias로 승격한다.
 * 실패해도 다른 행 처리는 계속한다 (fault-tolerant).
 */
function promoteOneRow(db: SqlExecutor, row: PromotableRow): { success: boolean; error?: string } {
  try {
    // status는 staging에 proposed_status 컬럼이 없어(§DDL) 여기서 legacy_status_raw로부터
    // 직접 재계산한다. 이 계산 없이 INSERT에서 status를 생략하면 DB DEFAULT('OPERATIONAL')가
    // 조용히 적용되어, staging 단계에서 "상태 미확인 -> 보수적으로 OUT_OF_SERVICE"라고
    // 판단했던 것이 승격 순간 사라지고 전부 운영중으로 뒤바뀐다 — 실제 Dual Read 검증
    // 중 재현되어 발견한 버그. resolveStatus()로 동일한 보수적 정책을 승격 시점에도 적용한다.
    const status = resolveStatus(row.legacy_status_raw).value;

    // assets 테이블에 신규 행 삽입
    db.run(INSERT_ASSET_SQL, {
      equipmentTag: row.proposed_equipment_tag,
      assetName: row.legacy_name,
      iso14224Class: row.proposed_iso14224_class ?? 'Unknown',
      kksCode: row.proposed_kks_code,
      criticality: row.proposed_criticality ?? 'MEDIUM',
      locationArea: row.legacy_location_raw ?? 'Unknown',
      status,
      manufacturer: row.legacy_maker ?? null,
    });

    // asset_tag_alias 삽입 (legacy_tag <-> equipment_tag 매핑)
    db.run(INSERT_ALIAS_SQL, {
      legacyTag: row.legacy_tag,
      equipmentTag: row.proposed_equipment_tag,
    });

    // staging 행 상태 PROMOTED로 변경
    db.run(MARK_PROMOTED_SQL, { stagingId: row.staging_id });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * staging_legacy_assets에서 AUTO_MAPPED/MANUAL_OVERRIDE 상태인 행들을
 * 한 배치로 assets 테이블로 승격한다.
 *
 * 이 함수를 호출하는 쪽에서 DB 트랜잭션으로 감싸기를 권장한다
 * (일부 행 실패 시에도 성공한 행은 커밋하려면 각 행을 개별 try-catch로 처리).
 */
export function promoteStagingAssetsToAssets(db: SqlExecutor): PromoteResult {
  const result: PromoteResult = {
    promotedCount: 0,
    skippedCount: 0,
    failureCount: 0,
    errors: [],
  };

  const rows = fetchPromotableStagingRows(db);
  for (const row of rows) {
    const res = promoteOneRow(db, row);
    if (res.success) {
      result.promotedCount++;
    } else {
      result.failureCount++;
      result.errors.push({ legacyTag: row.legacy_tag, message: res.error ?? 'Unknown error' });
    }
  }

  return result;
}

/**
 * 비교: 현재 staging 상태를 요약으로 조회 (리포트/모니터링용).
 */
export function getStagingStatsSummary(db: SqlExecutor) {
  const summary = db.get<{ status: string; cnt: number; detail: string }>(
    `SELECT 
       'Summary' as status,
       (SELECT COUNT(*) FROM staging_legacy_assets) as cnt,
       'Total rows in staging' as detail`
  );

  const byCounts = db.all<{ mapping_status: string; cnt: number }>(
    `SELECT mapping_status, COUNT(*) as cnt FROM staging_legacy_assets GROUP BY mapping_status`
  );

  return { summary, byCounts };
}
