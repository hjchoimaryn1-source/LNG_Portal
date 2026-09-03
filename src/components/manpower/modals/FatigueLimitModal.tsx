"use client";

import { AlertOctagon } from 'lucide-react';

export interface FatigueAlert {
  staffName: string;
  dayNum: number;
  violationReason: string;
}

export interface FatigueLimitModalProps {
  alert: FatigueAlert | null;
  onClose: () => void;
}

export default function FatigueLimitModal({ alert, onClose }: FatigueLimitModalProps) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="win-panel p-3 max-w-md w-full bg-white shadow-2xl border-2 border-red-700 text-slate-900 font-sans">
        <div className="win-titlebar bg-red-800 text-white p-1 px-2 flex justify-between items-center mb-2">
          <span className="font-bold text-xs flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-yellow-300" />
            [FATIGUE LIMIT EXCEEDED - Maximum 7 Consecutive Nights]
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold px-1.5 py-0.2 bg-red-600 hover:bg-red-700 text-[10px]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="bg-red-50 p-2 border border-red-300 text-red-950 space-y-1">
            <div className="font-bold text-sm">Hard-Lock Intervention Activated:</div>
            <div>Staff: <strong>{alert.staffName}</strong> (Day {alert.dayNum})</div>
            <div className="text-[11px] text-red-900 pt-1">{alert.violationReason}</div>
          </div>

          <div className="bg-slate-100 p-2 border border-slate-300 text-[10px] text-slate-700">
            <strong>Statutory Regulation:</strong> Under SKK Migas & Indonesian Labor Law, consecutive night shift duty is strictly capped at 7 consecutive cycles without a mandatory 48-hour rest break to prevent cryogenic operational fatigue incidents.
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
            <button
              onClick={onClose}
              className="win-btn px-4 py-1 text-xs font-bold cursor-pointer bg-red-800 text-white hover:bg-red-900"
            >
              Acknowledge & Revert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
