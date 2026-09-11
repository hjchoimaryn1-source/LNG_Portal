// src/components/dashboard/panels/HqSettlementDisputePanel.tsx
//
// PURPOSE
//   JakartaHQDashboard(§3.1.1)의 "Settlement Ledger & Dispute Audit" 섹션.
//   유일한 뮤테이션성 컨트롤은 "Acknowledge"(분쟁 확인) 버튼이다 — 다만
//   PortalDataContext에는 이를 위한 실제 원장 뮤테이션이 없으므로, 컴포넌트
//   로컬 state로만 표시되는 시각적 확인 표시이며 새로고침 시 초기화된다.
//   Auditor Mode 시 시각적 비활성화(disabled)뿐 아니라 blockIfAuditorMode로
//   핸들러 진입 시점에도 재차 차단한다(defense-in-depth).

'use client';

import React, { useState } from 'react';
import { FileWarning, ShieldAlert } from 'lucide-react';
import type { SettlementLedgerEntry, SubProcessKey } from '../../../types/lng';
import type { RoleCode } from '../../../types/rbac';
import { blockIfAuditorMode } from '../../../lib/rbac/guardrails';
import { BEVEL_BUTTON, SUNKEN_PANEL, TITLE_BAR, CRITICALITY_BADGE } from '../../cmms/scadaStyles';

interface HqSettlementDisputePanelProps {
  disputeRecords: SettlementLedgerEntry[];
  readOnly: boolean;
  roleCode: RoleCode;
  onNavigate?: (key: SubProcessKey, focusId?: string) => void;
}

export default function HqSettlementDisputePanel({
  disputeRecords,
  readOnly,
  roleCode,
  onNavigate,
}: HqSettlementDisputePanelProps) {
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const handleAcknowledge = (id: string) => {
    const guard = blockIfAuditorMode(roleCode, 'UPDATE');
    if (!guard.allowed) {
      setBlockedMessage(guard.reason ?? 'AUDITOR_MODE_MUTATION_BLOCKED');
      return;
    }
    setBlockedMessage(null);
    setAcknowledgedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className={`${SUNKEN_PANEL} flex flex-col min-h-0`}>
      <div className={`${TITLE_BAR} flex items-center justify-between`}>
        <span className="flex items-center gap-1.5">
          <FileWarning className="w-3.5 h-3.5" />
          Settlement Ledger & Dispute Audit ({disputeRecords.length} disputes)
        </span>
        <button
          onClick={() => onNavigate?.('NIAS_HEAT_SETTLEMENT')}
          className={`${BEVEL_BUTTON} !text-[10px] !py-0.5`}
        >
          View Full Ledger
        </button>
      </div>

      {blockedMessage && (
        <div className="px-2 py-1 text-[11px] text-red-700 font-mono bg-red-50 border-b border-red-700 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> {blockedMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 text-[11px] font-mono">
        {disputeRecords.length === 0 ? (
          <div className="text-slate-400 text-center py-4">
            분쟁 알림 없음 — 전체 정산 기록 허용 오차(5.0%) 이내
          </div>
        ) : (
          disputeRecords.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-slate-200 py-1.5 gap-2">
              <div className="min-w-0">
                <span className={`px-1.5 py-0.5 border text-[10px] font-bold ${CRITICALITY_BADGE.CRITICAL}`}>
                  {r.tankNo}
                </span>
                <span className="text-slate-500 ml-2">{r.shipment} · {r.date}</span>
                <span className="ml-2 text-red-600 font-bold">{r.lossesPercent.toFixed(2)}% loss</span>
              </div>
              <button
                onClick={() => handleAcknowledge(r.id)}
                disabled={readOnly || acknowledgedIds.has(r.id)}
                className={`${BEVEL_BUTTON} !text-[10px] !py-0.5 shrink-0`}
              >
                {acknowledgedIds.has(r.id) ? 'ACKNOWLEDGED' : 'Acknowledge'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
