// src/cmms-monthly-report/dao/calculationDeliveryDao.ts
//
// PURPOSE
//   Aggregation-only DAO for Calculation Delivery Gas (P6) — no new table.
//   Reproduces the source workbook's exact P6 formulas (verified via direct
//   xlsx cell inspection, P6!G12:H16): monthly SUM of Meter A/B Floboss
//   volume+energy (gas_metering_ledger_daily.daily_cvol_mmcf_a/b,
//   daily_mmbtu_a/b — same fields FlobossMeteringView.tsx already displays
//   as "Vol"/"Energy"), monthly AVERAGE GHV, minus manual corrections.
//   Corrections (P6!G13/H13 "Koreksi*", G14/H14 "Koreksi**") are literal 0
//   in the source workbook itself this month — no correction-delta field
//   exists anywhere in gas_metering_ledger_daily to back them with real
//   data, so they stay hardcoded 0 here too (no new schema, HJ decision).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface CalculationDeliveryRow {
  reportMonth: string;
  meterReadingVolMscf: number | null;
  meterReadingEnergyMmbtu: number | null;
  avgGhvBtuScf: number | null;
  correctionBVolMscf: number;
  correctionBEnergyMmbtu: number;
  correctionCVolMscf: number;
  correctionCEnergyMmbtu: number;
  deliveredVolMscf: number | null;
  deliveredEnergyMmbtu: number | null;
  chargedEnergyMmbtu: number | null;
}

interface SumRow {
  vol_mmcf_sum: number | null;
  mmbtu_sum: number | null;
  ghv_avg: number | null;
}

const SELECT_MONTH_TOTALS_SQL = `
  SELECT
    SUM(daily_cvol_mmcf_a) + SUM(daily_cvol_mmcf_b) AS vol_mmcf_sum,
    SUM(daily_mmbtu_a) + SUM(daily_mmbtu_b) AS mmbtu_sum,
    AVG(ghv_station) AS ghv_avg
  FROM gas_metering_ledger_daily
  WHERE meter_source = 'GC_REPORT' AND report_date LIKE @monthPrefix
`;

/** P6 "Calculation Delivery Gas" monthly totals, derived entirely from already-seeded gas_metering_ledger_daily (no new schema). */
export function getCalculationDeliveryForMonth(db: SqlExecutor, reportMonth: string): CalculationDeliveryRow {
  const row = db.get<SumRow>(SELECT_MONTH_TOTALS_SQL, { monthPrefix: `${reportMonth}%` });
  const volMmcf = row?.vol_mmcf_sum ?? null;
  const meterReadingVolMscf = volMmcf === null ? null : volMmcf * 1000;
  const meterReadingEnergyMmbtu = row?.mmbtu_sum ?? null;

  return {
    reportMonth,
    meterReadingVolMscf,
    meterReadingEnergyMmbtu,
    avgGhvBtuScf: row?.ghv_avg ?? null,
    correctionBVolMscf: 0,
    correctionBEnergyMmbtu: 0,
    correctionCVolMscf: 0,
    correctionCEnergyMmbtu: 0,
    deliveredVolMscf: meterReadingVolMscf,
    deliveredEnergyMmbtu: meterReadingEnergyMmbtu,
    chargedEnergyMmbtu: meterReadingEnergyMmbtu,
  };
}
