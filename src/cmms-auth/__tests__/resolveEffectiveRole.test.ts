// src/cmms-auth/__tests__/resolveEffectiveRole.test.ts
import { describe, it, expect } from 'vitest';
import { resolveEffectiveRole } from '../resolveEffectiveRole';
import type { DelegationRecord } from '../rbacTypes';

const NOW = new Date('2026-09-12T10:00:00.000Z');

function buildDelegation(overrides?: Partial<DelegationRecord>): DelegationRecord {
  return {
    originalStaffId: 'BSG259529',
    delegateStaffId: 'BSG259524',
    tier: 'SITE_MANAGER',
    startDate: '2026-09-10T00:00:00.000Z',
    endDate: '2026-09-15T00:00:00.000Z',
    isActive: true,
    ...overrides,
  };
}

describe('resolveEffectiveRole', () => {
  it('returns base OPERATOR tier when no delegation records exist', () => {
    const result = resolveEffectiveRole('BSG259524', [], NOW);
    expect(result).toEqual({ staffId: 'BSG259524', tier: 'OPERATOR', isDelegated: false });
  });

  it('elevates to the delegated tier when an active delegation covers now', () => {
    const delegation = buildDelegation();
    const result = resolveEffectiveRole('BSG259524', [delegation], NOW);
    expect(result).toEqual({
      staffId: 'BSG259524',
      tier: 'SITE_MANAGER',
      isDelegated: true,
      delegatedFrom: 'BSG259529',
      validUntil: '2026-09-15T00:00:00.000Z',
    });
  });

  it('falls back to OPERATOR when the only delegation has expired', () => {
    const delegation = buildDelegation({
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: '2026-09-11T00:00:00.000Z',
    });
    const result = resolveEffectiveRole('BSG259524', [delegation], NOW);
    expect(result).toEqual({ staffId: 'BSG259524', tier: 'OPERATOR', isDelegated: false });
  });

  it('falls back to OPERATOR when the delegation has not started yet', () => {
    const delegation = buildDelegation({
      startDate: '2026-09-20T00:00:00.000Z',
      endDate: '2026-09-25T00:00:00.000Z',
    });
    const result = resolveEffectiveRole('BSG259524', [delegation], NOW);
    expect(result).toEqual({ staffId: 'BSG259524', tier: 'OPERATOR', isDelegated: false });
  });

  it('ignores a matching but inactive delegation record', () => {
    const delegation = buildDelegation({ isActive: false });
    const result = resolveEffectiveRole('BSG259524', [delegation], NOW);
    expect(result).toEqual({ staffId: 'BSG259524', tier: 'OPERATOR', isDelegated: false });
  });

  it('ignores delegation records for a different staffId', () => {
    const delegation = buildDelegation({ delegateStaffId: 'BSG259530' });
    const result = resolveEffectiveRole('BSG259524', [delegation], NOW);
    expect(result).toEqual({ staffId: 'BSG259524', tier: 'OPERATOR', isDelegated: false });
  });
});
