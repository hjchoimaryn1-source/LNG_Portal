// src/components/portal/subtabs/LngProcessSubTabs.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../utils/portalTabStyles';

interface LngProcessSubTabsProps {
  activeKey: SubProcessKey;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

// Nias sub-tab flattening (2026-09-16) — group membership for the Nias
// LNG-Process tabs that cover multiple SubProcessKey leaves (see
// LngProcessRoutes.tsx for the matching content routes).
// Exported so SidebarNav.tsx (the other nav surface with the same Nias
// split) stays consistent with this grouping — single source of truth.
// PLTMG Power fold-back (2026-09-16): NIAS_PLTMG_POWER_OUTPUT no longer has
// its own second-row tab — it's a first-level sub-tab inside "Regas & Gas
// Process" now (see NiasRegasGasProcessView.tsx), so it joins this group for
// second-row highlighting/routing purposes.
export const NIAS_TANK_YARD_KEYS: SubProcessKey[] = [
  'NIAS_TANK_OVERVIEW',
  'NIAS_LAYDOWN_1_2_LOG',
  'NIAS_ACTIVE_BAY_TANKS',
  'NIAS_LAYDOWN_3_HEEL',
];
export const NIAS_GAS_PROCESS_KEYS: SubProcessKey[] = [
  'NIAS_GAS_PROCESS_TELEMETRY',
  'NIAS_PATROL_LOG',
  'NIAS_GAS_METERING_DAILY',
  'NIAS_PLTMG_POWER_OUTPUT',
  'NIAS_HEAT_SETTLEMENT',
];

export default function LngProcessSubTabs({ activeKey, handleSelectSubProcess }: LngProcessSubTabsProps) {
  return (
    <>
      <button
        onClick={() => handleSelectSubProcess('LNG_PROCESS_OVERVIEW')}
        className={
          activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW'
            ? WIN_TAB_ACTIVE
            : WIN_TAB_INACTIVE
        }
      >
        <span>Overview</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('ARUN_LOADING_COQ')}
        className={activeKey.startsWith('ARUN') ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>PAGT ( Arun )</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('SAVIOUR_VOYAGE_MONITORING')}
        className={activeKey.startsWith('SAVIOUR') ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Marine Transit</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('NIAS_TANK_OVERVIEW')}
        className={
          NIAS_TANK_YARD_KEYS.includes(activeKey) ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE
        }
      >
        <span>Nias Tank Yard</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('NIAS_GAS_PROCESS_TELEMETRY')}
        className={
          NIAS_GAS_PROCESS_KEYS.includes(activeKey) ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE
        }
      >
        <span>Regas &amp; Gas Process</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('DAILY_OPS_ELECTRICAL_SYSTEM')}
        className={activeKey === 'DAILY_OPS_ELECTRICAL_SYSTEM' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Electrical System</span>
      </button>

    </>
  );
}
