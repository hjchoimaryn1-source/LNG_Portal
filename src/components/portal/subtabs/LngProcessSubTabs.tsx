// src/components/portal/subtabs/LngProcessSubTabs.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../utils/portalTabStyles';

interface LngProcessSubTabsProps {
  activeKey: SubProcessKey;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

// Nias sub-tab flattening (2026-09-16) — group membership for the two Nias
// LNG-Process tabs that now cover multiple SubProcessKey leaves (see
// LngProcessRoutes.tsx for the matching content routes). PLTMG Power has a
// single leaf so it's compared directly, no group needed.
// Exported so SidebarNav.tsx (the other nav surface with the same 3-way
// Nias split) stays consistent with this grouping — single source of truth.
export const NIAS_TANK_YARD_KEYS: SubProcessKey[] = [
  'NIAS_TANK_OVERVIEW',
  'NIAS_LAYDOWN_1_2_LOG',
  'NIAS_ACTIVE_BAY_TANKS',
  'NIAS_LAYDOWN_3_HEEL',
];
export const NIAS_GAS_PROCESS_KEYS: SubProcessKey[] = [
  'NIAS_GAS_PROCESS_TELEMETRY',
  'NIAS_GC_GAS_QUALITY',
  'NIAS_GAS_METERING_LEDGER',
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
        onClick={() => handleSelectSubProcess('NIAS_PLTMG_POWER_OUTPUT')}
        className={activeKey === 'NIAS_PLTMG_POWER_OUTPUT' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>PLTMG Power</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('MAINTENANCE_MRO_HUB')}
        className={activeKey === 'MAINTENANCE_MRO_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Maintenance & Depot</span>
      </button>
    </>
  );
}
