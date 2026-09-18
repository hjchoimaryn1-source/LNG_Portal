// src/gas-metering/dao/gasMeteringLedgerEntryDao.ts
//
// PURPOSE
//   Live daily-entry upsert DAO for gas_metering_ledger_daily — reverses
//   the 2026-09-16 "no manual entry" decision (HJ, this session: Floboss
//   readings are read off the device display and keyed in daily, not
//   SCADA-integrated). Upsert key (report_date, meter_source), matching
//   the schema's UNIQUE index — same table the CSV seed runner
//   (gasMeteringLedgerDailyRunner.ts) already populated; no separate
//   "live" table, live entry simply extends the same rows going forward.
//
//   Field scope (raw manual entry vs. computed, decided this session):
//   - GC_REPORT: all cum_*/daily_* UVOL/CVOL/Mass/MMBTU (A/B/station) +
//     press/temp/dens/compress/ghv (A/B) + ghv_manual_sample are raw
//     entry — the seed CSV carries each as an independent column, not a
//     formula, so no evidence exists that any of these are derived from
//     another. This is an assumption to correct later if the officer's
//     paper form doesn't actually require both cum and daily to be keyed
//     separately.
//   - net_sales_vol_mmscf/net_sales_energy_mmbtu are EXCLUDED from manual
//     entry — verified via direct xlsx inspection (this session, P6/P3
//     investigation) that the source's "Net Sales" cells are a formula
//     over Meter A+B daily volume/energy, not an independent reading.
//     Computed here at upsert-time and stored in the same row (unlike the
//     P5 auto-populate precedent, there's no separate manual table here —
//     it's the same physical row, so persisting keeps existing readers
//     like getFlobossLedgerForMonth() fast without a read-time join).
//   - ghv_station/mol_co2_station/specific_gravity_station are EXCLUDED —
//     reserved for a future P8 station-composition form revision (see
//     gasMeteringLedgerSchema.ts's column comment, written this session),
//     unrelated to Floboss volume/energy entry.
//   - GC_COMPOSITION: all 16 mol% component pairs (A/B) are raw entry —
//     same "no formula evidence" reasoning as GC_REPORT.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface GcReportEntryRow {
  reportDate: string;
  cumUvolMmcfA: number | null; cumCvolMmcfA: number | null; cumMassTonneA: number | null; cumMmbtuA: number | null;
  cumUvolMmcfB: number | null; cumCvolMmcfB: number | null; cumMassTonneB: number | null; cumMmbtuB: number | null;
  cumUvolMmcfStation: number | null; cumCvolMmcfStation: number | null; cumMassTonneStation: number | null; cumMmbtuStation: number | null;
  dailyUvolMmcfA: number | null; dailyCvolMmcfA: number | null; dailyMassTonneA: number | null; dailyMmbtuA: number | null;
  dailyUvolMmcfB: number | null; dailyCvolMmcfB: number | null; dailyMassTonneB: number | null; dailyMmbtuB: number | null;
  dailyUvolMmcfStation: number | null; dailyCvolMmcfStation: number | null; dailyMassTonneStation: number | null; dailyMmbtuStation: number | null;
  pressBargA: number | null; tempCA: number | null; lineDensKgM3A: number | null; lineCompressZfA: number | null; ghvA: number | null;
  pressBargB: number | null; tempCB: number | null; lineDensKgM3B: number | null; lineCompressZfB: number | null; ghvB: number | null;
  ghvManualSample: number | null;
}

export interface GcCompositionEntryRow {
  reportDate: string;
  molNitrogenA: number | null; molNitrogenB: number | null;
  molCo2A: number | null; molCo2B: number | null;
  molH2sA: number | null; molH2sB: number | null;
  molH2oA: number | null; molH2oB: number | null;
  molMethaneA: number | null; molMethaneB: number | null;
  molEthaneA: number | null; molEthaneB: number | null;
  molPropaneA: number | null; molPropaneB: number | null;
  molNbutaneA: number | null; molNbutaneB: number | null;
  molIbutaneA: number | null; molIbutaneB: number | null;
  molNpentaneA: number | null; molNpentaneB: number | null;
  molIpentaneA: number | null; molIpentaneB: number | null;
  molHexaneA: number | null; molHexaneB: number | null;
  molHeptaneA: number | null; molHeptaneB: number | null;
  molOctaneA: number | null; molOctaneB: number | null;
  molNonaneA: number | null; molNonaneB: number | null;
  molDecaneA: number | null; molDecaneB: number | null;
}

