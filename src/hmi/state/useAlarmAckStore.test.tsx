// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  useIsAlarmAcknowledged,
  markAlarmAcknowledged,
  setAlarmAcknowledgedAts,
  __resetAlarmAckStoreForTests,
} from './useAlarmAckStore';
import {
  recordAlarmOnsetObservation,
  setAlarmOnsets,
  __resetAlarmCurrentStateCacheForTests,
} from './alarmCurrentStateCache';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DOMAIN = 'aav';
const TAG = 'AAV-102';
const COLUMN = 'temperature_gauge_us_c';

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function Probe() {
  const isAcked = useIsAlarmAcknowledged(DOMAIN, TAG, COLUMN);
  return <span data-testid="probe">{isAcked ? 'acked' : 'flashing'}</span>;
}

function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<Probe />);
  });
}

function readProbe(): string {
  return container!.querySelector('[data-testid="probe"]')!.textContent!;
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
  __resetAlarmAckStoreForTests();
  __resetAlarmCurrentStateCacheForTests();
  vi.unstubAllGlobals();
});

describe('useAlarmAckStore (HMI-2d-2-fix-c cross-reference)', () => {
  it('flashes (unacknowledged) once an alarm enters, before any ack', () => {
    mount();
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COLUMN, 'HIGH', '2026-01-01T00:00:00.000Z');
    });
    expect(readProbe()).toBe('flashing');
  });

  it('goes solid (acked) once acknowledged after onset', () => {
    mount();
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COLUMN, 'HIGH', '2026-01-01T00:00:00.000Z');
      markAlarmAcknowledged(DOMAIN, TAG, COLUMN, '2026-01-01T00:00:05.000Z');
    });
    expect(readProbe()).toBe('acked');
  });

  it('survives a simulated fresh client (cache cleared, re-hydrated from server) as still acked', () => {
    mount();
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COLUMN, 'HIGH', '2026-01-01T00:00:00.000Z');
      markAlarmAcknowledged(DOMAIN, TAG, COLUMN, '2026-01-01T00:00:05.000Z');
    });
    expect(readProbe()).toBe('acked');

    // Simulate a hard refresh / new tab: wipe both in-memory caches, then re-hydrate
    // exactly as DailyOpsDataContext.tsx would from the two GET endpoints.
    act(() => {
      root?.unmount();
    });
    container?.remove();
    __resetAlarmAckStoreForTests();
    __resetAlarmCurrentStateCacheForTests();

    act(() => {
      setAlarmOnsets([{ domain: DOMAIN, equipmentTag: TAG, columnName: COLUMN, onsetAt: '2026-01-01T00:00:00.000Z' }]);
    });
    act(() => {
      setAlarmAcknowledgedAts([
        { domain: DOMAIN, equipmentTag: TAG, columnName: COLUMN, acknowledgedAt: '2026-01-01T00:00:05.000Z' },
      ]);
    });

    mount();
    expect(readProbe()).toBe('acked');
  });

  it('requires a fresh ack after the alarm clears and re-enters (re-arm)', () => {
    mount();
    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COLUMN, 'HIGH', '2026-01-01T00:00:00.000Z');
      markAlarmAcknowledged(DOMAIN, TAG, COLUMN, '2026-01-01T00:00:05.000Z');
    });
    expect(readProbe()).toBe('acked');

    act(() => {
      recordAlarmOnsetObservation(DOMAIN, TAG, COLUMN, 'NORMAL', '2026-01-01T01:00:00.000Z');
      recordAlarmOnsetObservation(DOMAIN, TAG, COLUMN, 'HIGH', '2026-01-01T02:00:00.000Z');
    });
    expect(readProbe()).toBe('flashing');
  });
});
