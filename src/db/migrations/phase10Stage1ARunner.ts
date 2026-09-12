// src/db/migrations/phase10Stage1ARunner.ts
//
// PURPOSE
//   Phase 10 Stage 1A additive schema migration runner. Applies
//   phase10_stage1a_mro_schema.sql (idempotent CREATE TABLE/VIEW/INDEX
//   statements) and then adds the four new work_orders columns that SQLite
//   cannot express as idempotent SQL (no `ADD COLUMN IF NOT EXISTS` — verified
//   against the node:sqlite-bundled SQLite 3.53.1: "near \"EXISTS\": syntax
//   error"). This file guards each ALTER TABLE with a PRAGMA table_info()
//   check instead.
//
// SCOPE
//   Additive only. Never drops or rewrites mro_parts / mro_stock_transactions
//   / mro_purchase_requisitions / work_orders rows. Safe to re-run (every
//   statement is a no-op on a second run).
//
// CLI USAGE
//   npx tsx src/db/migrations/phase10Stage1ARunner.ts            # apply
//   npx tsx src/db/migrations/phase10Stage1ARunner.ts --dry-run  # report only, no writes

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA_FILE = 'phase10_stage1a_mro_schema.sql';

const NEW_TABLES = [
  'impa_catalog',
  'asset_parts_impa',
  'inventory_items',
  'inventory_ledgers',
  'external_overhauls',
  'pm_schedules',
] as const;

const NEW_VIEWS = ['v_asset_parts_stock'] as const;

interface WorkOrderColumnSpec {
  name: string;
  ddl: string;
}

/** wo_type/priority/is_ptw_required/permit_id — CMMS_Architecture.md §4.4 이식. */
const WORK_ORDER_NEW_COLUMNS: WorkOrderColumnSpec[] = [
  { name: 'wo_type', ddl: `ALTER TABLE work_orders ADD COLUMN wo_type TEXT CHECK (wo_type IN ('PM','CM','CBM'))` },
  {
    name: 'priority',
    ddl: `ALTER TABLE work_orders ADD COLUMN priority TEXT CHECK (priority IN ('EMERGENCY','HIGH','MEDIUM','LOW'))`,
  },
  {
    name: 'is_ptw_required',
    ddl: `ALTER TABLE work_orders ADD COLUMN is_ptw_required INTEGER NOT NULL DEFAULT 0 CHECK (is_ptw_required IN (0,1))`,
  },
  { name: 'permit_id', ddl: `ALTER TABLE work_orders ADD COLUMN permit_id INTEGER` },
];

function existingTableOrViewNames(db: DatabaseSync): Set<string> {
  const rows = db.prepare(`SELECT name FROM sqlite_master WHERE type IN ('table','view')`).all();
  return new Set(rows.map((r) => String(r.name)));
}

function existingWorkOrderColumns(db: DatabaseSync): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(work_orders)`).all();
  return new Set(rows.map((r) => String(r.name)));
}

function planSummary(db: DatabaseSync): { tablesMissing: string[]; viewsMissing: string[]; columnsMissing: string[] } {
  const existing = existingTableOrViewNames(db);
  const columns = existingWorkOrderColumns(db);
  return {
    tablesMissing: NEW_TABLES.filter((t) => !existing.has(t)),
    viewsMissing: NEW_VIEWS.filter((v) => !existing.has(v)),
    columnsMissing: WORK_ORDER_NEW_COLUMNS.filter((c) => !columns.has(c.name)).map((c) => c.name),
  };
}

function runDryRun(dbPath: string): void {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const plan = planSummary(db);
    console.log(`[Stage1A][dry-run] db=${dbPath}`);
    console.log(`[Stage1A][dry-run] tables to create : ${plan.tablesMissing.length ? plan.tablesMissing.join(', ') : '(none — already present)'}`);
    console.log(`[Stage1A][dry-run] views  to create : ${plan.viewsMissing.length ? plan.viewsMissing.join(', ') : '(none — already present)'}`);
    console.log(`[Stage1A][dry-run] work_orders columns to add: ${plan.columnsMissing.length ? plan.columnsMissing.join(', ') : '(none — already present)'}`);
    console.log('[Stage1A][dry-run] no writes performed (opened read-only).');
  } finally {
    db.close();
  }
}

function runApply(dbPath: string, schemaSql: string): void {
  const db = new DatabaseSync(dbPath);
  try {
    const before = planSummary(db);

    db.exec(schemaSql);

    const columnsBefore = existingWorkOrderColumns(db);
    const applied: string[] = [];
    for (const col of WORK_ORDER_NEW_COLUMNS) {
      if (!columnsBefore.has(col.name)) {
        db.exec(col.ddl);
        applied.push(col.name);
      }
    }

    const after = planSummary(db);
    console.log(`[Stage1A][apply] db=${dbPath}`);
    console.log(`[Stage1A][apply] tables created : ${before.tablesMissing.length ? before.tablesMissing.join(', ') : '(none — already present)'}`);
    console.log(`[Stage1A][apply] views  created : ${before.viewsMissing.length ? before.viewsMissing.join(', ') : '(none — already present)'}`);
    console.log(`[Stage1A][apply] work_orders columns added: ${applied.length ? applied.join(', ') : '(none — already present)'}`);
    console.log(
      `[Stage1A][apply] post-check — tables still missing: ${after.tablesMissing.length}, views still missing: ${after.viewsMissing.length}, columns still missing: ${after.columnsMissing.length}`
    );
    if (after.tablesMissing.length || after.viewsMissing.length || after.columnsMissing.length) {
      throw new Error('Stage1A migration incomplete — see post-check counts above.');
    }
  } finally {
    db.close();
  }
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const here = dirname(fileURLToPath(import.meta.url));
  const schemaSql = readFileSync(join(here, SCHEMA_FILE), 'utf8');

  if (dryRun) {
    runDryRun(dbPath);
  } else {
    runApply(dbPath, schemaSql);
  }
}

main();
