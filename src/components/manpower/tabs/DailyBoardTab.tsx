import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { getStaffCompetencyStatus } from '../../../data/manpowerMasterData';
import { StaffPersonnel } from '../../../types/lng';

interface DailyBoardTabProps {
  manpowerData: StaffPersonnel[];
  dailyStaffStatus: Record<string, { status: 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE'; replacementId: string }>;
  dailyRestAssignments: Record<string, { reason: string; coveringStaffId: string; approvedAt: string }>;
  teamBPersonnel: StaffPersonnel[];
  teamCPersonnel: StaffPersonnel[];
  teamAPersonnel: StaffPersonnel[];
  standbyPoolCandidates: StaffPersonnel[];
  ertSummary: {
    isAllERTMet: boolean;
    icCount: number;
    fireChiefCount: number;
    firstAiderCount: number;
    gasResponseCount: number;
  };
  exceeded154hPersonnel: StaffPersonnel[];
  has154hViolation: boolean;
  rolling7Days: Array<{
    dateStr: string;
    dayLabel: string;
    dayNum: number;
    isToday: boolean;
    status: 'OK' | 'WARNING' | 'DANGER';
    badgeText: string;
    detailText: string;
  }>;
  codBaselineDate: string;
  isErtGateExpanded: boolean;
  isFatigueExpanded: boolean;
  isFitToWorkOverridden: boolean;
  onToggleErtGate: () => void;
  onToggleFatigue: () => void;
  onOpenHandoverProtocol: () => void;
  onOpenDailyRestModal: () => void;
  onOpenLockModal: () => void;
  onApplyCodRoster: () => void;
  onSetCodBaselineDate: (value: string) => void;
  onOpenFitToWorkModal: () => void;
  onOperatorStatusChange: (staffId: string, newStatus: 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE') => void;
  onReplacementChange: (staffId: string, replacementId: string) => void;
  onNavigateToMatrix: (empId: string) => void;
  get14dHours: (staff: StaffPersonnel, isAssignedCoverToday?: boolean, targetDateStr?: string) => number;
}

export default function DailyBoardTab({
  manpowerData,
  dailyStaffStatus,
  dailyRestAssignments,
  teamBPersonnel,
  teamCPersonnel,
  teamAPersonnel,
  standbyPoolCandidates,
  ertSummary,
  exceeded154hPersonnel,
  has154hViolation,
  rolling7Days,
  codBaselineDate,
  isErtGateExpanded,
  isFatigueExpanded,
  isFitToWorkOverridden,
  onToggleErtGate,
  onToggleFatigue,
  onOpenHandoverProtocol,
  onOpenDailyRestModal,
  onOpenLockModal,
  onApplyCodRoster,
  onSetCodBaselineDate,
  onOpenFitToWorkModal,
  onOperatorStatusChange,
  onReplacementChange,
  onNavigateToMatrix,
  get14dHours,
}: DailyBoardTabProps) {
  const unplannedTotal = Object.values(dailyStaffStatus).filter((s) => s.status !== 'PRESENT').length + Object.keys(dailyRestAssignments).length;
  const unreplacedCount = Object.values(dailyStaffStatus).filter((s) => s.status !== 'PRESENT' && !s.replacementId).length;
  const activeHeadcount = 13 - unreplacedCount;

  return (
    <div className="space-y-2 p-1.5 bg-[#d4d0c8]">
      <div className="bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-3 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between shadow-xs shrink-0 select-none">
        <div className="flex items-center">
          <span className="text-emerald-700 font-black mr-2 text-sm">■</span>
          <span className="uppercase tracking-wider">DAILY SUMMARY</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHandoverProtocol}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
            title="Open Pre-Shift Handover & Safety Delegation Protocol (SOP NP07-03)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-950" />
            <span>Shift Handover &amp; Delegation</span>
          </button>
          <button
            onClick={onOpenDailyRestModal}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
            title="Apply for on-duty rest/stand-down, shift swap, or assign standby cover"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-950" />
            <span>+ Shift / Leave Request</span>
          </button>
          <button
            onClick={onOpenLockModal}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
            title="Open Operations Override & Impact Summary to lock daily roster in SSOT"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Submit &amp; Lock Roster</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0">
        <div className="border-2 border-slate-400 bg-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-[#183b6b] text-white font-bold text-xs px-2.5 py-1 text-center tracking-wide uppercase border-b border-slate-400">ON-SITE TOTAL</div>
          <div className="p-1 space-y-0.5">
            <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Total Headcount</span>
              <span className="text-slate-900 font-bold font-mono text-right">16 / 19 (84%)</span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Active Duty</span>
              <span className={`font-bold font-mono text-right ${unreplacedCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                {activeHeadcount} Personnel {unreplacedCount > 0 ? `(-${unreplacedCount}p)` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-0.5 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">ERT Compliance</span>
              <span className={`font-bold font-mono text-right ${ertSummary.isAllERTMet ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                {ertSummary.isAllERTMet ? '16 / 16 (100%)' : '[CRITICAL DEFICIT]'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-2 border-slate-400 bg-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-[#183b6b] text-white font-bold text-xs px-2.5 py-1 text-center tracking-wide uppercase border-b border-slate-400">SHIFT OPERATIONS</div>
          <div className="p-1 space-y-0.5">
            <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Day Shift (OP)</span>
              <span className="text-slate-900 font-bold font-mono text-right">TEAM-B (3p) · Asman S.</span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Night Shift (OP)</span>
              <span className="text-slate-900 font-bold font-mono text-right">TEAM-C (3p) · Juli S.</span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-0.5 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Day Support</span>
              <span className="text-slate-900 font-bold font-mono text-right">7 Staff (General)</span>
            </div>
          </div>
        </div>

        <div className="border-2 border-slate-400 bg-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-[#183b6b] text-white font-bold text-xs px-2.5 py-1 text-center tracking-wide uppercase border-b border-slate-400">LEAVE &amp; SHORTAGE</div>
          <div className="p-1 space-y-0.5">
            <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Off-Duty Team</span>
              <span className="text-slate-900 font-bold font-mono text-right">TEAM-A (3 Standby)</span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Unplanned Leave</span>
              <span className={`font-mono font-bold text-right ${unplannedTotal > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {unplannedTotal} Sick / Emergency
              </span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-0.5 bg-slate-100 text-xs">
              <span className="text-slate-700 font-medium whitespace-nowrap">Manning Status</span>
              <span className="font-mono font-bold text-right">
                {unreplacedCount > 0 ? (
                  <span className="text-red-700 font-black">Deficit Alert (-{unreplacedCount}p)</span>
                ) : unplannedTotal > 0 ? (
                  <span className="text-emerald-800 font-bold">Covered (0 Deficit)</span>
                ) : (
                  <span className="text-slate-900 font-bold">Normal (0 Deficit)</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#334155] border-2 border-t-slate-600 border-l-slate-600 border-r-slate-800 border-b-slate-800 p-1.5 shrink-0 shadow-xs">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-200 tracking-wide">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="uppercase font-mono">7-DAY ROLLING RISK HORIZON (MANNING &amp; ERT REPUTATION GATE)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="win-sunken bg-white px-2 py-0.5 border border-slate-500 shadow-inner flex items-center">
              <input
                type="date"
                value={codBaselineDate}
                onChange={(e) => onSetCodBaselineDate(e.target.value)}
                className="bg-white text-[#0f172a] font-mono font-extrabold text-[11px] focus:outline-none cursor-pointer"
                title="Select COD Baseline Date"
              />
            </div>
            <button
              onClick={onApplyCodRoster}
              className="win-btn px-3 py-0.5 text-[11px] font-mono font-extrabold bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] border border-t-white border-l-white border-r-[#64748b] border-b-[#64748b] flex items-center gap-1 cursor-pointer shadow-xs"
              title="Synchronize and calculate 3:1 roster"
            >
              <RotateCcw className="w-3 h-3 text-blue-900 shrink-0" />
              <span>↺ Sync Roster</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 font-mono text-[10px]">
          {rolling7Days.map((dayItem) => (
            <div
              key={dayItem.dateStr}
              className={`win-sunken p-1.5 flex flex-col justify-between border ${dayItem.isToday
                ? 'bg-[#0f172a] border-sky-400 ring-1 ring-sky-400 shadow-md'
                : 'bg-[#1e293b] border-slate-700'
                }`}
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-0.5 mb-1 bg-[#1e293b] px-1 rounded-xs">
                <span className="font-bold text-white tracking-tight">{dayItem.dayLabel}</span>
                {dayItem.isToday && (
                  <span className="px-1 bg-amber-400 text-black font-black text-[8px] rounded-xs">TODAY</span>
                )}
              </div>
              <div className="my-0.5">
                <span
                  className={`px-1.5 py-0.5 rounded-xs font-black text-[10px] inline-block w-full text-center ${dayItem.status === 'DANGER'
                    ? 'bg-rose-700 text-white animate-pulse'
                    : dayItem.status === 'WARNING'
                      ? 'bg-amber-400 text-black font-black'
                      : 'bg-emerald-600 text-white font-bold'
                    }`}
                >
                  {dayItem.badgeText}
                </span>
              </div>
              <div className="text-[9px] text-white font-semibold truncate text-center mt-0.5">
                {dayItem.detailText}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`win-panel p-2 border-2 ${ertSummary.isAllERTMet ? 'border-emerald-800 bg-emerald-50/40' : 'border-red-600 bg-red-50/60'}`}>
        <div
          onClick={onToggleErtGate}
          className="flex items-center justify-between flex-wrap gap-2 cursor-pointer select-none hover:opacity-90 transition-opacity"
          title="Click to expand/collapse details"
        >
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 flex-wrap">
            <span className="text-emerald-700 font-black">■</span>
            <span>SAFETY &amp; COMPLIANCE GATE:</span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${ertSummary.isAllERTMet ? 'bg-emerald-800 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
              {ertSummary.isAllERTMet
                ? `[PASSED] ERT Minimum Manning Cleared ([IC]: ${ertSummary.icCount}/1, [FC]: ${ertSummary.fireChiefCount}/1, [FA]: ${ertSummary.firstAiderCount}/1, [GAS]: ${ertSummary.gasResponseCount}/2)`
                : `[CRITICAL] ERT Deficit ([IC]: ${ertSummary.icCount}/1, [FC]: ${ertSummary.fireChiefCount}/1, [FA]: ${ertSummary.firstAiderCount}/1, [GAS]: ${ertSummary.gasResponseCount}/2)`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isFitToWorkOverridden ? (
              <span className="px-2.5 py-0.5 text-[10.5px] font-mono font-black rounded bg-emerald-800 text-white border border-emerald-400 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
                <span>[OVERRIDDEN (AUDITED)]</span>
              </span>
            ) : has154hViolation ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFatigue();
                }}
                className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-700 text-white flex items-center gap-1 cursor-pointer shadow-xs hover:bg-rose-800"
                title="Click to view 154h fatigue details and override"
              >
                <AlertTriangle className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>154h Fatigue Alert: {exceeded154hPersonnel.length} Exceeded (Override Req.)</span>
              </span>
            ) : null}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFitToWorkModal();
              }}
              className="win-btn px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#183b6b] hover:bg-[#1e4985] text-white border border-blue-400 flex items-center gap-1 cursor-pointer shadow-xs"
              title="Open ESDM / IMO STCW Fit-to-Work Site Manager Override Modal (SOP-NP07-03)"
            >
              <Lock className="w-3 h-3 text-amber-300" />
              <span>[Site Manager Override]</span>
            </button>

            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${ertSummary.isAllERTMet || isFitToWorkOverridden ? 'bg-white border-emerald-600 text-emerald-950' : 'bg-white border-red-600 text-red-900'}`}>
              {ertSummary.isAllERTMet || isFitToWorkOverridden ? '[OPERATION AUTHORIZED]' : '[OPERATION ON HOLD]'} {isErtGateExpanded ? '▲' : '▾'}
            </span>
          </div>
        </div>

        {isErtGateExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-2 pt-2 border-t border-slate-300 animate-in fade-in duration-150">
            <div className={`p-1.5 border flex items-center justify-between ${ertSummary.isAllERTMet ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
              <span className="flex items-center gap-1 text-slate-800 font-bold">
                <span className="px-1 bg-blue-900 text-white text-[9px] rounded-xs font-mono">[IC]</span>
                <span>Incident Commander (≥1):</span>
              </span>
              <span className={`px-1.5 font-bold ${ertSummary.isAllERTMet ? 'text-emerald-900' : 'text-red-700'}`}>
                {ertSummary.icCount} / 1 {ertSummary.icCount >= 1 ? '[OK]' : '[DEFICIT]'}
              </span>
            </div>

            <div className={`p-1.5 border flex items-center justify-between ${ertSummary.fireChiefCount >= 1 ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
              <span className="flex items-center gap-1 text-slate-800 font-bold">
                <span className="px-1 bg-amber-700 text-white text-[9px] rounded-xs font-mono">[FC]</span>
                <span>Fire Chief (≥1):</span>
              </span>
              <span className={`px-1.5 font-bold ${ertSummary.fireChiefCount >= 1 ? 'text-emerald-900' : 'text-red-700'}`}>
                {ertSummary.fireChiefCount} / 1 {ertSummary.fireChiefCount >= 1 ? '[OK]' : '[DEFICIT]'}
              </span>
            </div>

            <div className={`p-1.5 border flex items-center justify-between ${ertSummary.firstAiderCount >= 1 ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
              <span className="flex items-center gap-1 text-slate-800 font-bold">
                <span className="px-1 bg-rose-700 text-white text-[9px] rounded-xs font-mono">[FA]</span>
                <span>First Aiders (≥1):</span>
              </span>
              <span className={`px-1.5 font-bold ${ertSummary.firstAiderCount >= 1 ? 'text-emerald-900' : 'text-red-700'}`}>
                {ertSummary.firstAiderCount} / 1 {ertSummary.firstAiderCount >= 1 ? '[OK]' : '[DEFICIT]'}
              </span>
            </div>

            <div className={`p-1.5 border flex items-center justify-between ${ertSummary.gasResponseCount >= 2 ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
              <span className="flex items-center gap-1 text-slate-800 font-bold">
                <span className="px-1 bg-cyan-800 text-white text-[9px] rounded-xs font-mono">[GAS]</span>
                <span>Gas Response (≥2):</span>
              </span>
              <span className={`px-1.5 font-bold ${ertSummary.gasResponseCount >= 2 ? 'text-emerald-900' : 'text-red-700'}`}>
                {ertSummary.gasResponseCount} / 2 {ertSummary.gasResponseCount >= 2 ? '[OK]' : '[DEFICIT]'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
          <div>
            <div className="bg-[#334155] text-white font-bold text-xs px-2.5 py-1 flex justify-between items-center mb-2 border-b border-slate-700 shadow-2xs">
              <span className="font-black text-xs flex items-center gap-1.5 text-white tracking-wide">
                <Clock className="w-3.5 h-3.5 text-yellow-300" />
                TEAM-B - Day Shift
              </span>
              <span className="text-[10px] font-mono bg-white text-slate-900 px-1.5 py-0.5 font-bold">
                ACTIVE (08:00 - 20:00)
              </span>
            </div>

            {teamBPersonnel.filter((m) => (dailyStaffStatus[m.id]?.status && dailyStaffStatus[m.id]?.status !== 'PRESENT') || !!dailyRestAssignments[m.id]).length >= 2 && (
              <div className="mb-2 bg-red-100 border-2 border-red-500 p-1.5 text-red-950 font-bold font-mono text-[10px] flex items-center gap-1.5 animate-pulse rounded-xs">
                <AlertOctagon className="w-4 h-4 text-red-700 shrink-0" />
                <span>[CRITICAL ALERT] 2+ Personnel Off-Duty in TEAM-B</span>
              </div>
            )}

            <div className={`p-1.5 mb-2 border font-mono text-[10px] flex items-center justify-between ${teamBPersonnel.some((m) => getStaffCompetencyStatus(m).hasExpired)
              ? 'bg-red-100 border-red-400 text-red-950 font-bold'
              : 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
              }`}>
              <span className="flex items-center gap-1">
                {teamBPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> : <ShieldAlert className="w-3.5 h-3.5 text-red-700" />}
                Safety Compliance Gate:
              </span>
              <span className={`px-1 rounded text-[9px] ${teamBPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? 'bg-emerald-800 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                {teamBPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? '100% CLEARED' : 'ACTION REQUIRED'}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {teamBPersonnel.map((member) => {
                const memberComp = getStaffCompetencyStatus(member);
                const memberDaily = dailyStaffStatus[member.id] || { status: 'PRESENT', replacementId: '' };
                const isLegacyRest = !!dailyRestAssignments[member.id];
                const legacyAssign = dailyRestAssignments[member.id];
                const isAbsence = memberDaily.status !== 'PRESENT' || isLegacyRest;
                const activeReplacementId = memberDaily.replacementId || legacyAssign?.coveringStaffId || '';
                const replacementStaff = activeReplacementId ? manpowerData.find((s) => s.id === activeReplacementId) : null;
                const hours14d = get14dHours(member);
                const is154h = hours14d >= 154;

                return (
                  <div key={member.id} className="space-y-1">
                    <div className={`${isAbsence ? 'bg-amber-50 border-2 border-amber-400 opacity-90' : 'bg-slate-100 border border-slate-300'} p-1.5`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                          {is154h && !isAbsence && (
                            <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${hours14d} hours worked in 14 days`}>
                              154h Exceeded
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={memberDaily.status}
                            onChange={(e) => onOperatorStatusChange(member.id, e.target.value as 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE')}
                            className={`win-sunken font-mono font-bold text-[9px] px-1 py-0.5 border cursor-pointer ${memberDaily.status === 'SICK'
                              ? 'bg-rose-100 text-rose-900 border-rose-400 font-black'
                              : memberDaily.status === 'EMERGENCY'
                                ? 'bg-amber-100 text-amber-950 border-amber-400 font-black'
                                : memberDaily.status === 'LEAVE'
                                  ? 'bg-purple-100 text-purple-950 border-purple-400 font-black'
                                  : 'bg-white text-slate-900 border-slate-400'
                              }`}
                            title="Change daily attendance / absence status"
                          >
                            <option value="PRESENT">PRESENT</option>
                            <option value="SICK">SICK</option>
                            <option value="EMERGENCY">EMERGENCY</option>
                            <option value="LEAVE">LEAVE</option>
                          </select>

                          {isAbsence ? (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-black font-black text-[9px] rounded shadow-xs">
                              {memberDaily.status !== 'PRESENT' ? memberDaily.status : 'REST'}
                            </span>
                          ) : memberComp.hasExpired ? (
                            <button
                              onClick={() => onNavigateToMatrix(member.id)}
                              className="px-1 bg-red-600 text-white font-bold text-[8px] rounded animate-pulse cursor-pointer"
                              title="Click to open Matrix & approve certification renewal"
                            >
                              EXPIRED CERT
                            </button>
                          ) : memberComp.hasExpiringSoon ? (
                            <button
                              onClick={() => onNavigateToMatrix(member.id)}
                              className="px-1 bg-amber-500 text-black font-bold text-[8px] rounded cursor-pointer"
                              title="Click to open Matrix"
                            >
                              REFRESH DUE
                            </button>
                          ) : (
                            <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                              CERTIFIED
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs font-bold ${member.role.toLowerCase().includes('leader') ? 'text-blue-950' : 'text-slate-900'} ${isAbsence ? 'line-through text-[#808080] opacity-75' : ''}`}>
                        {member.name}
                      </div>
                      <div className={`text-[10px] font-mono flex justify-between ${isAbsence ? 'text-[#808080]' : 'text-slate-600'}`}>
                        <span>{member.teamName} | Radio: {member.radioChannel}</span>
                        <span className="font-bold text-slate-700">ERT: {member.ertRole}</span>
                      </div>
                    </div>

                    {isAbsence && (
                      <div className="win-sunken bg-amber-50/90 border border-amber-400 p-1.5 space-y-1.5 ml-1 rounded-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                            <span>[Standby Pool 대체자 지정]</span>
                          </span>
                          <span className={`text-[9px] font-mono font-bold ${replacementStaff ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                            {replacementStaff ? 'Cover Assigned ✓' : '대체자 미지정 (Deficit)'}
                          </span>
                        </div>
                        <select
                          value={activeReplacementId}
                          onChange={(e) => onReplacementChange(member.id, e.target.value)}
                          className="w-full win-sunken bg-white font-mono font-bold text-[10px] px-1.5 py-0.5 border border-slate-400 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Standby Pool 대체자 선택 (Select Cover) --</option>
                          {standbyPoolCandidates.filter((c) => c.id !== member.id).map((c) => {
                            const coverHours = get14dHours(c, true);
                            const isOver154 = coverHours >= 154;
                            return (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.role} • {c.teamName}) | ERT: {c.ertRole} | 14d: {coverHours}h {isOver154 ? '[⚠️ 154h Risk]' : ''}
                              </option>
                            );
                          })}
                        </select>

                        {replacementStaff && (
                          <div className="bg-emerald-50 border-2 border-emerald-500 p-1.5 rounded-xs shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                <span className="px-1 bg-emerald-700 text-white text-[8px] rounded">SWAPPED IN</span>
                                <span>{replacementStaff.name} ({replacementStaff.role})</span>
                              </span>
                              {get14dHours(replacementStaff, true) >= 154 && (
                                <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse">
                                  154h Exceeded ({get14dHours(replacementStaff, true)}h)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-800 flex justify-between mt-0.5">
                              <span>Radio: {replacementStaff.radioChannel}</span>
                              <span className="font-bold">ERT: {replacementStaff.ertRole}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
            <div className="flex justify-between">
              <span>Shift Status:</span>
              <span className="text-emerald-800 font-bold">RUNNING NORMAL</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Active PTW Permits:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                2 Hot Work / 1 Confined
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
          <div>
            <div className="bg-[#334155] text-white font-bold text-xs px-2.5 py-1 flex justify-between items-center mb-2 border-b border-slate-700 shadow-2xs">
              <span className="font-black text-xs flex items-center gap-1.5 text-white tracking-wide">
                <Clock className="w-3.5 h-3.5 text-yellow-300" />
                TEAM-C - Night Shift
              </span>
              <span className="text-[10px] font-mono bg-white text-slate-900 px-1.5 py-0.5 font-bold">
                STANDBY (20:00 - 08:00)
              </span>
            </div>

            {teamCPersonnel.filter((m) => (dailyStaffStatus[m.id]?.status && dailyStaffStatus[m.id]?.status !== 'PRESENT') || !!dailyRestAssignments[m.id]).length >= 2 && (
              <div className="mb-2 bg-red-100 border-2 border-red-500 p-1.5 text-red-950 font-bold font-mono text-[10px] flex items-center gap-1.5 animate-pulse rounded-xs">
                <AlertOctagon className="w-4 h-4 text-red-700 shrink-0" />
                <span>[CRITICAL ALERT] 2+ Personnel Off-Duty in TEAM-C</span>
              </div>
            )}

            <div className={`p-1.5 mb-2 border font-mono text-[10px] flex items-center justify-between ${teamCPersonnel.some((m) => getStaffCompetencyStatus(m).hasExpired)
              ? 'bg-red-100 border-red-400 text-red-950 font-bold'
              : teamCPersonnel.some((m) => getStaffCompetencyStatus(m).hasExpiringSoon)
                ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                : 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
              }`}>
              <span className="flex items-center gap-1">
                {teamCPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> : <ShieldAlert className="w-3.5 h-3.5 text-red-700" />}
                Safety Compliance Gate:
              </span>
              <span className={`px-1 rounded text-[9px] ${teamCPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired)
                ? 'bg-emerald-800 text-white'
                : 'bg-red-600 text-white animate-pulse'
                }`}>
                {teamCPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? '100% CLEARED' : 'EXPIRED CERT'}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {teamCPersonnel.map((member) => {
                const memberComp = getStaffCompetencyStatus(member);
                const memberDaily = dailyStaffStatus[member.id] || { status: 'PRESENT', replacementId: '' };
                const isLegacyRest = !!dailyRestAssignments[member.id];
                const legacyAssign = dailyRestAssignments[member.id];
                const isAbsence = memberDaily.status !== 'PRESENT' || isLegacyRest;
                const activeReplacementId = memberDaily.replacementId || legacyAssign?.coveringStaffId || '';
                const replacementStaff = activeReplacementId ? manpowerData.find((s) => s.id === activeReplacementId) : null;
                const hours14d = get14dHours(member);
                const is154h = hours14d >= 154;

                return (
                  <div key={member.id} className="space-y-1">
                    <div className={`${isAbsence ? 'bg-amber-50 border-2 border-amber-400 opacity-90' : 'bg-slate-100 border border-slate-300'} p-1.5`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                          {is154h && !isAbsence && (
                            <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${hours14d} hours worked in 14 days`}>
                              154h Exceeded
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={memberDaily.status}
                            onChange={(e) => onOperatorStatusChange(member.id, e.target.value as 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE')}
                            className={`win-sunken font-mono font-bold text-[9px] px-1 py-0.5 border cursor-pointer ${memberDaily.status === 'SICK'
                              ? 'bg-rose-100 text-rose-900 border-rose-400 font-black'
                              : memberDaily.status === 'EMERGENCY'
                                ? 'bg-amber-100 text-amber-950 border-amber-400 font-black'
                                : memberDaily.status === 'LEAVE'
                                  ? 'bg-purple-100 text-purple-950 border-purple-400 font-black'
                                  : 'bg-white text-slate-900 border-slate-400'
                              }`}
                            title="Change daily attendance / absence status"
                          >
                            <option value="PRESENT">PRESENT</option>
                            <option value="SICK">SICK</option>
                            <option value="EMERGENCY">EMERGENCY</option>
                            <option value="LEAVE">LEAVE</option>
                          </select>

                          {isAbsence ? (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-black font-black text-[9px] rounded shadow-xs">
                              {memberDaily.status !== 'PRESENT' ? memberDaily.status : 'REST'}
                            </span>
                          ) : memberComp.hasExpired ? (
                            <button
                              onClick={() => onNavigateToMatrix(member.id)}
                              className="px-1 bg-red-600 text-white font-bold text-[8px] rounded animate-pulse cursor-pointer"
                              title="Click to open Matrix & approve certification renewal"
                            >
                              EXPIRED CERT
                            </button>
                          ) : memberComp.hasExpiringSoon ? (
                            <button
                              onClick={() => onNavigateToMatrix(member.id)}
                              className="px-1 bg-amber-500 text-black font-bold text-[8px] rounded cursor-pointer"
                              title="Click to open Matrix"
                            >
                              REFRESH DUE
                            </button>
                          ) : (
                            <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                              CERTIFIED
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs font-bold ${member.role.toLowerCase().includes('leader') ? 'text-purple-950' : 'text-slate-900'} ${isAbsence ? 'line-through text-[#808080] opacity-75' : ''}`}>
                        {member.name}
                      </div>
                      <div className={`text-[10px] font-mono flex justify-between ${isAbsence ? 'text-[#808080]' : 'text-slate-600'}`}>
                        <span>{member.teamName} | Radio: {member.radioChannel}</span>
                        <span className="font-bold text-slate-700">ERT: {member.ertRole}</span>
                      </div>
                    </div>

                    {isAbsence && (
                      <div className="win-sunken bg-amber-50/90 border border-amber-400 p-1.5 space-y-1.5 ml-1 rounded-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                            <span>[Standby Pool 대체자 지정]</span>
                          </span>
                          <span className={`text-[9px] font-mono font-bold ${replacementStaff ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                            {replacementStaff ? 'Cover Assigned ✓' : '대체자 미지정 (Deficit)'}
                          </span>
                        </div>
                        <select
                          value={activeReplacementId}
                          onChange={(e) => onReplacementChange(member.id, e.target.value)}
                          className="w-full win-sunken bg-white font-mono font-bold text-[10px] px-1.5 py-0.5 border border-slate-400 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Standby Pool 대체자 선택 (Select Cover) --</option>
                          {standbyPoolCandidates.filter((c) => c.id !== member.id).map((c) => {
                            const coverHours = get14dHours(c, true);
                            const isOver154 = coverHours >= 154;
                            return (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.role} • {c.teamName}) | ERT: {c.ertRole} | 14d: {coverHours}h {isOver154 ? '[⚠️ 154h Risk]' : ''}
                              </option>
                            );
                          })}
                        </select>

                        {replacementStaff && (
                          <div className="bg-emerald-50 border-2 border-emerald-500 p-1.5 rounded-xs shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                <span className="px-1 bg-emerald-700 text-white text-[8px] rounded">SWAPPED IN</span>
                                <span>{replacementStaff.name} ({replacementStaff.role})</span>
                              </span>
                              {get14dHours(replacementStaff, true) >= 154 && (
                                <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse">
                                  154h Exceeded ({get14dHours(replacementStaff, true)}h)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-800 flex justify-between mt-0.5">
                              <span>Radio: {replacementStaff.radioChannel}</span>
                              <span className="font-bold">ERT: {replacementStaff.ertRole}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
            <div className="flex justify-between">
              <span>Pre-Shift Handover:</span>
              <span className="text-blue-900 font-bold">Scheduled 19:45 WIB</span>
            </div>
            <div className="flex justify-between">
              <span>Night Safety Briefing:</span>
              <span className="font-bold">Pending Muster</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
          <div>
            <div className="bg-[#334155] text-white font-bold text-xs px-2.5 py-1 flex justify-between items-center mb-2 border-b border-slate-700 shadow-2xs">
              <span className="font-black text-xs flex items-center gap-1.5 text-white tracking-wide">
                <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                TEAM-A - Rest / Standby Cycle
              </span>
              <span className="text-[10px] font-mono bg-white text-slate-900 px-1.5 py-0.5 font-bold">
                STANDBY REST
              </span>
            </div>

            <div className="p-1.5 mb-2 border border-slate-300 bg-slate-100 font-mono text-[10px] flex items-center justify-between text-slate-800">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-600" />
                Rest Status:
              </span>
              <span className="bg-slate-300 text-slate-800 px-1 rounded text-[9px] font-bold">
                STANDBY COVER POOL
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              {teamAPersonnel.map((member) => {
                const memberComp = getStaffCompetencyStatus(member);
                const inlineAssign = Object.entries(dailyStaffStatus).find(([_, st]) => st.status !== 'PRESENT' && st.replacementId === member.id);
                const legacyAssign = Object.entries(dailyRestAssignments).find(([_, a]) => a.coveringStaffId === member.id);
                const targetStaffId = inlineAssign ? inlineAssign[0] : legacyAssign ? legacyAssign[0] : null;
                const replacedStaff = targetStaffId ? manpowerData.find((s) => s.id === targetStaffId) : null;
                const isCovering = !!targetStaffId;
                const current14dHours = get14dHours(member, isCovering);
                const is154h = current14dHours >= 154;

                return (
                  <div
                    key={member.id}
                    className={`${isCovering ? 'bg-blue-50 border-2 border-blue-500' : 'bg-slate-100 border border-slate-300'} p-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                        {is154h && (
                          <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${current14dHours} hours worked in 14 days`}>
                            154h Exceeded ({current14dHours}h)
                          </span>
                        )}
                      </div>
                      {isCovering ? (
                        <span className="px-1 bg-blue-900 text-white font-bold text-[8px] rounded animate-pulse">
                          COVERING: {replacedStaff?.name ? replacedStaff.name.split(' ')[0] : 'ACTIVE'} ({replacedStaff?.teamName})
                        </span>
                      ) : memberComp.hasExpired ? (
                        <span className="px-1 bg-red-600 text-white font-bold text-[8px] rounded">
                          EXPIRED
                        </span>
                      ) : memberComp.hasExpiringSoon ? (
                        <span className="px-1 bg-amber-500 text-black font-bold text-[8px] rounded">
                          REFRESH
                        </span>
                      ) : (
                        <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                          VALID
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{member.name}</div>
                    <div className="text-[10px] font-mono text-slate-600 flex justify-between">
                      <span>{member.teamName} | Radio: {member.radioChannel}</span>
                      <span className="font-bold text-slate-700">ERT: {member.ertRole}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
            <div className="flex justify-between">
              <span>Next Shift Call:</span>
              <span className="text-slate-800 font-bold">Tomorrow 08:00 WIB</span>
            </div>
            <div className="flex justify-between items-center">
              <span>14-Day Limit (154h):</span>
              {has154hViolation ? (
                <span className="bg-rose-100 text-rose-900 px-1 py-0.5 border border-rose-300 rounded text-[9px] font-bold">
                  154h Exceeded ({exceeded154hPersonnel.map((s) => {
                    const isCover = Object.values(dailyStaffStatus).some((st) => st.status !== 'PRESENT' && st.replacementId === s.id)
                      || Object.values(dailyRestAssignments).some((assign) => assign.coveringStaffId === s.id);
                    return `${s.name.split(' ')[0]} ${get14dHours(s, isCover)}h`;
                  }).join(', ')})
                </span>
              ) : (
                <span className="text-emerald-800 font-bold">100% (Passed)</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span>Site Manager Override:</span>
              <span className={isFitToWorkOverridden ? 'text-emerald-700 font-bold text-[10px]' : has154hViolation ? 'text-rose-700 font-bold text-[10px]' : 'text-slate-500 text-[10px]'}>
                {isFitToWorkOverridden ? 'AUTHORIZED (EMP-001)' : has154hViolation ? 'REQUIRED TO LOCK' : 'NOT REQUIRED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
