// src/cmms-monthly-report/print/configs/isoTankConsumptionColumnSpec.ts
//
// PURPOSE
//   Print column spec for Consumption ISOTank — mirrors
//   IsoTankConsumptionView.tsx's column set exactly (per-tank monthly
//   snapshot, not per-day; tank roster intentionally not reconciled with
//   iso_tank_daily_readings, HJ-confirmed).

import type { IsoTankConsumptionRow } from '../../dao/isoTankConsumptionDao';
import { fmtNum, fmtText } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { ColumnSpec } from '../renderers/types';

const num = (digits?: number) => (v: unknown) => fmtNum(v as number | null | undefined, digits);
const text = (v: unknown) => fmtText(v as string | null | undefined);

export const ISO_TANK_CONSUMPTION_COLUMNS: ColumnSpec<IsoTankConsumptionRow>[] = [
  { key: 'isoTankNo', label: 'Tank' },
  { key: 'shipment', label: 'Shipment', format: text },
  { key: 'weightAwalKg', label: 'Opening Weight', unit: 'Kg', format: num(0) },
  { key: 'stockAwalM3', label: 'Opening Stock', unit: 'm³', format: num() },
  { key: 'stockAkhirM3', label: 'Closing Stock', unit: 'm³', format: num() },
  { key: 'netConsumedM3', label: 'Net Consumed', unit: 'm³', format: num() },
  { key: 'consumedMmbtu', label: 'Consumed', unit: 'MMBTU', format: num() },
  { key: 'densityKgM3', label: 'Density', unit: 'Kg/m³', format: num(0) },
  { key: 'lossesKg', label: 'Losses', unit: 'Kg', format: num(0) },
  { key: 'lossesPct', label: 'Losses', unit: '%', format: num() },
  { key: 'remarks', label: 'Remarks', format: text },
];
