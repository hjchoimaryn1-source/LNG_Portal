"use client";

import { CheckCircle2, FileText } from 'lucide-react';
import type { StaffPersonnel } from '../../../types/lng';
import { MONTH_NAMES } from '../../../data/manpowerMasterData';

export interface SiteManagerApproval {
  staff: StaffPersonnel;
  dayIndex: number;
  dayNum: number;
  reason: string;
}

export interface ExceptionRestModalProps {
  request: SiteManagerApproval | null;
  selectedYear: number;
  selectedMonth: number;
  approvalReason: string;
  normalizePositionTitle: (rawTitle: string) => string;
  onApprovalReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ExceptionRestModal({
  request,
  selectedYear,
  selectedMonth,
  approvalReason,
  normalizePositionTitle,
  onApprovalReasonChange,
  onClose,
  onConfirm,
}: ExceptionRestModalProps) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="win-panel max-w-xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans">
        <div className="bg-blue-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-blue-800">
          <span className="font-bold text-base sm:text-lg flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <span>예외 휴무 신청서 (Rest Day Request)</span>
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs transition-colors cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block mb-0.5">대상자 (Applicant)</span>
                <div className="text-sm sm:text-base font-bold text-slate-900">{request.staff.name}</div>
                <div className="text-xs text-blue-900 font-medium">
                  {normalizePositionTitle(request.staff.role) || request.staff.role}
                </div>
              </div>

              <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block mb-0.5">대상일자 (Requested Date)</span>
                <div className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                  {selectedYear}-{String(selectedMonth).padStart(2, '0')}-{String(request.dayNum).padStart(2, '0')}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {MONTH_NAMES[selectedMonth - 1]} {request.dayNum}, {selectedYear}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                휴무 사유 (Reason)
              </label>
              <select
                value={approvalReason}
                onChange={(event) => onApprovalReasonChange(event.target.value)}
                className="w-full h-11 px-3 text-sm font-medium border border-slate-300 rounded-md bg-white shadow-xs focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="Medical">Medical (진료 / 건강 관리)</option>
                <option value="Emergency">Emergency (긴급 상황 / 개인 사유)</option>
                <option value="Special Task">Special Task (특별 업무 조정)</option>
                <option value="Fatigue">Fatigue (피로도 완화 / 안전 휴식)</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50/80 p-3 rounded-lg border border-blue-200 text-xs sm:text-sm text-blue-950 flex items-center justify-between flex-wrap gap-2">
            <span>승인 권한: <strong>소장 (Site Manager)</strong></span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              소장 승인 로그 자동 기록
            </span>
          </div>

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="win-btn px-5 py-2.5 text-sm font-semibold cursor-pointer hover:bg-slate-200 rounded-md"
            >
              취소 (Cancel)
            </button>
            <button
              onClick={onConfirm}
              className="win-btn px-6 py-2.5 text-sm font-bold cursor-pointer bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-2 rounded-md shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>소장 승인 및 등록 (Approve & Submit)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
