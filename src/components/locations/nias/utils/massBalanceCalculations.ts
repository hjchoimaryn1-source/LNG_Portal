// src/components/locations/nias/utils/massBalanceCalculations.ts
//
// PURPOSE
//   Pure aggregation for the rebuilt Mass Balance tab — no React
//   (AGENTS.md §3 Logic/Data Layer). Groups iso_tank_daily_readings rows
//   by tank (latest reading = current status, SUM(losses_kg) across the
//   month = that tank's Total BOG Loss) and rolls up the month-wide KPIs.
//
//   Net Usable Stock (Arun cert. seed stage, this session):
//     Net Usable Stock = Arun Latest Batch Inbound Stock (Kg)
//                         - Total Gas Consumed (Kg)
//                         - Total Yard BOG Loss (Kg)
//   - Arun Latest Batch Inbound Stock: SUM(loaded_lng_weight_kg) from
//     arun_lng_delivery_certificate, grouped by shipment, for whichever
//     shipment has the most recent cert_date (not a hardcoded "N-1" or a
//     lexicographic max on the shipment string, which breaks for e.g.
//     "N-10" vs "N-2" — cert_date is the only reliable "latest" signal in
//     this data).
//   - Total Gas Consumed: SUM(consumedKg) from iso_tank_consumption_monthly
//     for the selected report month — confirmed this is the only
//     "consumed" source in the schema. KNOWN GAP: this table is a single
//     snapshot per (report_date, iso_tank_no), not a cumulative-since-
//     batch-arrival total, and the batch arrived December 2025 while this
//     snapshot is dated July 2026 — any consumption in that ~7-month gap
//     is not captured. Currently the source CSV itself has consumed_kg=0
//     for every row (verified directly, not a parser bug), so this term
//     is 0 in practice today; report this explicitly rather than treating
//     the formula's output as authoritative.

import type { IsoTankDailyReadingRow } from '../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import type { IsoTankConsumptionRow } from '../../../../cmms-monthly-report/dao/isoTankConsumptionDao';
import type { ArunLngDeliveryCertificateRow } from '../../../../cmms-monthly-report/dao/arunLngDeliveryCertificateDao';

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
  arunLatestShipment: string | null;
  arunInboundStockKg: number;
  totalConsumedKg: number;
  netUsableStockKg: number;
}

export interface ArunLatestBatchInbound {
  shipment: string | null;
  totalKg: number;
}

/** Groups certificate rows by shipment, picks the shipment with the most recent cert_date, sums its loaded_lng_weight_kg. */
export function computeArunLatestBatchInboundKg(certificates: ArunLngDeliveryCertificateRow[]): ArunLatestBatchInbound {
  if (certificates.length === 0) return { shipment: null, totalKg: 0 };

  const maxDateByShipment = new Map<string, string>();
  for (const r of certificates) {
    if (!r.certDate) continue;
    const cur = maxDateByShipment.get(r.shipment);
    if (!cur || r.certDate > cur) maxDateByShipment.set(r.shipment, r.certDate);
  }

  let latestShipment: string | null = null;
  let latestDate = '';
  for (const [shipment, date] of maxDateByShipment) {
    if (date > latestDate) {
      latestDate = date;
      latestShipment = shipment;
    }
  }

  const totalKg = certificates
    .filter((r) => r.shipment === latestShipment)
    .reduce((sum, r) => sum + (r.loadedLngWeightKg ?? 0), 0);

  return { shipment: latestShipment, totalKg };
}

export function computeMassBalanceMetrics(
  rows: MassBalanceTankRow[],
  consumption: IsoTankConsumptionRow[],
  certificates: ArunLngDeliveryCertificateRow[]
): MassBalanceMetrics {
  const totalBogLossKg = rows.reduce((sum, r) => sum + r.monthlyBogLossKg, 0);
  const totalConsumedKg = consumption.reduce((sum, r) => sum + (r.consumedKg ?? 0), 0);
  const arunInbound = computeArunLatestBatchInboundKg(certificates);

  return {
    tankCount: rows.length,
    totalBogLossKg,
    overpressureCount: rows.filter((r) => r.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED').length,
    arunLatestShipment: arunInbound.shipment,
    arunInboundStockKg: arunInbound.totalKg,
    totalConsumedKg,
    netUsableStockKg: arunInbound.totalKg - totalConsumedKg - totalBogLossKg,
  };
}
