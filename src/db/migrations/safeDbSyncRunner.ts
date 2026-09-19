// src/db/migrations/safeDbSyncRunner.ts
//
// PURPOSE
//   General-purpose "safe DB sync" helper for the situation a `git pull`
//   updates the tracked `nias_cmms.db` file: instead of trusting the raw
//   file overwrite (which cannot merge, only replace), this diffs a source
//   DB (e.g. the pre-pull working-tree copy, or `git show <hash>:<path>`
//   extracted to a temp file) against the live DB and applies row-level
//   INSERT OR IGNORE per table, keyed on that table's own PK/UNIQUE
//   constraints — same idempotency convention as
//   phase10Stage2DPmSchedulesRunner.ts's `pm_code` UNIQUE key.
//
// SCOPE / SAFETY
//   - NEVER replaces or copies the destination file. Only opens it and
//     runs parameterized INSERT OR IGNORE statements inside a transaction.
//   - Tables whose ONLY uniqueness is a single-column INTEGER PRIMARY KEY
//     (a rowid alias, e.g. `pm_id`, `signature_id`) and no other UNIQUE
//     index are SKIPPED by default and reported, not merged — such an id
//     is not a stable identity across two separate DB files, so blindly
//     copying rows keyed on it would either silently drop legitimate rows
//     (id collision with an unrelated row) or duplicate them. A table is
//     only synced if it has a composite PK, a non-INTEGER single-column
//     PK (e.g. TEXT PRIMARY KEY), or a declared UNIQUE index.
//   - Dry-run by default; writes only happen with --apply.
//
// CLI USAGE
//   npx tsx src/db/migrations/safeDbSyncRunner.ts <sourceDbPath>            # dry-run report
//   npx tsx src/db/migrations/safeDbSyncRunner.ts <sourceDbPath> --apply    # apply INSERT OR IGNORE
//   npx tsx src/db/migrations/safeDbSyncRunner.ts <sourceDbPath> --apply --tables=pm_schedules,work_orders

import { DatabaseSync } from 'node:sqlite';

interface TableInfoRow {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
}

interface IndexListRow {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface TableSyncPlan {
  table: string;
  hasNaturalKey: boolean;
  reason: string;
  destColumns: string[];
}

function listUserTables(db: DatabaseSync): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as Array<{ name: string }>
  ).map((r) => r.name);
}

function planTableSync(dest: DatabaseSync, table: string): TableSyncPlan {
  const cols = db_tableInfo(dest, table);
  const destColumns = cols.map((c) => c.name);
  const pkCols = cols.filter((c) => c.pk > 0);
  const isSingleIntegerRowidAliasPk =
    pkCols.length === 1 && pkCols[0].type.toUpperCase() === 'INTEGER';

  const indexes = (
    dest.prepare(`PRAGMA index_list("${table}")`).all() as unknown as IndexListRow[]
  ).filter((ix) => ix.unique === 1);

  const hasCompositePk = pkCols.length > 1;
  const hasNonIntegerSinglePk = pkCols.length === 1 && !isSingleIntegerRowidAliasPk;
  const hasUniqueIndex = indexes.length > 0;

  const hasNaturalKey = hasCompositePk || hasNonIntegerSinglePk || hasUniqueIndex;

  const reason = hasNaturalKey
    ? hasCompositePk
      ? 'composite PRIMARY KEY'
      : hasNonIntegerSinglePk
        ? `non-integer PRIMARY KEY (${pkCols[0].name})`
        : `UNIQUE index present (${indexes.map((i) => i.name).join(', ')})`
    : pkCols.length === 1
      ? `single-column INTEGER PRIMARY KEY (${pkCols[0].name}) is a rowid alias, no other UNIQUE constraint`
      : 'no PRIMARY KEY or UNIQUE constraint found';

  return { table, hasNaturalKey, reason, destColumns };
}

function db_tableInfo(db: DatabaseSync, table: string): TableInfoRow[] {
  return db.prepare(`PRAGMA table_info("${table}")`).all() as unknown as TableInfoRow[];
}

function syncTable(
  source: DatabaseSync,
  dest: DatabaseSync,
  plan: TableSyncPlan,
  apply: boolean
): { scanned: number; inserted: number } {
  const rows = source.prepare(`SELECT * FROM "${plan.table}"`).all() as Array<Record<string, unknown>>;
  if (rows.length === 0) return { scanned: 0, inserted: 0 };

  const destColSet = new Set(plan.destColumns);
  let inserted = 0;

  for (const row of rows) {
    const usableCols = Object.keys(row).filter((c) => destColSet.has(c));
    if (usableCols.length === 0) continue;

    if (!apply) continue;

    const placeholders = usableCols.map((c) => `@${c}`).join(', ');
    const colList = usableCols.map((c) => `"${c}"`).join(', ');
    const params: Record<string, unknown> = {};
    for (const c of usableCols) params[c] = row[c];

    const result = dest
      .prepare(`INSERT OR IGNORE INTO "${plan.table}" (${colList}) VALUES (${placeholders})`)
      .run(params);
    if (Number(result.changes) > 0) inserted += 1;
  }

  return { scanned: rows.length, inserted };
}

function main(): void {
  const args = process.argv.slice(2);
  const sourcePath = args.find((a) => !a.startsWith('--'));
  const apply = args.includes('--apply');
  const tablesArg = args.find((a) => a.startsWith('--tables='));
  const tableFilter = tablesArg ? new Set(tablesArg.slice('--tables='.length).split(',')) : undefined;

  if (!sourcePath) {
    console.error('Usage: safeDbSyncRunner.ts <sourceDbPath> [--apply] [--tables=a,b,c]');
    process.exit(1);
  }

  const destPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  const dest = new DatabaseSync(destPath);

  try {
    const sourceTables = new Set(listUserTables(source));
    const destTables = listUserTables(dest).filter((t) => sourceTables.has(t));
    const scoped = tableFilter ? destTables.filter((t) => tableFilter.has(t)) : destTables;

    console.log(`[safe-db-sync] source=${sourcePath} dest=${destPath} mode=${apply ? 'APPLY' : 'DRY-RUN'}`);

    if (apply) dest.exec('BEGIN');
    for (const table of scoped) {
      const plan = planTableSync(dest, table);
      if (!plan.hasNaturalKey) {
        console.log(`[safe-db-sync][SKIP] ${table} — no stable natural key (${plan.reason})`);
        continue;
      }
      const { scanned, inserted } = syncTable(source, dest, plan, apply);
      console.log(
        `[safe-db-sync][${apply ? 'APPLY' : 'DRY-RUN'}] ${table} — key: ${plan.reason} — ` +
          `source rows scanned: ${scanned}, ${apply ? 'newly inserted' : 'would-attempt-insert'}: ${apply ? inserted : scanned}`
      );
    }
    if (apply) dest.exec('COMMIT');
  } catch (err) {
    if (apply) dest.exec('ROLLBACK');
    throw err;
  } finally {
    source.close();
    dest.close();
  }
}

main();
