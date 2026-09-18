// src/components/portal/routes/LngProcessRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import ArunTerminalView from '../../locations/ArunTerminalView';
import ArunHeelBogLossView from '../../locations/arun/ArunHeelBogLossView';
import MvSaviourView from '../../locations/MvSaviourView';
import NiasTankYardView from '../../locations/NiasTankYardView';
import NiasRegasGasProcessView from '../../locations/NiasRegasGasProcessView';
import NiasOperationalOverviewTab from '../../locations/nias/NiasOperationalOverviewTab';
import NiasPowerThermalTab from '../../locations/nias/NiasPowerThermalTab';
import { IsoTankLogisticsPlaceholderView } from '../../../cmms-daily-ops/views/IsoTankLogisticsPlaceholderView';

interface LngProcessRoutesProps {
  activeKey: SubProcessKey;
  activeSubTab: string;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

export default function LngProcessRoutes({ activeKey, activeSubTab, handleSelectSubProcess }: LngProcessRoutesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* 1. LNG-PROCESS MAIN OVERVIEW (INTEGRATED 5-NODE PFD)      */}
      {/* ========================================================= */}
      {(activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW' || activeSubTab === 'LNG_PROCESS_OVERVIEW' || (!activeKey && !activeSubTab)) && (
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

      {/* Nias Tank Yard (flattened 2026-09-16 from "Nias Regas Unit > ISO Tank Management") */}
      {(activeKey === 'NIAS_TANK_OVERVIEW' || activeSubTab === 'NIAS_TANK_OVERVIEW') && (
        <NiasTankYardView initialSubTab="TANK_OVERVIEW" />
      )}
      {(activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeSubTab === 'NIAS_LAYDOWN_1_2_LOG') && (
        <NiasTankYardView initialSubTab="LAYDOWN_1_2_LOG" />
      )}
      {(activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeSubTab === 'NIAS_ACTIVE_BAY_TANKS') && (
        <NiasTankYardView initialSubTab="ACTIVE_BAY_TANKS" />
      )}
      {(activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeSubTab === 'NIAS_LAYDOWN_3_HEEL') && (
        <NiasTankYardView initialSubTab="LAYDOWN_3_HEEL" />
      )}

      {/* Regas & Gas Process (flattened 2026-09-16 from "Nias Regas Unit > Regas & Power";
          MONTHLY REPORT / NIAS_HEAT_SETTLEMENT placed here per HJ decision — its content
          spans ISO tank unloading + gas custody metering + PLTMG fuel-gas acceptance). */}
      {(activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeSubTab === 'NIAS_GAS_PROCESS_TELEMETRY') && (
        <NiasRegasGasProcessView initialSubTab="GAS_PROCESS_TELEMETRY" />
      )}
      {(activeKey === 'NIAS_PATROL_LOG' || activeSubTab === 'NIAS_PATROL_LOG') && (
        <NiasRegasGasProcessView initialSubTab="PATROL_LOG" />
      )}
      {(activeKey === 'NIAS_GAS_METERING_DAILY' || activeSubTab === 'NIAS_GAS_METERING_DAILY') && (
        <NiasRegasGasProcessView initialSubTab="GAS_METERING_DAILY" />
      )}
      {(activeKey === 'NIAS_HEAT_SETTLEMENT' || activeSubTab === 'NIAS_HEAT_SETTLEMENT') && (
        <NiasRegasGasProcessView initialSubTab="CUSTODY_HEAT_SETTLEMENT" />
      )}

      {/* Electrical System / Daily Ops Overview — relocated from top-level tabs
          into Regas & Gas Process sub-tabs (2026-09-18 correction). Daily Ops
          Overview's sidebar dual-access entry is unaffected — it still resolves
          this same SubProcessKey. */}
      {(activeKey === 'DAILY_OPS_ELECTRICAL_SYSTEM' || activeSubTab === 'DAILY_OPS_ELECTRICAL_SYSTEM') && (
        <NiasRegasGasProcessView initialSubTab="ELECTRICAL_SYSTEM" />
      )}
      {(activeKey === 'DAILY_OPS_OVERVIEW' || activeSubTab === 'DAILY_OPS_OVERVIEW') && (
        <NiasRegasGasProcessView initialSubTab="DAILY_OPS_OVERVIEW" />
      )}

      {/* PLTMG Power — independent top-level tab (2026-09-18 correction). Fuel-gas
          draw/generation domain, distinct from Regas & Gas Process and Electrical
          System. NiasPowerThermalTab reused as-is (no internal changes). */}
      {(activeKey === 'NIAS_PLTMG_POWER_OUTPUT' || activeSubTab === 'NIAS_PLTMG_POWER_OUTPUT') && (
        <div className="p-4">
          <NiasPowerThermalTab />
        </div>
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

      {/* ========================================================= */}
      {/* Daily Ops — Phase 12 Stage C4 (Live P&ID Map / HMI Overview는
          HMI CONTROL MAPS 섹터로 이전 — HmiControlMapsRoutes.tsx 참고)    */}
      {/* ========================================================= */}
      {activeKey === 'DAILY_OPS_ISO_TANK_LOGISTICS' && <IsoTankLogisticsPlaceholderView />}
    </>
  );
}
