// src/components/portal/subtabs/LngProcessSubTabs.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../utils/portalTabStyles';

interface LngProcessSubTabsProps {
  activeKey: SubProcessKey;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

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
          activeKey.startsWith('NIAS') &&
          activeKey !== 'LNG_PROCESS_OVERVIEW' &&
          activeKey !== 'NIAS_TERMINAL_OVERVIEW'
            ? WIN_TAB_ACTIVE
            : WIN_TAB_INACTIVE
        }
      >
        <span>Nias Regas Unit</span>
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
