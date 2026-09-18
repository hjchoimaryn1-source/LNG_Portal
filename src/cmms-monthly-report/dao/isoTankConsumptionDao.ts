// src/cmms-monthly-report/dao/isoTankConsumptionDao.ts
//
// PURPOSE
//   Read/write DAO for iso_tank_consumption_monthly (Consumption ISOTank
//   sheet source, per (report_date, iso_tank_no) snapshot). HJ-confirmed:
//   its tank roster is NOT reconciled against iso_tank_daily_readings —
//   the two sheets legitimately differ (ISOT-064 only in daily readings).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface IsoTankConsumptionRow {
  reportDate: string;
  isoTankNo: string;
  serialNo: string | null;
  shipment: string | null;
  weightAwalKg: number | null;
  heatingValueBtuKg: number | null;
  stockAwalM3: number | null;
  stockAwalKg: number | null;
  stockAkhirM3: number | null;
  stockAkhirKg: number | null;
  netConsumedM3: number | null;
  consumedKg: number | null;
  consumedMmbtu: number | null;
  densityKgM3: number | null;
  lossesKg: number | null;
  lossesPct: number | null;
  remarks: string | null;
}

interface IsoTankConsumptionSqlRow {
  report_date: string;
  iso_tank_no: string;
  serial_no: string | null;
  shipment: string | null;
  weight_awal_kg: number | null;
  heating_value_btu_kg: number | null;
  stock_awal_m3: number | null;
  stock_awal_kg: number | null;
  stock_akhir_m3: number | null;
  stock_akhir_kg: number | null;
  net_consumed_m3: number | null;
  consumed_kg: number | null;
  consumed_mmbtu: number | null;
  density_kg_m3: number | null;
  losses_kg: number | null;
  losses_pct: number | null;
  remarks: string | null;
}

function rowFromSql(row: IsoTankConsumptionSqlRow): IsoTankConsumptionRow {
  return {
    reportDate: row.report_date,
    isoTankNo: row.iso_tank_no,
    serialNo: row.serial_no,
    shipment: row.shipment,
    weightAwalKg: row.weight_awal_kg,
    heatingValueBtuKg: row.heating_value_btu_kg,
    stockAwalM3: row.stock_awal_m3,
    stockAwalKg: row.stock_awal_kg,
    stockAkhirM3: row.stock_akhir_m3,
    stockAkhirKg: row.stock_akhir_kg,
    netConsumedM3: row.net_consumed_m3,
    consumedKg: row.consumed_kg,
    consumedMmbtu: row.consumed_mmbtu,
    densityKgM3: row.density_kg_m3,
    lossesKg: row.losses_kg,
    lossesPct: row.losses_pct,
    remarks: row.remarks,
  };
}

export function upsertIsoTankConsumption(db: SqlExecutor, row: IsoTankConsumptionRow): void {
  db.run(
    `INSERT INTO iso_tank_consumption_monthly (
       report_date, iso_tank_no, serial_no, shipment, weight_awal_kg,
       heating_value_btu_kg, stock_awal_m3, stock_awal_kg, stock_akhir_m3,
       stock_akhir_kg, net_consumed_m3, consumed_kg, consumed_mmbtu,
       density_kg_m3, losses_kg, losses_pct, remarks
     ) VALUES (
       @reportDate, @isoTankNo, @serialNo, @shipment, @weightAwalKg,
       @heatingValueBtuKg, @stockAwalM3, @stockAwalKg, @stockAkhirM3,
       @stockAkhirKg, @netConsumedM3, @consumedKg, @consumedMmbtu,
       @densityKgM3, @lossesKg, @lossesPct, @remarks
     )
     ON CONFLICT(report_date, iso_tank_no) DO UPDATE SET
       serial_no = excluded.serial_no, shipment = excluded.shipment,
       weight_awal_kg = excluded.weight_awal_kg, heating_value_btu_kg = excluded.heating_value_btu_kg,
       stock_awal_m3 = excluded.stock_awal_m3, stock_awal_kg = excluded.stock_awal_kg,
       stock_akhir_m3 = excluded.stock_akhir_m3, stock_akhir_kg = excluded.stock_akhir_kg,
       net_consumed_m3 = excluded.net_consumed_m3, consumed_kg = excluded.consumed_kg,
       consumed_mmbtu = excluded.consumed_mmbtu, density_kg_m3 = excluded.density_kg_m3,
       losses_kg = excluded.losses_kg, losses_pct = excluded.losses_pct, remarks = excluded.remarks`,
    { ...row }
  );
}

/** All consumption snapshot rows for a given report month ('YYYY-MM'). */
export function getIsoTankConsumptionForMonth(db: SqlExecutor, reportMonth: string): IsoTankConsumptionRow[] {
  const rows = db.all<IsoTankConsumptionSqlRow>(
    `SELECT * FROM iso_tank_consumption_monthly
     WHERE report_date LIKE @monthPrefix
     ORDER BY iso_tank_no`,
    { monthPrefix: `${reportMonth}%` }
  );
  return rows.map(rowFromSql);
}