const GC_REPORT_COLUMNS: Array<[keyof GcReportEntryRow, string]> = [
  ['reportDate', 'report_date'],
  ['cumUvolMmcfA', 'cum_uvol_mmcf_a'], ['cumCvolMmcfA', 'cum_cvol_mmcf_a'], ['cumMassTonneA', 'cum_mass_tonne_a'], ['cumMmbtuA', 'cum_mmbtu_a'],
  ['cumUvolMmcfB', 'cum_uvol_mmcf_b'], ['cumCvolMmcfB', 'cum_cvol_mmcf_b'], ['cumMassTonneB', 'cum_mass_tonne_b'], ['cumMmbtuB', 'cum_mmbtu_b'],
  ['cumUvolMmcfStation', 'cum_uvol_mmcf_station'], ['cumCvolMmcfStation', 'cum_cvol_mmcf_station'], ['cumMassTonneStation', 'cum_mass_tonne_station'], ['cumMmbtuStation', 'cum_mmbtu_station'],
  ['dailyUvolMmcfA', 'daily_uvol_mmcf_a'], ['dailyCvolMmcfA', 'daily_cvol_mmcf_a'], ['dailyMassTonneA', 'daily_mass_tonne_a'], ['dailyMmbtuA', 'daily_mmbtu_a'],
  ['dailyUvolMmcfB', 'daily_uvol_mmcf_b'], ['dailyCvolMmcfB', 'daily_cvol_mmcf_b'], ['dailyMassTonneB', 'daily_mass_tonne_b'], ['dailyMmbtuB', 'daily_mmbtu_b'],
  ['dailyUvolMmcfStation', 'daily_uvol_mmcf_station'], ['dailyCvolMmcfStation', 'daily_cvol_mmcf_station'], ['dailyMassTonneStation', 'daily_mass_tonne_station'], ['dailyMmbtuStation', 'daily_mmbtu_station'],
  ['pressBargA', 'press_barg_a'], ['tempCA', 'temp_c_a'], ['lineDensKgM3A', 'line_dens_kg_m3_a'], ['lineCompressZfA', 'line_compress_zf_a'], ['ghvA', 'ghv_a'],
  ['pressBargB', 'press_barg_b'], ['tempCB', 'temp_c_b'], ['lineDensKgM3B', 'line_dens_kg_m3_b'], ['lineCompressZfB', 'line_compress_zf_b'], ['ghvB', 'ghv_b'],
  ['ghvManualSample', 'ghv_manual_sample'],
];

const GC_COMPOSITION_COLUMNS: Array<[keyof GcCompositionEntryRow, string]> = [
  ['reportDate', 'report_date'],
  ['molNitrogenA', 'mol_nitrogen_a'], ['molNitrogenB', 'mol_nitrogen_b'],
  ['molCo2A', 'mol_co2_a'], ['molCo2B', 'mol_co2_b'],
  ['molH2sA', 'mol_h2s_a'], ['molH2sB', 'mol_h2s_b'],
  ['molH2oA', 'mol_h2o_a'], ['molH2oB', 'mol_h2o_b'],
  ['molMethaneA', 'mol_methane_a'], ['molMethaneB', 'mol_methane_b'],
  ['molEthaneA', 'mol_ethane_a'], ['molEthaneB', 'mol_ethane_b'],
  ['molPropaneA', 'mol_propane_a'], ['molPropaneB', 'mol_propane_b'],
  ['molNbutaneA', 'mol_nbutane_a'], ['molNbutaneB', 'mol_nbutane_b'],
  ['molIbutaneA', 'mol_ibutane_a'], ['molIbutaneB', 'mol_ibutane_b'],
  ['molNpentaneA', 'mol_npentane_a'], ['molNpentaneB', 'mol_npentane_b'],
  ['molIpentaneA', 'mol_ipentane_a'], ['molIpentaneB', 'mol_ipentane_b'],
  ['molHexaneA', 'mol_hexane_a'], ['molHexaneB', 'mol_hexane_b'],
  ['molHeptaneA', 'mol_heptane_a'], ['molHeptaneB', 'mol_heptane_b'],
  ['molOctaneA', 'mol_octane_a'], ['molOctaneB', 'mol_octane_b'],
  ['molNonaneA', 'mol_nonane_a'], ['molNonaneB', 'mol_nonane_b'],
  ['molDecaneA', 'mol_decane_a'], ['molDecaneB', 'mol_decane_b'],
];

