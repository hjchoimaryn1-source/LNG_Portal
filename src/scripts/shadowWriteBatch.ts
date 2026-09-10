// src/scripts/shadowWriteBatch.ts
//
// PURPOSE
//   Phase 0 Shadow Write 오케스트레이터. staging_legacy_assets에만 기록하고
//   UI는 건드리지 않는다.
//
//   ※ 이 버전은 원안(허가서/가스측정 이력까지 처리)에서 허가서 관련 로직을
//   의도적으로 제외한 경량판이다. 현재 연결된 모든 LegacyDataSource
//   (IsoTankLegacyDataSource, FixedEquipmentLegacyDataSource,
//   MockFixedEquipmentDataSource)가 fetchPermits()에서 항상 빈 배열을
//   반환하므로, 허가서 처리 코드는 지금 시점에 실행될 일이 없다 —
//   e-PTW/SIMOPS 연동을 시작할 때 permitPersistenceAdapter.ts /
//   gasSafetyAdapter.ts를 함께 들여오면서 그 부분을 다시 추가하면 된다.

import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import { upsertStagingAssetRow, type StagingWriteOutcome } from '../adapters/assetStagingWriter';
import type { LegacyDataSource } from '../data/legacyDataSource';

export interface ShadowWriteBatchResult {
  runAt: string;
  assets: {
    processed: number;
    inserted: number;
    updated: number;
    skippedAlreadyPromoted: number;
    needsReview: number;
    errors: { legacyTag: string; message: string }[];
  };
  permits: {
    processed: number;
    newlyInitialized: number;
    alreadyExisted: number;
    gasTestsRecorded: number;
    errors: { permitRefNo: string; message: string }[];
  };
}

function emptyResult(): ShadowWriteBatchResult {
  return {
    runAt: new Date().toISOString(),
    assets: { processed: 0, inserted: 0, updated: 0, skippedAlreadyPromoted: 0, needsReview: 0, errors: [] },
    // 허가서 카운트는 현재 항상 0 — 위 PURPOSE 참조. 리포트 스키마 호환을 위해 필드는 유지.
    permits: { processed: 0, newlyInitialized: 0, alreadyExisted: 0, gasTestsRecorded: 0, errors: [] },
  };
}

export async function runShadowWriteBatch(db: SqlExecutor, source: LegacyDataSource): Promise<ShadowWriteBatchResult> {
  const result = emptyResult();

  const assetRows = await source.fetchAssets();
  for (const row of assetRows) {
    result.assets.processed++;
    try {
      const outcome = upsertStagingAssetRow(db, row);
      tallyAssetOutcome(result, outcome.outcome);
      if (outcome.view.needsReview) result.assets.needsReview++;
    } catch (err) {
      result.assets.errors.push({ legacyTag: row.legacyTag, message: err instanceof Error ? err.message : String(err) });
    }
  }

  // 허가서: 현재 단계에서는 처리하지 않음 (위 PURPOSE 참조)
  const permitRows = await source.fetchPermits();
  result.permits.processed = permitRows.length; // 항상 0이어야 정상

  return result;
}

function tallyAssetOutcome(result: ShadowWriteBatchResult, outcome: StagingWriteOutcome): void {
  if (outcome === 'INSERTED') result.assets.inserted++;
  else if (outcome === 'UPDATED') result.assets.updated++;
  else if (outcome === 'SKIPPED_ALREADY_PROMOTED') result.assets.skippedAlreadyPromoted++;
}
