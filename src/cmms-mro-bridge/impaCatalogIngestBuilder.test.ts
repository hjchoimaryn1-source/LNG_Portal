import { describe, expect, it } from 'vitest';
import { buildImpaCatalogRows, IMPA_IN_SCOPE_SHEETS, type RawImpaSheetRow } from './impaCatalogIngestBuilder';

function row(overrides: Partial<RawImpaSheetRow>): RawImpaSheetRow {
  return {
    sheetName: '59_Pneumatic_Tools',
    impaCode: '590301',
    description: 'GRINDER',
    codeType: 'Standard IMPA',
    unit: 'PCS',
    ...overrides,
  };
}

describe('buildImpaCatalogRows', () => {
  it('keeps every IN-SCOPE sheet listed in the whitelist', () => {
    expect(IMPA_IN_SCOPE_SHEETS).toHaveLength(15);
    expect(IMPA_IN_SCOPE_SHEETS).toContain('35_Hoses_Couplings');
  });

  it('excludes rows from out-of-scope and REVIEW-ONLY sheets', () => {
    const result = buildImpaCatalogRows([
      row({ sheetName: '59_Pneumatic_Tools', impaCode: 'A1' }),
      row({ sheetName: '33_Safety_LSA_FFA', impaCode: 'B1' }), // REVIEW-ONLY
      row({ sheetName: '99_Custom_Uncoded', impaCode: 'C1' }), // OUT-OF-SCOPE
    ]);

    expect(result.rows.map((r) => r.impaCode)).toEqual(['A1']);
    expect(result.skippedOutOfScopeCount).toBe(2);
  });

  it('dedups by impa_code, keeping the longest description and logging the rest', () => {
    const result = buildImpaCatalogRows([
      row({ impaCode: '590301', description: 'GRINDER' }),
      row({ impaCode: '590301', description: 'Angle grinder, pneumatic, wheel size 100mm, Japan Made' }),
      row({ impaCode: '590301', description: 'Grinder set' }),
    ]);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].partName).toBe('Angle grinder, pneumatic, wheel size 100mm, Japan Made');
    expect(result.dedupLog).toHaveLength(1);
    expect(result.dedupLog[0].discardedDescriptions).toEqual(['GRINDER', 'Grinder set']);
  });

  it('breaks length ties by keeping the first-seen row', () => {
    const result = buildImpaCatalogRows([
      row({ impaCode: 'X1', description: 'ABCDE' }),
      row({ impaCode: 'X1', description: 'FGHIJ' }),
    ]);

    expect(result.rows[0].partName).toBe('ABCDE');
  });

  it('defaults unit to PCS when the source unit is blank', () => {
    const result = buildImpaCatalogRows([row({ impaCode: 'U1', unit: '' })]);
    expect(result.rows[0].unit).toBe('PCS');
  });

  it('never fabricates a row for an empty input', () => {
    const result = buildImpaCatalogRows([]);
    expect(result.rows).toEqual([]);
    expect(result.dedupLog).toEqual([]);
    expect(result.skippedOutOfScopeCount).toBe(0);
  });
});
