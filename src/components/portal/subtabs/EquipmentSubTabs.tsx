// src/components/portal/subtabs/EquipmentSubTabs.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../utils/portalTabStyles';

interface EquipmentSubTabsProps {
  activeKey: SubProcessKey;
  equipmentFilter: string;
  setEquipmentFilter: (value: string) => void;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

export default function EquipmentSubTabs({
  activeKey,
  equipmentFilter,
  setEquipmentFilter,
  handleSelectSubProcess,
}: EquipmentSubTabsProps) {
  return (
    <>
      <button
        onClick={() => {
          handleSelectSubProcess('EQUIPMENT_ASSET_REGISTRY');
          setEquipmentFilter('ALL');
        }}
        className={activeKey === 'EQUIPMENT_ASSET_REGISTRY' && equipmentFilter === 'ALL' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>All Assets Directory</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('GLOBAL_FLEET_HUB')}
        className={activeKey === 'GLOBAL_FLEET_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>120-Fleet Hub</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('DATA_INGESTION_HUB')}
        className={activeKey === 'DATA_INGESTION_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>CSV Ingestion</span>
      </button>

      <button
        onClick={() => {
          handleSelectSubProcess('EQUIPMENT_ASSET_REGISTRY');
          setEquipmentFilter('PLANT');
        }}
        className={activeKey === 'EQUIPMENT_ASSET_REGISTRY' && equipmentFilter === 'PLANT' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Plant Machinery</span>
      </button>

      <button
        onClick={() => {
          handleSelectSubProcess('EQUIPMENT_ASSET_REGISTRY');
          setEquipmentFilter('INSTRUMENTS');
        }}
        className={activeKey === 'EQUIPMENT_ASSET_REGISTRY' && equipmentFilter === 'INSTRUMENTS' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Sensors & Instruments</span>
      </button>
    </>
  );
}
