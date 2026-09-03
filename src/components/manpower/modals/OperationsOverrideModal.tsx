"use client";

import { Lock } from 'lucide-react';
import type { StaffPersonnel } from '../../../types/lng';

export type DailyStaffStatus = Record<
  string,
  { status: 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE'; replacementId: string }
>;

export type DailyRestAssignment = {
  reason: string;
  coveringStaffId: string;
  approvedAt: string;
};

export interface ErtSummary {
  icCount: number;
  fireChiefCount: number;
  firstAiderCount: number;
  gasResponseCount: number;
  isICMet: boolean;
  isFireChiefMet: boolean;
  isFirstAiderMet: boolean;
  isGasResponseMet: boolean;
  isAllERTMet: boolean;
}

export interface OperationsOverrideModalProps {
  isOpen: boolean;
  dailyStaffStatus: DailyStaffStatus;
  dailyRestAssignments: Record<string, DailyRestAssignment>;
  manpowerData: StaffPersonnel[];
  ertSummary: ErtSummary;
  exceeded154hPersonnel: StaffPersonnel[];
  has154hViolation: boolean;
  get14dHours: (staff: StaffPersonnel, isAssignedCoverToday?: boolean, targetDateStr?: string) => number;
  lockModalSmApproved: boolean;
  onLockModalSmApprovedChange: (approved: boolean) => void;
  onClose: () => void;
  onLockAndPropagate: () => void;
}

export default function OperationsOverrideModal({
  isOpen,
  dailyStaffStatus,
  dailyRestAssignments,
  manpowerData,
  ertSummary,
  exceeded154hPersonnel,
  has154hViolation,
  get14dHours,
  lockModalSmApproved,
  onLockModalSmApprovedChange,
  onClose,
  onLockAndPropagate,
}: OperationsOverrideModalProps) {
  if (!isOpen) return null;

  const statusEntries = Object.entries(dailyStaffStatus);
  const absences = statusEntries.filter(([_, status]) => status.status !== 'PRESENT');

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="win-panel p-5 max-w-2xl w-full bg-[#d4d0c8] shadow-2xl border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-slate-900 font-sans">
        <div className="bg-[#183b6b] text-white p-2 px-3 flex justify-between items-center mb-3 shadow-xs">
          <span className="font-bold text-xs flex items-center gap-2 tracking-wide">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>OPERATIONS ROSTER LOCK &amp; IMPACT SUMMARY (2026-09-02)</span>
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold px-2 py-0.5 bg-red-700 hover:bg-red-800 text-xs cursor-pointer rounded-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="win-sunken bg-white p-3 border border-slate-400 space-y-1.5">
            <div className="font-bold text-blue-950 font-mono text-[11px] border-b border-slate-200 pb-1 flex justify-between items-center">
              <span>[1. 당일 인원 변동 사항 요약 (Today's SSOT Variations)]</span>
              <span className="text-[10px] font-normal text-slate-600">Total Variations: {absences.length}p</span>
            </div>

            {absences.length === 0 ? (
              <div className="text-slate-600 italic py-1 font-mono text-[11px]">
                No unplanned absences recorded today. All scheduled shift personnel marked PRESENT (Standard Muster).
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {absences.map(([staffId, status]) => {
                  const staff = manpowerData.find((member) => member.id === staffId);
                  const cover = status.replacementId ? manpowerData.find((member) => member.id === status.replacementId) : null;
                  return (
                    <div key={staffId} className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-300 font-mono text-[11px]">
                      <div>
                        <span className="font-bold text-slate-900">{staff?.name}</span>
                        <span className="text-slate-500 text-[10px]"> ({staff?.role} • {staff?.teamName})</span>
                        <span className="mx-1.5 font-bold text-rose-700">➔ {status.status}</span>
                      </div>
                      <div>
                        {cover ? (
                          <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 border border-emerald-300 rounded font-bold text-[10px]">
                            Cover: {cover.name} ({cover.teamName})
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 border border-red-300 rounded font-bold text-[10px] animate-pulse">
                            ⚠️ UNCOVERED SHORTAGE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="win-sunken bg-white p-3 border border-slate-400 space-y-1.5">
            <div className="font-bold text-blue-950 font-mono text-[11px] border-b border-slate-200 pb-1">
              [2. 월간 플랜(Monthly Plan) 역반영 영향도 분석]
            </div>
            <div className="text-[11px] font-mono text-slate-800 space-y-1 pt-1">
              <div className="flex items-start gap-1.5">
                <span className="text-blue-900 font-bold">• Target Date:</span>
                <span>September 2, 2026 (Monthly Calendar Day 2 Grid Sync)</span>
              </div>
              {absences.length === 0 ? (
                <div className="pl-3 border-l-2 border-slate-300 text-[10.5px] text-slate-500 italic">
                  No status adjustments to propagate. Monthly Plan retains standard shift roster codes.
                </div>
              ) : (
                absences.map(([staffId, status]) => {
                  const staff = manpowerData.find((member) => member.id === staffId);
                  const cover = status.replacementId ? manpowerData.find((member) => member.id === status.replacementId) : null;
                  const coverHours = cover ? get14dHours(cover, true) : 0;
                  return (
                    <div key={staffId} className="pl-3 border-l-2 border-blue-400 text-[10.5px] space-y-0.5">
                      <div>
                        Monthly Plan Day 9/2: <strong>{staff?.name}</strong> shift updated to <span className="px-1 bg-amber-200 text-amber-950 font-bold rounded">Off ({status.status})</span>
                      </div>
                      {cover && (
                        <div>
                          Monthly Plan Day 9/2: <strong>{cover.name}</strong> shift swapped in as <span className="px-1 bg-emerald-200 text-emerald-950 font-bold rounded">{staff?.department === 'OP_BRAVO' ? 'D' : 'N'}</span> (14d Cumulative Hours: <span className={coverHours >= 154 ? 'text-rose-700 font-bold' : 'font-bold'}>{coverHours}h / 154h Limit</span>)
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[10.5px]">
            <div className={`p-2 border ${ertSummary.isAllERTMet ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-red-50 border-red-400 text-red-950 font-bold'}`}>
              <div className="font-bold flex items-center justify-between mb-1">
                <span>ERT Minimum Manning:</span>
                <span className={`px-1 text-[9px] rounded ${ertSummary.isAllERTMet ? 'bg-emerald-800 text-white' : 'bg-red-600 text-white'}`}>
                  {ertSummary.isAllERTMet ? '[PASSED]' : '[DEFICIT]'}
                </span>
              </div>
              <div className="text-[10px] text-slate-700">
                IC: {ertSummary.icCount}/1 | FC: {ertSummary.fireChiefCount}/1 | FA: {ertSummary.firstAiderCount}/1 | Gas: {ertSummary.gasResponseCount}/2
              </div>
            </div>

            <div className={`p-2 border ${has154hViolation ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
              <div className="font-bold flex items-center justify-between mb-1">
                <span>14-Day Limit (154h):</span>
                <span className={`px-1 text-[9px] rounded ${has154hViolation ? 'bg-rose-700 text-white' : 'bg-emerald-800 text-white'}`}>
                  {has154hViolation ? '[OVERRIDE REQ.]' : '[PASSED]'}
                </span>
              </div>
              <div className="text-[10px] text-slate-700">
                {has154hViolation
                  ? exceeded154hPersonnel.map((staff) => {
                    const isCover = Object.values(dailyStaffStatus).some((status) => status.status !== 'PRESENT' && status.replacementId === staff.id)
                      || Object.values(dailyRestAssignments).some((assignment) => assignment.coveringStaffId === staff.id);
                    return `${staff.name.split(' ')[0]} (${get14dHours(staff, isCover)}h)`;
                  }).join(', ')
                  : 'All Active Personnel ≤ 154h'}
              </div>
            </div>
          </div>

          <div className="win-sunken bg-amber-50/80 p-2.5 border border-amber-300 space-y-1">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950 text-xs">
              <input
                type="checkbox"
                checked={lockModalSmApproved}
                onChange={(event) => onLockModalSmApprovedChange(event.target.checked)}
                className="w-4 h-4 cursor-pointer accent-blue-900"
              />
              <span>Acknowledge Fatigue &amp; Manning Override (Statutory SKK Migas Exemption SOP-NP07-03)</span>
            </label>
            <div className="text-[10px] text-amber-900 pl-6 flex justify-between items-center font-mono">
              <span>Authorizing Signatory: <strong>Site Manager Edi Hermawan (EMP-001)</strong></span>
              <span>Status: {lockModalSmApproved ? 'Authorized ✓' : 'Pending Signature'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-300">
            <button
              onClick={onClose}
              className="win-btn px-4 py-1.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-200"
            >
              Cancel (Revert Changes)
            </button>
            <button
              disabled={has154hViolation && !lockModalSmApproved}
              onClick={onLockAndPropagate}
              className={`win-btn px-5 py-1.5 text-xs font-bold flex items-center gap-1.5 ${has154hViolation && !lockModalSmApproved
                ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
                : 'bg-blue-950 text-white cursor-pointer hover:bg-blue-900'
                }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock Roster &amp; Propagate to Monthly Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
