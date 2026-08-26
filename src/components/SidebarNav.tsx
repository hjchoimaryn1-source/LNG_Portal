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
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 sm:w-80 bg-slate-900 border-r border-slate-700/90 text-white font-bold flex flex-col justify-between transition-transform duration-200 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Branding Section */}
      <div className="p-4 sm:p-5 border-b border-slate-700/90 flex items-center justify-between shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/40">
            <span className="text-white font-black text-sm tracking-wider">LNG</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                Virtual Pipeline
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-[9px] font-mono text-white font-bold font-bold">
                v2.5
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white font-bold font-bold block">
              Closed-Loop & MRO Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
        {/* Fleet Ticker Summary */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-white font-bold">
            <Radio className="w-3.5 h-3.5 text-white font-bold animate-pulse" />
            <span className="font-bold">Active Fleet:</span>
          </div>
          <span className="font-black text-white font-bold">{counts.totalFleet} ISO Tanks</span>
        </div>

        {/* ========================================================= */}
        {/* 1. ARUN PAG TERMINAL */}
        {/* ========================================================= */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] uppercase tracking-wider font-black text-white font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Arun PAG Terminal
            </span>
            <span className="text-[10px] font-mono bg-blue-950 text-white font-bold border border-blue-600 px-1.5 py-0.2 rounded font-bold">
              {counts.arunCount} Tanks
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleItemClick('ARUN_LOADING_COQ')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group ${
                activeKey === 'ARUN_LOADING_COQ'
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Anchor className={`w-4 h-4 ${activeKey === 'ARUN_LOADING_COQ' ? 'text-white' : 'text-white font-bold'}`} />
                <span>Loading & COQ Workspace</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 ${activeKey === 'ARUN_LOADING_COQ' ? 'text-white' : 'text-white font-bold'}`}
              />
            </button>

            <button
              onClick={() => handleItemClick('ARUN_MASTER_HISTORY')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group ${
                activeKey === 'ARUN_MASTER_HISTORY'
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Table className={`w-4 h-4 ${activeKey === 'ARUN_MASTER_HISTORY' ? 'text-white' : 'text-white font-bold'}`} />
                <span>Master History Archive</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                activeKey === 'ARUN_MASTER_HISTORY' ? 'bg-blue-800 text-white border-blue-300' : 'bg-slate-950 text-white font-bold border-slate-700'
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
            <span className="text-[11px] uppercase tracking-wider font-black text-white font-bold flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              2. MV. Saviour Transit
            </span>
            <span className="text-[10px] font-mono bg-cyan-950 text-white font-bold border border-cyan-600 px-1.5 py-0.2 rounded font-bold">
              {counts.sailingCount} Sailing
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleItemClick('SAVIOUR_VOYAGE_MONITORING')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group ${
                activeKey === 'SAVIOUR_VOYAGE_MONITORING'
                  ? 'bg-cyan-600 text-white border border-cyan-400 shadow-sm'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ship className={`w-4 h-4 ${activeKey === 'SAVIOUR_VOYAGE_MONITORING' ? 'text-white' : 'text-white font-bold'}`} />
                <span>Voyage Monitoring</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                activeKey === 'SAVIOUR_VOYAGE_MONITORING' ? 'bg-cyan-800 text-white border-cyan-300' : 'bg-cyan-950 text-white font-bold border-cyan-700'
              }`}>
                {counts.sailingCount}
              </span>
            </button>

            <button
              onClick={() => handleItemClick('SAVIOUR_MARINE_PRESSURE')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group ${
                activeKey === 'SAVIOUR_MARINE_PRESSURE'
                  ? 'bg-cyan-600 text-white border border-cyan-400 shadow-sm'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gauge className={`w-4 h-4 ${activeKey === 'SAVIOUR_MARINE_PRESSURE' ? 'text-white' : 'text-white font-bold'}`} />
                <span>Marine Pressure Log</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 ${activeKey === 'SAVIOUR_MARINE_PRESSURE' ? 'text-white' : 'text-white font-bold'}`}
              />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. NIAS REGAS TERMINAL (Promoted Integrated Overview & 2 Domains) */}
        {/* ========================================================= */}
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between px-2 py-0.5">
            <span className="text-[11px] uppercase tracking-wider font-black text-white font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              3. Nias Regas Terminal
            </span>
            <span className="text-[10px] font-mono bg-emerald-950 text-white font-bold border border-emerald-600 px-1.5 py-0.2 rounded font-bold">
              2 Domains
            </span>
          </div>

          {/* ★ PROMOTED TERMINAL MAIN INTEGRATED OVERVIEW (PFD) ★ */}
          <button
            onClick={() => handleItemClick('NIAS_TERMINAL_OVERVIEW')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-black transition-all group ${
              activeKey === 'NIAS_TERMINAL_OVERVIEW'
                ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-md ring-1 ring-emerald-300'
                : 'text-white hover:bg-slate-800 border border-slate-700 bg-slate-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white font-bold group-hover:scale-110 transition-transform" />
              <span>🌐 Terminal Integrated Overview</span>
            </div>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              activeKey === 'NIAS_TERMINAL_OVERVIEW' ? 'bg-emerald-800 text-white border-emerald-300' : 'bg-emerald-950 text-white font-bold border-emerald-600'
            }`}>
              PFD
            </span>
          </button>

          {/* DOMAIN 1: 📦 ISO TANK MANAGEMENT */}
          <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-700">
            <div className="px-1 py-0.5 text-[10px] uppercase font-black text-white font-bold flex items-center gap-1">
              <Box className="w-3 h-3" />
              <span>Domain 1: ISO Tank Management</span>
            </div>

            {/* Sub-Tab 1: Overview & Visual Yard Map */}
            <button
              onClick={() => handleItemClick('NIAS_TANK_OVERVIEW')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_TANK_OVERVIEW' || activeKey === 'NIAS_OPERATIONS_OVERVIEW'
                  ? 'bg-blue-600 text-white border border-blue-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className={`w-3.5 h-3.5 ${activeKey === 'NIAS_TANK_OVERVIEW' || activeKey === 'NIAS_OPERATIONS_OVERVIEW' ? 'text-white' : 'text-white font-bold'}`} />
                <span>🌐 Overview & Yard Map</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white font-bold border border-slate-700">
                {counts.laydownCount + counts.regasBayCount + counts.emptyReturnCount}
              </span>
            </button>

            {/* Sub-Tab 2: Laydown 1 Condition & BOG Log */}
            <button
              onClick={() => handleItemClick('NIAS_LAYDOWN_1_2_LOG')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeKey === 'NIAS_DAILY_CONDITION_BOG' || activeKey === 'NIAS_LAYDOWN_DEPRESS'
                  ? 'bg-blue-600 text-white border border-blue-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table className={`w-3.5 h-3.5 ${activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeKey === 'NIAS_DAILY_CONDITION_BOG' || activeKey === 'NIAS_LAYDOWN_DEPRESS' ? 'text-white' : 'text-white font-bold'}`} />
                <span>📥 Laydown 1 Condition & BOG</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white font-bold border border-slate-700">
                {counts.laydownCount}
              </span>
            </button>

            {/* Sub-Tab 3: Active Bay Mounted Tanks */}
            <button
              onClick={() => handleItemClick('NIAS_ACTIVE_BAY_TANKS')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeKey === 'NIAS_BAY_MOUNTED_TANKS'
                  ? 'bg-blue-600 text-white border border-blue-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className={`w-3.5 h-3.5 ${activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeKey === 'NIAS_BAY_MOUNTED_TANKS' ? 'text-white' : 'text-white font-bold'}`} />
                <span>🏷️ Active Bay Mounted Tanks</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-bold border border-slate-700">
                {counts.regasBayCount} Mounted
              </span>
            </button>

            {/* Sub-Tab 4: Laydown 2 (Heel 4% Staging) */}
            <button
              onClick={() => handleItemClick('NIAS_LAYDOWN_3_HEEL')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeKey === 'NIAS_EMPTY_RETURN'
                  ? 'bg-purple-600 text-white border border-purple-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className={`w-3.5 h-3.5 ${activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeKey === 'NIAS_EMPTY_RETURN' ? 'text-white' : 'text-white font-bold'}`} />
                <span>🔄 Laydown 2 (Heel 4% Staging)</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white font-bold border border-slate-700">
                {counts.emptyReturnCount}
              </span>
            </button>
          </div>

          {/* DOMAIN 2: ⚡ REGAS SYSTEM & GAS-TO-POWER */}
          <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-700">
            <div className="px-1 py-0.5 text-[10px] uppercase font-black text-white font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Domain 2: Regas System & Power</span>
            </div>

            {/* Sub-Tab 1: Gas Process & State Transformation */}
            <button
              onClick={() => handleItemClick('NIAS_GAS_PROCESS_TELEMETRY')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeKey === 'NIAS_FOUR_BAY_REGAS' || activeKey === 'NIAS_ACTIVE_REGAS'
                  ? 'bg-amber-600 text-white border border-amber-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className={`w-3.5 h-3.5 ${activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeKey === 'NIAS_FOUR_BAY_REGAS' || activeKey === 'NIAS_ACTIVE_REGAS' ? 'text-white' : 'text-white font-bold'}`} />
                <span>📊 Gas Process Telemetry</span>
              </div>
              {counts.activeRunningBays > 0 ? (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/30 text-white font-bold border border-amber-500/50 animate-pulse">
                  {counts.activeRunningBays} Run
                </span>
              ) : (
                <span className="text-[9px] font-mono text-white font-bold">4 Bays</span>
              )}
            </button>

            {/* Sub-Tab 2: GC & Gas Quality Stream */}
            <button
              onClick={() => handleItemClick('NIAS_GC_GAS_QUALITY')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_GC_GAS_QUALITY'
                  ? 'bg-amber-600 text-white border border-amber-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <FlaskConical className={`w-3.5 h-3.5 ${activeKey === 'NIAS_GC_GAS_QUALITY' ? 'text-white' : 'text-white font-bold'}`} />
                <span>🔬 GC & Gas Quality Stream</span>
              </div>
              <span className="text-[9px] font-mono text-white font-bold bg-cyan-950 border border-cyan-700 px-1.5 py-0.2 rounded font-bold">
                FloBoss
              </span>
            </button>

            {/* Sub-Tab 3: PLTMG Power & Thermal Output */}
            <button
              onClick={() => handleItemClick('NIAS_PLTMG_POWER_OUTPUT')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_PLTMG_POWER_OUTPUT'
                  ? 'bg-amber-600 text-white border border-amber-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${activeKey === 'NIAS_PLTMG_POWER_OUTPUT' ? 'text-white' : 'text-white font-bold'}`} />
                <span>⚡ PLTMG Power & Output</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white font-bold border border-slate-700">
                18.5 MW
              </span>
            </button>

            {/* Sub-Tab 4: Custody Heat Settlement */}
            <button
              onClick={() => handleItemClick('NIAS_HEAT_SETTLEMENT')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-colors group ${
                activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT'
                  ? 'bg-indigo-600 text-white border border-indigo-400'
                  : 'text-white font-bold hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Scale className={`w-3.5 h-3.5 ${activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT' ? 'text-white' : 'text-white font-bold'}`} />
                <span>⚖️ Custody Heat Settlement</span>
              </div>
              {counts.disputeAlerts > 0 ? (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/30 text-white font-bold border border-red-500/50 flex items-center gap-0.5 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" /> {counts.disputeAlerts}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-white font-bold flex items-center gap-0.5 font-bold">
                  <FileCheck className="w-2.5 h-2.5" /> OK
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. EMERGENCY MAINTENANCE (MRO) HUB */}
        {/* ========================================================= */}
        <div className="space-y-1.5 pt-2 border-t border-slate-700">
          <button
            onClick={() => handleItemClick('MAINTENANCE_MRO_HUB')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-colors group ${
              activeKey === 'MAINTENANCE_MRO_HUB'
                ? 'bg-amber-600 text-white border border-amber-400 shadow-sm'
                : 'text-white font-bold hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-amber-500/20 text-white font-bold border border-amber-500/40">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white">Maintenance & MRO</span>
                <span className="text-[10px] text-white font-bold font-mono">
                  Depot Repairs & Re-cert
                </span>
              </div>
            </div>
            {counts.mroCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] font-black">
                {counts.mroCount} Units
              </span>
            ) : (
              <span className="text-[10px] text-white font-bold font-mono font-bold">Ready</span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* 5. SYSTEM DATA HUBS */}
        {/* ========================================================= */}
        <div className="space-y-1.5 pt-2 border-t border-slate-700">
          <div className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-black text-white font-bold">
            Enterprise Fleet Hubs
          </div>

          <button
            onClick={() => handleItemClick('GLOBAL_FLEET_HUB')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group ${
              activeKey === 'GLOBAL_FLEET_HUB'
                ? 'bg-blue-600 text-white border border-blue-400'
                : 'text-white font-bold hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className={`w-4 h-4 ${activeKey === 'GLOBAL_FLEET_HUB' ? 'text-white' : 'text-white font-bold'}`} />
              <span>Global 120-Fleet Tracker</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white font-bold" />
          </button>

          <button
            onClick={() => handleItemClick('DATA_INGESTION_HUB')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group ${
              activeKey === 'DATA_INGESTION_HUB'
                ? 'bg-blue-600 text-white border border-blue-400'
                : 'text-white font-bold hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className={`w-4 h-4 ${activeKey === 'DATA_INGESTION_HUB' ? 'text-white' : 'text-white font-bold'}`} />
              <span>7 CSV Data Ingestion Hub</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-950 text-white font-bold border border-slate-700 px-1.5 py-0.5 rounded font-bold">
              {counts.loadedFilesCount}/7
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-700 bg-slate-950/80 text-[10px] font-mono text-white font-bold flex items-center justify-between shrink-0">
        <span className="font-bold">Virtual Pipeline v2.5</span>
        <span className="text-white font-bold flex items-center gap-1 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          LIVE TELEMETRY
        </span>
      </div>
    </aside>
  );
}
