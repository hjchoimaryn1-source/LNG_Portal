"use client";

import {
  AlertOctagon,
  ArrowRightLeft,
  CheckCheck,
  CheckCircle2,
  UserCog,
} from 'lucide-react';
import type { StaffPersonnel } from '../../../types/lng';
import { getStaffCompetencyStatus } from '../../../data/manpowerMasterData';

type CompetencyStatus = ReturnType<typeof getStaffCompetencyStatus>;

export interface RotationDelegationCandidate {
  staff: StaffPersonnel;
  label: string;
  isPrimary: boolean;
}

export interface RotationDelegationModalProps {
  offGoing: StaffPersonnel;
  candidateList: RotationDelegationCandidate[];
  selectedCandidateId: string;
  selectedCandidate: StaffPersonnel | null;
  candidateComp: CompetencyStatus | null;
  isBlocked: boolean;
  onSelectedCandidateChange: (candidateId: string) => void;
  onClose: () => void;
  onNavigateToMatrix: (staffId: string) => void;
  onExecuteHandover: (offGoingStaff: StaffPersonnel, relieverStaff: StaffPersonnel) => void;
  normalizePositionTitle: (rawTitle: string) => string;
  calcOnSiteDays: (startDateStr: string, todayStr?: string) => number;
  calcRotationDueDate: (startDateStr: string, cycleLengthDays?: number) => string;
}

