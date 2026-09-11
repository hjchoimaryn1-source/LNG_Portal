// src/components/portal/routes/LngProcessRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import ArunTerminalView from '../../locations/ArunTerminalView';
import ArunHeelBogLossView from '../../locations/arun/ArunHeelBogLossView';
import MvSaviourView from '../../locations/MvSaviourView';
import NiasTerminalView from '../../locations/NiasTerminalView';
import NiasOperationalOverviewTab from '../../locations/nias/NiasOperationalOverviewTab';
import SectorLauncherHub from '../../launcher/SectorLauncherHub';

interface LngProcessRoutesProps {
  activeKey: SubProcessKey;
  activeSubTab: string;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

export default function LngProcessRoutes({ activeKey, activeSubTab, handleSelectSubProcess }: LngProcessRoutesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* 0. SCADA SECTOR LAUNCHER HUB                              */}
      {/* ========================================================= */}
      {activeKey === 'SECTOR_LAUNCHER' && (
        <SectorLauncherHub onSelectSector={(key) => handleSelectSubProcess(key)} />
      )}

      {/* ========================================================= */}
      {/* 1. LNG-PROCESS MAIN OVERVIEW (INTEGRATED 5-NODE PFD)      */}
      {/* ========================================================= */}
      {activeKey !== 'SECTOR_LAUNCHER' && (activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW' || activeSubTab === 'LNG_PROCESS_OVERVIEW' || (!activeKey && !activeSubTab)) && (
        <NiasOperationalOverviewTab
          onNavigateSubTab={(targetTab, domain) => {
            if (targetTab.startsWith('ARUN_') || targetTab.startsWith('SAVIOUR_')) {
              handleSelectSubProcess(targetTab as SubProcessKey);
            } else if (domain === 'ISO_TANK_MGMT') {
              handleSelectSubProcess((targetTab as SubProcessKey) || 'NIAS_TANK_OVERVIEW');
            } else if (domain === 'REGAS_SYSTEM') {
              handleSelectSubProcess((targetTab as SubProcessKey) || 'NIAS_GAS_PROCESS_TELEMETRY');
            } else {
              handleSelectSubProcess((targetTab as SubProcessKey) || 'LNG_PROCESS_OVERVIEW');
            }
          }}
        />
      )}

      {/* Nias Regas Terminal - Domain 1: ISO Tank Management */}
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

      {/* Nias Regas Terminal - Domain 2: Regas System & Gas-to-Power */}
      {(activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeSubTab === 'NIAS_GAS_PROCESS_TELEMETRY') && (
        <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GAS_PROCESS_TELEMETRY" />
      )}
      {(activeKey === 'NIAS_GC_GAS_QUALITY' || activeSubTab === 'NIAS_GC_GAS_QUALITY') && (
        <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GC_GAS_QUALITY" />
      )}
      {(activeKey === 'NIAS_GAS_METERING_LEDGER' || activeSubTab === 'NIAS_GAS_METERING_LEDGER') && (
        <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GAS_METERING_LEDGER" />
      )}
      {(activeKey === 'NIAS_PLTMG_POWER_OUTPUT' || activeSubTab === 'NIAS_PLTMG_POWER_OUTPUT') && (
        <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="PLTMG_POWER_OUTPUT" />
      )}
      {(activeKey === 'NIAS_HEAT_SETTLEMENT' || activeSubTab === 'NIAS_HEAT_SETTLEMENT') && (
        <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="CUSTODY_HEAT_SETTLEMENT" />
      )}

      {/* Arun PAG Terminal */}
      {activeKey === 'ARUN_LOADING_COQ' && (
        <ArunTerminalView
          initialSubTab="OPERATIONS_YARD"
          onNavigateToSaviourModule={() => handleSelectSubProcess('SAVIOUR_VOYAGE_MONITORING')}
        />
      )}
      {activeKey === 'ARUN_MASTER_HISTORY' && (
        <ArunTerminalView
          initialSubTab="MASTER_HISTORY_SHEET"
          onNavigateToSaviourModule={() => handleSelectSubProcess('SAVIOUR_VOYAGE_MONITORING')}
        />
      )}
      {activeKey === 'ARUN_HEEL_BOG_LOSS' && (
        <ArunHeelBogLossView />
      )}

      {/* MV. Saviour Transit */}
      {activeKey === 'SAVIOUR_VOYAGE_MONITORING' && (
        <MvSaviourView initialSubTab="STOWAGE_PLAN" />
      )}
      {activeKey === 'SAVIOUR_MARINE_PRESSURE' && (
        <MvSaviourView initialSubTab="STOWAGE_PLAN" />
      )}
    </>
  );
}
