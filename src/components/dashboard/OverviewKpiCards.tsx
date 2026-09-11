// src/components/dashboard/OverviewKpiCards.tsx
//
// PURPOSE
//   Overview 대시보드 상단 Top KPI Summary Cards 행. overviewSummaryAdapter.
//   OverviewSummary의 집계 필드만 표시하는 순수 프레젠테이션 컴포넌트 —
//   계산 로직은 갖지 않는다.

import React from 'react';
import { Boxes, Wrench, ShieldAlert, Flame, ClipboardCheck, Package } from 'lucide-react';
import type { OverviewSummary } from '../../adapters/overviewSummaryAdapter';
import type { SubProcessKey } from '../../types/lng';

interface KpiCardProps {
  label: string;
  value: number;
  subLabel: string;
  icon: React.ReactNode;
  tone: 'neutral' | 'warn' | 'danger' | 'ok';
  onClick?: () => void;
}

const TONE_CLASSES: Record<KpiCardProps['tone'], string> = {
  neutral: 'text-blue-950',
  ok: 'text-emerald-700',
  warn: 'text-amber-700',
  danger: 'text-red-700',
};

function KpiCard({ label, value, subLabel, icon, tone, onClick }: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`win-panel flex-1 min-w-[150px] px-2.5 py-2 flex flex-col gap-0.5 ${onClick ? 'cursor-pointer hover:brightness-95' : ''}`}
    >
      <div className="flex items-center gap-1.5 text-slate-600">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-2xl font-black font-mono leading-tight ${TONE_CLASSES[tone]}`}>{value}</span>
      <span className="text-[10px] text-slate-500 font-mono">{subLabel}</span>
    </div>
  );
}

interface OverviewKpiCardsProps {
  summary: OverviewSummary;
  onNavigate?: (key: SubProcessKey) => void;
}

export default function OverviewKpiCards({ summary, onNavigate }: OverviewKpiCardsProps) {
  const activeWoCount = summary.workOrders.SCHEDULED + summary.workOrders.IN_PROGRESS + summary.workOrders.PARTS_PENDING;

  return (
    <div className="flex flex-wrap gap-2">
      <KpiCard
        label="Assets Operational / Maintenance"
        value={summary.assets.operational}
        subLabel={`정비중 ${summary.assets.maintenance} / 전체 ${summary.assets.total}`}
        icon={<Boxes className="w-3.5 h-3.5" />}
        tone="neutral"
        onClick={onNavigate && (() => onNavigate('EQUIPMENT_ASSET_REGISTRY'))}
      />
      <KpiCard
        label="Work Orders Active / Overdue"
        value={activeWoCount}
        subLabel={`OVERDUE ${summary.workOrders.OVERDUE}건`}
        icon={<Wrench className="w-3.5 h-3.5" />}
        tone={summary.workOrders.OVERDUE > 0 ? 'danger' : 'neutral'}
        onClick={onNavigate && (() => onNavigate('WORK_ORDER_DIRECTORY'))}
      />
      <KpiCard
        label="PTW Active Permits"
        value={summary.ptwPermits.ACTIVE}
        subLabel={`승인대기 ${summary.ptwPermits.APPROVED} / 준비 ${summary.ptwPermits.PREPARED}`}
        icon={<ClipboardCheck className="w-3.5 h-3.5" />}
        tone="neutral"
        onClick={onNavigate && (() => onNavigate('PTW_PERMITS'))}
      />
      <KpiCard
        label="Pending Approval Signatures"
        value={summary.pendingApprovals.length}
        subLabel="PTW 서명 대기 건수"
        icon={<ShieldAlert className="w-3.5 h-3.5" />}
        tone={summary.pendingApprovals.length > 0 ? 'warn' : 'ok'}
        onClick={onNavigate && (() => onNavigate('PTW_PERMITS'))}
      />
      <KpiCard
        label={`Gas Safety Alerts (${summary.gasTestAlerts.windowHours}H)`}
        value={summary.gasTestAlerts.count}
        subLabel="AGT FAIL 판정 건수"
        icon={<Flame className="w-3.5 h-3.5" />}
        tone={summary.gasTestAlerts.count > 0 ? 'danger' : 'ok'}
      />
      <KpiCard
        label="MRO Low-Stock Items"
        value={summary.mroLowStock.count}
        subLabel="최소 재고 이하 부품"
        icon={<Package className="w-3.5 h-3.5" />}
        tone={summary.mroLowStock.count > 0 ? 'warn' : 'ok'}
        onClick={onNavigate && (() => onNavigate('MRO_PARTS_INVENTORY'))}
      />
    </div>
  );
}
