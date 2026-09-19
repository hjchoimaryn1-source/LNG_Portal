// src/db/migrations/monthlyReportSeedRunner.ts
//
// PURPOSE
//   Monthly Report (PLN EPI) Stage 2 — manual CLI seed runner, same
//   convention as gasMeteringLedgerDailyRunner.ts / dailyOpsPatrolPdfSeedRunner.ts
//   (idempotent upsert, --dry-run, CMMS_DB_PATH override). NOT wired into
//   runBootstrapPipeline.ts (HJ-confirmed 2026-09-18 — that automatic-on-init
//   mechanism does not exist for this domain family; manual runner is the
//   established precedent).
//
//   Sources (July 2026 only — HJ-scoped, not a full historical backfill):
//     iso_tank_daily_readings       <- public/data/NIAS - ISO Tank Master DB.csv
//     iso_tank_consumption_monthly  <- public/data/NIAS - ISO Tank Consumption.csv
//     gas_composition_monthly_snapshot <- monthlyReportGasAnalysisP8Seed.ts
//       (ground-truth constant, "Gas Analysis P8" sheet — no CSV source)
//   ISOT-064 discrepancy (present in Master DB, absent from Consumption)
//   is intentionally NOT reconciled — each table gets its own source as-is.
//
// CLI USAGE
//   npx tsx src/db/migrations/monthlyReportSeedRunner.ts            # apply
//   npx tsx src/db/migrations/monthlyReportSeedRunner.ts --dry-run  # report only, no writes

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createNodeSqliteExecutor } from '../../adapters/db/nodeSqliteExecutor';
import { ensureMonthlyReportSchema } from '../../cmms-monthly-report/db/monthlyReportSchema';
import { upsertIsoTankDailyReading, type IsoTankDailyReadingRow } from '../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import { upsertIsoTankConsumption, type IsoTankConsumptionRow } from '../../cmms-monthly-report/dao/isoTankConsumptionDao';
import { upsertGasCompositionSnapshot } from '../../cmms-monthly-report/dao/gasCompositionSnapshotDao';
import { parseCsvRows, mapIsoTankMasterDbRow, mapIsoTankConsumptionRow } from './monthlyReportCsvParser';
import { GAS_ANALYSIS_P8_SEED_ROW } from './monthlyReportGasAnalysisP8Seed';

const ISO_TANK_MASTER_DB_CSV = 'NIAS - ISO Tank Master DB.csv';
const ISO_TANK_CONSUMPTION_CSV = 'NIAS - ISO Tank Consumption.csv';
const SEED_MONTH_PREFIX = '2026-07';
const SEED_YEAR = 2026;

function loadIsoTankDailyReadings(publicDataDir: string): IsoTankDailyReadingRow[] {
  const text = readFileSync(join(publicDataDir, ISO_TANK_MASTER_DB_CSV), 'utf8');
  const rows = parseCsvRows(text);
  const out: IsoTankDailyReadingRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const mapped = mapIsoTankMasterDbRow(rows[i]);
    if (mapped && mapped.reportDate.startsWith(SEED_MONTH_PREFIX)) out.push(mapped);
  }
  return out;
}

function loadIsoTankConsumption(publicDataDir: string): IsoTankConsumptionRow[] {
  const text = readFileSync(join(publicDataDir, ISO_TANK_CONSUMPTION_CSV), 'utf8');
  const rows = parseCsvRows(text);
  const out: IsoTankConsumptionRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const mapped = mapIsoTankConsumptionRow(rows[i], SEED_YEAR);
    if (mapped) out.push(mapped);
  }
  return out;
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const here = dirname(fileURLToPath(import.meta.url));
  const publicDataDir = join(here, '..', '..', '..', 'public', 'data');

  const dailyReadings = loadIsoTankDailyReadings(publicDataDir);
  const consumptionRows = loadIsoTankConsumption(publicDataDir);

  console.log(`[MonthlyReportSeed] parsed iso_tank_daily_readings rows (${SEED_MONTH_PREFIX}): ${dailyReadings.length}`);
  console.log(`[MonthlyReportSeed] parsed iso_tank_consumption_monthly rows: ${consumptionRows.length}`);
  console.log(`[MonthlyReportSeed] gas_composition_monthly_snapshot ground-truth row: report_month=${GAS_ANALYSIS_P8_SEED_ROW.reportMonth}`);

  const uniqueTanksDaily = new Set(dailyReadings.map((r) => r.isoTankNo));
  const uniqueTanksConsumption = new Set(consumptionRows.map((r) => r.isoTankNo));
  console.log(`[MonthlyReportSeed] iso_tank_daily_readings unique tanks: ${[...uniqueTanksDaily].sort().join(', ')}`);
  console.log(`[MonthlyReportSeed] iso_tank_consumption_monthly unique tanks: ${[...uniqueTanksConsumption].sort().join(', ')}`);

  if (dryRun) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const tables = ['iso_tank_daily_readings', 'iso_tank_consumption_monthly', 'gas_composition_monthly_snapshot'];
      console.log(`[MonthlyReportSeed][dry-run] db=${dbPath}`);
      for (const t of tables) {
        const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}'`).get();
        console.log(`[MonthlyReportSeed][dry-run] table ${t} exists: ${Boolean(exists)}`);
      }
      console.log(`[MonthlyReportSeed][dry-run] would upsert ${dailyReadings.length + consumptionRows.length + 1} rows total`);
      console.log('[MonthlyReportSeed][dry-run] no writes performed (opened read-only).');
    } finally {
      db.close();
    }
    return;
  }

  const executor = createNodeSqliteExecutor(dbPath);
  try {
    ensureMonthlyReportSchema(executor.raw);

    for (const row of dailyReadings) upsertIsoTankDailyReading(executor, row);
    for (const row of consumptionRows) upsertIsoTankConsumption(executor, row);
    upsertGasCompositionSnapshot(executor, GAS_ANALYSIS_P8_SEED_ROW);

    const counts = {
      iso_tank_daily_readings: executor.get<{ n: number }>(
        `SELECT COUNT(*) as n FROM iso_tank_daily_readings WHERE report_date LIKE @p`,
        { p: `${SEED_MONTH_PREFIX}%` }
      )?.n,
      iso_tank_consumption_monthly: executor.get<{ n: number }>(
        `SELECT COUNT(*) as n FROM iso_tank_consumption_monthly`
      )?.n,
      gas_composition_monthly_snapshot: executor.get<{ n: number }>(
        `SELECT COUNT(*) as n FROM gas_composition_monthly_snapshot`
      )?.n,
    };
    console.log(`[MonthlyReportSeed][apply] db=${dbPath}`);
    console.log(`[MonthlyReportSeed][apply] post-check row counts: ${JSON.stringify(counts)}`);
  } finally {
    executor.close();
  }
}

main();
