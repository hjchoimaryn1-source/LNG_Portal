// src/components/manpower/tabs/ptw/PTWSafetyChecklist.tsx
"use client";

import React from 'react';
import { CheckSquare } from 'lucide-react';
import { PTWPermit } from '../../../../types/lng';

export interface PTWSafetyChecklistProps {
  checklist: PTWPermit['safetyChecklist'];
}

const CHECKLIST_LABELS: { key: keyof PTWPermit['safetyChecklist']; label: string }[] = [
  { key: 'fireWatchAssigned', label: 'Fire Watch Designated' },
  { key: 'gasDetectorContinuous', label: 'Continuous Gas Monitor' },
  { key: 'lotoApplied', label: 'LOTO Padlocks Applied' },
  { key: 'forcedVentilation', label: 'Forced Ventilation Active' },
  { key: 'ppeVerified', label: 'Cryo / Special PPE' },
  { key: 'barricadeSet', label: 'Area Barricade Set' },
];

export default function PTWSafetyChecklist({ checklist }: PTWSafetyChecklistProps) {
  return (
    <div className="p-2 border border-slate-300 bg-slate-50 rounded text-[11px]">
      <div className="font-bold text-slate-800 mb-1.5 font-mono">Mandatory Safety Controls Verification:</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]">
        {CHECKLIST_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className={`p-1 rounded border flex items-center gap-1 ${
              checklist[key] ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <CheckSquare className="w-3 h-3" /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}
