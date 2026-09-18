// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ElectricalSystemView } from './ElectricalSystemView';
import { __resetDailyOpsPatrolStoreForTests } from '../state/useDailyOpsPatrolStore';
import { PortalDataProvider } from '../../context/PortalDataContext';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

// PLTMG Power relocation (2026-09-18): ElectricalSystemView now also mounts
// NiasPowerThermalTab, which reads fleetTanks/activeBays via
// useFleetTankFacade() → usePortalData() — requires a real PortalDataProvider
// in the tree (see NiasTerminalView.test.tsx for the same fetch-stub +
// macrotask-flush pattern this reuses).
function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
        json: async () => ({ success: true, generatedAt: '', totalCount: 0, assets: [] }),
      } as unknown as Response)
    )
  );
}

async function flushPortalDataInit() {
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
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

describe('ElectricalSystemView', () => {
  it('renders a live status badge for each of the 4 electrical sub-block tags plus the patrol form', async () => {
    stubFetch();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(
        <PortalDataProvider>
          <ElectricalSystemView />
        </PortalDataProvider>
      );
      await flushPortalDataInit();
    });

    expect(container!.textContent).toContain('MV-SWGR-01');
    expect(container!.textContent).toContain('TRAFO-01');
    expect(container!.textContent).toContain('UPS-01');
    // ElectricalPatrolForm's 4 sub-block cards should also be present
    expect(container!.textContent).toContain('MV SWGR');
  });

  it('renders the relocated PLTMG Power section', async () => {
    stubFetch();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(
        <PortalDataProvider>
          <ElectricalSystemView />
        </PortalDataProvider>
      );
      await flushPortalDataInit();
    });

    expect(container!.textContent).toContain('PLTMG MONITOR');
  });
});
