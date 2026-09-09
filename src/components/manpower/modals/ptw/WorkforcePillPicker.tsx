// src/components/manpower/modals/ptw/WorkforcePillPicker.tsx
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { StaffPersonnel, PTWType } from '../../../../types/lng';
import { validatePTWWorkerEligibility } from '../../../../data/ptwMasterData';

interface WorkforcePillPickerProps {
  personnelList: StaffPersonnel[];
  permitType: PTWType;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function WorkforcePillPicker({
  personnelList,
  permitType,
  selectedIds,
  onToggle,
}: WorkforcePillPickerProps) {
  const selectedMembers = personnelList.filter((m) => selectedIds.includes(m.id));
  const availableMembers = personnelList.filter((m) => !selectedIds.includes(m.id));

  return (
    <div className="space-y-2">
      {/* Selected pills */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 min-h-[40px] bg-blue-50 border border-blue-200 rounded-md">
          {selectedMembers.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-900 text-white rounded-full shadow-sm"
            >
              {m.name}
              <button
                type="button"
                onClick={() => onToggle(m.id)}
                className="ml-0.5 hover:text-red-300 transition-colors cursor-pointer"
                title={`Remove ${m.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown to add members */}
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onToggle(e.target.value);
        }}
        className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white cursor-pointer shadow-sm text-slate-700"
      >
        <option value="">
          {availableMembers.length === 0
            ? '— All eligible members selected —'
            : '+ Add workforce member…'}
        </option>
        {availableMembers.map((m) => {
          const check = validatePTWWorkerEligibility(m, permitType);
          return (
            <option key={m.id} value={m.id} disabled={!check.isEligible}>
              {m.name} ({m.role}) {check.isEligible ? '✓ Qualified' : `⚠️ ${check.reason}`}
            </option>
          );
        })}
      </select>

      {selectedMembers.length === 0 && (
        <p className="text-[11px] text-slate-400">No workforce members assigned yet.</p>
      )}
    </div>
  );
}
