// src/lib/rbac/navPermissionMap.test.ts
import { describe, it, expect } from 'vitest';
import { isNavItemVisible, NAV_ITEM_MODULE_MAP } from './navPermissionMap';
import type { ActiveSession } from './activeSessionStore';

const asSystemAdmin: ActiveSession = { userId: 'DEV-HQ-001', roleCode: 'SYSTEM_ADMIN', homeLocation: 'HQ' };
const asSiteManager: ActiveSession = { userId: 'BSG259529', roleCode: 'SITE_MANAGER', homeLocation: 'SITE' };
const asOperationTeamLeader: ActiveSession = { userId: 'BSG259524', roleCode: 'OPERATION_TEAM_LEADER', homeLocation: 'SITE' };

describe('isNavItemVisible', () => {
  it('SYSTEM_ADMIN sees every nav key, including ones with no ModuleCode mapping', () => {
    expect(isNavItemVisible('TRUCKING_HUB', asSystemAdmin)).toBe(true);
    expect(isNavItemVisible('GLOBAL_FLEET_HUB', asSystemAdmin)).toBe(true);
    expect(isNavItemVisible('HQ_OVERVIEW_DASHBOARD', asSystemAdmin)).toBe(true);
  });

  it('a null session sees nothing, even allowlisted keys', () => {
    expect(isNavItemVisible('CMMS_OVERVIEW_DASHBOARD', null)).toBe(false);
    expect(isNavItemVisible('LNG_PROCESS_OVERVIEW', null)).toBe(false);
  });

  it('allowlisted items are always visible, overriding a canRead:false row', () => {
    // OPERATION_TEAM_LEADER's LNG_PROCESS_OVERVIEW row is canRead:false in
    // ROLE_PERMISSIONS, but the whole LNG-Process group is allowlisted per HJ
    // correction (Stage 2 follow-up, 2026-09-18) — field roles need the actual
    // process/tank-yard screens, not just the Overview summary.
    expect(isNavItemVisible('LNG_PROCESS_OVERVIEW', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('CMMS_OVERVIEW_DASHBOARD', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('DAILY_OPS_LIVE_PID_MAP', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('DAILY_OPS_HMI_OVERVIEW', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('HMI_METERING_MAP', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('HMI_BUFFERING_MAP', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('HMI_VAPOR_MAP', asOperationTeamLeader)).toBe(true);
  });

  it('the rest of the LNG-Process group is visible too, not just the Overview key, for a role whose LNG_PROCESS_OVERVIEW canRead is false', () => {
    // These sub-items are no longer routed through NAV_ITEM_MODULE_MAP's
    // LNG_PROCESS_OVERVIEW lookup — they're allowlisted by name directly, so
    // OPERATION_TEAM_LEADER's canRead:false on that ModuleCode never applies.
    expect(NAV_ITEM_MODULE_MAP.ARUN_LOADING_COQ).toBeUndefined();
    expect(NAV_ITEM_MODULE_MAP.NIAS_TANK_OVERVIEW).toBeUndefined();
    expect(isNavItemVisible('ARUN_LOADING_COQ', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('SAVIOUR_VOYAGE_MONITORING', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('NIAS_TANK_OVERVIEW', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('NIAS_GAS_PROCESS_TELEMETRY', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('NIAS_PLTMG_POWER_OUTPUT', asOperationTeamLeader)).toBe(true);
    expect(isNavItemVisible('DAILY_OPS_ISO_TANK_LOGISTICS', asOperationTeamLeader)).toBe(true);
  });

  it('an item with no ModuleCode mapping anywhere defaults to hidden for a non-admin, even one with broad canRead access', () => {
    expect(NAV_ITEM_MODULE_MAP.GLOBAL_FLEET_HUB).toBeUndefined();
    expect(isNavItemVisible('GLOBAL_FLEET_HUB', asSiteManager)).toBe(false);
    expect(isNavItemVisible('TRUCKING_HUB', asSiteManager)).toBe(false);
    expect(isNavItemVisible('SAFETY_SOP_REFERENCE', asSiteManager)).toBe(false);
  });

  it('a mapped item respects the role_permissions canRead value', () => {
    // SITE_MANAGER: canRead true on EQUIPMENT_ASSET_REGISTRY.
    expect(isNavItemVisible('EQUIPMENT_ASSET_REGISTRY', asSiteManager)).toBe(true);
    // OPERATION_TEAM_LEADER: canRead false on EQUIPMENT_ASSET_REGISTRY.
    expect(isNavItemVisible('EQUIPMENT_ASSET_REGISTRY', asOperationTeamLeader)).toBe(false);
    // OPERATION_TEAM_LEADER: canRead true on WORK_ORDER_DIRECTORY.
    expect(isNavItemVisible('WORK_ORDER_DIRECTORY', asOperationTeamLeader)).toBe(true);
    // HQ_OVERVIEW_DASHBOARD nav key maps to the differently-named HQ_OVERVIEW
    // ModuleCode; OPERATION_TEAM_LEADER's HQ_OVERVIEW row is canRead:false.
    expect(isNavItemVisible('HQ_OVERVIEW_DASHBOARD', asOperationTeamLeader)).toBe(false);
    expect(isNavItemVisible('HQ_OVERVIEW_DASHBOARD', asSiteManager)).toBe(true);
  });
});
