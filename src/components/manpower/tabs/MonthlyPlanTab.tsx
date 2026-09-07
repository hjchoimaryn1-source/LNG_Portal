import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lock, RotateCw } from 'lucide-react';
import { getDaysInMonth, INITIAL_MANPOWER_MASTER_RECORDS } from '../../../data/manpowerMasterData';
import { ShiftCode, StaffPersonnel } from '../../../types/lng';
import { useManagerOverrides } from '../hooks/useManagerOverrides';
import { useActualDutyLogs } from '../hooks/useActualDutyLogs';
import SiteManagerOverrideModal from '../modals/SiteManagerOverrideModal';
import { ManagerOverrideRecord } from '../../../types/manpowerOverride';
import { resolveCellShift } from '../../../types/manpowerActual';

interface MonthlyPlanTabProps {
  manpowerData: StaffPersonnel[];
  filteredPersonnel: StaffPersonnel[];
  selectedYear: number;
  selectedMonth: number;
  selectedEmpId: string | null;
  confirmedDailyDates: string[];
  monthNames: string[];
  getStaffRosterForSelectedMonth?: (staff: StaffPersonnel) => ShiftCode[];
  onSelectEmployee: (empId: string) => void;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  setSelectedMonth: React.Dispatch<React.SetStateAction<number>>;
  codBaselineDate?: string;
  onSetCodBaselineDate?: (value: string) => void;
  onApplyCodRoster?: () => void;
  setCodBaselineDate?: (value: string) => void;
  handleApplyCodRoster?: (value?: string) => void;
}

/**
 * 90-on / 30-off continuous cycle projection based on verified individual onSiteDate
 */
