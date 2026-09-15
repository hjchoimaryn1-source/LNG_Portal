import { describe, it, expect } from 'vitest';
import { getAlarmThresholds } from './alarmPriorityRules';

describe('alarmPriorityRules', () => {
  it('returns the seeded rule for AAV downstream temperature columns (NIAS-IS-LS-0004 Rev B: LL=5/L=10, no H/HH)', () => {
    expect(getAlarmThresholds('aav', 'temperature_gauge_ds_c')).toEqual({ LL: 5.0, L: 10.0, unit: 'c' });
    expect(getAlarmThresholds('aav', 'temperature_transmitter_ds_c')).toEqual({ LL: 5.0, L: 10.0, unit: 'c' });
  });

  it('returns undefined for AAV upstream (cryogenic) temperature columns — intentional gap, not NORMAL', () => {
    expect(getAlarmThresholds('aav', 'temperature_gauge_us_c')).toBeUndefined();
    expect(getAlarmThresholds('aav', 'temperature_transmitter_us_c')).toBeUndefined();
  });

  it('returns the seeded bar-scale rule for ISO Tank pressure (stored as pressure_mpa)', () => {
    expect(getAlarmThresholds('iso_tank_unloading_skid', 'pressure_mpa')).toEqual({ LL: 1.0, L: 2.0, H: 15.0, HH: 18.0, unit: 'bar' });
    expect(getAlarmThresholds('iso_tank_cargo', 'pressure_mpa')).toEqual({ LL: 1.0, L: 2.0, H: 15.0, HH: 18.0, unit: 'bar' });
  });

  it('returns undefined for domains/columns with no seeded rule (e.g. metering_train_a; NG Buffer Tank columns exist but have no DCS setpoint)', () => {
    expect(getAlarmThresholds('metering_train_a', 'press_barg')).toBeUndefined();
    expect(getAlarmThresholds('aav', 'pressure_gauge_us_bar')).toBeUndefined();
    expect(getAlarmThresholds('ng_buffer_tank', 'pressure_transmitter_barg')).toBeUndefined();
  });

  it('returns the High-only seeded rule for AAV inlet DP (NIAS-IS-LS-0004: H=0.5 barg, no LL/L/HH)', () => {
    expect(getAlarmThresholds('aav', 'differential_pressure_us_barg')).toEqual({ H: 0.5, unit: 'bar' });
  });
});
