// src/components/SidebarNav.tsx
"use client";

import React, { useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { NodeState, SubProcessKey } from '../types/lng';
import {
  Anchor,
  Ship,
  Flame,
  FileCheck,
  MapPin,
  RotateCcw,
  Gauge,
  Scale,
  Database,
  Layers,
  ChevronRight,
  Radio,
  AlertTriangle,
  Building2,
  Navigation,
  Wrench,
  Table,
  Box,
  Zap,
  FlaskConical,
  Tag,
  Activity,
  Globe,
} from 'lucide-react';

interface SidebarNavProps {
  activeKey: SubProcessKey;
  onSelectKey: (key: SubProcessKey) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function SidebarNav({
  activeKey,
  onSelectKey,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarNavProps) {
  const { fleetTanks, activeBays, settlementRecords, ingestionStatuses } = usePortalData();

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
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 sm:w-80 bg-slate-50 border-r border-slate-300 flex flex-col justify-between transition-transform duration-200 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Branding Section */}
      <div className="p-4 sm:p-5 border-b border-slate-300 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/40">
            <span className="text-white font-black text-sm tracking-wider">LNG</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm sm:text-base tracking-tight text-slate-900 whitespace-nowrap">
                Virtual Pipeline
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 border border-blue-200 text-[9px] font-mono text-blue-800 font-bold">
                v2.5
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold block mt-0.5">
              Closed-Loop & MRO Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar bg-slate-50">
        {/* Fleet Ticker Summary */}
        <div className="p-2.5 rounded-lg bg-white border border-slate-300 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Active Fleet:</span>
          </div>
          <span className="font-black text-slate-800">{counts.totalFleet} ISO Tanks</span>
        </div>

        {/* ========================================================= */}
        {/* 1. ARUN PAG TERMINAL */}
        {/* ========================================================= */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Arun PAG Terminal
            </span>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-800 font-bold border border-slate-300 px-1.5 py-0.2 rounded">
              {counts.arunCount} Tanks
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleItemClick('ARUN_LOADING_COQ')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group ${
                activeKey === 'ARUN_LOADING_COQ'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-800 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Anchor className={`w-4 h-4 ${activeKey === 'ARUN_LOADING_COQ' ? 'text-white' : 'text-slate-600'}`} />
                <span>Loading & COQ Workspace</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 ${activeKey === 'ARUN_LOADING_COQ' ? 'text-white' : 'text-slate-400'}`}
              />
            </button>

            <button
              onClick={() => handleItemClick('ARUN_MASTER_HISTORY')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group ${
                activeKey === 'ARUN_MASTER_HISTORY'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-800 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Table className={`w-4 h-4 ${activeKey === 'ARUN_MASTER_HISTORY' ? 'text-white' : 'text-slate-600'}`} />
                <span>Master History Archive</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                activeKey === 'ARUN_MASTER_HISTORY' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {counts.masterHistoryCount}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MV. SAVIOUR TRANSIT */}
        {/* ========================================================= */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-900 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              2. MV. Saviour Transit
            </span>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-800 font-bold border border-slate-300 px-1.5 py-0.2 rounded">
              {counts.sailingCount} Sailing
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleItemClick('SAVIOUR_VOYAGE_MONITORING')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group ${
                activeKey === 'SAVIOUR_VOYAGE_MONITORING'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-800 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ship className={`w-4 h-4 ${activeKey === 'SAVIOUR_VOYAGE_MONITORING' ? 'text-white' : 'text-slate-600'}`} />
                <span>Voyage Monitoring</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                activeKey === 'SAVIOUR_VOYAGE_MONITORING' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {counts.sailingCount}
              </span>
            </button>

            <button
              onClick={() => handleItemClick('SAVIOUR_MARINE_PRESSURE')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group ${
                activeKey === 'SAVIOUR_MARINE_PRESSURE'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-800 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gauge className={`w-4 h-4 ${activeKey === 'SAVIOUR_MARINE_PRESSURE' ? 'text-white' : 'text-slate-600'}`} />
                <span>Marine Pressure Log</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 ${activeKey === 'SAVIOUR_MARINE_PRESSURE' ? 'text-white' : 'text-slate-400'}`}
              />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. NIAS REGAS TERMINAL (Promoted Integrated Overview & 2 Domains) */}
        {/* ========================================================= */}
        <div className="space-y-2 pt-2 border-t border-slate-300">
          <div className="flex items-center justify-between px-2 py-0.5">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              3. Nias Regas Terminal
            </span>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-800 font-bold border border-slate-300 px-1.5 py-0.2 rounded">
              2 Domains
            </span>
          </div>

          {/* ★ PROMOTED TERMINAL MAIN INTEGRATED OVERVIEW (PFD) ★ */}
          <button
            onClick={() => handleItemClick('NIAS_TERMINAL_OVERVIEW')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-black transition-all group ${
              activeKey === 'NIAS_TERMINAL_OVERVIEW'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-800 hover:bg-slate-200 border border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 group-hover:scale-110 transition-transform ${activeKey === 'NIAS_TERMINAL_OVERVIEW' ? 'text-white' : 'text-slate-700'}`} />
              <span>🌐 Terminal Integrated Overview</span>
            </div>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              activeKey === 'NIAS_TERMINAL_OVERVIEW' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
            }`}>
              PFD
            </span>
          </button>

          {/* DOMAIN 1: 📦 ISO TANK MANAGEMENT */}
          <div className="space-y-1 bg-white p-2 rounded-none border border-slate-300">
            <div className="px-2 py-1 mb-1 text-xs font-bold text-slate-900 bg-slate-100 border-b border-slate-300 flex items-center gap-1 -mx-2 -mt-2">
              <Box className="w-3 h-3 text-slate-700" />
              <span>Domain 1: ISO Tank Management</span>
            </div>

            {/* Sub-Tab 1: Overview & Visual Yard Map */}
            <button
              onClick={() => handleItemClick('NIAS_TANK_OVERVIEW')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_TANK_OVERVIEW' || activeKey === 'NIAS_OPERATIONS_OVERVIEW'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className={`w-3.5 h-3.5 ${activeKey === 'NIAS_TANK_OVERVIEW' || activeKey === 'NIAS_OPERATIONS_OVERVIEW' ? 'text-white' : 'text-slate-600'}`} />
                <span>🌐 Overview & Yard Map</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                activeKey === 'NIAS_TANK_OVERVIEW' || activeKey === 'NIAS_OPERATIONS_OVERVIEW' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {counts.laydownCount + counts.regasBayCount + counts.emptyReturnCount}
              </span>
            </button>

            {/* Sub-Tab 2: Laydown 1 Condition & BOG Log */}
            <button
              onClick={() => handleItemClick('NIAS_LAYDOWN_1_2_LOG')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeKey === 'NIAS_DAILY_CONDITION_BOG' || activeKey === 'NIAS_LAYDOWN_DEPRESS'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table className={`w-3.5 h-3.5 ${activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeKey === 'NIAS_DAILY_CONDITION_BOG' || activeKey === 'NIAS_LAYDOWN_DEPRESS' ? 'text-white' : 'text-slate-600'}`} />
                <span>📥 Laydown 1 Condition & BOG</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeKey === 'NIAS_DAILY_CONDITION_BOG' || activeKey === 'NIAS_LAYDOWN_DEPRESS' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {counts.laydownCount}
              </span>
            </button>

            {/* Sub-Tab 3: Active Bay Mounted Tanks */}
            <button
              onClick={() => handleItemClick('NIAS_ACTIVE_BAY_TANKS')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeKey === 'NIAS_BAY_MOUNTED_TANKS'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className={`w-3.5 h-3.5 ${activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeKey === 'NIAS_BAY_MOUNTED_TANKS' ? 'text-white' : 'text-slate-600'}`} />
                <span>🏷️ Active Bay Mounted Tanks</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeKey === 'NIAS_BAY_MOUNTED_TANKS' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {counts.regasBayCount} Mounted
              </span>
            </button>

            {/* Sub-Tab 4: Laydown 2 (Heel 4% Staging) */}
            <button
              onClick={() => handleItemClick('NIAS_LAYDOWN_3_HEEL')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeKey === 'NIAS_EMPTY_RETURN'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className={`w-3.5 h-3.5 ${activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeKey === 'NIAS_EMPTY_RETURN' ? 'text-white' : 'text-slate-600'}`} />
                <span>🔄 Laydown 2 (Heel 4% Staging)</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeKey === 'NIAS_EMPTY_RETURN' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {counts.emptyReturnCount}
              </span>
            </button>
          </div>

          {/* DOMAIN 2: ⚡ REGAS SYSTEM & GAS-TO-POWER */}
          <div className="space-y-1 bg-white p-2 rounded-none border border-slate-300 mt-2">
            <div className="px-2 py-1 mb-1 text-xs font-bold text-slate-900 bg-slate-100 border-b border-slate-300 flex items-center gap-1 -mx-2 -mt-2">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>Domain 2: Regas System & Power</span>
            </div>

            {/* Sub-Tab 1: Gas Process & State Transformation */}
            <button
              onClick={() => handleItemClick('NIAS_GAS_PROCESS_TELEMETRY')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeKey === 'NIAS_FOUR_BAY_REGAS' || activeKey === 'NIAS_ACTIVE_REGAS'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className={`w-3.5 h-3.5 ${activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeKey === 'NIAS_FOUR_BAY_REGAS' || activeKey === 'NIAS_ACTIVE_REGAS' ? 'text-white' : 'text-slate-600'}`} />
                <span>📊 Gas Process Telemetry</span>
              </div>
              {counts.activeRunningBays > 0 ? (
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border animate-pulse ${
                  activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeKey === 'NIAS_FOUR_BAY_REGAS' || activeKey === 'NIAS_ACTIVE_REGAS' ? 'bg-white text-blue-700 border-white/20' : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {counts.activeRunningBays} Run
                </span>
              ) : (
                <span className="text-[9px] font-mono text-slate-500 font-bold">4 Bays</span>
              )}
            </button>

            {/* Sub-Tab 2: GC & Gas Quality Stream */}
            <button
              onClick={() => handleItemClick('NIAS_GC_GAS_QUALITY')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_GC_GAS_QUALITY'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FlaskConical className={`w-3.5 h-3.5 ${activeKey === 'NIAS_GC_GAS_QUALITY' ? 'text-white' : 'text-slate-600'}`} />
                <span>🔬 GC & Gas Quality Stream</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                activeKey === 'NIAS_GC_GAS_QUALITY' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                FloBoss
              </span>
            </button>

            {/* Sub-Tab 3: PLTMG Power & Thermal Output */}
            <button
              onClick={() => handleItemClick('NIAS_PLTMG_POWER_OUTPUT')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_PLTMG_POWER_OUTPUT'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${activeKey === 'NIAS_PLTMG_POWER_OUTPUT' ? 'text-white' : 'text-slate-600'}`} />
                <span>⚡ PLTMG Power & Output</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                activeKey === 'NIAS_PLTMG_POWER_OUTPUT' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                18.5 MW
              </span>
            </button>

            {/* Sub-Tab 4: Custody Heat Settlement */}
            <button
              onClick={() => handleItemClick('NIAS_HEAT_SETTLEMENT')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-colors group ${
                activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Scale className={`w-3.5 h-3.5 ${activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT' ? 'text-white' : 'text-slate-600'}`} />
                <span>⚖️ Custody Heat Settlement</span>
              </div>
              {counts.disputeAlerts > 0 ? (
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 animate-pulse ${
                  activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT' ? 'bg-white text-red-600 border-white/20' : 'bg-red-100 text-red-700 border-red-300'
                }`}>
                  <AlertTriangle className="w-2.5 h-2.5" /> {counts.disputeAlerts}
                </span>
              ) : (
                <span className={`text-[9px] font-mono font-bold flex items-center gap-0.5 ${
                  activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT' ? 'text-white' : 'text-slate-500'
                }`}>
                  <FileCheck className="w-2.5 h-2.5" /> OK
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. EMERGENCY MAINTENANCE (MRO) HUB */}
        {/* ========================================================= */}
        <div className="space-y-1.5 pt-2 border-t border-slate-300 mt-2">
          <button
            onClick={() => handleItemClick('MAINTENANCE_MRO_HUB')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors group ${
              activeKey === 'MAINTENANCE_MRO_HUB'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-800 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded border ${
                activeKey === 'MAINTENANCE_MRO_HUB' ? 'bg-blue-500/20 text-white border-blue-400/40' : 'bg-amber-100 text-amber-700 border-amber-300'
              }`}>
                <Wrench className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className={`block text-xs font-black ${activeKey === 'MAINTENANCE_MRO_HUB' ? 'text-white' : 'text-slate-900'}`}>Maintenance & MRO</span>
                <span className={`text-[10px] font-bold font-mono ${activeKey === 'MAINTENANCE_MRO_HUB' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Depot Repairs & Re-cert
                </span>
              </div>
            </div>
            {counts.mroCount > 0 ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeKey === 'MAINTENANCE_MRO_HUB' ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {counts.mroCount} Units
              </span>
            ) : (
              <span className={`text-[10px] font-bold font-mono ${activeKey === 'MAINTENANCE_MRO_HUB' ? 'text-blue-100' : 'text-slate-400'}`}>Ready</span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* 5. SYSTEM DATA HUBS */}
        {/* ========================================================= */}
        <div className="space-y-1.5 pt-2 border-t border-slate-300 mt-2">
          <div className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-black text-slate-900">
            Enterprise Fleet Hubs
          </div>

          <button
            onClick={() => handleItemClick('GLOBAL_FLEET_HUB')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group ${
              activeKey === 'GLOBAL_FLEET_HUB'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-800 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className={`w-4 h-4 ${activeKey === 'GLOBAL_FLEET_HUB' ? 'text-white' : 'text-slate-600'}`} />
              <span>Global 120-Fleet Tracker</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${activeKey === 'GLOBAL_FLEET_HUB' ? 'text-white' : 'text-slate-400'}`} />
          </button>

          <button
            onClick={() => handleItemClick('DATA_INGESTION_HUB')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group ${
              activeKey === 'DATA_INGESTION_HUB'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-800 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className={`w-4 h-4 ${activeKey === 'DATA_INGESTION_HUB' ? 'text-white' : 'text-slate-600'}`} />
              <span>7 CSV Data Ingestion Hub</span>
            </div>
            <span className={`text-[10px] font-mono font-bold border px-1.5 py-0.5 rounded ${
              activeKey === 'DATA_INGESTION_HUB' ? 'bg-white text-blue-700 border-white/20' : 'bg-slate-200 text-slate-800 border-slate-300'
            }`}>
              {counts.loadedFilesCount}/7
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-300 bg-slate-100 text-[10px] font-mono text-slate-600 font-bold flex items-center justify-between shrink-0">
        <span>Virtual Pipeline v2.5</span>
        <span className="text-slate-700 flex items-center gap-1 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          LIVE TELEMETRY
        </span>
      </div>
    </aside>
  );
}
