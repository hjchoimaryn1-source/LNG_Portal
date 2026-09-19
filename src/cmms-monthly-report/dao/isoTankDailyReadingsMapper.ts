// src/cmms-monthly-report/dao/isoTankDailyReadingsMapper.ts
//
// PURPOSE
//   Pure mapper, DailyMasterRecord (types/lng.ts, NiasLaydownLogTab's save
//   shape) -> IsoTankDailyReadingRow (iso_tank_daily_readings' live write
//   shape). No React (AGENTS.md §3 Logic/Data Layer). Bridges the two
//   domains without either importing the other's types directly.

import type { DailyMasterRecord } from '../../types/lng';
import type { IsoTankDailyReadingRow } from './isoTankDailyReadingsDao';

export function mapDailyMasterRecordToIsoTankReading(record: DailyMasterRecord): IsoTankDailyReadingRow {
  return {
    reportDate: record.reportDate,
    isoTankNo: record.tankNo,
    serialNo: record.serialNo || null,
    shipment: record.shipment || null,
    position: record.position || null,
    levelPct: record.level ?? null,
    levelM3: record.levelM3 ?? null,
    levelMmh2o: record.levelMmH2O ?? null,
    batteryPct: record.battery ?? null,
    pressureMpa: record.pressureMPa ?? null,
    tempC: record.tempC ?? null,
    depressFlag: record.depress || null,
    pressBeforeMpa: record.pressBeforeMPa ?? null,
    pressAfterMpa: record.pressAfterMPa ?? null,
    lossesKg: record.lossesKg ?? null,
    lossesPct: record.lossesPercent ?? null,
    remarks: record.remarks || null,
  };
}
