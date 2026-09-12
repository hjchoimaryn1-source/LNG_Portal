// src/cmms-mro-bridge/crosswalkDb.ts
//
// PURPOSE
//   DB-facing layer for Phase 10 Stage 1B. Reads mro_parts (read-only reuse
//   of the existing DAO — never writes to it) and impa_catalog, ensures the
//   new mro_legacy_impa_crosswalk table exists, and persists crosswalk
//   candidates. Also creates 0-stock inventory_items stub rows for any
//   candidate that did produce an impa_code match — never writes a real
//   current_stock value here (Sub-stage B scope: report-only, no stock
//   migration; see runCrosswalkBuild.ts).

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCmmsDb } from '../adapters/db/cmmsDbSingleton';
import { selectAllParts } from '../adapters/db/mroInventoryDao';
import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import type { CrosswalkCandidate, CrosswalkCatalogRow, CrosswalkSourcePart } from './crosswalkBuilder';

/** Splits the schema file into individual statements and runs each via SqlExecutor.run(). */
function ensureCrosswalkSchema(db: SqlExecutor): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(join(here, 'crosswalkSchema.sql'), 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.replace(/--.*$/gm, '').trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) db.run(stmt);
}

export function loadMroPartsForCrosswalk(): CrosswalkSourcePart[] {
  const db = getCmmsDb();
  return selectAllParts(db).map((p) => ({ partNo: p.partNo, partName: p.partName }));
}

interface ImpaCatalogRow {
  impa_code: string;
  part_name: string;
  specification: string | null;
}

export function loadImpaCatalog(): CrosswalkCatalogRow[] {
  const db = getCmmsDb();
  const rows = db.all<ImpaCatalogRow>('SELECT impa_code, part_name, specification FROM impa_catalog');
  return rows.map((r) => ({ impaCode: r.impa_code, partName: r.part_name, specification: r.specification }));
}

const UPSERT_CROSSWALK_SQL = `
  INSERT INTO mro_legacy_impa_crosswalk (legacy_part_id, impa_code_candidate, match_confidence, status, matched_reason)
  VALUES (@legacyPartId, @impaCodeCandidate, @matchConfidence, @status, @matchedReason)
  ON CONFLICT(legacy_part_id) DO UPDATE SET
    impa_code_candidate = excluded.impa_code_candidate,
    match_confidence = excluded.match_confidence,
    status = excluded.status,
    matched_reason = excluded.matched_reason,
    generated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
`;

/** Persists candidates (upsert by legacy_part_id — safe to re-run). Ensures schema first. */
export function persistCrosswalk(candidates: CrosswalkCandidate[]): void {
  const db = getCmmsDb();
  ensureCrosswalkSchema(db);
  for (const c of candidates) {
    db.run(UPSERT_CROSSWALK_SQL, {
      legacyPartId: c.legacyPartId,
      impaCodeCandidate: c.impaCodeCandidate,
      matchConfidence: c.matchConfidence,
      status: c.status,
      matchedReason: c.matchedReason,
    });
  }
}

const INSERT_STUB_ITEM_SQL = `
  INSERT INTO inventory_items (impa_code, item_name_en, storage_location, current_stock)
  VALUES (@impaCode, @itemNameEn, 'UNASSIGNED', 0)
`;

/**
 * For every AUTO_MATCHED/NEEDS_REVIEW candidate, ensures an inventory_items
 * stub row exists for its impa_code (current_stock hard-coded to 0 — real
 * quantities are out of Sub-stage B scope). No-op when the row already
 * exists. Returns the impa_codes actually inserted (for reporting).
 */
export function seedInventoryStubsForCandidates(
  candidates: CrosswalkCandidate[],
  catalog: CrosswalkCatalogRow[]
): string[] {
  const db = getCmmsDb();
  const byCode = new Map(catalog.map((c) => [c.impaCode, c]));
  const inserted: string[] = [];

  for (const c of candidates) {
    if (c.status === 'UNMATCHED' || !c.impaCodeCandidate) continue;
    const existing = db.get('SELECT impa_code FROM inventory_items WHERE impa_code = @impaCode', {
      impaCode: c.impaCodeCandidate,
    });
    if (existing) continue;

    const catalogRow = byCode.get(c.impaCodeCandidate);
    db.run(INSERT_STUB_ITEM_SQL, {
      impaCode: c.impaCodeCandidate,
      itemNameEn: catalogRow?.partName ?? c.impaCodeCandidate,
    });
    inserted.push(c.impaCodeCandidate);
  }

  return inserted;
}
