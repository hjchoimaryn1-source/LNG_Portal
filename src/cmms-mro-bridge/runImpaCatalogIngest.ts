// src/cmms-mro-bridge/runImpaCatalogIngest.ts
//
// PURPOSE
//   Track 1 (MRO/IMPA CLI material management, HJ-authorized session
//   2026-09-16) CLI entry point. Reads IMPA_Store_Code.xlsx, filters to the
//   docs/reference/impa-scope-whitelist.md IN-SCOPE sheets, dedups by
//   impa_code (longest description wins), and inserts into impa_catalog.
//   Writes docs/mro-impa-catalog-ingest-report.md with the dedup log and
//   summary counts for human review.
//
// SCOPE
//   impa_catalog only — no stock quantities, no asset_parts_impa mapping
//   (source file has no equipment_tag data; see impaCatalogIngestDb.ts).
//   Idempotent: re-running skips impa_codes already present.
//
// CLI USAGE
//   npx tsx src/cmms-mro-bridge/runImpaCatalogIngest.ts

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { buildImpaCatalogRows, IMPA_IN_SCOPE_SHEETS, type RawImpaSheetRow } from './impaCatalogIngestBuilder';
import { countExistingImpaCatalogRows, insertImpaCatalogRows } from './impaCatalogIngestDb';

const SOURCE_FILE = 'IMPA_Store_Code.xlsx';

function readAllRows(workbookPath: string): RawImpaSheetRow[] {
  const wb = XLSX.readFile(workbookPath);
  const rows: RawImpaSheetRow[] = [];

  for (const sheetName of wb.SheetNames) {
    if (sheetName === '00_Category_Summary') continue;
    const ws = wb.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: '' });

    for (let i = 1; i < sheetRows.length; i++) {
      const r = sheetRows[i];
      const impaCode = String(r[0] ?? '').trim();
      if (!impaCode) continue;
      rows.push({
        sheetName,
        impaCode,
        description: String(r[1] ?? '').trim(),
        codeType: String(r[2] ?? '').trim(),
        unit: String(r[3] ?? '').trim(),
      });
    }
  }

  return rows;
}

function renderReport(
  result: ReturnType<typeof buildImpaCatalogRows>,
  totalScanned: number,
  inserted: string[],
  alreadyPresent: number
): string {
  const lines: string[] = [];
  lines.push('# MRO/IMPA Catalog Ingest Report (Track 1)');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Source: ${SOURCE_FILE}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total rows scanned (all sheets): **${totalScanned}**`);
  lines.push(`- IN-SCOPE sheets (per impa-scope-whitelist.md): **${IMPA_IN_SCOPE_SHEETS.length}**`);
  lines.push(`- Rows skipped (out-of-scope or REVIEW-ONLY sheets): **${result.skippedOutOfScopeCount}**`);
  lines.push(`- Unique impa_code rows after dedup: **${result.rows.length}**`);
  lines.push(`- Duplicate impa_code groups collapsed: **${result.dedupLog.length}**`);
  lines.push(`- Rows already present in impa_catalog before this run (skipped): **${alreadyPresent}**`);
  lines.push(`- Rows inserted this run: **${inserted.length}**`);
  lines.push('');
  lines.push(
    '**No stock quantities were migrated.** The source file\'s "ON HAND QTY (ROB)" column was not read — ' +
      'inventory_items/inventory_ledgers remain the sole stock SSOT. **No asset_parts_impa rows were created** ' +
      '— the source is a store/supplies ROB list with no equipment_tag data, so there is nothing genuinely ' +
      'equipment-specific to map.'
  );
  lines.push('');

  lines.push('## Dedup Log (discarded description variants)');
  lines.push('');
  if (result.dedupLog.length === 0) {
    lines.push('(none)');
  } else {
    lines.push('| impa_code | kept | discarded |');
    lines.push('| --- | --- | --- |');
    for (const entry of result.dedupLog) {
      lines.push(`| ${entry.impaCode} | ${entry.keptDescription} | ${entry.discardedDescriptions.join(' /// ')} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  const totalBefore = countExistingImpaCatalogRows();
  const allRows = readAllRows(join(process.cwd(), SOURCE_FILE));
  const result = buildImpaCatalogRows(allRows);
  const inserted = insertImpaCatalogRows(result.rows);
  const alreadyPresent = result.rows.length - inserted.length;

  const report = renderReport(result, allRows.length, inserted, alreadyPresent);
  const outPath = join(process.cwd(), 'docs', 'mro-impa-catalog-ingest-report.md');
  writeFileSync(outPath, report, 'utf8');

  console.log(`[MRO/IMPA] rows scanned: ${allRows.length}, in-scope unique: ${result.rows.length}`);
  console.log(`[MRO/IMPA] dedup groups collapsed: ${result.dedupLog.length}`);
  console.log(`[MRO/IMPA] impa_catalog before: ${totalBefore}, inserted: ${inserted.length}, already present: ${alreadyPresent}`);
  console.log(`[MRO/IMPA] report written to ${outPath}`);
}

main();
