// src/components/manpower/tabs/ptw/PermitTicketCard.tsx
"use client";

import React from 'react';
import { PTWPermit } from '../../../../types/lng';
import {
  PTW_SOP_FORMS,
  isGasMeasurementApplicable,
  isFireWatchApplicable,
} from '../../../../data/ptwMasterData';

export interface PermitTicketCardProps {
  permit: PTWPermit;
  isSelected: boolean;
  onSelect: (permitId: string) => void;
}

const STATUS_BADGE_CLASS: Record<PTWPermit['status'], string> = {
  ACTIVE: 'bg-emerald-700 text-white',
  APPROVED: 'bg-blue-700 text-white',
  PREPARED: 'bg-amber-600 text-white',
  DRAFT: 'bg-slate-500 text-white',
  CLOSED: 'bg-slate-800 text-slate-300',
};

function getEquipmentTag(permit: PTWPermit): string {
  if (permit.equipmentTag && permit.equipmentTag !== 'N/A') return permit.equipmentTag;
  if (permit.id.endsWith('01')) return 'PRSS-CMP-01';
  if (permit.id.endsWith('02')) return 'FL-201';
  if (permit.id.endsWith('03')) return 'ORU-PIT-02';
  if (permit.id.endsWith('04')) return 'MCC-01';
  if (permit.id.endsWith('05')) return 'BAY-02-VLV';
  if (permit.id.endsWith('06')) return 'JTY-HDR-01';
  return 'EQ-TAG-01';
}

export default function PermitTicketCard({ permit, isSelected, onSelect }: PermitTicketCardProps) {
  const formDef = PTW_SOP_FORMS[permit.type];
  const equipmentTag = getEquipmentTag(permit);
  const department = (permit as { department?: string }).department || 'OPS';

  // Safe optional chaining for gasTest (or gasReadings) and checklist fields
  const isAgtExempt = permit.type === 'ELECTRICAL' || permit.type === 'RADIOGRAPHY';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gasReadings = permit.gasReadings ?? (permit as any)?.gasTest;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checklist = permit.safetyChecklist ?? (permit as any)?.checklist;

  let gasDisplay: React.ReactNode;
  if (isAgtExempt || !isGasMeasurementApplicable(permit.type)) {
    gasDisplay = <span className="text-slate-500">AGT: N/A</span>;
  } else if (gasReadings) {
    const lel = typeof gasReadings.lelPercent === 'number' ? gasReadings.lelPercent : 0;
    const o2 = typeof gasReadings.o2Percent === 'number' ? gasReadings.o2Percent : 20.9;
    const isLelAlert = lel > 0;
    const isO2Alert = o2 < 19.5 || o2 > 23.5;
    gasDisplay = (
      <span className="shrink-0">
        LEL <strong className={isLelAlert ? 'text-rose-700 font-bold' : 'text-emerald-800'}>{lel.toFixed(1)}%</strong>{' '}
        O2 <strong className={isO2Alert ? 'text-rose-700 font-bold' : 'text-emerald-800'}>{o2.toFixed(1)}%</strong>
      </span>
    );
  } else {
    gasDisplay = <span className="text-slate-500">AGT: N/A</span>;
  }

  let fwDisplay: React.ReactNode;
  if (isFireWatchApplicable(permit.type)) {
    const fwAssigned = checklist?.fireWatchAssigned;
    fwDisplay = (
      <span className={`shrink-0 ${fwAssigned ? 'text-emerald-800 font-bold' : 'text-rose-700 font-bold'}`}>
        FW: {fwAssigned ? 'YES' : 'NO'}
      </span>
    );
  } else {
    fwDisplay = <span className="text-slate-400 shrink-0">FW: N/A</span>;
  }

  return (
    <div
      onClick={() => onSelect(permit.id)}
      className={`px-2.5 py-1.5 border border-neutral-300 rounded-none cursor-pointer font-mono text-xs leading-normal select-none transition-none ${
        isSelected
          ? 'border-l-4 border-l-[#0B192C] bg-neutral-100'
          : 'bg-white hover:bg-neutral-50'
      }`}
    >
      {/* Row 1: [Type Badge] {equipmentTag} | {title} ------------------ [{status} Badge] */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span
            className={`px-1 py-0.2 rounded-none font-bold text-[10px] shrink-0 ${formDef?.colorBg || 'bg-slate-100'} ${formDef?.colorText || 'text-slate-800'} border ${formDef?.borderColor || 'border-slate-400'}`}
          >
            [{permit.type.replace(/_/g, ' ')}]
          </span>
          <span className="font-bold text-slate-900 shrink-0">{equipmentTag}</span>
          <span className="text-neutral-400 shrink-0">|</span>
          <span className="text-slate-800 truncate" title={permit.title}>
            {permit.title}
          </span>
        </div>
        <span
          className={`px-1.5 py-0.2 rounded-none text-[10px] font-bold shrink-0 ml-2 ${STATUS_BADGE_CLASS[permit.status]}`}
        >
          [{permit.status}]
        </span>
      </div>

      {/* Row 2: {permitId} | {workLeaderName} ({department || 'OPS'}) | {gasDisplay} {fwDisplay} */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 mt-0.5">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="font-semibold text-blue-950 shrink-0">{permit.id}</span>
          <span className="text-neutral-300 shrink-0">|</span>
          <span className="truncate text-slate-700">
            {permit.workLeaderName} <span className="text-slate-500">({department})</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-slate-700">
          <span className="text-neutral-300">|</span>
          {gasDisplay}
          {fwDisplay}
        </div>
      </div>
    </div>
  );
}
