// src/components/dashboard/CmmsOverviewDashboardView.tsx
//
// PURPOSE
//   Command Center Overview 대시보드 UI Layer (SectorLauncherHub Card 6).
//   hooks/useOverviewSummary.ts(State Layer)를 조회해 상단 KPI 카드 행과
//   4개 핵심 패널(Pending Approvals / Gas Safety Alert Log / WO&PTW Active
//   Lifecycle / MRO Low-Stock)을 배치한다. 계산 로직은 갖지 않는다 — 순수 배치.

'use client';

import React, { useRef } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useOverviewSummary } from './hooks/useOverviewSummary';
import { useApprovalHubActions } from './hooks/useApprovalHubActions';
import OverviewKpiCards from './OverviewKpiCards';
import PendingApprovalsPanel from './panels/PendingApprovalsPanel';
import GasSafetyAlertLogPanel from './panels/GasSafetyAlertLogPanel';
import WorkOrderPtwLifecyclePanel from './panels/WorkOrderPtwLifecyclePanel';
import MroLowStockPanel from './panels/MroLowStockPanel';
import ApprovalHubPanel from './panels/ApprovalHubPanel';
import { BEVEL_BUTTON } from '../cmms/scadaStyles';
import { useActiveSession } from '../../lib/rbac/activeSessionStore';
import type { SubProcessKey } from '../../types/lng';

interface CmmsOverviewDashboardViewProps {
  onNavigate?: (key: SubProcessKey, focusId?: string) => void;
}

// Approval Hub Phase 1 Stage 2c(HJ Option A) — 인라인 승인 버튼 노출 여부. 서버
// 라우트(work-orders/approve 등)의 게이팅과 동일하게 SITE_MANAGER/ADMIN만.
const APPROVAL_HUB_APPROVER_ROLES = ['SITE_MANAGER', 'ADMIN'];

export default function CmmsOverviewDashboardView({ onNavigate }: CmmsOverviewDashboardViewProps) {
  const { summary, loading, error, refresh } = useOverviewSummary();
  const session = useActiveSession();
  const canApproveHub = session ? APPROVAL_HUB_APPROVER_ROLES.includes(session.roleCode) : false;
  const { approve, pendingKey, error: actionError } = useApprovalHubActions(() => refresh(true));
  const approvalHubRef = useRef<HTMLDivElement>(null);
  const scrollToApprovalHub = () => approvalHubRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 w-full p-2 overflow-y-auto">
      <div className="tier3-title-bar flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none shrink-0">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-900" />
          <h2 className="text-base sm:text-lg font-black text-blue-950">DASHBOARD - CMMS Overview</h2>
        </div>
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
            <OverviewKpiCards summary={summary} onNavigate={onNavigate} onScrollToApprovalHub={scrollToApprovalHub} />
          </div>

          <div className="shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-2">
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

          <div ref={approvalHubRef} className="shrink-0">
            <ApprovalHubPanel
              items={summary.approvalHub.items}
              totalPendingCount={summary.approvalHub.totalPendingCount}
              loading={loading}
              canApprove={canApproveHub}
              pendingKey={pendingKey}
              actionError={actionError}
              onApprove={approve}
              onNavigate={onNavigate}
            />
          </div>
        </>
      )}
    </div>
  );
}
