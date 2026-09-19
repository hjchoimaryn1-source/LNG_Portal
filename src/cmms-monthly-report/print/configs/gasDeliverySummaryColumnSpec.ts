// src/cmms-monthly-report/print/configs/gasDeliverySummaryColumnSpec.ts
//
// PURPOSE
//   Print specs for Summary Gas Delivery (P5) — daily manual-entry grid
//   (WideTableRenderer) plus the sheet's separate end-of-month cumulative
//   block (FieldSummaryRenderer). Mirrors GasDeliverySummaryForm.tsx's
//   DAILY_FIELDS/MONTHLY_FIELDS field sets exactly.

import type { GasDeliveryDailyManualRow } from '../../dao/gasDeliveryManualDao';
import { fmtNum } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { ColumnSpec, FieldSpec } from '../renderers/types';

const num = (v: unknown) => fmtNum(v as number | null | undefined);

export const GAS_DELIVERY_DAILY_COLUMNS: ColumnSpec<GasDeliveryDailyManualRow>[] = [
  { key: 'reportDate', label: 'Date' },
  { key: 'dcqMmscfd', label: 'DCQ', unit: 'MMSCFD', format: num },
  { key: 'nomMmscfd', label: 'Nom.', unit: 'MMSCFD', format: num },
  { key: 'prodPlanMmscfd', label: 'Prod. Plan', unit: 'MMSCFD', format: num },
  { key: 'deliveryVolMmscf', label: 'Delivery Vol', unit: 'MMSCF', format: num },
  { key: 'deliveryEnergyMmbtu', label: 'Delivery Energy', unit: 'MMBTU', format: num },
  { key: 'offSpecVolMmscf', label: 'Off-Spec Vol', unit: 'MMSCF', format: num },
  { key: 'offSpecEnergyMmbtu', label: 'Off-Spec Energy', unit: 'MMBTU', format: num },
  { key: 'shortfallVolMmscf', label: 'Shortfall Vol', unit: 'MMSCF', format: num },
  { key: 'shortfallEnergyMmbtu', label: 'Shortfall Energy', unit: 'MMBTU', format: num },
  { key: 'forceMajeureVolMmscf', label: 'Force Majeure Vol', unit: 'MMSCF', format: num },
  { key: 'forceMajeureEnergyMmbtu', label: 'Force Majeure Energy', unit: 'MMBTU', format: num },
  { key: 'maintenanceDayVolMmscf', label: 'Maintenance Day Vol', unit: 'MMSCF', format: num },
  { key: 'maintenanceDayEnergyMmbtu', label: 'Maintenance Day Energy', unit: 'MMBTU', format: num },
  { key: 'underTakeVolMmscf', label: 'Under Take Vol', unit: 'MMSCF', format: num },
  { key: 'underTakeEnergyMmbtu', label: 'Under Take Energy', unit: 'MMBTU', format: num },
  { key: 'excessVolMmscf', label: 'Excess Vol', unit: 'MMSCF', format: num },
  { key: 'excessEnergyMmbtu', label: 'Excess Energy', unit: 'MMBTU', format: num },
  { key: 'avgTempC', label: 'Average Temp', unit: '°C', format: num },
  { key: 'avgPressPsig', label: 'Average Press', unit: 'psig', format: num },
];

export const GAS_DELIVERY_MONTHLY_FIELDS: FieldSpec[] = [
  { key: 'shortfallBeginMonthMmscf', label: 'Shortfall Begin Month', unit: 'MMSCF', format: num },
  { key: 'shortfallBeginMonthMmbtu', label: 'Shortfall Begin Month', unit: 'MMBTU', format: num },
  { key: 'shortfallThisMonthMmscf', label: 'Shortfall This Month', unit: 'MMSCF', format: num },
  { key: 'shortfallThisMonthMmbtu', label: 'Shortfall This Month', unit: 'MMBTU', format: num },
  { key: 'undertakeThisMonthMmscf', label: 'Undertake This Month', unit: 'MMSCF', format: num },
  { key: 'undertakeThisMonthMmbtu', label: 'Undertake This Month', unit: 'MMBTU', format: num },
  { key: 'excessThisMonthMmscf', label: 'Excess This Month', unit: 'MMSCF', format: num },
  { key: 'excessThisMonthMmbtu', label: 'Excess This Month', unit: 'MMBTU', format: num },
  { key: 'shortfallEndMonthMmscf', label: 'Shortfall End Month', unit: 'MMSCF', format: num },
  { key: 'shortfallEndMonthMmbtu', label: 'Shortfall End Month', unit: 'MMBTU', format: num },
];
