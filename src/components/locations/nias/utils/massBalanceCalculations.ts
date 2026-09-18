// src/components/locations/nias/utils/massBalanceCalculations.ts
//
// PURPOSE
//   Pure aggregation for the rebuilt Mass Balance tab — no React
//   (AGENTS.md §3 Logic/Data Layer). Groups iso_tank_daily_readings rows
//   by tank (latest reading = current status, SUM(losses_kg) across the
//   month = that tank's Total BOG Loss) and rolls up the month-wide KPIs.
//
//   SCOPE NOTE (HJ decision, this session): "Net Usable Stock" needs a
//   "total inbound stock" source that does not exist anywhere live today
//   (iso_tank_consumption_monthly's Opening values are a monthly snapshot,
//   not an arrival-time reading — a real semantic mismatch, not the same
//   thing). Excluded from this stage — the KPI card shows a gap notice
//   instead of a fabricated number. Only Total Yard BOG Loss is computed
//   live here.

import type { IsoTankDailyReadingRow } from '../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';

export interface MassBalanceTankRow {
  isoTankNo: string;
  serialNo: string | null;
  shipment: string | null;
  position: string | null;
  latestReportDate: string;
  levelPct: number | null;
  pressureMpa: number | null;
  tempC: number | null;
  depressFlag: string | null;
  monthlyBogLossKg: number;
  latestBogLossPct: number | null;
  remarks: string | null;
  operationalStatus: 'OVERPRESSURE_VENT_REQUIRED' | 'DEPRESSURIZED' | 'NORMAL';
}

const OVERPRESSURE_LOSS_PCT_THRESHOLD = 5.0;

function resolveStatus(depressFlag: string | null, lossPct: number | null): MassBalanceTankRow['operationalStatus'] {
  if (lossPct !== null && lossPct > OVERPRESSURE_LOSS_PCT_THRESHOLD) return 'OVERPRESSURE_VENT_REQUIRED';
  if (depressFlag && depressFlag.toLowerCase().includes('depress')) return 'DEPRESSURIZED';
  return 'NORMAL';
}

/** Groups readings by tank: latest row for status fields, SUM(losses_kg) across the month for Total BOG Loss. */
export function aggregateMassBalanceRows(readings: IsoTankDailyReadingRow[]): MassBalanceTankRow[] {
  const byTank = new Map<string, IsoTankDailyReadingRow[]>();
  for (const r of readings) {
    const list = byTank.get(r.isoTankNo) ?? [];
    list.push(r);
    byTank.set(r.isoTankNo, list);
  }

  const rows: MassBalanceTankRow[] = [];
  for (const [isoTankNo, tankReadings] of byTank) {
    const sorted = [...tankReadings].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
    const latest = sorted[sorted.length - 1];
    const monthlyBogLossKg = sorted.reduce((sum, r) => sum + (r.lossesKg ?? 0), 0);

    rows.push({
      isoTankNo,
      serialNo: latest.serialNo,
      shipment: latest.shipment,
      position: latest.position,
      latestReportDate: latest.reportDate,
      levelPct: latest.levelPct,
      pressureMpa: latest.pressureMpa,
      tempC: latest.tempC,
      depressFlag: latest.depressFlag,
      monthlyBogLossKg,
      latestBogLossPct: latest.lossesPct,
      remarks: latest.remarks,
      operationalStatus: resolveStatus(latest.depressFlag, latest.lossesPct),
    });
  }

  return rows.sort((a, b) => a.isoTankNo.localeCompare(b.isoTankNo));
}

export interface MassBalanceMetrics {
  tankCount: number;
  totalBogLossKg: number;
  overpressureCount: number;
}

export function computeMassBalanceMetrics(rows: MassBalanceTankRow[]): MassBalanceMetrics {
  return {
    tankCount: rows.length,
    totalBogLossKg: rows.reduce((sum, r) => sum + r.monthlyBogLossKg, 0),
    overpressureCount: rows.filter((r) => r.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED').length,
  };
}
