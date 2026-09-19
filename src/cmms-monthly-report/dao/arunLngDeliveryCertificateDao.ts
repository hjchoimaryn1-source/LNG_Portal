// src/cmms-monthly-report/dao/arunLngDeliveryCertificateDao.ts
//
// PURPOSE
//   Read/write DAO for arun_lng_delivery_certificate — Mass Balance's Net
//   Usable Stock "Arun Latest Batch Inbound Stock" source. Domain-agnostic
//   (SqlExecutor only), same pattern as the other Monthly Report DAOs.
//   Seed-only this stage (arunLngDeliveryCertificateSeedRunner.ts) — no
//   input UI.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface ArunLngDeliveryCertificateRow {
  shipment: string;
  isoTankNo: string;
  serialNo: string | null;
  certDate: string | null;
  weightBeforeKg: number | null;
  weightAfterKg: number | null;
  loadedLngWeightKg: number | null;
  densityKgM3: number | null;
  liquidTempC: number | null;
  ghvBtuKg: number | null;
  gassingUpVolM3: number | null;
  gassingUpEnergyMmbtu: number | null;
  coolingDownTempC: number | null;
  coolingDownVolM3: number | null;
  coolingDownEnergyMmbtu: number | null;
  btuLoadedBtu: number | null;
  btuLoadedMmbtu: number | null;
  volumeLoadedM3: number | null;
  totalDeliveredVolM3: number | null;
  totalEnergyDeliveredMmbtu: number | null;
}

const COLUMNS: Array<[keyof ArunLngDeliveryCertificateRow, string]> = [
  ['shipment', 'shipment'],
  ['isoTankNo', 'iso_tank_no'],
  ['serialNo', 'serial_no'],
  ['certDate', 'cert_date'],
  ['weightBeforeKg', 'weight_before_kg'],
  ['weightAfterKg', 'weight_after_kg'],
  ['loadedLngWeightKg', 'loaded_lng_weight_kg'],
  ['densityKgM3', 'density_kg_m3'],
  ['liquidTempC', 'liquid_temp_c'],
  ['ghvBtuKg', 'ghv_btu_kg'],
  ['gassingUpVolM3', 'gassing_up_vol_m3'],
  ['gassingUpEnergyMmbtu', 'gassing_up_energy_mmbtu'],
  ['coolingDownTempC', 'cooling_down_temp_c'],
  ['coolingDownVolM3', 'cooling_down_vol_m3'],
  ['coolingDownEnergyMmbtu', 'cooling_down_energy_mmbtu'],
  ['btuLoadedBtu', 'btu_loaded_btu'],
  ['btuLoadedMmbtu', 'btu_loaded_mmbtu'],
  ['volumeLoadedM3', 'volume_loaded_m3'],
  ['totalDeliveredVolM3', 'total_delivered_vol_m3'],
  ['totalEnergyDeliveredMmbtu', 'total_energy_delivered_mmbtu'],
];

export function upsertArunLngDeliveryCertificate(db: SqlExecutor, row: ArunLngDeliveryCertificateRow): void {
  const rowAsRecord = row as unknown as Record<string, unknown>;
  const colNames = COLUMNS.map(([, col]) => col);
  const updateSet = colNames
    .filter((c) => c !== 'shipment' && c !== 'iso_tank_no')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  const params: Record<string, unknown> = {};
  for (const [field, col] of COLUMNS) params[col] = rowAsRecord[String(field)] ?? null;

  db.run(
    `INSERT INTO arun_lng_delivery_certificate (${colNames.join(', ')})
     VALUES (${colNames.map((c) => `@${c}`).join(', ')})
     ON CONFLICT(shipment, iso_tank_no) DO UPDATE SET ${updateSet}`,
    params
  );
}

function fromSqlRow(sqlRow: Record<string, unknown>): ArunLngDeliveryCertificateRow {
  const out: Record<string, unknown> = {};
  for (const [field, col] of COLUMNS) out[String(field)] = sqlRow[col] ?? null;
  return out as unknown as ArunLngDeliveryCertificateRow;
}

/** All seeded certificate rows, across every shipment — grouping/latest-shipment logic lives in massBalanceCalculations.ts. */
export function getAllArunLngDeliveryCertificates(db: SqlExecutor): ArunLngDeliveryCertificateRow[] {
  const rows = db.all<Record<string, unknown>>(`SELECT * FROM arun_lng_delivery_certificate ORDER BY shipment, iso_tank_no`);
  return rows.map(fromSqlRow);
}
