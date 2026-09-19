// src/lib/rbac/navPermissionMap.ts
//
// Stage 2 (nav-level role-based tab hiding, 2026-09-18), simplified in Stage 3
// (same day, see isNavItemVisible() below). Gates whether a SidebarNav.tsx item
// or PortalTitleBar.tsx top-tab (both now read SIDEBAR_SECTIONS —
// sidebarSections.ts, 2026-09-19 unification) is shown at all. Distinct from — and
// independent of — the 5 existing leaf-level getEffectivePermission() call
// sites (SignatureBlock.tsx, SafetyNotesEditor.tsx, CriticalEventsEditor.tsx x2,
// PTWStatusActions.tsx), which gate CRUD actions *inside* a page and are
// unmodified by this file. Nav visibility and action permission are two
// separate gates by design.

import type { SubProcessKey } from '../../types/lng';
import type { ModuleCode } from '../../types/rbac';
import type { ActiveSession } from './activeSessionStore';

// Always visible for every authenticated role, regardless of role_permissions.
// CMMS_OVERVIEW_DASHBOARD and the 5 HMI Control Maps screens have no ModuleCode
// row at all (nothing to look up). The entire LNG-Process sidebar group
// (Overview + every sub-screen under it) is allowlisted here too, per HJ
// correction (Stage 2 follow-up, 2026-09-18): field roles like
// OPERATION_TEAM_LEADER need the actual process/tank-yard screens, not just
// the Overview summary, so the whole group overrides LNG_PROCESS_OVERVIEW's
// canRead:false rather than being routed through it. The ModuleCode/
// ROLE_PERMISSIONS row itself is untouched — this override is nav-visibility
// only, and doesn't affect any leaf-level getEffectivePermission('LNG_PROCESS_OVERVIEW', ...)
// check that might exist inside those screens.
const ALWAYS_VISIBLE_NAV_KEYS: ReadonlySet<string> = new Set([
  'CMMS_OVERVIEW_DASHBOARD',
  'LNG_PROCESS_OVERVIEW',
  'ARUN_LOADING_COQ',
  'SAVIOUR_VOYAGE_MONITORING',
  'NIAS_TANK_OVERVIEW',
  'NIAS_GAS_PROCESS_TELEMETRY',
  'NIAS_PLTMG_POWER_OUTPUT',
  'DAILY_OPS_ISO_TANK_LOGISTICS',
  'DAILY_OPS_LIVE_PID_MAP',
  'DAILY_OPS_HMI_OVERVIEW',
  'HMI_METERING_MAP',
  'HMI_BUFFERING_MAP',
  'HMI_VAPOR_MAP',
]);

// Stage 3 (2026-09-18): the permission-derived branch below is temporarily
// UNUSED by isNavItemVisible() — HJ decided to drop per-module nav visibility
// for now and hide everything not on the allowlist, for every non-admin role,
// regardless of what a row here says. Kept in place (not deleted) because it
// is real seed data derived from 001_role_permissions.sql, expected to be
// reinstated once more sectors are field-ready.
//
// Every SidebarNav.tsx / PortalTitleBar.tsx nav key that has a real ModuleCode
// correspondence in ROLE_PERMISSIONS.
export const NAV_ITEM_MODULE_MAP: Partial<Record<SubProcessKey, ModuleCode[]>> = {
  EQUIPMENT_ASSET_REGISTRY: ['EQUIPMENT_ASSET_REGISTRY'],

  WORK_ORDER_DIRECTORY: ['WORK_ORDER_DIRECTORY'],
  MAINTENANCE_MRO_HUB: ['MAINTENANCE_MRO_HUB'],

  MANPOWER_DAILY_SHIFT: ['MANPOWER_DAILY_SHIFT'],
  MANPOWER_ROTATION_TRACKER: ['MANPOWER_ROTATION_TRACKER'],

  SAFETY_OVERVIEW: ['SAFETY_OVERVIEW'],
  PTW_PERMITS: ['PTW_PERMITS'],
  SAFETY_GAS_TESTING: ['SAFETY_GAS_TESTING'],
  SAFETY_ERT_READINESS: ['SAFETY_ERT_READINESS'],

  // PortalTitleBar-only tab — nav key differs from its ModuleCode string.
  HQ_OVERVIEW_DASHBOARD: ['HQ_OVERVIEW'],
};

// Stage 3 (2026-09-18) — development-stage simplification per HJ decision:
// SYSTEM_ADMIN sees everything; every other role sees ONLY the allowlist
// (CMMS Overview Dashboard + the full LNG-Process group), full stop. This is
// intentionally coarser than the ModuleCode/canRead data above allows — e.g.
// SITE_MANAGER now loses nav visibility into EQUIPMENT_ASSET_REGISTRY,
// WORK_ORDER_DIRECTORY, PTW_PERMITS, etc. even though its ROLE_PERMISSIONS
// rows say canRead:true for them. That data is untouched and NAV_ITEM_MODULE_MAP
// still exists for when this restriction is relaxed sector-by-sector.
export function isNavItemVisible(navKey: string, session: ActiveSession | null): boolean {
  if (!session) return false;
  if (session.roleCode === 'ADMIN') return true;
  return ALWAYS_VISIBLE_NAV_KEYS.has(navKey);
}
