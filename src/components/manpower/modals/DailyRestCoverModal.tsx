"use client";

import { CheckCircle2, UserPlus } from 'lucide-react';
import type { StaffPersonnel } from '../../../types/lng';
import { getStaffCompetencyStatus } from '../../../data/manpowerMasterData';

type DailyRestReason = 'Medical' | 'Emergency' | 'Fatigue 154h' | 'Rotation Leave';
type CompetencyStatus = ReturnType<typeof getStaffCompetencyStatus>;
type DailyRestAssignment = {
  reason: string;
  coveringStaffId: string;
  approvedAt: string;
};

export interface DailyRestCoverModalProps {
  isOpen: boolean;
  dailyRestApplicantId: string;
  dailyRestReason: DailyRestReason;
  dailyRestCoverId: string;
  dailyRestSmApproved: boolean;
  dailyRestAssignments: Record<string, DailyRestAssignment>;
  manpowerData: StaffPersonnel[];
  teamBPersonnel: StaffPersonnel[];
  teamCPersonnel: StaffPersonnel[];
  teamAPersonnel: StaffPersonnel[];
  get14dHours: (staff: StaffPersonnel, isAssignedCoverToday?: boolean, targetDateStr?: string) => number;
  getStaffCompetencyStatus: (staff: StaffPersonnel) => CompetencyStatus;
  onApplicantChange: (applicantId: string) => void;
  onReasonChange: (reason: DailyRestReason) => void;
  onCoverChange: (coverId: string) => void;
  onSmApprovedChange: (approved: boolean) => void;
  onClose: () => void;
  onApply: () => void;
}

export default function DailyRestCoverModal({
  isOpen,
  dailyRestApplicantId,
  dailyRestReason,
  dailyRestCoverId,
  dailyRestSmApproved,
  dailyRestAssignments,
  manpowerData,
  teamBPersonnel,
  teamCPersonnel,
  teamAPersonnel,
  get14dHours,
  getStaffCompetencyStatus,
  onApplicantChange,
  onReasonChange,
  onCoverChange,
  onSmApprovedChange,
  onClose,
  onApply,
}: DailyRestCoverModalProps) {
  if (!isOpen) return null;

  const onDutyCandidates = [...teamBPersonnel, ...teamCPersonnel].filter((member) => !dailyRestAssignments[member.id]);
  const standbyCoverCandidates = teamAPersonnel;
  const currentCover = manpowerData.find((member) => member.id === dailyRestCoverId);
  const coverComp = currentCover ? getStaffCompetencyStatus(currentCover) : null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="win-panel max-w-xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans">
        <div className="bg-blue-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-blue-800">
          <span className="font-bold text-base sm:text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400 shrink-0" />
            <span>예외 휴무 신청 및 대체자 배정 (Daily Rest & Cover)</span>
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              1. 휴무 신청 대상자 (Applicant - Active On-Duty):
            </label>
            <select
              value={dailyRestApplicantId}
              onChange={(event) => onApplicantChange(event.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              {onDutyCandidates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role} • {member.teamName}) - {member.ertRole} {get14dHours(member) >= 154 ? `[⚠️ ${get14dHours(member)}h/14d]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              2. 휴무/비번 사유 (Reason for Stand-down):
            </label>
            <select
              value={dailyRestReason}
              onChange={(event) => onReasonChange(event.target.value as DailyRestReason)}
              className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="Medical">Medical (진료 / 건강 이상 및 관찰)</option>
              <option value="Emergency">Emergency (긴급 상황 / 개인 사유)</option>
              <option value="Fatigue 154h">Fatigue 154h (14일 누적 154시간 피로도 초과 안전 대기)</option>
              <option value="Rotation Leave">Rotation Leave (3:1 Rotation Handover)</option>
            </select>
          </div>

          <div className="space-y-1.5 bg-blue-50/70 p-3 rounded-lg border border-blue-200">
            <label className="block font-bold text-blue-950">
              3. 비번 대기조 내 대체 투입자 (Standby Cover):
            </label>
            <select
              value={dailyRestCoverId}
              onChange={(event) => onCoverChange(event.target.value)}
              className="w-full h-10 px-3 border border-blue-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              {standbyCoverCandidates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role} • {member.teamName}) - ERT: {member.ertRole} (Radio: {member.radioChannel})
                </option>
              ))}
            </select>

            {currentCover && coverComp && (
              <div className="text-[11px] pt-1 flex justify-between items-center text-slate-700">
                <span>ERT Role: <strong>{currentCover.ertRole}</strong></span>
                <span className={coverComp.hasExpired ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {coverComp.hasExpired ? 'Expired Cert' : '100% Certified Valid'}
                </span>
              </div>
            )}
          </div>

          {dailyRestReason === 'Rotation Leave' && (
            <div className="border-t border-slate-300 pt-3 space-y-2">
              <div className="font-bold text-slate-800 text-[11px] uppercase">
                3:1 Rotation Handover Gate &amp; Duty Delegation
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Compliance Gate</span>
                <span className={coverComp?.hasExpired ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {coverComp?.hasExpired ? 'PENDING' : '[COMPLIANCE GATE CLEARED]'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Site Manager Authorization</span>
                <span className={dailyRestSmApproved ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {dailyRestSmApproved ? 'AUTHORIZED & SIGNED' : 'PENDING SIGN-OFF'}
                </span>
              </div>
            </div>
          )}

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-300">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
              <input
                type="checkbox"
                checked={dailyRestSmApproved}
                onChange={(event) => onSmApprovedChange(event.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>소장(Site Manager) 예외 휴무 및 대체자 투입 승인 확인 (EMP-001)</span>
            </label>
            <div className="text-[10px] text-amber-900 mt-1 pl-6">
              승인 즉시 Daily Shift Board에 대체자가 반영되며, ERT 조직 적격성이 자동 재계산됩니다.
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="win-btn px-5 py-2 text-sm font-semibold cursor-pointer hover:bg-slate-200 rounded-md"
            >
              취소 (Cancel)
            </button>
            <button
              disabled={!dailyRestSmApproved}
              onClick={onApply}
              className={`win-btn px-6 py-2 text-sm font-bold flex items-center gap-2 rounded-md shadow-md transition-all ${!dailyRestSmApproved
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400'
                : 'bg-blue-900 hover:bg-blue-950 text-white cursor-pointer'
                }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>승인 및 대체 투입 (Approve &amp; Swap Cover)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
