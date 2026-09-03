"use client";

import { AlertOctagon, ShieldAlert } from 'lucide-react';

export interface TeamShortageModalProps {
  message: string | null;
  onClose: () => void;
}

export default function TeamShortageModal({ message, onClose }: TeamShortageModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="win-panel p-5 max-w-md w-full bg-white shadow-2xl border-2 border-red-700 text-slate-900 font-sans rounded-xs">
        <div className="bg-red-800 text-white p-2 px-3 flex justify-between items-center mb-3">
          <span className="font-bold text-xs flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-300" />
            <span>[CONSTRAINT GUARDRAIL: Team Shortage Alert]</span>
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold px-2 py-0.5 bg-red-950 hover:bg-red-900 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs p-1">
          <div className="bg-red-50 p-3 border border-red-300 text-red-950 rounded-xs space-y-1.5">
            <div className="font-bold text-sm text-red-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
              <span>동일 팀 내 다중 결원 발생 (2+ Members Off-Duty)</span>
            </div>
            <div className="text-[11px] leading-relaxed">{message}</div>
          </div>

          <div className="text-[10px] text-slate-600 bg-slate-100 p-2 border border-slate-300 rounded-xs">
            <strong>SOP Standard NP07-03:</strong> An operating shift team must maintain a minimum complement of certified personnel. Immediate standby pool relief deployment is mandatory.
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button
              onClick={onClose}
              className="win-btn px-4 py-1 text-xs font-bold cursor-pointer bg-red-800 text-white hover:bg-red-900"
            >
              Acknowledge &amp; Assign Relief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
