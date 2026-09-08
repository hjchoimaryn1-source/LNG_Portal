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
    <div className="p-2 border border-neutral-300 bg-[#d4d0c8] rounded-none space-y-1.5 font-mono text-xs">
      <div className="font-bold text-slate-900 flex items-center justify-between text-[11px]">
        <span>PERSONNEL COMPETENCY DISPATCH GATE</span>
        <button
          type="button"
          className="text-[10px] font-bold text-blue-950 bg-neutral-200 border border-neutral-400 px-1.5 py-0.5 rounded-none hover:bg-neutral-300 cursor-pointer"
          onClick={() => onNavigateToMatrix && onNavigateToMatrix(activePermit.workLeaderId)}
        >
          [TRAINING MATRIX]
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
        {/* Work Leader Verification */}
        <div className="bg-white p-1.5 border border-neutral-300 rounded-none">
          <div className="flex justify-between items-center">
            <span>LEADER: <strong>{activePermit.workLeaderName}</strong></span>
            <span className={`text-[10px] font-bold px-1 rounded-none ${leaderStatus?.isEligible ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              [{leaderStatus?.isEligible ? 'MCU OK' : 'DEFICIT'}]
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">ID: {activePermit.workLeaderId}</div>
        </div>

        {/* Assigned Workers Verification */}
        <div className="bg-white p-1.5 border border-neutral-300 rounded-none">
          <div className="flex justify-between items-center">
            <span>WORKERS: <strong>{activePermit.assignedWorkerNames.length} CLEARED</strong></span>
            <span className={`text-[10px] font-bold px-1 rounded-none ${allWorkersValid ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              [{allWorkersValid ? 'ALL CLEARED' : 'ATTN REQ'}]
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={activePermit.assignedWorkerNames.join(', ')}>
            NAMES: {activePermit.assignedWorkerNames.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}
