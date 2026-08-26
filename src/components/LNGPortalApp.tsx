// src/components/LNGPortalApp.tsx
"use client";

import React, { useState } from 'react';
import { PortalDataProvider, usePortalData } from '../context/PortalDataContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SubProcessKey } from '../types/lng';
import SidebarNav from './SidebarNav';
import ArunTerminalView from './locations/ArunTerminalView';
import MvSaviourView from './locations/MvSaviourView';
import NiasTerminalView from './locations/NiasTerminalView';
import NiasOperationalOverviewTab from './locations/nias/NiasOperationalOverviewTab';
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
  string,
  { location: string; process: string; icon: React.ReactNode; color: string }
> = {
  // Nias Regas Terminal - Promoted Integrated Overview (Default)
  NIAS_TERMINAL_OVERVIEW: {
    location: 'Nias Regas Terminal',
    process: '🌐 Terminal Integrated Overview & PFD',
    icon: <Activity className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  'terminal-overview': {
    location: 'Nias Regas Terminal',
    process: '🌐 Terminal Integrated Overview & PFD',
    icon: <Activity className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  ARUN_LOADING_COQ: {
    location: 'Arun PAG Terminal',
    process: 'Loading & COQ Workspace',
    icon: <Building2 className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  ARUN_MASTER_HISTORY: {
    location: 'Arun PAG Terminal',
    process: 'Master History Archive',
    icon: <Building2 className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  SAVIOUR_VOYAGE_MONITORING: {
    location: 'MV. Saviour Transit',
    process: 'Voyage Fleet Monitoring',
    icon: <Ship className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  SAVIOUR_MARINE_PRESSURE: {
    location: 'MV. Saviour Transit',
    process: 'Marine Pressure & BOG Log',
    icon: <Ship className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_TANK_OVERVIEW: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🌐 Overview & Yard Map',
    icon: <Building2 className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_LAYDOWN_1_2_LOG: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 📥 Laydown 1 Condition & BOG',
    icon: <MapPin className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_ACTIVE_BAY_TANKS: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🏷️ Active Bay Mounted Tanks',
    icon: <Flame className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_LAYDOWN_3_HEEL: {
    location: 'Nias Regas Terminal',
    process: 'Domain 1: 🔄 Laydown 2 (Heel 4% Staging)',
    icon: <MapPin className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_GAS_PROCESS_TELEMETRY: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: 📊 Gas Process Telemetry',
    icon: <Activity className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_GC_GAS_QUALITY: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: 🔬 GC & Gas Quality Stream',
    icon: <Activity className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_PLTMG_POWER_OUTPUT: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: ⚡ PLTMG Power & Output',
    icon: <Activity className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  NIAS_HEAT_SETTLEMENT: {
    location: 'Nias Regas Terminal',
    process: 'Domain 2: ⚖️ Custody Heat Settlement',
    icon: <Scale className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  MAINTENANCE_MRO_HUB: {
    location: 'Maintenance & Repair Depot',
    process: 'Emergency MRO & Recertification',
    icon: <Wrench className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  GLOBAL_FLEET_HUB: {
    location: 'System Hub',
    process: 'Global ISO Tank Fleet Control Center',
    icon: <Globe className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
  DATA_INGESTION_HUB: {
    location: 'System Hub',
    process: 'Automatic 7 CSV Data Ingestion Hub',
    icon: <Database className="w-4 h-4 text-white font-bold" />,
    color: 'text-white font-bold',
  },
};

function LNGPortalInner() {
  const { theme, setTheme } = useTheme();

  // Explicit Strict State Initialization to Nias Terminal Overview (NO Arun Default)
  const [activeMenu, setActiveMenu] = useState<string>('nias-terminal');
  const [activeSubTab, setActiveSubTab] = useState<string>('terminal-overview');
  const [activeKey, setActiveKey] = useState<SubProcessKey>('NIAS_TERMINAL_OVERVIEW');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const { fleetTanks, activeBays, settlementRecords, isLoading } = usePortalData();

  const activeBaysCount = activeBays.filter((b) => b.status === 'RUNNING').length;
  const disputeCount = settlementRecords.filter((s) => s.disputeStatus === 'DISPUTE_ALERT').length;
  const mroCount = fleetTanks.filter((t) => t.isUnderMaintenance || t.node === 'NODE_MAINTENANCE_MRO').length;

  const currentNav =
    SUBPROCESS_TITLES[activeKey] ||
    SUBPROCESS_TITLES[activeSubTab] ||
    SUBPROCESS_TITLES['NIAS_TERMINAL_OVERVIEW'];

  const handleSelectSubProcess = (key: SubProcessKey) => {
    setActiveKey(key);
    if (key === 'NIAS_TERMINAL_OVERVIEW') {
      setActiveMenu('nias-terminal');
      setActiveSubTab('terminal-overview');
    } else if (
      key === 'NIAS_TANK_OVERVIEW' ||
      key === 'NIAS_LAYDOWN_1_2_LOG' ||
      key === 'NIAS_ACTIVE_BAY_TANKS' ||
      key === 'NIAS_LAYDOWN_3_HEEL'
    ) {
      setActiveMenu('nias-terminal');
      setActiveSubTab(key);
    } else if (
      key === 'NIAS_GAS_PROCESS_TELEMETRY' ||
      key === 'NIAS_GC_GAS_QUALITY' ||
      key === 'NIAS_PLTMG_POWER_OUTPUT' ||
      key === 'NIAS_HEAT_SETTLEMENT'
    ) {
      setActiveMenu('nias-terminal');
      setActiveSubTab(key);
    } else if (key === 'ARUN_LOADING_COQ' || key === 'ARUN_MASTER_HISTORY') {
      setActiveMenu('arun-terminal');
      setActiveSubTab(key);
    } else if (key === 'SAVIOUR_VOYAGE_MONITORING' || key === 'SAVIOUR_MARINE_PRESSURE') {
      setActiveMenu('saviour-transit');
      setActiveSubTab(key);
    } else {
      setActiveMenu(key);
      setActiveSubTab(key);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-blue-500/30 flex transition-colors duration-200">
      {/* Left Sidebar Navigation */}
      <SidebarNav
        activeKey={activeKey}
        onSelectKey={handleSelectSubProcess}
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
                className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold hover:text-white"
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                <span className="text-white font-bold hidden sm:inline">{currentNav.location}</span>
                <span className="text-white font-bold hidden sm:inline">/</span>
                <div className="flex items-center gap-1.5 font-bold text-white font-bold">
                  {currentNav.icon}
                  <span>{currentNav.process}</span>
                </div>
              </div>
            </div>

            {/* Right: Live Telemetry Tickers & 3-Way Theme Switcher */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* 3-Way Theme Switcher */}
              <div className={`flex items-center p-1 rounded-xl border text-xs font-bold gap-1 ${
                theme === 'PURE_WHITE'
                  ? 'bg-slate-100 border-slate-200 text-white font-bold'
                  : theme === 'INDUSTRIAL_LIGHT'
                  ? 'bg-slate-200/80 border-slate-300 text-white font-bold'
                  : 'bg-slate-900/90 border-slate-800 text-white font-bold'
              }`}>
                <button
                  type="button"
                  onClick={() => setTheme('PURE_WHITE')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    theme === 'PURE_WHITE'
                      ? 'bg-white text-white font-bold font-bold shadow-sm ring-1 ring-slate-300'
                      : 'text-white font-bold hover:text-white font-bold'
                  }`}
                  title="Theme A: Pure White (High Contrast Daylight)"
                >
                  <Sun className="w-3.5 h-3.5 text-white font-bold" />
                  <span className="hidden sm:inline">Pure White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('INDUSTRIAL_LIGHT')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    theme === 'INDUSTRIAL_LIGHT'
                      ? 'bg-white text-white font-bold font-bold shadow-sm ring-1 ring-slate-300'
                      : 'text-white font-bold hover:text-white font-bold'
                  }`}
                  title="Theme B: Industrial Light Slate (Soft Industrial Eye-Care)"
                >
                  <CloudSun className="w-3.5 h-3.5 text-white font-bold" />
                  <span className="hidden sm:inline">Industrial Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('CYBER_DARK')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    theme === 'CYBER_DARK'
                      ? 'bg-slate-800 text-white font-bold font-bold shadow-sm ring-1 ring-slate-700'
                      : 'text-white font-bold hover:text-white font-bold'
                  }`}
                  title="Theme C: Cyber Dark (Night / Control Room)"
                >
                  <Moon className="w-3.5 h-3.5 text-white font-bold" />
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
                <Radio className="w-3.5 h-3.5 text-white font-bold animate-pulse" />
                <span className={theme === 'CYBER_DARK' ? 'text-white font-bold' : 'text-white font-bold'}>Total Fleet:</span>
                <span className={`font-mono font-bold ${theme === 'CYBER_DARK' ? 'text-white font-bold' : 'text-white font-bold'}`}>
                  {fleetTanks.length} Tanks
                </span>
              </div>

              {mroCount > 0 && (
                <button
                  onClick={() => handleSelectSubProcess('MAINTENANCE_MRO_HUB')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-white font-bold text-xs font-bold hover:bg-amber-500/25 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{mroCount} in MRO</span>
                </button>
              )}

              {activeBaysCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-white font-bold font-bold text-xs">
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>{activeBaysCount} Regas Active</span>
                </div>
              )}

              {disputeCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-white font-bold text-xs font-bold">
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
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-white font-bold">
              <Loader2 className="w-8 h-8 text-white font-bold animate-spin" />
              <p className="text-sm font-bold">Hydrating 7 CSV operational datasets ...</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 w-full">
              {/* ========================================================================= */}
              {/* 1. NIAS REGAS TERMINAL - DEFAULT AND TOP INTEGRATED OVERVIEW (5-NODE PFD) */}
              {/* ========================================================================= */}
              {(activeKey === 'NIAS_TERMINAL_OVERVIEW' || activeSubTab === 'terminal-overview' || (!activeKey && !activeSubTab)) && (
                <NiasTerminalView
                  initialDomain="TERMINAL_OVERVIEW"
                  initialSubTab="TERMINAL_OVERVIEW"
                  onNavigateSubTab={(targetTab, domain) => {
                    if (domain === 'ISO_TANK_MGMT') {
                      handleSelectSubProcess((targetTab as SubProcessKey) || 'NIAS_TANK_OVERVIEW');
                    } else if (domain === 'REGAS_SYSTEM') {
                      handleSelectSubProcess((targetTab as SubProcessKey) || 'NIAS_GAS_PROCESS_TELEMETRY');
                    }
                  }}
                />
              )}

              {/* 2. Nias Regas Terminal - Domain 1: ISO Tank Management */}
              {(activeKey === 'NIAS_TANK_OVERVIEW' || activeSubTab === 'NIAS_TANK_OVERVIEW') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="TANK_OVERVIEW" />
              )}
              {(activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeSubTab === 'NIAS_LAYDOWN_1_2_LOG') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="LAYDOWN_1_2_LOG" />
              )}
              {(activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeSubTab === 'NIAS_ACTIVE_BAY_TANKS') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="ACTIVE_BAY_TANKS" />
              )}
              {(activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeSubTab === 'NIAS_LAYDOWN_3_HEEL') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="LAYDOWN_3_HEEL" />
              )}

              {/* 3. Nias Regas Terminal - Domain 2: Regas System & Gas-to-Power */}
              {(activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeSubTab === 'NIAS_GAS_PROCESS_TELEMETRY') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GAS_PROCESS_TELEMETRY" />
              )}
              {(activeKey === 'NIAS_GC_GAS_QUALITY' || activeSubTab === 'NIAS_GC_GAS_QUALITY') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GC_GAS_QUALITY" />
              )}
              {(activeKey === 'NIAS_PLTMG_POWER_OUTPUT' || activeSubTab === 'NIAS_PLTMG_POWER_OUTPUT') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="PLTMG_POWER_OUTPUT" />
              )}
              {(activeKey === 'NIAS_HEAT_SETTLEMENT' || activeSubTab === 'NIAS_HEAT_SETTLEMENT') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="CUSTODY_HEAT_SETTLEMENT" />
              )}

              {/* 4. Arun PAG Terminal */}
              {activeKey === 'ARUN_LOADING_COQ' && activeSubTab !== 'terminal-overview' && (
                <ArunTerminalView initialSubTab="LOADING_COQ_ENTRY" />
              )}
              {activeKey === 'ARUN_MASTER_HISTORY' && activeSubTab !== 'terminal-overview' && (
                <ArunTerminalView initialSubTab="MASTER_HISTORY_SHEET" />
              )}

              {/* 5. MV. Saviour Transit */}
              {activeKey === 'SAVIOUR_VOYAGE_MONITORING' && activeSubTab !== 'terminal-overview' && (
                <MvSaviourView initialSubTab="VOYAGE_MONITORING" />
              )}
              {activeKey === 'SAVIOUR_MARINE_PRESSURE' && activeSubTab !== 'terminal-overview' && (
                <MvSaviourView initialSubTab="MARINE_PRESSURE" />
              )}

              {/* 6. MRO Hub */}
              {activeKey === 'MAINTENANCE_MRO_HUB' && activeSubTab !== 'terminal-overview' && (
                <MaintenanceHubView />
              )}

              {/* 7. System Ingestion & Hub */}
              {activeKey === 'GLOBAL_FLEET_HUB' && activeSubTab !== 'terminal-overview' && (
                <GlobalFleetHubView />
              )}
              {activeKey === 'DATA_INGESTION_HUB' && activeSubTab !== 'terminal-overview' && (
                <DataIngestionHub />
              )}
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
