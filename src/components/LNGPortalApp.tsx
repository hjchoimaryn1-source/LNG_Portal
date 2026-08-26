// src/components/LNGPortalApp.tsx
"use client";

import React, { useState } from 'react';
import { PortalDataProvider, usePortalData } from '../context/PortalDataContext';
import { SubProcessKey } from '../types/lng';
import SidebarNav from './SidebarNav';
import ArunTerminalView from './locations/ArunTerminalView';
import MvSaviourView from './locations/MvSaviourView';
import NiasTerminalView from './locations/NiasTerminalView';
import MaintenanceHubView from './MaintenanceHubView';
import DataIngestionHub from './DataIngestionHub';
import GlobalFleetHubView from './GlobalFleetHubView';
import {
  Menu,
  X,
  Radio,
  Flame,
  Scale,
  Loader2,
  Building2,
  Ship,
  MapPin,
  Database,
  Wrench,
  Globe,
  Activity,
} from 'lucide-react';

const SUBPROCESS_TITLES: Record<
  SubProcessKey,
  { location: string; process: string; icon: React.ReactNode; color: string }
> = {
  ARUN_LOADING_COQ: {
    location: 'Arun PAG Terminal',
    process: 'Loading & COQ Workspace',
    icon: <Building2 className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  ARUN_MASTER_HISTORY: {
    location: 'Arun PAG Terminal',
    process: 'Master History Archive',
    icon: <Building2 className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  ARUN_STAGING_YARD: {
    location: 'Arun PAG Terminal',
    process: 'Operations & Staging Yard',
    icon: <Building2 className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  SAVIOUR_VOYAGE_MONITORING: {
    location: 'MV. Saviour Transit',
    process: 'Voyage Fleet Monitoring',
    icon: <Ship className="w-4 h-4 text-cyan-400" />,
    color: 'text-cyan-400',
  },
  SAVIOUR_MARINE_PRESSURE: {
    location: 'MV. Saviour Transit',
    process: 'Marine Pressure & BOG Containment Log',
    icon: <Ship className="w-4 h-4 text-cyan-400" />,
    color: 'text-cyan-400',
  },
  // Nias Regas Terminal - Promoted Integrated Overview
  NIAS_TERMINAL_OVERVIEW: {
    location: 'Nias Regas Terminal',
    process: '🌐 Terminal Integrated Overview & PFD',
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    color: 'text-emerald-400',
  },
  // Nias Regas Terminal - Domain 1: ISO Tank Management
  NIAS_TANK_OVERVIEW: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🌐 Overview & Visual Yard Map',
    icon: <Building2 className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  NIAS_LAYDOWN_1_2_LOG: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 📥 Laydown 1 Condition & BOG Log',
    icon: <MapPin className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  NIAS_ACTIVE_BAY_TANKS: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🏷️ Active Bay Mounted Tanks',
    icon: <Flame className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  NIAS_LAYDOWN_3_HEEL: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🔄 Laydown 2 (Heel 4% Staging)',
    icon: <MapPin className="w-4 h-4 text-purple-400" />,
    color: 'text-purple-400',
  },
  // Nias Regas Terminal - Domain 2: Regas System & Gas-to-Power
  NIAS_GAS_PROCESS_TELEMETRY: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: 📊 Gas Process & State Telemetry',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
  },
  NIAS_GC_GAS_QUALITY: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: 🔬 GC & Gas Quality Stream',
    icon: <Building2 className="w-4 h-4 text-cyan-400" />,
    color: 'text-cyan-400',
  },
  NIAS_PLTMG_POWER_OUTPUT: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: ⚡ PLTMG Power & Thermal Output',
    icon: <Building2 className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
  },
  NIAS_HEAT_SETTLEMENT: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: ⚖️ Custody Heat Settlement',
    icon: <Scale className="w-4 h-4 text-indigo-400" />,
    color: 'text-indigo-400',
  },
  // Legacy Aliases for Backwards Compatibility
  NIAS_OPERATIONS_OVERVIEW: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🌐 Operations Overview',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    color: 'text-emerald-400',
  },
  NIAS_DAILY_CONDITION_BOG: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 📥 Laydown 1 & 2 Condition & BOG',
    icon: <MapPin className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  NIAS_FOUR_BAY_REGAS: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: 📊 Gas Process Telemetry',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
  },
  NIAS_EMPTY_RETURN: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🔄 Laydown 3 (Heel 4% Return)',
    icon: <MapPin className="w-4 h-4 text-purple-400" />,
    color: 'text-purple-400',
  },
  NIAS_LAYDOWN_DEPRESS: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 📥 Laydown 1 & 2 Condition & BOG',
    icon: <MapPin className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  NIAS_ACTIVE_REGAS: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: 📊 Gas Process Telemetry',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
  },
  NIAS_BAY_MOUNTED_TANKS: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🏷️ Active Bay Mounted Tanks',
    icon: <Flame className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  NIAS_CUSTODY_HEAT_SETTLEMENT: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: ⚖️ Custody Heat Settlement',
    icon: <Scale className="w-4 h-4 text-indigo-400" />,
    color: 'text-indigo-400',
  },
  MAINTENANCE_MRO_HUB: {
    location: 'Maintenance & Repair Depot',
    process: 'Emergency MRO & Recertification Subsystem',
    icon: <Wrench className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
  },
  GLOBAL_FLEET_HUB: {
    location: 'System Hub',
    process: 'Global ISO Tank Fleet Control Center',
    icon: <Globe className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
  DATA_INGESTION_HUB: {
    location: 'System Hub',
    process: 'Automatic 7 CSV Data Ingestion Hub',
    icon: <Database className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
  },
};

