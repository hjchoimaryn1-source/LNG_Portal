// src/batch/dualReadDiff.ts
//
// PURPOSE
//   Refactoring Plan §3.2 Phase 1(Dual Read / Shadow Diff) 구현체.
//   "flattenAssetTree() 등 read adapter 결과와 레거시 mock 결과를 화면에는
//   레거시만 노출하되 콘솔/로그로 diff 비교"를 수행한다.
//
//   화면(UI)에는 절대 영향을 주지 않는다 — 이 파일도 React/Next.js를 import하지 않는다.
//
// 설계 결정 (Phase 0 불변성과의 관계)
//   레거시 자산이 아직 승격 전(alias 없음)이면 Phase 0과 동일하게
//   upsertStagingAssetRow()로 staging_legacy_assets에 큐잉한다 (PROMOTED
//   보호 로직을 그대로 재사용 — 이 함수는 멱등적이고 PROMOTED를 건드리지 않음).
//
//   반대로 레거시 자산이 이미 승격(alias 있음)되었는데 CMMS 쪽 값이 레거시와
//   달라진 경우("drift")는 staging_legacy_assets를 절대 되돌리지 않는다 —
//   PROMOTED 상태를 mapping_status로 역행시키면 Phase 0에서 세운 "승격된
//   자산은 불변" 원칙이 깨진다. 대신 asset_dual_read_diffs에만 별도 기록한다.

import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import type { LegacyDataSource, LegacyAssetSourceRow } from './legacyDataSource';
import { fetchAssetMasterTree, fetchAssetTagAliasMap } from '../adapters/cmmsAssetReader';
import { flattenAssetTree, type LegacyAssetRow } from '../adapters/assetMasterToLegacyView';
import { upsertStagingAssetRow } from '../adapters/assetStagingWriter';
import { resolveCriticality, resolveStatus } from '../adapters/assetAdapter';

// ----------------------------------------------------------------------------
// 1. 비교 대상 필드
// ----------------------------------------------------------------------------

/**
 * 비교 대상에서 의도적으로 제외한 필드:
 *   - tag: 매칭 키 자체이므로 비교 불필요
 *   - lastMaint: CMMS 쪽은 향후 work_orders 이력에서 파생될 값이라 legacy 원본과
 *     구조적으로 다를 수밖에 없다 (Phase 2+ 범위) — 지금 비교하면 항상 거짓 drift만 쌓인다.
 */
const FIELDS_TO_COMPARE: (keyof LegacyAssetRow)[] = ['name', 'loc', 'maker', 'crit', 'status', 'type'];

export interface FieldDiff {
  field: (typeof FIELDS_TO_COMPARE)[number];
  legacyValue: string;
  cmmsValue: string;
}

export interface AssetDualReadDiff {
  legacyTag: string;
  equipmentTag: string;
  diffs: FieldDiff[];
}

export interface DualReadResult {
  runAt: string;
  /** 이미 승격되어 있고, 레거시와 값이 완전히 일치하는 자산 수 */
  matchedCount: number;
  /** 이미 승격되어 있는데 하나 이상 필드가 레거시와 다른 자산 수 */
  driftedCount: number;
  /** 아직 승격 전(alias 없음) — Phase 0 큐로 위임된 자산 수 */
  unmappedCount: number;
  /** 승격 후 assets 테이블에서 행 자체가 사라진(정합성 이상) 자산 수 */
  orphanedAliasCount: number;
  drifts: AssetDualReadDiff[];
}

function emptyResult(): DualReadResult {
  return { runAt: new Date().toISOString(), matchedCount: 0, driftedCount: 0, unmappedCount: 0, orphanedAliasCount: 0, drifts: [] };
}

function normalize(v: string | undefined | null): string {
  return (v ?? '').trim().toLowerCase();
}

/**
 * LegacyAssetSourceRow(배치 입력용 원본) -> LegacyAssetRow(UI 렌더 shape)로 변환.
 *
 * 주의: crit/status는 원문 그대로 비교하지 않는다. 레거시 자유텍스트("Running",
 * "High" 등)와 CMMS Enum("OPERATIONAL", "HIGH")은 표기 체계 자체가 다르므로,
 * assetAdapter.ts의 정규화 함수(resolveCriticality/resolveStatus)로 "이 레거시
 * 값이 오늘 다시 매핑된다면 어떤 CMMS 값이 되어야 하는가"를 먼저 구한 뒤 비교한다.
 * 이렇게 해야 순수 어휘 차이로 인한 오탐(false-positive drift)과, 승격 후 CMMS
 * 쪽 값이 실제로 수동 변경된 진짜 drift를 구분할 수 있다.
 */
