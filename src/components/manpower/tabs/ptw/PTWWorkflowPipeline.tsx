// src/components/manpower/tabs/ptw/PTWWorkflowPipeline.tsx
"use client";

import React from 'react';
import { PTWWorkflowStatus } from '../../../../types/lng';

const STAGES: { key: PTWWorkflowStatus; label: string }[] = [
  { key: 'DRAFT', label: '1.DRAFT' },
  { key: 'PREPARED', label: '2.PREP' },
  { key: 'APPROVED', label: '3.APPR' },
  { key: 'ACTIVE', label: '4.ACTIVE' },
  { key: 'CLOSED', label: '5.CLOSE' },
];

export interface PTWWorkflowPipelineProps {
  currentStatus: PTWWorkflowStatus;
}

export default function PTWWorkflowPipeline({ currentStatus }: PTWWorkflowPipelineProps) {
  const stageIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="bg-[#d4d0c8] p-1.5 border border-neutral-400 rounded-none">
      <div className="grid grid-cols-5 gap-1 text-center font-mono text-[11px]">
        {STAGES.map((stage, idx) => {
          const isCurrent = currentStatus === stage.key;
          const isPassed = stageIndex > idx;

          return (
            <div
              key={stage.key}
              className={`py-1 px-0.5 border rounded-none font-bold select-none ${
                isCurrent
                  ? 'bg-[#0B192C] text-white border-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                  : isPassed
                  ? 'bg-neutral-300 text-neutral-800 border-neutral-400'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
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
