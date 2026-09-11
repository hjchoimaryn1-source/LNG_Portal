// src/components/portal/routes/PortalRouteView.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { ManpowerTabKey } from '../utils/manpowerTabConstants';
import LngProcessRoutes from './LngProcessRoutes';
import EquipmentRoutes from './EquipmentRoutes';
import WorkOrderRoutes from './WorkOrderRoutes';
import ManpowerSafetyRoutes from './ManpowerSafetyRoutes';
import OverviewCalibrationRoutes from './OverviewCalibrationRoutes';

interface PortalRouteViewProps {
  activeKey: SubProcessKey;
  activeSubTab: string;
  handleSelectSubProcess: (key: SubProcessKey) => void;
  handleManpowerSubTab: (tab: ManpowerTabKey) => void;
  equipmentFilter: string;
  showCmmsRegistry: boolean;
  setShowCmmsRegistry: (value: boolean) => void;
  workOrderFilter: string;
  showWoSchedulerPreview: boolean;
  setShowWoSchedulerPreview: (value: boolean) => void;
  calibrationFilter: string;
}

export default function PortalRouteView({
  activeKey,
  activeSubTab,
  handleSelectSubProcess,
  handleManpowerSubTab,
  equipmentFilter,
  showCmmsRegistry,
  setShowCmmsRegistry,
  workOrderFilter,
  showWoSchedulerPreview,
  setShowWoSchedulerPreview,
  calibrationFilter,
}: PortalRouteViewProps) {
  return (
    <div className="flex-1 h-full flex flex-col min-h-0 w-full overflow-hidden">
      <LngProcessRoutes
        activeKey={activeKey}
        activeSubTab={activeSubTab}
        handleSelectSubProcess={handleSelectSubProcess}
      />
      <EquipmentRoutes
        activeKey={activeKey}
        equipmentFilter={equipmentFilter}
        showCmmsRegistry={showCmmsRegistry}
        setShowCmmsRegistry={setShowCmmsRegistry}
      />
      <WorkOrderRoutes
        activeKey={activeKey}
        workOrderFilter={workOrderFilter}
        showWoSchedulerPreview={showWoSchedulerPreview}
        setShowWoSchedulerPreview={setShowWoSchedulerPreview}
      />
      <ManpowerSafetyRoutes
        activeKey={activeKey}
        activeSubTab={activeSubTab}
        handleSelectSubProcess={handleSelectSubProcess}
        handleManpowerSubTab={handleManpowerSubTab}
      />
      <OverviewCalibrationRoutes
        activeKey={activeKey}
        calibrationFilter={calibrationFilter}
        handleSelectSubProcess={handleSelectSubProcess}
      />
    </div>
  );
}
