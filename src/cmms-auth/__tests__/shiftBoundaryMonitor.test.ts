// src/cmms-auth/__tests__/shiftBoundaryMonitor.test.ts
import { describe, it, expect } from 'vitest';
import { hasCrossedShiftBoundary, isReauthRequired } from '../shiftBoundaryMonitor';

describe('hasCrossedShiftBoundary', () => {
  it('returns false when issued and now are both before the next 07:00 boundary', () => {
    const issuedAt = new Date('2026-09-12T05:00:00');
    const now = new Date('2026-09-12T06:59:00');
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(false);
  });

  it('returns true when now has passed the 07:00 boundary after issue', () => {
    const issuedAt = new Date('2026-09-12T05:00:00');
    const now = new Date('2026-09-12T07:00:01');
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(true);
  });

  it('returns false when issued and now are both between 07:00 and 19:00', () => {
    const issuedAt = new Date('2026-09-12T08:00:00');
    const now = new Date('2026-09-12T18:59:00');
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(false);
  });

  it('returns true when now has passed the 19:00 boundary after issue', () => {
    const issuedAt = new Date('2026-09-12T18:00:00');
    const now = new Date('2026-09-12T19:00:01');
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(true);
  });

  it('returns true when the session spans multiple days and boundaries', () => {
    const issuedAt = new Date('2026-09-12T20:00:00');
    const now = new Date('2026-09-14T06:00:00');
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(true);
  });

  it('returns false when now is before issuedAt', () => {
    const issuedAt = new Date('2026-09-12T10:00:00');
    const now = new Date('2026-09-12T09:00:00');
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(false);
  });

  it('isReauthRequired accepts an ISO string issuedAt', () => {
    const now = new Date('2026-09-12T07:00:01');
    expect(isReauthRequired('2026-09-12T05:00:00', now)).toBe(true);
  });
});
