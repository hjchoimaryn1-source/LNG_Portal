// src/components/manpower/tabs/ptw/PTWGasSafetyGate.tsx
"use client";

import React from 'react';
import { Activity } from 'lucide-react';
import { PTWPermit } from '../../../../types/lng';

export interface PTWGasSafetyGateProps {
  activePermit: PTWPermit;
  isSafe: boolean;
  blockReason: string | null;
  onUpdateGasReadings: (permitId: string, lel: number, o2: number) => void;
}

export default function PTWGasSafetyGate({ activePermit, isSafe, blockReason, onUpdateGasReadings }: PTWGasSafetyGateProps) {
  return (
    <div className={`p-3 border-2 rounded ${isSafe ? 'bg-emerald-50/50 border-emerald-400' : 'bg-red-50/80 border-red-500'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
          <Activity className="w-4 h-4 text-cyan-700" />
          <span>Authorized Gas Tester (AGT) Real-Time Verification Gate</span>
        </span>
        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${isSafe ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white animate-pulse'}`}>
          {isSafe ? '✓ ATMOSPHERE SAFE' : '⚠️ ATMOSPHERIC HAZARD BLOCKED'}
        </span>
      </div>

      {!isSafe && (
        <div className="mb-2 p-2 bg-red-100 border border-red-400 rounded text-red-950 text-xs font-bold">
          {blockReason}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        {/* LEL Control */}
        <div className="bg-white p-2 border border-slate-300 rounded">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-800">LEL (Hydrocarbon Gas):</span>
            <span className={`font-black text-sm ${activePermit.gasReadings.lelPercent > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {activePermit.gasReadings.lelPercent.toFixed(1)}% LEL
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={activePermit.gasReadings.lelPercent}
            onChange={(e) => onUpdateGasReadings(activePermit.id, parseFloat(e.target.value), activePermit.gasReadings.o2Percent)}
            className="w-full cursor-pointer accent-blue-900"
          />
          <div className="text-[9px] text-slate-500 mt-1">
            {activePermit.type === 'HOT_WORK' ? '⚠️ Hot Work Mandate: LEL MUST BE 0.0%' : 'Max Allowed: 5% LEL'}
          </div>
        </div>

        {/* O2 Control */}
        <div className="bg-white p-2 border border-slate-300 rounded">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-800">Oxygen (O2):</span>
            <span className={`font-black text-sm ${activePermit.gasReadings.o2Percent < 19.5 || activePermit.gasReadings.o2Percent > 23.5 ? 'text-red-700' : 'text-emerald-700'}`}>
              {activePermit.gasReadings.o2Percent.toFixed(1)}% O2
            </span>
          </div>
          <input
            type="range"
            min="16.0"
            max="24.5"
            step="0.1"
            value={activePermit.gasReadings.o2Percent}
            onChange={(e) => onUpdateGasReadings(activePermit.id, activePermit.gasReadings.lelPercent, parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-blue-900"
          />
          <div className="text-[9px] text-slate-500 mt-1">
            Safe Band: 19.5% ~ 23.5% (Asphyxiation & O2 Enrichment Prevention)
          </div>
        </div>
      </div>
    </div>
  );
}
