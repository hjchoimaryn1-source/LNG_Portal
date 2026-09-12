// src/components/dashboard/panels/HqEnergyReconciliationPanel.tsx
//
// PURPOSE
//   JakartaHQDashboard(§3.1.1)의 "Energy Reconciliation" 섹션 — Delivered vs
//   Consumed MMBtu, BOG Loss Rate. 순수 표시 전용(뮤테이션 없음). 계산은
//   utils/hqEnergyReconciliation.ts에서 이미 끝낸 값을 prop으로 받는다.

'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import type { EnergyReconciliationSummary } from '../utils/hqEnergyReconciliation';
import { SUNKEN_PANEL, TITLE_BAR } from '../../cmms/scadaStyles';

interface HqEnergyReconciliationPanelProps {
  summary: EnergyReconciliationSummary;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-300 p-2">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

export default function HqEnergyReconciliationPanel({ summary }: HqEnergyReconciliationPanelProps) {
  return (
    <div className={`${SUNKEN_PANEL} flex flex-col`}>
      <div className={`${TITLE_BAR} flex items-center gap-1.5`}>
        <Zap className="w-3.5 h-3.5" />
        Energy Reconciliation — Delivered vs Consumed
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 font-mono text-[11px]">
        <StatTile
          label="1. Arun Delivered"
          value={`${summary.totalDeliveredMMBtu.toLocaleString(undefined, { maximumFractionDigits: 1 })} MMBtu`}
        />
        <StatTile
          label="2. Nias Consumed"
          value={`${summary.totalConsumedMMBtu.toLocaleString(undefined, { maximumFractionDigits: 1 })} MMBtu`}
        />
        <StatTile
          label="Net Variance"
          value={`${summary.netVarianceMMBtu.toLocaleString(undefined, { maximumFractionDigits: 1 })} MMBtu`}
        />
        <StatTile
          label="BOG Loss Rate"
          value={`${summary.avgLossPercentage.toFixed(2)}% (${summary.totalLossesKg.toLocaleString()} kg)`}
        />
      </div>
    </div>
  );
}
