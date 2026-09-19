// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useAlarmBadgeState } from './useAlarmBadgeState';
import { __resetAlarmAckStoreForTests, markAlarmAcknowledged } from './useAlarmAckStore';
import { recordAlarmOnsetObservation, __resetAlarmCurrentStateCacheForTests } from './alarmCurrentStateCache';
import { __resetAlarmSuppressionStoreForTests, addActiveSuppression } from './useAlarmSuppressionStore';
import type { HmiInstrumentReading } from '../types/hmiCore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DOMAIN = 'aav';
const TAG = 'AAV-102';
const COL_A = 'temperature_gauge_us_c';
const COL_B = 'pressure_gauge_us_bar';

function reading(columnName: string, alarmPriority: HmiInstrumentReading['alarmPriority']): HmiInstrumentReading {
  return {
    tagId: TAG,
    domain: DOMAIN,
    columnName,
    instrumentType: 'OTHER',
    value: 0,
    unit: '',
    readingStatus: 'other',
    lastUpdatedAt: null,
    alarmPriority,
  };
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;
let latest: { isActionable: boolean; isFlashing: boolean; isSuppressed: boolean } | null = null;

function Probe({ readings }: { readings: HmiInstrumentReading[] }) {
  latest = useAlarmBadgeState(readings);
  return null;
}

function mount(readings: HmiInstrumentReading[]) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<Probe readings={readings} />);
  });
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }))
  );
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  latest = null;
  __resetAlarmAckStoreForTests();
  __resetAlarmCurrentStateCacheForTests();
  __resetAlarmSuppressionStoreForTests();
  vi.unstubAllGlobals();
});

describe('useAlarmBadgeState (HMI-2e-1 badge-level aggregation)', () => {
  it('flashes if any actionable column is unacknowledged', () => {
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COL_A, 'HIGH', '2026-01-01T00:00:00.000Z');
    });
    mount([reading(COL_A, 'HIGH'), reading(COL_B, 'NORMAL')]);
    expect(latest).toEqual({ isActionable: true, isFlashing: true, isSuppressed: false });
  });

  it('goes solid (not flashing, not suppressed) once the only actionable column is acknowledged', () => {
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COL_A, 'HIGH', '2026-01-01T00:00:00.000Z');
      markAlarmAcknowledged(DOMAIN, TAG, COL_A, '2026-01-01T00:00:05.000Z');
    });
    mount([reading(COL_A, 'HIGH')]);
    expect(latest).toEqual({ isActionable: true, isFlashing: false, isSuppressed: false });
  });

  it('still flashes for an unacknowledged column even if another column is suppressed', () => {
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COL_A, 'HIGH', '2026-01-01T00:00:00.000Z');
      recordAlarmOnsetObservation(DOMAIN, TAG, COL_B, 'CRITICAL', '2026-01-01T00:00:00.000Z');
      addActiveSuppression(DOMAIN, TAG, COL_B, '2099-01-01T00:00:00.000Z');
    });
    mount([reading(COL_A, 'HIGH'), reading(COL_B, 'CRITICAL')]);
    expect(latest).toEqual({ isActionable: true, isFlashing: true, isSuppressed: false });
  });

  it('shows suppressed (not flashing) when the only actionable column is suppressed', () => {
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COL_A, 'CRITICAL', '2026-01-01T00:00:00.000Z');
      addActiveSuppression(DOMAIN, TAG, COL_A, '2099-01-01T00:00:00.000Z');
    });
    mount([reading(COL_A, 'CRITICAL')]);
    expect(latest).toEqual({ isActionable: true, isFlashing: false, isSuppressed: true });
  });

  it('is not actionable when every column is NORMAL/LOW', () => {
    mount([reading(COL_A, 'NORMAL'), reading(COL_B, 'LOW')]);
    expect(latest).toEqual({ isActionable: false, isFlashing: false, isSuppressed: false });
  });
});
