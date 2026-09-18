// @vitest-environment jsdom
//
// Stage 1 (contextual sidebar, 2026-09-18) regression guard: Dashboard shows a
// flat sector-picker list; inside any sector, that sector's own leaf sub-menu
// fully replaces the list (no other section headers survive). Mirrors
// PTWStatusActions.test.tsx's manual createRoot/act mount pattern — no
// @testing-library/react in this repo. useFleetTankFacade is mocked directly
// (see IsoTankCargoPatrolForm.test.tsx) since these assertions don't depend on
// live tank counts and mounting a real PortalDataProvider is slow/flaky here.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import SidebarNav from './SidebarNav';
import { setActiveSession, clearActiveSession } from '../lib/rbac/activeSessionStore';
import type { SubProcessKey } from '../types/lng';

const mockUseFleetTankFacade = vi.fn(() => ({ fleetTanks: [] }));
vi.mock('../hooks/portalDataFacade/useFleetTankFacade', () => ({
  useFleetTankFacade: () => mockUseFleetTankFacade(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function mount(activeKey: SubProcessKey, onSelectKey: (key: SubProcessKey) => void = vi.fn()) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<SidebarNav activeKey={activeKey} onSelectKey={onSelectKey} />);
  });
}

// Real parent components (LNGPortalInner/usePortalNavigation) own activeKey as
// state and re-render SidebarNav when onSelectKey fires — SidebarNav itself is
// a controlled/dumb component. This wrapper reproduces that so the DASHBOARD
// header's "switches the sidebar back to sector-list mode" behavior can be
// verified end-to-end rather than just asserting the callback argument.
function StatefulSidebar({ initialKey }: { initialKey: SubProcessKey }) {
  const [activeKey, setActiveKey] = useState<SubProcessKey>(initialKey);
  return <SidebarNav activeKey={activeKey} onSelectKey={setActiveKey} />;
}

async function mountStateful(initialKey: SubProcessKey) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<StatefulSidebar initialKey={initialKey} />);
  });
}

function headerButtons(): HTMLButtonElement[] {
  return Array.from(container!.querySelectorAll('button'));
}

function clickButtonWithText(text: string) {
  const button = headerButtons().find((b) => b.textContent?.trim() === text);
  if (!button) throw new Error(`button "${text}" not found`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  clearActiveSession();
  vi.clearAllMocks();
});

