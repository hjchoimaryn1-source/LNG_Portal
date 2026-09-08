// src/components/manpower/tabs/ptw/PTWWorkflowPipeline.tsx
"use client";

import React from 'react';
import { PTWWorkflowStatus } from '../../../../types/lng';

const STAGES: PTWWorkflowStatus[] = ['DRAFT', 'PREPARED', 'APPROVED', 'ACTIVE', 'CLOSED'];

export interface PTWWorkflowPipelineProps {
  currentStatus: PTWWorkflowStatus;
}

export default function PTWWorkflowPipeline({ currentStatus }: PTWWorkflowPipelineProps) {
  const stageIndex = STAGES.indexOf(currentStatus);

  return (
    <div className="bg-slate-100 p-2 border border-slate-300 rounded">
      <div className="text-[10px] font-bold text-slate-600 mb-1.5 uppercase font-mono">
        SOP 5-Stage Approval & Life-Cycle Pipeline:
      </div>
      <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
        {STAGES.map((stage, idx) => {
          const isCurrent = currentStatus === stage;
          const isPassed = stageIndex > idx;

          return (
            <div
              key={stage}
              className={`p-1.5 border rounded font-bold ${
                isCurrent
                  ? 'bg-blue-900 text-white border-blue-950 shadow ring-1 ring-blue-500'
                  : isPassed
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              <div>{idx + 1}. {stage}</div>
              <div className="text-[8px] font-normal mt-0.5">
                {isCurrent ? 'Current' : isPassed ? '✓ Complete' : 'Pending'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
