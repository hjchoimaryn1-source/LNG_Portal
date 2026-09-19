import { describe, it, expect } from 'vitest';
import { evaluateAlarmState, worstAlarmPriority } from './evaluateAlarmState';
import type { HmiInstrumentReading } from '../types/hmiCore';

function reading(overrides: Partial<HmiInstrumentReading>): HmiInstrumentReading {
  return {
    tagId: 'TEST-01',
    domain: 'aav',
    columnName: 'temperature_gauge_ds_c',
    instrumentType: 'OTHER',
    value: 0,
    unit: '°C',
    readingStatus: 'other',
    lastUpdatedAt: null,
    alarmPriority: 'NORMAL',
    ...overrides,
  };
}

describe('evaluateAlarmState — AAV DS outlet temperature (NIAS-IS-LS-0004 Rev B: LL=5/L=10, no H/HH)', () => {
  it('CRITICAL at/below LL', () => {
    expect(evaluateAlarmState(reading({ value: 5 }))).toBe('CRITICAL');
    expect(evaluateAlarmState(reading({ value: 4 }))).toBe('CRITICAL');
  });
  it('LOW between LL(exclusive) and L(inclusive)', () => {
    expect(evaluateAlarmState(reading({ value: 5.1 }))).toBe('LOW');
    expect(evaluateAlarmState(reading({ value: 10 }))).toBe('LOW');
  });
  it('NORMAL above L — no H/HH defined, so no upper-bound alarm exists (not an implicit infinite HH)', () => {
    expect(evaluateAlarmState(reading({ value: 10.1 }))).toBe('NORMAL');
    expect(evaluateAlarmState(reading({ value: 1000 }))).toBe('NORMAL');
  });
});

describe('evaluateAlarmState — AAV inlet DP (NIAS-IS-LS-0004: H=0.5 barg, no LL/L/HH)', () => {
  const dpReading = (value: number) => reading({ columnName: 'differential_pressure_us_barg', unit: 'bar', value });

  it('NORMAL below H — no LL/L defined, so no lower-bound alarm exists', () => {
    expect(evaluateAlarmState(dpReading(0))).toBe('NORMAL');
    expect(evaluateAlarmState(dpReading(0.49))).toBe('NORMAL');
  });
  it('HIGH at/above H — no HH defined, so it never escalates to CRITICAL', () => {
    expect(evaluateAlarmState(dpReading(0.5))).toBe('HIGH');
    expect(evaluateAlarmState(dpReading(100))).toBe('HIGH');
  });
});

describe('evaluateAlarmState — AAV upstream (no rule) always NORMAL, never a false CRITICAL', () => {
  it('returns NORMAL for cryogenic inlet temp with no seeded rule', () => {
    expect(evaluateAlarmState(reading({ columnName: 'temperature_gauge_us_c', value: -160 }))).toBe('NORMAL');
  });
});

describe('evaluateAlarmState — ISO Tank pressure_mpa converts to bar before comparing to bar-scale rule', () => {
  const isoReading = (value: number) =>
    reading({ domain: 'iso_tank_unloading_skid', columnName: 'pressure_mpa', unit: 'MPa', value });

  it('1.8 MPa (=18 bar) is CRITICAL (>= HH=18)', () => {
    expect(evaluateAlarmState(isoReading(1.8))).toBe('CRITICAL');
  });
  it('0.9 MPa (=9 bar) is NORMAL (2 < 9 < 15)', () => {
    expect(evaluateAlarmState(isoReading(0.9))).toBe('NORMAL');
  });
  it('0.05 MPa (=0.5 bar) is CRITICAL (<= LL=1)', () => {
    expect(evaluateAlarmState(isoReading(0.05))).toBe('CRITICAL');
  });
});

describe('evaluateAlarmState — cannot-evaluate cases fall back to NORMAL, not a crash or a false alarm', () => {
  it('no rule for domain/columnName combo', () => {
    expect(evaluateAlarmState(reading({ domain: 'metering_train_a', columnName: 'press_barg', value: 999 }))).toBe('NORMAL');
  });
  it('null value', () => {
    expect(evaluateAlarmState(reading({ value: null }))).toBe('NORMAL');
  });
  it('non-numeric string value', () => {
    expect(evaluateAlarmState(reading({ value: 'Belum terbaca' }))).toBe('NORMAL');
  });
});

describe('evaluateAlarmState — HMI-2b-final deadband/hysteresis (previousPriority optional 2nd arg)', () => {
  it('without previousPriority, behaves exactly like the no-hysteresis ladder', () => {
    expect(evaluateAlarmState(reading({ value: 9.7 }))).toBe('LOW');
  });

  it('LOW does not recover to NORMAL by merely re-touching L=10 — needs L + 0.5°C deadband', () => {
    expect(evaluateAlarmState(reading({ value: 10.3 }), 'LOW')).toBe('LOW');
    expect(evaluateAlarmState(reading({ value: 10.5 }), 'LOW')).toBe('LOW');
    expect(evaluateAlarmState(reading({ value: 10.6 }), 'LOW')).toBe('NORMAL');
  });

  it('CRITICAL does not recover to LOW by merely re-touching LL=5 — needs LL + 0.5°C deadband', () => {
    expect(evaluateAlarmState(reading({ value: 5.3 }), 'CRITICAL')).toBe('CRITICAL');
    expect(evaluateAlarmState(reading({ value: 5.6 }), 'CRITICAL')).toBe('LOW');
  });

  it('escalation to a more severe state is immediate — no deadband delay on SET', () => {
    expect(evaluateAlarmState(reading({ value: 10 }), 'NORMAL')).toBe('LOW');
    expect(evaluateAlarmState(reading({ value: 5 }), 'LOW')).toBe('CRITICAL');
  });

  it('pressure columns use 0.1 bar deadband, never the 0.5°C temperature deadband (ISO Tank HIGH at H=15 bar)', () => {
    const isoReading = (value: number) =>
      reading({ domain: 'iso_tank_unloading_skid', columnName: 'pressure_mpa', unit: 'MPa', value });
    expect(evaluateAlarmState(isoReading(1.495), 'HIGH')).toBe('HIGH'); // 14.95 bar — within H(15) - 0.1 deadband
    expect(evaluateAlarmState(isoReading(1.48), 'HIGH')).toBe('NORMAL'); // 14.80 bar — past the deadband
  });
});

describe('worstAlarmPriority', () => {
  it('picks the most severe reading', () => {
    const readings = [reading({ value: 0, alarmPriority: 'NORMAL' }), reading({ value: -160, alarmPriority: 'CRITICAL' })];
    expect(worstAlarmPriority(readings)).toBe('CRITICAL');
  });
  it('is NORMAL for an empty array', () => {
    expect(worstAlarmPriority([])).toBe('NORMAL');
  });
});
