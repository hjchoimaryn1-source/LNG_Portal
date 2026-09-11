// src/components/portal/subtabs/ManpowerSubTabs.tsx
"use client";

import React from 'react';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../utils/portalTabStyles';
import { ManpowerTabKey, NORMALIZE_MANPOWER_TAB } from '../utils/manpowerTabConstants';

interface ManpowerSubTabsProps {
  activeSubTab: string;
  handleManpowerSubTab: (tab: ManpowerTabKey) => void;
}

const MANPOWER_SUB_TABS: Array<{ key: ManpowerTabKey; label: string }> = [
  { key: 'OVERVIEW', label: 'Overview' },
  { key: 'DAILY_SHIFT_BOARD', label: 'Daily Board' },
  { key: 'MONTHLY_GRID', label: 'Monthly Plan' },
  { key: 'ROTATION_TRACKER', label: 'Rotation' },
  { key: 'TRAINING_MATRIX', label: 'Training Matrix' },
];

export default function ManpowerSubTabs({ activeSubTab, handleManpowerSubTab }: ManpowerSubTabsProps) {
  return (
    <>
      {MANPOWER_SUB_TABS.map(({ key, label }) => {
        const isActive = NORMALIZE_MANPOWER_TAB(activeSubTab || 'OVERVIEW') === key;
        return (
          <button
            key={key}
            onClick={() => handleManpowerSubTab(key)}
            className={isActive ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
          >
            <span>{label}</span>
          </button>
        );
      })}
    </>
  );
}
