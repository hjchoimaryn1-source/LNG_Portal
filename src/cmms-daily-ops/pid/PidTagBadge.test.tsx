// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PidTagBadge } from './PidTagBadge';
import { setLatestPatrolEntry, __resetDailyOpsPatrolStoreForTests } from '../state/useDailyOpsPatrolStore';
import { markAlarmAcknowledged, __resetAlarmAckStoreForTests } from '../../hmi/state/useAlarmAckStore';
import { __resetAlarmCurrentStateCacheForTests } from '../../hmi/state/alarmCurrentStateCache';
import { addActiveSuppression, __resetAlarmSuppressionStoreForTests } from '../../hmi/state/useAlarmSuppressionStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DOMAIN = 'iso_tank_unloading_skid';
const TAG = 'ISO-TANK-01';
const COLUMN = 'pressure_mpa';
// ISO_TANK_PRESSURE_RULE(alarmPriorityRules.ts): LL=1.0 bar → 0.05 MPa*10=0.5 bar <= LL → CRITICAL.
const CRITICAL_VALUE_MPA = 0.05;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <svg>
        <PidTagBadge tagId={TAG} x={0} y={0} domain={DOMAIN} primaryColumn={COLUMN} isCalibrating={false} />
      </svg>
    );
    await Promise.resolve();
  });
}

function circle(): SVGCircleElement {
  return container!.querySelector('circle')!;
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
  __resetDailyOpsPatrolStoreForTests();
  __resetAlarmAckStoreForTests();
  __resetAlarmCurrentStateCacheForTests();
  __resetAlarmSuppressionStoreForTests();
  vi.unstubAllGlobals();
});

describe('PidTagBadge (HMI-2e-2 flash/ack/suppress parity)', () => {
  it('flashes when the equipment has an unacknowledged CRITICAL column', async () => {
    act(() => {
      setLatestPatrolEntry(DOMAIN, TAG, { [COLUMN]: CRITICAL_VALUE_MPA });
    });
    await mount();
    expect(circle().getAttribute('class')).toContain('hmi-alarm-flash');
    expect(container!.querySelector('text[text-anchor="middle"]')).toBeNull();
  });

  it('stops flashing once acknowledged, with no suppressed glyph', async () => {
    act(() => {
      setLatestPatrolEntry(DOMAIN, TAG, { [COLUMN]: CRITICAL_VALUE_MPA });
    });
    await mount();
    await act(async () => {
      markAlarmAcknowledged(DOMAIN, TAG, COLUMN, new Date().toISOString());
      await Promise.resolve();
    });
    expect(circle().getAttribute('class')).toBeFalsy();
    expect(container!.querySelector('text[text-anchor="middle"]')).toBeNull();
  });

  it('shows the suppressed glyph (no flash) once suppressed, even before acknowledgement', async () => {
    act(() => {
      setLatestPatrolEntry(DOMAIN, TAG, { [COLUMN]: CRITICAL_VALUE_MPA });
    });
    await mount();
    await act(async () => {
      addActiveSuppression(DOMAIN, TAG, COLUMN, '2099-01-01T00:00:00.000Z');
      await Promise.resolve();
    });
    expect(circle().getAttribute('class')).toBeFalsy();
    expect(container!.querySelector('text[text-anchor="middle"]')?.textContent).toBe('S');
  });
});
