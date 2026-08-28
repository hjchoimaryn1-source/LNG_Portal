// src/components/HeaderNavigation.tsx
"use client";

import React from 'react';

export type ArunSubTab =
  | 'OPERATIONS_YARD'
  | 'CUSTODY_COQ'
  | 'LOADING_COQ_ENTRY'
  | 'VESSEL_LOADING'
  | 'ARUN_DISPATCH'
  | 'SAVIOR_STOWAGE'
  | 'LAB_COQ_SPEC'
  | 'MASTER_HISTORY_SHEET';

interface HeaderNavigationProps {
  activeTab: ArunSubTab;
  setActiveTab: (tab: ArunSubTab) => void;
  certificateCount?: number;
}

export default function HeaderNavigation({
  activeTab,
  setActiveTab,
  certificateCount = 0,
}: HeaderNavigationProps) {
  return (
    <section className="shrink-0 win-panel px-3 py-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
      <div>
        <h2 className="text-base sm:text-lg font-black text-blue-950">
          PAGT (Arun) Operations
        </h2>
      </div>

      {/* 4 Dedicated Sub-Tabs Navigation Bar (Classic Windows SCADA Tabs) */}
      <div className="flex items-center gap-1 text-xs font-bold overflow-x-auto max-w-full">
        {/* Tab 1: Field & Heel */}
        <button
          type="button"
          onClick={() => setActiveTab('OPERATIONS_YARD')}
          className={`cursor-pointer ${
            activeTab === 'OPERATIONS_YARD'
              ? 'win-tab-active'
              : 'win-tab-inactive'
          }`}
        >
          <span>Field & Heel</span>
        </button>

        {/* Tab 2: Custody & COQ */}
        <button
          type="button"
          onClick={() => setActiveTab('CUSTODY_COQ')}
          className={`cursor-pointer ${
            activeTab === 'CUSTODY_COQ' || activeTab === 'LOADING_COQ_ENTRY'
              ? 'win-tab-active'
              : 'win-tab-inactive'
          }`}
        >
          <span>Custody &amp; COQ</span>
        </button>

        {/* Tab 3: Loading */}
        <button
          type="button"
          onClick={() => setActiveTab('VESSEL_LOADING')}
          className={`cursor-pointer ${
            activeTab === 'VESSEL_LOADING' ||
            activeTab === 'ARUN_DISPATCH' ||
            activeTab === 'SAVIOR_STOWAGE' ||
            activeTab === 'LAB_COQ_SPEC'
              ? 'win-tab-active'
              : 'win-tab-inactive'
          }`}
        >
          <span>Loading</span>
        </button>

        {/* Tab 4: Ledger */}
        <button
          type="button"
          onClick={() => setActiveTab('MASTER_HISTORY_SHEET')}
          className={`cursor-pointer ${
            activeTab === 'MASTER_HISTORY_SHEET'
              ? 'win-tab-active'
              : 'win-tab-inactive'
          }`}
        >
          <span>Ledger {certificateCount > 0 ? `(${certificateCount})` : ''}</span>
        </button>
      </div>
    </section>
  );
}
