// src/components/workorder/WorkOrderListView.tsx
//
// PURPOSE
//   Work Order & Maintenance 목록 (구 LNGPortalApp.tsx 인라인 WorkOrderView 추출).
//   행 클릭 시 WorkOrderDetailModal을 열어 연결된 e-PTW 승인상태 + SIMOPS
//   위험도를 표시한다. permits는 PTWPermitsProvider(전역 Context)에서 읽으므로
//   PTWMasterRegisterTab에서의 상태 변경이 여기 배지에도 그대로 반영된다.

'use client';

import React, { useEffect, useState } from 'react';
import { Sliders } from 'lucide-react';
import { WOItem } from '../../types/lng';
import { usePTWPermitsContext } from '../../context/PTWPermitsProvider';
import { useCmmsAssets } from '../../context/CmmsAwarePortalProvider';
import { useWorkOrders } from './hooks/useWorkOrders';
import { resolveLinkedPermit, WO_PERMIT_STATUS_BADGE } from '../../adapters/workOrderPtwAdapter';
import WorkOrderDetailModal from './modals/WorkOrderDetailModal';

export interface WorkOrderListViewProps {
  filter?: string;
  focusId?: string;
}

export default function WorkOrderListView({ filter = 'ALL', focusId }: WorkOrderListViewProps) {
  const { permits } = usePTWPermitsContext();
  const { cmmsAssetRows } = useCmmsAssets();
  const [selectedWo, setSelectedWo] = useState<WOItem | null>(null);

  const { workOrders: allWorkOrders, markCompleted } = useWorkOrders(cmmsAssetRows, permits);
  const workOrders = filter === 'ALL' ? allWorkOrders : allWorkOrders.filter((w) => w.cat === filter);

  // Overview 대시보드 패널(WorkOrderPtwLifecyclePanel 등)에서 focusId로 딥링크한
  // 경우, 해당 WO의 상세 모달을 자동으로 연다.
  useEffect(() => {
    if (!focusId) return;
    const match = allWorkOrders.find((w) => w.wo === focusId);
    if (match) setSelectedWo(match);
  }, [focusId, allWorkOrders]);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden">
      <div className="win-titlebar px-2 py-1">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          Work Order & Maintenance - Planned Maintenance System (PMS Ledger)
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">WO Number</th>
              <th className="p-1.5 border-r border-slate-300">Target Asset</th>
              <th className="p-1.5 border-r border-slate-300">Work Type</th>
              <th className="p-1.5 border-r border-slate-300">Task Scope</th>
              <th className="p-1.5 border-r border-slate-300">Priority</th>
              <th className="p-1.5 border-r border-slate-300">Due Date</th>
              <th className="p-1.5 border-r border-slate-300">Engineer</th>
              <th className="p-1.5 border-r border-slate-300 text-center">e-PTW</th>
              <th className="p-1.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((w, i) => {
              const link = resolveLinkedPermit(w, permits);
              return (
                <tr
                  key={w.wo}
                  onClick={() => setSelectedWo(w)}
                  className={`cursor-pointer border-b border-slate-200 ${i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}`}
                >
                  <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{w.wo}</td>
                  <td className="p-1.5 font-bold border-r border-slate-300">{w.tag}</td>
                  <td className="p-1.5 border-r border-slate-300">{w.type}</td>
                  <td className="p-1.5 border-r border-slate-300">{w.desc}</td>
                  <td className="p-1.5 border-r border-slate-300 font-bold text-slate-800">{w.priority}</td>
                  <td className="p-1.5 border-r border-slate-300">{w.due}</td>
                  <td className="p-1.5 border-r border-slate-300">{w.tech}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center">
                    {link.state === 'NO_PERMIT' && <span className="text-slate-400">—</span>}
                    {link.state === 'PERMIT_NOT_FOUND' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-800 bg-red-50 border border-red-700">
                        NOT FOUND
                      </span>
                    )}
                    {link.state === 'LINKED' && link.permit && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${WO_PERMIT_STATUS_BADGE[link.permit.status]}`}>
                        {link.permit.status}
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 text-center font-bold text-blue-900 bg-blue-50">{w.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <WorkOrderDetailModal
        wo={selectedWo}
        permits={permits}
        onClose={() => setSelectedWo(null)}
        onMarkCompleted={(wo) => markCompleted(wo.wo, new Date().toISOString())}
      />
    </div>
  );
}
