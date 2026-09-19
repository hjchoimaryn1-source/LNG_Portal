import { describe, it, expect } from 'vitest';
import { resolveNiasInitialView } from './resolveNiasInitialView';

describe('resolveNiasInitialView', () => {
  it('an explicit initialDomain always wins over initialSubTab-based inference', () => {
    const result = resolveNiasInitialView({ initialDomain: 'REGAS_SYSTEM', initialSubTab: 'TANK_OVERVIEW' });
    expect(result.domain).toBe('REGAS_SYSTEM');
  });

  it('infers TERMINAL_OVERVIEW domain from any of its known subTab aliases', () => {
    for (const alias of ['TERMINAL_OVERVIEW', 'NIAS_TERMINAL_OVERVIEW', 'OPERATIONAL_OVERVIEW']) {
      expect(resolveNiasInitialView({ initialSubTab: alias }).domain).toBe('TERMINAL_OVERVIEW');
    }
  });

  it('infers REGAS_SYSTEM domain from any of its known subTab aliases', () => {
    for (const alias of ['GAS_PROCESS_TELEMETRY', 'PATROL_LOG', 'HEAT_SETTLEMENT', 'ACTIVE_REGAS']) {
      expect(resolveNiasInitialView({ initialSubTab: alias }).domain).toBe('REGAS_SYSTEM');
    }
  });

  it('falls back to ISO_TANK_MGMT domain for an unrecognized subTab', () => {
    expect(resolveNiasInitialView({ initialSubTab: 'SOME_UNKNOWN_TAB' }).domain).toBe('ISO_TANK_MGMT');
  });

  it('resolves each tank sub-tab alias group to its canonical tankSubTab', () => {
    expect(resolveNiasInitialView({ initialSubTab: 'BAY_MOUNTED_TANKS' }).tankSubTab).toBe('ACTIVE_BAY_TANKS');
    expect(resolveNiasInitialView({ initialSubTab: 'EMPTY_RETURN' }).tankSubTab).toBe('LAYDOWN_3_HEEL');
  });

  it('falls back to TANK_OVERVIEW tankSubTab for an unrecognized subTab', () => {
    expect(resolveNiasInitialView({ initialSubTab: 'SOME_UNKNOWN_TAB' }).tankSubTab).toBe('TANK_OVERVIEW');
  });

  it('resolves each regas sub-tab alias group to its canonical regasSubTab', () => {
    expect(resolveNiasInitialView({ initialSubTab: 'NIAS_PATROL_LOG' }).regasSubTab).toBe('PATROL_LOG');
    expect(resolveNiasInitialView({ initialSubTab: 'NIAS_GAS_METERING_DAILY' }).regasSubTab).toBe('GAS_METERING_DAILY');
    expect(resolveNiasInitialView({ initialSubTab: 'HEAT_SETTLEMENT' }).regasSubTab).toBe('CUSTODY_HEAT_SETTLEMENT');
  });

  it('ISO Tank & Mass Balance relocation: LAYDOWN_1_2_LOG/TANK_MASS_BALANCE now resolve into REGAS_SYSTEM/regasSubTab, not ISO_TANK_MGMT/tankSubTab', () => {
    const laydown = resolveNiasInitialView({ initialSubTab: 'DAILY_LOG_DEPRESS' });
    expect(laydown.domain).toBe('REGAS_SYSTEM');
    expect(laydown.regasSubTab).toBe('LAYDOWN_1_2_LOG');

    const massBalance = resolveNiasInitialView({ initialSubTab: 'MASS_BALANCE' });
    expect(massBalance.domain).toBe('REGAS_SYSTEM');
    expect(massBalance.regasSubTab).toBe('TANK_MASS_BALANCE');
  });

  it('falls back to GAS_PROCESS_TELEMETRY regasSubTab for an unrecognized subTab', () => {
    expect(resolveNiasInitialView({ initialSubTab: 'SOME_UNKNOWN_TAB' }).regasSubTab).toBe('GAS_PROCESS_TELEMETRY');
  });
});
