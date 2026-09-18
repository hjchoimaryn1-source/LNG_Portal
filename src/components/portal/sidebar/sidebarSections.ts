// src/components/portal/sidebar/sidebarSections.ts
//
// Single source of truth for the sidebar's 9 role-gated sections (+ the
// Jakarta HQ Overview leaf-only entry), promoted out of SidebarNav.tsx's
// previously-inline per-section JSX blocks (Stage 1, contextual sidebar,
// 2026-09-18). SidebarSectorListView.tsx (Dashboard mode) and
// SidebarSectionMenu.tsx (in-sector mode) both render from this array —
// isNavItemVisible()/navPermissionMap.ts itself is untouched; this file only
// reorganizes WHERE those same isNavItemVisible() calls are grouped.
//
// `matches` reuses the same startsWith()/compound-key idioms SidebarNav.tsx's
// isSelected checks already relied on (e.g. NIAS_*/ARUN_*/SAVIOUR_* prefixes)
// instead of a static "member key list" — a static list would silently miss
// drill-down leaves (e.g. NIAS_LAYDOWN_1_2_LOG's legacy aliases), which would
// make the in-sector menu wrongly fall back to the sector list mid-drill-down.

import type { SubProcessKey } from '../../../types/lng';
import type { ActiveSession } from '../../../lib/rbac/activeSessionStore';
import { isNavItemVisible } from '../../../lib/rbac/navPermissionMap';
import { HMI_CONTROL_MAPS_REGISTRY } from '../../../config/hmiControlMapsRegistry';
import { NIAS_TANK_YARD_KEYS, NIAS_GAS_PROCESS_KEYS } from '../subtabs/LngProcessSubTabs';

// Stage 2 (site launch readiness, 2026-09-15) — hides the tab from the
// sidebar without deleting the SubProcessKey/route/component. Flip back to
// true to restore. (Moved here from SidebarNav.tsx, Stage 1 contextual
// sidebar — SidebarSectionMenu.tsx needs it too.)
export const SHOW_ISO_TANK_LOGISTICS_TAB = false;

export interface SidebarFleetCounts {
  arunCount: number;
  sailingCount: number;
  niasTotal: number;
  totalFleet: number;
}

export interface SidebarNavItemDef {
  key: SubProcessKey;
  label: string;
  badge?: (counts: SidebarFleetCounts) => string | number | undefined;
  isSelected?: (activeKey: SubProcessKey, activeSubTab?: string) => boolean;
  visible: (session: ActiveSession | null) => boolean;
}

export interface SidebarSectionDef {
  id: string;
  label: string;
  entryKey: SubProcessKey;
  hasSubMenu: boolean;
  headerBadge?: (counts: SidebarFleetCounts) => string | number | undefined;
  matches: (key: SubProcessKey) => boolean;
  items: SidebarNavItemDef[];
  visible: (session: ActiveSession | null) => boolean;
}

function section(def: Omit<SidebarSectionDef, 'visible'>): SidebarSectionDef {
  return { ...def, visible: (session) => def.items.some((item) => item.visible(session)) };
}

// Trucking/Environment/MOC each render as a single "<prefix>_HUB" leaf whose
// selection test is `activeKey.startsWith(prefix)` — same shape as SidebarNav.tsx's
// original renderNavItem(..., activeKey.startsWith('TRUCKING')) calls, factored out
// since all three sections are otherwise identical.
function prefixSection(id: string, label: string, hubKey: SubProcessKey, hubLabel: string, prefix: string): SidebarSectionDef {
  return section({
    id,
    label,
    entryKey: hubKey,
    hasSubMenu: true,
    matches: (key) => key.startsWith(prefix),
    items: [{ key: hubKey, label: hubLabel, isSelected: (k) => k.startsWith(prefix), visible: (s) => isNavItemVisible(hubKey, s) }],
  });
}

