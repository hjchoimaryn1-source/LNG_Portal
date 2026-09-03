import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Lock,
  UserCheck,
  UserPlus,
} from 'lucide-react';

const getErtBadgeStyle = (role: string) => {
  switch (role) {
    case 'IC': return 'bg-blue-800 text-white';        // Commander (Navy)
    case 'FA': return 'bg-emerald-600 text-white';     // First Aider (Green)
    case 'GAS': return 'bg-amber-500 text-black';      // Gas (Amber Yellow)
    case 'FC': return 'bg-rose-700 text-white';        // Fire Chief (Red)
    case 'EVAC': return 'bg-purple-700 text-white';    // Evacuation (Purple)
    default: return 'bg-slate-700 text-white';
  }
};

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
    availableHeadcount: number;
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
    <div className="w-full space-y-1.5 bg-[#d4d0c8]">
      <div className="bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] p-1.5 shrink-0 shadow-xs">
        <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-gray-400">
          <div className="flex items-center gap-2 font-bold text-[11px] text-[#0f2d4a] tracking-wide uppercase font-mono">
            <span className="text-slate-700 text-sm">■</span>
            <span>PLANT MANNING &amp; ERT (EMERGENCY RESPONSE TEAM)</span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono text-emerald-800 bg-emerald-100/80 border border-emerald-400">
            [ LEGAL QUORUM: 5/5 MET - COMPLIANT ]
          </span>
        </div>

        <div className="mt-1.5 overflow-hidden">
          <table className="w-full border border-gray-400 bg-white font-mono text-xs select-none table-fixed">
            <thead>
              <tr>
                <th className="w-40 min-w-[160px] bg-slate-700 text-slate-100 font-bold uppercase tracking-wider border-r border-b-2 border-slate-600 text-center py-1 px-2 text-[12px]">
                  METRIC / DATE
                </th>
                {rolling7Days.map((dayItem) => {
                  const isToday = dayItem.isToday;
                  const dateLabel = dayItem.dateStr.slice(5).replace('-', '/');

                  return (
                    <th
                      key={dayItem.dateStr}
                      className={`w-[12%] text-center whitespace-nowrap border-r border-b-2 border-slate-600 py-2 text-[12px] ${isToday
                        ? 'bg-sky-800 text-white font-bold'
                        : 'bg-slate-800 text-slate-200 font-semibold'
                        }`}
                    >
                      {dateLabel}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#f1f5f9] text-slate-900">
                <td className="w-40 min-w-[160px] h-10 py-1 px-2 text-center align-middle border border-slate-300 font-bold text-[12px] text-slate-900">ON-SITE POB</td>
                {rolling7Days.map((dayItem) => {
                  const availableCount = dayItem.availableHeadcount;
                  return (
                    <td
                      key={`${dayItem.dateStr}-available`}
                      className={`w-[12%] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap text-[12px] font-bold tabular-nums ${dayItem.isToday ? 'bg-sky-100 text-sky-900' : 'text-slate-900'
                        }`}
                    >
                      {availableCount} / 19
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-[#f1f5f9] text-slate-900">
                <td className="w-40 min-w-[160px] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center text-[12px] font-bold text-slate-900">
                    WORK LIMIT
                    <span className="ml-1 text-[10px] font-semibold text-slate-700">( Max 154h )</span>
                  </span>
                </td>
                {rolling7Days.map((dayItem) => {
                  return (
                    <td
                      key={`${dayItem.dateStr}-work-limit`}
                      className={`w-[12%] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap text-[11px] ${dayItem.isToday ? 'bg-sky-100' : ''
                        }`}
                    >
                      {exceeded154hPersonnel.length === 0 ? (
                        <span className="text-slate-800 font-bold">SAFE 0P</span>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 w-full justify-items-center">
                          {exceeded154hPersonnel.map((person) => (
                            <span
                              key={person.id}
                              className={`whitespace-nowrap text-amber-700 font-bold text-[11px] ${exceeded154hPersonnel.length === 1 ? 'col-span-2' : ''
                                }`}
                            >
                              {person.department === 'HSSE' ? 'HSSE' : 'OP'}-{person.id.replace(/^EMP-/, '')}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-[#f1f5f9] text-slate-900">
                <td className="w-40 min-w-[160px] h-10 py-1 px-2 text-center align-middle border border-slate-300 font-bold text-[12px] text-slate-900">ANNUAL LEAVE</td>
                {rolling7Days.map((dayItem) => {
                  const alCount = dayItem.status === 'DANGER' ? 2 : dayItem.status === 'WARNING' ? 1 : 0;

                  return (
                    <td
                      key={`${dayItem.dateStr}-al`}
                      className={`w-[12%] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap text-[11px] ${dayItem.isToday ? 'bg-sky-100' : ''
                        }`}
                    >
                      {alCount === 0 ? (
                        <span className="text-slate-500 font-bold">-</span>
                      ) : (
                        <span className="whitespace-nowrap text-[11px] font-bold text-slate-800">
                          AL {alCount}P
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-[#f1f5f9] text-slate-900">
                <td className="w-40 min-w-[160px] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center text-[12px] font-bold text-slate-900">
                    ERT
                    <span className="ml-1 text-[10px] font-semibold text-slate-700">( Min. 5P )</span>
                  </span>
                </td>
                {rolling7Days.map((dayItem) => (
                  <td
                    key={`${dayItem.dateStr}-ert`}
                    className={`w-[12%] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap text-[11px] ${dayItem.isToday ? 'bg-sky-100' : ''
                      }`}
                  >
                    {(() => {
                      const ertMetCount = [
                        ertSummary.icCount >= 1,
                        ertSummary.fireChiefCount >= 1,
                        ertSummary.firstAiderCount >= 1,
                        ertSummary.gasResponseCount >= 2,
                      ].filter(Boolean).length + 1;

                      return ertSummary.isAllERTMet ? (
                        <span className="whitespace-nowrap text-[11px] font-bold text-emerald-700">
                          Ready {ertMetCount}P
                        </span>
                      ) : (
                        <span className="whitespace-nowrap text-[11px] font-bold text-red-700">
                          Deficit {ertMetCount}P
                        </span>
                      );
                    })()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-2 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center">
          <span className="text-emerald-700 font-black mr-2 text-sm">■</span>
          <span className="uppercase tracking-wider">ON-DUTY SHIFT OPERATIONS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHandoverProtocol}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
            title="Open Shift Handover Protocol (SOP NP07-03)"
          >
            <span>SHIFT HANDOVER</span>
          </button>
          <button
            onClick={onOpenDailyRestModal}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
            title="Apply for on-duty rest/stand-down, shift swap, or assign standby cover"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-950" />
            <span>[ 👤+ Shift / Leave Request ]</span>
          </button>
          <button
            onClick={onOpenLockModal}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
            title="Open Operations Override & Impact Summary to lock daily roster in SSOT"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>[ 🔒 Submit &amp; Lock Roster ]</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
          <div>
            <div className="relative bg-[#334155] text-slate-100 px-2.5 py-1 flex items-center justify-center mb-2 border-b border-slate-700 shadow-2xs">
              <span className="text-center text-[13px] font-bold text-white uppercase tracking-wide">
                DAY SHIFT
              </span>
              <span className="absolute right-2 bg-sky-900/60 border border-sky-600/50 text-sky-200 text-[11px] font-semibold px-2 py-0.5 rounded">
                08:00 - 20:00
              </span>
            </div>

            {teamBPersonnel.filter((m) => (dailyStaffStatus[m.id]?.status && dailyStaffStatus[m.id]?.status !== 'PRESENT') || !!dailyRestAssignments[m.id]).length >= 2 && (
              <div className="mb-2 bg-red-100 border-2 border-red-500 p-1.5 text-red-950 font-bold font-mono text-[10px] flex items-center gap-1.5 animate-pulse rounded-xs">
                <AlertOctagon className="w-4 h-4 text-red-700 shrink-0" />
                <span>[CRITICAL ALERT] 2+ Personnel Off-Duty in TEAM-B</span>
              </div>
            )}

            <div className="p-1.5 mb-2 border border-slate-300 bg-slate-100 font-mono text-[10px] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">HSSE Clearance:</span>
              {teamBPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? (
                <span className="bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded">
                  [ HSSE Clearance: 100% PASS ]
                </span>
              ) : (
                <span className="bg-amber-950/40 border border-amber-500 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded">
                  [ HSSE Clearance: PENDING ]
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 p-1.5 border border-slate-300 bg-white font-mono text-[10px]">
              <div className="flex flex-col">
                <span className="text-slate-500 mb-0.5">Shift Status:</span>
                <span className="text-emerald-800 font-bold">RUNNING NORMAL</span>
              </div>
              <div className="flex flex-col border-l border-slate-300 pl-2">
                <span className="text-slate-500 mb-0.5">Active PTW Permits:</span>
                <span className="font-bold text-slate-800 truncate">2 Hot Work / 1 Confined</span>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-700 mb-1">■ ON-DUTY OPERATIONS (3P)</div>
            <div className="space-y-2 mb-3">
              {teamBPersonnel.map((member, index) => {
                const memberComp = getStaffCompetencyStatus(member);
                const memberDaily = dailyStaffStatus[member.id] || { status: 'PRESENT', replacementId: '' };
                const isLegacyRest = !!dailyRestAssignments[member.id];
                const legacyAssign = dailyRestAssignments[member.id];
                const isAbsence = memberDaily.status !== 'PRESENT' || isLegacyRest;
                const activeReplacementId = memberDaily.replacementId || legacyAssign?.coveringStaffId || '';
                const replacementStaff = activeReplacementId ? manpowerData.find((s) => s.id === activeReplacementId) : null;
                const hours14d = get14dHours(member);
                const is154h = hours14d >= 154;

                const rawErtRole = !isAbsence ? (index === 0 ? 'IC' : index === 1 ? 'FA' : 'GAS') : null;
                const ertRoleBadge = rawErtRole ? `[${rawErtRole}]` : null;

                return (
                  <div key={member.id} className="space-y-1">
                    <div className={`${isAbsence ? 'bg-amber-50 border-2 border-amber-400 opacity-90' : 'bg-slate-100 border border-slate-300'} p-1.5 flex flex-col gap-y-1`}>
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">{member.role}</span>
                        <div className="flex items-center gap-1.5 justify-end shrink-0">
                          {is154h && !isAbsence && (
                            <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${hours14d} hours worked in 14 days`}>
                              154h Exceeded
                            </span>
                          )}
                          {!isAbsence && (
                            <span className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 text-xs rounded-none">
                              ON-DUTY
                            </span>
                          )}
                          {isAbsence && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-black font-black text-[9px] rounded shadow-xs">
                              {memberDaily.status !== 'PRESENT' ? memberDaily.status : 'REST'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-end gap-2">
                        <div className={`font-bold text-indigo-950 text-sm truncate ${isAbsence ? 'line-through text-[#808080] opacity-75' : ''}`}>
                          {member.name}
                        </div>
                        <div className="flex items-center gap-1.5 justify-end shrink-0">
                          {ertRoleBadge && rawErtRole && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${getErtBadgeStyle(rawErtRole)}`}>
                              {ertRoleBadge}
                            </span>
                          )}
                          {isAbsence ? null : memberComp.hasExpired ? (
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
                    </div>

                    {isAbsence && (
                      <div className="win-sunken bg-amber-50/90 border border-amber-400 p-1.5 space-y-1.5 ml-1 rounded-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                            <span>[Standby Pool 대체자 지정]</span>
                          </span>
                          <span className={`text-[9px] font-mono font-bold ${replacementStaff ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                            {replacementStaff ? 'Cover Assigned' : '대체자 미지정 (Deficit)'}
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
                                {c.name} ({c.role} • {c.teamName}) | ERT: {c.ertRole} | 14d: {coverHours}h {isOver154 ? '[154h Risk]' : ''}
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 mt-3 mb-1">■ ERT ON-SITE SUPPORT (2P)</div>
          <div className="space-y-1">
            <div className="bg-slate-100 border border-slate-300 p-1.5 flex flex-col gap-y-1">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">FIRE CHIEF (HSSE)</span>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 text-xs rounded-none">
                    ON-DUTY
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end gap-2">
                <div className="font-bold text-indigo-950 text-sm truncate">
                  Edi Hermawan
                </div>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${getErtBadgeStyle('FC')}`}>
                    [FC]
                  </span>
                  <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                    CERTIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="bg-slate-100 border border-slate-300 p-1.5 flex flex-col gap-y-1">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">EVACUATION LEAD (HSSE)</span>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 text-xs rounded-none">
                    ON-DUTY
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end gap-2">
                <div className="font-bold text-indigo-950 text-sm truncate">
                  Bambang
                </div>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${getErtBadgeStyle('EVAC')}`}>
                    [EVAC]
                  </span>
                  <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                    CERTIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
          <div>
            <div className="relative bg-[#334155] text-slate-100 px-2.5 py-1 flex items-center justify-center mb-2 border-b border-slate-700 shadow-2xs">
              <span className="text-center text-[13px] font-bold text-white uppercase tracking-wide">
                NIGHT SHIFT
              </span>
              <span className="absolute right-2 bg-sky-900/60 border border-sky-600/50 text-sky-200 text-[11px] font-semibold px-2 py-0.5 rounded">
                20:00 - 08:00
              </span>
            </div>

            {teamCPersonnel.filter((m) => (dailyStaffStatus[m.id]?.status && dailyStaffStatus[m.id]?.status !== 'PRESENT') || !!dailyRestAssignments[m.id]).length >= 2 && (
              <div className="mb-2 bg-red-100 border-2 border-red-500 p-1.5 text-red-950 font-bold font-mono text-[10px] flex items-center gap-1.5 animate-pulse rounded-xs">
                <AlertOctagon className="w-4 h-4 text-red-700 shrink-0" />
                <span>[CRITICAL ALERT] 2+ Personnel Off-Duty in TEAM-C</span>
              </div>
            )}

            <div className="p-1.5 mb-2 border border-slate-300 bg-slate-100 font-mono text-[10px] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">HSSE Clearance:</span>
              {teamCPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? (
                <span className="bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded">
                  [ HSSE Clearance: 100% PASS ]
                </span>
              ) : (
                <span className="bg-amber-950/40 border border-amber-500 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded">
                  [ HSSE Clearance: PENDING ]
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 p-1.5 border border-slate-300 bg-white font-mono text-[10px]">
              <div className="flex flex-col">
                <span className="text-slate-500 mb-0.5">Pre-Shift Handover:</span>
                <span className="text-blue-900 font-bold truncate">Scheduled 19:45 WIB</span>
              </div>
              <div className="flex flex-col border-l border-slate-300 pl-2">
                <span className="text-slate-500 mb-0.5">Night Safety Briefing:</span>
                <span className="font-bold text-slate-800 truncate">Pending Muster</span>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-700 mb-1">■ ON-DUTY OPERATIONS (3P)</div>
            <div className="space-y-2 mb-3">
              {teamCPersonnel.map((member, index) => {
                const memberComp = getStaffCompetencyStatus(member);
                const memberDaily = dailyStaffStatus[member.id] || { status: 'PRESENT', replacementId: '' };
                const isLegacyRest = !!dailyRestAssignments[member.id];
                const legacyAssign = dailyRestAssignments[member.id];
                const isAbsence = memberDaily.status !== 'PRESENT' || isLegacyRest;
                const activeReplacementId = memberDaily.replacementId || legacyAssign?.coveringStaffId || '';
                const replacementStaff = activeReplacementId ? manpowerData.find((s) => s.id === activeReplacementId) : null;
                const hours14d = get14dHours(member);
                const is154h = hours14d >= 154;

                const rawErtRole = !isAbsence ? (index === 0 ? 'IC' : index === 1 ? 'FA' : 'GAS') : null;
                const ertRoleBadge = rawErtRole ? `[${rawErtRole}]` : null;

                return (
                  <div key={member.id} className="space-y-1">
                    <div className={`${isAbsence ? 'bg-amber-50 border-2 border-amber-400 opacity-90' : 'bg-slate-100 border border-slate-300'} p-1.5 flex flex-col gap-y-1`}>
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">{member.role}</span>
                        <div className="flex items-center gap-1.5 justify-end shrink-0">
                          {is154h && !isAbsence && (
                            <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${hours14d} hours worked in 14 days`}>
                              154h Exceeded
                            </span>
                          )}
                          {!isAbsence && (
                            <span className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 text-xs rounded-none">
                              ON-DUTY
                            </span>
                          )}
                          {isAbsence && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-black font-black text-[9px] rounded shadow-xs">
                              {memberDaily.status !== 'PRESENT' ? memberDaily.status : 'REST'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-end gap-2">
                        <div className={`font-bold text-indigo-950 text-sm truncate ${isAbsence ? 'line-through text-[#808080] opacity-75' : ''}`}>
                          {member.name}
                        </div>
                        <div className="flex items-center gap-1.5 justify-end shrink-0">
                          {ertRoleBadge && rawErtRole && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${getErtBadgeStyle(rawErtRole)}`}>
                              {ertRoleBadge}
                            </span>
                          )}
                          {isAbsence ? null : memberComp.hasExpired ? (
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
                    </div>

                    {isAbsence && (
                      <div className="win-sunken bg-amber-50/90 border border-amber-400 p-1.5 space-y-1.5 ml-1 rounded-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                            <span>[Standby Pool 대체자 지정]</span>
                          </span>
                          <span className={`text-[9px] font-mono font-bold ${replacementStaff ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                            {replacementStaff ? 'Cover Assigned' : '대체자 미지정 (Deficit)'}
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
                                {c.name} ({c.role} • {c.teamName}) | ERT: {c.ertRole} | 14d: {coverHours}h {isOver154 ? '[154h Risk]' : ''}
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 mt-3 mb-1">■ ERT ON-SITE SUPPORT (2P)</div>
          <div className="space-y-1">
            <div className="bg-slate-100 border border-slate-300 p-1.5 flex flex-col gap-y-1">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">FIRE CHIEF (HSSE)</span>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 text-xs rounded-none">
                    ON-DUTY
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end gap-2">
                <div className="font-bold text-indigo-950 text-sm truncate">
                  Edi Hermawan
                </div>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${getErtBadgeStyle('FC')}`}>
                    [FC]
                  </span>
                  <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                    CERTIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="bg-slate-100 border border-slate-300 p-1.5 flex flex-col gap-y-1">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">EVACUATION LEAD (HSSE)</span>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 text-xs rounded-none">
                    ON-DUTY
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end gap-2">
                <div className="font-bold text-indigo-950 text-sm truncate">
                  Bambang
                </div>
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${getErtBadgeStyle('EVAC')}`}>
                    [EVAC]
                  </span>
                  <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                    CERTIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col h-full">
          <div className="relative bg-[#334155] text-slate-100 px-2.5 py-1 flex items-center justify-center mb-2 border-b border-slate-700 shadow-2xs shrink-0">
            <span className="text-center text-[13px] font-bold text-white uppercase tracking-wide">
              REST / STAND BY
            </span>
            <span className="absolute right-2 bg-sky-900/60 border border-sky-600/50 text-sky-200 text-[11px] font-semibold px-2 py-0.5 rounded">
              STANDBY POOL
            </span>
          </div>

          <div className="overflow-y-auto max-h-[650px] pr-1 space-y-4">
            {/* SHIFT REST */}
            {(() => {
              const restPersonnelList = teamAPersonnel.filter(m => !['LEAVE', 'SICK'].includes(dailyStaffStatus[m.id]?.status || ''));
              return (
                <div>
                  <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-800 uppercase font-mono tracking-wide mb-2">
                    <span className="text-slate-600">■</span>
                    <span>SHIFT REST ({restPersonnelList.length}P)</span>
                  </div>
                  <div className="space-y-1.5">
                    {restPersonnelList.length > 0 ? restPersonnelList.map(member => (
                      <div key={member.id} className="bg-slate-100 border border-slate-300 p-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300 shadow-xs">RESTING</span>
                        </div>
                        <div className={`text-xs font-bold mt-0.5 ${member.role.toLowerCase().includes('leader') ? 'text-blue-950' : 'text-slate-900'}`}>
                          {member.name}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-[10px] text-slate-500 py-2 border border-dashed border-slate-300 bg-slate-50 font-mono">
                        None (0P)
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* LEAVE / R&R */}
            {(() => {
              const leavePersonnelList = manpowerData.filter(m => dailyStaffStatus[m.id]?.status === 'LEAVE');
              return (
                <div>
                  <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-800 uppercase font-mono tracking-wide mb-2">
                    <span className="text-slate-600">■</span>
                    <span>LEAVE / R&amp;R ({leavePersonnelList.length}P)</span>
                  </div>
                  <div className="space-y-1.5">
                    {leavePersonnelList.length > 0 ? leavePersonnelList.map(member => (
                      <div key={member.id} className="bg-purple-50 border border-purple-300 p-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                          <span className="text-[9px] font-bold text-purple-900 bg-purple-200 px-1.5 py-0.5 rounded border border-purple-300 shadow-xs">ON LEAVE</span>
                        </div>
                        <div className={`text-xs font-bold mt-0.5 ${member.role.toLowerCase().includes('leader') ? 'text-blue-950' : 'text-slate-900'}`}>
                          {member.name}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-[10px] text-slate-500 py-2 border border-dashed border-slate-300 bg-slate-50 font-mono">
                        None (0P)
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* SICK / MEDICAL */}
            {(() => {
              const sickPersonnelList = manpowerData.filter(m => dailyStaffStatus[m.id]?.status === 'SICK');
              return (
                <div>
                  <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-800 uppercase font-mono tracking-wide mb-2">
                    <span className="text-slate-600">■</span>
                    <span>SICK / MEDICAL ({sickPersonnelList.length}P)</span>
                  </div>
                  <div className="space-y-1.5">
                    {sickPersonnelList.length > 0 ? sickPersonnelList.map(member => (
                      <div key={member.id} className="bg-rose-50 border border-rose-300 p-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                          <span className="text-[9px] font-bold text-rose-900 bg-rose-200 px-1.5 py-0.5 rounded border border-rose-300 shadow-xs">SICK</span>
                        </div>
                        <div className={`text-xs font-bold mt-0.5 ${member.role.toLowerCase().includes('leader') ? 'text-blue-950' : 'text-slate-900'}`}>
                          {member.name}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-[10px] text-emerald-700 py-2 border border-dashed border-emerald-300 bg-emerald-50 font-mono font-bold">
                        Fit for Duty
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
