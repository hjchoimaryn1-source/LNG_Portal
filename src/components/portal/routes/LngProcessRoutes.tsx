// src/components/portal/routes/LngProcessRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import ArunTerminalView from '../../locations/ArunTerminalView';
import ArunHeelBogLossView from '../../locations/arun/ArunHeelBogLossView';
import MvSaviourView from '../../locations/MvSaviourView';
import NiasTankYardView from '../../locations/NiasTankYardView';
import NiasRegasGasProcessView from '../../locations/NiasRegasGasProcessView';
import NiasPltmgPowerView from '../../locations/NiasPltmgPowerView';
import NiasOperationalOverviewTab from '../../locations/nias/NiasOperationalOverviewTab';
import { IsoTankLogisticsPlaceholderView } from '../../../cmms-daily-ops/views/IsoTankLogisticsPlaceholderView';
import { LngEnergyOperationView } from '../../../cmms-daily-ops/views/LngEnergyOperationView';
import { ElectricalSystemView } from '../../../cmms-daily-ops/views/ElectricalSystemView';
import { PIDOverlayView } from '../../../cmms-daily-ops/pid/PIDOverlayView';
import { DailyOpsOverviewView } from '../../../cmms-daily-ops/views/DailyOpsOverviewView';
import { HmiOverviewContainer } from '../../../cmms-daily-ops/hmi-overview/HmiOverviewContainer';
import { today } from '../../../cmms-daily-ops/utils/dailyOpsDateHelpers';

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
      {(activeKey === 'NIAS_GC_GAS_QUALITY' || activeSubTab === 'NIAS_GC_GAS_QUALITY') && (
        <NiasRegasGasProcessView initialSubTab="GC_GAS_QUALITY" />
      )}
      {(activeKey === 'NIAS_GAS_METERING_LEDGER' || activeSubTab === 'NIAS_GAS_METERING_LEDGER') && (
        <NiasRegasGasProcessView initialSubTab="GAS_METERING_LEDGER" />
      )}
      {(activeKey === 'NIAS_HEAT_SETTLEMENT' || activeSubTab === 'NIAS_HEAT_SETTLEMENT') && (
        <NiasRegasGasProcessView initialSubTab="CUSTODY_HEAT_SETTLEMENT" />
      )}

      {/* PLTMG Power (flattened 2026-09-16 from "Nias Regas Unit > Regas & Power") */}
      {(activeKey === 'NIAS_PLTMG_POWER_OUTPUT' || activeSubTab === 'NIAS_PLTMG_POWER_OUTPUT') && (
        <NiasPltmgPowerView />
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
      {/* Daily Ops — Phase 12 Stage C4 (4 new LNG-Process tabs)    */}
      {/* ========================================================= */}
      {activeKey === 'DAILY_OPS_ISO_TANK_LOGISTICS' && <IsoTankLogisticsPlaceholderView />}
      {activeKey === 'DAILY_OPS_LNG_ENERGY_OPERATION' && <LngEnergyOperationView />}
      {activeKey === 'DAILY_OPS_ELECTRICAL_SYSTEM' && <ElectricalSystemView />}
      {activeKey === 'DAILY_OPS_LIVE_PID_MAP' && <PIDOverlayView />}

      {/* HMI Overview — Sub-stage C. Parallel to Live P&ID Map (raster-overlay),
          not a replacement — HJ decision 2026-09-15. */}
      {activeKey === 'DAILY_OPS_HMI_OVERVIEW' && <HmiOverviewContainer reportDate={today()} />}

      {/* Phase 12 Pre-Flight III — 승인 상태 머신 + RBAC 편입 */}
      {activeKey === 'DAILY_OPS_OVERVIEW' && <DailyOpsOverviewView />}
    </>
  );
}
