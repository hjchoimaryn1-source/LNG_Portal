// src/components/manpower/modals/ptw/StageOneSummaryFlags.tsx
"use client";

import React from 'react';

export interface StageOneSummaryFlagsProps {
  isHighRisk: boolean;
  isGasRequired: boolean;
}

export default function StageOneSummaryFlags({ isHighRisk, isGasRequired }: StageOneSummaryFlagsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200">
        <span className="font-semibold text-slate-700">High-Risk Activity:</span>
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded ${
            isHighRisk ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}
        >
          {isHighRisk ? 'YES (High Risk)' : 'NO (Standard Risk)'}
        </span>
      </div>

      <div className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200">
        <span className="font-semibold text-slate-700">Gas Test Required:</span>
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded ${
            isGasRequired ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-300'
          }`}
        >
          {isGasRequired ? 'YES' : 'N/A'}
        </span>
      </div>
    </div>
  );
}
