import { describe, it, expect } from 'vitest';
import {
  buildIsoTankUnloadingSkidDomain,
  buildIsoTankCargoDomain,
  buildIsoTankCargoSummary,
} from './isoTankPrintMapper';
import type { DailyMasterRecord } from '../../types/lng';

const REPORT_DATE = '2026-09-14';

function record(overrides: Partial<DailyMasterRecord>): DailyMasterRecord {
  return {
    reportDate: REPORT_DATE,
    serialNo: 'SIMU-0000',
    tankNo: 'ISOT-000',
    shipment: 'N1',
    position: 'Laydown 1',
    level: 80,
    levelM3: 20,
    levelMmH2O: 460,
    battery: 90,
    pressureMPa: 0.7,
    tempC: -126,
    depress: 'Normal',
    pressBeforeMPa: 0.7,
    pressAfterMPa: 0.7,
    remarks: '',
    ...overrides,
  };
}

describe('buildIsoTankUnloadingSkidDomain', () => {
  it('maps Bay 01~04 positions to T-201~204 and forces battery_iot_pct null', () => {
    const records = [
      record({ tankNo: 'ISOT-101', position: 'Bay 01', level: 55, levelMmH2O: 400, levelM3: 18, pressureMPa: 0.65, tempC: -128, battery: 100 }),
      record({ tankNo: 'ISOT-102', position: 'Bay 03', level: 60, levelMmH2O: 410, levelM3: 19, pressureMPa: 0.6, tempC: -127, battery: 100 }),
      record({ tankNo: 'ISOT-999', position: 'Laydown 1' }), // not a bay — must not leak into skid domain
    ];

    const domain = buildIsoTankUnloadingSkidDomain(records, REPORT_DATE);

    expect(domain['T-201']).toEqual({
      level_iot_pct: 55,
      level_gauge_mmh2o: 400,
      volume_m3: 18,
      battery_iot_pct: null,
      pressure_mpa: 0.65,
      temperature_c: -128,
    });
    expect(domain['T-203']?.pressure_mpa).toBe(0.6);
    expect(domain['T-202']).toBeNull(); // no Bay 02 record that day
    expect(domain['T-204']).toBeNull();
  });

  it('ignores records from a different report date', () => {
    const records = [record({ position: 'Bay 01', reportDate: '2026-09-01' })];
    const domain = buildIsoTankUnloadingSkidDomain(records, REPORT_DATE);
    expect(domain['T-201']).toBeNull();
  });
});

describe('buildIsoTankCargoDomain', () => {
  it('keys every same-day record by tankNo and keeps the real battery reading', () => {
    const records = [
      record({ tankNo: 'ISOT-014', position: 'Laydown 1', battery: 82 }),
      record({ tankNo: 'ISOT-015', position: 'Laydown 2', battery: 91 }),
    ];
    const domain = buildIsoTankCargoDomain(records, REPORT_DATE);
    expect(Object.keys(domain)).toEqual(['ISOT-014', 'ISOT-015']);
    expect(domain['ISOT-014'].battery_iot_pct).toBe(82);
    expect(domain['ISOT-015'].battery_iot_pct).toBe(91);
  });
});

describe('buildIsoTankCargoSummary', () => {
  it('classifies Laydown 2 as EMPTY and everything else as LADEN, summing volume / averaging press+temp', () => {
    const records = [
      record({ tankNo: 'A', position: 'Laydown 1', levelM3: 20, pressureMPa: 0.7, tempC: -126 }),
      record({ tankNo: 'B', position: 'Bay 02', levelM3: 18, pressureMPa: 0.6, tempC: -128 }),
      record({ tankNo: 'C', position: 'Laydown 2', levelM3: 2, pressureMPa: 0.2, tempC: -120 }),
    ];

    const summary = buildIsoTankCargoSummary(records, REPORT_DATE);

    expect(summary.laden.count).toBe(2);
    expect(summary.laden.totalStockM3).toBe(38);
    expect(summary.laden.avgPressureMPa).toBeCloseTo(0.65);
    expect(summary.laden.avgTempC).toBe(-127);

    expect(summary.empty).toEqual({
      count: 1,
      totalStockM3: 2,
      avgPressureMPa: 0.2,
      avgTempC: -120,
    });
  });

  it('returns zeroed groups when there is no data for that report date', () => {
    const summary = buildIsoTankCargoSummary([], REPORT_DATE);
    expect(summary.laden).toEqual({ count: 0, totalStockM3: 0, avgPressureMPa: 0, avgTempC: 0 });
    expect(summary.empty).toEqual({ count: 0, totalStockM3: 0, avgPressureMPa: 0, avgTempC: 0 });
  });
});
