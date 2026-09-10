// src/components/workorder/modals/WorkOrderDetailModal.tsx
//
// PURPOSE
//   WO 상세 팝업. permitRefNo로 연결된 e-PTW의 승인상태(PTWWorkflowStatus) +
//   SIMOPS 위험도를 함께 표시한다. CmmsAssetDetailModal.tsx가 남겨둔
//   "TO BE LINKED VIA e-PTW MODULE" 확장 지점의 구현체.

'use client';

import React, { useEffect, useMemo } from 'react';
import { PTWPermit, WOItem } from '../../../types/lng';
import { PTW_SOP_FORMS } from '../../../data/ptwMasterData';
import { resolveLinkedPermit, getWoSimopsRisk, WO_PERMIT_STATUS_BADGE } from '../../../adapters/workOrderPtwAdapter';
import { BEVEL_BUTTON, BEVEL_ICON_BUTTON, RAISED_PANEL, SUNKEN_PANEL, TITLE_BAR } from '../../cmms/scadaStyles';

function DataField({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[130px_1fr] border-b border-slate-300 last:border-b-0">
      <div className="bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 border-r border-slate-300 uppercase tracking-wide">
        {label}
      </div>
      <div className={`px-2.5 py-1.5 text-[12px] text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

const SIMOPS_RISK_BADGE: Record<'RED' | 'AMBER' | 'GREEN', string> = {
  RED: 'text-red-800 bg-red-50 border-red-700',
  AMBER: 'text-amber-800 bg-amber-50 border-amber-700',
  GREEN: 'text-emerald-800 bg-emerald-50 border-emerald-700',
};

interface WorkOrderDetailModalProps {
  wo: WOItem | null;
  permits: PTWPermit[];
  onClose: () => void;
  onMarkCompleted?: (wo: WOItem) => void;
}

export default function WorkOrderDetailModal({ wo, permits, onClose, onMarkCompleted }: WorkOrderDetailModalProps) {
  useEffect(() => {
    if (!wo) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [wo, onClose]);

  const link = useMemo(() => (wo ? resolveLinkedPermit(wo, permits) : null), [wo, permits]);
  const simopsRisk = useMemo(() => (link ? getWoSimopsRisk(link.permit, permits) : null), [link, permits]);

  if (!wo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className={`${RAISED_PANEL} shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between ${TITLE_BAR}`}>
          <span>WORK ORDER DETAIL — {wo.wo}</span>
          <button onClick={onClose} aria-label="모달 닫기" className={`${BEVEL_ICON_BUTTON} w-5 h-5`}>
            ✕
          </button>
        </div>

        <div className="p-3">
          <div className={`${SUNKEN_PANEL} px-3 py-2 mb-3`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-slate-900">{wo.wo}</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-700">
                {wo.status}
              </span>
            </div>
            <div className="text-[12px] text-slate-600 mt-0.5">{wo.desc}</div>
          </div>

          <div className={SUNKEN_PANEL}>
            <DataField label="TARGET ASSET" value={wo.tag} mono />
            <DataField label="WORK TYPE" value={wo.type} />
            <DataField label="PRIORITY" value={wo.priority} />
            <DataField label="DUE DATE" value={wo.due} />
            <DataField label="ENGINEER" value={wo.tech} />
          </div>

          <div className="mt-3">
            <div className={`${TITLE_BAR} !bg-slate-700`}>LINKED e-PTW</div>
            <div className={SUNKEN_PANEL}>
              {link?.state === 'NO_PERMIT' && (
                <div className="px-2.5 py-3 text-[11px] text-slate-500 font-mono">
                  이 작업에는 연결된 e-PTW가 없습니다 (일반 PM 작업).
                </div>
              )}
              {link?.state === 'PERMIT_NOT_FOUND' && (
                <div className="px-2.5 py-3 text-[11px] text-red-700 font-mono">
                  ⚠ permitRefNo=&quot;{wo.permitRefNo}&quot;에 해당하는 permit을 찾을 수 없습니다.
                </div>
              )}
              {link?.state === 'LINKED' && link.permit && (
                <>
                  <DataField label="PERMIT ID" value={link.permit.id} mono />
                  <DataField label="SOP FORM" value={PTW_SOP_FORMS[link.permit.type].shortTitle} />
                  <DataField
                    label="승인 상태"
                    value={
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${WO_PERMIT_STATUS_BADGE[link.permit.status]}`}>
                        {link.permit.status}
                      </span>
                    }
                  />
                  <DataField
                    label="SIMOPS 위험도"
                    value={
                      simopsRisk ? (
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${SIMOPS_RISK_BADGE[simopsRisk.riskLevel]}`}>
                          {simopsRisk.riskLevel}
                          {simopsRisk.message ? ` — ${simopsRisk.message}` : ''}
                        </span>
                      ) : (
                        '—'
                      )
                    }
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            {onMarkCompleted && wo.status !== 'COMPLETED' && (
              <button
                onClick={() => {
                  onMarkCompleted(wo);
                  onClose();
                }}
                className={BEVEL_BUTTON}
              >
                작업 완료 처리
              </button>
            )}
            <button onClick={onClose} className={BEVEL_BUTTON}>
              확인 (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
