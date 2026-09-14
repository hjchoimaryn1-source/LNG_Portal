// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DailyOpsDataProvider, useDailyOpsData } from './DailyOpsDataContext';
import {
  useDailyOpsPatrolValue,
  __resetDailyOpsPatrolStoreForTests,
} from '../cmms-daily-ops/state/useDailyOpsPatrolStore';

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

function Probe() {
  const { isLoading, error } = useDailyOpsData();
  const aavValue = useDailyOpsPatrolValue('aav', 'AAV-102', 'pressure_gauge_us_bar');
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <span data-testid="value">{aavValue === undefined ? 'undefined' : String(aavValue)}</span>
    </div>
  );
}

async function mountAndFlush() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <DailyOpsDataProvider>
        <Probe />
      </DailyOpsDataProvider>
    );
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('DailyOpsDataContext', () => {
  it('seeds the B2 store with the API response on mount and flips isLoading off', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          records: [{ domain: 'aav', equipmentTag: 'AAV-102', values: { pressure_gauge_us_bar: 4.2 } }],
        }),
      })
    );

    await mountAndFlush();

    expect(container!.querySelector('[data-testid="loading"]')!.textContent).toBe('false');
    expect(container!.querySelector('[data-testid="error"]')!.textContent).toBe('none');
    expect(container!.querySelector('[data-testid="value"]')!.textContent).toBe('4.2');
  });

  it('surfaces a fetch failure as an error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false }) }));

    await mountAndFlush();

    expect(container!.querySelector('[data-testid="loading"]')!.textContent).toBe('false');
    expect(container!.querySelector('[data-testid="error"]')!.textContent).not.toBe('none');
  });
});
