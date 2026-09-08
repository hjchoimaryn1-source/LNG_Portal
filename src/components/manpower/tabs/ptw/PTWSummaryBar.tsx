// src/components/manpower/tabs/ptw/PTWSummaryBar.tsx
"use client";

import React from 'react';
import { FileText, PlusCircle, Ship, ShieldAlert, ShieldCheck } from 'lucide-react';

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
    <div className="bg-[#e9e6df] border border-slate-400 p-2.5 flex items-center justify-between gap-3 flex-wrap text-xs shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <FileText className="w-4 h-4 text-blue-900" />
          <span className="text-sm">PTW Master Register (SOP NP07-10 ~ NP07-15)</span>
        </div>
        <span className="bg-blue-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
          {totalPermits} Permits Registered
        </span>
        <span className="bg-emerald-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
          {activeCount} Active on Site
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {!isERTMet ? (
          <div className="flex items-center gap-1.5 bg-rose-100 border border-rose-400 text-rose-950 px-2.5 py-1 rounded font-bold text-[11px] animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            <span>[ERT DEFICIT] Hot Work / Confined Space Activation Suspended</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-400 text-emerald-950 px-2.5 py-1 rounded font-bold text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>ERT Manning Verified (19 Direct Staff Cleared)</span>
          </div>
        )}

        <button
          onClick={onOpenNewPermitModal}
          className="win-btn px-3 py-1 text-xs font-bold bg-blue-900 text-white hover:bg-blue-950 flex items-center gap-1.5 cursor-pointer shadow"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
          <span>+ Issue New PTW Form</span>
        </button>

        <button
          onClick={onOpenCargoHandlingModal}
          className="win-btn px-3 py-1 text-xs font-bold bg-cyan-800 text-white hover:bg-cyan-900 flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Ship className="w-3.5 h-3.5 text-amber-300" />
          <span>+ Cargo Handling PTW</span>
        </button>
      </div>
    </div>
  );
}
