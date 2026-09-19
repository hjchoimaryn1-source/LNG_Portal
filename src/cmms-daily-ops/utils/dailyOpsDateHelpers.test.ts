import { describe, it, expect, vi, afterEach } from 'vitest';
import { today, todayWib } from './dailyOpsDateHelpers';

afterEach(() => {
  vi.useRealTimers();
});

describe('today', () => {
  it('formats the current UTC date as YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T23:59:59.000Z'));
    expect(today()).toBe('2026-09-15');
  });
});

describe('todayWib', () => {
  it('stays on the same UTC calendar date just before the WIB midnight rollover', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T16:59:59.000Z'));
    expect(todayWib()).toBe('2026-01-01');
  });

  it('rolls over to the next date exactly at the UTC 17:00 boundary (WIB midnight)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T17:00:00.000Z'));
    expect(todayWib()).toBe('2026-01-02');
  });

  it('stays on the rolled-over date through the rest of the UTC day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T23:59:59.000Z'));
    expect(todayWib()).toBe('2026-01-02');
  });
});
