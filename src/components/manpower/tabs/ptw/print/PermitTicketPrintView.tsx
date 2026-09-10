// src/components/manpower/tabs/ptw/print/PermitTicketPrintView.tsx
//
// PURPOSE
//   현장 인쇄/PDF용 NP07 양식 레이아웃(A4). 순수 표시 컴포넌트 — 화면
//   전용 SCADA 베벨 스타일은 쓰지 않고, 실물 서식에 가까운 흑백 표 레이아웃을
//   사용한다. SIMOPS 판정은 호출자(PermitTicketPrintModal)가 계산해 prop으로
//   내려준다 — 이 컴포넌트는 다른 permit 목록에 접근하지 않는다.

'use client';

import React, { useMemo } from 'react';
import { PTWPermit, PTWSignatureRole } from '../../../../../types/lng';
import { PTW_SOP_FORMS } from '../../../../../data/ptwMasterData';
import { getCargoHandlingSOPInfo } from '../../../../../data/ptwCargoHandlingRules';
import { PTW_SIGNATURE_ROLE_LABELS, PTW_TRANSITION_REQUIRED_ROLES } from '../../../../../data/ptwSignatureRoles';
import { COMPANY_CONFIG } from '../../../../../config/siteConfig';
import { SimopsCheckResult } from '../../../../../hooks/useSIMOPSCheck';

export interface PermitTicketPrintViewProps {
  permit: PTWPermit;
  simopsRisk: SimopsCheckResult | null;
}

const CHECKLIST_LABELS: { key: keyof PTWPermit['safetyChecklist']; label: string }[] = [
  { key: 'fireWatchAssigned', label: 'Fire Watch Assigned' },
  { key: 'gasDetectorContinuous', label: 'Continuous Gas Monitoring' },
  { key: 'lotoApplied', label: 'LOTO Isolation Applied' },
  { key: 'forcedVentilation', label: 'Forced Ventilation' },
  { key: 'ppeVerified', label: 'Cryogenic PPE Verified' },
  { key: 'barricadeSet', label: 'Barricade / Exclusion Zone Set' },
];

