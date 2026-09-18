// src/gas-metering/entry/flobossEntryFieldMaps.ts
//
// PURPOSE
//   Field manifests for FlobossDailyEntryForm's sections — config, not DAO
//   logic (same convention as cmms-daily-ops/dao/patrolFieldMaps.ts). One
//   entry per raw manual-entry column; see gasMeteringLedgerEntryDao.ts's
//   header for which columns are raw vs. computed/reserved and excluded.

export interface EntryFieldSpec {
  key: string;
  label: string;
  unit: string;
}

export const METER_A_FIELDS: EntryFieldSpec[] = [
  { key: 'cumUvolMmcfA', label: 'Cum. UVOL', unit: 'MMCF' },
  { key: 'cumCvolMmcfA', label: 'Cum. CVOL', unit: 'MMCF' },
  { key: 'cumMassTonneA', label: 'Cum. Mass', unit: 'tonne' },
  { key: 'cumMmbtuA', label: 'Cum. Energy', unit: 'MMBTU' },
  { key: 'dailyUvolMmcfA', label: 'Daily UVOL', unit: 'MMCF' },
  { key: 'dailyCvolMmcfA', label: 'Daily CVOL', unit: 'MMCF' },
  { key: 'dailyMassTonneA', label: 'Daily Mass', unit: 'tonne' },
  { key: 'dailyMmbtuA', label: 'Daily Energy', unit: 'MMBTU' },
  { key: 'pressBargA', label: 'Pressure', unit: 'barg' },
  { key: 'tempCA', label: 'Temperature', unit: '°C' },
  { key: 'lineDensKgM3A', label: 'Line Density', unit: 'kg/m³' },
  { key: 'lineCompressZfA', label: 'Compressibility Zf', unit: '' },
  { key: 'ghvA', label: 'GHV', unit: 'BTU/SCF' },
];

export const METER_B_FIELDS: EntryFieldSpec[] = METER_A_FIELDS.map((f) => ({
  ...f,
  key: f.key.replace(/A$/, 'B'),
}));

export const STATION_FIELDS: EntryFieldSpec[] = [
  { key: 'cumUvolMmcfStation', label: 'Cum. UVOL', unit: 'MMCF' },
  { key: 'cumCvolMmcfStation', label: 'Cum. CVOL', unit: 'MMCF' },
  { key: 'cumMassTonneStation', label: 'Cum. Mass', unit: 'tonne' },
  { key: 'cumMmbtuStation', label: 'Cum. Energy', unit: 'MMBTU' },
  { key: 'dailyUvolMmcfStation', label: 'Daily UVOL', unit: 'MMCF' },
  { key: 'dailyCvolMmcfStation', label: 'Daily CVOL', unit: 'MMCF' },
  { key: 'dailyMassTonneStation', label: 'Daily Mass', unit: 'tonne' },
  { key: 'dailyMmbtuStation', label: 'Daily Energy', unit: 'MMBTU' },
  { key: 'ghvManualSample', label: 'GHV Manual Sample', unit: 'BTU/SCF' },
];

const COMPOSITION_COMPONENTS: Array<[string, string]> = [
  ['molNitrogen', 'Nitrogen'],
  ['molCo2', 'CO2'],
  ['molH2s', 'H2S'],
  ['molH2o', 'H2O'],
  ['molMethane', 'Methane'],
  ['molEthane', 'Ethane'],
  ['molPropane', 'Propane'],
  ['molNbutane', 'n-Butane'],
  ['molIbutane', 'i-Butane'],
  ['molNpentane', 'n-Pentane'],
  ['molIpentane', 'i-Pentane'],
  ['molHexane', 'Hexane'],
  ['molHeptane', 'Heptane'],
  ['molOctane', 'Octane'],
  ['molNonane', 'Nonane'],
  ['molDecane', 'Decane'],
];

export function compositionFields(suffix: 'A' | 'B'): EntryFieldSpec[] {
  return COMPOSITION_COMPONENTS.map(([key, label]) => ({ key: `${key}${suffix}`, label, unit: 'mol %' }));
}
