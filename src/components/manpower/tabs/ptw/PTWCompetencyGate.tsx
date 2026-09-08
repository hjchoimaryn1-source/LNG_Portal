// src/components/manpower/tabs/ptw/PTWCompetencyGate.tsx
"use client";

import React from 'react';
import { PTWPermit, StaffPersonnel } from '../../../../types/lng';
import { validatePTWWorkerEligibility } from '../../../../data/ptwMasterData';

export interface PTWCompetencyGateProps {
  activePermit: PTWPermit;
  personnelList: StaffPersonnel[];
  onNavigateToMatrix?: (empId: string) => void;
}

export default function PTWCompetencyGate({ activePermit, personnelList, onNavigateToMatrix }: PTWCompetencyGateProps) {
  const leader = personnelList.find((s) => s.id === activePermit.workLeaderId);
  const leaderStatus = leader ? validatePTWWorkerEligibility(leader, activePermit.type) : null;

  const workers = personnelList.filter((s) => activePermit.assignedWorkerIds.includes(s.id));
  const allWorkersValid = workers.every((w) => validatePTWWorkerEligibility(w, activePermit.type).isEligible);

  return (
    <div className="border border-neutral-300 bg-[#ebe7df] p-2 rounded-none space-y-2 font-mono text-xs">
      <div className="bg-[#2A3B4C] text-white font-mono text-sm font-bold text-center py-1 px-2 border border-[#2A3B4C] flex justify-between items-center rounded-none">
        <span className="w-24 hidden sm:inline-block" />
        <span className="flex-1 text-center font-bold tracking-wide">
          PERSONNEL COMPETENCY VERIFICATION
        </span>
        <button
          type="button"
          className="text-[10px] font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] border border-[#808080] px-1.5 py-0.5 rounded-none cursor-pointer shrink-0"
          onClick={() => onNavigateToMatrix && onNavigateToMatrix(activePermit.workLeaderId)}
        >
          [TRAINING MATRIX]
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 text-[11px] font-mono">
        {/* Work Leader Verification */}
        <div className="bg-neutral-50 p-2 border border-neutral-300 rounded-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center">
            <span>LEADER: <strong className="text-slate-900">{activePermit.workLeaderName}</strong></span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none border ${leaderStatus?.isEligible ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'}`}>
              [{leaderStatus?.isEligible ? 'MCU OK' : 'DEFICIT'}]
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">ID: {activePermit.workLeaderId}</div>
        </div>

        {/* Assigned Workers Verification */}
        <div className="bg-neutral-50 p-2 border border-neutral-300 rounded-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center">
            <span>WORKERS: <strong className="text-slate-900">{activePermit.assignedWorkerNames.length} CLEARED</strong></span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none border ${allWorkersValid ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'}`}>
              [{allWorkersValid ? 'ALL CLEARED' : 'ATTN REQ'}]
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate" title={activePermit.assignedWorkerNames.join(', ')}>
            NAMES: {activePermit.assignedWorkerNames.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}