function sumOrNull(a: number | null, b: number | null): number | null {
  return a === null && b === null ? null : (a ?? 0) + (b ?? 0);
}

function upsert<T>(
  db: SqlExecutor,
  meterSource: string,
  columns: Array<[keyof T, string]>,
  row: T,
  extra: Record<string, unknown> = {}
): void {
  const rowAsRecord = row as Record<string, unknown>;
  const colNames = [...columns.map(([, col]) => col), 'meter_source', 'source_document', ...Object.keys(extra)];
  const updateSet = colNames
    .filter((c) => c !== 'report_date' && c !== 'meter_source')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  const params: Record<string, unknown> = { meter_source: meterSource, source_document: 'MANUAL_ENTRY', ...extra };
  for (const [field, col] of columns) params[col] = rowAsRecord[String(field)] ?? null;

  db.run(
    `INSERT INTO gas_metering_ledger_daily (${colNames.join(', ')})
     VALUES (${colNames.map((c) => `@${c}`).join(', ')})
     ON CONFLICT(report_date, meter_source) DO UPDATE SET ${updateSet}`,
    params
  );
}

function fromSqlRow<T>(sqlRow: Record<string, unknown>, columns: Array<[keyof T, string]>): T {
  const out: Record<string, unknown> = {};
  for (const [field, col] of columns) out[String(field)] = sqlRow[col] ?? null;
  return out as T;
}

export function upsertGcReportEntry(db: SqlExecutor, row: GcReportEntryRow): void {
  const netSalesVolMmscf = sumOrNull(row.dailyCvolMmcfA, row.dailyCvolMmcfB);
  const netSalesEnergyMmbtu = sumOrNull(row.dailyMmbtuA, row.dailyMmbtuB);
  upsert(db, 'GC_REPORT', GC_REPORT_COLUMNS, row, {
    net_sales_vol_mmscf: netSalesVolMmscf,
    net_sales_energy_mmbtu: netSalesEnergyMmbtu,
  });
}

export function upsertGcCompositionEntry(db: SqlExecutor, row: GcCompositionEntryRow): void {
  upsert(db, 'GC_COMPOSITION', GC_COMPOSITION_COLUMNS, row);
}

export function getGcReportEntryForDate(db: SqlExecutor, reportDate: string): GcReportEntryRow | undefined {
  const row = db.get<Record<string, unknown>>(
    `SELECT * FROM gas_metering_ledger_daily WHERE report_date = @reportDate AND meter_source = 'GC_REPORT'`,
    { reportDate }
  );
  return row ? fromSqlRow<GcReportEntryRow>(row, GC_REPORT_COLUMNS) : undefined;
}

export function getGcCompositionEntryForDate(db: SqlExecutor, reportDate: string): GcCompositionEntryRow | undefined {
  const row = db.get<Record<string, unknown>>(
    `SELECT * FROM gas_metering_ledger_daily WHERE report_date = @reportDate AND meter_source = 'GC_COMPOSITION'`,
    { reportDate }
  );
  return row ? fromSqlRow<GcCompositionEntryRow>(row, GC_COMPOSITION_COLUMNS) : undefined;
}