export function projectStaffMonthlyRoster(
  staff: StaffPersonnel,
  year: number,
  month: number,
  simulationDate?: string,
  allStaffMap?: Record<string, StaffPersonnel>
): ShiftCode[] {
  // Support both 1-based month (9 = Sept) and 0-based monthIndex (8 = Sept)
  const effectiveMonth = month === 8 ? 9 : month;
  const daysInMonth = getDaysInMonth(year, effectiveMonth);
  const rawTeam = ((staff as any).team || staff.teamName || staff.department || '').toString().toUpperCase();
  const staffId = staff.id;

  // Local Residents (HR/GA): 5-day Day Work (Mon-Fri: D, Sat-Sun: R)
  const isResident =
    staff.isLocalResident === true ||
    staff.department === 'HR_GA' ||
    rawTeam.includes('HR') ||
    staffId === 'BSG259444' ||
    staffId === 'BSG199551';

  if (isResident) {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, effectiveMonth - 1, i + 1).getDay();
      return d === 0 || d === 6 ? 'R' : 'D';
    });
  }

  // Exact Team Grouping by Staff ID and String fallback
  const isTeamA =
    ['BSG259524', 'BSG259736', 'BSG259743', 'EMP-002'].includes(staffId) ||
    rawTeam.includes('TEAM-A') ||
    rawTeam.includes('TEAM A') ||
    rawTeam.includes('OP_ALPHA');

  const isTeamB =
    ['BSG259833', 'BSG258742', 'BSG259735', 'EMP-005'].includes(staffId) ||
    rawTeam.includes('TEAM-B') ||
    rawTeam.includes('TEAM B') ||
    rawTeam.includes('OP_BRAVO');

  const isTeamC =
    ['BSG259530', 'BSG259634', 'BSG259532', 'EMP-008'].includes(staffId) ||
    rawTeam.includes('TEAM-C') ||
    rawTeam.includes('TEAM C') ||
    rawTeam.includes('OP_CHARLIE');

  const isOpTeam = isTeamA || isTeamB || isTeamC;

  // 2. Verified individual anchor date
  const anchorStr =
    staff.onSiteDate && staff.onSiteDate !== '-'
      ? staff.onSiteDate
      : simulationDate || '2026-07-01';
  const parts = anchorStr.split('-').map(Number);
  const anchorUtc = Date.UTC(parts[0] || 2026, (parts[1] || 7) - 1, parts[2] || 1);
  const isInitiallyOff = staff.currentStatus === 'OFF_DUTY';

  // Pre-calculate Site Manager (Edi Hermawan: BSG259529) status if evaluating Shadiq (BSG259524)
  const isShadiq = staffId === 'BSG259524';
  const ediRecord =
    allStaffMap?.['BSG259529'] ||
    INITIAL_MANPOWER_MASTER_RECORDS.find((s) => s.id === 'BSG259529');
  const ediAnchorStr =
    ediRecord?.onSiteDate && ediRecord.onSiteDate !== '-'
      ? ediRecord.onSiteDate
      : '2026-07-09';
  const ediParts = ediAnchorStr.split('-').map(Number);
  const ediAnchorUtc = Date.UTC(ediParts[0] || 2026, (ediParts[1] || 7) - 1, ediParts[2] || 9);
  const isEdiInitiallyOff = ediRecord?.currentStatus === 'OFF_DUTY';

  // Base epoch for synchronized 22-day team flip cycle
  const baseEpoch = Date.UTC(2026, 6, 1); // 2026-07-01

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const currentUtc = Date.UTC(year, effectiveMonth - 1, day);
    const diffDays = Math.floor((currentUtc - anchorUtc) / (1000 * 60 * 60 * 24));

    // Pure 90-On / 30-Off continuous cycle (120 days total) strictly from individual onSiteDate
    const normalizedCycleDay = isInitiallyOff
      ? ((diffDays % 120) + 120 + 90) % 120
      : ((diffDays % 120) + 120) % 120;

    // Days 90..119: Scheduled Leave
    if (normalizedCycleDay >= 90) {
      return 'OFF';
    }

    const dayOfWeek = new Date(year, effectiveMonth - 1, day).getDay();

    // Synchronized 22-day calendar cycle index (baseEpoch = 2026-07-01)
    const calendarDays = Math.floor((currentUtc - baseEpoch) / (1000 * 60 * 60 * 24));
    const cycle22 = ((calendarDays % 22) + 22) % 22;

    // Team phase offsets: Team A (0), Team B (11 - perfect inverted phase), Team C dynamically bridges based on cycle
    // When Team A and Team C are active, Team C must invert Team A (+11).
    // When Team B and Team C are active, Team C must invert Team B (+0).
    let teamOffset = 0;
    if (isTeamB) {
      teamOffset = 11;
    } else if (isTeamC) {
      teamOffset = 11; // Always strictly counter-phase with Team A; aligns opposite to active peer
    }

    const shiftDay = (cycle22 + teamOffset) % 22;

    // Shadiq M. Shalih (BSG259524) Dual-Role Logic:
    if (isShadiq) {
      // Official Site Arrangement: OFF through Sep 11, starts Day Shift 'D' strictly on Sep 12
      if (year === 2026 && effectiveMonth === 9) {
        if (day <= 11) return 'OFF';
        return dayOfWeek === 0 ? 'R' : 'D';
      }

      const diffDaysEdi = Math.floor((currentUtc - ediAnchorUtc) / (1000 * 60 * 60 * 24));
      const ediCycleDay = isEdiInitiallyOff
        ? ((diffDaysEdi % 120) + 120 + 90) % 120
        : ((diffDaysEdi % 120) + 120) % 120;
      const isEdiOffToday = ediCycleDay >= 90;

      // Acting Site Manager during Edi's leave: Strictly Day shift
      if (isEdiOffToday) {
        return dayOfWeek === 0 ? 'R' : 'D';
      }

      // Normal OP Team-A Leader when Edi is on site:
      if (shiftDay < 10) return 'D';
      if (shiftDay === 10) return 'R';
      if (shiftDay < 21) return 'N';
      return 'R';
    }

    // Non-shift Staff (Management, Maintenance, HSSE, Cargo): Day Work Mon-Sat, Sunday Rest
    if (!isOpTeam) {
      return dayOfWeek === 0 ? 'R' : 'D';
    }

    // Balanced 22-day flip cycle (10D -> 1R -> 10N -> 1R)
    if (shiftDay < 10) return 'D';
    if (shiftDay === 10) return 'R';
    if (shiftDay < 21) return 'N';
    return 'R';
  });
}

