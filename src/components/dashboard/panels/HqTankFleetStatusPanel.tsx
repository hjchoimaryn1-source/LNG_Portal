// src/components/dashboard/panels/HqTankFleetStatusPanel.tsx
//
// PURPOSE
//   JakartaHQDashboard(§3.1.1)의 "120 ISO Tank Fleet Status" 섹션. 순수 표시
//   전용(뮤테이션 없음) — GlobalFleetHubView.tsx의 검색/드래그 기능은 이미
//   EQUIPMENT_ASSET_REGISTRY 쪽에 존재하므로 중복 구현하지 않고, 여기서는
//   NodeState 버킷별 대수만 요약한다.

'use client';

import React, { useMemo } from 'react';
import { Boxes } from 'lucide-react';
import { NodeState } from '../../../types/lng';
import type { FleetTankItem } from '../../../types/lng';
import { SUNKEN_PANEL, TITLE_BAR } from '../../cmms/scadaStyles';

interface HqTankFleetStatusPanelProps {
  fleetTanks: FleetTankItem[];
}

const NODE_LABELS: Record<NodeState, string> = {
  [NodeState.NODE_1_ARUN_PAG_TERMINAL]: 'Arun PAG Terminal',
  [NodeState.NODE_2_MV_SAVIOUR_TRANSIT]: 'MV. Saviour Transit',
  [NodeState.NODE_3_NIAS_LAYDOWN_YARD]: 'Nias Laydown Yard',
  [NodeState.NODE_4_REGAS_ACTIVE_BAY]: 'Nias Regas Active Bay',
  [NodeState.NODE_5_EMPTY_RETURN_CYCLE]: 'Empty Return Cycle',
  [NodeState.NODE_MAINTENANCE_MRO]: 'Maintenance / MRO',
};

export default function HqTankFleetStatusPanel({ fleetTanks }: HqTankFleetStatusPanelProps) {
  const buckets = useMemo(() => {
    const counts = new Map<NodeState, number>();
    Object.values(NodeState).forEach((node) => counts.set(node, 0));
    fleetTanks.forEach((t) => counts.set(t.node, (counts.get(t.node) ?? 0) + 1));
    return counts;
  }, [fleetTanks]);

  return (
    <div className={`${SUNKEN_PANEL} flex flex-col`}>
      <div className={`${TITLE_BAR} flex items-center justify-between`}>
        <span className="flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5" />
          120 ISO Tank Fleet Status
        </span>
        <span>Total: {fleetTanks.length}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2 font-mono text-[11px]">
        {Object.values(NodeState).map((node) => (
          <div key={node} className="bg-white border border-slate-300 p-2 text-center">
            <div className="text-lg font-bold text-slate-800">{buckets.get(node) ?? 0}</div>
            <div className="text-[10px] text-slate-500 uppercase leading-tight">{NODE_LABELS[node]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
