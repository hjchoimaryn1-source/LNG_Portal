// src/components/portal/routes/WorkOrderRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { WorkOrderSchedulerView } from '../../WorkOrderSchedulerView';
import WorkOrderListView from '../../workorder/WorkOrderListView';
import MroInventoryView from '../../inventory/MroInventoryView';
import MaintenanceHubView from '../../MaintenanceHubView';

interface WorkOrderRoutesProps {
  activeKey: SubProcessKey;
  workOrderFilter: string;
  showWoSchedulerPreview: boolean;
  setShowWoSchedulerPreview: (value: boolean) => void;
  focusRecordId?: string | null;
}

export default function WorkOrderRoutes({
  activeKey,
  workOrderFilter,
  showWoSchedulerPreview,
  setShowWoSchedulerPreview,
  focusRecordId,
}: WorkOrderRoutesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* MODULE 3: MAINTENANCE & WORK ORDERS                       */}
      {/* ========================================================= */}
      {(activeKey === 'WORK_ORDER_MAINTENANCE' || activeKey === 'PM_SCHEDULES') && (
        <WorkOrderListView
          filter={activeKey === 'PM_SCHEDULES' ? 'PMS' : workOrderFilter}
          focusId={focusRecordId ?? undefined}
        />
      )}
      {activeKey === 'WORK_ORDER_DIRECTORY' && (
        <>
          <div className="flex gap-2 px-4 pt-3 border-b border-slate-200 bg-white">
            <button
              onClick={() => setShowWoSchedulerPreview(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 ${!showWoSchedulerPreview ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Work Orders (기존)
            </button>
            <button
              onClick={() => setShowWoSchedulerPreview(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 ${showWoSchedulerPreview ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              PM Scheduler [SCAFFOLD PREVIEW]
            </button>
          </div>
          {showWoSchedulerPreview ? <WorkOrderSchedulerView /> : (
            <WorkOrderListView filter={workOrderFilter} focusId={focusRecordId ?? undefined} />
          )}
        </>
      )}
      {activeKey === 'MAINTENANCE_MRO_HUB' && (
        <MaintenanceHubView />
      )}
      {activeKey === 'MRO_PARTS_INVENTORY' && (
        <MroInventoryView />
      )}
    </>
  );
}
