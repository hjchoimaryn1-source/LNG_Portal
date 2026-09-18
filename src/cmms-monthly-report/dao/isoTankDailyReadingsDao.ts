// src/cmms-monthly-report/dao/isoTankDailyReadingsDao.ts
//
// PURPOSE
//   Read/write DAO for iso_tank_daily_readings (Monthly Report ISO Tank
//   sheet source, per (report_date, iso_tank_no)). Domain-agnostic
//   (SqlExecutor only), same pattern as gasMeteringLedgerDao.ts. Live write
//   target for NiasLaydownLogTab.tsx ("ISO TK - LOG") going forward (ISO
//   Tank & Mass Balance relocation stage) — position/lossesKg/lossesPct
//   added to cover its [BOG VENTING] fields (ALTER-ADD, see
//   monthlyReportSchema.ts).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface IsoTankDailyReadingRow {
  reportDate: string;
  isoTankNo: string;
  serialNo: string | null;
  shipment: string | null;
  position: string | null;
  levelPct: number | null;
  levelM3: number | null;
  levelMmh2o: number | null;
  batteryPct: number | null;
  pressureMpa: number | null;
  tempC: number | null;
  depressFlag: string | null;
  pressBeforeMpa: number | null;
  pressAfterMpa: number | null;
  lossesKg: number | null;
  lossesPct: number | null;
  remarks: string | null;
}

interface IsoTankDailyReadingSqlRow {
  report_date: string;
  iso_tank_no: string;
  serial_no: string | null;
  shipment: string | null;
  position: string | null;
  level_pct: number | null;
  level_m3: number | null;
  level_mmh2o: number | null;
  battery_pct: number | null;
  pressure_mpa: number | null;
  temp_c: number | null;
  depress_flag: string | null;
  press_before_mpa: number | null;
  press_after_mpa: number | null;
  losses_kg: number | null;
  losses_pct: number | null;
  remarks: string | null;
}

function rowFromSql(row: IsoTankDailyReadingSqlRow): IsoTankDailyReadingRow {
  return {
    reportDate: row.report_date,
    isoTankNo: row.iso_tank_no,
    serialNo: row.serial_no,
    shipment: row.shipment,
    position: row.position,
    levelPct: row.level_pct,
    levelM3: row.level_m3,
    levelMmh2o: row.level_mmh2o,
    batteryPct: row.battery_pct,
    pressureMpa: row.pressure_mpa,
    tempC: row.temp_c,
    depressFlag: row.depress_flag,
    pressBeforeMpa: row.press_before_mpa,
    pressAfterMpa: row.press_after_mpa,
    lossesKg: row.losses_kg,
    lossesPct: row.losses_pct,
    remarks: row.remarks,
  };
}

export function upsertIsoTankDailyReading(db: SqlExecutor, row: IsoTankDailyReadingRow): void {
  db.run(
    `INSERT INTO iso_tank_daily_readings (
       report_date, iso_tank_no, serial_no, shipment, position, level_pct, level_m3,
       level_mmh2o, battery_pct, pressure_mpa, temp_c, depress_flag,
       press_before_mpa, press_after_mpa, losses_kg, losses_pct, remarks
     ) VALUES (
       @reportDate, @isoTankNo, @serialNo, @shipment, @position, @levelPct, @levelM3,
       @levelMmh2o, @batteryPct, @pressureMpa, @tempC, @depressFlag,
       @pressBeforeMpa, @pressAfterMpa, @lossesKg, @lossesPct, @remarks
     )
     ON CONFLICT(report_date, iso_tank_no) DO UPDATE SET
       serial_no = excluded.serial_no, shipment = excluded.shipment, position = excluded.position,
       level_pct = excluded.level_pct, level_m3 = excluded.level_m3,
       level_mmh2o = excluded.level_mmh2o, battery_pct = excluded.battery_pct,
       pressure_mpa = excluded.pressure_mpa, temp_c = excluded.temp_c,
       depress_flag = excluded.depress_flag, press_before_mpa = excluded.press_before_mpa,
       press_after_mpa = excluded.press_after_mpa, losses_kg = excluded.losses_kg,
       losses_pct = excluded.losses_pct, remarks = excluded.remarks`,
    { ...row }
  );
}

/** All readings for a given report month ('YYYY-MM'), ordered by tank then date. */
export function getIsoTankDailyReadingsForMonth(db: SqlExecutor, reportMonth: string): IsoTankDailyReadingRow[] {
  const rows = db.all<IsoTankDailyReadingSqlRow>(
    `SELECT * FROM iso_tank_daily_readings
     WHERE report_date LIKE @monthPrefix
     ORDER BY iso_tank_no, report_date`,
    { monthPrefix: `${reportMonth}%` }
  );
  return rows.map(rowFromSql);
}
