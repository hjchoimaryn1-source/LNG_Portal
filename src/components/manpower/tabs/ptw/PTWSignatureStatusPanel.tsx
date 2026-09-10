// src/components/manpower/tabs/ptw/PTWSignatureStatusPanel.tsx
//
// PURPOSE
//   현재 permit이 다음 라이프사이클 단계로 넘어가기 위해 필요한 SSHQE §4.2
//   서명 슬롯을 체크리스트로 보여주고, 미서명 슬롯은 클릭 시 PTWSignatureModal을
//   연다. 하단에는 지금까지 수집된 전체 서명 이력(감사 추적용)을 표시한다.

'use client';

import React, { useState } from 'react';
import { PTWPermit, PTWSignatureRole, PTWWorkflowStatus, StaffPersonnel } from '../../../../types/lng';
import { PTW_SIGNATURE_ROLE_LABELS, PTW_TRANSITION_REQUIRED_ROLES } from '../../../../data/ptwSignatureRoles';
import { hasSignedRole } from '../../../../adapters/ptwSignatureGate';
import PTWSignatureModal from './modals/PTWSignatureModal';

export interface PTWSignatureStatusPanelProps {
  activePermit: PTWPermit;
  personnelList: StaffPersonnel[];
  onAddSignature: (permitId: string, role: PTWSignatureRole, staffId: string, staffName: string) => void;
}

const NEXT_STATUS_FOR: Partial<Record<PTWWorkflowStatus, PTWWorkflowStatus>> = {
  PREPARED: 'APPROVED',
  APPROVED: 'ACTIVE',
  ACTIVE: 'CLOSED',
};

export default function PTWSignatureStatusPanel({ activePermit, personnelList, onAddSignature }: PTWSignatureStatusPanelProps) {
  const [signingRole, setSigningRole] = useState<PTWSignatureRole | null>(null);

  const nextStatus = NEXT_STATUS_FOR[activePermit.status];
  const requiredRoles = nextStatus ? PTW_TRANSITION_REQUIRED_ROLES[nextStatus] || [] : [];
  const history = [...(activePermit.signatures || [])].reverse();

  return (
    <div className="border border-neutral-300 bg-[#ebe7df] p-2 rounded-none space-y-2 font-mono text-xs">
      <div className="bg-[#2A3B4C] text-white font-mono text-sm font-bold text-center py-1 px-2 border border-[#2A3B4C] rounded-none">
        ELECTRONIC SIGNATURE STATUS (SSHQE §4.2)
      </div>

      {requiredRoles.length === 0 ? (
        <div className="bg-neutral-50 p-2 border border-neutral-300 text-[11px] text-slate-600">
          {activePermit.status === 'CLOSED' ? '허가서가 폐쇄되었습니다.' : '다음 단계 전이에 필요한 서명이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-1">
          {requiredRoles.map((role) => {
            const signed = hasSignedRole(activePermit, role);
            const entry = (activePermit.signatures || []).find((s) => s.role === role);
            return (
              <div
                key={role}
                className={`flex items-center justify-between gap-2 p-1.5 border text-[11px] ${
                  signed ? 'bg-emerald-50 border-emerald-300' : 'bg-neutral-50 border-neutral-300'
                }`}
              >
                <span className="text-slate-800">{PTW_SIGNATURE_ROLE_LABELS[role]}</span>
                {signed && entry ? (
                  <span className="text-emerald-800 font-bold shrink-0">
                    ✓ {entry.staffName} @ {entry.signedAt}
                  </span>
                ) : (
                  <button
                    onClick={() => setSigningRole(role)}
                    className="px-2 py-0.5 text-[10px] font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer border border-neutral-400 shrink-0"
                  >
                    [SIGN]
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-300 max-h-32 overflow-y-auto">
          {history.map((s, i) => (
            <div key={`${s.role}-${i}`} className="px-2 py-1 text-[10px] text-slate-500 border-b border-neutral-200 last:border-b-0">
              {s.signedAt} — {PTW_SIGNATURE_ROLE_LABELS[s.role]} — {s.staffName} ({s.staffId})
            </div>
          ))}
        </div>
      )}

      <PTWSignatureModal
        isOpen={signingRole !== null}
        onClose={() => setSigningRole(null)}
        role={signingRole}
        permitId={activePermit.id}
        personnelList={personnelList}
        onSign={onAddSignature}
      />
    </div>
  );
}
