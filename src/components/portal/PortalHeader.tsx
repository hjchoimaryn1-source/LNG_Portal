// src/components/portal/PortalHeader.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../types/lng';
import PortalTitleBar from './PortalTitleBar';
import PortalModuleSubTabs from './PortalModuleSubTabs';
import { ManpowerTabKey } from './utils/manpowerTabConstants';

interface PortalHeaderProps {
  currentNav: { location: string; process: string };
  currentModuleId: string;
  activeKey: SubProcessKey;
  activeSubTab: string;
  equipmentFilter: string;
  setEquipmentFilter: (value: string) => void;
  workOrderFilter: string;
  setWorkOrderFilter: (value: string) => void;
  handleSelectSubProcess: (key: SubProcessKey) => void;
  handleManpowerSubTab: (tab: ManpowerTabKey) => void;
  handleRefreshCurrentModuleOverview: () => void;
  onReturnToLauncher?: () => void;
  onLogout?: () => void;
}

export default function PortalHeader(props: PortalHeaderProps) {
  return (
    <header className="shrink-0 z-20 bg-[#d4d0c8] border-b-2 border-[#808080] shadow-xs select-none">
      <PortalTitleBar
        currentNav={props.currentNav}
        currentModuleId={props.currentModuleId}
        onReturnToLauncher={props.onReturnToLauncher}
        handleSelectSubProcess={props.handleSelectSubProcess}
        handleRefreshCurrentModuleOverview={props.handleRefreshCurrentModuleOverview}
        onLogout={props.onLogout}
      />
      <PortalModuleSubTabs
        currentModuleId={props.currentModuleId}
        activeKey={props.activeKey}
        activeSubTab={props.activeSubTab}
        equipmentFilter={props.equipmentFilter}
        setEquipmentFilter={props.setEquipmentFilter}
        workOrderFilter={props.workOrderFilter}
        setWorkOrderFilter={props.setWorkOrderFilter}
        handleSelectSubProcess={props.handleSelectSubProcess}
        handleManpowerSubTab={props.handleManpowerSubTab}
      />
    </header>
  );
}
