// src/cmms-monthly-report/dao/gasDeliveryComputedDao.ts
//
// PURPOSE
//   Read-time computation for P5's auto-populated Delivery Vol/Energy —
//   per report_date, SUM(daily_cvol_mmcf_a, daily_cvol_mmcf_b) x 1000
//   (MSCF) / SUM(daily_mmbtu_a, daily_mmbtu_b) (MMBTU). Same A+B-sum
//   convention as calculationDeliveryDao.ts (P6) rather than the
//   daily_*_station columns, which have more null gaps than A+B summed
//   individually (verified: 2026-07-27 has real daily_mmbtu_a/b but
//   daily_mmbtu_station is NULL). NOT stored in gas_delivery_daily_manual —
//   computed fresh on every GET (HJ decision, no redundant persistence).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface DeliveryComputedRow {
  reportDate: string;
  deliveryVolMscf: number | null;
  deliveryEnergyMmbtu: number | null;
}

interface RawRow {
  report_date: string;
  daily_cvol_mmcf_a: number | null;
  daily_cvol_mmcf_b: number | null;
  daily_mmbtu_a: number | null;
  daily_mmbtu_b: number | null;
}

function sumOrNull(a: number | null, b: number | null): number | null {
  return a === null && b === null ? null : (a ?? 0) + (b ?? 0);
}

/** Per-day Delivery Vol (MSCF) / Delivery Energy (MMBTU), derived from already-seeded gas_metering_ledger_daily — no new schema. */
export function getDeliveryComputedForMonth(db: SqlExecutor, reportMonth: string): DeliveryComputedRow[] {
  const rows = db.all<RawRow>(
    `SELECT report_date, daily_cvol_mmcf_a, daily_cvol_mmcf_b, daily_mmbtu_a, daily_mmbtu_b
     FROM gas_metering_ledger_daily
     WHERE meter_source = 'GC_REPORT' AND report_date LIKE @monthPrefix
     ORDER BY report_date`,
    { monthPrefix: `${reportMonth}%` }
  );
  return rows.map((r) => {
    const vol = sumOrNull(r.daily_cvol_mmcf_a, r.daily_cvol_mmcf_b);
    return {
      reportDate: r.report_date,
      deliveryVolMscf: vol === null ? null : vol * 1000,
      deliveryEnergyMmbtu: sumOrNull(r.daily_mmbtu_a, r.daily_mmbtu_b),
    };
  });
}
