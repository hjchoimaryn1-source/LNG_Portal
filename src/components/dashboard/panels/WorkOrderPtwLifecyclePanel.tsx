// src/components/dashboard/panels/WorkOrderPtwLifecyclePanel.tsx
//
// PURPOSE
//   Overview 대시보드 Panel C. work_orders(workOrderDao.ts)의 미완료 WO와
//   ptw_permits(ptwPermitDao.ts)의 ACTIVE 허가서를 한 패널에 병기해 현재
//   가동 중인 작업/허가 lifecycle을 한눈에 보여준다.

import React from 'react';
import { Activity } from 'lucide-react';
import type { WorkOrderRecord } from '../../../adapters/db/workOrderDao';
import type { PTWPermitLifecycleDraft } from '../../../adapters/db/ptwPermitDao';

interface WorkOrderPtwLifecyclePanelProps {
  workOrders: WorkOrderRecord[];
  permits: PTWPermitLifecycleDraft[];
  loading: boolean;
}

export default function WorkOrderPtwLifecyclePanel({ workOrders, permits, loading }: WorkOrderPtwLifecyclePanelProps) {
  return (
    <div className="win-panel flex flex-col min-h-0 h-full">
      <div className="win-titlebar px-2 py-1 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">Work Order & PTW Active Lifecycle</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken grid grid-rows-2">
        <table className="w-full text-left border-collapse font-mono text-[10.5px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1 border-r border-slate-300" colSpan={4}>Work Orders (미완료)</th>
            </tr>
            <tr className="bg-slate-100 border-b border-slate-400">
              <th className="p-1 border-r border-slate-300">WO ID</th>
              <th className="p-1 border-r border-slate-300">Asset</th>
              <th className="p-1 border-r border-slate-300">Status</th>
              <th className="p-1">Next Due</th>
            </tr>
          </thead>
          <tbody>
            {!loading && workOrders.length === 0 && (
              <tr><td colSpan={4} className="p-2 text-center text-slate-400">미완료 WO 없음</td></tr>
            )}
            {!loading &&
              workOrders.map((wo, i) => (
                <tr key={wo.workOrderId} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="p-1 font-bold border-r border-slate-300 text-blue-950">{wo.workOrderId}</td>
                  <td className="p-1 border-r border-slate-300">{wo.assetTag}</td>
                  <td className="p-1 border-r border-slate-300">{wo.status}</td>
                  <td className="p-1 text-slate-600">{wo.nextDueDate ?? '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <table className="w-full text-left border-collapse font-mono text-[10.5px] win-grid border-t-2 border-slate-400">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1 border-r border-slate-300" colSpan={2}>PTW Permits (ACTIVE)</th>
            </tr>
            <tr className="bg-slate-100 border-b border-slate-400">
              <th className="p-1 border-r border-slate-300">Permit ID</th>
              <th className="p-1">LOTO / Fire Watch</th>
            </tr>
          </thead>
          <tbody>
            {!loading && permits.length === 0 && (
              <tr><td colSpan={2} className="p-2 text-center text-slate-400">활성 PTW 없음</td></tr>
            )}
            {!loading &&
              permits.map((permit, i) => (
                <tr key={permit.permitId} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-emerald-50'}`}>
                  <td className="p-1 font-bold border-r border-slate-300 text-blue-950">{permit.permitId}</td>
                  <td className="p-1">
                    {permit.lotoApplied ? 'LOTO ✓' : 'LOTO —'} / {permit.fireWatchAssigned ? 'FW ✓' : 'FW —'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
