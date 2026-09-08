// src/components/manpower/tabs/ptw/PTWCompetencyGate.tsx
"use client";

import React from 'react';
import { UserCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
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
    <div className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
      <div className="font-bold text-slate-900 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-blue-900" />
          <span>Worker & Work Leader Competency Gatekeeper</span>
        </span>
        <span className="text-[10px] text-blue-900 font-mono underline cursor-pointer" onClick={() => onNavigateToMatrix && onNavigateToMatrix(activePermit.workLeaderId)}>
          View in Training Matrix ➔
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
        {/* Work Leader Verification */}
        <div className="bg-white p-2 border border-slate-300 rounded">
          <div className="text-[10px] text-slate-500 font-bold">WORK LEADER:</div>
          <div className="font-bold text-slate-900">{activePermit.workLeaderName} ({activePermit.workLeaderId})</div>
          <div className="mt-1 flex items-center gap-1 text-[10px]">
            {leaderStatus?.isEligible ? (
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> MCU Valid & PTW Certified
              </span>
            ) : (
              <span className="text-rose-700 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> {leaderStatus?.reason}
              </span>
            )}
          </div>
        </div>

        {/* Assigned Workers Verification */}
        <div className="bg-white p-2 border border-slate-300 rounded">
          <div className="text-[10px] text-slate-500 font-bold">ASSIGNED WORKERS ({activePermit.assignedWorkerNames.length}):</div>
          <div className="font-bold text-slate-900">{activePermit.assignedWorkerNames.join(', ')}</div>
          <div className="mt-1 flex items-center gap-1 text-[10px]">
            {allWorkersValid ? (
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> All Workers Medically Cleared
              </span>
            ) : (
              <span className="text-rose-700 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Worker Certification Attention Required
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
