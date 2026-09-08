// src/components/manpower/tabs/ptw/PTWSafetyChecklist.tsx
"use client";

import React from 'react';
import { PTWPermit } from '../../../../types/lng';

export interface PTWSafetyChecklistProps {
  checklist: PTWPermit['safetyChecklist'];
}

const CHECKLIST_LABELS: { key: keyof PTWPermit['safetyChecklist']; label: string }[] = [
  { key: 'fireWatchAssigned', label: 'FIRE WATCH' },
  { key: 'gasDetectorContinuous', label: 'GAS MONITOR' },
  { key: 'lotoApplied', label: 'LOTO ISOLATION' },
  { key: 'forcedVentilation', label: 'VENTILATION' },
  { key: 'ppeVerified', label: 'CRYO / PPE' },
  { key: 'barricadeSet', label: 'BARRICADE' },
];

export default function PTWSafetyChecklist({ checklist }: PTWSafetyChecklistProps) {
  return (
    <div className="border border-neutral-300 bg-[#ebe7df] p-2 rounded-none text-[11px] font-mono space-y-1.5">
      <div className="bg-[#2A3B4C] text-white font-mono text-sm font-bold text-center py-1 px-2 border border-[#2A3B4C] rounded-none">
        MANDATORY SAFETY CONTROLS
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
        {CHECKLIST_LABELS.map(({ key, label }) => {
          const isApplied = checklist[key];
          return (
            <div
              key={key}
              className={`px-2 py-1.5 border rounded-none flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] ${
                isApplied
                  ? 'border-neutral-400 bg-[#d8d4cc] text-blue-950 font-bold'
                  : 'border-neutral-300 bg-neutral-100 text-slate-400'
              }`}
            >
              <span>{label}</span>
              <span className="font-bold">[{isApplied ? 'YES' : 'NO'}]</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
