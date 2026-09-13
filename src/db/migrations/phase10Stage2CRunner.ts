// src/db/migrations/phase10Stage2CRunner.ts
//
// PURPOSE
//   Phase 10 Stage 2C. Two additive changes, both re-run safe:
//     1) pm_schedules.interval_type CHECK gains 'VALIDITY_EXPIRY' (existing
//        'RUNNING_HOURS'/'CALENDAR' values untouched) + nullable expiry_date
//        column. SQLite has no `ALTER TABLE ... ALTER COLUMN` / no way to
//        change a CHECK constraint on an existing column, so this requires
//        the standard 12-step SQLite table-rebuild procedure (create new
//        table with the wider CHECK, copy rows, drop old, rename). Guarded by
//        inspecting sqlite_master.sql first — if 'VALIDITY_EXPIRY' is already
//        present, the rebuild is skipped entirely (idempotent).
//     2) 3 system-level safety asset nodes (phase10_stage2c_system_safety_assets.sql,
//        plain idempotent INSERT OR IGNORE — no rebuild needed for this part).
//
// SCOPE
//   Additive only. Never touches mro_parts / mro_stock_transactions /
//   mro_purchase_requisitions. pm_schedules currently has 0 rows in the dev
//   DB (verified before writing this file), but the rebuild copies existing
//   rows generically so it stays correct if that changes.
//
// CLI USAGE
//   npx tsx src/db/migrations/phase10Stage2CRunner.ts            # apply
//   npx tsx src/db/migrations/phase10Stage2CRunner.ts --dry-run  # report only, no writes

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const ASSETS_SQL_FILE = 'phase10_stage2c_system_safety_assets.sql';
const SYSTEM_ASSET_TAGS = ['NIAS-90-SYS-ESD', 'NIAS-90-SYS-FG', 'NIAS-90-SYS-PSV'] as const;

function pmSchedulesDdl(db: DatabaseSync): string | null {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='pm_schedules'`).get() as
    | { sql: string }
    | undefined;
  return row ? row.sql : null;
}

function needsPmSchedulesRebuild(db: DatabaseSync): boolean {
  const ddl = pmSchedulesDdl(db);
  if (!ddl) throw new Error('pm_schedules table does not exist — run Stage1A migration first.');
  return !ddl.includes('VALIDITY_EXPIRY');
}

function existingSystemAssetTags(db: DatabaseSync): Set<string> {
  const rows = db.prepare(`SELECT equipment_tag FROM assets WHERE equipment_tag LIKE 'NIAS-90-SYS-%'`).all();
  return new Set(rows.map((r) => String((r as { equipment_tag: string }).equipment_tag)));
}

/** Standard SQLite table-rebuild to widen pm_schedules.interval_type's CHECK and add expiry_date. */
function rebuildPmSchedules(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('BEGIN');
  try {
    db.exec(`
      CREATE TABLE pm_schedules_new (
          pm_id               INTEGER PRIMARY KEY AUTOINCREMENT,
          pm_code               TEXT NOT NULL UNIQUE,
          equipment_tag           TEXT NOT NULL,
          title                     TEXT NOT NULL,
          interval_type               TEXT NOT NULL CHECK (interval_type IN ('RUNNING_HOURS','CALENDAR','VALIDITY_EXPIRY')),
          interval_value                 INTEGER NOT NULL,
          expiry_date                       TEXT,
          last_performed_hours                REAL DEFAULT 0.00,
          last_performed_date                    TEXT,
          next_due_date                             TEXT,
          is_active                                    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
          auto_generate_wo                                INTEGER NOT NULL DEFAULT 1 CHECK (auto_generate_wo IN (0,1)),
          created_at                                         TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
          CONSTRAINT fk_pm_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
      )
    `);
    db.exec(`
      INSERT INTO pm_schedules_new (
        pm_id, pm_code, equipment_tag, title, interval_type, interval_value,
        last_performed_hours, last_performed_date, next_due_date, is_active, auto_generate_wo, created_at
      )
      SELECT
        pm_id, pm_code, equipment_tag, title, interval_type, interval_value,
        last_performed_hours, last_performed_date, next_due_date, is_active, auto_generate_wo, created_at
      FROM pm_schedules
    `);
    db.exec('DROP TABLE pm_schedules');
    db.exec('ALTER TABLE pm_schedules_new RENAME TO pm_schedules');
    db.exec('CREATE INDEX IF NOT EXISTS idx_pm_next_due ON pm_schedules(next_due_date) WHERE is_active = 1');
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
    const rebuild = needsPmSchedulesRebuild(db);
    const existingTags = existingSystemAssetTags(db);
    const assetsMissing = SYSTEM_ASSET_TAGS.filter((t) => !existingTags.has(t));
    console.log(`[Stage2C][dry-run] db=${dbPath}`);
    console.log(`[Stage2C][dry-run] pm_schedules rebuild needed (add VALIDITY_EXPIRY + expiry_date): ${rebuild}`);
    console.log(`[Stage2C][dry-run] system safety assets to insert: ${assetsMissing.length ? assetsMissing.join(', ') : '(none — already present)'}`);
    console.log('[Stage2C][dry-run] no writes performed (opened read-only).');
  } finally {
    db.close();
  }
}

function runApply(dbPath: string, assetsSql: string): void {
  const db = new DatabaseSync(dbPath);
  try {
    const rebuildNeeded = needsPmSchedulesRebuild(db);
    if (rebuildNeeded) {
      rebuildPmSchedules(db);
    }

    const tagsBefore = existingSystemAssetTags(db);
    db.exec(assetsSql);
    const tagsAfter = existingSystemAssetTags(db);
    const inserted = SYSTEM_ASSET_TAGS.filter((t) => !tagsBefore.has(t) && tagsAfter.has(t));

    console.log(`[Stage2C][apply] db=${dbPath}`);
    console.log(`[Stage2C][apply] pm_schedules rebuilt: ${rebuildNeeded}`);
    console.log(`[Stage2C][apply] system safety assets inserted: ${inserted.length ? inserted.join(', ') : '(none — already present)'}`);

    const stillMissingAssets = SYSTEM_ASSET_TAGS.filter((t) => !tagsAfter.has(t));
    const stillNeedsRebuild = needsPmSchedulesRebuild(db);
    if (stillMissingAssets.length || stillNeedsRebuild) {
      throw new Error('Stage2C migration incomplete — see post-check above.');
    }
  } finally {
    db.close();
  }
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const here = dirname(fileURLToPath(import.meta.url));
  const assetsSql = readFileSync(join(here, ASSETS_SQL_FILE), 'utf8');

  if (dryRun) {
    runDryRun(dbPath);
  } else {
    runApply(dbPath, assetsSql);
  }
}

main();
