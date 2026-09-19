// src/components/locations/nias/utils/resolveNiasInitialView.ts
//
// PURPOSE
//   Phase 13 Target A — pure extraction of NiasTerminalView.tsx's three
//   resolveInitial*() closures (domain / tank sub-tab / regas sub-tab), moved
//   verbatim (no logic change) so they can be unit-tested directly and to
//   shrink NiasTerminalView.tsx toward the 700-line cap. React-free
//   (AGENTS.md §3 Logic/Data Layer convention).

import type { NiasDomain, NiasTankSubTab, NiasRegasSubTab } from '../../NiasTerminalView';

export interface ResolveNiasInitialViewInput {
  initialDomain?: NiasDomain;
  initialSubTab?: string;
}

export interface ResolvedNiasInitialView {
  domain: NiasDomain;
  tankSubTab: NiasTankSubTab;
  regasSubTab: NiasRegasSubTab;
}

function resolveInitialDomain(initialDomain: NiasDomain | undefined, initialSubTab: string | undefined): NiasDomain {
  if (initialDomain) return initialDomain;
  if (
    initialSubTab === 'TERMINAL_OVERVIEW' ||
    initialSubTab === 'NIAS_TERMINAL_OVERVIEW' ||
    initialSubTab === 'OPERATIONAL_OVERVIEW'
  ) {
    return 'TERMINAL_OVERVIEW';
  }
  if (
    initialSubTab === 'GAS_PROCESS_TELEMETRY' ||
    initialSubTab === 'PATROL_LOG' ||
    initialSubTab === 'GAS_METERING_DAILY' ||
    initialSubTab === 'NIAS_GAS_METERING_DAILY' ||
    initialSubTab === 'CUSTODY_HEAT_SETTLEMENT' ||
    initialSubTab === 'FOUR_BAY_REGAS_GC' ||
    initialSubTab === 'ACTIVE_REGAS_TELEMETRY' ||
    initialSubTab === 'ACTIVE_REGAS' ||
    initialSubTab === 'HEAT_SETTLEMENT' ||
    // ISO Tank & Mass Balance relocation (2026-09-18): LAYDOWN_1_2_LOG /
    // TANK_MASS_BALANCE moved from ISO_TANK_MGMT to REGAS_SYSTEM.
    initialSubTab === 'LAYDOWN_1_2_LOG' ||
    initialSubTab === 'DAILY_CONDITION_BOG' ||
    initialSubTab === 'DAILY_LOG_DEPRESS' ||
    initialSubTab === 'LAYDOWN_DEPRESS' ||
    initialSubTab === 'TANK_MASS_BALANCE' ||
    initialSubTab === 'MASS_BALANCE_LOG' ||
    initialSubTab === 'MASS_BALANCE' ||
    // Electrical System / Daily Ops Overview relocation (2026-09-18 correction):
    // moved from top-level tabs into Regas & Gas Process sub-tabs.
    initialSubTab === 'ELECTRICAL_SYSTEM' ||
    initialSubTab === 'DAILY_OPS_ELECTRICAL_SYSTEM' ||
    initialSubTab === 'DAILY_OPS_OVERVIEW'
  ) {
    return 'REGAS_SYSTEM';
  }
  return 'ISO_TANK_MGMT';
}

function resolveInitialTankTab(initialSubTab: string | undefined): NiasTankSubTab {
  if (initialSubTab === 'ACTIVE_BAY_TANKS' || initialSubTab === 'BAY_MOUNTED_TANKS') {
    return 'ACTIVE_BAY_TANKS';
  }
  if (
    initialSubTab === 'LAYDOWN_3_HEEL' ||
    initialSubTab === 'EMPTY_RETURN_BACKHAUL' ||
    initialSubTab === 'EMPTY_RETURN'
  ) {
    return 'LAYDOWN_3_HEEL';
  }
  return 'TANK_OVERVIEW';
}

function resolveInitialRegasTab(initialSubTab: string | undefined): NiasRegasSubTab {
  if (initialSubTab === 'PATROL_LOG' || initialSubTab === 'NIAS_PATROL_LOG') return 'PATROL_LOG';
  if (initialSubTab === 'GAS_METERING_DAILY' || initialSubTab === 'NIAS_GAS_METERING_DAILY') return 'GAS_METERING_DAILY';
  // ISO Tank & Mass Balance relocation (2026-09-18): these two moved here
  // from resolveInitialTankTab, same accepted alias strings as before.
  if (
    initialSubTab === 'LAYDOWN_1_2_LOG' ||
    initialSubTab === 'DAILY_CONDITION_BOG' ||
    initialSubTab === 'DAILY_LOG_DEPRESS' ||
    initialSubTab === 'LAYDOWN_DEPRESS'
  ) {
    return 'LAYDOWN_1_2_LOG';
  }
  if (
    initialSubTab === 'TANK_MASS_BALANCE' ||
    initialSubTab === 'MASS_BALANCE_LOG' ||
    initialSubTab === 'MASS_BALANCE'
  ) {
    return 'TANK_MASS_BALANCE';
  }
  if (initialSubTab === 'CUSTODY_HEAT_SETTLEMENT' || initialSubTab === 'HEAT_SETTLEMENT') {
    return 'CUSTODY_HEAT_SETTLEMENT';
  }
  // Electrical System / Daily Ops Overview relocation (2026-09-18 correction):
  // moved from top-level tabs into Regas & Gas Process sub-tabs.
  if (initialSubTab === 'ELECTRICAL_SYSTEM' || initialSubTab === 'DAILY_OPS_ELECTRICAL_SYSTEM') {
    return 'ELECTRICAL_SYSTEM';
  }
  if (initialSubTab === 'DAILY_OPS_OVERVIEW') {
    return 'DAILY_OPS_OVERVIEW';
  }
  return 'GAS_PROCESS_TELEMETRY';
}

export function resolveNiasInitialView({
  initialDomain,
  initialSubTab,
}: ResolveNiasInitialViewInput): ResolvedNiasInitialView {
  return {
    domain: resolveInitialDomain(initialDomain, initialSubTab),
    tankSubTab: resolveInitialTankTab(initialSubTab),
    regasSubTab: resolveInitialRegasTab(initialSubTab),
  };
}