function LNGPortalInner() {
  const [activeKey, setActiveKey] = useState<SubProcessKey>('SAVIOUR_VOYAGE_MONITORING');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const { fleetTanks, activeBays, settlementRecords, isLoading } = usePortalData();

  const activeBaysCount = activeBays.filter((b) => b.status === 'RUNNING').length;
  const disputeCount = settlementRecords.filter((s) => s.disputeStatus === 'DISPUTE_ALERT').length;
  const mroCount = fleetTanks.filter((t) => t.isUnderMaintenance || t.node === 'NODE_MAINTENANCE_MRO').length;
  const currentNav = SUBPROCESS_TITLES[activeKey] || SUBPROCESS_TITLES.NIAS_OPERATIONS_OVERVIEW;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex">
      {/* Left Sidebar Navigation */}
      <SidebarNav
        activeKey={activeKey}
        onSelectKey={(key) => setActiveKey(key)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Right Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <span className="text-slate-400 hidden sm:inline">{currentNav.location}</span>
                <span className="text-slate-600 hidden sm:inline">/</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-100">
                  {currentNav.icon}
                  <span>{currentNav.process}</span>
                </div>
              </div>
            </div>

            {/* Right: Live Telemetry Tickers */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-slate-400">Total Fleet:</span>
                <span className="font-mono font-bold text-blue-400">{fleetTanks.length} Tanks</span>
              </div>

              {mroCount > 0 && (
                <button
                  onClick={() => setActiveKey('MAINTENANCE_MRO_HUB')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{mroCount} in MRO</span>
                </button>
              )}

              {activeBaysCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>{activeBaysCount} Regas Active</span>
                </div>
              )}

              {disputeCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  <Scale className="w-3.5 h-3.5" />
                  <span>{disputeCount} Disputes</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Route View */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[2200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-semibold">Hydrating 7 CSV operational datasets ...</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 w-full">
              {/* 1. Arun PAG Terminal */}
              {activeKey === 'ARUN_LOADING_COQ' && <ArunTerminalView initialSubTab="LOADING_COQ_ENTRY" />}
              {activeKey === 'ARUN_MASTER_HISTORY' && <ArunTerminalView initialSubTab="MASTER_HISTORY_SHEET" />}
              {activeKey === 'ARUN_STAGING_YARD' && <ArunTerminalView initialSubTab="OPERATIONS_YARD" />}

              {/* 2. MV. Saviour Transit */}
              {activeKey === 'SAVIOUR_VOYAGE_MONITORING' && (
                <MvSaviourView initialSubTab="VOYAGE_MONITORING" />
              )}
              {activeKey === 'SAVIOUR_MARINE_PRESSURE' && (
                <MvSaviourView initialSubTab="MARINE_PRESSURE" />
              )}

              {/* 3. Nias Regas Terminal - Promoted Overview & 2 Domains */}
              {activeKey === 'NIAS_TERMINAL_OVERVIEW' && (
                <NiasTerminalView initialDomain="TERMINAL_OVERVIEW" initialSubTab="TERMINAL_OVERVIEW" />
              )}

              {/* 3. Nias Regas Terminal - Domain 1: ISO Tank Management */}
              {(activeKey === 'NIAS_TANK_OVERVIEW' || activeKey === 'NIAS_OPERATIONS_OVERVIEW') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="TANK_OVERVIEW" />
              )}
              {(activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeKey === 'NIAS_DAILY_CONDITION_BOG' || activeKey === 'NIAS_LAYDOWN_DEPRESS') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="LAYDOWN_1_2_LOG" />
              )}
              {(activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeKey === 'NIAS_BAY_MOUNTED_TANKS') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="ACTIVE_BAY_TANKS" />
              )}
              {(activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeKey === 'NIAS_EMPTY_RETURN') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="LAYDOWN_3_HEEL" />
              )}

              {/* 3. Nias Regas Terminal - Domain 2: Regas System & Gas-to-Power */}
              {(activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeKey === 'NIAS_FOUR_BAY_REGAS' || activeKey === 'NIAS_ACTIVE_REGAS') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GAS_PROCESS_TELEMETRY" />
              )}
              {activeKey === 'NIAS_GC_GAS_QUALITY' && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GC_GAS_QUALITY" />
              )}
              {activeKey === 'NIAS_PLTMG_POWER_OUTPUT' && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="PLTMG_POWER_OUTPUT" />
              )}
              {(activeKey === 'NIAS_HEAT_SETTLEMENT' || activeKey === 'NIAS_CUSTODY_HEAT_SETTLEMENT') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="CUSTODY_HEAT_SETTLEMENT" />
              )}

              {/* 4. MRO Hub */}
              {activeKey === 'MAINTENANCE_MRO_HUB' && <MaintenanceHubView />}

              {/* 5. System Ingestion & Hub */}
              {activeKey === 'GLOBAL_FLEET_HUB' && <GlobalFleetHubView />}
              {activeKey === 'DATA_INGESTION_HUB' && <DataIngestionHub />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function LNGPortalApp() {
  return (
    <PortalDataProvider>
      <LNGPortalInner />
    </PortalDataProvider>
  );
}
