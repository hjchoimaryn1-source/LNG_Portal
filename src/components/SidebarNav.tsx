// src/components/SidebarNav.tsx
"use client";

import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { SubProcessKey } from '../types/lng';
import { COMPANY_CONFIG } from '../config/siteConfig';
import SidebarSectorListView from './portal/sidebar/SidebarSectorListView';
import SidebarSectionMenu from './portal/sidebar/SidebarSectionMenu';

interface SidebarNavProps {
  activeKey: SubProcessKey;
  activeSubTab?: string;
  onSelectKey: (key: SubProcessKey) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

// Stage 1 (contextual sidebar, 2026-09-18): Dashboard shows a flat sector-picker
// list (SidebarSectorListView); inside any sector, that sector's own leaf
// sub-menu fully replaces the list (SidebarSectionMenu) — see sidebarSections.ts
// for the shared section data both views render from.
export default function SidebarNav({
  activeKey,
  activeSubTab,
  onSelectKey,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarNavProps) {
  const isDashboardActive = activeKey === 'CMMS_OVERVIEW_DASHBOARD';

  const handleItemClick = (key: SubProcessKey) => {
    onSelectKey(key);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-full w-72 sm:w-80 shrink-0 bg-[#d4d0c8] border-r-2 border-[#404040] flex flex-col justify-between transition-transform duration-150 select-none ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* 1. 최상단 프로그램 타이틀 바 */}
      <div className="py-2 border-b border-slate-400 bg-[#e4e0d8] text-center select-none shrink-0 shadow-2xs">
        <span className="text-sm font-black tracking-wider text-slate-900 uppercase">
          NIAS CMMS
        </span>
      </div>

      {/* 2. 로고 블록 */}
      <div className="p-1.5 shrink-0 bg-[#d4d0c8] border-b border-[#808080]">
        <div className="flex flex-col items-center justify-center p-2 bg-[#d4d0c8] border border-slate-400 win-panel shadow-2xs">
          <img
            src="/images/bsg-lines-logo.png"
            alt="BSG Lines Logo"
            className="h-9 w-auto object-contain mx-auto mb-1"
          />
          <h1 className="text-[10px] font-bold text-slate-900 text-center uppercase tracking-tight leading-tight">
            {COMPANY_CONFIG.companyName}
          </h1>
        </div>
      </div>

      {/* 3. DASHBOARD master container — 헤더가 그 아래 섹터 목록/서브메뉴 전체를 지배 (Stage 2, 2026-09-18) */}
      <div className="win-panel m-1.5 p-0 flex-1 overflow-hidden flex flex-col">
        <button
          onClick={() => handleItemClick('CMMS_OVERVIEW_DASHBOARD')}
          className="win-titlebar w-full text-left cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">DASHBOARD</span>
          </span>
        </button>
        <div className="win-well p-0 flex-1 overflow-y-auto font-sans text-xs bg-[#d4d0c8] border border-[#808080] space-y-1">
          {isDashboardActive ? (
            <SidebarSectorListView onSelectKey={handleItemClick} />
          ) : (
            <SidebarSectionMenu activeKey={activeKey} activeSubTab={activeSubTab} onSelectKey={handleItemClick} />
          )}
        </div>
      </div>

      {/* 4. Windows Statusbar Footer */}
      <div className="bg-[#d4d0c8] border-t border-[#808080] px-2 py-1 text-[10px] font-mono text-black flex items-center justify-between shrink-0">
        <div className="win-sunken px-1.5 py-0 flex-1 truncate mr-1">BSG CMMS Online</div>
        <div className="win-sunken px-1.5 py-0 text-blue-900 font-bold">SYS: OK</div>
      </div>
    </aside>
  );
}
