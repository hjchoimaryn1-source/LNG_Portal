// src/cmms-mro-bridge/runCrosswalkBuild.ts
//
// PURPOSE
//   Phase 10 Stage 1B CLI entry point. Builds mro_parts -> impa_catalog
//   crosswalk candidates, persists them to mro_legacy_impa_crosswalk, creates
//   0-stock inventory_items stubs for any matched candidate, and writes
//   docs/phase10-stage1b-crosswalk-report.md for human review.
//
// SCOPE (Sub-stage B)
//   Never writes a real current_stock value and never touches mro_parts /
//   mro_stock_transactions. Actual stock migration is a separate, later
//   stage gated on human (HJ) approval of the report this script produces.
//
// CLI USAGE
//   npx tsx src/cmms-mro-bridge/runCrosswalkBuild.ts

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCandidateMatches, type CrosswalkCandidate } from './crosswalkBuilder';
import { loadImpaCatalog, loadMroPartsForCrosswalk, persistCrosswalk, seedInventoryStubsForCandidates } from './crosswalkDb';

function countByStatus(candidates: CrosswalkCandidate[]) {
  return {
    AUTO_MATCHED: candidates.filter((c) => c.status === 'AUTO_MATCHED').length,
    NEEDS_REVIEW: candidates.filter((c) => c.status === 'NEEDS_REVIEW').length,
    UNMATCHED: candidates.filter((c) => c.status === 'UNMATCHED').length,
  };
}

function renderReport(
  candidates: CrosswalkCandidate[],
  catalogSize: number,
  stubsCreated: string[]
): string {
  const counts = countByStatus(candidates);
  const needsReview = candidates.filter((c) => c.status === 'NEEDS_REVIEW');
  const unmatched = candidates.filter((c) => c.status === 'UNMATCHED');

  const lines: string[] = [];
  lines.push('# Phase 10 — Stage 1B Legacy MRO Crosswalk Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(
    '**No stock quantities were migrated in this stage.** This report is for human review only — ' +
      'inventory_items stubs below were created with current_stock = 0 regardless of match status.'
  );
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total mro_parts scanned: **${candidates.length}**`);
  lines.push(`- impa_catalog rows available for matching: **${catalogSize}**`);
  lines.push(`- AUTO_MATCHED: **${counts.AUTO_MATCHED}**`);
  lines.push(`- NEEDS_REVIEW: **${counts.NEEDS_REVIEW}**`);
  lines.push(`- UNMATCHED: **${counts.UNMATCHED}**`);
  lines.push(`- inventory_items stub rows created this run: **${stubsCreated.length}**${stubsCreated.length ? ` (${stubsCreated.join(', ')})` : ''}`);
  lines.push('');

  if (catalogSize === 0) {
    lines.push(
      '> **impa_catalog has 0 rows.** Per docs/phase10-stage0-investigation-report.md Task 2, no ' +
        '`IMPA_Store_Code` source file exists anywhere in the repo, so there is nothing for the crosswalk ' +
        'builder to compare part names against. Every mro_parts row below is UNMATCHED by construction, ' +
        'not because of a bug in the matcher — this is expected given current data and is not fixable at the ' +
        'application layer. Populating impa_catalog with real IMPA store-code data is a prerequisite for any ' +
        'AUTO_MATCHED/NEEDS_REVIEW result.'
    );
    lines.push('');
  }

  lines.push('## NEEDS_REVIEW — full list');
  lines.push('');
  if (needsReview.length === 0) {
    lines.push('(none)');
  } else {
    lines.push('| legacy_part_id | impa_code_candidate | confidence | reason |');
    lines.push('| --- | --- | --- | --- |');
    for (const c of needsReview) {
      lines.push(`| ${c.legacyPartId} | ${c.impaCodeCandidate ?? ''} | ${c.matchConfidence.toFixed(2)} | ${c.matchedReason} |`);
    }
  }
  lines.push('');

  lines.push('## UNMATCHED — full list');
  lines.push('');
  lines.push('| legacy_part_id | reason |');
  lines.push('| --- | --- |');
  for (const c of unmatched) {
    lines.push(`| ${c.legacyPartId} | ${c.matchedReason} |`);
  }
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  const mroParts = loadMroPartsForCrosswalk();
  const impaCatalog = loadImpaCatalog();

  const candidates = buildCandidateMatches(mroParts, impaCatalog);
  persistCrosswalk(candidates);
  const stubsCreated = seedInventoryStubsForCandidates(candidates, impaCatalog);

  const report = renderReport(candidates, impaCatalog.length, stubsCreated);
  const outPath = join(process.cwd(), 'docs', 'phase10-stage1b-crosswalk-report.md');
  writeFileSync(outPath, report, 'utf8');

  const counts = countByStatus(candidates);
  console.log(`[Stage1B] mro_parts scanned: ${candidates.length}, impa_catalog rows: ${impaCatalog.length}`);
  console.log(`[Stage1B] AUTO_MATCHED=${counts.AUTO_MATCHED} NEEDS_REVIEW=${counts.NEEDS_REVIEW} UNMATCHED=${counts.UNMATCHED}`);
  console.log(`[Stage1B] inventory_items stubs created: ${stubsCreated.length}`);
  console.log(`[Stage1B] report written to ${outPath}`);
}

main();
