// src/components/manpower/modals/ptw/SimopsWarningModal.tsx
//
// PURPOSE
//   useSIMOPSCheck(evaluateSimopsDryRun) 판정 결과를 제출 게이트로 렌더링.
//   HARD_BLOCK: 확인(Acknowledge)만 가능 — 제출로 이어지는 버튼 없음.
//   SOFT_ESCALATE: 명시적 override 확인 없이는 제출이 재개되지 않음.

"use client";

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { SimopsCheckResult } from '../../../../hooks/useSIMOPSCheck';

export interface SimopsWarningModalProps {
  result: SimopsCheckResult;
  onAcknowledge: () => void;
  onCancel: () => void;
  onConfirmOverride: () => void;
}

export default function SimopsWarningModal({
  result,
  onAcknowledge,
  onCancel,
  onConfirmOverride,
}: SimopsWarningModalProps) {
  const isHardBlock = result.actionRequired === 'HARD_BLOCK';

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[60] p-4">
      <div className="win-panel w-full max-w-md bg-white border-2 border-rose-800 rounded-xl shadow-2xl overflow-hidden font-sans">
        <div
          className={`px-5 py-3 flex items-center gap-2 text-white ${
            isHardBlock ? 'bg-rose-800' : 'bg-amber-600'
          }`}
        >
          {isHardBlock ? <ShieldAlert className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="font-bold text-sm">
            {isHardBlock ? 'SIMOPS HARD BLOCK — Permit Cannot Be Issued' : 'SIMOPS Warning — Secondary Approval Required'}
          </span>
        </div>

        <div className="p-5 space-y-3 text-sm text-slate-800">
          <p>{result.message}</p>
          {isHardBlock ? (
            <p className="text-xs text-slate-500">
              동일 공간/장비에서 상충되는 활성 Permit이 존재합니다. 해당 Permit이 종료되거나 작업 범위를 변경한 뒤 다시 시도하십시오.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              계속 진행하려면 Secondary JSA 및 Site Manager 승인을 별도로 확보해야 합니다. 아래 확인 시 이 조건을 인지했음을 기록합니다.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
          {isHardBlock ? (
            <button
              onClick={onAcknowledge}
              className="win-btn px-5 py-2 text-xs font-bold bg-rose-800 hover:bg-rose-900 text-white rounded-md cursor-pointer"
            >
              확인 (Acknowledge)
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="win-btn px-5 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-200 rounded-md"
              >
                취소
              </button>
              <button
                onClick={onConfirmOverride}
                className="win-btn px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md cursor-pointer"
              >
                인지하고 계속 진행 (Confirm Override)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
