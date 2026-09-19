// src/cmms-monthly-report/print/configs/flobossColumnSpec.ts
//
// PURPOSE
//   Print column spec for Floboss Metering (P1-P4) — mirrors the exact
//   column set FlobossMeteringView.tsx already renders (Meter A/B, Station
//   Total, GHV, Net Sales), the HJ-confirmed combined presentation for
//   these four source sheets. Plain data only — no React (AGENTS.md §3).

import type { FlobossDailyRow } from '../../../gas-metering/dao/gasMeteringLedgerDao';
import { fmtNum } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { ColumnSpec, GroupHeader } from '../renderers/types';

const num = (v: unknown) => fmtNum(v as number | null | undefined);

export const FLOBOSS_COLUMNS: ColumnSpec<FlobossDailyRow>[] = [
  { key: 'reportDate', label: 'Date' },
  { key: 'dailyCvolMmcfA', label: 'Vol', unit: 'MMCF', format: num },
  { key: 'dailyMmbtuA', label: 'Energy', unit: 'MMBTU', format: num },
  { key: 'dailyCvolMmcfB', label: 'Vol', unit: 'MMCF', format: num },
  { key: 'dailyMmbtuB', label: 'Energy', unit: 'MMBTU', format: num },
  { key: 'dailyCvolMmcfStation', label: 'Vol', unit: 'MMCF', format: num },
  { key: 'dailyMmbtuStation', label: 'Energy', unit: 'MMBTU', format: num },
  { key: 'ghvStation', label: 'Station', unit: 'BTU/SCF', format: num },
  { key: 'ghvManualSample', label: 'Manual Sample', unit: 'BTU/SCF', format: num },
  { key: 'netSalesVolMmscf', label: 'Vol', unit: 'MMSCF', format: num },
  { key: 'netSalesEnergyMmbtu', label: 'Energy', unit: 'MMBTU', format: num },
];

export const FLOBOSS_GROUP_HEADERS: GroupHeader[] = [
  { label: '', span: 1 },
  { label: 'Meter A', span: 2 },
  { label: 'Meter B', span: 2 },
  { label: 'Station Total', span: 2 },
  { label: 'GHV (BTU/SCF)', span: 2 },
  { label: 'Net Sales', span: 2 },
];