function legacySourceRowToView(row: LegacyAssetSourceRow): LegacyAssetRow {
  return {
    tag: row.legacyTag,
    name: row.legacyName ?? '',
    loc: row.legacyLocationRaw ?? '',
    maker: row.legacyMaker ?? '',
    crit: resolveCriticality(row.legacyCriticalityRaw).value,
    lastMaint: 'N/A',
    status: resolveStatus(row.legacyStatusRaw).value,
    type: row.legacyTypeFilter ?? 'PLANT',
  };
}

function diffRows(legacy: LegacyAssetRow, cmms: LegacyAssetRow): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const field of FIELDS_TO_COMPARE) {
    if (normalize(legacy[field]) !== normalize(cmms[field])) {
      diffs.push({ field, legacyValue: legacy[field], cmmsValue: cmms[field] });
    }
  }
  return diffs;
}

// ----------------------------------------------------------------------------
// 2. drift 이력 멱등적 기록 (같은 값이 반복 감지될 때마다 중복 INSERT 방지)
// ----------------------------------------------------------------------------

const FIND_UNRESOLVED_DIFF_SQL = `
  SELECT diff_id, cmms_value FROM asset_dual_read_diffs
  WHERE legacy_tag = @legacyTag AND field_name = @fieldName AND resolved = 0
  ORDER BY detected_at DESC LIMIT 1
`;
const RESOLVE_DIFF_SQL = `UPDATE asset_dual_read_diffs SET resolved = 1 WHERE diff_id = @diffId`;
const INSERT_DIFF_SQL = `
  INSERT INTO asset_dual_read_diffs (legacy_tag, equipment_tag, field_name, legacy_value, cmms_value)
  VALUES (@legacyTag, @equipmentTag, @fieldName, @legacyValue, @cmmsValue)
`;

/**
 * 동일한 (legacy_tag, field_name)에 대해 "아직 해소되지 않은" drift 레코드가 이미
 * 있고 값도 그대로면 새로 쓰지 않는다(매일 재실행해도 무한정 쌓이지 않도록).
 * 값이 바뀌었으면 기존 미해소 레코드는 resolved=1로 닫고 새 값으로 새 레코드를 만든다
 * (drift 값 변화 이력을 그대로 보존).
 */
function persistDrift(db: SqlExecutor, legacyTag: string, equipmentTag: string, diff: FieldDiff): void {
  const existing = db.get<{ diff_id: number; cmms_value: string | null }>(FIND_UNRESOLVED_DIFF_SQL, {
    legacyTag,
    fieldName: diff.field,
  });
  if (existing && existing.cmms_value === diff.cmmsValue) return; // 변화 없음, 재기록 불필요
  if (existing) db.run(RESOLVE_DIFF_SQL, { diffId: existing.diff_id });
  db.run(INSERT_DIFF_SQL, {
    legacyTag,
    equipmentTag,
    fieldName: diff.field,
    legacyValue: diff.legacyValue,
    cmmsValue: diff.cmmsValue,
  });
}

/**
 * 이번 실행에서 diff가 발생한 필드(currentDiffs)를 제외한 나머지 비교 대상 필드에
 * 대해, 예전에 남아있던 미해소(resolved=0) drift 레코드가 있으면 닫는다.
 *
 * 이 함수가 없으면, 한 번 drift로 기록된 필드가 나중에 다시 레거시 값과 일치하게
 * 되어도(diffs 배열에 더는 나타나지 않으므로) persistDrift가 호출될 일이 없어
 * 미해소 목록에 영구히 남는 버그가 생긴다 — 실제로 검증 중 재현되어 발견했다.
 */
function resolveStaleDrifts(db: SqlExecutor, legacyTag: string, currentDiffFields: Set<string>): void {
  for (const field of FIELDS_TO_COMPARE) {
    if (currentDiffFields.has(field)) continue; // 아래에서 persistDrift가 처리
    const existing = db.get<{ diff_id: number }>(FIND_UNRESOLVED_DIFF_SQL, { legacyTag, fieldName: field });
    if (existing) db.run(RESOLVE_DIFF_SQL, { diffId: existing.diff_id });
  }
}

