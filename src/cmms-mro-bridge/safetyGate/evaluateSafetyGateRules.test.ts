// src/cmms-mro-bridge/safetyGate/evaluateSafetyGateRules.test.ts
//
// Phase 10 Stage 1C required coverage: high-risk zone, CRITICAL+EMERGENCY/HIGH,
// CRITICAL+LOW (explicit not-required case), and standard maintenance.

import { describe, expect, it } from 'vitest';
import { evaluateSafetyGateRules, EMPTY_SAFETY_GATE_INPUT, type SafetyGateWorkOrderInput } from './evaluateSafetyGateRules';

function input(overrides: Partial<SafetyGateWorkOrderInput>): SafetyGateWorkOrderInput {
  return { ...EMPTY_SAFETY_GATE_INPUT, ...overrides };
}

describe('evaluateSafetyGateRules', () => {
  it('requires e-PTW for a high-risk job type regardless of criticality', () => {
    const result = evaluateSafetyGateRules(
      input({ jobCategories: ['HOT_WORK'], equipmentCriticality: 'LOW', priority: 'LOW' })
    );
    expect(result.isPtwRequired).toBe(true);
    expect(result.reason).toMatch(/High-risk job type/);
  });

  it('requires e-PTW for entry into a high-risk ATEX/flammable zone', () => {
    const result = evaluateSafetyGateRules(input({ workAreaZone: 'NP09-ZONE-01-ATEX' }));
    expect(result.isPtwRequired).toBe(true);
    expect(result.reason).toMatch(/ATEX\/Flammable/);
  });

  it('requires e-PTW for CRITICAL asset + EMERGENCY priority', () => {
    const result = evaluateSafetyGateRules(input({ equipmentCriticality: 'CRITICAL', priority: 'EMERGENCY' }));
    expect(result.isPtwRequired).toBe(true);
    expect(result.reason).toMatch(/CRITICAL asset/);
  });

  it('requires e-PTW for CRITICAL asset + HIGH priority', () => {
    const result = evaluateSafetyGateRules(input({ equipmentCriticality: 'CRITICAL', priority: 'HIGH' }));
    expect(result.isPtwRequired).toBe(true);
  });

  it('does NOT require e-PTW for CRITICAL asset + LOW priority (explicit not-required case)', () => {
    const result = evaluateSafetyGateRules(input({ equipmentCriticality: 'CRITICAL', priority: 'LOW' }));
    expect(result.isPtwRequired).toBe(false);
    expect(result.reason).toMatch(/Standard maintenance/);
  });

  it('does NOT require e-PTW for standard maintenance work with no hazard signals', () => {
    const result = evaluateSafetyGateRules(EMPTY_SAFETY_GATE_INPUT);
    expect(result.isPtwRequired).toBe(false);
    expect(result.reason).toMatch(/Standard maintenance/);
  });

  it('does NOT require e-PTW for MEDIUM priority on a CRITICAL asset', () => {
    const result = evaluateSafetyGateRules(input({ equipmentCriticality: 'CRITICAL', priority: 'MEDIUM' }));
    expect(result.isPtwRequired).toBe(false);
  });
});
