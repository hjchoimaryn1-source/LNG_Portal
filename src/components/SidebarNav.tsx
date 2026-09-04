// src/components/SidebarNav.tsx
"use client";

import React, { useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { NodeState, SubProcessKey } from '../types/lng';
import { COMPANY_CONFIG } from '../config/siteConfig';

interface SidebarNavProps {
  activeKey: SubProcessKey;
  activeSubTab?: string;
  onSelectKey: (key: SubProcessKey) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

// Windows Classic 3D Raised Bevel Section Header Style
const SECTION_HEADER_BEVEL =
  "bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-2.5 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between cursor-default select-none shadow-xs";

export default function SidebarNav({
  activeKey,
  activeSubTab,
  onSelectKey,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarNavProps) {
  const { fleetTanks } = usePortalData();

  // Compute live tank distribution for LNG-Process only
  const counts = useMemo(() => {
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

  const handleItemClick = (key: SubProcessKey) => {
    onSelectKey(key);
    if (onCloseMobile) onCloseMobile();
  };

  // Helper to render Sunken/Pressed classic item on Active
  const renderNavItem = (
    key: SubProcessKey,
    label: string,
    badgeValue?: string | number,
    isSelectedCustom?: boolean
  ) => {
    const isSelected = isSelectedCustom !== undefined ? isSelectedCustom : activeKey === key;
    return (
      <button
        key={key + label}
        onClick={() => handleItemClick(key)}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-none select-none ${
          isSelected
            ? 'bg-slate-100 text-slate-950 font-extrabold border-t border-l border-b border-r border-t-slate-500 border-l-slate-500 border-b-white border-r-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.12)]'
            : 'bg-transparent text-slate-700 font-normal border-b border-slate-300 hover:bg-slate-200 hover:text-slate-900'
        }`}
      >
        <span className="flex items-center">
          {isSelected && (
            <span className="text-[9px] text-slate-950 font-black mr-1.5 leading-none select-none">
              ▶
            </span>
          )}
          <span>{label}</span>
        </span>
        {badgeValue !== undefined && (
          <span
            className={`font-mono text-xs ${
              isSelected ? 'text-slate-950 font-bold' : 'text-slate-600'
            }`}
          >
            {badgeValue}
          </span>
        )}
      </button>
    );
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

      {/* 3. 메뉴 리스트 (3D 베벨 대메뉴 블록 + 클래식 오목 서브 버튼 목록) */}
      <div className="win-well m-1.5 p-0 flex-1 overflow-y-auto font-sans text-xs bg-[#d4d0c8] border border-[#808080] space-y-1">
        {/* SECTOR LAUNCHER HUB SHORTCUT */}
        <div className="p-1 border-b border-[#808080] bg-[#e0dcd4]">
          <button
            onClick={() => handleItemClick('SECTOR_LAUNCHER')}
            className={`w-full win-btn py-1.5 px-2 text-xs font-mono font-bold flex items-center justify-between cursor-pointer ${
              activeKey === 'SECTOR_LAUNCHER'
                ? 'bg-slate-100 text-slate-950 font-black border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-inner'
                : 'bg-[#d4d0c8] text-slate-900 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-700 font-black text-xs">■</span>
              <span>SECTOR LAUNCHER</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">[HUB]</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 1. LNG-PROCESS                                                            */}
        {/* ========================================================================= */}
        <div>
          {/* 3D Classic Raised Bevel Header */}
          <div className={SECTION_HEADER_BEVEL}>
            <span>LNG-Process</span>
            <span className="font-mono text-xs font-bold text-slate-900">
              {counts.totalFleet}
            </span>
          </div>
          <div className="bg-[#d4d0c8]">
            {renderNavItem(
              'LNG_PROCESS_OVERVIEW',
              'Overview',
              counts.totalFleet,
              activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW'
            )}
            {renderNavItem('ARUN_LOADING_COQ', 'PAGT (Arun)', counts.arunCount, activeKey.startsWith('ARUN'))}
            {renderNavItem(
              'SAVIOUR_VOYAGE_MONITORING',
              'Marine Transit',
              counts.sailingCount,
              activeKey.startsWith('SAVIOUR')
            )}
            {renderNavItem(
              'NIAS_TANK_OVERVIEW',
              'Nias Regas Unit',
              counts.niasTotal,
              activeKey.startsWith('NIAS') &&
                activeKey !== 'LNG_PROCESS_OVERVIEW' &&
                activeKey !== 'NIAS_TERMINAL_OVERVIEW'
            )}
            {renderNavItem('MAINTENANCE_MRO_HUB', 'Maintenance & Depot')}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. EQUIPMENT & ASSET                                                      */}
        {/* ========================================================================= */}
        <div>
          {/* 3D Classic Raised Bevel Header */}
          <div className={SECTION_HEADER_BEVEL}>
            <span>Equipment &amp; Asset</span>
          </div>
          <div className="bg-[#d4d0c8]">
            {renderNavItem('EQUIPMENT_ASSET_REGISTRY', 'All Assets Directory')}
            {renderNavItem('GLOBAL_FLEET_HUB', '120-Fleet Hub')}
            {renderNavItem('DATA_INGESTION_HUB', 'CSV Ingestion')}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAINTENANCE & WORK ORDERS                                              */}
        {/* ========================================================================= */}
        <div>
          {/* 3D Classic Raised Bevel Header */}
          <div className={SECTION_HEADER_BEVEL}>
            <span>Maintenance &amp; Work Orders</span>
          </div>
          <div className="bg-[#d4d0c8]">
            {renderNavItem(
              'WORK_ORDER_DIRECTORY',
              'Work Orders',
              undefined,
              activeKey === 'WORK_ORDER_DIRECTORY' || activeKey === 'WORK_ORDER_MAINTENANCE'
            )}
            {renderNavItem('PM_SCHEDULES', 'Preventive Maintenance')}
            {renderNavItem('MAINTENANCE_MRO_HUB', 'MRO Depot')}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SITE MANNING & ROSTER                                                  */}
        {/* ========================================================================= */}
        <div>
          {/* 3D Classic Raised Bevel Header */}
          <div className={SECTION_HEADER_BEVEL}>
            <span>Site Manning &amp; Roster</span>
          </div>
          <div className="bg-[#d4d0c8]">
            {renderNavItem(
              'MANPOWER_DAILY_SHIFT',
              'Overview',
              19,
              activeKey === 'MANPOWER_DAILY_SHIFT' && (activeSubTab === 'OVERVIEW' || !activeSubTab)
            )}
            {renderNavItem(
              'MANPOWER_SHIFT_ROSTER',
              'Daily Board',
              undefined,
              activeKey === 'MANPOWER_SHIFT_ROSTER' && activeSubTab === 'DAILY_SHIFT_BOARD'
            )}
            {renderNavItem(
              'MANPOWER_MONTHLY_GRID',
              'Monthly Plan',
              undefined,
              activeKey === 'MANPOWER_MONTHLY_GRID' && activeSubTab === 'MONTHLY_GRID'
            )}
            {renderNavItem(
              'MANPOWER_ROTATION_TRACKER',
              'Rotation',
              undefined,
              activeKey === 'MANPOWER_ROTATION_TRACKER' && activeSubTab === 'ROTATION_TRACKER'
            )}
            {renderNavItem(
              'MANPOWER_TRAINING_MATRIX',
              'Training Matrix',
              undefined,
              activeKey === 'MANPOWER_TRAINING_MATRIX' && activeSubTab === 'TRAINING_MATRIX'
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. SAFETY & PTW                                                           */}
        {/* ========================================================================= */}
        <div>
          {/* 3D Classic Raised Bevel Header */}
          <div className={SECTION_HEADER_BEVEL}>
            <span>Safety &amp; PTW</span>
          </div>
          <div className="bg-[#d4d0c8]">
            {renderNavItem(
              'PTW_PERMITS',
              'PTW Master Register',
              undefined,
              activeKey === 'PTW_PERMITS' || activeKey === 'MANPOWER_PTW'
            )}
            {renderNavItem('SAFETY_GAS_TESTING', 'Gas Testing Log')}
            {renderNavItem('SAFETY_ERT_READINESS', 'ERT Readiness')}
          </div>
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
