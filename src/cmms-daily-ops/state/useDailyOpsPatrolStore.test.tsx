// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  useDailyOpsPatrolValue,
  setLatestPatrolEntry,
  __resetDailyOpsPatrolStoreForTests,
} from './useDailyOpsPatrolStore';

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
});

function Probe({ domain, equipmentTag, columnName }: { domain: 'aav'; equipmentTag: string; columnName: string }) {
  const value = useDailyOpsPatrolValue(domain, equipmentTag, columnName);
  return <span data-testid="probe">{value === undefined ? 'undefined' : String(value)}</span>;
}

function mount(equipmentTag: string, columnName: string) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<Probe domain="aav" equipmentTag={equipmentTag} columnName={columnName} />);
  });
}

describe('useDailyOpsPatrolStore', () => {
  it('returns undefined before any save', () => {
    mount('AAV-102', 'pressure_gauge_us_bar');
    expect(container!.querySelector('[data-testid="probe"]')!.textContent).toBe('undefined');
  });

  it('reflects a value immediately after setLatestPatrolEntry (optimistic, no refetch)', () => {
    mount('AAV-102', 'pressure_gauge_us_bar');
    act(() => {
      setLatestPatrolEntry('aav', 'AAV-102', { pressure_gauge_us_bar: 4.2, temperature_gauge_us_c: -155.1 });
    });
    expect(container!.querySelector('[data-testid="probe"]')!.textContent).toBe('4.2');
  });

  it('does not leak values across different equipment tags', () => {
    mount('AAV-103', 'pressure_gauge_us_bar');
    act(() => {
      setLatestPatrolEntry('aav', 'AAV-102', { pressure_gauge_us_bar: 9.9 });
    });
    expect(container!.querySelector('[data-testid="probe"]')!.textContent).toBe('undefined');
  });
});
