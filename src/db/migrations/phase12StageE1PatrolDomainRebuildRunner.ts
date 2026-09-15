// src/db/migrations/phase12StageE1PatrolDomainRebuildRunner.ts
//
// PURPOSE
//   Phase 12 Stage E-1. daily_ops_patrol_entries.domain used to carry a
//   CHECK (domain IN (...)) constraint enumerating every PatrolDomain value.
//   Adding 'ng_buffer_tank' means widening that enum, and SQLite has no
//   ALTER TABLE for CHECK constraints — same limitation as
//   phase10Stage2CRunner.ts's pm_schedules rebuild. HJ decision (Stage E
//   pre-flight): rather than repeat a 12-step rebuild every time a domain is
//   added, drop the CHECK constraint entirely — PatrolDomain (TS union) +
//   dailyOpsPatrolDao.ts's assertKnownColumns() already enforce validity at
//   the app layer, so the DB-level enum is redundant going forward.
//
//   This runner does the one-time 12-step rebuild (create table with the
//   CHECK-free shape, copy rows via SELECT *, drop old, rename, recreate
//   indexes) and then delegates to ensureDailyOpsPatrolSchema() to add the
//   Stage E-1 pressure_gauge_barg/pressure_transmitter_barg columns — no
//   duplicated column-add logic.
//
// SCOPE
//   Additive/structural only for daily_ops_patrol_entries. Touches no other
//   table. Guarded by inspecting sqlite_master.sql first — if the CHECK is
//   already gone, the rebuild is skipped (idempotent, safe to re-run).
//
// CLI USAGE
//   npx tsx src/db/migrations/phase12StageE1PatrolDomainRebuildRunner.ts            # apply
//   npx tsx src/db/migrations/phase12StageE1PatrolDomainRebuildRunner.ts --dry-run  # report only, no writes

import { DatabaseSync } from 'node:sqlite';
import {
  DAILY_OPS_PATROL_ENTRIES_DDL,
  ensureDailyOpsPatrolSchema,
} from '../../cmms-daily-ops/db/dailyOpsPatrolSchema';

const TABLE = 'daily_ops_patrol_entries';
const TABLE_NEW = `${TABLE}_new`;

function patrolEntriesDdl(db: DatabaseSync): string | null {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${TABLE}'`).get() as
    | { sql: string }
    | undefined;
  return row ? row.sql : null;
}

function needsRebuild(db: DatabaseSync): boolean {
  const ddl = patrolEntriesDdl(db);
  if (!ddl) throw new Error(`${TABLE} table does not exist — run Stage A/B migration first.`);
  return ddl.includes('CHECK (domain IN');
}

/** Standard SQLite table-rebuild to drop domain's CHECK(IN (...)) constraint. */
function rebuildPatrolEntries(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('BEGIN');
  try {
    // New table shares the exact (CHECK-free) column shape/order the current
    // DAILY_OPS_PATROL_ENTRIES_DDL defines — so `SELECT *` below is safe.
    const newTableDdl = DAILY_OPS_PATROL_ENTRIES_DDL.split(TABLE).join(TABLE_NEW);
    db.exec(newTableDdl);
    db.exec(`INSERT INTO ${TABLE_NEW} SELECT * FROM ${TABLE}`);
    db.exec(`DROP TABLE ${TABLE}`);
    db.exec(`ALTER TABLE ${TABLE_NEW} RENAME TO ${TABLE}`);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
}

function runDryRun(dbPath: string): void {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rebuild = needsRebuild(db);
    console.log(`[Stage E-1][dry-run] db=${dbPath}`);
    console.log(`[Stage E-1][dry-run] ${TABLE} rebuild needed (drop domain CHECK): ${rebuild}`);
    console.log('[Stage E-1][dry-run] no writes performed (opened read-only).');
  } finally {
    db.close();
  }
}

function runApply(dbPath: string): void {
  const db = new DatabaseSync(dbPath);
  try {
    const rebuildNeeded = needsRebuild(db);
    if (rebuildNeeded) {
      rebuildPatrolEntries(db);
    }
    ensureDailyOpsPatrolSchema(db);

    console.log(`[Stage E-1][apply] db=${dbPath}`);
    console.log(`[Stage E-1][apply] ${TABLE} rebuilt (domain CHECK dropped): ${rebuildNeeded}`);
    console.log('[Stage E-1][apply] pressure_gauge_barg / pressure_transmitter_barg ensured.');

    if (needsRebuild(db)) {
      throw new Error('Stage E-1 migration incomplete — domain CHECK still present after rebuild.');
    }
  } finally {
    db.close();
  }
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';

  if (dryRun) {
    runDryRun(dbPath);
  } else {
    runApply(dbPath);
  }
}

main();
