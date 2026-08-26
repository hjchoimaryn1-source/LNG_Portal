// src/components/LNGPortalApp.tsx
"use client";

import React, { useState } from 'react';
import { PortalDataProvider, usePortalData } from '../context/PortalDataContext';
import { ThemeProvider, useTheme, AppTheme } from '../context/ThemeContext';
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
  Sun,
  CloudSun,
  Moon,
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
  const { theme, setTheme } = useTheme();
  const [activeKey, setActiveKey] = useState<SubProcessKey>('NIAS_TERMINAL_OVERVIEW');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const { fleetTanks, activeBays, settlementRecords, isLoading } = usePortalData();

  const activeBaysCount = activeBays.filter((b) => b.status === 'RUNNING').length;
  const disputeCount = settlementRecords.filter((s) => s.disputeStatus === 'DISPUTE_ALERT').length;
  const mroCount = fleetTanks.filter((t) => t.isUnderMaintenance || t.node === 'NODE_MAINTENANCE_MRO').length;
  const currentNav = SUBPROCESS_TITLES[activeKey] || SUBPROCESS_TITLES.NIAS_OPERATIONS_OVERVIEW;

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 flex transition-colors duration-200 ${
      theme === 'PURE_WHITE'
        ? 'bg-white text-slate-900'
        : theme === 'INDUSTRIAL_LIGHT'
        ? 'bg-slate-100 text-slate-800'
        : 'bg-slate-950 text-slate-200'
    }`}>
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
        <header className={`sticky top-0 z-20 backdrop-blur-xl border-b shadow-sm transition-colors duration-200 ${
          theme === 'PURE_WHITE'
            ? 'bg-white/95 border-slate-200 shadow-slate-100'
            : theme === 'INDUSTRIAL_LIGHT'
            ? 'bg-slate-50/95 border-slate-300 shadow-slate-200/50'
            : 'bg-slate-950/85 border-slate-800/80 shadow-md'
        }`}>
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

            {/* Right: Live Telemetry Tickers & 3-Way Theme Switcher */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* 3-Way Theme Switcher */}
              <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold gap-1 ${
                theme === 'PURE_WHITE'
                  ? 'bg-slate-100 border-slate-200 text-slate-800'
                  : theme === 'INDUSTRIAL_LIGHT'
                  ? 'bg-slate-200/80 border-slate-300 text-slate-700'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setTheme('PURE_WHITE')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    theme === 'PURE_WHITE'
                      ? 'bg-white text-slate-900 font-bold shadow-sm ring-1 ring-slate-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Theme A: Pure White (High Contrast Daylight)"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Pure White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('INDUSTRIAL_LIGHT')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    theme === 'INDUSTRIAL_LIGHT'
                      ? 'bg-white text-indigo-900 font-bold shadow-sm ring-1 ring-slate-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Theme B: Industrial Light Slate (Soft Industrial Eye-Care)"
                >
                  <CloudSun className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">Industrial Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('CYBER_DARK')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    theme === 'CYBER_DARK'
                      ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm ring-1 ring-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Theme C: Cyber Dark (Night / Control Room)"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Cyber Dark</span>
                </button>
              </div>

              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                theme === 'PURE_WHITE'
                  ? 'bg-slate-50 border-slate-200'
                  : theme === 'INDUSTRIAL_LIGHT'
                  ? 'bg-white border-slate-300'
                  : 'bg-slate-900/70 border-slate-800'
              }`}>
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className={theme === 'CYBER_DARK' ? 'text-slate-400' : 'text-slate-600'}>Total Fleet:</span>
                <span className={`font-mono font-bold ${theme === 'CYBER_DARK' ? 'text-blue-400' : 'text-blue-700'}`}>
                  {fleetTanks.length} Tanks
                </span>
              </div>

              {mroCount > 0 && (
                <button
                  onClick={() => setActiveKey('MAINTENANCE_MRO_HUB')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{mroCount} in MRO</span>
                </button>
              )}

              {activeBaysCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 font-bold text-xs">
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>{activeBaysCount} Regas Active</span>
                </div>
              )}

              {disputeCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-600 text-xs font-semibold">
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
    <ThemeProvider>
      <PortalDataProvider>
        <LNGPortalInner />
      </PortalDataProvider>
    </ThemeProvider>
  );
}
