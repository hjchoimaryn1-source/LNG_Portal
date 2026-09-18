// src/lib/rbac/navPermissionMap.ts
//
// Stage 2 (nav-level role-based tab hiding, 2026-09-18). Gates whether a
// SidebarNav.tsx item or PortalTitleBar.tsx CMMS_MODULES tab is shown at all.
// Distinct from — and independent of — the 5 existing leaf-level
// getEffectivePermission() call sites (SignatureBlock.tsx, SafetyNotesEditor.tsx,
// CriticalEventsEditor.tsx x2, PTWStatusActions.tsx), which gate CRUD actions
// *inside* a page and are unmodified by this file. Nav visibility and action
// permission are two separate gates by design.

import type { SubProcessKey } from '../../types/lng';
import type { ModuleCode } from '../../types/rbac';
import { getEffectivePermission } from './rolePermissionService';
import type { ActiveSession } from './activeSessionStore';

// Always visible for every authenticated role, regardless of role_permissions.
// CMMS_OVERVIEW_DASHBOARD and the 5 HMI Control Maps screens have no ModuleCode
// row at all (nothing to look up). LNG_PROCESS_OVERVIEW does have a ModuleCode
// row, but is allowlisted here per HJ decision (Stage 2) so it stays visible
// even where the seed data says canRead:false (e.g. OPERATION_TEAM_LEADER) —
// see PORTAL_RESTRUCTURE_NOTES for the flagged inconsistency this overrides.
const ALWAYS_VISIBLE_NAV_KEYS: ReadonlySet<string> = new Set([
  'CMMS_OVERVIEW_DASHBOARD',
  'LNG_PROCESS_OVERVIEW',
  'DAILY_OPS_LIVE_PID_MAP',
  'DAILY_OPS_HMI_OVERVIEW',
  'HMI_METERING_MAP',
  'HMI_BUFFERING_MAP',
  'HMI_VAPOR_MAP',
]);

// Every SidebarNav.tsx / PortalTitleBar.tsx nav key that has a real ModuleCode
// correspondence in ROLE_PERMISSIONS. A nav key with no entry here (and not in
// the allowlist above) defaults to HIDDEN for every role except SYSTEM_ADMIN —
// fail-safe-default-to-restrictive. As of this pass that hides, for
// SITE_MANAGER/OPERATION_TEAM_LEADER (the only two non-admin login accounts):
// GLOBAL_FLEET_HUB, DATA_INGESTION_HUB, MANPOWER_SHIFT_ROSTER,
// MANPOWER_MONTHLY_GRID, MANPOWER_TRAINING_MATRIX, SAFETY_SOP_REFERENCE,
// PM_SCHEDULES, TRUCKING_HUB, ENVIRONMENT_HUB, MOC_HUB — none of these have a
// ModuleCode defined anywhere in types/rbac.ts.
export const NAV_ITEM_MODULE_MAP: Partial<Record<SubProcessKey, ModuleCode[]>> = {
  // LNG-Process sidebar sub-screens share the section's one ModuleCode — it's
  // the only permission key this domain has (LNG_PROCESS_OVERVIEW itself is
  // allowlisted above, not looked up here).
  ARUN_LOADING_COQ: ['LNG_PROCESS_OVERVIEW'],
  SAVIOUR_VOYAGE_MONITORING: ['LNG_PROCESS_OVERVIEW'],
  NIAS_TANK_OVERVIEW: ['LNG_PROCESS_OVERVIEW'],
  NIAS_GAS_PROCESS_TELEMETRY: ['LNG_PROCESS_OVERVIEW'],
  NIAS_PLTMG_POWER_OUTPUT: ['LNG_PROCESS_OVERVIEW'],
  DAILY_OPS_ISO_TANK_LOGISTICS: ['LNG_PROCESS_OVERVIEW'],

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

export function isNavItemVisible(navKey: string, session: ActiveSession | null): boolean {
  if (!session) return false;
  if (session.roleCode === 'SYSTEM_ADMIN') return true;
  if (ALWAYS_VISIBLE_NAV_KEYS.has(navKey)) return true;

  const moduleCodes = NAV_ITEM_MODULE_MAP[navKey as SubProcessKey];
  if (!moduleCodes || moduleCodes.length === 0) return false;

  return moduleCodes.every(
    (moduleCode) => getEffectivePermission(session.roleCode, moduleCode)?.canRead === true
  );
}
