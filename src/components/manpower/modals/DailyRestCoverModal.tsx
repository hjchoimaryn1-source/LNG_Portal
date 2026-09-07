"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { StaffPersonnel } from '../../../types/lng';
import type { DailyRestReason } from '../../../data/manpowerMasterData';
import { getStaffCompetencyStatus } from '../../../data/manpowerMasterData';
import { projectStaffMonthlyRoster } from '../tabs/MonthlyPlanTab';

type CompetencyStatus = ReturnType<typeof getStaffCompetencyStatus>;
type DailyRestAssignment = {
  reason: string;
  coveringStaffId: string;
  approvedAt: string;
};

export interface DailyRestCoverModalProps {
  isOpen: boolean;
  activeDateStr?: string;
  onDutyPersonnel?: StaffPersonnel[];
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
  onApply: (customReasonOverride?: string) => void;
}

export default function DailyRestCoverModal({
  isOpen,
  activeDateStr,
  onDutyPersonnel,
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
  const [customReason, setCustomReason] = useState('');

  const onDutyCandidates = useMemo(() => {
    const dateStr = activeDateStr || '2026-09-07';
    const parts = dateStr.split('-').map(Number);
    const year = parts[0] || 2026;
    const monthIndex = (parts[1] || 9) - 1;
    const day = parts[2] || 1;

    const list = manpowerData.filter((member) => {
      if (dailyRestAssignments[member.id]) return false;
      const roster = projectStaffMonthlyRoster(member, year, monthIndex);
      const shift = roster[day - 1] || 'D';
      return shift === 'D' || shift === 'N';
    });

    return list.length > 0 ? list : manpowerData.filter((member) => !dailyRestAssignments[member.id]);
  }, [manpowerData, dailyRestAssignments, activeDateStr]);

  const standbyCoverCandidates = useMemo(() => {
    const dateStr = activeDateStr || '2026-09-07';
    const parts = dateStr.split('-').map(Number);
    const year = parts[0] || 2026;
    const monthIndex = (parts[1] || 9) - 1;
    const day = parts[2] || 1;

    const offList = manpowerData.filter((member) => {
      if (member.id === dailyRestApplicantId) return false;
      const roster = projectStaffMonthlyRoster(member, year, monthIndex);
      const shift = roster[day - 1] || 'OFF';
      return shift === 'OFF' || shift === 'AL' || shift === 'R';
    });

    return offList.length > 0 ? offList : manpowerData.filter((m) => m.id !== dailyRestApplicantId);
  }, [manpowerData, dailyRestApplicantId, activeDateStr]);

  useEffect(() => {
    if (onDutyCandidates.length > 0 && (!dailyRestApplicantId || !onDutyCandidates.some((c) => c.id === dailyRestApplicantId))) {
      onApplicantChange(onDutyCandidates[0].id);
    }
  }, [onDutyCandidates, dailyRestApplicantId, onApplicantChange]);

  if (!isOpen) return null;

  const currentCover = manpowerData.find((member) => member.id === dailyRestCoverId);
  const coverComp = currentCover ? getStaffCompetencyStatus(currentCover) : null;

  const handleApply = () => {
    const finalReason = dailyRestReason === 'Other'
      ? (customReason.trim() || 'Other')
      : dailyRestReason;
    onApply(finalReason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="win-panel max-w-xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans">
        <div className="bg-blue-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-blue-800">
          <span className="font-bold text-base sm:text-lg tracking-wide uppercase">
            DAILY REST REQUEST
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
              Applicant
            </label>
            <select
              value={dailyRestApplicantId}
              onChange={(event) => onApplicantChange(event.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              {onDutyCandidates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              Reason
            </label>
            <select
              value={dailyRestReason}
              onChange={(event) => onReasonChange(event.target.value as DailyRestReason)}
              className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="Medical">Medical (Health Condition / Observation)</option>
              <option value="Emergency">Emergency (Personal / Family Emergency)</option>
              <option value="Fatigue 154h">Fatigue Management (&gt;154h Limit Stand-down)</option>
              <option value="Rotation Leave">Rotation Handover / Rest</option>
              <option value="Other">Other (Specify below)</option>
            </select>
            {dailyRestReason === 'Other' && (
              <input
                type="text"
                placeholder="Enter specific reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full mt-1.5 px-2 py-1 bg-white border border-slate-400 text-slate-800 text-[11px] font-mono rounded shadow-inner focus:outline-none focus:border-blue-600"
              />
            )}
          </div>

          <div className="space-y-1.5 bg-blue-50/70 p-3 rounded-lg border border-blue-200">
            <label className="block font-bold text-blue-950">
              Standby Cover
            </label>
            <select
              value={dailyRestCoverId}
              onChange={(event) => onCoverChange(event.target.value)}
              className="w-full h-10 px-3 border border-blue-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              {standbyCoverCandidates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
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

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="win-btn px-5 py-2 text-sm font-semibold cursor-pointer hover:bg-slate-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="win-btn px-6 py-2 text-sm font-bold rounded-md shadow-md transition-all bg-blue-900 hover:bg-blue-950 text-white cursor-pointer"
            >
              Apply Standby Cover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
