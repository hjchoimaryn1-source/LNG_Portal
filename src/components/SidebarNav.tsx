// src/components/SidebarNav.tsx
"use client";

import React, { useMemo, useState } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { NodeState, SubProcessKey } from '../types/lng';
import { COMPANY_CONFIG } from '../config/siteConfig';

interface SidebarNavProps {
  activeKey: SubProcessKey;
  onSelectKey: (key: SubProcessKey) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

// Minimal 9px SCADA [+]/[-] Square Indicator (No redundant folder icons)
const TreeToggle = ({ isOpen }: { isOpen: boolean }) => (
  <span className="w-2.5 h-2.5 min-w-[10px] bg-white border border-slate-400 text-[8px] font-mono font-bold text-slate-700 flex items-center justify-center select-none mr-2 leading-none shadow-[inset_1px_1px_0px_white] shrink-0">
    {isOpen ? '-' : '+'}
  </span>
);

export default function SidebarNav({
  activeKey,
  onSelectKey,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarNavProps) {
  const { fleetTanks, activeBays, settlementRecords, ingestionStatuses } = usePortalData();

  // Collapsible tree branches with initial state:
  // Root, LNG-Process, and PAGT (Arun) Open by default; others Closed
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({
    root: true,
    lngProcess: true,
    arun: true,
    saviour: false,
    nias: false,
    domain1: false,
    domain2: false,
    equipment: false,
    workOrder: false,
    manpower: false,
  });

  const toggleNode = (node: string) => {
    setOpenNodes((prev) => ({ ...prev, [node]: !prev[node] }));
  };

  // Compute live tank distribution by node
  const counts = useMemo(() => {
    let arunCount = 0;
    let sailingCount = 0;
    let laydownCount = 0;
    let regasBayCount = 0;
    let emptyReturnCount = 0;
    let mroCount = 0;

    fleetTanks.forEach((t) => {
      if (t.isUnderMaintenance || t.node === NodeState.NODE_MAINTENANCE_MRO) mroCount++;
      else if (t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL) arunCount++;
      else if (t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT) sailingCount++;
      else if (t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD) laydownCount++;
      else if (t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY) regasBayCount++;
      else if (t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE) emptyReturnCount++;
    });

    const activeRunningBays = activeBays.filter((b) => b.status === 'RUNNING').length;
    const disputeAlerts = settlementRecords.filter((s) => s.disputeStatus === 'DISPUTE_ALERT').length;
    const loadedFilesCount = ingestionStatuses.filter((s) => s.status === 'LOADED').length;
    const masterHistoryCount = settlementRecords.filter((s) => s.deliveredMMBtu > 0).length;

    return {
      arunCount,
      sailingCount,
      laydownCount,
      regasBayCount,
      emptyReturnCount,
      mroCount,
      activeRunningBays,
      disputeAlerts,
      loadedFilesCount,
      masterHistoryCount,
      totalFleet: fleetTanks.length,
    };
  }, [fleetTanks, activeBays, settlementRecords, ingestionStatuses]);

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
      {/* 1. 상단 파란색 타이틀 바 (중앙 정렬 "NIAS - CMMS" 단일 텍스트) */}
      <div className="win-titlebar justify-center py-1">
        <span className="text-center font-bold text-white text-xs tracking-wider">
          NIAS - CMMS
        </span>
      </div>

      {/* 2. 로고 블록 (Branding Block) */}
      <div className="p-1.5 shrink-0 bg-[#d4d0c8] border-b border-[#808080]">
        <div className="flex flex-col items-center justify-center p-2 bg-white border-b-2 border-slate-300 win-panel">
          <img
            src="/images/bsg-lines-logo.png"
            alt="BSG Lines Logo"
            className="h-11 w-auto object-contain mx-auto mb-1"
          />
          <h1 className="text-[10px] font-bold text-slate-900 text-center uppercase tracking-tight leading-tight">
            {COMPANY_CONFIG.companyName}
          </h1>
        </div>
      </div>

      {/* 3. Tree-View Well (Clean Strict Hierarchical Indentation) */}
      <div className="win-well m-1.5 p-1 flex-1 overflow-y-auto font-sans text-xs">
        <div className="space-y-0.5">
          {/* Level 0: NIAS CMMS (Root) */}
          <div
            onClick={() => toggleNode('root')}
            className="w-full flex items-center justify-between px-1.5 py-0.5 font-bold text-black cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <div className="flex items-center min-w-0">
              <TreeToggle isOpen={!!openNodes.root} />
              <span className="text-[11px] font-extrabold uppercase tracking-wide">NIAS CMMS</span>
            </div>
          </div>

          {openNodes.root && (
            <div className="space-y-0.5">
              
              {/* ========================================================= */}
              {/* Level 1: LNG-Process                                      */}
              {/* ========================================================= */}
              <div>
                <div
                  onClick={() => {
                    handleItemClick('LNG_PROCESS_OVERVIEW');
                    toggleNode('lngProcess');
                  }}
                  className={`w-full flex items-center justify-between pl-4 pr-2 py-0.5 font-bold cursor-pointer transition-colors ${
                    activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW'
                      ? 'bg-[#0a2558] text-white'
                      : 'text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <TreeToggle isOpen={!!openNodes.lngProcess} />
                    <span className="text-[11px] font-bold">LNG-Process</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                      activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW'
                        ? 'text-white font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {counts.totalFleet}
                  </span>
                </div>

                {/* Level 2 & 3: Under LNG-Process */}
                {openNodes.lngProcess && (
                  <div className="space-y-0.5">
                    
                    {/* Level 2: PAGT ( Arun ) */}
                    <div>
                      <div
                        onClick={() => toggleNode('arun')}
                        className="w-full flex items-center justify-between pl-7 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <div className="flex items-center min-w-0">
                          <TreeToggle isOpen={!!openNodes.arun} />
                          <span className="text-[11px]">PAGT ( Arun )</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 ml-auto pl-2 shrink-0">
                          {counts.arunCount}
                        </span>
                      </div>

                      {/* Level 3: Under PAGT ( Arun ) */}
                      {openNodes.arun && (
                        <div className="space-y-0.5">
                          <button
                            onClick={() => handleItemClick('ARUN_LOADING_COQ')}
                            className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                              activeKey === 'ARUN_LOADING_COQ'
                                ? 'bg-[#0a2558] text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span>Loading Operations</span>
                          </button>

                          <button
                            onClick={() => handleItemClick('ARUN_HEEL_BOG_LOSS')}
                            className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                              activeKey === 'ARUN_HEEL_BOG_LOSS'
                                ? 'bg-[#0a2558] text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span>Heel &amp; BOG Loss</span>
                            <span
                              className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                activeKey === 'ARUN_HEEL_BOG_LOSS' ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              {counts.masterHistoryCount}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 2: Marine Transit */}
                    <div>
                      <div
                        onClick={() => toggleNode('saviour')}
                        className="w-full flex items-center justify-between pl-7 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <div className="flex items-center min-w-0">
                          <TreeToggle isOpen={!!openNodes.saviour} />
                          <span className="text-[11px]">Marine Transit</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 ml-auto pl-2 shrink-0">
                          {counts.sailingCount}
                        </span>
                      </div>

                      {/* Level 3: Under MV. Saviour */}
                      {openNodes.saviour && (
                        <div className="space-y-0.5">
                          <button
                            onClick={() => handleItemClick('SAVIOUR_VOYAGE_MONITORING')}
                            className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                              activeKey === 'SAVIOUR_VOYAGE_MONITORING'
                                ? 'bg-[#0a2558] text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span>Voyage Monitoring</span>
                            <span
                              className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                activeKey === 'SAVIOUR_VOYAGE_MONITORING'
                                  ? 'text-white'
                                  : 'text-slate-500'
                              }`}
                            >
                              {counts.sailingCount}
                            </span>
                          </button>

                          <button
                            onClick={() => handleItemClick('SAVIOUR_MARINE_PRESSURE')}
                            className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                              activeKey === 'SAVIOUR_MARINE_PRESSURE'
                                ? 'bg-[#0a2558] text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span>Marine Pressure Log</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 2: Nias Regas Terminal */}
                    <div>
                      <div
                        onClick={() => toggleNode('nias')}
                        className="w-full flex items-center justify-between pl-7 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <div className="flex items-center min-w-0">
                          <TreeToggle isOpen={!!openNodes.nias} />
                          <span className="text-[11px]">Nias Regas Unit</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 ml-auto pl-2 shrink-0">
                          {counts.laydownCount + counts.regasBayCount + counts.emptyReturnCount}
                        </span>
                      </div>

                      {/* Level 3 & 4: Under Nias Regas Unit */}
                      {openNodes.nias && (
                        <div className="space-y-0.5">
                          {/* Level 3: ISO Tank Management */}
                          <div>
                            <div
                              onClick={() => toggleNode('domain1')}
                              className="w-full flex items-center justify-between pl-11 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                              <div className="flex items-center min-w-0">
                                <TreeToggle isOpen={!!openNodes.domain1} />
                                <span className="text-[10px] font-bold text-blue-950">
                                  ISO Tank Management
                                </span>
                              </div>
                            </div>

                            {/* Level 4: Under ISO Tank Management */}
                            {openNodes.domain1 && (
                              <div className="space-y-0.5">
                                <button
                                  onClick={() => handleItemClick('NIAS_TANK_OVERVIEW')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_TANK_OVERVIEW'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>Overview & Yard Map</span>
                                  <span
                                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                      activeKey === 'NIAS_TANK_OVERVIEW'
                                        ? 'text-white'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {counts.laydownCount +
                                      counts.regasBayCount +
                                      counts.emptyReturnCount}
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleItemClick('NIAS_LAYDOWN_1_2_LOG')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_LAYDOWN_1_2_LOG'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>Laydown 1 Log & BOG</span>
                                  <span
                                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                      activeKey === 'NIAS_LAYDOWN_1_2_LOG'
                                        ? 'text-white'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {counts.laydownCount}
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleItemClick('NIAS_ACTIVE_BAY_TANKS')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_ACTIVE_BAY_TANKS'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>Active Bay Tanks</span>
                                  <span
                                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                      activeKey === 'NIAS_ACTIVE_BAY_TANKS'
                                        ? 'text-white'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {counts.regasBayCount}
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleItemClick('NIAS_LAYDOWN_3_HEEL')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_LAYDOWN_3_HEEL'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>Laydown 2 (Heel ~1.0 m³)</span>
                                  <span
                                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                      activeKey === 'NIAS_LAYDOWN_3_HEEL'
                                        ? 'text-white'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {counts.emptyReturnCount}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Level 3: Regas System & Power */}
                          <div>
                            <div
                              onClick={() => toggleNode('domain2')}
                              className="w-full flex items-center justify-between pl-11 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                              <div className="flex items-center min-w-0">
                                <TreeToggle isOpen={!!openNodes.domain2} />
                                <span className="text-[10px] font-bold text-amber-950">
                                  Regas & Power
                                </span>
                              </div>
                            </div>

                            {/* Level 4: Under Regas System & Power */}
                            {openNodes.domain2 && (
                              <div className="space-y-0.5">
                                <button
                                  onClick={() => handleItemClick('NIAS_GAS_PROCESS_TELEMETRY')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_GAS_PROCESS_TELEMETRY'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>GAS PROCESS</span>
                                  <span
                                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                      activeKey === 'NIAS_GAS_PROCESS_TELEMETRY'
                                        ? 'text-white'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {counts.activeRunningBays} Run
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleItemClick('NIAS_GC_GAS_QUALITY')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_GC_GAS_QUALITY'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>GAS METERING - LOG</span>
                                </button>

                                <button
                                  onClick={() => handleItemClick('NIAS_GAS_METERING_LEDGER')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_GAS_METERING_LEDGER'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>GAS METERING (LEDGER)</span>
                                </button>

                                <button
                                  onClick={() => handleItemClick('NIAS_PLTMG_POWER_OUTPUT')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_PLTMG_POWER_OUTPUT'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>PLTMG Power</span>
                                  <span
                                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                      activeKey === 'NIAS_PLTMG_POWER_OUTPUT'
                                        ? 'text-white'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    18.5MW
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleItemClick('NIAS_HEAT_SETTLEMENT')}
                                  className={`w-full flex items-center justify-between pl-14 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                    activeKey === 'NIAS_HEAT_SETTLEMENT'
                                      ? 'bg-[#0a2558] text-white font-bold'
                                      : 'text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>Monthly Report</span>
                                  {counts.disputeAlerts > 0 ? (
                                    <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-1 py-0.2 ml-auto shrink-0 leading-tight">
                                      ! {counts.disputeAlerts}
                                    </span>
                                  ) : (
                                    <span
                                      className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                        activeKey === 'NIAS_HEAT_SETTLEMENT'
                                          ? 'text-white'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      OK
                                    </span>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Level 3: Maintenance & Depot (Leaf under Nias Regas) */}
                          <div>
                            <button
                              onClick={() => handleItemClick('MAINTENANCE_MRO_HUB')}
                              className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                                activeKey === 'MAINTENANCE_MRO_HUB'
                                  ? 'bg-[#0a2558] text-white font-bold'
                                  : 'text-slate-800 hover:bg-slate-200'
                              }`}
                            >
                              <span>Maintenance & Depot</span>
                              {counts.mroCount > 0 && (
                                <span
                                  className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                                    activeKey === 'MAINTENANCE_MRO_HUB' ? 'text-white' : 'text-amber-700'
                                  }`}
                                >
                                  {counts.mroCount}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* Level 1: Equipment & Asset Registry                       */}
              {/* ========================================================= */}
              <div>
                <div
                  onClick={() => toggleNode('equipment')}
                  className="w-full flex items-center justify-between pl-4 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center min-w-0">
                    <TreeToggle isOpen={!!openNodes.equipment} />
                    <span className="text-[11px]">Equipment & Asset Registry</span>
                  </div>
                </div>

                {/* Level 2: Under Equipment & Asset Registry */}
                {openNodes.equipment && (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => handleItemClick('EQUIPMENT_ASSET_REGISTRY')}
                      className={`w-full flex items-center justify-between pl-7 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                        activeKey === 'EQUIPMENT_ASSET_REGISTRY'
                          ? 'bg-[#0a2558] text-white font-bold'
                          : 'text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <span>All Assets Directory</span>
                    </button>

                    <button
                      onClick={() => handleItemClick('GLOBAL_FLEET_HUB')}
                      className={`w-full flex items-center justify-between pl-7 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                        activeKey === 'GLOBAL_FLEET_HUB'
                          ? 'bg-[#0a2558] text-white font-bold'
                          : 'text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <span>120-Fleet Hub</span>
                      <span
                        className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                          activeKey === 'GLOBAL_FLEET_HUB' ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {counts.totalFleet}
                      </span>
                    </button>

                    <button
                      onClick={() => handleItemClick('DATA_INGESTION_HUB')}
                      className={`w-full flex items-center justify-between pl-7 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                        activeKey === 'DATA_INGESTION_HUB'
                          ? 'bg-[#0a2558] text-white font-bold'
                          : 'text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <span>CSV Ingestion</span>
                      <span
                        className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                          activeKey === 'DATA_INGESTION_HUB' ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {counts.loadedFilesCount}/7
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* Level 1: Work Order & Maintenance                         */}
              {/* ========================================================= */}
              <div>
                <div
                  onClick={() => toggleNode('workOrder')}
                  className="w-full flex items-center justify-between pl-4 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center min-w-0">
                    <TreeToggle isOpen={!!openNodes.workOrder} />
                    <span className="text-[11px]">Work Order & Maintenance</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 ml-auto pl-2 shrink-0">
                    PMS
                  </span>
                </div>

                {/* Level 2 & 3: Under Work Order & Maintenance */}
                {openNodes.workOrder && (
                  <div className="space-y-0.5">
                    
                    {/* Level 2: Manpower & Shift Roster */}
                    <div>
                      <div
                        onClick={() => toggleNode('manpower')}
                        className="w-full flex items-center justify-between pl-7 pr-2 py-0.5 font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <div className="flex items-center min-w-0">
                          <TreeToggle isOpen={!!openNodes.manpower} />
                          <span className="text-[10px] font-bold text-blue-950">
                            Manpower & Shift Roster
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 ml-auto pl-2 shrink-0">
                          3:1
                        </span>
                      </div>

                      {/* Level 3: Under Manpower & Shift Roster */}
                      {openNodes.manpower && (
                        <div className="space-y-0.5">
                          <button
                            onClick={() => handleItemClick('MANPOWER_DAILY_SHIFT')}
                            className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                              activeKey === 'MANPOWER_DAILY_SHIFT'
                                ? 'bg-[#0a2558] text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span>Daily Shift Board (Alpha/Bravo/Charlie)</span>
                          </button>

                          <button
                            onClick={() => handleItemClick('MANPOWER_ROTATION_TRACKER')}
                            className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                              activeKey === 'MANPOWER_ROTATION_TRACKER'
                                ? 'bg-[#0a2558] text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span>3:1 Rotation Cycle Tracker</span>
                          </button>

                          <button
                            onClick={() => handleItemClick('MANPOWER_MONTHLY_GRID')}
                            className={`w-full flex items-center justify-between pl-11 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                              activeKey === 'MANPOWER_MONTHLY_GRID' ||
                              activeKey === 'MANPOWER_SHIFT_ROSTER'
                                ? 'bg-[#0a2558] text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span>Monthly Roster Grid (August 2026 ~)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 2: Work Order Directory (Leaf) */}
                    <button
                      onClick={() => handleItemClick('WORK_ORDER_DIRECTORY')}
                      className={`w-full flex items-center justify-between pl-7 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                        activeKey === 'WORK_ORDER_DIRECTORY' ||
                        activeKey === 'WORK_ORDER_MAINTENANCE'
                          ? 'bg-[#0a2558] text-white font-bold'
                          : 'text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <span>Work Order Directory</span>
                      <span
                        className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                          activeKey === 'WORK_ORDER_DIRECTORY' ||
                          activeKey === 'WORK_ORDER_MAINTENANCE'
                            ? 'text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        4 Active
                      </span>
                    </button>

                    {/* Level 2: PM Schedules (Leaf) */}
                    <button
                      onClick={() => handleItemClick('PM_SCHEDULES')}
                      className={`w-full flex items-center justify-between pl-7 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                        activeKey === 'PM_SCHEDULES'
                          ? 'bg-[#0a2558] text-white font-bold'
                          : 'text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <span>PM Schedules</span>
                      <span
                        className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                          activeKey === 'PM_SCHEDULES' ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        PMS
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* Level 1: Calibration & Compliance (Leaf under Root)       */}
              {/* ========================================================= */}
              <div>
                <button
                  onClick={() => handleItemClick('CALIBRATION_COMPLIANCE')}
                  className={`w-full flex items-center justify-between pl-4 pr-2 py-0.5 text-[11px] text-left transition-colors ${
                    activeKey === 'CALIBRATION_COMPLIANCE'
                      ? 'bg-[#0a2558] text-white font-bold'
                      : 'text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-bold">Calibration & Compliance</span>
                  <span
                    className={`text-[11px] font-mono ml-auto pl-2 shrink-0 ${
                      activeKey === 'CALIBRATION_COMPLIANCE' ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    CERT
                  </span>
                </button>
              </div>

            </div>
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
