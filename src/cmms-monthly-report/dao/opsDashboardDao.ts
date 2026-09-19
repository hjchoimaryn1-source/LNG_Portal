// src/cmms-monthly-report/dao/opsDashboardDao.ts
//
// PURPOSE
//   Aggregation-only DAO for the Monthly Report Ops. dashboard's Metering
//   A/B block — no new table. Reads gas_metering_ledger_daily directly and
//   derives the sheet's Higest/Lowest/Average/Pressure Supply/Temperature/
//   Density/GHV summary boxes via the exact SUM/MAX/MIN/AVERAGE formulas
//   verified in the source workbook (Monthly Report Ops.!F14:F24, M14:M24).
//
//   SCOPE NOTE: the sheet's "Unloading LNG Iso tank" / On-Site-On-Ship
//   logistics sub-block (columns AA-AH, cross-referencing far cells like
//   BS44/BR45/BU55) was not reverse-engineerable with confidence at this
//   stage's investigation depth — deferred, not fabricated. Only the
//   Metering A/B block (day-column + summary) is implemented here.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface OpsMeteringDayRow {
  reportDate: string;
  nettVolumeMscfA: number | null;
  pressureBarA: number | null;
  temperatureCA: number | null;
  densityKgM3A: number | null;
  ghvA: number | null;
  nettVolumeMscfB: number | null;
  pressureBarB: number | null;
  temperatureCB: number | null;
  densityKgM3B: number | null;
  ghvB: number | null;
}

export interface OpsMeteringSummary {
  totalFlowConsumptionMscf: number | null;
  totalEnergyFlowMmbtu: number | null;
  flowrateHighestMscf: number | null;
  flowrateLowestMscf: number | null;
  flowrateAverageMscf: number | null;
  pressureSupplyAvgBar: number | null;
  temperatureAvgC: number | null;
  densityAvgKgM3: number | null;
  ghvAvgBtuScf: number | null;
}

interface OpsDayRawRow {
  report_date: string;
  daily_cvol_mmcf_a: number | null;
  press_barg_a: number | null;
  temp_c_a: number | null;
  line_dens_kg_m3_a: number | null;
  ghv_a: number | null;
  daily_cvol_mmcf_b: number | null;
  press_barg_b: number | null;
  temp_c_b: number | null;
  line_dens_kg_m3_b: number | null;
  ghv_b: number | null;
}

const SELECT_OPS_DAY_SQL = `
  SELECT
    report_date,
    daily_cvol_mmcf_a, press_barg_a, temp_c_a, line_dens_kg_m3_a, ghv_a,
    daily_cvol_mmcf_b, press_barg_b, temp_c_b, line_dens_kg_m3_b, ghv_b
  FROM gas_metering_ledger_daily
  WHERE meter_source = 'GC_REPORT' AND report_date LIKE @monthPrefix
  ORDER BY report_date
`;

function mmcfToMscf(v: number | null): number | null {
  return v === null ? null : v * 1000;
}

export function getOpsMeteringDaysForMonth(db: SqlExecutor, reportMonth: string): OpsMeteringDayRow[] {
  const rows = db.all<OpsDayRawRow>(SELECT_OPS_DAY_SQL, { monthPrefix: `${reportMonth}%` });
  return rows.map((r) => ({
    reportDate: r.report_date,
    nettVolumeMscfA: mmcfToMscf(r.daily_cvol_mmcf_a),
    pressureBarA: r.press_barg_a,
    temperatureCA: r.temp_c_a,
    densityKgM3A: r.line_dens_kg_m3_a,
    ghvA: r.ghv_a,
    nettVolumeMscfB: mmcfToMscf(r.daily_cvol_mmcf_b),
    pressureBarB: r.press_barg_b,
    temperatureCB: r.temp_c_b,
    densityKgM3B: r.line_dens_kg_m3_b,
    ghvB: r.ghv_b,
  }));
}

function summarize(
  volumes: (number | null)[],
  pressures: (number | null)[],
  temps: (number | null)[],
  densities: (number | null)[],
  ghvs: (number | null)[]
): OpsMeteringSummary {
  const nums = (arr: (number | null)[]) => arr.filter((v): v is number => v !== null);
  const sum = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) : null);
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : null);
  const min = (arr: number[]) => (arr.length ? Math.min(...arr) : null);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  const vols = nums(volumes);
  const totalFlow = sum(vols);
  return {
    totalFlowConsumptionMscf: totalFlow,
    totalEnergyFlowMmbtu: totalFlow === null ? null : (totalFlow * 35.315 * 1038.1) / 1000000,
    flowrateHighestMscf: max(vols),
    flowrateLowestMscf: min(vols),
    flowrateAverageMscf: avg(vols),
    pressureSupplyAvgBar: avg(nums(pressures)),
    temperatureAvgC: avg(nums(temps)),
    densityAvgKgM3: avg(nums(densities)),
    ghvAvgBtuScf: avg(nums(ghvs)),
  };
}

export function getOpsMeteringSummaryForMonth(days: OpsMeteringDayRow[]): {
  meterA: OpsMeteringSummary;
  meterB: OpsMeteringSummary;
} {
  return {
    meterA: summarize(
      days.map((d) => d.nettVolumeMscfA),
      days.map((d) => d.pressureBarA),
      days.map((d) => d.temperatureCA),
      days.map((d) => d.densityKgM3A),
      days.map((d) => d.ghvA)
    ),
    meterB: summarize(
      days.map((d) => d.nettVolumeMscfB),
      days.map((d) => d.pressureBarB),
      days.map((d) => d.temperatureCB),
      days.map((d) => d.densityKgM3B),
      days.map((d) => d.ghvB)
    ),
  };
}
