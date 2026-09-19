// src/cmms-monthly-report/db/monthlyReportDbSingleton.ts
//
// PURPOSE
//   Reuses the shared SQLite connection from getCmmsDb() (cmmsDbSingleton.ts
//   is imported, never modified) and ensures the 5 Monthly Report tables
//   exist before any monthly-report API route reads/writes them. Idempotent
//   — safe to call on every request. Same pattern as gasMeteringDbSingleton.ts.

import type { DatabaseSync } from 'node:sqlite';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureMonthlyReportSchema } from './monthlyReportSchema';

let schemaEnsured = false;

export function getMonthlyReportDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!schemaEnsured) {
    const raw = (db as SqlExecutor & { raw: DatabaseSync }).raw;
    ensureMonthlyReportSchema(raw);
    schemaEnsured = true;
  }
  return db;
}
