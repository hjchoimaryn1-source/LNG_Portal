// src/components/portal/subtabs/SafetySubTabs.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../utils/portalTabStyles';

interface SafetySubTabsProps {
  activeKey: SubProcessKey;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

export default function SafetySubTabs({ activeKey, handleSelectSubProcess }: SafetySubTabsProps) {
  return (
    <>
      <button
        onClick={() => handleSelectSubProcess('SAFETY_OVERVIEW')}
        className={activeKey === 'SAFETY_OVERVIEW' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Overview</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('PTW_PERMITS')}
        className={activeKey === 'PTW_PERMITS' || activeKey === 'MANPOWER_PTW' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Permits</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('SAFETY_GAS_TESTING')}
        className={activeKey === 'SAFETY_GAS_TESTING' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Gas Logs</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('SAFETY_ERT_READINESS')}
        className={activeKey === 'SAFETY_ERT_READINESS' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>ERT</span>
      </button>
    </>
  );
}
