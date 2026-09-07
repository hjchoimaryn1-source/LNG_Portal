import React, { useMemo, useCallback, useEffect, useState } from 'react';

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
import { StaffPersonnel, ShiftCode } from '../../../types/lng';
import { useActualDutyLogs } from '../hooks/useActualDutyLogs';
import { useManagerOverrides } from '../hooks/useManagerOverrides';
import { projectStaffMonthlyRoster } from './MonthlyPlanTab';

interface DailyBoardTabProps {
  manpowerData: StaffPersonnel[];
  dailyStaffStatus: Record<string, { status: 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE'; replacementId: string }>;
  dailyRestAssignments: Record<string, { reason: string; coveringStaffId: string; approvedAt: string }>;
  standbyPoolCandidates: StaffPersonnel[];
  exceeded154hPersonnel: StaffPersonnel[];
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
  standbyPoolCandidates,
  exceeded154hPersonnel,
  rolling7Days,
  codBaselineDate,
  isErtGateExpanded,
  isFatigueExpanded,
  isFitToWorkOverridden,
  onToggleErtGate,
  onToggleFatigue,
  onOpenHandoverProtocol,
  onOpenDailyRestModal,
  onApplyCodRoster,
  onSetCodBaselineDate,
  onOpenFitToWorkModal,
  onOperatorStatusChange,
  onReplacementChange,
  onNavigateToMatrix,
  get14dHours,
}: DailyBoardTabProps) {
  const { actualMap } = useActualDutyLogs();
  const { overrideRecords } = useManagerOverrides();

  // Prefer todayStr as default on mount, while allowing manual selection via state
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [userSelectedDate, setUserSelectedDate] = useState<string | null>(null);
  const activeDateStr = userSelectedDate || (codBaselineDate && codBaselineDate !== '2026-09-15' ? codBaselineDate : todayStr);

  useEffect(() => {
    if (!codBaselineDate || codBaselineDate === '2026-09-15') {
      onSetCodBaselineDate?.(todayStr);
    }
  }, [codBaselineDate, todayStr, onSetCodBaselineDate]);

  const resolveShiftForDate = useCallback(
    (staff: StaffPersonnel, dateStr: string): ShiftCode => {
      // 1. Check override records first (Priority 1 for user overrides)
      const override = overrideRecords[`${staff.id}_${dateStr}`];
      if (override && override.assignedShift) {
        return override.assignedShift;
      }

      // 2. Check actual logs (Priority 2 for actual duty records)
      const actualLog = actualMap[`${staff.id}_${dateStr}`];
      if (actualLog) {
        return actualLog.actualShift;
      }

      // 3. Forward Plan Projection from master roster
      const parts = dateStr.split('-').map(Number);
      const year = parts[0] || 2026;
      const monthIndex = (parts[1] || 9) - 1; // 0-based month index (8 for Sept)
      const day = parts[2] || 1;
      const roster = projectStaffMonthlyRoster(staff, year, monthIndex);
      return roster[day - 1] || 'D';
    },
    [actualMap, overrideRecords]
  );

  const getStaffDepartmentCategory = useCallback((m: StaffPersonnel): 'OPERATIONS' | 'MAINTENANCE' | 'HSSE' | 'LOGISTICS' | 'HR_GA' => {
    if (m.id === 'BSG259524') return 'OPERATIONS';
    const r = (m.role || (m as any).position || '').toUpperCase();
    if (r.includes('OPERATION LEADER') || r.includes('OPERATIONS LEADER')) return 'OPERATIONS';

    const d = (m.department || '').toUpperCase();
    const t = (m.teamName || (m as any).team || '').toUpperCase();

    if (d.includes('HSSE') || r.includes('HSE') || r.includes('SAFETY')) return 'HSSE';
    if (d.includes('MAINT') || r.includes('MECHANIC') || r.includes('E&I')) return 'MAINTENANCE';
    if (d.includes('CARGO') || d.includes('LOGIST') || r.includes('CRANE') || t.includes('CARGO')) return 'LOGISTICS';
    if (d.includes('HR') || d.includes('GA') || r.includes('SITE MANAGER') || m.id === 'BSG259529' || t === 'MANAGEMENT') return 'HR_GA';
    return 'OPERATIONS';
  }, []);


  // Dynamically derived active duty lists for the active date (Plant-wide all departments)
  const { dayShiftPersonnel, nightShiftPersonnel, restPersonnelList, leavePersonnelList } = useMemo(() => {
    const dayList: StaffPersonnel[] = [];
    const nightList: StaffPersonnel[] = [];
    const restList: StaffPersonnel[] = [];
    const leaveList: StaffPersonnel[] = [];

    manpowerData.forEach((staff) => {
      const shift = resolveShiftForDate(staff, activeDateStr);
      const isLeaveStatus = activeDateStr === todayStr && dailyStaffStatus[staff.id]?.status === 'LEAVE';
      const isSickStatus = activeDateStr === todayStr && dailyStaffStatus[staff.id]?.status === 'SICK';

      // 1. Sick / Medical
      if (isSickStatus) {
        return;
      }

      // 2. Leave / R&R (Strict mutually exclusive partition)
      if (shift === 'OFF' || shift === 'AL' || (shift as string) === 'Off' || isLeaveStatus) {
        leaveList.push(staff);
        return;
      }

      // 3. Shift Rest (R)
      if (shift === 'R') {
        restList.push(staff);
        return;
      }

      // 4. Night Shift (N)
      if (shift === 'N') {
        nightList.push(staff);
        return;
      }

      // 5. Day Shift (D)
      if (shift === 'D') {
        dayList.push(staff);
        return;
      }

      // Default fallback
      dayList.push(staff);
    });

    return {
      dayShiftPersonnel: dayList,
      nightShiftPersonnel: nightList,
      restPersonnelList: restList,
      leavePersonnelList: leaveList,
    };
  }, [
    manpowerData,
    activeDateStr,
    todayStr,
    resolveShiftForDate,
    dailyStaffStatus,
  ]);


  const sickPersonnelList = useMemo(() => {
    return manpowerData.filter((m) => dailyStaffStatus[m.id]?.status === 'SICK');
  }, [manpowerData, dailyStaffStatus]);

  // Compute date-scoped metrics for each day in rolling7Days
  const dateMetricsMap = useMemo(() => {
    const map: Record<
      string,
      {
        onSiteCount: number;
        alCount: number;
        ertCount: number;
        isErtMet: boolean;
        exceededStaff: StaffPersonnel[];
      }
    > = {};

    rolling7Days.forEach((dayItem) => {
      const dateStr = dayItem.dateStr;
      let onSiteCount = 0;
      let alCount = 0;
      let ertCount = 0;

      manpowerData.forEach((staff) => {
        const shift = resolveShiftForDate(staff, dateStr);
        const isOff = shift === 'OFF' || shift === 'AL' || (shift as string) === 'Off';
        const isOnSite = !isOff;

        if (isOnSite) {
          onSiteCount++;
          if (staff.ertRole && staff.ertRole !== 'None') {
            ertCount++;
          }
        } else {
          alCount++;
        }
      });

      // Work limit check scoped to dayItem.dateStr
      const exceededStaff = manpowerData.filter(
        (staff) => get14dHours(staff, false, dateStr) > 154
      );

      map[dateStr] = {
        onSiteCount,
        alCount,
        ertCount,
        isErtMet: ertCount >= 5,
        exceededStaff,
      };
    });

    return map;
  }, [rolling7Days, manpowerData, resolveShiftForDate, get14dHours]);

  // Rigorous Day ERT Support: Selected ONLY from active Day on-duty personnel holding valid credentials
  const dayIncidentCommander = useMemo(() => {
    return (
      dayShiftPersonnel.find(
        (m) =>
          m.ertRole === 'Incident Commander' ||
          /incident commander/i.test(m.ertRole || '') ||
          m.id === 'BSG259529' ||
          /site manager/i.test(m.role || '')
      ) || null
    );
  }, [dayShiftPersonnel]);

  const dayFireChief = useMemo(() => {
    return (
      dayShiftPersonnel.find(
        (m) =>
          m.id !== dayIncidentCommander?.id &&
          (m.ertRole === 'Fire Chief' ||
            /fire chief/i.test(m.ertRole || '') ||
            (getStaffDepartmentCategory(m) === 'HSSE' && m.id === 'BSG259641') ||
            getStaffDepartmentCategory(m) === 'HSSE')
      ) ||
      dayShiftPersonnel.find((m) => m.id !== dayIncidentCommander?.id && m.ertRole && m.ertRole !== 'None') ||
      null
    );
  }, [dayShiftPersonnel, dayIncidentCommander, getStaffDepartmentCategory]);

  const dayEvacLead = useMemo(() => {
    return (
      dayShiftPersonnel.find(
        (m) =>
          m.id !== dayIncidentCommander?.id &&
          m.id !== dayFireChief?.id &&
          (/evac/i.test(m.ertRole || '') ||
            m.id === 'BSG259919' ||
            getStaffDepartmentCategory(m) === 'HSSE' ||
            (m.ertRole && m.ertRole !== 'None'))
      ) || null
    );
  }, [dayShiftPersonnel, dayIncidentCommander, dayFireChief, getStaffDepartmentCategory]);

  // Rigorous Night ERT Support: Selected ONLY from active Night roster holding valid certifications (No OFF/AL/R allowed)
  const nightIncidentCommander = useMemo(() => {
    return (
      nightShiftPersonnel.find(
        (m) =>
          m.ertRole === 'Incident Commander' ||
          /incident commander/i.test(m.ertRole || '') ||
          /leader/i.test(m.role || '')
      ) ||
      nightShiftPersonnel[0] ||
      null
    );
  }, [nightShiftPersonnel]);

  const nightFireChief = useMemo(() => {
    return (
      nightShiftPersonnel.find(
        (m) =>
          m.id !== nightIncidentCommander?.id &&
          (m.ertRole === 'Fire Chief' ||
            /fire chief/i.test(m.ertRole || '') ||
            (m.ertRole && m.ertRole !== 'None'))
      ) ||
      nightShiftPersonnel.find((m) => m.id !== nightIncidentCommander?.id) ||
      null
    );
  }, [nightShiftPersonnel, nightIncidentCommander]);

  const nightEvacLead = useMemo(() => {
    return (
      nightShiftPersonnel.find(
        (m) =>
          m.id !== nightIncidentCommander?.id &&
          m.id !== nightFireChief?.id &&
          (/evac/i.test(m.ertRole || '') || (m.ertRole && m.ertRole !== 'None'))
      ) ||
      nightShiftPersonnel.find((m) => m.id !== nightIncidentCommander?.id && m.id !== nightFireChief?.id) ||
      null
    );
  }, [nightShiftPersonnel, nightIncidentCommander, nightFireChief]);

  // Unique legally deployed ERT certified heads on site today (strictly no double-counting)
  const uniqueErtDeployed = useMemo(() => {
    const deployedIds = new Set<string>();

    dayShiftPersonnel.forEach((m) => {
      const st = dailyStaffStatus[m.id];
      if (!st || st.status === 'PRESENT') {
        deployedIds.add(m.id);
      } else if (st.replacementId) {
        deployedIds.add(st.replacementId);
      }
    });

    nightShiftPersonnel.forEach((m) => {
      const st = dailyStaffStatus[m.id];
      if (!st || st.status === 'PRESENT') {
        deployedIds.add(m.id);
      } else if (st.replacementId) {
        deployedIds.add(st.replacementId);
      }
    });

    const certifiedStaff = Array.from(deployedIds)
      .map((id) => manpowerData.find((s) => s.id === id))
      .filter((s): s is StaffPersonnel => !!s && !!s.ertRole && s.ertRole !== 'None');

    return {
      count: certifiedStaff.length,
      staff: certifiedStaff,
      hasQuorum: certifiedStaff.length >= 5,
    };
  }, [dayShiftPersonnel, nightShiftPersonnel, dailyStaffStatus, manpowerData]);

  const totalStaffCount = manpowerData.length;
  const dayCount = dayShiftPersonnel.length;
  const nightCount = nightShiftPersonnel.length;
  const restCount = restPersonnelList.length + leavePersonnelList.length + sickPersonnelList.length;
  const onDutyPersonnel = useMemo(() => [...dayShiftPersonnel, ...nightShiftPersonnel], [dayShiftPersonnel, nightShiftPersonnel]);
  const isClearancePass = useMemo(() => {
    return onDutyPersonnel.every((m) => {
      const comp = getStaffCompetencyStatus(m);
      return !comp.hasExpired && !(m.competencies || []).some((c) => c.status === 'EXPIRED' || c.expiryDate < '2026-09-07');
    });
  }, [onDutyPersonnel]);

  const masterTableRows = useMemo(() => {
    const rows: Array<{
      member: StaffPersonnel;
      shiftType: 'DAY' | 'NIGHT' | 'STANDBY' | 'LEAVE';
      shiftBadgeText: string;
      shiftBadgeClass: string;
      deptName: string;
      ertRole: 'IC' | 'FC' | 'FA' | 'GAS' | '-';
      isExpired: boolean;
      status: 'ON-DUTY' | 'SICK' | 'LEAVE' | 'REST';
      statusClass: string;
    }> = [];

    const getDeptLabel = (m: StaffPersonnel): string => {
      const team = m.teamName || (m as any).team || '';
      if (team === 'TEAM-A') return 'OP Alpha';
      if (team === 'TEAM-B') return 'OP Bravo';
      if (team === 'TEAM-C') return 'OP Charlie';
      if (team.includes('Team A')) return 'OP Alpha';
      if (m.department === 'MAINTENANCE') return 'Maintenance';
      if (m.department === 'HSSE') return 'HSSE';
      if (m.department === 'LOGISTICS' || (m.department as string) === 'Cargo Logistic' || team.includes('Cargo')) return 'Logistics';
      if (m.department === 'HR_GA') return 'HR / GA';
      return (m.department as string) || team || 'Operations';
    };

    const getErtRole = (m: StaffPersonnel): 'IC' | 'FC' | 'FA' | 'GAS' | '-' => {
      const r = (m.ertRole || '') as string;
      if (/incident commander/i.test(r) || r === 'IC') return 'IC';
      if (/fire chief/i.test(r) || r === 'FC') return 'FC';
      if (/first aider/i.test(r) || r === 'FA') return 'FA';
      if (/gas leak/i.test(r) || r === 'GAS') return 'GAS';
      return '-';
    };

    const addMemberRow = (m: StaffPersonnel, shiftType: 'DAY' | 'NIGHT' | 'STANDBY' | 'LEAVE') => {
      const comp = getStaffCompetencyStatus(m);
      const isExpired = comp.hasExpired || (m.competencies || []).some((c) => c.status === 'EXPIRED' || c.expiryDate < '2026-09-07');
      const daily = dailyStaffStatus[m.id];
      const hasCover = !!dailyRestAssignments[m.id];

      let status: 'ON-DUTY' | 'SICK' | 'LEAVE' | 'REST' = 'ON-DUTY';
      if (daily?.status === 'SICK') status = 'SICK';
      else if (daily?.status === 'LEAVE' || shiftType === 'LEAVE') status = 'LEAVE';
      else if (hasCover || shiftType === 'STANDBY') status = 'REST';

      let shiftBadgeText = 'Day';
      let shiftBadgeClass = 'bg-amber-100 text-amber-900 border border-amber-400';
      if (shiftType === 'NIGHT') {
        shiftBadgeText = 'Night';
        shiftBadgeClass = 'bg-indigo-100 text-indigo-900 border border-indigo-400';
      } else if (shiftType === 'STANDBY') {
        shiftBadgeText = 'Standby';
        shiftBadgeClass = 'bg-sky-100 text-sky-900 border border-sky-400';
      } else if (shiftType === 'LEAVE') {
        shiftBadgeText = 'Leave';
        shiftBadgeClass = 'bg-slate-200 text-slate-700 border border-slate-400';
      }

      let statusClass = 'bg-emerald-100 text-emerald-900 border border-emerald-400';
      if (status === 'SICK') {
        statusClass = 'bg-rose-100 text-rose-900 border border-rose-400';
      } else if (status === 'LEAVE') {
        statusClass = 'bg-slate-200 text-slate-700 border border-slate-400';
      } else if (status === 'REST') {
        statusClass = 'bg-blue-100 text-blue-900 border border-blue-400';
      }

      rows.push({
        member: m,
        shiftType,
        shiftBadgeText,
        shiftBadgeClass,
        deptName: getDeptLabel(m),
        ertRole: getErtRole(m),
        isExpired,
        status,
        statusClass,
      });
    };

    // 1) Active Day Shift
    dayShiftPersonnel.forEach((m) => addMemberRow(m, 'DAY'));
    // 2) Active Night Shift
    nightShiftPersonnel.forEach((m) => addMemberRow(m, 'NIGHT'));
    // 3) Standby / Rest
    restPersonnelList.forEach((m) => addMemberRow(m, 'STANDBY'));
    // 4) Leave & Sick
    leavePersonnelList.forEach((m) => addMemberRow(m, 'LEAVE'));
    sickPersonnelList.forEach((m) => {
      if (!rows.some((r) => r.member.id === m.id)) {
        addMemberRow(m, 'LEAVE');
      }
    });

    return rows;
  }, [dayShiftPersonnel, nightShiftPersonnel, restPersonnelList, leavePersonnelList, sickPersonnelList, dailyStaffStatus, dailyRestAssignments]);

  return (
    <div className="w-full space-y-1.5 bg-[#d4d0c8]">
      <div className="bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] p-1.5 shrink-0 shadow-xs">
        <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-gray-400">
          <div className="flex items-center gap-2 font-bold text-[11px] text-[#0f2d4a] tracking-wide uppercase font-mono">
            <span className="text-slate-700 text-sm">■</span>
            <span>PLANT MANNING &amp; ERT (EMERGENCY RESPONSE TEAM)</span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-mono ${
            uniqueErtDeployed.hasQuorum
              ? 'text-emerald-800 bg-emerald-100/80 border border-emerald-400'
              : 'text-rose-800 bg-rose-100/80 border border-rose-400'
          }`}>
            [ LEGAL QUORUM: {uniqueErtDeployed.count}/5 {uniqueErtDeployed.hasQuorum ? 'MET - COMPLIANT' : 'DEFICIT'} ]
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
                  const metric = dateMetricsMap[dayItem.dateStr];
                  const onSite = metric ? metric.onSiteCount : dayItem.availableHeadcount;
                  return (
                    <td
                      key={`${dayItem.dateStr}-available`}
                      className={`w-[12%] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap text-[12px] font-bold tabular-nums ${dayItem.isToday ? 'bg-sky-100 text-sky-900' : 'text-slate-900'
                        }`}
                    >
                      {onSite} / {manpowerData.length}
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
                  const metric = dateMetricsMap[dayItem.dateStr];
                  const dateExceeded = metric ? metric.exceededStaff : [];

                  return (
                    <td
                      key={`${dayItem.dateStr}-work-limit`}
                      className={`w-[12%] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap text-[11px] ${dayItem.isToday ? 'bg-sky-100' : ''
                        }`}
                    >
                      {dateExceeded.length === 0 ? (
                        <span className="text-slate-800 font-bold">SAFE 0P</span>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 w-full justify-items-center">
                          {dateExceeded.map((person) => (
                            <span
                              key={person.id}
                              className={`whitespace-nowrap text-amber-700 font-bold text-[11px] ${dateExceeded.length === 1 ? 'col-span-2' : ''
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
                  const metric = dateMetricsMap[dayItem.dateStr];
                  const alCount = metric ? metric.alCount : 0;

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
                {rolling7Days.map((dayItem) => {
                  const metric = dateMetricsMap[dayItem.dateStr];
                  const dateErtCount = metric ? metric.ertCount : 0;
                  const isMet = metric ? metric.isErtMet : false;

                  return (
                    <td
                      key={`${dayItem.dateStr}-ert`}
                      className={`w-[12%] h-10 py-1 px-2 text-center align-middle border border-slate-300 whitespace-nowrap text-[11px] ${dayItem.isToday ? 'bg-sky-100' : ''
                        }`}
                    >
                      {isMet ? (
                        <span className="whitespace-nowrap text-[11px] font-bold text-emerald-700">
                          Ready {dateErtCount}P
                        </span>
                      ) : (
                        <span className="whitespace-nowrap text-[11px] font-bold text-red-700">
                          Deficit {dateErtCount}P
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-2 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 font-black mr-1 text-sm">■</span>
          <span className="uppercase tracking-wider">ON-DUTY SHIFT OPERATIONS</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={activeDateStr || todayStr}
            onChange={(e) => {
              setUserSelectedDate(e.target.value);
              onSetCodBaselineDate?.(e.target.value);
            }}
            className="bg-white text-slate-900 font-mono text-[11px] font-bold px-2 py-0.5 border border-t-slate-600 border-l-slate-600 border-b-white border-r-white shadow-inner focus:outline-hidden cursor-pointer"
          />
          <button
            onClick={onOpenHandoverProtocol}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 cursor-pointer tracking-wider"
            title="Open Shift Handover Protocol (SOP NP07-03)"
          >
            <span>SHIFT HANDOVER</span>
          </button>
          <button
            onClick={onOpenDailyRestModal}
            className="win-btn text-xs font-bold px-3 py-1 text-slate-900 cursor-pointer tracking-wider"
            title="Apply for on-duty rest/stand-down, shift swap, or assign standby cover"
          >
            <span>Daily Rest Request</span>
          </button>
        </div>
      </div>

      <div className="bg-[#d4d0c8] border border-slate-400 p-1.5 shadow-inner flex flex-wrap items-center justify-between font-mono text-[11px] text-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <span>Total Staff: <strong className="text-blue-950 font-bold">{totalStaffCount}</strong></span>
          <span className="text-slate-400">|</span>
          <span>On-Duty (Day): <strong className="text-amber-900 font-bold">{dayCount}</strong></span>
          <span className="text-slate-400">|</span>
          <span>On-Duty (Night): <strong className="text-indigo-950 font-bold">{nightCount}</strong></span>
          <span className="text-slate-400">|</span>
          <span>Rest/Leave: <strong className="text-slate-700 font-bold">{restCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-semibold">Clearance:</span>
          {isClearancePass ? (
            <span className="text-emerald-800 font-bold bg-emerald-100 border border-emerald-400 px-1.5 py-0.5 rounded text-[10px] shadow-2xs">[PASS]</span>
          ) : (
            <span className="text-amber-900 font-bold bg-amber-100 border border-amber-400 px-1.5 py-0.5 rounded text-[10px] shadow-2xs">[PENDING]</span>
          )}
        </div>
      </div>

      <div className="bg-white border-2 border-slate-400 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400 text-[10px] font-bold text-slate-800 uppercase">
              <th className="py-1.5 px-2 border-r border-slate-300 w-24 text-center">SHIFT</th>
              <th className="py-1.5 px-2 border-r border-slate-300 w-44">DEPT</th>
              <th className="py-1.5 px-2 border-r border-slate-300 w-48">ROLE</th>
              <th className="py-1.5 px-2 border-r border-slate-300 w-48">NAME</th>
              <th className="py-1.5 px-2 border-r border-slate-300 w-32 text-center">ERT ASSIGNMENT</th>
              <th className="py-1.5 px-2 border-r border-slate-300 w-28 text-center">COMPLIANCE</th>
              <th className="py-1.5 px-2 w-28 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {masterTableRows.map((row, idx) => (
              <tr
                key={row.member.id}
                className={`border-b border-slate-300 hover:bg-sky-50/70 transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <td className="py-1 px-2 border-r border-slate-300 text-center whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded font-bold text-[9.5px] font-mono inline-block shadow-2xs ${row.shiftBadgeClass}`}>
                    {row.shiftBadgeText}
                  </span>
                </td>
                <td className="py-1 px-2 border-r border-slate-300 font-semibold text-slate-700 text-[10.5px] whitespace-nowrap">
                  {row.deptName}
                </td>
                <td className="py-1 px-2 border-r border-slate-300 font-semibold text-slate-800 text-[10.5px] whitespace-nowrap">
                  {row.member.role}
                </td>
                <td className="py-1 px-2 border-r border-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-blue-950 text-[11px]">{row.member.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">({row.member.id})</span>
                  </div>
                </td>
                <td className="py-1 px-2 border-r border-slate-300 text-center whitespace-nowrap">
                  {row.ertRole === '-' ? (
                    <span className="text-slate-400 font-bold">-</span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded font-bold text-[9.5px] font-mono inline-block shadow-2xs ${getErtBadgeStyle(row.ertRole)}`}>
                      {row.ertRole}
                    </span>
                  )}
                </td>
                <td className="py-1 px-2 border-r border-slate-300 text-center whitespace-nowrap">
                  {row.isExpired ? (
                    <button
                      onClick={() => onNavigateToMatrix(row.member.id)}
                      className="bg-red-100 text-red-900 border border-red-400 px-2 py-0.5 rounded font-bold text-[9.5px] font-mono shadow-2xs cursor-pointer hover:bg-red-200"
                      title="Expired certification - click to view Matrix"
                    >
                      [EXP]
                    </button>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded font-bold text-[9.5px] font-mono shadow-2xs">
                      [CERT]
                    </span>
                  )}
                </td>
                <td className="py-1 px-2 text-center whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded font-bold text-[9.5px] font-mono inline-block shadow-2xs ${row.statusClass}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0b2240] text-white p-2 border border-slate-600 font-mono text-[11px] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="bg-blue-900 border border-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
            ERT ON-SITE COMMAND
          </span>
          <span className="text-slate-300 text-[10px]">
            Quorum: <strong className={uniqueErtDeployed.hasQuorum ? 'text-emerald-400' : 'text-amber-400'}>{uniqueErtDeployed.count}P / 5P {uniqueErtDeployed.hasQuorum ? 'MET - COMPLIANT' : 'DEFICIT'}</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10.5px]">
          <div className="flex items-center gap-1.5">
            <span className="bg-blue-700 text-white font-bold px-1.5 py-0.5 rounded text-[9px]">IC</span>
            <span className="text-slate-300">Incident Commander:</span>
            <span className="font-bold text-white">{dayIncidentCommander?.name || nightIncidentCommander?.name || 'Unassigned (Deficit)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded text-[9px]">FC</span>
            <span className="text-slate-300">Fire Chief:</span>
            <span className="font-bold text-white">{dayFireChief?.name || nightFireChief?.name || 'Unassigned (Deficit)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded text-[9px]">GAS</span>
            <span className="text-slate-300">Gas Leak Response:</span>
            <span className="font-bold text-white">{dayEvacLead?.name || nightEvacLead?.name || 'Unassigned (Deficit)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