describe('SidebarNav — Dashboard mode (sector list)', () => {
  it('SYSTEM_ADMIN sees all 9 section headers plus the HQ Overview entry, and no leaf items', async () => {
    setActiveSession({ userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' });
    await mount('CMMS_OVERVIEW_DASHBOARD');
    const text = container!.textContent ?? '';

    for (const label of [
      'LNG-Process',
      'HMI Control Maps',
      'Equipment & Asset',
      'Maintenance & Work Orders',
      'Site Manning & Roster',
      'Safety & PTW',
      'Trucking & Logistics',
      'Environment & Waste',
      'Management of Change',
      'Jakarta HQ Overview',
    ]) {
      expect(text).toContain(label);
    }

    // Leaf-only labels must not leak into the sector-list view.
    expect(text).not.toContain('PAGT (Arun)');
    expect(text).not.toContain('120-Fleet Hub');
    expect(text).not.toContain('Permits');

    // Stage 2: DASHBOARD master-container header is always present.
    expect(text).toContain('DASHBOARD');
  });

  it('SITE_MANAGER sees only LNG-Process + HMI Control Maps headers, no HQ Overview entry, no leaf items', async () => {
    setActiveSession({ userId: 'BSG259529', roleCode: 'SITE_MANAGER', homeLocation: 'SITE' });
    await mount('CMMS_OVERVIEW_DASHBOARD');
    const text = container!.textContent ?? '';

    expect(text).toContain('DASHBOARD');
    expect(text).toContain('LNG-Process');
    expect(text).toContain('HMI Control Maps');
    expect(text).not.toContain('Equipment & Asset');
    expect(text).not.toContain('Maintenance & Work Orders');
    expect(text).not.toContain('Site Manning & Roster');
    expect(text).not.toContain('Safety & PTW');
    expect(text).not.toContain('Trucking & Logistics');
    expect(text).not.toContain('Environment & Waste');
    expect(text).not.toContain('Management of Change');
    expect(text).not.toContain('Jakarta HQ Overview');
    expect(text).not.toContain('PAGT (Arun)');
  });

  it('OPERATION_TEAM_LEADER sees the same allowlisted headers as SITE_MANAGER', async () => {
    setActiveSession({ userId: 'BSG259524', roleCode: 'OPERATION_TEAM_LEADER', homeLocation: 'SITE' });
    await mount('CMMS_OVERVIEW_DASHBOARD');
    const text = container!.textContent ?? '';

    expect(text).toContain('LNG-Process');
    expect(text).toContain('HMI Control Maps');
    expect(text).not.toContain('Jakarta HQ Overview');
  });

  it('clicking a sector-list header navigates to that sector\'s entry leaf key', async () => {
    setActiveSession({ userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' });
    const onSelectKey = vi.fn();
    await mount('CMMS_OVERVIEW_DASHBOARD', onSelectKey);

    await act(async () => {
      clickButtonWithText('Equipment & Asset');
    });

    expect(onSelectKey).toHaveBeenCalledWith('EQUIPMENT_ASSET_REGISTRY');
  });

  it('clicking the DASHBOARD header while already on Dashboard harmlessly re-navigates to the same key', async () => {
    setActiveSession({ userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' });
    const onSelectKey = vi.fn();
    await mount('CMMS_OVERVIEW_DASHBOARD', onSelectKey);

    await act(async () => {
      clickButtonWithText('DASHBOARD');
    });

    expect(onSelectKey).toHaveBeenCalledWith('CMMS_OVERVIEW_DASHBOARD');
  });
});

describe('SidebarNav — in-sector mode (section menu, full replace)', () => {
  it('shows ONLY the LNG-Process leaf list, no other section headers, for SYSTEM_ADMIN', async () => {
    setActiveSession({ userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' });
    await mount('NIAS_TANK_OVERVIEW');
    const text = container!.textContent ?? '';

    expect(text).toContain('LNG-Process');
    expect(text).toContain('PAGT (Arun)');
    expect(text).toContain('Marine Transit');
    expect(text).toContain('Nias Tank Yard');
    expect(text).toContain('Regas & Gas Process');
    expect(text).toContain('PLTMG Power');

    for (const otherLabel of [
      'HMI Control Maps',
      'Equipment & Asset',
      'Maintenance & Work Orders',
      'Site Manning & Roster',
      'Safety & PTW',
      'Trucking & Logistics',
      'Environment & Waste',
      'Management of Change',
      'Jakarta HQ Overview',
    ]) {
      expect(text).not.toContain(otherLabel);
    }

    // Stage 2: DASHBOARD master-container header survives the full-replace —
    // it's global chrome in SidebarNav.tsx, not part of either child view.
    expect(text).toContain('DASHBOARD');
  });

  it('shows ONLY the LNG-Process leaf list for SITE_MANAGER too (same tier, same role rule)', async () => {
    setActiveSession({ userId: 'BSG259529', roleCode: 'SITE_MANAGER', homeLocation: 'SITE' });
    await mount('NIAS_TANK_OVERVIEW');
    const text = container!.textContent ?? '';

    expect(text).toContain('LNG-Process');
    expect(text).toContain('Nias Tank Yard');
    expect(text).not.toContain('HMI Control Maps');
    expect(text).toContain('DASHBOARD');
  });

  it('a drill-down leaf not directly on the sidebar (NIAS_LAYDOWN_1_2_LOG) still resolves to the LNG-Process menu', async () => {
    setActiveSession({ userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' });
    await mount('NIAS_LAYDOWN_1_2_LOG');
    const text = container!.textContent ?? '';

    expect(text).toContain('LNG-Process');
    expect(text).toContain('Nias Tank Yard');
    expect(text).toContain('DASHBOARD');
  });

  it('falls back to the sector list for a leaf-only entry with no submenu (HQ_OVERVIEW_DASHBOARD)', async () => {
    setActiveSession({ userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' });
    await mount('HQ_OVERVIEW_DASHBOARD');
    const text = container!.textContent ?? '';

    expect(text).toContain('DASHBOARD');
    expect(text).toContain('LNG-Process');
    expect(text).toContain('Jakarta HQ Overview');
  });

  it('clicking the DASHBOARD header from inside a sector navigates to CMMS_OVERVIEW_DASHBOARD and switches the sidebar back to the sector-list view', async () => {
    setActiveSession({ userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' });
    await mountStateful('NIAS_TANK_OVERVIEW');

    // Sanity check: starts in-sector (full replace — no other section headers).
    expect(container!.textContent ?? '').not.toContain('Equipment & Asset');

    await act(async () => {
      clickButtonWithText('DASHBOARD');
    });

    const text = container!.textContent ?? '';
    // Back to the flat sector list: other sections' headers reappear...
    expect(text).toContain('Equipment & Asset');
    expect(text).toContain('Safety & PTW');
    // ...and the LNG-Process leaf items (e.g. "Nias Tank Yard") are gone.
    expect(text).not.toContain('Nias Tank Yard');
  });
});
