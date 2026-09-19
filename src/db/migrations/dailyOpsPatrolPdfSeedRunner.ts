// src/db/migrations/dailyOpsPatrolPdfSeedRunner.ts
//
// PURPOSE
//   dailyOpsPatrolPdfSeed.ts의 8개 행을 dailyOpsPatrolDao.ts의
//   insertPatrolEntry()(공식 upsert 경로, idx_daily_ops_patrol_unique 대상)로
//   적재한다. gasMeteringLedgerDailyRunner.ts와 동일한 러너 컨벤션(--dry-run,
//   CMMS_DB_PATH는 getCmmsDb()가 내부적으로 처리).
//
// CLI USAGE
//   npx tsx src/db/migrations/dailyOpsPatrolPdfSeedRunner.ts            # apply
//   npx tsx src/db/migrations/dailyOpsPatrolPdfSeedRunner.ts --dry-run  # report only, no writes

import { getDailyOpsDb } from '../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { insertPatrolEntry, getLatestPatrolValue } from '../../cmms-daily-ops/dao/dailyOpsPatrolDao';
import { DAILY_OPS_PATROL_PDF_SEED_ROWS } from './dailyOpsPatrolPdfSeed';

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDailyOpsDb();

  console.log(`[DailyOpsPatrolSeed] rows to seed: ${DAILY_OPS_PATROL_PDF_SEED_ROWS.length} (report_date=2026-09-15)`);

  if (dryRun) {
    for (const row of DAILY_OPS_PATROL_PDF_SEED_ROWS) {
      const existing = getLatestPatrolValue(db, row.domain, row.equipmentTag);
      console.log(
        `[DailyOpsPatrolSeed][dry-run] ${row.domain}/${row.equipmentTag}: would upsert ${JSON.stringify(row.values)}; existing latest=${existing ? JSON.stringify(existing.values) : 'none'}`
      );
    }
    console.log('[DailyOpsPatrolSeed][dry-run] no writes performed.');
    return;
  }

  for (const row of DAILY_OPS_PATROL_PDF_SEED_ROWS) {
    insertPatrolEntry(
      db,
      row.domain,
      row.equipmentTag,
      row.reportDate,
      row.shiftTimeSlot,
      row.values,
      row.readingStatus,
      row.remarkText,
      row.recordedBy
    );
  }

  console.log(`[DailyOpsPatrolSeed][apply] upserted ${DAILY_OPS_PATROL_PDF_SEED_ROWS.length} rows`);
  for (const row of DAILY_OPS_PATROL_PDF_SEED_ROWS) {
    const stored = getLatestPatrolValue(db, row.domain, row.equipmentTag);
    console.log(`[DailyOpsPatrolSeed][apply] verify ${row.domain}/${row.equipmentTag}: ${JSON.stringify(stored?.values)}`);
  }
}

main();
