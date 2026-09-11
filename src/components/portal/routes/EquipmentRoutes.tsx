// src/components/portal/routes/EquipmentRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { CmmsEquipmentRegistryView } from '../../CmmsEquipmentRegistryView';
import GlobalFleetHubView from '../../GlobalFleetHubView';
import DataIngestionHub from '../../DataIngestionHub';
import { EquipmentRegistryView } from '../EquipmentRegistryView';

interface EquipmentRoutesProps {
  activeKey: SubProcessKey;
  equipmentFilter: string;
  showCmmsRegistry: boolean;
  setShowCmmsRegistry: (value: boolean) => void;
}

export default function EquipmentRoutes({
  activeKey,
  equipmentFilter,
  showCmmsRegistry,
  setShowCmmsRegistry,
}: EquipmentRoutesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* MODULE 2: EQUIPMENT & ASSET                               */}
      {/* ========================================================= */}
      {activeKey === 'EQUIPMENT_ASSET_REGISTRY' && (
        <>
          <div className="flex gap-2 px-4 pt-3 border-b border-slate-200 bg-white">
            <button
              onClick={() => setShowCmmsRegistry(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 ${!showCmmsRegistry ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              All Assets Directory
            </button>
            <button
              onClick={() => setShowCmmsRegistry(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 ${showCmmsRegistry ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              CMMS Assets (127)
            </button>
          </div>
          {showCmmsRegistry ? (
            <CmmsEquipmentRegistryView />
          ) : (
            <EquipmentRegistryView filter={equipmentFilter} />
          )}
        </>
      )}
      {activeKey === 'GLOBAL_FLEET_HUB' && (
        <GlobalFleetHubView />
      )}
      {activeKey === 'DATA_INGESTION_HUB' && (
        <DataIngestionHub />
      )}
    </>
  );
}
