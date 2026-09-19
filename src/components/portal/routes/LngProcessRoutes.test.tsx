// @vitest-environment jsdom
//
// PLTMG POWER top-level tab correction (2026-09-18) — regression guard confirming
// NIAS_PLTMG_POWER_OUTPUT mounts NiasPowerThermalTab directly via LngProcessRoutes.tsx
// (independent top-level tab, not nested inside ElectricalSystemView or
// NiasRegasGasProcessView's regasSubTab machine).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import LngProcessRoutes from './LngProcessRoutes';
import { PortalDataProvider } from '../../../context/PortalDataContext';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
        json: async () => ({ generatedAt: '', totalCount: 0, assets: [] }),
      } as unknown as Response)
    )
  );
}

async function flushPortalDataInit() {
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <PortalDataProvider>
        <LngProcessRoutes
          activeKey="NIAS_PLTMG_POWER_OUTPUT"
          activeSubTab="NIAS_PLTMG_POWER_OUTPUT"
          handleSelectSubProcess={() => {}}
        />
      </PortalDataProvider>
    );
    await flushPortalDataInit();
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  vi.unstubAllGlobals();
});

describe('LngProcessRoutes — NIAS_PLTMG_POWER_OUTPUT', () => {
  it('renders NiasPowerThermalTab as an independent top-level tab', async () => {
    stubFetch();
    await mount();
    expect(container!.textContent ?? '').toContain('PLTMG MONITOR');
  });
});
