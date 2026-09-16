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
    initialSubTab === 'GC_GAS_QUALITY' ||
    initialSubTab === 'GAS_METERING_LEDGER' ||
    initialSubTab === 'NIAS_GAS_METERING_LEDGER' ||
    initialSubTab === 'PLTMG_POWER_OUTPUT' ||
    initialSubTab === 'CUSTODY_HEAT_SETTLEMENT' ||
    initialSubTab === 'FOUR_BAY_REGAS_GC' ||
    initialSubTab === 'ACTIVE_REGAS_TELEMETRY' ||
    initialSubTab === 'ACTIVE_REGAS' ||
    initialSubTab === 'HEAT_SETTLEMENT'
  ) {
    return 'REGAS_SYSTEM';
  }
  return 'ISO_TANK_MGMT';
}

function resolveInitialTankTab(initialSubTab: string | undefined): NiasTankSubTab {
  if (
    initialSubTab === 'LAYDOWN_1_2_LOG' ||
    initialSubTab === 'DAILY_CONDITION_BOG' ||
    initialSubTab === 'DAILY_LOG_DEPRESS' ||
    initialSubTab === 'LAYDOWN_DEPRESS'
  ) {
    return 'LAYDOWN_1_2_LOG';
  }
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
  if (
    initialSubTab === 'TANK_MASS_BALANCE' ||
    initialSubTab === 'MASS_BALANCE_LOG' ||
    initialSubTab === 'MASS_BALANCE'
  ) {
    return 'TANK_MASS_BALANCE';
  }
  return 'TANK_OVERVIEW';
}

function resolveInitialRegasTab(initialSubTab: string | undefined): NiasRegasSubTab {
  if (initialSubTab === 'GC_GAS_QUALITY' || initialSubTab === 'NIAS_GC_GAS_QUALITY') return 'GC_GAS_QUALITY';
  if (initialSubTab === 'GAS_METERING_LEDGER' || initialSubTab === 'NIAS_GAS_METERING_LEDGER') return 'GAS_METERING_LEDGER';
  if (initialSubTab === 'PLTMG_POWER_OUTPUT') return 'PLTMG_POWER_OUTPUT';
  if (initialSubTab === 'CUSTODY_HEAT_SETTLEMENT' || initialSubTab === 'HEAT_SETTLEMENT') {
    return 'CUSTODY_HEAT_SETTLEMENT';
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
