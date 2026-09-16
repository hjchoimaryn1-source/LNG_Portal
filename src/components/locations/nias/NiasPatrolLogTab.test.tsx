// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import NiasPatrolLogTab from './NiasPatrolLogTab';
import { __resetDailyOpsPatrolStoreForTests } from '../../../cmms-daily-ops/state/useDailyOpsPatrolStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

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

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true, records: [] }) } as Response))
  );
}

async function mountAndFlush() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<NiasPatrolLogTab />);
    await Promise.resolve();
  });
}

describe('NiasPatrolLogTab', () => {
  it('renders Metering Train A/B and NG Buffer Tank patrol forms (relocated from LngEnergyOperationView)', async () => {
    stubFetch();
    await mountAndFlush();
    expect(container!.textContent).toContain('METERING-TRAIN-A');
    expect(container!.textContent).toContain('METERING-TRAIN-B');
    expect(container!.textContent).toContain('4-HR PATROL LOG');
  });
});
