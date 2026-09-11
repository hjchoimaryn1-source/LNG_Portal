// src/components/portal/PortalModuleSubTabs.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../types/lng';
import { ManpowerTabKey } from './utils/manpowerTabConstants';
import LngProcessSubTabs from './subtabs/LngProcessSubTabs';
import EquipmentSubTabs from './subtabs/EquipmentSubTabs';
import WorkOrderSubTabs from './subtabs/WorkOrderSubTabs';
import ManpowerSubTabs from './subtabs/ManpowerSubTabs';
import SafetySubTabs from './subtabs/SafetySubTabs';

interface PortalModuleSubTabsProps {
  currentModuleId: string;
  activeKey: SubProcessKey;
  activeSubTab: string;
  equipmentFilter: string;
  setEquipmentFilter: (value: string) => void;
  workOrderFilter: string;
  setWorkOrderFilter: (value: string) => void;
  handleSelectSubProcess: (key: SubProcessKey) => void;
  handleManpowerSubTab: (tab: ManpowerTabKey) => void;
}

export default function PortalModuleSubTabs({
  currentModuleId,
  activeKey,
  activeSubTab,
  equipmentFilter,
  setEquipmentFilter,
  workOrderFilter,
  setWorkOrderFilter,
  handleSelectSubProcess,
  handleManpowerSubTab,
}: PortalModuleSubTabsProps) {
  return (
    <div className="bg-[#e4e0d8] border-b-2 border-white px-2 py-1 flex items-center gap-1.5 overflow-x-auto shrink-0">
      {/* Sub-Tabs for Launcher Hub */}
      {currentModuleId === 'MOD_0_LAUNCHER' && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-700 py-0.5">
          <span className="font-bold text-slate-900">SECTOR LAUNCHER HUB</span>
          <span className="text-slate-400">|</span>
          <span>Select any of the 5 operational sectors below</span>
        </div>
      )}
      {currentModuleId === 'MOD_6_OVERVIEW' && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-700 py-0.5">
          <span className="font-bold text-slate-900">CMMS OVERVIEW DASHBOARD</span>
          <span className="text-slate-400">|</span>
          <span>Command Center KPI Summary & Live Alert Panels</span>
        </div>
      )}
      {currentModuleId === 'MOD_1_LNG_PROCESS' && (
        <LngProcessSubTabs activeKey={activeKey} handleSelectSubProcess={handleSelectSubProcess} />
      )}
      {currentModuleId === 'MOD_2_EQUIPMENT' && (
        <EquipmentSubTabs
          activeKey={activeKey}
          equipmentFilter={equipmentFilter}
          setEquipmentFilter={setEquipmentFilter}
          handleSelectSubProcess={handleSelectSubProcess}
        />
      )}
      {currentModuleId === 'MOD_3_WORK_ORDER' && (
        <WorkOrderSubTabs
          activeKey={activeKey}
          workOrderFilter={workOrderFilter}
          setWorkOrderFilter={setWorkOrderFilter}
          handleSelectSubProcess={handleSelectSubProcess}
        />
      )}
      {currentModuleId === 'MOD_4_MANPOWER' && (
        <ManpowerSubTabs activeSubTab={activeSubTab} handleManpowerSubTab={handleManpowerSubTab} />
      )}
      {currentModuleId === 'MOD_5_SAFETY_PTW' && (
        <SafetySubTabs activeKey={activeKey} handleSelectSubProcess={handleSelectSubProcess} />
      )}
    </div>
  );
}
