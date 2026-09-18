// src/cmms-monthly-report/print/configs/monthlyReportOpsSpec.ts
//
// PURPOSE
//   Print specs for the Monthly Report Ops. dashboard's Metering A/B block
//   — day-column table (WideTableRenderer) + the sheet's Totalizer/Higest/
//   Lowest/Average/Pressure Supply/Temperature/Density/GHV summary boxes
//   (FieldSummaryRenderer). Field set and formulas verified via direct
//   inspection of Monthly Report Ops.!AL2:BT24 (see opsDashboardDao.ts).

import type { OpsMeteringDayRow } from '../../dao/opsDashboardDao';
import { fmtNum } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { ColumnSpec, FieldSpec, GroupHeader } from '../renderers/types';

const num = (digits?: number) => (v: unknown) => fmtNum(v as number | null | undefined, digits);

export const OPS_DAY_COLUMNS: ColumnSpec<OpsMeteringDayRow>[] = [
  { key: 'reportDate', label: 'Date' },
  { key: 'nettVolumeMscfA', label: 'Nett Volume', unit: 'MSCF', format: num() },
  { key: 'pressureBarA', label: 'Pressure Supply', unit: 'Bar', format: num() },
  { key: 'temperatureCA', label: 'Temperature', unit: '°C', format: num() },
  { key: 'densityKgM3A', label: 'Density', unit: 'Kg/m³', format: num() },
  { key: 'ghvA', label: 'GHV', unit: 'BTU/SCF', format: num() },
  { key: 'nettVolumeMscfB', label: 'Nett Volume', unit: 'MSCF', format: num() },
  { key: 'pressureBarB', label: 'Pressure Supply', unit: 'Bar', format: num() },
  { key: 'temperatureCB', label: 'Temperature', unit: '°C', format: num() },
  { key: 'densityKgM3B', label: 'Density', unit: 'Kg/m³', format: num() },
  { key: 'ghvB', label: 'GHV', unit: 'BTU/SCF', format: num() },
];

export const OPS_DAY_GROUP_HEADERS: GroupHeader[] = [
  { label: '', span: 1 },
  { label: 'Metering A', span: 5 },
  { label: 'Metering B', span: 5 },
];

function summaryFields(): FieldSpec[] {
  return [
    { key: 'totalFlowConsumptionMscf', label: 'Totalizer Flow Consumption', unit: 'MSCF', format: num() },
    { key: 'totalEnergyFlowMmbtu', label: 'Totalizer Energy Flow', unit: 'MMBTU', format: num() },
    { key: 'flowrateHighestMscf', label: 'Flowrate Variance — Higest', unit: 'MSCF', format: num() },
    { key: 'flowrateLowestMscf', label: 'Flowrate Variance — Lowest', unit: 'MSCF', format: num() },
    { key: 'flowrateAverageMscf', label: 'Flowrate Variance — Average', unit: 'MSCF', format: num() },
    { key: 'pressureSupplyAvgBar', label: 'Pressure Supply', unit: 'Bar', format: num() },
    { key: 'temperatureAvgC', label: 'Temperature', unit: '°C', format: num() },
    { key: 'densityAvgKgM3', label: 'Density', unit: 'Kg/m³', format: num() },
    { key: 'ghvAvgBtuScf', label: 'Gross Heating Value', unit: 'BTU/SCF', format: num() },
  ];
}

export const OPS_METERING_A_SUMMARY_FIELDS: FieldSpec[] = summaryFields();
export const OPS_METERING_B_SUMMARY_FIELDS: FieldSpec[] = summaryFields();
