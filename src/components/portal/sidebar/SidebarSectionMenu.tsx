// src/components/portal/sidebar/SidebarSectionMenu.tsx
//
// In-sector-mode sidebar (Stage 1, contextual sidebar, 2026-09-18): renders
// ONLY the one section whose members include the current activeKey, expanded
// with its full leaf list — same markup/behavior as SidebarNav.tsx's former
// flattened per-section blocks, just scoped to one section instead of all 9.
//
// If activeKey doesn't belong to any section with a submenu (e.g.
// HQ_OVERVIEW_DASHBOARD, which is a leaf-only sector-list entry with nothing
// beneath it), falls back to the sector list rather than rendering an empty
// header — an empty submenu would strand the user with no way back out.
"use client";

import React, { useMemo } from 'react';
import { NodeState, SubProcessKey } from '../../../types/lng';
import { useFleetTankFacade } from '../../../hooks/portalDataFacade/useFleetTankFacade';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import { SIDEBAR_SECTIONS, SidebarFleetCounts } from './sidebarSections';
import SidebarSectorListView from './SidebarSectorListView';

const SECTION_HEADER_BEVEL =
  "bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-2.5 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between cursor-default select-none shadow-xs";

interface SidebarSectionMenuProps {
  activeKey: SubProcessKey;
  activeSubTab?: string;
  onSelectKey: (key: SubProcessKey) => void;
}

export default function SidebarSectionMenu({ activeKey, activeSubTab, onSelectKey }: SidebarSectionMenuProps) {
  const { fleetTanks } = useFleetTankFacade();
  const session = useActiveSession();

  const counts: SidebarFleetCounts = useMemo(() => {
    let arunCount = 0;
    let sailingCount = 0;
    let laydownCount = 0;
    let regasBayCount = 0;
    let emptyReturnCount = 0;

    fleetTanks.forEach((t) => {
      if (t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL) arunCount++;
      else if (t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT) sailingCount++;
      else if (t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD) laydownCount++;
      else if (t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY) regasBayCount++;
      else if (t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE) emptyReturnCount++;
    });

    return {
      arunCount,
      sailingCount,
      niasTotal: laydownCount + regasBayCount + emptyReturnCount,
      totalFleet: fleetTanks.length,
    };
  }, [fleetTanks]);

  const activeSection = SIDEBAR_SECTIONS.find((sec) => sec.matches(activeKey));

  if (!activeSection || !activeSection.hasSubMenu) {
    return <SidebarSectorListView onSelectKey={onSelectKey} />;
  }

  return (
    <div>
      <div className={SECTION_HEADER_BEVEL}>
        <span>{activeSection.label}</span>
        {activeSection.headerBadge && (
          <span className="font-mono text-xs font-bold text-slate-900">{activeSection.headerBadge(counts)}</span>
        )}
      </div>
      <div className="bg-[#d4d0c8]">
        {activeSection.items
          .filter((item) => item.visible(session))
          .map((item) => {
            const isSelected = item.isSelected ? item.isSelected(activeKey, activeSubTab) : activeKey === item.key;
            const badgeValue = item.badge?.(counts);
            return (
              <button
                key={item.key + item.label}
                onClick={() => onSelectKey(item.key)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-none select-none ${
                  isSelected
                    ? 'bg-slate-100 text-slate-950 font-extrabold border-t border-l border-b border-r border-t-slate-500 border-l-slate-500 border-b-white border-r-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.12)]'
                    : 'bg-transparent text-slate-700 font-normal border-b border-slate-300 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center">
                  {isSelected && (
                    <span className="text-[9px] text-slate-950 font-black mr-1.5 leading-none select-none">▶</span>
                  )}
                  <span>{item.label}</span>
                </span>
                {badgeValue !== undefined && (
                  <span className={`font-mono text-xs ${isSelected ? 'text-slate-950 font-bold' : 'text-slate-600'}`}>
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