function SignatureBlock({ title, roles, permit }: { title: string; roles: PTWSignatureRole[]; permit: PTWPermit }) {
  return (
    <div className="border border-black mt-2">
      <div className="bg-neutral-200 text-black font-bold text-[10px] px-2 py-1 border-b border-black">{title}</div>
      <table className="w-full text-[9px] border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left px-2 py-1 border-r border-black">ROLE</th>
            <th className="text-left px-2 py-1 border-r border-black">NAME / ID</th>
            <th className="text-left px-2 py-1">SIGNED AT</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => {
            const entry = (permit.signatures || []).find((s) => s.role === role);
            return (
              <tr key={role} className="border-b border-black last:border-b-0">
                <td className="px-2 py-2 border-r border-black align-top">{PTW_SIGNATURE_ROLE_LABELS[role]}</td>
                <td className="px-2 py-2 border-r border-black align-top">
                  {entry ? `${entry.staffName} (${entry.staffId})` : ''}
                </td>
                <td className="px-2 py-2 align-top">{entry ? entry.signedAt : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PermitTicketPrintView({ permit, simopsRisk }: PermitTicketPrintViewProps) {
  const sopFormBadge = useMemo(() => {
    if (permit.type === 'CARGO_HANDLING') {
      const activityType = permit.cargoHandling?.activityType ?? 'COMBINED';
      return getCargoHandlingSOPInfo(activityType).map((f) => f.formNumber).join(' / ');
    }
    return PTW_SOP_FORMS[permit.type].formNumber;
  }, [permit]);

  return (
    <div className="bg-white text-black p-6 font-sans text-[11px] leading-snug w-[210mm] min-h-[297mm] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-3">
        <div>
          <div className="font-bold text-sm">{COMPANY_CONFIG.companyName}</div>
          <div className="text-[10px]">PERMIT TO WORK (PTW) — {PTW_SOP_FORMS[permit.type].title}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm">FORM {sopFormBadge}</div>
          <div className="text-[10px]">Permit No: {permit.id}</div>
          <div className="text-[10px]">Status: {permit.status}</div>
        </div>
      </div>

      {/* PART A: Description of Work */}
      <div className="border border-black mb-2">
        <div className="bg-neutral-200 font-bold text-[10px] px-2 py-1 border-b border-black">PART A — DESCRIPTION OF WORK</div>
        <table className="w-full text-[10px] border-collapse">
          <tbody>
            <tr className="border-b border-black">
              <td className="w-32 font-bold px-2 py-1 border-r border-black">Task</td>
              <td className="px-2 py-1">{permit.title}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold px-2 py-1 border-r border-black">Location / Equipment Tag</td>
              <td className="px-2 py-1">{permit.location} {permit.equipmentTag ? `(${permit.equipmentTag})` : ''}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold px-2 py-1 border-r border-black">Work Area</td>
              <td className="px-2 py-1">{permit.workArea ?? 'N/A'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold px-2 py-1 border-r border-black">Hazard Description</td>
              <td className="px-2 py-1">{permit.hazardDescription}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold px-2 py-1 border-r border-black">Work Leader</td>
              <td className="px-2 py-1">{permit.workLeaderName} ({permit.workLeaderId})</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold px-2 py-1 border-r border-black">Assigned Workers</td>
              <td className="px-2 py-1">{permit.assignedWorkerNames.join(', ') || 'N/A'}</td>
            </tr>
            <tr>
              <td className="font-bold px-2 py-1 border-r border-black">Valid Period</td>
              <td className="px-2 py-1">{permit.validFrom} ~ {permit.validTo}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PART B: Preparation — Safety Checklist */}
      <div className="border border-black mb-2">
        <div className="bg-neutral-200 font-bold text-[10px] px-2 py-1 border-b border-black">PART B — PREPARATION / MANDATORY SAFETY CONTROLS</div>
        <div className="grid grid-cols-2 text-[10px]">
          {CHECKLIST_LABELS.map(({ key, label }, i) => (
            <div key={key} className={`px-2 py-1 flex justify-between ${i % 2 === 0 ? 'border-r border-black' : ''} border-b border-black`}>
              <span>{label}</span>
              <span className="font-bold">[{permit.safetyChecklist[key] ? 'X' : ' '}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gas Readings & Re-test History */}
      <div className="border border-black mb-2">
        <div className="bg-neutral-200 font-bold text-[10px] px-2 py-1 border-b border-black">GAS TEST READINGS (LATEST + RE-TEST HISTORY)</div>
        <table className="w-full text-[9px] border-collapse">
          <thead>
            <tr className="border-b border-black bg-neutral-100">
              <th className="text-left px-2 py-1 border-r border-black">TESTED AT</th>
              <th className="text-left px-2 py-1 border-r border-black">LEL %</th>
              <th className="text-left px-2 py-1 border-r border-black">O2 %</th>
              <th className="text-left px-2 py-1 border-r border-black">H2S ppm</th>
              <th className="text-left px-2 py-1 border-r border-black">TESTER</th>
              <th className="text-left px-2 py-1">RESULT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="px-2 py-1 border-r border-black">{permit.gasReadings.testedAt}</td>
              <td className="px-2 py-1 border-r border-black">{permit.gasReadings.lelPercent}</td>
              <td className="px-2 py-1 border-r border-black">{permit.gasReadings.o2Percent}</td>
              <td className="px-2 py-1 border-r border-black">{permit.gasReadings.h2sPpm}</td>
              <td className="px-2 py-1 border-r border-black">—</td>
              <td className="px-2 py-1 font-bold">{permit.gasReadings.isSafeForWork ? 'SAFE' : 'UNSAFE'}</td>
            </tr>
            {(permit.gasTestHistory || []).map((entry) => (
              <tr key={entry.id} className="border-b border-black last:border-b-0">
                <td className="px-2 py-1 border-r border-black">{entry.testedAt}</td>
                <td className="px-2 py-1 border-r border-black">{entry.lelPercent}</td>
                <td className="px-2 py-1 border-r border-black">{entry.o2Percent}</td>
                <td className="px-2 py-1 border-r border-black">{entry.h2sPpm}</td>
                <td className="px-2 py-1 border-r border-black">{entry.testerName}{entry.testerId ? ` (${entry.testerId})` : ''}</td>
                <td className="px-2 py-1 font-bold">{entry.isSafeForWork ? 'SAFE' : 'UNSAFE'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SIMOPS Risk */}
      <div className="border border-black mb-2">
        <div className="bg-neutral-200 font-bold text-[10px] px-2 py-1 border-b border-black">SIMOPS (SIMULTANEOUS OPERATIONS) RISK ASSESSMENT</div>
        <div className="px-2 py-1.5 text-[10px]">
          {simopsRisk ? (
            <>
              <span className="font-bold">RISK LEVEL: {simopsRisk.riskLevel}</span> — {simopsRisk.actionRequired}
              {simopsRisk.message ? <div className="mt-1">{simopsRisk.message}</div> : null}
            </>
          ) : (
            'No SIMOPS conflict evaluated.'
          )}
        </div>
      </div>

      {/* PART C/D/E: Signature Blocks */}
      <SignatureBlock title="PART C — APPROVAL" roles={PTW_TRANSITION_REQUIRED_ROLES.APPROVED || []} permit={permit} />
      <SignatureBlock title="PART D — ISSUE & ACTIVATION" roles={PTW_TRANSITION_REQUIRED_ROLES.ACTIVE || []} permit={permit} />
      <SignatureBlock title="PART E — RETURN & CLOSE-OUT" roles={PTW_TRANSITION_REQUIRED_ROLES.CLOSED || []} permit={permit} />

      <div className="text-[9px] text-neutral-600 mt-3 pt-2 border-t border-black">
        Electronically generated — NIAS CMMS Portal — printed {new Date().toLocaleString('id-ID')} WIB
      </div>
    </div>
  );
}
