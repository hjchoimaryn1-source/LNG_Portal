// src/components/SidebarNav.tsx
"use client";

import React, { useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { useTheme } from '../context/ThemeContext';
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
  const { theme, isDark } = useTheme();

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
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 sm:w-80 backdrop-blur-2xl border-r flex flex-col justify-between transition-all duration-200 ${
        theme === 'PURE_WHITE'
          ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
          : theme === 'INDUSTRIAL_LIGHT'
          ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-lg'
          : 'bg-slate-950/95 border-slate-800/80 text-slate-100'
      } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Top Branding Section */}
      <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
        theme === 'PURE_WHITE' ? 'border-slate-200' : theme === 'INDUSTRIAL_LIGHT' ? 'border-slate-300' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <span className="text-white font-black text-sm tracking-wider">LNG</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`font-extrabold text-sm sm:text-base tracking-tight whitespace-nowrap ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Virtual Pipeline
              </h1>
              <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-semibold ${
                isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                v2.5
              </span>
            </div>
            <span className={`text-[10px] uppercase tracking-widest font-semibold block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Closed-Loop & MRO Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5 custom-scrollbar">
        {/* Fleet Ticker Summary */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
          theme === 'PURE_WHITE'
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : theme === 'INDUSTRIAL_LIGHT'
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Active Fleet:</span>
          </div>
          <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{counts.totalFleet} ISO Tanks</span>
        </div>

        {/* ========================================================= */}
        {/* 1. ARUN PAG TERMINAL */}
        {/* ========================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Arun PAG Terminal
            </span>
            <span className="text-[10px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800/50 px-1.5 py-0.2 rounded">
              {counts.arunCount} Tanks
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleItemClick('ARUN_LOADING_COQ')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'ARUN_LOADING_COQ'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Anchor className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Loading & COQ Workspace</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 opacity-60 transition-transform ${
                  activeKey === 'ARUN_LOADING_COQ' ? 'text-blue-400 translate-x-0.5' : ''
                }`}
              />
            </button>

            <button
              onClick={() => handleItemClick('ARUN_MASTER_HISTORY')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'ARUN_MASTER_HISTORY'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Table className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Master History Archive</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                {counts.masterHistoryCount}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MV. SAVIOUR TRANSIT */}
        {/* ========================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-cyan-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              2. MV. Saviour Transit
            </span>
            <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 px-1.5 py-0.2 rounded font-bold">
              {counts.sailingCount} Sailing
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleItemClick('SAVIOUR_VOYAGE_MONITORING')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'SAVIOUR_VOYAGE_MONITORING'
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ship className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Voyage Monitoring</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {counts.sailingCount}
              </span>
            </button>

            <button
              onClick={() => handleItemClick('SAVIOUR_MARINE_PRESSURE')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'SAVIOUR_MARINE_PRESSURE'
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gauge className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Marine Pressure Log</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 opacity-60 transition-transform ${
                  activeKey === 'SAVIOUR_MARINE_PRESSURE' ? 'text-cyan-400 translate-x-0.5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. NIAS REGAS TERMINAL (Integrated Overview & 2 Domains)  */}
        {/* ========================================================= */}
        <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              3. Nias Regas Terminal
            </span>
            <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.2 rounded font-bold">
              2 Domains
            </span>
          </div>

          {/* Promoted Terminal Main Integrated Overview & PFD */}
          <button
            onClick={() => handleItemClick('NIAS_TERMINAL_OVERVIEW')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group ${
              activeKey === 'NIAS_TERMINAL_OVERVIEW'
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/15'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-slate-800/80 bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>🌐 Terminal Integrated Overview</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              PFD
            </span>
          </button>

          {/* DOMAIN 1: 📦 ISO TANK MANAGEMENT */}
          <div className="space-y-1 bg-slate-900/30 p-1.5 rounded-xl border border-slate-800/50">
            <div className="px-2 py-0.5 text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
              <Box className="w-3 h-3" />
              <span>Domain 1: ISO Tank Management</span>
            </div>

            {/* Sub-Tab 1: Overview & Visual Yard Map */}
            <button
              onClick={() => handleItemClick('NIAS_TANK_OVERVIEW')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_TANK_OVERVIEW' || activeKey === 'NIAS_OPERATIONS_OVERVIEW'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>🌐 Overview & Visual Yard Map</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {counts.laydownCount + counts.regasBayCount + counts.emptyReturnCount}
              </span>
            </button>

            {/* Sub-Tab 2: Laydown 1 Condition & BOG Log */}
            <button
              onClick={() => handleItemClick('NIAS_LAYDOWN_1_2_LOG')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeKey === 'NIAS_DAILY_CONDITION_BOG' || activeKey === 'NIAS_LAYDOWN_DEPRESS'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>📥 Laydown 1 Condition & BOG</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {counts.laydownCount}
              </span>
            </button>

            {/* Sub-Tab 3: Active Bay Mounted Tanks */}
            <button
              onClick={() => handleItemClick('NIAS_ACTIVE_BAY_TANKS')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeKey === 'NIAS_BAY_MOUNTED_TANKS'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>🏷️ Active Bay Mounted Tanks</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {counts.regasBayCount} Mounted
              </span>
            </button>

            {/* Sub-Tab 4: Laydown 2 (Heel 4% Staging) */}
            <button
              onClick={() => handleItemClick('NIAS_LAYDOWN_3_HEEL')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeKey === 'NIAS_EMPTY_RETURN'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>🔄 Laydown 2 (Heel 4% Staging)</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {counts.emptyReturnCount}
              </span>
            </button>
          </div>

          {/* DOMAIN 2: ⚡ REGAS SYSTEM & GAS-TO-POWER */}
          <div className="space-y-1 bg-slate-900/30 p-1.5 rounded-xl border border-slate-800/50">
            <div className="px-2 py-0.5 text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Domain 2: Regas System & Power</span>
            </div>

            {/* Sub-Tab 1: Gas Process & State Transformation */}
            <button
              onClick={() => handleItemClick('NIAS_GAS_PROCESS_TELEMETRY')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeKey === 'NIAS_FOUR_BAY_REGAS' || activeKey === 'NIAS_ACTIVE_REGAS'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>📊 Gas Process & State Telemetry</span>
              </div>
              {counts.activeRunningBays > 0 ? (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                  {counts.activeRunningBays} Run
                </span>
              ) : (
                <span className="text-[9px] font-mono text-slate-500">4 Bays</span>
              )}
            </button>

            {/* Sub-Tab 2: GC & Gas Quality Stream */}
            <button
              onClick={() => handleItemClick('NIAS_GC_GAS_QUALITY')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_GC_GAS_QUALITY'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>🔬 GC & Gas Quality Stream</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                FloBoss
              </span>
            </button>

            {/* Sub-Tab 3: PLTMG Power & Thermal Output */}
            <button
              onClick={() => handleItemClick('NIAS_PLTMG_POWER_OUTPUT')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_PLTMG_POWER_OUTPUT'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>⚡ PLTMG Power & Output</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 border border-slate-800">
                18.5 MW
              </span>
            </button>

            {/* Sub-Tab 4: Custody Heat Settlement */}
            <button
              onClick={() => handleItemClick('NIAS_HEAT_SETTLEMENT')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>⚖️ Custody Heat Settlement</span>
              </div>
              {counts.disputeAlerts > 0 ? (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-0.5 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" /> {counts.disputeAlerts}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                  <FileCheck className="w-2.5 h-2.5" /> OK
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. EMERGENCY MAINTENANCE (MRO) HUB */}
        {/* ========================================================= */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => handleItemClick('MAINTENANCE_MRO_HUB')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all group ${
              activeKey === 'MAINTENANCE_MRO_HUB'
                ? 'bg-amber-600/25 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">Maintenance & MRO</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Depot Repairs & Re-cert
                </span>
              </div>
            </div>
            {counts.mroCount > 0 ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                {counts.mroCount} Faults
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">0</span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Utility: Data Ingestion Hub */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 shrink-0 bg-slate-950/60">
        <button
          onClick={() => handleItemClick('DATA_INGESTION_HUB')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeKey === 'DATA_INGESTION_HUB'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-200">Data Ingestion Hub</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {counts.loadedFilesCount}/7 CSV Schemas Loaded
              </span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        </button>

        <button
          onClick={() => handleItemClick('GLOBAL_FLEET_HUB')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold mt-2 transition-all ${
            activeKey === 'GLOBAL_FLEET_HUB'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-200">ISO Tank Fleet Hub</span>
              <span className="text-[10px] text-slate-500 font-mono">
                120 Assets
              </span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        </button>
      </div>
    </aside>
  );
}
