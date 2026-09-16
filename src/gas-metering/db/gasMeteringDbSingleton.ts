// src/gas-metering/db/gasMeteringDbSingleton.ts
//
// PURPOSE
//   Reuses the shared SQLite connection from getCmmsDb() (cmmsDbSingleton.ts
//   is imported, never modified — same hard-boundary pattern as
//   dailyOpsDbSingleton.ts / truckingDbSingleton.ts) and ensures
//   gas_metering_ledger_daily exists before any gas-metering API route reads
//   it. Idempotent — safe to call on every request.

import type { DatabaseSync } from 'node:sqlite';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureGasMeteringLedgerSchema } from './gasMeteringLedgerSchema';

let schemaEnsured = false;

export function getGasMeteringDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!schemaEnsured) {
    const raw = (db as SqlExecutor & { raw: DatabaseSync }).raw;
    ensureGasMeteringLedgerSchema(raw);
    schemaEnsured = true;
  }
  return db;
}
