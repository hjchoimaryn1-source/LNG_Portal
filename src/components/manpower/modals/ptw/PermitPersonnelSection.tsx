// src/components/manpower/modals/ptw/PermitPersonnelSection.tsx
"use client";

import React from 'react';
import { PTWType, StaffPersonnel } from '../../../../types/lng';
import { validatePTWWorkerEligibility } from '../../../../data/ptwMasterData';
import WorkforcePillPicker from './WorkforcePillPicker';

export interface PermitPersonnelSectionProps {
  originatorLabel: string;
  personnelList: StaffPersonnel[];
  permitType: Exclude<PTWType, 'CARGO_HANDLING'>;
  workLeaderId: string;
  onWorkLeaderChange: (id: string) => void;
  assignedWorkerIds: string[];
  onToggleWorker: (id: string) => void;
}

export default function PermitPersonnelSection({
  originatorLabel,
  personnelList,
  permitType,
  workLeaderId,
  onWorkLeaderChange,
  assignedWorkerIds,
  onToggleWorker,
}: PermitPersonnelSectionProps) {
  return (
    <div className="space-y-4">
      {/* Originator — Read-Only */}
      <div className="space-y-1.5">
        <label className="block font-bold text-slate-800">
          Originator / Applicant
          <span className="text-xs font-normal text-slate-500 ml-1.5">(Read-Only — Auto-filled from session)</span>
        </label>
        <div className="w-full h-10 px-3.5 flex items-center border border-slate-200 rounded-md bg-slate-50 text-slate-600 font-medium text-sm select-none">
          {originatorLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Work Leader */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-800">Work Leader</label>
          <select
            value={workLeaderId}
            onChange={(e) => onWorkLeaderChange(e.target.value)}
            className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white cursor-pointer shadow-sm"
          >
            {personnelList.map((m) => {
              const check = validatePTWWorkerEligibility(m, permitType);
              return (
                <option key={m.id} value={m.id} disabled={!check.isEligible}>
                  {m.name} ({m.role}) {!check.isEligible ? `[⚠️ Ineligible: ${check.reason}]` : '✓ Qualified'}
                </option>
              );
            })}
          </select>
        </div>

        {/* Assigned Workforce — Pill Picker */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-800">Assigned Workforce (PJSM Participants)</label>
          <WorkforcePillPicker
            personnelList={personnelList}
            permitType={permitType}
            selectedIds={assignedWorkerIds}
            onToggle={onToggleWorker}
          />
        </div>
      </div>
    </div>
  );
}
