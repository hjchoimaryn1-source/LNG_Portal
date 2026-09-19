// src/components/portal/sidebar/SidebarSectionSubItems.tsx
//
// Extracted out of SidebarSectionMenu.tsx (2026-09-19, sidebar submenu
// inline-expansion stage) — the exact leaf-item row markup/role-gating is now
// shared by both in-sector mode (SidebarSectionMenu.tsx) and the flat
// Dashboard-mode sector list (SidebarSectorListView.tsx, which now shows each
// section's second-level items inline instead of requiring an extra click
// into the section first). Keeping this as one component is the point: two
// independently hand-copied versions of this same list is exactly the class
// of bug diagnosed this session (PortalTitleBar.tsx used to read its own
// separate CMMS_MODULES array — since unified onto this same
// sidebarSections.ts SIDEBAR_SECTIONS source, 2026-09-19).
"use client";

import React from 'react';
import type { ActiveSession } from '../../../lib/rbac/activeSessionStore';
import type { SubProcessKey } from '../../../types/lng';
import type { SidebarNavItemDef, SidebarFleetCounts } from './sidebarSections';

interface SidebarSectionSubItemsProps {
  items: SidebarNavItemDef[];
  session: ActiveSession | null;
  activeKey: SubProcessKey;
  activeSubTab: string | undefined;
  counts: SidebarFleetCounts;
  onSelectKey: (key: SubProcessKey) => void;
}

export default function SidebarSectionSubItems({
  items,
  session,
  activeKey,
  activeSubTab,
  counts,
  onSelectKey,
}: SidebarSectionSubItemsProps) {
  return (
    <div className="bg-[#d4d0c8]">
      {items
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
  );
}
