// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HmiOverviewView } from '../HmiOverviewView';
import { mockOverviewHmiData } from '../__fixtures__/mockOverviewHmiData';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<HmiOverviewView data={mockOverviewHmiData} />);
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
});

describe('HmiOverviewView (Sub-stage A static presentation)', () => {
  it('renders one tile per fixture unit, labeled by unit.label (never a literal tag)', async () => {
    await mount();
    expect(container!.textContent).toContain(`${mockOverviewHmiData.units.length} UNITS`);
    for (const unit of mockOverviewHmiData.units) {
      expect(container!.textContent).toContain(unit.label);
    }
  });

  it('renders a normal-range gauge only for ng_buffer_tank units', async () => {
    await mount();
    const gaugeBars = container!.querySelectorAll('.bg-slate-200');
    const ngBufferTankCount = mockOverviewHmiData.units.filter((u) => u.domain === 'ng_buffer_tank').length;
    expect(gaugeBars.length).toBe(ngBufferTankCount);
  });

  it('shows the offline unit with no numeric reading', async () => {
    await mount();
    expect(container!.textContent).toContain('— no reading —');
  });

  it('shows a detail line for the selected unit on click', async () => {
    await mount();
    const firstTile = container!.querySelector('[role="button"]') as HTMLElement;
    await act(async () => {
      firstTile.click();
      await Promise.resolve();
    });
    expect(container!.textContent).toContain('Selected:');
  });
});
