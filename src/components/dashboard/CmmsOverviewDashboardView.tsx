// src/components/dashboard/CmmsOverviewDashboardView.tsx
//
// PURPOSE
//   Command Center Overview 대시보드 UI Layer (SectorLauncherHub Card 6).
//   hooks/useOverviewSummary.ts(State Layer)를 조회해 상단 KPI 카드 행과
//   4개 핵심 패널(Pending Approvals / Gas Safety Alert Log / WO&PTW Active
//   Lifecycle / MRO Low-Stock)을 배치한다. 계산 로직은 갖지 않는다 — 순수 배치.

'use client';

import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useOverviewSummary } from './hooks/useOverviewSummary';
import OverviewKpiCards from './OverviewKpiCards';
import PendingApprovalsPanel from './panels/PendingApprovalsPanel';
import GasSafetyAlertLogPanel from './panels/GasSafetyAlertLogPanel';
import WorkOrderPtwLifecyclePanel from './panels/WorkOrderPtwLifecyclePanel';
import MroLowStockPanel from './panels/MroLowStockPanel';
import { BEVEL_BUTTON } from '../cmms/scadaStyles';
import type { SubProcessKey } from '../../types/lng';

interface CmmsOverviewDashboardViewProps {
  onNavigate?: (key: SubProcessKey, focusId?: string) => void;
}

export default function CmmsOverviewDashboardView({ onNavigate }: CmmsOverviewDashboardViewProps) {
  const { summary, loading, error, refresh } = useOverviewSummary();

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 w-full p-2 overflow-hidden">
      <div className="win-panel px-2 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Command Center — CMMS Overview Dashboard
        </span>
        <button onClick={() => refresh()} className={`${BEVEL_BUTTON} !text-[10px] !py-0.5`}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-2 py-1 text-[11px] text-red-700 font-mono bg-red-50 border border-red-700 shrink-0">
          ⚠ {error}
        </div>
      )}

      {!summary ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-xs">
          {loading ? '로딩 중...' : '데이터 없음'}
        </div>
      ) : (
        <>
          <div className="shrink-0">
            <OverviewKpiCards summary={summary} onNavigate={onNavigate} />
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2">
            <PendingApprovalsPanel items={summary.pendingApprovals} loading={loading} onNavigate={onNavigate} />
            <GasSafetyAlertLogPanel
              alerts={summary.recentGasAlerts}
              loading={loading}
              windowHours={summary.gasTestAlerts.windowHours}
            />
            <WorkOrderPtwLifecyclePanel
              workOrders={summary.activeWorkOrders}
              permits={summary.activePermits}
              loading={loading}
              onNavigate={onNavigate}
            />
            <MroLowStockPanel parts={summary.lowStockParts} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}
