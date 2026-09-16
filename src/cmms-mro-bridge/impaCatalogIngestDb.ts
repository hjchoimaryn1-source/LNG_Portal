// src/cmms-mro-bridge/impaCatalogIngestDb.ts
//
// PURPOSE
//   DB-facing layer for the Track 1 IMPA catalog ingestion. Writes only to
//   impa_catalog (existing table, no schema change) via an idempotent
//   ON CONFLICT DO NOTHING upsert — safe to re-run. Never touches
//   asset_parts_impa: the source file (a store/supplies ROB list) carries no
//   equipment_tag data, so there is nothing genuinely equipment-specific to
//   map — fabricating a mapping would conflate Store/Supplies consumables
//   with Spare Parts BOM data, which the Track 1 authorization forbids.

import { getCmmsDb } from '../adapters/db/cmmsDbSingleton';
import type { ImpaCatalogInsertRow } from './impaCatalogIngestBuilder';

const UPSERT_SQL = `
  INSERT INTO impa_catalog (impa_code, part_name, unit)
  VALUES (@impaCode, @partName, @unit)
  ON CONFLICT(impa_code) DO NOTHING
`;

export function countExistingImpaCatalogRows(): number {
  const db = getCmmsDb();
  const row = db.get<{ c: number }>('SELECT COUNT(*) as c FROM impa_catalog');
  return row?.c ?? 0;
}

/** Inserts rows not already present by impa_code. Returns the impa_codes actually inserted. */
export function insertImpaCatalogRows(rows: ImpaCatalogInsertRow[]): string[] {
  const db = getCmmsDb();
  const inserted: string[] = [];
  for (const row of rows) {
    const existing = db.get('SELECT impa_code FROM impa_catalog WHERE impa_code = @impaCode', {
      impaCode: row.impaCode,
    });
    if (existing) continue;
    db.run(UPSERT_SQL, { ...row });
    inserted.push(row.impaCode);
  }
  return inserted;
}
