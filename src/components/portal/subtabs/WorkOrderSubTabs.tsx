// src/components/portal/subtabs/WorkOrderSubTabs.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../utils/portalTabStyles';

interface WorkOrderSubTabsProps {
  activeKey: SubProcessKey;
  workOrderFilter: string;
  setWorkOrderFilter: (value: string) => void;
  handleSelectSubProcess: (key: SubProcessKey) => void;
}

export default function WorkOrderSubTabs({
  activeKey,
  workOrderFilter,
  setWorkOrderFilter,
  handleSelectSubProcess,
}: WorkOrderSubTabsProps) {
  return (
    <>
      <button
        onClick={() => {
          handleSelectSubProcess('WORK_ORDER_DIRECTORY');
          setWorkOrderFilter('ALL');
        }}
        className={
          (activeKey === 'WORK_ORDER_MAINTENANCE' || activeKey === 'WORK_ORDER_DIRECTORY') && workOrderFilter === 'ALL'
            ? WIN_TAB_ACTIVE
            : WIN_TAB_INACTIVE
        }
      >
        <span>Work Orders</span>
      </button>

      <button
        onClick={() => {
          handleSelectSubProcess('PM_SCHEDULES');
          setWorkOrderFilter('PMS');
        }}
        className={
          (activeKey === 'WORK_ORDER_MAINTENANCE' || activeKey === 'PM_SCHEDULES') && workOrderFilter === 'PMS'
            ? WIN_TAB_ACTIVE
            : WIN_TAB_INACTIVE
        }
      >
        <span>Preventive Maintenance</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('MAINTENANCE_MRO_HUB')}
        className={activeKey === 'MAINTENANCE_MRO_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>MRO Depot</span>
      </button>

      <button
        onClick={() => handleSelectSubProcess('MRO_PARTS_INVENTORY')}
        className={activeKey === 'MRO_PARTS_INVENTORY' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
      >
        <span>Parts Inventory</span>
      </button>
    </>
  );
}
