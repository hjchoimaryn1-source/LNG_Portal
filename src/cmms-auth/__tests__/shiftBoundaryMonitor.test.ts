// src/cmms-auth/__tests__/shiftBoundaryMonitor.test.ts
//
// All timestamps are explicit UTC ('Z') instants — WIB = UTC+7, so 07:00 WIB
// = 00:00 UTC and 19:00 WIB = 12:00 UTC same day. Using bare (non-'Z') ISO
// strings here would make these tests depend on the test runner's local
// timezone, which is exactly the bug this file's fix (shiftBoundaryMonitor.ts,
// Phase 8 carryover, 2026-09-16) removes.
import { describe, it, expect } from 'vitest';
import { hasCrossedShiftBoundary, isReauthRequired, getNextShiftBoundary } from '../shiftBoundaryMonitor';

describe('hasCrossedShiftBoundary (WIB 07:00/19:00 boundaries)', () => {
  it('returns false when issued and now are both before the next 07:00 WIB boundary', () => {
    const issuedAt = new Date('2026-09-11T22:00:00Z'); // 2026-09-12 05:00 WIB
    const now = new Date('2026-09-11T23:59:00Z'); // 2026-09-12 06:59 WIB
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(false);
  });

  it('returns true when now has passed the 07:00 WIB boundary after issue', () => {
    const issuedAt = new Date('2026-09-11T22:00:00Z'); // 05:00 WIB
    const now = new Date('2026-09-12T00:00:01Z'); // 07:00:01 WIB
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(true);
  });

  it('returns false when issued and now are both between 07:00 and 19:00 WIB', () => {
    const issuedAt = new Date('2026-09-12T01:00:00Z'); // 08:00 WIB
    const now = new Date('2026-09-12T11:59:00Z'); // 18:59 WIB
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(false);
  });

  it('returns true when now has passed the 19:00 WIB boundary after issue', () => {
    const issuedAt = new Date('2026-09-12T11:00:00Z'); // 18:00 WIB
    const now = new Date('2026-09-12T12:00:01Z'); // 19:00:01 WIB
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(true);
  });

  it('returns true when the session spans multiple days and boundaries', () => {
    const issuedAt = new Date('2026-09-12T13:00:00Z'); // 2026-09-12 20:00 WIB
    const now = new Date('2026-09-13T23:00:00Z'); // 2026-09-14 06:00 WIB
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(true);
  });

  it('returns false when now is before issuedAt', () => {
    const issuedAt = new Date('2026-09-12T03:00:00Z'); // 10:00 WIB
    const now = new Date('2026-09-12T02:00:00Z'); // 09:00 WIB
    expect(hasCrossedShiftBoundary(issuedAt, now)).toBe(false);
  });

  it('isReauthRequired accepts an ISO string issuedAt', () => {
    const now = new Date('2026-09-12T00:00:01Z'); // 07:00:01 WIB
    expect(isReauthRequired('2026-09-11T22:00:00Z', now)).toBe(true); // 05:00 WIB
  });
});

describe('getNextShiftBoundary (WIB 07:00/19:00, returned as real UTC instants)', () => {
  it('returns 00:00 UTC (07:00 WIB) when now is before that boundary', () => {
    const now = new Date('2026-09-11T23:00:00Z'); // 06:00 WIB
    expect(getNextShiftBoundary(now).toISOString()).toBe('2026-09-12T00:00:00.000Z');
  });

  it('returns 12:00 UTC (19:00 WIB) when now is between the two boundaries', () => {
    const now = new Date('2026-09-12T05:00:00Z'); // 12:00 WIB
    expect(getNextShiftBoundary(now).toISOString()).toBe('2026-09-12T12:00:00.000Z');
  });

  it('rolls over to next day 00:00 UTC when now is after 19:00 WIB', () => {
    const now = new Date('2026-09-12T13:00:00Z'); // 20:00 WIB
    expect(getNextShiftBoundary(now).toISOString()).toBe('2026-09-13T00:00:00.000Z');
  });
});
