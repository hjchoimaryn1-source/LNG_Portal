// src/components/portal/sidebar/SidebarSectorListView.tsx
//
// Dashboard-mode sidebar (Stage 1, contextual sidebar, 2026-09-18): a flat
// list of section headers only, filtered by role visibility exactly as
// today's flattened SidebarNav.tsx list already was. Clicking a header
// navigates to that sector's entry leaf key — same navigation call every
// section header already used before this split.
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import { SIDEBAR_SECTIONS } from './sidebarSections';

const SECTOR_HEADER_BUTTON =
  "w-full text-left bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-2.5 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between cursor-pointer select-none shadow-xs hover:bg-[#e0dcd4]";

interface SidebarSectorListViewProps {
  onSelectKey: (key: SubProcessKey) => void;
}

export default function SidebarSectorListView({ onSelectKey }: SidebarSectorListViewProps) {
  const session = useActiveSession();
  const visibleSections = SIDEBAR_SECTIONS.filter((sec) => sec.visible(session));

  return (
    <div>
      <div className="p-1 border-b border-[#808080] bg-[#e0dcd4]">
        <div className="w-full py-1.5 px-2 text-xs font-mono font-bold flex items-center gap-1.5 text-slate-900">
          <span className="text-emerald-700 font-black text-xs">■</span>
          <span>SECTOR LAUNCHER</span>
        </div>
      </div>
      {visibleSections.map((sec) => (
        <button key={sec.id} onClick={() => onSelectKey(sec.entryKey)} className={SECTOR_HEADER_BUTTON}>
          <span>{sec.label}</span>
        </button>
      ))}
    </div>
  );
}
