// @vitest-environment jsdom
//
// Phase 13 Target A Sub-stage E — render-level regression baseline for
// NiasTerminalView.tsx, captured BEFORE any structural changes (dead code
// removal, type/util extraction, hook absorption) begin. Every later
// sub-stage must keep these assertions green; a break here means a
// refactor changed real behavior, not just line count.
//
// Real component tree — NOT mocked. The only thing stubbed is the network
// (global fetch), which PortalDataProvider's loadAllPortalData() calls to
// fetch CSV files; that's legitimate per Sub-stage E's own instructions
// ("mocking a network/DB call is fine"). NiasTerminalView, all 10 leaf
// sub-tab components it routes to (via the real NiasDomainContentRouter),
// every hook, and the real PortalDataProvider all render for real.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import NiasTerminalView from './NiasTerminalView';
import { PortalDataProvider } from '../../context/PortalDataContext';

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

// PortalDataProvider's loadAllPortalData() yields via a real `setTimeout(resolve, 0)`
// once per CSV file plus once more before returning (~8 hops for the current 7-file
// config) — a real macrotask, not a microtask, so plain `await Promise.resolve()`
// ticks won't drain it. Draining it for real (rather than leaving it to resolve after
// the test's own afterEach unmounts) avoids an orphaned initData() promise chain that
// could fire a stray console.error against a since-unstubbed fetch during a LATER test.
async function flushPortalDataInit() {
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function mount(props: { initialDomain?: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM' | 'TERMINAL_OVERVIEW'; initialSubTab?: string } = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <PortalDataProvider>
        <NiasTerminalView {...props} />
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
  vi.restoreAllMocks();
});

describe('NiasTerminalView — render-level smoke baseline (Sub-stage E)', () => {
  it('mounts without throwing, using genuine zero-prop defaults', async () => {
    stubFetch();
    await expect(mount()).resolves.toBeUndefined();
    expect(container!.textContent).toBeTruthy();
  });

  // Sub-tab coverage. Matches how LngProcessRoutes.tsx actually invokes NiasTerminalView
  // (always passing both initialDomain and initialSubTab together) for the 8 sub-tabs it
  // currently wires up as routes; TANK_MASS_BALANCE has no external route today (only
  // reachable via in-component nav-tab click) but is included here too since it's still
  // part of NiasTerminalView's own supported prop contract. LAYDOWN_1_2_LOG and
  // TANK_MASS_BALANCE moved from ISO_TANK_MGMT to REGAS_SYSTEM (ISO Tank & Mass
  // Balance relocation, 2026-09-18). PLTMG_POWER_OUTPUT remains absent from
  // REGAS_SYSTEM (2026-09-18 correction): PLTMG Power is now its own
  // independent top-level tab, outside NiasTerminalView entirely — see
  // LngProcessRoutes.test.tsx for its coverage.
  const knownSubTabs: Array<{
    label: string;
    initialDomain: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM';
    initialSubTab: string;
    marker: string;
  }> = [
    { label: 'TANK_OVERVIEW', initialDomain: 'ISO_TANK_MGMT', initialSubTab: 'TANK_OVERVIEW', marker: 'ISO TK - Skid' },
    { label: 'ACTIVE_BAY_TANKS', initialDomain: 'ISO_TANK_MGMT', initialSubTab: 'ACTIVE_BAY_TANKS', marker: 'SKIDS OCCUPIED' },
    { label: 'LAYDOWN_3_HEEL', initialDomain: 'ISO_TANK_MGMT', initialSubTab: 'LAYDOWN_3_HEEL', marker: 'HEEL STAGING & BACKHAUL CLEARANCE' },
    { label: 'GAS_PROCESS_TELEMETRY', initialDomain: 'REGAS_SYSTEM', initialSubTab: 'GAS_PROCESS_TELEMETRY', marker: 'DAILY LNG SENDOUT' },
    { label: 'PATROL_LOG', initialDomain: 'REGAS_SYSTEM', initialSubTab: 'PATROL_LOG', marker: 'PATROL LOG' },
    { label: 'GAS_METERING_DAILY', initialDomain: 'REGAS_SYSTEM', initialSubTab: 'GAS_METERING_DAILY', marker: 'GAS METERING (DAILY)' },
    { label: 'LAYDOWN_1_2_LOG', initialDomain: 'REGAS_SYSTEM', initialSubTab: 'LAYDOWN_1_2_LOG', marker: 'DAILY INSPECTION & BOG LOG' },
    { label: 'TANK_MASS_BALANCE', initialDomain: 'REGAS_SYSTEM', initialSubTab: 'TANK_MASS_BALANCE', marker: 'ISO TANK MASS BALANCE' },
    { label: 'CUSTODY_HEAT_SETTLEMENT', initialDomain: 'REGAS_SYSTEM', initialSubTab: 'CUSTODY_HEAT_SETTLEMENT', marker: 'MONTHLY REPORT (PLN EPI)' },
  ];

  for (const { label, initialDomain, initialSubTab, marker } of knownSubTabs) {
    it(`renders recognizable content for sub-tab ${label}`, async () => {
      stubFetch();
      await mount({ initialDomain, initialSubTab });
      expect(container!.textContent).toContain(marker);
    });
  }

  it('logs no console errors/warnings during a clean mount', async () => {
    stubFetch();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount({ initialDomain: 'REGAS_SYSTEM', initialSubTab: 'LAYDOWN_1_2_LOG' });
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
