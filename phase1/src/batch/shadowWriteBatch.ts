// src/batch/shadowWriteBatch.ts
//
// PURPOSE
//   Refactoring Plan §3.2 Phase 0(Shadow Write) 구현체.
//   "어댑터를 통해 CMMS staging_*/신규 SSOT 테이블에 기록만 하고, UI는 100%
//   레거시로 계속 서빙" 하는 배치 한 사이클을 수행한다.
//
//   이 파일은 화면/컴포넌트를 전혀 참조하지 않는다 — 순수 백엔드 배치.
//   UI 영향 없음을 코드 레벨에서도 보장하기 위해 의도적으로 React/Next.js
//   관련 import를 전혀 하지 않는다.
//
// SAFETY
//   - 자산: 실패한 개별 행은 throw하지 않고 errors[]에 누적, 나머지는 계속 처리.
//   - 허가서: initializePermitLockState()는 최초 1회만 성공하는 계약이므로,
//     이미 있으면 getPermitLockState()로 먼저 확인하고 조용히 스킵한다
//     (Phase 0는 "최초 생성"만 책임지고, 상태 전이는 Phase 3 범위).

import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import { upsertStagingAssetRow, type StagingWriteOutcome } from '../adapters/assetStagingWriter';
import { getPermitLockState, initializePermitLockState } from '../adapters/permitPersistenceAdapter';
import { recordLegacyGasReading } from '../adapters/gasSafetyAdapter';
import type { LegacyDataSource } from './legacyDataSource';

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
    permits: { processed: 0, newlyInitialized: 0, alreadyExisted: 0, gasTestsRecorded: 0, errors: [] },
  };
}

/**
 * Shadow Write 배치 1회 실행. 매일(cron) 또는 수동으로 호출된다.
 * DB 커넥션(SqlExecutor)과 레거시 데이터 소스만 주입받는다 — UI/HTTP 계층 무관.
 */
export async function runShadowWriteBatch(db: SqlExecutor, source: LegacyDataSource): Promise<ShadowWriteBatchResult> {
  const result = emptyResult();

  // --- 1. 자산 Shadow Write ---
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

  // --- 2. Permit Shadow Write (최초 생성만, 상태 전이는 Phase 3 범위) ---
  const permitRows = await source.fetchPermits();
  for (const row of permitRows) {
    result.permits.processed++;
    try {
      const existing = getPermitLockState(db, row.permitRefNo);
      if (existing) {
        result.permits.alreadyExisted++;
      } else {
        initializePermitLockState(db, row.permitRefNo, row.payload);
        result.permits.newlyInitialized++;
      }

      if (row.latestGasReading && row.testerIdentifier) {
        recordLegacyGasReading(db, row.permitRefNo, row.latestGasReading, row.testerIdentifier, 'CONTINUOUS');
        result.permits.gasTestsRecorded++;
      }
    } catch (err) {
      result.permits.errors.push({ permitRefNo: row.permitRefNo, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return result;
}

function tallyAssetOutcome(result: ShadowWriteBatchResult, outcome: StagingWriteOutcome): void {
  if (outcome === 'INSERTED') result.assets.inserted++;
  else if (outcome === 'UPDATED') result.assets.updated++;
  else if (outcome === 'SKIPPED_ALREADY_PROMOTED') result.assets.skippedAlreadyPromoted++;
}
