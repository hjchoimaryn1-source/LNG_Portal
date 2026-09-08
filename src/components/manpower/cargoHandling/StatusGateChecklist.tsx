// src/components/manpower/cargoHandling/StatusGateChecklist.tsx
"use client";

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import type { useCargoHandlingPermitForm } from './hooks/useCargoHandlingPermitForm';

export interface StatusGateChecklistProps {
  gates: ReturnType<typeof useCargoHandlingPermitForm>['gates'];
}

function GateRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className={`flex items-start gap-1.5 px-2 py-1 border-b border-gray-300 last:border-b-0 ${ok ? 'text-emerald-800' : 'text-rose-800'}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-600" />}
      <div className="text-[11px]">
        <div className="font-bold">{label}</div>
        {detail && <div className="opacity-80">{detail}</div>}
      </div>
    </div>
  );
}

export default function StatusGateChecklist({ gates }: StatusGateChecklistProps) {
  const { requiredSopCodes, criticalRisk, agt, isRetestDue, depressurization, grounding, safetyControls, competency, prepare, approve, activate, close } = gates;

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-1">
        {requiredSopCodes.map((code) => (
          <span key={code} className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 text-[10px] font-mono font-bold">
            {code}
          </span>
        ))}
      </div>

      {criticalRisk.isCriticalHighRisk && (
        <div className="bg-rose-100 border border-rose-500 text-rose-900 p-2 rounded flex items-start gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[11px]">Critical High Risk — Site Manager 서면 승인 및 ESDV 3단계 완전 고립 필요</div>
            <ul className="text-[10px] opacity-85 list-disc list-inside">
              {criticalRisk.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="border border-[#808080] rounded bg-white">
        <div className="bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">AGT Gas Safety Gate</div>
        <GateRow ok={agt.isSafe} label="Atmosphere Safe for Work" detail={agt.blockReason || undefined} />
        {agt.scbaRequiredTagIds.length > 0 && (
          <GateRow ok={false} label="SCBA 착용 필수" detail={`O2 < 19.5%: ${agt.scbaRequiredTagIds.join(', ')}`} />
        )}
        {isRetestDue && (
          <div className="flex items-center gap-1.5 px-2 py-1 text-amber-800">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">재측정 필요 (4시간 경과) — ACTIVE 유지 불가 후보</span>
          </div>
        )}
        <GateRow ok={agt.isAtmosphereSafeCertifiable} label="Atmosphere Safe 최종 인증 가능 (LEL 0% & O2 20.9±0.4%)" />
      </div>

      <div className="border border-[#808080] rounded bg-white">
        <div className="bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">Grounding / Depressurization Sequence</div>
        <GateRow ok={depressurization.isDisconnectionApproved} label={`Depressurization (Target ${depressurization.targetPressureMPa} MPa)`} detail={depressurization.blockReason || undefined} />
        <GateRow ok={grounding.canCheckDegrounding} label="배관/호스 분리 완료 → Degrounding 가능" detail={grounding.canCheckDegrounding ? undefined : '모든 배관/호스 분리 완료 후 접지 해제 가능'} />
        <GateRow ok={grounding.canStartPressurizedTransfer} label="Pressurized Transfer 시작 가능" detail={grounding.blockReason || undefined} />
      </div>

      <div className="border border-[#808080] rounded bg-white">
        <div className="bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">Mandatory Safety Controls</div>
        {safetyControls.allSatisfied ? (
          <GateRow ok={true} label="전체 항목 충족" />
        ) : (
          safetyControls.missingItems.map((item) => <GateRow key={item} ok={false} label={item} />)
        )}
      </div>

      <div className="border border-[#808080] rounded bg-white">
        <div className="bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">Competency Gate</div>
        {competency.isEligible ? (
          <GateRow ok={true} label="Crane Operator / Rigger 자격 충족" />
        ) : (
          competency.blockReasons.map((r) => <GateRow key={r} ok={false} label={r} />)
        )}
      </div>

      <div className="border border-[#808080] rounded bg-white">
        <div className="bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">Status Transition Readiness</div>
        <GateRow ok={prepare.canTransition} label="DRAFT → PREPARED" detail={prepare.blockReasons.join('; ') || undefined} />
        <GateRow ok={approve.canTransition} label={`PREPARED → APPROVED (Approver: ${approve.requiredApproverRole})`} detail={approve.blockReasons.join('; ') || undefined} />
        <GateRow ok={activate.canTransition} label="APPROVED → ACTIVE" detail={activate.blockReasons.join('; ') || undefined} />
        <GateRow ok={close.canTransition} label="ACTIVE → CLOSED" detail={close.incompleteItems.join('; ') || undefined} />
      </div>

      {!close.canTransition && close.incompleteItems.length > 0 && (
        <div className="flex items-start gap-1.5 text-amber-800 text-[10px]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>미완료 항목: {close.incompleteItems.join(', ')}</span>
        </div>
      )}
    </div>
  );
}