/** 아직 해소되지 않은 drift 전체 조회 — 리포트/수동 검토용 */
export function findUnresolvedDrifts(db: SqlExecutor) {
  return db.all<{ diff_id: number; legacy_tag: string; equipment_tag: string; field_name: string; legacy_value: string; cmms_value: string; detected_at: string }>(
    `SELECT diff_id, legacy_tag, equipment_tag, field_name, legacy_value, cmms_value, detected_at
     FROM asset_dual_read_diffs WHERE resolved = 0 ORDER BY detected_at DESC`
  );
}

// ----------------------------------------------------------------------------
// 3. 오케스트레이터
// ----------------------------------------------------------------------------

/**
 * Dual Read 1회 실행:
 *   1) 레거시 원본 조회 (LegacyDataSource — 화면이 실제로 읽는 소스와 동일)
 *   2) CMMS assets 테이블 조회 -> 트리 -> flatten
 *   3) asset_tag_alias로 legacy_tag <-> equipment_tag 매칭
 *   4) 미승격 자산 -> Phase 0 큐(upsertStagingAssetRow)로 위임
 *      승격된 자산 -> 필드별 비교, 불일치 시 콘솔 로그 + asset_dual_read_diffs 기록
 *
 * 화면에는 영향 없음 — 이 함수는 UI가 읽는 어떤 상태도 변경하지 않는다.
 */
export async function runDualReadDiff(db: SqlExecutor, source: LegacyDataSource): Promise<DualReadResult> {
  const result = emptyResult();

  const legacyRows = await source.fetchAssets();
  const cmmsTree = fetchAssetMasterTree(db);
  const cmmsFlatByTag = new Map(flattenAssetTree(cmmsTree).map((r) => [r.tag, r]));
  const aliasMap = fetchAssetTagAliasMap(db);

  for (const row of legacyRows) {
    const equipmentTag = aliasMap.get(row.legacyTag);

    if (!equipmentTag) {
      // 아직 승격 전 — Phase 0과 동일한 멱등적 큐잉 (PROMOTED 자산은 이 함수가
      // 애초에 건드리지 않으므로, 여기 들어오는 건 항상 미승격 케이스뿐)
      upsertStagingAssetRow(db, row);
      result.unmappedCount++;
      continue;
    }

    const cmmsView = cmmsFlatByTag.get(equipmentTag);
    if (!cmmsView) {
      // alias는 있는데 assets 테이블에 실제 행이 없는 상태 — 데이터 정합성 이상.
      // 승격 취소/삭제 등으로 발생할 수 있으므로 drift로 기록해 운영자가 인지하게 한다.
      result.orphanedAliasCount++;
      const diff: FieldDiff = { field: 'name', legacyValue: row.legacyName ?? '', cmmsValue: '(assets 테이블에 없음 — orphaned alias)' };
      persistDrift(db, row.legacyTag, equipmentTag, diff);
      result.drifts.push({ legacyTag: row.legacyTag, equipmentTag, diffs: [diff] });
      console.warn(`[dualReadDiff] ORPHANED ALIAS: legacy_tag="${row.legacyTag}" -> equipment_tag="${equipmentTag}" not found in assets table.`);
      continue;
    }

    const legacyView = legacySourceRowToView(row);
    const diffs = diffRows(legacyView, cmmsView);

    // 이번 실행에서 diff가 사라진 필드는(예: 이전에 drift였다가 다시 일치하게 된 경우)
    // 미해소 목록에서 반드시 닫아준다 — matched/drifted 여부와 무관하게 항상 수행.
    resolveStaleDrifts(db, row.legacyTag, new Set(diffs.map((d) => d.field)));

    if (diffs.length === 0) {
      result.matchedCount++;
      continue;
    }

    result.driftedCount++;
    result.drifts.push({ legacyTag: row.legacyTag, equipmentTag, diffs });
    for (const d of diffs) persistDrift(db, row.legacyTag, equipmentTag, d);

    console.warn(
      `[dualReadDiff] DRIFT legacy_tag="${row.legacyTag}" equipment_tag="${equipmentTag}": ` +
        diffs.map((d) => `${d.field}(legacy="${d.legacyValue}" != cmms="${d.cmmsValue}")`).join(', ')
    );
  }

  return result;
}
