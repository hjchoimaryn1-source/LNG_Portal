// src/components/manpower/tabs/ptw/PTWSummaryBar.tsx
"use client";

import React from 'react';

export interface PTWSummaryBarProps {
  totalPermits: number;
  activeCount: number;
  isERTMet: boolean;
  onOpenNewPermitModal: () => void;
  onOpenCargoHandlingModal: () => void;
}

export default function PTWSummaryBar({
  totalPermits,
  activeCount,
  isERTMet,
  onOpenNewPermitModal,
  onOpenCargoHandlingModal,
}: PTWSummaryBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap text-xs bg-[#d4d0c8] border border-t-white border-l-white border-b-neutral-500 border-r-neutral-500 shadow-sm p-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="font-bold text-slate-900">
          <span className="text-sm">PERMIT TO WORK</span>
        </div>
        <span className="bg-blue-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
          TOTAL: {totalPermits}
        </span>
        <span className="bg-emerald-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
          ACTIVE: {activeCount}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {!isERTMet ? (
          <div className="ptw-raised-static bg-rose-100 border border-rose-400 text-rose-950 px-2.5 py-1 rounded-none font-mono font-bold text-[11px]">
            ERT STATUS: DEFICIT — HOT WORK / CONFINED SPACE SUSPENDED
          </div>
        ) : (
          <div className="ptw-raised-static bg-emerald-100 border border-emerald-400 text-emerald-950 px-2.5 py-1 rounded-none font-mono font-bold text-[11px]">
            ERT STATUS: NORMAL (12 POB)
          </div>
        )}

        <button
          onClick={onOpenNewPermitModal}
          className="win-btn px-2.5 py-1 text-xs font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer"
        >
          + ISSUE PTW
        </button>

        <button
          onClick={onOpenCargoHandlingModal}
          className="win-btn px-2.5 py-1 text-xs font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer"
        >
          + CARGO PTW
        </button>
      </div>
    </div>
  );
}
