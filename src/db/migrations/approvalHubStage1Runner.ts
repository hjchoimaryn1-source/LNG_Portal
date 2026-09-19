// src/db/migrations/approvalHubStage1Runner.ts
//
// PURPOSE
//   Approval Hub Phase 1 — Stage 1a/1b additive schema migration runner.
//   Adds `approval_status` to work_orders and mro_purchase_requisitions.
//   Same convention as phase10Stage1ARunner.ts: SQLite (node:sqlite bundled)
//   has no `ADD COLUMN IF NOT EXISTS`, so each ALTER is guarded by a
//   PRAGMA table_info() check instead.
//
// SCOPE
//   Additive only. Never drops or rewrites work_orders / mro_purchase_requisitions
//   rows. Pre-existing rows are backfilled to 'SITE_APPROVED' (already in-flight
//   / legacy — not retroactively blocked) immediately after the column is added,
//   before any new row can be inserted (same synchronous db.exec() call chain,
//   guarded so this only ever runs once per DB). Safe to re-run (no-op on a
//   second run).
//
// CLI USAGE
//   npx tsx src/db/migrations/approvalHubStage1Runner.ts            # apply
//   npx tsx src/db/migrations/approvalHubStage1Runner.ts --dry-run  # report only, no writes

import { DatabaseSync } from 'node:sqlite';

const APPROVAL_STATUS_CHECK = `('PENDING_SITE_APPROVAL','SITE_APPROVED','REJECTED')`;

interface ApprovalColumnSpec {
  table: string;
  addColumnSql: string;
  backfillSql: string;
}

const APPROVAL_STATUS_COLUMNS: ApprovalColumnSpec[] = [
  {
    table: 'work_orders',
    addColumnSql: `ALTER TABLE work_orders ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'PENDING_SITE_APPROVAL' CHECK (approval_status IN ${APPROVAL_STATUS_CHECK})`,
    backfillSql: `UPDATE work_orders SET approval_status = 'SITE_APPROVED'`,
  },
  {
    table: 'mro_purchase_requisitions',
    addColumnSql: `ALTER TABLE mro_purchase_requisitions ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'PENDING_SITE_APPROVAL' CHECK (approval_status IN ${APPROVAL_STATUS_CHECK})`,
    backfillSql: `UPDATE mro_purchase_requisitions SET approval_status = 'SITE_APPROVED'`,
  },
];

function hasColumn(db: DatabaseSync, table: string, columnName: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => String((r as { name: string }).name) === columnName);
}

function planSummary(db: DatabaseSync): string[] {
  return APPROVAL_STATUS_COLUMNS.filter((c) => !hasColumn(db, c.table, 'approval_status')).map((c) => c.table);
}

function runDryRun(dbPath: string): void {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const missing = planSummary(db);
    console.log(`[ApprovalHubStage1][dry-run] db=${dbPath}`);
    console.log(
      `[ApprovalHubStage1][dry-run] approval_status to add: ${missing.length ? missing.join(', ') : '(none — already present)'}`
    );
    console.log('[ApprovalHubStage1][dry-run] no writes performed (opened read-only).');
  } finally {
    db.close();
  }
}

function runApply(dbPath: string): void {
  const db = new DatabaseSync(dbPath);
  try {
    const applied: string[] = [];
    for (const spec of APPROVAL_STATUS_COLUMNS) {
      if (!hasColumn(db, spec.table, 'approval_status')) {
        db.exec(spec.addColumnSql);
        db.exec(spec.backfillSql);
        applied.push(spec.table);
      }
    }
    const stillMissing = planSummary(db);
    console.log(`[ApprovalHubStage1][apply] db=${dbPath}`);
    console.log(`[ApprovalHubStage1][apply] approval_status added + backfilled: ${applied.length ? applied.join(', ') : '(none — already present)'}`);
    console.log(`[ApprovalHubStage1][apply] post-check — tables still missing column: ${stillMissing.length}`);
    if (stillMissing.length) {
      throw new Error('ApprovalHubStage1 migration incomplete — see post-check above.');
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
