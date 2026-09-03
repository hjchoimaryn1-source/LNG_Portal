"use client";

import { Lock, ShieldAlert } from 'lucide-react';

export interface PastDateLock {
  dateStr: string;
  staffName: string;
  isConfirmedToday?: boolean;
}

export interface PastDateLockModalProps {
  lock: PastDateLock | null;
  onClose: () => void;
}

export default function PastDateLockModal({ lock, onClose }: PastDateLockModalProps) {
  if (!lock) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="win-panel p-4 max-w-lg w-full bg-white shadow-2xl border-2 border-slate-700 text-slate-900 rounded-lg overflow-hidden font-sans">
        <div className="win-titlebar bg-slate-800 text-white p-2 px-3 flex justify-between items-center mb-3">
          <span className="font-bold text-sm sm:text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-300" />
            [RECORD LOCKED: Read-Only Historical Shift]
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold px-2 py-0.5 bg-slate-600 hover:bg-slate-700 rounded text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm font-mono p-2">
          <div className="bg-slate-50 p-3.5 border border-slate-300 text-slate-900 space-y-2 rounded">
            <div className="font-bold text-sm sm:text-base text-blue-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Historical Record Locked (소급 수정 불가)</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-700">
              Target: <strong>{lock.staffName}</strong> ({lock.dateStr})
            </div>
            <div className="text-xs sm:text-sm text-red-900 bg-red-50 p-2.5 border border-red-200 rounded leading-relaxed">
              과거 근무 실적은 Daily Shift Board에 의해 잠금(Locked) 처리되었습니다. 소급 수정은 관리자(HQ Admin) 승인이 필요합니다.
            </div>
          </div>

          <div className="bg-slate-100 p-2.5 border border-slate-300 text-[11px] text-slate-600 leading-normal rounded">
            <strong>Audit Compliance:</strong> Closed operational logs are permanently archived in the terminal ledger. Any alteration requires an official management change request (MOC) and HQ approval.
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button
              onClick={onClose}
              className="win-btn px-5 py-2 text-xs sm:text-sm font-bold cursor-pointer bg-slate-800 text-white hover:bg-slate-900 rounded"
            >
              확인 (Acknowledge)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
