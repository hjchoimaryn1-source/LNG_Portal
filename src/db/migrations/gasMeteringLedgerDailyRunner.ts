// src/db/migrations/gasMeteringLedgerDailyRunner.ts
//
// PURPOSE
//   Phase 12 Stage 1 — creates gas_metering_ledger_daily (CREATE, new table)
//   and upserts three source documents into it (HJ-confirmed 2026-09-16):
//     GC_REPORT        <- public/data/NIAS - G.C Report .csv
//     GC_COMPOSITION   <- public/data/NIAS - GC composion.csv
//     DAILY_REPORT_PDF <- gasMeteringLedgerDailyPdfSeed.ts (FORM-NP-08-33-N ground truth)
//   Same runner-script convention as phase10Stage1ARunner.ts (idempotent,
//   --dry-run support, CMMS_DB_PATH override). Upsert key: (report_date,
//   meter_source) — matches the schema's UNIQUE index, safe to re-run.
//
// CLI USAGE
//   npx tsx src/db/migrations/gasMeteringLedgerDailyRunner.ts            # apply
//   npx tsx src/db/migrations/gasMeteringLedgerDailyRunner.ts --dry-run  # report only, no writes

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { parseCsvRows, mapGcReportRow, mapGcCompositionRow } from './gasMeteringLedgerDailyCsvParser';
import { DAILY_REPORT_PDF_SEED_ROW } from './gasMeteringLedgerDailyPdfSeed';
import { GAS_METERING_LEDGER_COLUMNS, type GasMeteringLedgerRow } from './gasMeteringLedgerDailyRunner.types';

const SCHEMA_FILE = 'phase12_stage_gas_metering_ledger_daily_schema.sql';
const GC_REPORT_CSV = 'NIAS - G.C Report .csv';
const GC_COMPOSITION_CSV = 'NIAS - GC composion.csv';

function loadGcReportRows(publicDataDir: string): GasMeteringLedgerRow[] {
  const text = readFileSync(join(publicDataDir, GC_REPORT_CSV), 'utf8');
  const rows = parseCsvRows(text);
  const out: GasMeteringLedgerRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const mapped = mapGcReportRow(rows[i]);
    if (!mapped) continue;
    const { reportDate, ...rest } = mapped;
    out.push({ reportDate, meterSource: 'GC_REPORT', sourceDocument: GC_REPORT_CSV, ...rest });
  }
  return out;
}

function loadGcCompositionRows(publicDataDir: string): GasMeteringLedgerRow[] {
  const text = readFileSync(join(publicDataDir, GC_COMPOSITION_CSV), 'utf8');
  const rows = parseCsvRows(text);
  const out: GasMeteringLedgerRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const mapped = mapGcCompositionRow(rows[i]);
    if (!mapped) continue;
    const { reportDate, ...rest } = mapped;
    out.push({ reportDate, meterSource: 'GC_COMPOSITION', sourceDocument: GC_COMPOSITION_CSV, ...rest });
  }
  return out;
}

function upsertRow(db: DatabaseSync, row: GasMeteringLedgerRow): void {
  const present = GAS_METERING_LEDGER_COLUMNS.filter(([field]) => row[field] !== undefined);
  const columnNames = present.map(([, col]) => col);
  const placeholders = columnNames.map((c) => `@${c}`);
  const updateSet = columnNames
    .filter((c) => c !== 'report_date' && c !== 'meter_source')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');

  const sql = `
    INSERT INTO gas_metering_ledger_daily (${columnNames.join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT(report_date, meter_source) DO UPDATE SET ${updateSet}
  `;
  const params: Record<string, unknown> = {};
  for (const [field, col] of present) {
    const v = row[field];
    params[col] = v === undefined ? null : v;
  }
  db.prepare(sql).run(params);
}

function countByCounter(db: DatabaseSync): Record<string, number> {
  const rows = db
    .prepare(`SELECT meter_source, COUNT(*) as n FROM gas_metering_ledger_daily GROUP BY meter_source`)
    .all() as Array<{ meter_source: string; n: number }>;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.meter_source] = r.n;
  return out;
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const here = dirname(fileURLToPath(import.meta.url));
  const publicDataDir = join(here, '..', '..', '..', 'public', 'data');
  const schemaSql = readFileSync(join(here, SCHEMA_FILE), 'utf8');

  const gcReportRows = loadGcReportRows(publicDataDir);
  const gcCompositionRows = loadGcCompositionRows(publicDataDir);
  const allRows = [...gcReportRows, ...gcCompositionRows, DAILY_REPORT_PDF_SEED_ROW];

  console.log(`[GasMeteringLedger] parsed GC_REPORT rows: ${gcReportRows.length}`);
  console.log(`[GasMeteringLedger] parsed GC_COMPOSITION rows: ${gcCompositionRows.length}`);
  console.log(`[GasMeteringLedger] DAILY_REPORT_PDF ground-truth rows: 1 (report_date=${DAILY_REPORT_PDF_SEED_ROW.reportDate})`);

  if (dryRun) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='gas_metering_ledger_daily'`)
        .get();
      console.log(`[GasMeteringLedger][dry-run] db=${dbPath}`);
      console.log(`[GasMeteringLedger][dry-run] table exists: ${Boolean(tableExists)}`);
      console.log(`[GasMeteringLedger][dry-run] would upsert ${allRows.length} rows total`);
      console.log('[GasMeteringLedger][dry-run] no writes performed (opened read-only).');
    } finally {
      db.close();
    }
    return;
  }

  const db = new DatabaseSync(dbPath);
  try {
    db.exec(schemaSql);
    for (const row of allRows) upsertRow(db, row);

    const counts = countByCounter(db);
    console.log(`[GasMeteringLedger][apply] db=${dbPath}`);
    console.log(`[GasMeteringLedger][apply] upserted ${allRows.length} rows`);
    console.log(`[GasMeteringLedger][apply] post-check row counts by source: ${JSON.stringify(counts)}`);

    const pdfRow = db
      .prepare(`SELECT daily_mmbtu_a, daily_mmbtu_b, daily_mmbtu_station, mol_methane_station FROM gas_metering_ledger_daily WHERE report_date = @d AND meter_source = 'DAILY_REPORT_PDF'`)
      .get({ d: DAILY_REPORT_PDF_SEED_ROW.reportDate });
    console.log(`[GasMeteringLedger][apply] DAILY_REPORT_PDF verification row: ${JSON.stringify(pdfRow)}`);
  } finally {
    db.close();
  }
}

main();
