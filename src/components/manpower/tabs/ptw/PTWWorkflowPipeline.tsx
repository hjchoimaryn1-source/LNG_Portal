// src/components/manpower/tabs/ptw/PTWWorkflowPipeline.tsx
"use client";

import React from 'react';
import { PTWWorkflowStatus } from '../../../../types/lng';

const STAGES: { key: PTWWorkflowStatus; label: string }[] = [
  { key: 'DRAFT', label: '1. DRAFT' },
  { key: 'PREPARED', label: '2. PREPARED' },
  { key: 'APPROVED', label: '3. APPROVED' },
  { key: 'ACTIVE', label: '4. ACTIVE' },
  { key: 'CLOSED', label: '5. CLOSED' },
];

export interface PTWWorkflowPipelineProps {
  currentStatus: PTWWorkflowStatus;
}

export default function PTWWorkflowPipeline({ currentStatus }: PTWWorkflowPipelineProps) {
  const stageIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="border border-neutral-300 bg-white p-2 rounded-none">
      <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs font-bold">
        {STAGES.map((stage, idx) => {
          const isCurrent = currentStatus === stage.key;
          const isPassed = stageIndex > idx;

          return (
            <div
              key={stage.key}
              className={`py-1 px-0.5 rounded-none select-none ${
                isCurrent
                  ? 'bg-[#2A3B4C] text-white font-mono text-xs font-bold border border-neutral-600'
                  : isPassed
                  ? 'bg-neutral-300 text-neutral-800 border border-neutral-400 font-bold'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-300 font-bold'
              }`}
            >
              {stage.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
