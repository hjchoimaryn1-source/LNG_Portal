// src/cmms-mro-bridge/impaCatalogIngestBuilder.ts
//
// PURPOSE
//   Pure logic for Track 1 (MRO/IMPA CLI material management, HJ-authorized
//   session 2026-09-16): filters IMPA_Store_Code.xlsx rows down to the
//   docs/reference/impa-scope-whitelist.md IN-SCOPE sheet set, then applies
//   the whitelist's documented duplicate-impa_code rule ("가장 상세한
//   DESCRIPTION 채택, 폐기분은 별도 dedup 로그"). No React/DB/xlsx-parser
//   bindings — the CLI runner (runImpaCatalogIngest.ts) owns those.
//
// SCOPE NOTE
//   "Most detailed" is operationalized as longest DESCRIPTION string (ties
//   broken by first-seen order) — a deterministic, documented stand-in for
//   the whitelist's qualitative wording. No stock quantities are read here;
//   the source file's "ON HAND QTY (ROB)" column is out of scope for this
//   builder (inventory_items/inventory_ledgers remain the stock SSOT).

/** docs/reference/impa-scope-whitelist.md IN-SCOPE list — 확정값, 재분석 금지. */
export const IMPA_IN_SCOPE_SHEETS = [
  '59_Pneumatic_Tools',
  '61_Hand_Tools',
  '63_Cutting_Tools',
  '65_Measuring_Gauges',
  '67_Steel_Metal',
  '69_Bolts_Nuts_Screws',
  '71_Pipes_Tubes',
  '73_Pipe_Fittings',
  '75_Valves_Cocks',
  '77_Bearings',
  '79_Electrical_Lighting',
  '81_Packing_Adhesives',
  '83_Welding_Unitor',
  '85_Welding_Electrodes',
  '35_Hoses_Couplings',
] as const;

export interface RawImpaSheetRow {
  sheetName: string;
  impaCode: string;
  description: string;
  codeType: string;
  unit: string;
}

export interface ImpaCatalogInsertRow {
  impaCode: string;
  partName: string;
  unit: string;
}

export interface DedupLogEntry {
  impaCode: string;
  keptDescription: string;
  discardedDescriptions: string[];
}

export interface ImpaCatalogIngestResult {
  rows: ImpaCatalogInsertRow[];
  dedupLog: DedupLogEntry[];
  skippedOutOfScopeCount: number;
}

/**
 * Filters to IN-SCOPE sheets, then dedups by impa_code across the combined
 * in-scope row set (longest description wins). Rows from out-of-scope or
 * REVIEW-ONLY sheets are counted but never included in the output.
 */
export function buildImpaCatalogRows(allRows: RawImpaSheetRow[]): ImpaCatalogIngestResult {
  const inScopeSet = new Set<string>(IMPA_IN_SCOPE_SHEETS);
  const inScopeRows = allRows.filter((r) => inScopeSet.has(r.sheetName));
  const skippedOutOfScopeCount = allRows.length - inScopeRows.length;

  const byCode = new Map<string, RawImpaSheetRow[]>();
  for (const row of inScopeRows) {
    const list = byCode.get(row.impaCode);
    if (list) list.push(row);
    else byCode.set(row.impaCode, [row]);
  }

  const rows: ImpaCatalogInsertRow[] = [];
  const dedupLog: DedupLogEntry[] = [];

  for (const [impaCode, group] of byCode) {
    let kept = group[0];
    for (const candidate of group) {
      if (candidate.description.length > kept.description.length) kept = candidate;
    }
    rows.push({ impaCode, partName: kept.description, unit: kept.unit || 'PCS' });

    if (group.length > 1) {
      dedupLog.push({
        impaCode,
        keptDescription: kept.description,
        discardedDescriptions: group.filter((g) => g !== kept).map((g) => g.description),
      });
    }
  }

  return { rows, dedupLog, skippedOutOfScopeCount };
}