export default function RotationDelegationModal({
  offGoing,
  candidateList,
  selectedCandidateId,
  selectedCandidate,
  candidateComp,
  isBlocked,
  onSelectedCandidateChange,
  onClose,
  onNavigateToMatrix,
  onExecuteHandover,
  normalizePositionTitle,
  calcOnSiteDays,
  calcRotationDueDate,
}: RotationDelegationModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="win-panel p-6 sm:p-7 max-w-2xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 font-sans rounded-xl overflow-hidden">
        <div className="win-titlebar bg-blue-950 text-white p-3 px-4 flex justify-between items-center rounded-lg mb-4 shadow-sm">
          <span className="font-black text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-300 shrink-0" />
            <span>3:1 Rotation Handover Gate & Duty Delegation Protocol</span>
          </span>
          <button
            onClick={onClose}
            className="text-white font-black px-2.5 py-1 bg-red-600 hover:bg-red-700 text-xs rounded transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm font-sans">
          <div className="bg-slate-50 p-4 border border-slate-300 rounded-lg space-y-2 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              [Off-Going Personnel Information]
            </div>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-base font-black text-blue-950">{offGoing.name}</span>
                <span className="ml-2 text-xs font-bold text-slate-600 font-mono">({offGoing.id})</span>
              </div>
              <div className="font-bold text-xs text-blue-950 bg-blue-100 px-3 py-1 border border-blue-300 rounded-md">
                {normalizePositionTitle(offGoing.role)} • {offGoing.teamName}
              </div>
            </div>
            <div className="flex justify-between text-xs pt-1 text-slate-800 font-mono border-t border-slate-200">
              <span>On-Site Cumulative: <strong>{calcOnSiteDays(offGoing.cycleStartDate)} / 90 Days</strong></span>
              <span>Rotation Leave Due: <strong className="text-blue-900">{calcRotationDueDate(offGoing.cycleStartDate)}</strong></span>
            </div>
          </div>

          <div className="bg-blue-50/70 p-4 border border-blue-200 rounded-lg space-y-2 shadow-xs">
            <label className="block text-sm font-bold text-blue-950 flex items-center gap-1.5">
              <UserCog className="w-4 h-4 text-blue-900" />
              <span>Select Qualified Reliever / Acting Delegate:</span>
            </label>

            {candidateList.length > 0 ? (
              <select
                value={selectedCandidateId}
                onChange={(event) => onSelectedCandidateChange(event.target.value)}
                className="w-full h-11 bg-white border-2 border-slate-300 rounded-lg px-3 font-semibold text-slate-900 text-sm focus:border-blue-700 focus:outline-none cursor-pointer"
              >
                {candidateList.map((candidate) => (
                  <option key={candidate.staff.id} value={candidate.staff.id}>
                    {candidate.isPrimary ? '★ [PRIMARY DELEGATE] ' : '• [QUALIFIED POOL] '}
                    {candidate.label} - {candidate.staff.id}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-rose-700 font-bold p-2 bg-rose-50 border border-rose-200 rounded text-xs">
                No matching personnel found in the active roster. Mobilize HQ delegate.
              </div>
            )}

            <div className="text-xs text-slate-600 leading-normal">
              * Selection applies statutory delegation hierarchy and cross-rotation rules for {offGoing.department}.
            </div>
          </div>

          {selectedCandidate && candidateComp && (
            <div>
              {candidateComp.hasExpired ? (
                <div className="bg-rose-50 border-2 border-rose-400 p-4 rounded-lg space-y-2 shadow-xs">
                  <div className="text-rose-950 font-black text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
                      [COMPLIANCE GATE DEFICIT] Handover Blocked
                    </span>
                    <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-xs">
                      UNAUTHORIZED
                    </span>
                  </div>
                  <div className="text-xs text-rose-900 leading-relaxed font-medium">
                    Candidate <strong>{selectedCandidate.name}</strong> holds {candidateComp.expiredCerts.length} expired statutory certification(s):
                  </div>
                  <div className="bg-white p-2 border border-rose-200 rounded space-y-1 text-xs font-mono">
                    {candidateComp.expiredCerts.map((certification) => (
                      <div key={certification.code} className="text-rose-700 font-bold flex justify-between">
                        <span>• {certification.code}: {certification.name}</span>
                        <span>(Expired: {certification.expiryDate})</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onNavigateToMatrix(selectedCandidate.id);
                        onClose();
                      }}
                      className="text-blue-900 underline font-bold text-xs hover:text-blue-950 cursor-pointer"
                    >
                      Inspect & Approve Certification Renewal in Training Matrix ➔
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-lg space-y-2 shadow-xs">
                  <div className="text-emerald-950 font-black text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      [COMPLIANCE GATE CLEARED] 100% Valid Certifications
                    </span>
                    <span className="bg-emerald-800 text-white font-bold px-2.5 py-0.5 rounded text-xs">
                      AUTHORIZED
                    </span>
                  </div>
                  <div className="text-xs text-emerald-900 leading-relaxed font-medium">
                    Candidate <strong>{selectedCandidate.name}</strong> satisfies all mandatory SKK Migas safety leadership, cryogenic, and PTW compliance standards ({candidateComp.validCount} / {candidateComp.totalCount} Valid).
                  </div>
                  {candidateComp.hasExpiringSoon && (
                    <div className="text-xs text-amber-900 bg-amber-50 p-2 border border-amber-200 rounded mt-1 font-mono">
                      Refresher Due Notice: {candidateComp.expiringCerts.map((cert) => `${cert.code} (${cert.expiryDate})`).join('; ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-300 flex-wrap gap-2">
            <button
              onClick={() => {
                if (selectedCandidate) {
                  onNavigateToMatrix(selectedCandidate.id);
                  onClose();
                }
              }}
              className="px-2 py-1 text-xs font-bold cursor-pointer text-blue-900 underline hover:text-blue-950"
            >
              View in Training Matrix ➔
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 border border-slate-300 text-slate-800 transition-colors"
              >
                취소 (Cancel)
              </button>

              <button
                disabled={isBlocked}
                onClick={() => {
                  if (selectedCandidate) {
                    onExecuteHandover(offGoing, selectedCandidate);
                  }
                }}
                className={`px-6 py-2.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow transition-all ${isBlocked
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400'
                  : 'bg-blue-950 text-white hover:bg-blue-900'
                  }`}
              >
                <CheckCheck className="w-4 h-4 text-emerald-300" />
                <span>소장 승인 및 인수인계 확정 (Approve & Authorize)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
