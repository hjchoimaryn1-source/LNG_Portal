import { describe, it, expect } from 'vitest';
import { getAlarmThresholds } from './alarmPriorityRules';

describe('alarmPriorityRules', () => {
  it('returns the seeded rule for AAV downstream temperature columns', () => {
    expect(getAlarmThresholds('aav', 'temperature_gauge_ds_c')).toEqual({ LL: -140.0, L: -120.0, H: 35.0, HH: 45.0, unit: 'c' });
    expect(getAlarmThresholds('aav', 'temperature_transmitter_ds_c')).toEqual({ LL: -140.0, L: -120.0, H: 35.0, HH: 45.0, unit: 'c' });
  });

  it('returns undefined for AAV upstream (cryogenic) temperature columns — intentional gap, not NORMAL', () => {
    expect(getAlarmThresholds('aav', 'temperature_gauge_us_c')).toBeUndefined();
    expect(getAlarmThresholds('aav', 'temperature_transmitter_us_c')).toBeUndefined();
  });

  it('returns the seeded bar-scale rule for ISO Tank pressure (stored as pressure_mpa)', () => {
    expect(getAlarmThresholds('iso_tank_unloading_skid', 'pressure_mpa')).toEqual({ LL: 1.0, L: 2.0, H: 15.0, HH: 18.0, unit: 'bar' });
    expect(getAlarmThresholds('iso_tank_cargo', 'pressure_mpa')).toEqual({ LL: 1.0, L: 2.0, H: 15.0, HH: 18.0, unit: 'bar' });
  });

  it('returns undefined for domains/columns with no seeded rule (e.g. metering_train_a, NG Buffer Tank has no column at all)', () => {
    expect(getAlarmThresholds('metering_train_a', 'press_barg')).toBeUndefined();
    expect(getAlarmThresholds('aav', 'pressure_gauge_us_bar')).toBeUndefined();
  });
});
