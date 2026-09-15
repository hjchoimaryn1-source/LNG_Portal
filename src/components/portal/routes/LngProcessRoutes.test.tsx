// @vitest-environment jsdom
//
// Sub-stage C regression guard — confirms the new DAILY_OPS_HMI_OVERVIEW tab
// renders HmiOverviewContainer, and (more importantly) that adding it did not
// disturb the existing DAILY_OPS_LIVE_PID_MAP -> PIDOverlayView branch.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { __resetDailyOpsPatrolStoreForTests } from '../../../cmms-daily-ops/state/useDailyOpsPatrolStore';

const { default: LngProcessRoutes } = await import('./LngProcessRoutes');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, records: [], status: {} }),
      } as Response)
    )
  );
}

async function mount(activeKey: 'DAILY_OPS_HMI_OVERVIEW' | 'DAILY_OPS_LIVE_PID_MAP') {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <LngProcessRoutes activeKey={activeKey} activeSubTab="" handleSelectSubProcess={() => {}} />
    );
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  __resetDailyOpsPatrolStoreForTests();
  vi.unstubAllGlobals();
});

describe('LngProcessRoutes — DAILY_OPS_HMI_OVERVIEW (Sub-stage C)', () => {
  it('renders HmiOverviewContainer when active, not PIDOverlayView', async () => {
    stubFetch();
    await mount('DAILY_OPS_HMI_OVERVIEW');
    const text = container!.textContent ?? '';
    expect(text).toContain('HMI OVERVIEW');
    expect(text).not.toContain('P&ID LIVE OVERLAY');
  });

  it('regression guard: DAILY_OPS_LIVE_PID_MAP still renders PIDOverlayView unchanged', async () => {
    stubFetch();
    await mount('DAILY_OPS_LIVE_PID_MAP');
    const text = container!.textContent ?? '';
    expect(text).toContain('P&ID LIVE OVERLAY');
    expect(text).not.toContain('HMI OVERVIEW');
  });
});
