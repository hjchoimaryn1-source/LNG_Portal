// src/cmms-monthly-report/dao/gasDeliveryMergedView.ts
//
// PURPOSE
//   Merges P5's three sources (manual exception rows, computed Delivery
//   Vol/Energy, contract-reference DCQ/Nom./Prod. Plan) into one row per
//   report_date, for display/print consumption. Pure function, no DB
//   access of its own — callers already fetched all three via the
//   gas-delivery-manual API. Needed because DCQ/Nom./Prod.Plan/Delivery
//   Vol/Energy are no longer persisted in gas_delivery_daily_manual (P5
//   Stage 2, HJ decision) — any view that iterated `daily` directly for
//   those fields would now show blank.

import type { GasDeliveryDailyManualRow } from './gasDeliveryManualDao';
import type { DeliveryComputedRow } from './gasDeliveryComputedDao';
import type { GasDeliveryContractReferenceRow } from './gasDeliveryContractReferenceDao';

function emptyRow(reportDate: string): GasDeliveryDailyManualRow {
  return {
    reportDate,
    dcqMmscfd: null,
    nomMmscfd: null,
    prodPlanMmscfd: null,
    deliveryVolMmscf: null,
    deliveryEnergyMmbtu: null,
    offSpecVolMmscf: null,
    offSpecEnergyMmbtu: null,
    shortfallVolMmscf: null,
    shortfallEnergyMmbtu: null,
    forceMajeureVolMmscf: null,
    forceMajeureEnergyMmbtu: null,
    maintenanceDayVolMmscf: null,
    maintenanceDayEnergyMmbtu: null,
    underTakeVolMmscf: null,
    underTakeEnergyMmbtu: null,
    excessVolMmscf: null,
    excessEnergyMmbtu: null,
    avgTempC: null,
    avgPressPsig: null,
  };
}

export function mergeGasDeliveryDailyRows(
  daily: GasDeliveryDailyManualRow[],
  computed: DeliveryComputedRow[],
  contractReference: GasDeliveryContractReferenceRow | null
): GasDeliveryDailyManualRow[] {
  const byDate = new Map<string, GasDeliveryDailyManualRow>();
  for (const row of daily) byDate.set(row.reportDate, row);
  for (const c of computed) {
    if (!byDate.has(c.reportDate)) byDate.set(c.reportDate, emptyRow(c.reportDate));
  }

  return [...byDate.values()]
    .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
    .map((row) => {
      const c = computed.find((x) => x.reportDate === row.reportDate);
      return {
        ...row,
        dcqMmscfd: row.dcqMmscfd ?? contractReference?.dcqMmscfd ?? null,
        nomMmscfd: row.nomMmscfd ?? contractReference?.nomMmscfd ?? null,
        prodPlanMmscfd: row.prodPlanMmscfd ?? contractReference?.prodPlanMmscfd ?? null,
        deliveryVolMmscf: c?.deliveryVolMscf ?? null,
        deliveryEnergyMmbtu: c?.deliveryEnergyMmbtu ?? null,
      };
    });
}
