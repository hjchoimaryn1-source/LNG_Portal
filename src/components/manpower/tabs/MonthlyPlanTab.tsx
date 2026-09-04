import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getDaysInMonth } from '../../../data/manpowerMasterData';
import { ShiftCode, StaffPersonnel } from '../../../types/lng';

interface MonthlyPlanTabProps {
  manpowerData: StaffPersonnel[];
  filteredPersonnel: StaffPersonnel[];
  selectedYear: number;
  selectedMonth: number;
  selectedEmpId: string | null;
  confirmedDailyDates: string[];
  monthNames: string[];
  getStaffRosterForSelectedMonth: (staff: StaffPersonnel) => ShiftCode[];
  onSelectEmployee: (empId: string) => void;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  setSelectedMonth: React.Dispatch<React.SetStateAction<number>>;
  codBaselineDate?: string;
  onSetCodBaselineDate?: (value: string) => void;
  onApplyCodRoster?: () => void;
  setCodBaselineDate?: (value: string) => void;
  handleApplyCodRoster?: (value?: string) => void;
}

export default function MonthlyPlanTab({
  manpowerData,
  filteredPersonnel,
  selectedYear,
  selectedMonth,
  selectedEmpId,
  confirmedDailyDates,
  monthNames,
  getStaffRosterForSelectedMonth,
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

  const daysInCurrentMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

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

    // Evaluate each staff roster exactly ONCE
    manpowerData.forEach((staff) => {
      const roster = getStaffRosterForSelectedMonth(staff);
      const isLocalResident =
        staff.isLocalResident === true ||
        staff.department === 'HR_GA' ||
        staff.teamName === 'HR / GA';

      let staffHasActiveOpShift = false;

      for (let idx = 0; idx < roster.length; idx++) {
        const code = roster[idx];
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

      if (['OP_BRAVO', 'OP_CHARLIE'].includes(staff.department) && staffHasActiveOpShift) {
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
      const m = manpowerData[i];
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
  }, [getStaffRosterForSelectedMonth, manpowerData, selectedMonth, selectedYear]);

  const syncDate = codBaselineDate || '2026-09-15';
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    onSetCodBaselineDate?.(nextValue);
    setCodBaselineDate?.(nextValue);
  };

  const handleSyncRoster = () => {
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
            className="win-btn px-2.5 py-0.5 text-xs font-bold flex items-center gap-1 bg-[#d4d0c8] border border-gray-600 shadow-sm"
          >
            <span>🔄</span> Sync Roster
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
                const isToday = selectedYear === 2026 && selectedMonth === 9 && day === 1;
                const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                const isSunday = dateObj.getDay() === 0;
                const isSaturday = dateObj.getDay() === 6;
                const isColHovered = hoveredColDay === day;
                const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isPast = dateObj < new Date(2026, 8, 1);
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
              const staffMonthlyRoster = getStaffRosterForSelectedMonth(m);
              const isSelected = selectedEmpId === m.id;
              const isRowHovered = hoveredRowStaffId === m.id;

              return (
                <tr
                  key={m.id}
                  onClick={() => onSelectEmployee(m.id)}
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
                    {m.id}
                  </td>

                  <td className={`p-1 font-bold text-slate-900 border-r border-slate-300 whitespace-nowrap transition-all ${isRowHovered ? 'bg-sky-50/90' : ''}`}>
                    <span>{m.name}</span>
                  </td>

                  <td className={`p-1 text-slate-700 border-r border-slate-300 whitespace-nowrap transition-all ${isRowHovered ? 'bg-sky-50/90 font-semibold' : ''}`}>
                    {m.role || 'Field Operator'}
                  </td>

                  <td className={`p-1 border-r border-slate-300 whitespace-nowrap font-semibold text-center transition-all ${isRowHovered ? 'bg-sky-50/90' : ''}`}>
                    {m.teamName}
                  </td>

                  <td className={`p-1 text-center border-r border-slate-300 font-bold transition-all ${isRowHovered ? 'bg-sky-50/90' : ''}`}>
                    {m.currentStatus === 'OFF_DUTY' ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold rounded whitespace-nowrap">OFF-Day</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-1.5 py-0.5 text-[9px] font-bold rounded whitespace-nowrap">On-Site</span>
                    )}
                  </td>

                  {staffMonthlyRoster.map((code, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    const isToday = selectedYear === 2026 && selectedMonth === 9 && dayNum === 1;
                    const cellDateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
                    const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isPastLocked = cellDateObj < new Date(2026, 8, 1);
                    const isConfirmedLocked = confirmedDailyDates.includes(dateKey);
                    const isLocked = isPastLocked || isConfirmedLocked;

                    const isColHovered = hoveredColDay === dayNum;
                    const isCrosshairPoint = isRowHovered && isColHovered;

                    return (
                      <td
                        key={dayIdx}
                        onMouseEnter={() => {
                          setHoveredRowStaffId(m.id);
                          setHoveredColDay(dayNum);
                        }}
                        onMouseLeave={() => {
                          setHoveredRowStaffId(null);
                          setHoveredColDay(null);
                        }}
                        className={`p-0.5 text-center border-r border-slate-200 text-[10px] cursor-default transition-all ${isCrosshairPoint
                          ? 'bg-sky-100/90'
                          : isColHovered
                            ? 'bg-sky-50/80'
                            : isRowHovered
                              ? 'bg-sky-50/80'
                              : ''
                          } ${isToday ? 'bg-yellow-50 ring-1 ring-yellow-400 font-bold' : ''}`}
                        title={`${monthNames[selectedMonth - 1]} ${dayNum}, ${selectedYear}: ${code === 'AL'
                          ? 'OFF (30d Leave)'
                          : code === 'Off'
                            ? 'Rest (R)'
                            : code === 'D'
                              ? 'Day Shift (D)'
                              : 'Night Shift (N)'
                          }${isLocked ? ' (🔒 Locked Record)' : ''}`}
                      >
                        <div
                          className={`w-full h-6 flex items-center justify-center rounded text-[10px] select-none transition-all relative ${isCrosshairPoint ? 'ring-2 ring-sky-500 ring-inset z-20 font-black shadow-md scale-105' : ''} ${isLocked ? 'opacity-95' : ''} ${code === 'D'
                            ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-200'
                            : code === 'N'
                              ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-200'
                              : (code === 'AL' || code === 'Off')
                                ? 'bg-amber-400 text-amber-950 font-black border border-amber-500 shadow-sm'
                                : code === 'R'
                                  ? 'bg-slate-100 text-slate-600 font-bold border border-slate-300'
                                  : 'bg-slate-100 text-slate-400 font-medium'
                            }`}
                        >
                          {code === 'AL' || code === 'Off' ? 'OFF' : code === 'R' ? 'R' : code}
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
    </div>
  );
}
