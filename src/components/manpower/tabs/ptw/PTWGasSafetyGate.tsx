// src/components/manpower/tabs/ptw/PTWGasSafetyGate.tsx
"use client";

import React from 'react';
import { PTWPermit } from '../../../../types/lng';

export interface PTWGasSafetyGateProps {
  activePermit: PTWPermit;
  isSafe: boolean;
  blockReason: string | null;
  onUpdateGasReadings: (permitId: string, lel: number, o2: number) => void;
}

export default function PTWGasSafetyGate({ activePermit, isSafe, blockReason }: PTWGasSafetyGateProps) {
  const lelVal = activePermit.gasReadings.lelPercent.toFixed(1);
  const o2Val = activePermit.gasReadings.o2Percent.toFixed(1);

  return (
    <div className="p-2 border border-neutral-400 bg-[#d4d0c8] rounded-none space-y-1.5 font-mono">
      <div className="text-[11px] font-bold text-slate-800 flex justify-between items-center">
        <span>AGT GAS TESTING INSTRUMENT MONITOR</span>
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded-none border ${
            isSafe
              ? 'bg-neutral-900 text-green-400 border-green-700'
              : 'bg-neutral-900 text-red-500 border-red-700'
          }`}
        >
          {isSafe ? 'ATMOSPHERE SAFE' : 'ATMOSPHERIC HAZARD BLOCKED'}
        </span>
      </div>

      {!isSafe && blockReason && (
        <div className="p-1 bg-red-900 text-white text-[10px] font-bold border border-red-950 rounded-none">
          ALARM: {blockReason}
        </div>
      )}

      {/* Digital Instrumentation Panel */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* LEL Display */}
        <div className="bg-neutral-900 p-2.5 border border-neutral-700 rounded-none">
          <div className="text-[10px] text-neutral-400 font-bold tracking-wider">CH4 / LEL SENSOR</div>
          <div className="text-xl font-bold font-mono tracking-wider mt-0.5">
            LEL: <span className={activePermit.gasReadings.lelPercent > 0 ? 'text-red-400' : 'text-green-400'}>{lelVal}%</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">STATUS: {activePermit.gasReadings.lelPercent > 0 ? 'ELEVATED' : '0.0% NOMINAL'}</div>
        </div>

        {/* O2 Display */}
        <div className="bg-neutral-900 p-2.5 border border-neutral-700 rounded-none">
          <div className="text-[10px] text-neutral-400 font-bold tracking-wider">OXYGEN (O2) SENSOR</div>
          <div className="text-xl font-bold font-mono tracking-wider mt-0.5">
            O2: <span className={activePermit.gasReadings.o2Percent < 19.5 || activePermit.gasReadings.o2Percent > 23.5 ? 'text-red-400' : 'text-green-400'}>{o2Val}%</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">
            STATUS: {activePermit.gasReadings.o2Percent >= 19.5 && activePermit.gasReadings.o2Percent <= 23.5 ? '20.9% NOMINAL' : 'OUT OF SPEC'}
          </div>
        </div>
      </div>
    </div>
  );
}
