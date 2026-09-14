import { describe, it, expect, vi, afterEach } from 'vitest';
import { getThwsDaysRemaining, flagPendingReview } from './environmentMonitoringService';

describe('getThwsDaysRemaining', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('due date in the future -> positive days remaining', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    expect(getThwsDaysRemaining('2026-01-11T00:00:00.000Z')).toBe(10);
  });

  it('due date in the past -> negative days remaining', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-11T00:00:00.000Z'));
    expect(getThwsDaysRemaining('2026-01-01T00:00:00.000Z')).toBe(-10);
  });

  it('due date is today -> zero days remaining', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T00:00:00.000Z'));
    expect(getThwsDaysRemaining('2026-06-15T00:00:00.000Z')).toBe(0);
  });
});

describe('flagPendingReview', () => {
  it('null status -> true', () => {
    expect(flagPendingReview({ status: null })).toBe(true);
  });

  it('undefined status -> true', () => {
    expect(flagPendingReview({})).toBe(true);
  });

  it('PASS status -> false (not auto-reclassified)', () => {
    expect(flagPendingReview({ status: 'PASS' })).toBe(false);
  });

  it('FAIL status -> false (not auto-reclassified)', () => {
    expect(flagPendingReview({ status: 'FAIL' })).toBe(false);
  });
});
