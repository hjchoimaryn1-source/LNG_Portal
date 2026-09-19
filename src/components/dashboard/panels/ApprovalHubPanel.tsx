// src/components/dashboard/panels/ApprovalHubPanel.tsx
//
// PURPOSE
//   Approval Hub Phase 1 — Stage 3a/3b/3d. PTW/WORK_ORDER/MRO_REQ/
//   SHIFT_OVERRIDE 승인 대기 항목을 한 화면에 모아 보여주는 통합 테이블.
//   집계 로직은 overviewSummaryAdapter.computeApprovalHub()에 위임하고,
//   이 컴포넌트는 순수 배치 + 액션 버튼 클릭 위임만 담당한다.
//
//   PTW 행은 인라인 승인 버튼을 만들지 않는다 — Stage 1d(hq_handoff_status)가
//   HJ 승인 대기 중이라 기존 PTWStatusActions.tsx 딥링크(onNavigate)만 유지한다.

import React from 'react';
import { ClipboardList } from 'lucide-react';
import type { ApprovalHubItem, ApprovalHubDocType } from '../../../adapters/overviewSummaryAdapter';
import type { SubProcessKey } from '../../../types/lng';

const DOC_TYPE_LABELS: Record<ApprovalHubDocType, string> = {
  PTW: 'PTW',
  WORK_ORDER: 'Work Order',
  MRO_REQ: 'MRO PR',
  SHIFT_OVERRIDE: 'Shift Override',
};

const DOC_TYPE_BADGE_CLASSES: Record<ApprovalHubDocType, string> = {
  PTW: 'bg-blue-100 text-blue-900 border-blue-400',
  WORK_ORDER: 'bg-amber-100 text-amber-900 border-amber-400',
  MRO_REQ: 'bg-purple-100 text-purple-900 border-purple-400',
  SHIFT_OVERRIDE: 'bg-teal-100 text-teal-900 border-teal-400',
};

interface ApprovalHubPanelProps {
  items: ApprovalHubItem[];
  totalPendingCount: number;
  loading: boolean;
  canApprove: boolean;
  pendingKey: string | null;
  actionError: string | null;
  onApprove: (docType: ApprovalHubDocType, id: string, decision: 'SITE_APPROVED' | 'REJECTED') => void;
  onNavigate?: (key: SubProcessKey, focusId?: string) => void;
}

export default function ApprovalHubPanel({
  items,
  totalPendingCount,
  loading,
  canApprove,
  pendingKey,
  actionError,
  onApprove,
  onNavigate,
}: ApprovalHubPanelProps) {
  return (
    <div className="win-panel flex flex-col min-h-0">
      <div className="tier2-header flex items-center gap-1.5">
        <ClipboardList className="w-3.5 h-3.5" />
        <span>Approval Hub — Unified Pending Actions</span>
        <span className="ml-auto text-[10px] font-mono text-white/80">{totalPendingCount} PENDING</span>
      </div>
      {actionError && (
        <div className="px-2 py-1 text-[10.5px] text-red-700 font-mono bg-red-50 border-b border-red-700">
          ⚠ {actionError}
        </div>
      )}
      <div className="min-h-0 max-h-72 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[10.5px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400 sticky top-0">
              <th className="p-1.5 border-r border-slate-300">Type</th>
              <th className="p-1.5 border-r border-slate-300">Ref</th>
              <th className="p-1.5 border-r border-slate-300">Title</th>
              <th className="p-1.5 border-r border-slate-300">Requested</th>
              <th className="p-1.5 border-r border-slate-300">Status</th>
              <th className="p-1.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-slate-400">로딩 중...</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-emerald-700">대기 중인 승인 항목 없음</td>
              </tr>
            )}
            {!loading &&
              items.map((item, i) => {
                const key = `${item.docType}:${item.id}`;
                const isPending = pendingKey === key;
                return (
                  <tr key={key} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-amber-50'}`}>
                    <td className="p-1.5 border-r border-slate-300">
                      <span className={`px-1.5 py-0.5 border rounded text-[9.5px] font-bold ${DOC_TYPE_BADGE_CLASSES[item.docType]}`}>
                        {DOC_TYPE_LABELS[item.docType]}
                      </span>
                    </td>
                    <td
                      className={`p-1.5 border-r border-slate-300 font-bold text-blue-950 ${item.docType === 'PTW' && onNavigate ? 'cursor-pointer hover:underline' : ''}`}
                      onClick={item.docType === 'PTW' && onNavigate ? () => onNavigate('PTW_PERMITS', item.id) : undefined}
                    >
                      {item.ref}
                    </td>
                    <td className="p-1.5 border-r border-slate-300">{item.title}</td>
                    <td className="p-1.5 border-r border-slate-300 text-slate-600">{item.requestedAt ?? '—'}</td>
                    <td className="p-1.5 border-r border-slate-300">
                      <span className="font-bold text-amber-800">{item.approvalStatus}</span>
                      {item.hqHandoffStatus === 'PENDING_HQ_REVIEW' && (
                        <span className="ml-1.5 px-1 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-400 rounded text-[9px] font-bold">
                          → HQ 검토 대기
                        </span>
                      )}
                    </td>
                    <td className="p-1.5">
                      {item.docType === 'PTW' ? (
                        <button
                          onClick={onNavigate ? () => onNavigate('PTW_PERMITS', item.id) : undefined}
                          className="win-btn px-1.5 py-0.5 text-[9.5px] font-bold text-blue-950 bg-[#d4d0c8] border border-gray-600"
                        >
                          이동
                        </button>
                      ) : canApprove ? (
                        <div className="flex gap-1">
                          <button
                            disabled={isPending}
                            onClick={() => onApprove(item.docType, item.id, 'SITE_APPROVED')}
                            className="win-btn px-1.5 py-0.5 text-[9.5px] font-bold text-white bg-emerald-700 border border-black disabled:opacity-50"
                          >
                            승인
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => onApprove(item.docType, item.id, 'REJECTED')}
                            className="win-btn px-1.5 py-0.5 text-[9.5px] font-bold text-white bg-rose-700 border border-black disabled:opacity-50"
                          >
                            반려
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[9.5px]">권한 없음</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
