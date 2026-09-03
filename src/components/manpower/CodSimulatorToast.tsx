// src/components/manpower/CodSimulatorToast.tsx
"use client";

import React from 'react';
import { Zap } from 'lucide-react';

interface CodSimulatorToastProps {
  message: string;
  onDismiss: () => void;
}

/**
 * 5-M: COD Simulator & 3:1 Roster Engine Toast Banner.
 * Appears fixed at the bottom-centre of the screen with an animated entry.
 */
export default function CodSimulatorToast({ message, onDismiss }: CodSimulatorToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white p-3 px-4 rounded-md shadow-2xl border-2 border-sky-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200 select-none">
      <Zap className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
      <div>
        <div className="font-bold text-sky-200">COD Simulator &amp; 3:1 Roster Engine</div>
        <div className="text-slate-300 text-[11px]">{message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-white font-bold text-xs cursor-pointer border border-slate-600"
      >
        OK
      </button>
    </div>
  );
}
