// src/db/migrations/gasMeteringLedgerDailyRunner.types.ts
//
// PURPOSE
//   Full row shape for gas_metering_ledger_daily (mirrors
//   phase12_stage_gas_metering_ledger_daily_schema.sql column-for-column),
//   shared between gasMeteringLedgerDailyRunner.ts (upsert) and
//   gasMeteringLedgerDailyPdfSeed.ts (ground-truth constant).

export type GasMeteringSource = 'GC_REPORT' | 'GC_COMPOSITION' | 'DAILY_REPORT_PDF';

export interface GasMeteringLedgerRow {
  reportDate: string;
  meterSource: GasMeteringSource;
  sourceDocument?: string | null;

  cumUvolMmcfA?: number | null; cumCvolMmcfA?: number | null; cumMassTonneA?: number | null; cumMmbtuA?: number | null;
  cumUvolMmcfB?: number | null; cumCvolMmcfB?: number | null; cumMassTonneB?: number | null; cumMmbtuB?: number | null;
  cumUvolMmcfStation?: number | null; cumCvolMmcfStation?: number | null; cumMassTonneStation?: number | null; cumMmbtuStation?: number | null;

  dailyUvolMmcfA?: number | null; dailyCvolMmcfA?: number | null; dailyMassTonneA?: number | null; dailyMmbtuA?: number | null;
  dailyUvolMmcfB?: number | null; dailyCvolMmcfB?: number | null; dailyMassTonneB?: number | null; dailyMmbtuB?: number | null;
  dailyUvolMmcfStation?: number | null; dailyCvolMmcfStation?: number | null; dailyMassTonneStation?: number | null; dailyMmbtuStation?: number | null;

  pressBargA?: number | null; tempCA?: number | null; lineDensKgM3A?: number | null; lineCompressZfA?: number | null; ghvA?: number | null;
  pressBargB?: number | null; tempCB?: number | null; lineDensKgM3B?: number | null; lineCompressZfB?: number | null; ghvB?: number | null;

  molNitrogenA?: number | null; molNitrogenB?: number | null;
  molCo2A?: number | null; molCo2B?: number | null;
  molH2sA?: number | null; molH2sB?: number | null;
  molH2oA?: number | null; molH2oB?: number | null;
  molMethaneA?: number | null; molMethaneB?: number | null;
  molEthaneA?: number | null; molEthaneB?: number | null;
  molPropaneA?: number | null; molPropaneB?: number | null;
  molNbutaneA?: number | null; molNbutaneB?: number | null;
  molIbutaneA?: number | null; molIbutaneB?: number | null;
  molNpentaneA?: number | null; molNpentaneB?: number | null;
  molIpentaneA?: number | null; molIpentaneB?: number | null;
  molHexaneA?: number | null; molHexaneB?: number | null;
  molHeptaneA?: number | null; molHeptaneB?: number | null;
  molOctaneA?: number | null; molOctaneB?: number | null;
  molNonaneA?: number | null; molNonaneB?: number | null;
  molDecaneA?: number | null; molDecaneB?: number | null;

  molMethaneStation?: number | null;
  molEthaneStation?: number | null;
  molPropaneStation?: number | null;
  molIbutaneStation?: number | null;
  molNbutaneStation?: number | null;
  molIpentaneStation?: number | null;
  molNpentaneStation?: number | null;
  molHexaneStation?: number | null;
  molNitrogenStation?: number | null;
  molH2oPpmStation?: number | null;
  molH2sPpmStation?: number | null;
  molTotalPctStation?: number | null;

  ngBufferTankPressureBar?: number | null;
}

/** camelCase field -> DB column name, in schema column order (excludes id/created_at). */
export const GAS_METERING_LEDGER_COLUMNS: Array<[keyof GasMeteringLedgerRow, string]> = [
  ['reportDate', 'report_date'],
  ['meterSource', 'meter_source'],
  ['sourceDocument', 'source_document'],
  ['cumUvolMmcfA', 'cum_uvol_mmcf_a'], ['cumCvolMmcfA', 'cum_cvol_mmcf_a'], ['cumMassTonneA', 'cum_mass_tonne_a'], ['cumMmbtuA', 'cum_mmbtu_a'],
  ['cumUvolMmcfB', 'cum_uvol_mmcf_b'], ['cumCvolMmcfB', 'cum_cvol_mmcf_b'], ['cumMassTonneB', 'cum_mass_tonne_b'], ['cumMmbtuB', 'cum_mmbtu_b'],
  ['cumUvolMmcfStation', 'cum_uvol_mmcf_station'], ['cumCvolMmcfStation', 'cum_cvol_mmcf_station'], ['cumMassTonneStation', 'cum_mass_tonne_station'], ['cumMmbtuStation', 'cum_mmbtu_station'],
  ['dailyUvolMmcfA', 'daily_uvol_mmcf_a'], ['dailyCvolMmcfA', 'daily_cvol_mmcf_a'], ['dailyMassTonneA', 'daily_mass_tonne_a'], ['dailyMmbtuA', 'daily_mmbtu_a'],
  ['dailyUvolMmcfB', 'daily_uvol_mmcf_b'], ['dailyCvolMmcfB', 'daily_cvol_mmcf_b'], ['dailyMassTonneB', 'daily_mass_tonne_b'], ['dailyMmbtuB', 'daily_mmbtu_b'],
  ['dailyUvolMmcfStation', 'daily_uvol_mmcf_station'], ['dailyCvolMmcfStation', 'daily_cvol_mmcf_station'], ['dailyMassTonneStation', 'daily_mass_tonne_station'], ['dailyMmbtuStation', 'daily_mmbtu_station'],
  ['pressBargA', 'press_barg_a'], ['tempCA', 'temp_c_a'], ['lineDensKgM3A', 'line_dens_kg_m3_a'], ['lineCompressZfA', 'line_compress_zf_a'], ['ghvA', 'ghv_a'],
  ['pressBargB', 'press_barg_b'], ['tempCB', 'temp_c_b'], ['lineDensKgM3B', 'line_dens_kg_m3_b'], ['lineCompressZfB', 'line_compress_zf_b'], ['ghvB', 'ghv_b'],
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
  ['molMethaneStation', 'mol_methane_station'],
  ['molEthaneStation', 'mol_ethane_station'],
  ['molPropaneStation', 'mol_propane_station'],
  ['molIbutaneStation', 'mol_ibutane_station'],
  ['molNbutaneStation', 'mol_nbutane_station'],
  ['molIpentaneStation', 'mol_ipentane_station'],
  ['molNpentaneStation', 'mol_npentane_station'],
  ['molHexaneStation', 'mol_hexane_station'],
  ['molNitrogenStation', 'mol_nitrogen_station'],
  ['molH2oPpmStation', 'mol_h2o_ppm_station'],
  ['molH2sPpmStation', 'mol_h2s_ppm_station'],
  ['molTotalPctStation', 'mol_total_pct_station'],
  ['ngBufferTankPressureBar', 'ng_buffer_tank_pressure_bar'],
];
