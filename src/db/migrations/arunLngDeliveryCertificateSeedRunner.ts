// src/db/migrations/arunLngDeliveryCertificateSeedRunner.ts
//
// PURPOSE
//   Manual CLI seed runner for arun_lng_delivery_certificate, same
//   convention as monthlyReportSeedRunner.ts (idempotent upsert,
//   --dry-run, CMMS_DB_PATH override). Source:
//   public/data/NIAS - Cert. of LNG Delivered Measuremen.csv (11 rows,
//   shipment N-1, cp949-encoded — see
//   arunLngDeliveryCertificateCsvParser.ts for why plain utf8 readFileSync
//   would mangle it).
//
// CLI USAGE
//   npx tsx src/db/migrations/arunLngDeliveryCertificateSeedRunner.ts            # apply
//   npx tsx src/db/migrations/arunLngDeliveryCertificateSeedRunner.ts --dry-run  # report only

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createNodeSqliteExecutor } from '../../adapters/db/nodeSqliteExecutor';
import { ensureMonthlyReportSchema } from '../../cmms-monthly-report/db/monthlyReportSchema';
import { upsertArunLngDeliveryCertificate, type ArunLngDeliveryCertificateRow } from '../../cmms-monthly-report/dao/arunLngDeliveryCertificateDao';
import { parseCsvRows, mapArunLngDeliveryCertificateRow } from './arunLngDeliveryCertificateCsvParser';

const CERTIFICATE_CSV = 'NIAS - Cert. of LNG Delivered Measuremen.csv';

function loadCertificateRows(publicDataDir: string): ArunLngDeliveryCertificateRow[] {
  const buffer = readFileSync(join(publicDataDir, CERTIFICATE_CSV));
  const text = new TextDecoder('euc-kr').decode(buffer);
  const rows = parseCsvRows(text);
  const out: ArunLngDeliveryCertificateRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const mapped = mapArunLngDeliveryCertificateRow(rows[i]);
    if (mapped) out.push(mapped);
  }
  return out;
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const here = dirname(fileURLToPath(import.meta.url));
  const publicDataDir = join(here, '..', '..', '..', 'public', 'data');

  const certRows = loadCertificateRows(publicDataDir);
  console.log(`[ArunCertSeed] parsed arun_lng_delivery_certificate rows: ${certRows.length}`);
  const shipments = new Set(certRows.map((r) => r.shipment));
  console.log(`[ArunCertSeed] shipments: ${[...shipments].join(', ')}`);

  if (dryRun) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='arun_lng_delivery_certificate'`).get();
      console.log(`[ArunCertSeed][dry-run] db=${dbPath}`);
      console.log(`[ArunCertSeed][dry-run] table arun_lng_delivery_certificate exists: ${Boolean(exists)}`);
      console.log(`[ArunCertSeed][dry-run] would upsert ${certRows.length} rows`);
      console.log('[ArunCertSeed][dry-run] no writes performed (opened read-only).');
    } finally {
      db.close();
    }
    return;
  }

  const executor = createNodeSqliteExecutor(dbPath);
  try {
    ensureMonthlyReportSchema(executor.raw);
    for (const row of certRows) upsertArunLngDeliveryCertificate(executor, row);

    const count = executor.get<{ n: number }>(`SELECT COUNT(*) as n FROM arun_lng_delivery_certificate`)?.n;
    const totalKg = executor.get<{ total: number }>(`SELECT SUM(loaded_lng_weight_kg) as total FROM arun_lng_delivery_certificate`)?.total;
    console.log(`[ArunCertSeed][apply] db=${dbPath}`);
    console.log(`[ArunCertSeed][apply] post-check row count: ${count}, SUM(loaded_lng_weight_kg): ${totalKg}`);
  } finally {
    executor.close();
  }
}

main();
