// src/cmms-monthly-report/print/configs/isoTankDailyReadingsColumnSpec.ts
//
// PURPOSE
//   Print column spec for Monthly Report ISO Tank — mirrors
//   IsoTankDailyReadingsView.tsx's column set exactly. Source sheet lays
//   this out as one wide day-column block per tank; the print sheet
//   renders one WideTableRenderer per tank to match (see
//   sheets/IsoTankDailyReadingsPrintSheet.tsx).

import type { IsoTankDailyReadingRow } from '../../dao/isoTankDailyReadingsDao';
import { fmtNum, fmtText } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { ColumnSpec } from '../renderers/types';

const num = (digits?: number) => (v: unknown) => fmtNum(v as number | null | undefined, digits);
const text = (v: unknown) => fmtText(v as string | null | undefined);

export const ISO_TANK_DAILY_READINGS_COLUMNS: ColumnSpec<IsoTankDailyReadingRow>[] = [
  { key: 'reportDate', label: 'Date' },
  { key: 'levelPct', label: 'Level', unit: '%', format: num(0) },
  { key: 'levelM3', label: 'Level', unit: 'm³', format: num(0) },
  { key: 'levelMmh2o', label: 'Level', unit: 'mmH2O', format: num(0) },
  { key: 'batteryPct', label: 'Battery', unit: '%', format: num(0) },
  { key: 'pressureMpa', label: 'Pressure', unit: 'MPa', format: num() },
  { key: 'tempC', label: 'Temp', unit: '°C', format: num(1) },
  { key: 'depressFlag', label: 'Depress', format: text },
  { key: 'remarks', label: 'Remarks', format: text },
];
