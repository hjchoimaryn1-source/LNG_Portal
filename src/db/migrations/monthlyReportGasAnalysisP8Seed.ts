// src/db/migrations/monthlyReportGasAnalysisP8Seed.ts
//
// PURPOSE
//   Hand-transcribed ground-truth row from "Gas Analysis P8" sheet,
//   `data/Monthly Report Operation Regas - July 2026.xlsx` — every value
//   read directly off cells D13:I22 (component mol fraction), H24 (GHV),
//   H25 (Specific Gravity), G13 (method). Confirmed via direct `xlsx`
//   cellFormula inspection (Monthly Report Step 0, this session): no cell
//   on this sheet carries a formula (`cell.f` absent everywhere) and no
//   date/day dimension exists anywhere on the sheet beyond the report's
//   "as of" print date (E10) — every value is a hardcoded literal,
//   confirming single-monthly-snapshot grain, not a daily series.

import type { GasCompositionSnapshotRow } from '../../cmms-monthly-report/dao/gasCompositionSnapshotDao';

export const GAS_ANALYSIS_P8_SEED_ROW: GasCompositionSnapshotRow = {
  reportMonth: '2026-07',
  asOfDate: '2026-08-01', // sheet cell E10: "Date: 1 August 2026" (report print date)
  method: 'GPA 2261 - 00',
  molMethane: 95.96,
  molEthane: 2.96,
  molPropane: 0.68,
  molIbutane: 0.12,
  molNbutane: 0.14,
  molIpentane: 0,
  molNpentane: 0.01,
  molHexanePlus: 0.22,
  molNitrogen: 0.09,
  molCo2: 0,
  ghvBtuScf: 1054.52,
  specificGravity: 0.58,
};