export const SIDEBAR_SECTIONS: SidebarSectionDef[] = [
  section({
    id: 'LNG_PROCESS',
    label: 'LNG-Process',
    entryKey: 'LNG_PROCESS_OVERVIEW',
    hasSubMenu: true,
    headerBadge: (c) => c.totalFleet,
    matches: (key) =>
      key.startsWith('NIAS_') ||
      key.startsWith('ARUN_') ||
      key.startsWith('SAVIOUR_') ||
      key === 'LNG_PROCESS_OVERVIEW' ||
      key === 'CALIBRATION_COMPLIANCE' ||
      key === 'DAILY_OPS_ISO_TANK_LOGISTICS' ||
      key === 'DAILY_OPS_ELECTRICAL_SYSTEM' ||
      key === 'DAILY_OPS_OVERVIEW',
    items: [
      { key: 'LNG_PROCESS_OVERVIEW', label: 'Overview', badge: (c) => c.totalFleet, isSelected: (k) => k === 'LNG_PROCESS_OVERVIEW' || k === 'NIAS_TERMINAL_OVERVIEW', visible: (s) => isNavItemVisible('LNG_PROCESS_OVERVIEW', s) },
      { key: 'ARUN_LOADING_COQ', label: 'PAGT (Arun)', badge: (c) => c.arunCount, isSelected: (k) => k.startsWith('ARUN'), visible: (s) => isNavItemVisible('ARUN_LOADING_COQ', s) },
      { key: 'SAVIOUR_VOYAGE_MONITORING', label: 'Marine Transit', badge: (c) => c.sailingCount, isSelected: (k) => k.startsWith('SAVIOUR'), visible: (s) => isNavItemVisible('SAVIOUR_VOYAGE_MONITORING', s) },
      { key: 'NIAS_TANK_OVERVIEW', label: 'Nias Tank Yard', badge: (c) => c.niasTotal, isSelected: (k) => NIAS_TANK_YARD_KEYS.includes(k), visible: (s) => isNavItemVisible('NIAS_TANK_OVERVIEW', s) },
      { key: 'NIAS_GAS_PROCESS_TELEMETRY', label: 'Regas & Gas Process', isSelected: (k) => NIAS_GAS_PROCESS_KEYS.includes(k), visible: (s) => isNavItemVisible('NIAS_GAS_PROCESS_TELEMETRY', s) },
      { key: 'DAILY_OPS_ISO_TANK_LOGISTICS', label: 'ISO Tank Logistics', visible: (s) => SHOW_ISO_TANK_LOGISTICS_TAB && isNavItemVisible('DAILY_OPS_ISO_TANK_LOGISTICS', s) },
      { key: 'NIAS_PLTMG_POWER_OUTPUT', label: 'PLTMG Power', visible: (s) => isNavItemVisible('NIAS_PLTMG_POWER_OUTPUT', s) },
    ],
  }),
  section({
    id: 'HMI_CONTROL_MAPS',
    label: 'HMI Control Maps',
    entryKey: HMI_CONTROL_MAPS_REGISTRY[0].key,
    hasSubMenu: true,
    matches: (key) => HMI_CONTROL_MAPS_REGISTRY.some((entry) => entry.key === key),
    items: HMI_CONTROL_MAPS_REGISTRY.map((entry) => ({
      key: entry.key,
      label: entry.label,
      visible: (s: ActiveSession | null) => isNavItemVisible(entry.key, s),
    })),
  }),
  section({
    id: 'EQUIPMENT_ASSET',
    label: 'Equipment & Asset',
    entryKey: 'EQUIPMENT_ASSET_REGISTRY',
    hasSubMenu: true,
    matches: (key) => key === 'EQUIPMENT_ASSET_REGISTRY' || key === 'GLOBAL_FLEET_HUB' || key === 'DATA_INGESTION_HUB',
    items: [
      { key: 'EQUIPMENT_ASSET_REGISTRY', label: 'All Assets Directory', visible: (s) => isNavItemVisible('EQUIPMENT_ASSET_REGISTRY', s) },
      { key: 'GLOBAL_FLEET_HUB', label: '120-Fleet Hub', visible: (s) => isNavItemVisible('GLOBAL_FLEET_HUB', s) },
      { key: 'DATA_INGESTION_HUB', label: 'CSV Ingestion', visible: (s) => isNavItemVisible('DATA_INGESTION_HUB', s) },
    ],
  }),
  section({
    id: 'WORK_ORDERS',
    label: 'Maintenance & Work Orders',
    entryKey: 'WORK_ORDER_DIRECTORY',
    hasSubMenu: true,
    matches: (key) =>
      key === 'WORK_ORDER_DIRECTORY' ||
      key === 'WORK_ORDER_MAINTENANCE' ||
      key === 'PM_SCHEDULES' ||
      key === 'MAINTENANCE_MRO_HUB' ||
      key === 'MRO_PARTS_INVENTORY',
    items: [
      { key: 'WORK_ORDER_DIRECTORY', label: 'Work Orders', isSelected: (k) => k === 'WORK_ORDER_DIRECTORY' || k === 'WORK_ORDER_MAINTENANCE', visible: (s) => isNavItemVisible('WORK_ORDER_DIRECTORY', s) },
      { key: 'PM_SCHEDULES', label: 'Preventive Maintenance', visible: (s) => isNavItemVisible('PM_SCHEDULES', s) },
      { key: 'MAINTENANCE_MRO_HUB', label: 'MRO Depot', visible: (s) => isNavItemVisible('MAINTENANCE_MRO_HUB', s) },
    ],
  }),
  section({
    id: 'MANNING',
    label: 'Site Manning & Roster',
    entryKey: 'MANPOWER_DAILY_SHIFT',
    hasSubMenu: true,
    matches: (key) =>
      key === 'MANPOWER_DAILY_SHIFT' ||
      key === 'MANPOWER_SHIFT_ROSTER' ||
      key === 'MANPOWER_MONTHLY_GRID' ||
      key === 'MANPOWER_ROTATION_TRACKER' ||
      key === 'MANPOWER_TRAINING_MATRIX',
    items: [
      { key: 'MANPOWER_DAILY_SHIFT', label: 'Overview', badge: () => 19, isSelected: (k, sub) => k === 'MANPOWER_DAILY_SHIFT' && (sub === 'OVERVIEW' || !sub), visible: (s) => isNavItemVisible('MANPOWER_DAILY_SHIFT', s) },
      { key: 'MANPOWER_SHIFT_ROSTER', label: 'Daily Board', isSelected: (k, sub) => k === 'MANPOWER_SHIFT_ROSTER' && sub === 'DAILY_SHIFT_BOARD', visible: (s) => isNavItemVisible('MANPOWER_SHIFT_ROSTER', s) },
      { key: 'MANPOWER_MONTHLY_GRID', label: 'Monthly Plan', isSelected: (k, sub) => k === 'MANPOWER_MONTHLY_GRID' && sub === 'MONTHLY_GRID', visible: (s) => isNavItemVisible('MANPOWER_MONTHLY_GRID', s) },
      { key: 'MANPOWER_ROTATION_TRACKER', label: 'Rotation', isSelected: (k, sub) => k === 'MANPOWER_ROTATION_TRACKER' && sub === 'ROTATION_TRACKER', visible: (s) => isNavItemVisible('MANPOWER_ROTATION_TRACKER', s) },
      { key: 'MANPOWER_TRAINING_MATRIX', label: 'Training Matrix', isSelected: (k, sub) => k === 'MANPOWER_TRAINING_MATRIX' && sub === 'TRAINING_MATRIX', visible: (s) => isNavItemVisible('MANPOWER_TRAINING_MATRIX', s) },
    ],
  }),
  section({
    id: 'SAFETY_PTW',
    label: 'Safety & PTW',
    entryKey: 'SAFETY_OVERVIEW',
    hasSubMenu: true,
    matches: (key) =>
      key === 'SAFETY_OVERVIEW' ||
      key === 'PTW_PERMITS' ||
      key === 'MANPOWER_PTW' ||
      key === 'SAFETY_GAS_TESTING' ||
      key === 'SAFETY_ERT_READINESS' ||
      key === 'SAFETY_SOP_REFERENCE',
    items: [
      { key: 'SAFETY_OVERVIEW', label: 'Overview', visible: (s) => isNavItemVisible('SAFETY_OVERVIEW', s) },
      { key: 'PTW_PERMITS', label: 'Permits', isSelected: (k) => k === 'PTW_PERMITS' || k === 'MANPOWER_PTW', visible: (s) => isNavItemVisible('PTW_PERMITS', s) },
      { key: 'SAFETY_GAS_TESTING', label: 'Gas Logs', visible: (s) => isNavItemVisible('SAFETY_GAS_TESTING', s) },
      { key: 'SAFETY_ERT_READINESS', label: 'ERT', visible: (s) => isNavItemVisible('SAFETY_ERT_READINESS', s) },
      { key: 'SAFETY_SOP_REFERENCE', label: 'SOP Reference', visible: (s) => isNavItemVisible('SAFETY_SOP_REFERENCE', s) },
    ],
  }),
  prefixSection('TRUCKING', 'Trucking & Logistics', 'TRUCKING_HUB', 'NP-03 Hub', 'TRUCKING'),
  prefixSection('ENVIRONMENT', 'Environment & Waste', 'ENVIRONMENT_HUB', 'NP-10 Hub', 'ENVIRONMENT'),
  prefixSection('MOC', 'Management of Change', 'MOC_HUB', 'NP-12 Hub', 'MOC'),
  section({
    id: 'HQ_OVERVIEW',
    label: 'Jakarta HQ Overview',
    entryKey: 'HQ_OVERVIEW_DASHBOARD',
    hasSubMenu: false,
    matches: (key) => key === 'HQ_OVERVIEW_DASHBOARD',
    items: [
      { key: 'HQ_OVERVIEW_DASHBOARD', label: 'Jakarta HQ Overview', visible: (s) => isNavItemVisible('HQ_OVERVIEW_DASHBOARD', s) },
    ],
  }),
];
