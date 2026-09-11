// src/components/dashboard/panels/PendingApprovalsPanel.tsx
//
// PURPOSE
//   Overview 대시보드 Panel A. ptw_signatures(ptwSignatureDao.ts) 기반으로
//   overviewSummaryAdapter.getOverviewSummary()가 파생한 PendingApprovalItem
//   목록을 표시한다 — 서명 게이트 판정 로직은 재구현하지 않는다(SSOT: PART C/D/E).

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { PendingApprovalItem } from '../../../adapters/overviewSummaryAdapter';
import { PTW_SIGNATURE_ROLE_LABELS } from '../../../data/ptwSignatureRoles';
import type { SubProcessKey } from '../../../types/lng';

interface PendingApprovalsPanelProps {
  items: PendingApprovalItem[];
  loading: boolean;
  onNavigate?: (key: SubProcessKey, focusId?: string) => void;
}

export default function PendingApprovalsPanel({ items, loading, onNavigate }: PendingApprovalsPanelProps) {
  return (
    <div className="win-panel flex flex-col min-h-0 h-full">
      <div className="win-titlebar px-2 py-1 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">Global Pending Approvals</span>
        <span className="ml-auto text-[10px] font-mono text-white/80">{items.length} PENDING</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[10.5px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Permit ID</th>
              <th className="p-1.5 border-r border-slate-300">Status</th>
              <th className="p-1.5 border-r border-slate-300">Target</th>
              <th className="p-1.5">Missing Signature(s)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-slate-400">로딩 중...</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-emerald-700">대기 중인 승인 서명 없음</td>
              </tr>
            )}
            {!loading &&
              items.map((item, i) => (
                <tr
                  key={item.permitId}
                  onClick={onNavigate && (() => onNavigate('PTW_PERMITS', item.permitId))}
                  className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-amber-50'} ${onNavigate ? 'cursor-pointer hover:bg-amber-100' : ''}`}
                >
                  <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{item.permitId}</td>
                  <td className="p-1.5 border-r border-slate-300">{item.currentStatus}</td>
                  <td className="p-1.5 border-r border-slate-300 font-bold text-amber-800">{item.targetStatus}</td>
                  <td className="p-1.5 text-red-700">
                    {item.missingRoles.map((role) => PTW_SIGNATURE_ROLE_LABELS[role]).join(' / ')}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
