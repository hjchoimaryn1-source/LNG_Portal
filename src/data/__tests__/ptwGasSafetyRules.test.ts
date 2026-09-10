// src/data/__tests__/ptwGasSafetyRules.test.ts
// Boundary-value tests for the universal O2/H2S/CO gas-safety gate
// (SSHQE_MASTER_SPECIFICATION.md §4.3) and its integration into
// validatePTWGasSafety(). See PTW_AUDIT_REPORT_2026-09-08.md §3/§7 (#2, #3).

import { describe, it, expect } from 'vitest';
import type { PTWPermit } from '../../types/lng';
import { checkUniversalGasBands } from '../ptwGasSafetyRules';
import { validatePTWGasSafety } from '../ptwMasterData';

function buildGasReadings(overrides?: Partial<PTWPermit['gasReadings']>): PTWPermit['gasReadings'] {
  return {
    lelPercent: 0,
    o2Percent: 20.9,
    h2sPpm: 0,
    coPpm: 0,
    testedAt: '2026-01-01T00:00:00.000Z',
    isSafeForWork: true,
    ...overrides,
  };
}

describe('checkUniversalGasBands', () => {
  it('passes at safe baseline', () => {
    expect(checkUniversalGasBands(buildGasReadings()).isSafe).toBe(true);
  });

  it('fails at O2 below 19.5%', () => {
    expect(checkUniversalGasBands(buildGasReadings({ o2Percent: 19.4 })).isSafe).toBe(false);
  });

  it('passes at O2 exactly 19.5%', () => {
    expect(checkUniversalGasBands(buildGasReadings({ o2Percent: 19.5 })).isSafe).toBe(true);
  });

  it('passes at O2 exactly 23.5%', () => {
    expect(checkUniversalGasBands(buildGasReadings({ o2Percent: 23.5 })).isSafe).toBe(true);
  });

  it('fails at O2 above 23.5%', () => {
    expect(checkUniversalGasBands(buildGasReadings({ o2Percent: 23.6 })).isSafe).toBe(false);
  });

  it('passes at H2S just below 10 ppm', () => {
    expect(checkUniversalGasBands(buildGasReadings({ h2sPpm: 9.9 })).isSafe).toBe(true);
  });

  it('fails at H2S exactly 10 ppm', () => {
    const result = checkUniversalGasBands(buildGasReadings({ h2sPpm: 10 }));
    expect(result.isSafe).toBe(false);
    expect(result.blockReason).toMatch(/H2S/);
  });

  it('passes at CO just below 25 ppm', () => {
    expect(checkUniversalGasBands(buildGasReadings({ coPpm: 24.9 })).isSafe).toBe(true);
  });

  it('fails at CO exactly 25 ppm', () => {
    const result = checkUniversalGasBands(buildGasReadings({ coPpm: 25 }));
    expect(result.isSafe).toBe(false);
    expect(result.blockReason).toMatch(/CO/);
  });
});

describe('validatePTWGasSafety', () => {
  it('COLD_WORK passes at LEL exactly 5% (SSHQE §4.3 general ceiling)', () => {
    expect(validatePTWGasSafety('COLD_WORK', buildGasReadings({ lelPercent: 5 })).isSafe).toBe(true);
  });

  it('COLD_WORK fails at LEL above 5%', () => {
    expect(validatePTWGasSafety('COLD_WORK', buildGasReadings({ lelPercent: 5.1 })).isSafe).toBe(false);
  });

  it('HOT_WORK fails at any LEL above 0%', () => {
    expect(validatePTWGasSafety('HOT_WORK', buildGasReadings({ lelPercent: 0.1 })).isSafe).toBe(false);
  });

  it('HOT_WORK is blocked by the universal H2S gate even at LEL 0%', () => {
    const result = validatePTWGasSafety('HOT_WORK', buildGasReadings({ lelPercent: 0, h2sPpm: 10 }));
    expect(result.isSafe).toBe(false);
    expect(result.blockReason).toMatch(/H2S/);
  });

  it('CONFINED_SPACE passes at LEL exactly 5% (SSHQE §4.3 general ceiling)', () => {
    expect(validatePTWGasSafety('CONFINED_SPACE', buildGasReadings({ lelPercent: 5 })).isSafe).toBe(true);
  });

  it('CONFINED_SPACE fails at LEL above 5%', () => {
    expect(validatePTWGasSafety('CONFINED_SPACE', buildGasReadings({ lelPercent: 5.1 })).isSafe).toBe(false);
  });

  it('CONFINED_SPACE is blocked by the universal CO gate', () => {
    const result = validatePTWGasSafety('CONFINED_SPACE', buildGasReadings({ coPpm: 25 }));
    expect(result.isSafe).toBe(false);
    expect(result.blockReason).toMatch(/CO/);
  });

  it('ELECTRICAL is blocked by the universal O2 gate', () => {
    const result = validatePTWGasSafety('ELECTRICAL', buildGasReadings({ o2Percent: 24 }));
    expect(result.isSafe).toBe(false);
    expect(result.blockReason).toMatch(/O2/);
  });
});
