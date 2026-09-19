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

function clickSubTab(label: string) {
  const button = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === label)!;
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('NiasPatrolLogTab', () => {
  it('defaults to the AAV & Buffer Tank sub-tab (AAV-102 + V-101)', async () => {
    stubFetch();
    await mountAndFlush();
    expect(container!.textContent).toContain('PATROL LOG');
    expect(container!.textContent).toContain('AAV-102');
    expect(container!.textContent).toContain('V-101');
    expect(container!.textContent).not.toContain('METERING-TRAIN-A');
  });

  it('renders Metering Train A/B, GC-01 under the Metering sub-tab (relocated from LngEnergyOperationView)', async () => {
    stubFetch();
    await mountAndFlush();
    clickSubTab('Metering');
    expect(container!.textContent).toContain('METERING-TRAIN-A');
    expect(container!.textContent).toContain('METERING-TRAIN-B');
    expect(container!.textContent).toContain('GC-01');
  });

  it('renders N2 Skid cylinders under the N2 & Bottles sub-tab', async () => {
    stubFetch();
    await mountAndFlush();
    clickSubTab('N2 & Bottles');
    expect(container!.textContent).toContain('N2-CYL-01');
    expect(container!.textContent).toContain('N2-SKID-SUPPLY-1');
  });
});
