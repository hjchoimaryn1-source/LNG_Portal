// @vitest-environment jsdom
//
// Regression guard for the top-tab-bar/sidebar unification (2026-09-19, HJ
// 지시, 승인됨): PortalTitleBar.tsx used to read a separate hardcoded
// CMMS_MODULES array (src/config/siteConfig.ts) — independent from
// SidebarNav.tsx's SIDEBAR_SECTIONS (sidebarSections.ts) — which is why
// "CMMS Overview Dashboard" rendered as a top-tab sibling of "LNG-Process"
// (it was a literal CMMS_MODULES entry with nothing to do with the sidebar's
// DASHBOARD concept). PortalTitleBar now reads SIDEBAR_SECTIONS directly, so
// this test asserts the original complaint is actually gone and both nav
// surfaces stay structurally in sync going forward.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import PortalTitleBar from './PortalTitleBar';
import { setActiveSession, clearActiveSession, type ActiveSession } from '../../lib/rbac/activeSessionStore';
import type { Stage1RoleCode } from '../../lib/rbac/userSecurityRolePermissionSeed';
import type { SubProcessKey } from '../../types/lng';

function sessionFor(roleCode: Stage1RoleCode): ActiveSession {
  return { employeeId: 'E-1', roleCode, homeLocation: 'HQ', permissions: {} };
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function mount(activeKey: SubProcessKey, handleSelectSubProcess: (key: SubProcessKey) => void = vi.fn()) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <PortalTitleBar
        currentNav={{ location: 'Test', process: 'Test' }}
        activeKey={activeKey}
        onReturnToLauncher={() => {}}
        handleSelectSubProcess={handleSelectSubProcess}
        onLogout={() => {}}
      />
    );
  });
}

function clickTab(label: string) {
  const button = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent?.trim() === label);
  if (!button) throw new Error(`tab "${label}" not found`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

afterEach(() => {
  if (root && container) {
    act(() => {
      root!.unmount();
    });
    container.remove();
  }
  container = null;
  root = null;
  clearActiveSession();
});

describe('PortalTitleBar — top tab bar reads SIDEBAR_SECTIONS (2026-09-19 unification)', () => {
  it('never renders "CMMS Overview Dashboard" as a top tab (the original complaint) — it is not a SIDEBAR_SECTIONS entry', async () => {
    setActiveSession(sessionFor('ADMIN'));
    await mount('CMMS_OVERVIEW_DASHBOARD');
    const text = container!.textContent ?? '';
    expect(text).not.toContain('CMMS Overview Dashboard');
  });

  it('ADMIN sees all 10 SIDEBAR_SECTIONS tabs, including the 4 that CMMS_MODULES used to be missing', async () => {
    setActiveSession(sessionFor('ADMIN'));
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
  });

  it('SITE_MANAGER sees only the LNG-Process + HMI Control Maps tabs, matching SidebarNav\'s own role gating (same isNavItemVisible/SIDEBAR_SECTIONS.visible)', async () => {
    setActiveSession(sessionFor('SITE_MANAGER'));
    await mount('CMMS_OVERVIEW_DASHBOARD');
    const text = container!.textContent ?? '';

    expect(text).toContain('LNG-Process');
    expect(text).toContain('HMI Control Maps');
    for (const hidden of [
      'Equipment & Asset',
      'Maintenance & Work Orders',
      'Site Manning & Roster',
      'Safety & PTW',
      'Trucking & Logistics',
      'Environment & Waste',
      'Management of Change',
      'Jakarta HQ Overview',
      'CMMS Overview Dashboard',
    ]) {
      expect(text).not.toContain(hidden);
    }
  });

  it('clicking a tab calls handleSelectSubProcess with that section\'s entryKey', async () => {
    setActiveSession(sessionFor('ADMIN'));
    const handleSelectSubProcess = vi.fn();
    await mount('CMMS_OVERVIEW_DASHBOARD', handleSelectSubProcess);

    await act(async () => {
      clickTab('Equipment & Asset');
    });

    expect(handleSelectSubProcess).toHaveBeenCalledWith('EQUIPMENT_ASSET_REGISTRY');
  });

  it('highlights the tab whose section.matches(activeKey) is true, not a stale currentModuleId comparison', async () => {
    setActiveSession(sessionFor('ADMIN'));
    // NIAS_TANK_OVERVIEW belongs to the LNG-Process section (sidebarSections.ts).
    await mount('NIAS_TANK_OVERVIEW');

    const lngTab = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'LNG-Process');
    const equipmentTab = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Equipment & Asset');
    expect(lngTab?.className).toContain('shadow-inner'); // WIN_TAB_ACTIVE marker
    expect(equipmentTab?.className).not.toContain('shadow-inner');
  });

  it('still renders the Dashboard and Log Out buttons unaffected by the tab-source change', async () => {
    setActiveSession(sessionFor('ADMIN'));
    await mount('CMMS_OVERVIEW_DASHBOARD');
    const text = container!.textContent ?? '';
    expect(text).toContain('DASHBOARD');
    expect(text).toContain('LOG OUT');
  });
});