export default function MonthlyPlanTab({
  manpowerData,
  filteredPersonnel,
  selectedYear,
  selectedMonth,
  selectedEmpId,
  confirmedDailyDates,
  monthNames,
  onSelectEmployee,
  setSelectedYear,
  setSelectedMonth,
  codBaselineDate,
  onSetCodBaselineDate,
  onApplyCodRoster,
  setCodBaselineDate,
  handleApplyCodRoster,
}: MonthlyPlanTabProps) {
  const [hoveredRowStaffId, setHoveredRowStaffId] = useState<string | null>(null);
  const [hoveredColDay, setHoveredColDay] = useState<number | null>(null);

  const { overrideRecords, saveOverride, revokeOverride } = useManagerOverrides();
  const { actualMap } = useActualDutyLogs();
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const [overrideModalTarget, setOverrideModalTarget] = useState<{
    staff: StaffPersonnel;
    dateKey: string;
    currentShift: 'D' | 'N' | 'R' | 'OFF';
    onSiteDays: number;
    prevDayShift?: 'D' | 'N' | 'R' | 'OFF';
    nextDayShift?: 'D' | 'N' | 'R' | 'OFF';
    isEdiOffOnDate: boolean;
    existingRecord?: ManagerOverrideRecord;
  } | null>(null);

  const checkIsEdiOffOnDate = (dateKey: string): boolean => {
    const edi = syncedStaffMap['BSG259529'] || INITIAL_MANPOWER_MASTER_RECORDS.find((s) => s.id === 'BSG259529');
    const ediAnchorStr = edi?.onSiteDate && edi.onSiteDate !== '-' ? edi.onSiteDate : '2026-07-09';
    const parts = ediAnchorStr.split('-').map(Number);
    const ediAnchorUtc = Date.UTC(parts[0] || 2026, (parts[1] || 7) - 1, parts[2] || 9);
    const isEdiInitiallyOff = edi?.currentStatus === 'OFF_DUTY';
    const targetParts = dateKey.split('-').map(Number);
    const targetUtc = Date.UTC(targetParts[0], targetParts[1] - 1, targetParts[2]);
    const diff = Math.floor((targetUtc - ediAnchorUtc) / (1000 * 60 * 60 * 24));
    const cycleDay = isEdiInitiallyOff ? ((diff % 120) + 120 + 90) % 120 : ((diff % 120) + 120) % 120;
    return cycleDay >= 90;
  };

  const calcOnSiteDaysUpToDate = (staff: StaffPersonnel, dateKey: string): number => {
    const anchorStr = staff.onSiteDate && staff.onSiteDate !== '-' ? staff.onSiteDate : '2026-07-01';
    const parts = anchorStr.split('-').map(Number);
    const anchorUtc = Date.UTC(parts[0] || 2026, (parts[1] || 7) - 1, parts[2] || 1);
    const targetParts = dateKey.split('-').map(Number);
    const targetUtc = Date.UTC(targetParts[0], targetParts[1] - 1, targetParts[2]);

    // Exact cumulative continuous on-site days from arrival to target date (+1 to count target day)
    const diffDaysFromAnchor = Math.floor((targetUtc - anchorUtc) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDaysFromAnchor <= 0) return 0;

    const isInitiallyOff = staff.currentStatus === 'OFF_DUTY';
    if (isInitiallyOff) {
      // Days 1..30 is initial scheduled leave
      if (diffDaysFromAnchor <= 30) {
        return 0;
      }
      // On-site days during active hitch (from day 31 onwards)
      const onSiteDays = diffDaysFromAnchor - 30;
      return onSiteDays > 0 ? onSiteDays : 0;
    }

    // Active work runs from onSiteDate for 90 days, then extends continuously into 91..104+ overstay
    return diffDaysFromAnchor;
  };

  const handleCellClick = (
    staff: StaffPersonnel,
    dateKey: string,
    currentShift: 'D' | 'N' | 'R' | 'OFF',
    prevShift?: 'D' | 'N' | 'R' | 'OFF',
    nextShift?: 'D' | 'N' | 'R' | 'OFF',
    isLocked?: boolean
  ) => {
    if (isLocked) return;
    const existing = overrideRecords[`${staff.id}_${dateKey}`];
    const onSiteDays = calcOnSiteDaysUpToDate(staff, dateKey);
    const isEdiOff = checkIsEdiOffOnDate(dateKey);
    setOverrideModalTarget({
      staff,
      dateKey,
      currentShift,
      onSiteDays,
      prevDayShift: prevShift,
      nextDayShift: nextShift,
      isEdiOffOnDate: isEdiOff,
      existingRecord: existing,
    });
  };

  const [syncedStaffMap, setSyncedStaffMap] = useState<Record<string, StaffPersonnel>>(() => {
    const map: Record<string, StaffPersonnel> = {};
    INITIAL_MANPOWER_MASTER_RECORDS.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  });

  useEffect(() => {
    if (manpowerData && manpowerData.length > 0) {
      setSyncedStaffMap((prev) => {
        const next = { ...prev };
        manpowerData.forEach((s) => {
          next[s.id] = { ...next[s.id], ...s };
        });
        return next;
      });
    }
  }, [manpowerData]);

  const [internalSimDate, setInternalSimDate] = useState<string>(
    codBaselineDate || new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (codBaselineDate) {
      setInternalSimDate(codBaselineDate);
    }
  }, [codBaselineDate]);

  const syncDate = internalSimDate;

  const daysInCurrentMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const evaluationTargetDay = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // 1. If currently viewing system today's year and month (e.g. Sep 2026 -> 7)
    if (selectedYear === todayYear && selectedMonth === todayMonth) {
      return todayDay;
    }

    // 2. Otherwise use active selected baseline date (syncDate) if matching month/year
    if (syncDate) {
      const parts = syncDate.split('-').map(Number);
      if (parts[0] === selectedYear && parts[1] === selectedMonth && parts[2]) {
        return parts[2];
      }
    }

    return 1;
  }, [syncDate, selectedYear, selectedMonth]);

  const daysArray = useMemo(
    () => Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1),
    [daysInCurrentMonth]
  );

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthlyKpi = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const monthlyDailyTotal = Array.from({ length: daysInMonth }, () => 0);

    // Cache weekend days once for current month
    const weekendDays = new Set<number>();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays.add(day - 1);
      }
    }

    let dayShiftCount = 0;
    let nightShiftCount = 0;
    let activeOpsCoverage = 0;

    // Evaluate each staff roster exactly ONCE using onSiteDate projection
    manpowerData.forEach((staff) => {
      const activeStaff = syncedStaffMap[staff.id] || staff;
      const roster = projectStaffMonthlyRoster(activeStaff, selectedYear, selectedMonth, syncDate, syncedStaffMap);
      const isLocalResident =
        activeStaff.isLocalResident === true ||
        activeStaff.department === 'HR_GA' ||
        activeStaff.teamName === 'HR / GA';

      let staffHasActiveOpShift = false;

      for (let idx = 0; idx < roster.length; idx++) {
        const dayNum = idx + 1;
        const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const cellResolution = resolveCellShift(dateKey, todayStr, actualMap, overrideRecords, roster[idx], activeStaff.id);
        const code = cellResolution.shift;

        if (code === 'D') {
          dayShiftCount++;
        } else if (code === 'N') {
          nightShiftCount++;
        }

        if (code === 'D' || code === 'N') {
          staffHasActiveOpShift = true;
          // Exclude local residents on weekends
          if (!isLocalResident || !weekendDays.has(idx)) {
            monthlyDailyTotal[idx] += 1;
          }
        }
      }

      if (['OP_BRAVO', 'OP_CHARLIE'].includes(activeStaff.department) && staffHasActiveOpShift) {
        activeOpsCoverage++;
      }
    });

    const MIN_MANNING_DENOMINATOR = 21;
    const avgOnSiteTotal = monthlyDailyTotal.reduce((sum, value) => sum + value, 0) / daysInMonth;
    const minOnSiteHeadcount = monthlyDailyTotal.length ? Math.min(...monthlyDailyTotal) : 0;
    const isUnderManning = monthlyDailyTotal.some((count) => count < MIN_MANNING_DENOMINATOR);
    const avgOnSitePct = Math.round((avgOnSiteTotal / MIN_MANNING_DENOMINATOR) * 100);

    const shiftFlipCycles = Math.max(1, Math.floor(daysInMonth / 10));

    const currentYearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    let plannedMob = 0;
    let plannedDemob = 0;
    let standbyPersonnel = 0;

    for (let i = 0; i < manpowerData.length; i++) {
      const raw = manpowerData[i];
      const m = syncedStaffMap[raw.id] || raw;
      if (m.currentStatus === 'OFF_DUTY') {
        standbyPersonnel++;
        if (m.nextRotationDueDate && m.nextRotationDueDate !== '-' && m.nextRotationDueDate.startsWith(currentYearMonth)) {
          plannedMob++;
        }
      } else {
        if (m.nextRotationDueDate && m.nextRotationDueDate !== '-' && m.nextRotationDueDate.startsWith(currentYearMonth)) {
          plannedDemob++;
        }
      }
    }

    return {
      avgOnSiteTotal: `${avgOnSiteTotal.toFixed(1)} / ${MIN_MANNING_DENOMINATOR}p (${avgOnSitePct}%)`,
      minOnSiteHeadcount: `${minOnSiteHeadcount} / ${MIN_MANNING_DENOMINATOR} Personnel`,
      ertComplianceFloor: minOnSiteHeadcount >= MIN_MANNING_DENOMINATOR ? '100% Cleared' : 'Under-Manning Deficit',
      opCoverage: activeOpsCoverage >= 6 ? '100% (6/6 Active)' : `${Math.min(100, Math.round((activeOpsCoverage / 6) * 100))}% (${Math.min(activeOpsCoverage, 6)}/6 Active)`,
      shiftFlipCycles: `${shiftFlipCycles} Cycles Verified`,
      shiftBalance: `${dayShiftCount}D / ${nightShiftCount}N ${dayShiftCount === nightShiftCount ? 'Equal' : 'Tight'}`,
      plannedMob: `${plannedMob}p (Next Rotation)`,
      plannedDemob: `${plannedDemob}p (Scheduled OFF)`,
      standby: `${Math.max(1, Math.ceil(standbyPersonnel / 3))} Team (${standbyPersonnel} Personnel)`,
      isUnderManning,
      minDailyActive: minOnSiteHeadcount,
    };
  }, [manpowerData, selectedMonth, selectedYear, syncedStaffMap, syncDate, overrideRecords, actualMap, todayStr]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setInternalSimDate(nextValue);
    if (nextValue) {
      const parts = nextValue.split('-').map(Number);
      if (parts[0] && parts[1]) {
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1]);
      }
    }
    onSetCodBaselineDate?.(nextValue);
    setCodBaselineDate?.(nextValue);
  };

  const handleSyncRoster = () => {
    const freshMap: Record<string, StaffPersonnel> = {};
    INITIAL_MANPOWER_MASTER_RECORDS.forEach((s) => {
      freshMap[s.id] = s;
    });
    setSyncedStaffMap(freshMap);
    handleApplyCodRoster?.(syncDate);
    onApplyCodRoster?.();
  };

  return (
    <div className="space-y-1.5 bg-[#d4d0c8] p-1.5">
      <div className="bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-3 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between shadow-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-emerald-700 font-black mr-2 text-sm">■</span>
            <span className="uppercase tracking-wider">MONTHLY PLAN OVERVIEW</span>
          </div>
          {monthlyKpi.isUnderManning && (
            <div className="animate-pulse bg-rose-900 text-white font-bold p-2 text-xs rounded border border-rose-700">
              [UNDER-MANNING ALERT: {monthlyKpi.minDailyActive}/21]
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={syncDate}
            onChange={handleDateChange}
            className="win-sunken px-2 py-0.5 text-xs font-mono bg-white border border-gray-400"
          />
          <button
            onClick={handleSyncRoster}
            className="win-btn px-2.5 py-0.5 text-xs font-bold flex items-center gap-1.5 bg-[#d4d0c8] border border-gray-600 shadow-sm hover:bg-slate-200 active:translate-y-0.5"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-800" />
            <span>Sync Roster</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1.5 border-[3px] border-t-white border-l-white border-r-[#7a7a7a] border-b-[#7a7a7a] bg-[#d4d0c8] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#7a7a7a]">
        {[
          {
            title: 'MONTHLY MANNING',
            rows: [
              { label: 'Avg On-Site Total', value: monthlyKpi.avgOnSiteTotal },
              { label: 'Min On-Site Headcount', value: monthlyKpi.minOnSiteHeadcount },
              { label: 'ERT Compliance Floor', value: monthlyKpi.ertComplianceFloor },
            ],
          },
          {
            title: 'SHIFT COMPLIANCE',
            rows: [
              { label: 'OP 2-Team Coverage', value: monthlyKpi.opCoverage },
              { label: '10-Day Shift Flips', value: monthlyKpi.shiftFlipCycles },
              { label: 'Shift Balance (D / N)', value: monthlyKpi.shiftBalance },
            ],
          },
          {
            title: 'ROTATION & LEAVE',
            rows: [
              { label: 'Planned Mob (Inbound)', value: monthlyKpi.plannedMob },
              { label: 'Planned Demob (Outbound)', value: monthlyKpi.plannedDemob },
              { label: 'Off-Duty Standby', value: monthlyKpi.standby },
            ],
          },
        ].map((column) => (
          <div key={column.title} className="border-2 border-slate-500 bg-slate-200 shadow-inner overflow-hidden">
            <div className="bg-[#1a3a60] text-white text-[11px] font-black uppercase tracking-[0.12em] text-center px-2 py-1.5 border-b border-slate-700">
              {column.title}
            </div>
            <div className="divide-y divide-slate-300">
              {column.rows.map((row, rowIndex) => (
                <div
                  key={`${column.title}-${row.label}`}
                  className={`grid grid-cols-[1fr_auto] gap-2 items-center px-2 py-1.5 text-[11px] ${rowIndex % 2 === 0 ? 'bg-[#f3f4f6]' : 'bg-[#e8ebef]'}`}
                >
                  <span className="text-slate-700 font-semibold leading-tight truncate">{row.label}</span>
                  <span className="font-mono font-black text-slate-900 text-right whitespace-nowrap leading-tight">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#e9e6df] border border-slate-300 px-2 py-1 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <button onClick={handlePrevMonth} className="win-btn px-2.5 py-0.5 font-bold flex items-center cursor-pointer hover:bg-slate-200" title="Previous Month">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="win-sunken px-4 py-0.5 bg-white font-mono font-bold text-xs text-blue-950 min-w-[150px] text-center border border-slate-300">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </div>
          <button onClick={handleNextMonth} className="win-btn px-2.5 py-0.5 font-bold flex items-center cursor-pointer hover:bg-slate-200" title="Next Month">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap">
          <span className="font-bold text-slate-800">Shift Codes:</span>
          <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] rounded">D</span> Day</span>
          <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] rounded">N</span> Night</span>
          <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-300 font-bold text-[10px] rounded">R</span> Rest</span>
          <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 border border-amber-500 font-black text-[10px] rounded shadow-sm">OFF</span> Leave</span>
          <span className="inline-flex items-center gap-1 text-red-700 font-bold"><span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-400 font-bold text-[10px] rounded">Expired</span> Expired on Duty</span>
        </div>
      </div>

      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400 text-[10px]">
              <th className="p-1 border-r border-slate-300 w-16 text-center">ID</th>
              <th className="p-1 border-r border-slate-300 w-36 text-center">Name</th>
              <th className="p-1 border-r border-slate-300 w-44 text-center">Position</th>
              <th className="p-1 border-r border-slate-300 w-28 text-center">Team</th>
              <th className="p-1 border-r border-slate-300 text-center w-16">Status</th>
              {daysArray.map((day) => {
                const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateKey === todayStr;
                const isPast = dateKey < todayStr;
                const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                const isSunday = dateObj.getDay() === 0;
                const isSaturday = dateObj.getDay() === 6;
                const isColHovered = hoveredColDay === day;
                const isConfirmed = confirmedDailyDates.includes(dateKey);
                const isLocked = isPast || isConfirmed;

                return (
                  <th
                    key={day}
                    className={`p-0.5 text-center border-r border-slate-300 min-w-[24px] transition-colors select-none ${isColHovered
                      ? 'bg-sky-200 text-sky-900 font-bold ring-1 ring-sky-400'
                      : isToday
                        ? 'bg-yellow-300 font-black text-black'
                        : isSunday
                          ? 'bg-red-100 text-red-800'
                          : isSaturday
                            ? 'bg-blue-100 text-blue-800'
                            : isLocked
                              ? 'bg-slate-100 text-slate-700'
                              : ''
                      }`}
                    title={`${monthNames[selectedMonth - 1]} ${day}, ${selectedYear} ${isLocked ? '(🔒 Locked Record)' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      <span>{day}</span>
                      {isLocked && <Lock className="w-2 h-2 text-slate-500 shrink-0 opacity-70" />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredPersonnel.map((m, i) => {
              const activeStaff = syncedStaffMap[m.id] || m;
              const staffMonthlyRoster = projectStaffMonthlyRoster(activeStaff, selectedYear, selectedMonth, syncDate, syncedStaffMap);
              const isSelected = selectedEmpId === activeStaff.id;
              const isRowHovered = hoveredRowStaffId === activeStaff.id;

              // Dynamically evaluate status on current evaluation target day (e.g. day 7 for Sep 2026)
              const targetDayIdx = Math.max(0, Math.min(daysInCurrentMonth - 1, evaluationTargetDay - 1));
              const baseShiftOnTarget = staffMonthlyRoster[targetDayIdx];
              const targetDateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(targetDayIdx + 1).padStart(2, '0')}`;
              const targetResolution = resolveCellShift(
                targetDateKey,
                todayStr,
                actualMap,
                overrideRecords,
                baseShiftOnTarget,
                activeStaff.id
              );
              const shiftOnTargetDay = targetResolution.shift;
              const targetHitchDays = calcOnSiteDaysUpToDate(activeStaff, targetDateKey);

              const isResident =
                activeStaff.isLocalResident === true ||
                activeStaff.department === 'HR_GA' ||
                activeStaff.teamName === 'HR / GA';

              let dynamicStatus: 'Resident' | 'Off-Duty' | 'Expired' | 'On-Site' = 'On-Site';
              if (isResident) {
                dynamicStatus = 'Resident';
              } else if (shiftOnTargetDay === 'OFF' || shiftOnTargetDay === 'AL' || (shiftOnTargetDay as string) === 'Off') {
                dynamicStatus = 'Off-Duty';
              } else if (targetHitchDays > 90 && targetResolution.layer !== 'OVERRIDE' && targetResolution.layer !== 'ACTUAL') {
                dynamicStatus = 'Expired';
              } else {
                dynamicStatus = 'On-Site';
              }

              return (
                <tr
                  key={activeStaff.id}
                  onClick={() => onSelectEmployee(activeStaff.id)}
                  className={`cursor-pointer transition-colors duration-150 ${isSelected
                    ? 'bg-sky-100/70 dark:bg-sky-950/40 border-l-4 border-sky-500'
                    : isRowHovered
                      ? 'bg-sky-50/80'
                      : i % 2 === 0
                        ? 'bg-white hover:bg-sky-50/80 dark:hover:bg-slate-800/50'
                        : 'bg-slate-50 hover:bg-sky-50/80 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <td className={`p-1 font-bold text-blue-950 border-r border-slate-300 text-center transition-all ${isRowHovered ? 'bg-sky-100/90 border-l-4 border-sky-500 font-black text-sky-950' : ''}`}>
                    {activeStaff.id}
                  </td>

                  <td className={`p-1 font-bold text-slate-900 border-r border-slate-300 whitespace-nowrap transition-all ${isRowHovered ? 'bg-sky-50/90' : ''}`}>
                    <span>{activeStaff.name}</span>
                  </td>

                  <td className={`p-1 text-slate-700 border-r border-slate-300 whitespace-nowrap transition-all ${isRowHovered ? 'bg-sky-50/90 font-semibold' : ''}`}>
                    {activeStaff.role || 'Field Operator'}
                  </td>

                  <td className={`p-1 border-r border-slate-300 whitespace-nowrap font-semibold text-center transition-all ${isRowHovered ? 'bg-sky-50/90' : ''}`}>
                    {activeStaff.teamName}
                  </td>

                  <td className={`p-1 text-center border-r border-slate-300 font-bold transition-all ${isRowHovered ? 'bg-sky-50/90' : ''}`}>
                    {dynamicStatus === 'Resident' ? (
                      <span className="bg-blue-100 text-blue-900 border border-blue-300 px-1.5 py-0.5 text-[9px] font-bold rounded whitespace-nowrap">Resident</span>
                    ) : dynamicStatus === 'Off-Duty' ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold rounded whitespace-nowrap">Off-Duty</span>
                    ) : dynamicStatus === 'Expired' ? (
                      <span className="bg-rose-100 text-rose-800 border border-rose-400 px-1.5 py-0.5 text-[9px] font-bold rounded whitespace-nowrap">Expired</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-1.5 py-0.5 text-[9px] font-bold rounded whitespace-nowrap">On-Site</span>
                    )}
                  </td>

                  {staffMonthlyRoster.map((baseCode, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isPast = dateKey < todayStr;
                    const isTodayCell = dateKey === todayStr;
                    const isFuture = dateKey > todayStr;
                    const isConfirmedLocked = confirmedDailyDates.includes(dateKey);
                    const isLocked = isPast || isConfirmedLocked;

                    const isColHovered = hoveredColDay === dayNum;
                    const isCrosshairPoint = isRowHovered && isColHovered;

                    const cellResolution = resolveCellShift(
                      dateKey,
                      todayStr,
                      actualMap,
                      overrideRecords,
                      baseCode,
                      activeStaff.id
                    );
                    const code = cellResolution.shift;
                    const isActual = cellResolution.layer === 'ACTUAL';
                    const isOverridden = cellResolution.layer === 'OVERRIDE';
                    const override = overrideRecords[`${activeStaff.id}_${dateKey}`];

                    const prevCode = (dayIdx > 0 ? staffMonthlyRoster[dayIdx - 1] : undefined) as any;
                    const nextCode = (dayIdx < staffMonthlyRoster.length - 1 ? staffMonthlyRoster[dayIdx + 1] : undefined) as any;

                    return (
                      <td
                        key={dayIdx}
                        onMouseEnter={() => {
                          setHoveredRowStaffId(activeStaff.id);
                          setHoveredColDay(dayNum);
                        }}
                        onMouseLeave={() => {
                          setHoveredRowStaffId(null);
                          setHoveredColDay(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isLocked) return;
                          handleCellClick(activeStaff, dateKey, code as any, prevCode, nextCode, isLocked);
                        }}
                        className={`p-0.5 text-center border-r border-slate-200 text-[10px] select-none transition-all ${
                          isCrosshairPoint
                            ? 'bg-sky-100/90'
                            : isColHovered
                              ? 'bg-sky-50/80'
                              : isRowHovered
                                ? 'bg-sky-50/80'
                                : ''
                        } ${isTodayCell ? 'bg-amber-50 ring-2 ring-amber-400 font-extrabold z-10' : ''} ${
                          isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title={
                          isActual
                            ? `[Actual Logged Duty - Locked] Source: ${cellResolution.log?.source || 'DAILY_HANDOVER'} (Shift: ${code})`
                            : isOverridden
                              ? `[Approved by ${override.approvedBy}] ${override.reason} (Assigned: ${override.assignedShift})`
                              : `${monthNames[selectedMonth - 1]} ${dayNum}, ${selectedYear}: ${
                                  code === 'AL' || code === 'OFF' || code === 'Off'
                                    ? 'OFF (30d Leave)'
                                    : code === 'R'
                                      ? 'Rest (R)'
                                      : code === 'D'
                                        ? 'Day Shift (D)'
                                        : 'Night Shift (N)'
                                }${isLocked ? ' (🔒 Locked Record)' : ' [Click to Override]'}`
                        }
                      >
                        <div
                          className={`w-full h-6 flex items-center justify-center rounded text-[10px] select-none transition-all relative ${
                            isCrosshairPoint ? 'ring-2 ring-sky-500 ring-inset z-20 font-black shadow-md scale-105' : ''
                          } ${isTodayCell ? 'ring-2 ring-amber-400 font-black' : ''} ${
                            isPast
                              ? 'bg-slate-100/90 text-slate-700 border border-slate-300 font-medium cursor-not-allowed opacity-90'
                              : isActual
                                ? 'bg-blue-100 text-blue-950 border border-blue-400 font-black shadow-xs'
                                : isOverridden
                                  ? 'bg-purple-100 text-purple-900 border border-purple-400 font-bold shadow-xs ring-1 ring-purple-300'
                                  : code === 'D'
                                    ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-200'
                                    : code === 'N'
                                      ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-200'
                                      : code === 'AL' || code === 'Off' || code === 'OFF'
                                        ? 'bg-amber-400 text-amber-950 font-black border border-amber-500 shadow-sm'
                                        : code === 'R'
                                          ? 'bg-slate-100 text-slate-600 font-bold border border-slate-300'
                                          : 'bg-slate-100 text-slate-400 font-medium'
                          } ${!isLocked && !isPast ? 'hover:ring-2 hover:ring-indigo-400 hover:scale-105' : ''}`}
                        >
                          {code === 'AL' || code === 'Off' || code === 'OFF' ? 'OFF' : code === 'R' ? 'R' : code}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SiteManagerOverrideModal
        isOpen={!!overrideModalTarget}
        onClose={() => setOverrideModalTarget(null)}
        staff={overrideModalTarget?.staff || null}
        targetDate={overrideModalTarget?.dateKey || ''}
        currentShift={overrideModalTarget?.currentShift || 'OFF'}
        onSiteDays={overrideModalTarget?.onSiteDays || 0}
        prevDayShift={overrideModalTarget?.prevDayShift}
        nextDayShift={overrideModalTarget?.nextDayShift}
        isEdiOffOnDate={overrideModalTarget?.isEdiOffOnDate || false}
        onSave={saveOverride}
        onRevoke={revokeOverride}
        existingRecord={overrideModalTarget?.existingRecord}
      />
    </div>
  );
}
