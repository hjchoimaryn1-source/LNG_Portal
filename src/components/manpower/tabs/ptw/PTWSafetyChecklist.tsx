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
    <div className="p-2 border border-neutral-300 bg-[#d4d0c8] rounded-none text-[11px] font-mono">
      <div className="font-bold text-slate-900 mb-1.5 text-[11px]">MANDATORY SAFETY CONTROLS VERIFICATION:</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
        {CHECKLIST_LABELS.map(({ key, label }) => {
          const isApplied = checklist[key];
          return (
            <div
              key={key}
              className={`px-2 py-1 border rounded-none flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ${
                isApplied
                  ? 'border-t-neutral-600 border-l-neutral-600 border-b-white border-r-white bg-[#c8c4bc] text-blue-950 font-bold'
                  : 'border-t-neutral-400 border-l-neutral-400 border-b-white border-r-white bg-[#d4d0c8] text-slate-500 opacity-60'
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
