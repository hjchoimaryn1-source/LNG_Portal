"use client";

import { Lock, ShieldAlert } from 'lucide-react';
import type { StaffPersonnel } from '../../../types/lng';

export interface FitToWorkOverrideModalProps {
  isOpen: boolean;
  exceeded154hPersonnel: StaffPersonnel[];
  fitToWorkVitalsChecked: boolean;
  fitToWorkRestChecked: boolean;
  fitToWorkDrugsChecked: boolean;
  fitToWorkHsseOfficer: string;
  fitToWorkReason: string;
  onVitalsCheckedChange: (checked: boolean) => void;
  onRestCheckedChange: (checked: boolean) => void;
  onDrugsCheckedChange: (checked: boolean) => void;
  onHsseOfficerChange: (officer: string) => void;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onAuthorizeOverride: () => void;
}

export default function FitToWorkOverrideModal({
  isOpen,
  exceeded154hPersonnel,
  fitToWorkVitalsChecked,
  fitToWorkRestChecked,
  fitToWorkDrugsChecked,
  fitToWorkHsseOfficer,
  fitToWorkReason,
  onVitalsCheckedChange,
  onRestCheckedChange,
  onDrugsCheckedChange,
  onHsseOfficerChange,
  onReasonChange,
  onClose,
  onAuthorizeOverride,
}: FitToWorkOverrideModalProps) {
  if (!isOpen) return null;

  const isChecklistComplete = fitToWorkVitalsChecked && fitToWorkRestChecked && fitToWorkDrugsChecked;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="win-panel p-0 max-w-xl w-full bg-[#d4d0c8] shadow-2xl border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-slate-900 font-sans">
        <div className="bg-[#183b6b] text-white p-2 px-3 flex justify-between items-center border-b-2 border-slate-700">
          <span className="font-extrabold text-xs flex items-center gap-1.5 text-white tracking-wide">
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>[ESDM / IMO STCW COMPLIANCE: Fit-to-Work Site Manager Override]</span>
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold px-2 py-0.5 bg-red-900 hover:bg-red-800 text-xs cursor-pointer border border-red-950"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="win-sunken bg-slate-900 text-sky-300 p-2.5 border border-slate-700 space-y-1">
            <div className="flex justify-between items-center text-[10.5px] text-slate-300">
              <span className="font-bold">Subject Personnel (154h Statutory Exemption):</span>
              <span className="text-amber-400 font-extrabold uppercase">SKK Migas SOP-NP07-03 Sec 4.2</span>
            </div>
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <span className="text-amber-300">▶</span>
              <span>
                {exceeded154hPersonnel.length > 0
                  ? exceeded154hPersonnel.map((staff) => `${staff.name} (${staff.role || 'Operator'})`).join(', ')
                  : 'Danang (Field Operator), Uliyansyah (DCS Control Tech)'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Authority: ESDM SKK Migas Emergency Island Manning &amp; IMO STCW 2010 Rest Hours Exemption Clause
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <span>■</span>
              <span>MANDATORY FIT-TO-WORK VERIFICATION CHECKLIST:</span>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-100 p-2.5 border border-slate-300 rounded-xs">
              <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={fitToWorkVitalsChecked}
                  onChange={(event) => onVitalsCheckedChange(event.target.checked)}
                  className="mt-0.5 w-4 h-4 cursor-pointer accent-blue-900"
                />
                <div>
                  <div>생체 징후 적합 (Vital Signs Normal)</div>
                  <div className="text-[10px] text-slate-600 font-normal">
                    Blood Pressure &lt; 140/90 mmHg, Body Temp &lt; 37.5℃, Resting Pulse 60-95 bpm verified.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={fitToWorkRestChecked}
                  onChange={(event) => onRestCheckedChange(event.target.checked)}
                  className="mt-0.5 w-4 h-4 cursor-pointer accent-blue-900"
                />
                <div>
                  <div>최소 수면 시간 확보 (Rest Hours Compliance)</div>
                  <div className="text-[10px] text-slate-600 font-normal">
                    Confirmed minimum 6 hours continuous undisturbed rest period within past 24 hours.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={fitToWorkDrugsChecked}
                  onChange={(event) => onDrugsCheckedChange(event.target.checked)}
                  className="mt-0.5 w-4 h-4 cursor-pointer accent-blue-900"
                />
                <div>
                  <div>무알코올 / 무약물 적합 (Zero Substance &amp; Fatigue Clearance)</div>
                  <div className="text-[10px] text-slate-600 font-normal">
                    Alcohol Breathalyzer 0.00% verified &amp; zero drowsiness-inducing medication consumed.
                  </div>
                </div>
              </label>

              <div className="pt-1.5 border-t border-slate-300 flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  HSSE Officer 현장 확인관:
                </span>
                <select
                  value={fitToWorkHsseOfficer}
                  onChange={(event) => onHsseOfficerChange(event.target.value)}
                  className="win-sunken bg-white p-1 text-xs font-bold text-slate-900 border border-slate-400 cursor-pointer"
                >
                  <option value="Arsyan AN (HSE Officer)">Arsyan AN (HSE Officer - EMP-015)</option>
                  <option value="Chandra R.D (Sr. HSE Officer / Fire Chief)">Chandra R.D (Sr. HSE Officer / Fire Chief - EMP-016)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-900 text-xs block">
              ■ Override Justification &amp; Operational Rationale:
            </label>
            <textarea
              value={fitToWorkReason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={2}
              className="w-full win-sunken bg-white p-2 text-xs font-mono font-bold text-[#0f172a] border border-slate-400 focus:outline-none"
              placeholder="Enter specific operational justification..."
            />
          </div>

          <div className="win-sunken bg-amber-50 p-2 border border-amber-300 text-amber-950 text-[11px] flex items-center justify-between">
            <div>
              <strong>Authorizing Signatory:</strong> Site Manager Edi Hermawan (EMP-001)
            </div>
            <div className="font-mono font-black text-emerald-900">
              {isChecklistComplete ? 'READY TO SIGN ✓' : 'CHECKLIST INCOMPLETE ✕'}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-300">
            <button
              onClick={onClose}
              className="win-btn px-4 py-1.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              disabled={!isChecklistComplete}
              onClick={onAuthorizeOverride}
              className={`win-btn px-5 py-1.5 text-xs font-mono font-black flex items-center gap-1.5 ${!isChecklistComplete
                ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
                : 'bg-emerald-900 hover:bg-emerald-800 text-white cursor-pointer'
                }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>🔒 Authorize Override &amp; Sign</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
