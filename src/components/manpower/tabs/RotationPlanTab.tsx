import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_MANPOWER_MASTER_RECORDS } from '../../../data/manpowerMasterData';
import { StaffPersonnel, ShiftCode } from '../../../types/lng';
import { calcOnSiteDays } from '../../../utils/manpowerCalculations';

export type RotationFilter = 'ALL' | 'ON_SITE' | 'OFF_DUTY' | 'RESIDENT';

interface RotationPlanTabProps {
  manpowerData?: StaffPersonnel[];
  filteredPersonnel?: StaffPersonnel[];
  selectedEmpId?: string | null;
  onSelectEmployee?: (empId: string) => void;
  onUpdateStartDate?: (staffId: string, newDateStr: string) => void;
  onNavigateToMatrix?: (empId: string) => void;
  onRequestAL?: () => void;
  selectedDate?: string;
}

const TEAM_OPTIONS = ['Management', 'TEAM-A', 'TEAM-B', 'TEAM-C', 'Maintenance', 'HSSE Team', 'Cargo Operation', 'HR / GA'];
const ONE_DAY_MS = 86400000;

// Lightweight Date Arithmetic (UTC timestamp math)
const addDaysStr = (dateStr: string, days: number): string => {
  if (!dateStr || dateStr === '-' || dateStr === 'N/A') return '-';
  const ms = Date.parse(`${dateStr}T00:00:00Z`);
  return isNaN(ms) ? '-' : new Date(ms + days * ONE_DAY_MS).toISOString().slice(0, 10);
};

// Strict CSV order lookup
const CSV_STAFF_ORDER: Record<string, number> = {
  BSG259529: 1, BSG259524: 2, BSG259736: 3, BSG259743: 4, BSG259833: 5, BSG258742: 6,
  BSG259735: 7, BSG259530: 8, BSG259634: 9, BSG259532: 10, BSG259237: 11, BSG259420: 12,
  BSG259641: 13, BSG259919: 14, BSG259245: 15, BSG259646: 16, BSG259444: 17, BSG199551: 18,
};
const getStaffSortOrder = (staffId: string): number => CSV_STAFF_ORDER[staffId] ?? 999;

const formatContactNo = (contact?: string): string => {
  if (!contact || contact === '-' || contact === 'N/A') return '-';
  return contact.replace(/^\+62\s*/, '0');
};

export default function RotationPlanTab({
  manpowerData,
  filteredPersonnel,
  selectedEmpId,
  onSelectEmployee,
  onUpdateStartDate,
  onRequestAL,
  selectedDate,
}: RotationPlanTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalBaselineDate, setInternalBaselineDate] = useState<string>(
    selectedDate || new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (selectedDate) {
      setInternalBaselineDate(selectedDate);
    }
  }, [selectedDate]);

  const baselineDateStr = internalBaselineDate || new Date().toISOString().slice(0, 10);
  const todayStr = baselineDateStr;
  const endStr = addDaysStr(baselineDateStr, 30);
  const baselineMs = Date.parse(`${baselineDateStr}T00:00:00Z`);
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, { startDate?: string }>
  >({});
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ON_SITE' | 'OFF_DUTY' | 'RESIDENT'>('ALL');

  // Base list resolution
  const baseList = useMemo(() => {
    const raw = manpowerData && manpowerData.length > 0 ? manpowerData : filteredPersonnel;
    if (raw && raw.length > 0) {
      return raw.map((m) => {
        const isResident = m.isLocalResident === true || m.department === 'HR_GA';
        const onSiteDate = isResident ? '-' : m.onSiteDate || baselineDateStr;
        return {
          id: m.id,
          name: m.name,
          position: (m as any).position || m.role || 'Field Operator',
          team: (m as any).team || m.teamName || 'Management',
          department: m.department,
          isLocalResident: isResident,
          status: m.currentStatus || 'ON_SITE',
          todayShift: m.todayShift || 'D',
          onSiteDate,
          designatedReliever: (m as any).designatedReliever || m.relieverName || '-',
          contactNo: m.contactNo || '-',
          radioCh: (m as any).radioCh || m.radioChannel || '-',
          ertRole: (m as any).ertRole || 'None',
        };
      });
    }

    return INITIAL_MANPOWER_MASTER_RECORDS.map((s) => ({
      id: s.id,
      name: s.name,
      position: s.role,
      team: s.teamName,
      department: s.department,
      isLocalResident: s.isLocalResident,
      status: s.currentStatus,
      todayShift: s.todayShift,
      onSiteDate: s.onSiteDate,
      designatedReliever: s.relieverName || '-',
      contactNo: s.contactNo || '-',
      radioCh: s.radioChannel || '-',
      ertRole: s.ertRole || 'None',
    }));
  }, [manpowerData, filteredPersonnel, baselineDateStr]);

  // Combined staff items with live SSOT evaluation against baselineDateStr
  const allStaff = useMemo(() => {
    const edi = baseList.find((s) => s.id === 'BSG259529');
    const ediAnchorStr = edi?.onSiteDate && edi.onSiteDate !== '-' ? edi.onSiteDate : '2026-07-09';
    const ediParts = ediAnchorStr.split('-').map(Number);
    const ediAnchorUtc = Date.UTC(ediParts[0] || 2026, (ediParts[1] || 7) - 1, ediParts[2] || 9);
    const isEdiInitiallyOff = edi?.status === 'OFF_DUTY';

    const baselineParts = baselineDateStr.split('-').map(Number);
    const baselineUtc = Date.UTC(baselineParts[0], baselineParts[1] - 1, baselineParts[2]);
    const diffDaysEdi = Math.floor((baselineUtc - ediAnchorUtc) / (1000 * 60 * 60 * 24));
    const ediCycleDay = isEdiInitiallyOff
      ? ((diffDaysEdi % 120) + 120 + 90) % 120
      : ((diffDaysEdi % 120) + 120) % 120;
    const isEdiOffOnBaseline = ediCycleDay >= 90;

    const baseEpoch = Date.UTC(2026, 6, 1); // 2026-07-01
    const calendarDays = Math.floor((baselineUtc - baseEpoch) / (1000 * 60 * 60 * 24));
    const cycle22 = ((calendarDays % 22) + 22) % 22;

    const targetDateObj = new Date(baselineParts[0], baselineParts[1] - 1, baselineParts[2]);
    const dayOfWeek = targetDateObj.getDay();

    return baseList.map((m) => {
      const ov = localOverrides[m.id] || {};
      const onSiteDate = ov.startDate || m.onSiteDate;

      const rawTeam = (m.team || m.department || '').toString().toUpperCase();
      const staffId = m.id;

      // Local Residents (HR/GA): 5-day Day Work (Mon-Fri: D, Sat-Sun: R)
      const isResident =
        m.isLocalResident === true ||
        m.department === 'HR_GA' ||
        rawTeam.includes('HR') ||
        staffId === 'BSG259444' ||
        staffId === 'BSG199551';

      if (isResident) {
        return {
          ...m,
          status: 'RESIDENT',
          todayShift: dayOfWeek === 0 || dayOfWeek === 6 ? 'R' : 'D',
          onSiteDate: '-',
          onSiteDays: 0,
          dynamicLeaveDue: '-',
          pct: 0,
        };
      }

      // Non-Resident Rotation:
      const anchorStr = onSiteDate && onSiteDate !== '-' ? onSiteDate : '2026-07-01';
      const parts = anchorStr.split('-').map(Number);
      const anchorUtc = Date.UTC(parts[0] || 2026, (parts[1] || 7) - 1, parts[2] || 1);
      const isInitiallyOff = m.status === 'OFF_DUTY';

      const diffDays = Math.floor((baselineUtc - anchorUtc) / (1000 * 60 * 60 * 24));
      const normalizedCycleDay = isInitiallyOff
        ? ((diffDays % 120) + 120 + 90) % 120
        : ((diffDays % 120) + 120) % 120;

      const isOffDuty = normalizedCycleDay >= 90;
      const status = isOffDuty ? 'OFF_DUTY' : 'ON_SITE';

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

      let teamOffset = 0;
      if (isTeamB) {
        teamOffset = 11;
      } else if (isTeamC) {
        teamOffset = 11;
      }

      const shiftDay = (cycle22 + teamOffset) % 22;

      let calculatedShift: ShiftCode = 'D';

      if (isOffDuty) {
        calculatedShift = 'OFF';
      } else if (staffId === 'BSG259524') {
        // Shadiq M. Shalih (BSG259524) Special Logic:
        if (isEdiOffOnBaseline) {
          calculatedShift = dayOfWeek === 0 ? 'R' : 'D';
        } else {
          calculatedShift = shiftDay < 10 ? 'D' : shiftDay === 10 ? 'R' : shiftDay < 21 ? 'N' : 'R';
        }
      } else if (!isOpTeam) {
        // Non-OP Teams: Mon-Sat 'D', Sun 'R'
        calculatedShift = dayOfWeek === 0 ? 'R' : 'D';
      } else {
        // OP Teams (A/B/C): 22-day cycle
        calculatedShift = shiftDay < 10 ? 'D' : shiftDay === 10 ? 'R' : shiftDay < 21 ? 'N' : 'R';
      }

      const diffDaysFromAnchor = diffDays + 1;
      let onSiteDays = 0;
      let dynamicLeaveDue = '-';

      if (isOffDuty) {
        onSiteDays = 0;
        dynamicLeaveDue = addDaysStr(onSiteDate, 30);
      } else {
        if (isInitiallyOff) {
          onSiteDays = diffDaysFromAnchor > 30 ? diffDaysFromAnchor - 30 : 0;
        } else {
          onSiteDays = diffDaysFromAnchor > 0 ? diffDaysFromAnchor : 0;
        }
        dynamicLeaveDue = addDaysStr(onSiteDate, 90);
      }

      const pct = isOffDuty ? 0 : Math.min(100, Math.round((onSiteDays / 90) * 100));

      return {
        ...m,
        status,
        todayShift: calculatedShift,
        onSiteDate,
        onSiteDays,
        dynamicLeaveDue,
        pct,
      };
    });
  }, [baseList, localOverrides, baselineDateStr]);


  // Precomputed KPI and Filter Counts in a single memoized pass
  const kpiData = useMemo(() => {
    const totalStaff = allStaff.length;
    let countOnSite = 0, countOffDuty = 0, countResident = 0, demobDueSoon = 0, handoverGapAlert = 0, fatigueOverstay = 0, plannedInbound = 0;
    const currentMonthPrefix = baselineDateStr.slice(0, 7);

    for (let i = 0; i < totalStaff; i++) {
      const s = allStaff[i];
      if (s.isLocalResident) {
        countResident++;
      } else if (s.status === 'OFF_DUTY') {
        countOffDuty++;
        if (s.dynamicLeaveDue.startsWith(currentMonthPrefix)) plannedInbound++;
      } else {
        countOnSite++;
        if (s.onSiteDays >= 76 && s.onSiteDays <= 90) demobDueSoon++;
        if (s.onSiteDays > 90) fatigueOverstay++;
        if (!s.designatedReliever || s.designatedReliever === '-' || s.designatedReliever === 'None') handoverGapAlert++;
      }
    }

    return {
      totalStaff, countOnSite, countOffDuty, countResident,
      onSitePct: totalStaff > 0 ? Math.round((countOnSite / totalStaff) * 100) : 0,
      demobDueSoon, handoverGapAlert, fatigueOverstay, plannedInbound,
    };
  }, [allStaff, baselineDateStr]);

  // Filtered and sorted personnel list
  const displayList = useMemo(() => {
    let list = allStaff;
    if (activeFilter === 'ON_SITE') list = list.filter((s) => s.status === 'ON_SITE');
    else if (activeFilter === 'OFF_DUTY') list = list.filter((s) => s.status === 'OFF_DUTY');
    else if (activeFilter === 'RESIDENT') list = list.filter((s) => s.isLocalResident);

    const sorted = [...list];
    sorted.sort((a, b) => getStaffSortOrder(a.id) - getStaffSortOrder(b.id));
    return sorted;
  }, [allStaff, activeFilter]);

  const handleUpdateField = (id: string, field: 'startDate', value: string) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
    if (field === 'startDate' && onUpdateStartDate) onUpdateStartDate(id, value);
  };

  return (
    <div className="space-y-1.5 bg-[#d4d0c8] p-1.5 font-sans text-xs">
      {/* HEADER BAR */}
      <div className="bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-3 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between shadow-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 font-black text-base leading-none">■</span>
          <span className="text-[13px] font-black tracking-wider text-slate-900 uppercase">ROTATION TRACKER</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="win-btn px-3 py-0.5 text-xs font-bold bg-[#d4d0c8] border border-gray-600 hover:bg-slate-200 cursor-pointer shadow-xs active:translate-y-px text-slate-900"
        >
          <span>Request AL</span>
        </button>
      </div>

      {/* 1. TOP KPI SECTION (3 Dark Blue Header Boxes) */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 border-[3px] border-t-white border-l-white border-r-[#7a7a7a] border-b-[#7a7a7a] bg-[#d4d0c8] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#7a7a7a]">
        {[
          {
            title: 'SITE STATUS',
            rows: [
              { label: 'On-Site POB', value: `${kpiData.countOnSite} / ${kpiData.totalStaff} (${kpiData.onSitePct}%)` },
              { label: 'Annual Leave (AL)', value: `${kpiData.countOffDuty} / ${kpiData.totalStaff}` },
              { label: 'Local Commuters', value: `${kpiData.countResident} (Day Work)` },
            ],
          },
          {
            title: 'ROTATION AUDIT',
            rows: [
              { label: 'Leave Due (<=14d)', value: `${kpiData.demobDueSoon} Personnel` },
              { label: 'Overstay (>90d)', value: kpiData.fatigueOverstay === 0 ? 'Compliant (0)' : `${kpiData.fatigueOverstay} Violation` },
              { label: 'Reliever Coverage', value: kpiData.handoverGapAlert === 0 ? '100% Assigned' : `${kpiData.handoverGapAlert} Uncovered` },
            ],
          },
          {
            title: 'ROTATION SCHEDULE',
            rows: [
              { label: 'Inbound (Return)', value: `${kpiData.plannedInbound} (This Month)` },
              { label: 'Outbound (Leave)', value: `${kpiData.demobDueSoon} Personnel` },
              { label: 'Leadership Coverage', value: 'Edi / Shadiq (Guarded)' },
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

      {/* 2. HEADER ACTIONS & PRECOMPUTED QUICK FILTERS (Classic SCADA Bevel Toolbar) */}
      <div className="bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] px-2 py-1 flex items-center justify-between flex-wrap gap-2 text-xs select-none">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-800 mr-1 text-[11px] uppercase tracking-wider">Filter:</span>
          {(
            [
              { id: 'ALL', label: `All (${kpiData.totalStaff})` },
              { id: 'ON_SITE', label: `On-Site (${kpiData.countOnSite})` },
              { id: 'OFF_DUTY', label: `Off-Duty (${kpiData.countOffDuty})` },
              { id: 'RESIDENT', label: `Resident (${kpiData.countResident})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-0.5 text-xs cursor-pointer active:translate-y-px ${
                activeFilter === tab.id
                  ? 'bg-[#b8b3a8] text-slate-950 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white font-black shadow-inner'
                  : 'bg-[#d4d0c8] text-slate-800 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] font-bold shadow-xs hover:bg-[#e0dcd4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 border border-slate-300 rounded shadow-2xs">
          <label htmlFor="rotation-baseline-date" className="font-bold text-slate-500 cursor-pointer">
            BASELINE:
          </label>
          <input
            id="rotation-baseline-date"
            type="date"
            value={baselineDateStr}
            onChange={(e) => setInternalBaselineDate(e.target.value)}
            className="font-black text-slate-900 bg-transparent border-0 outline-none p-0 cursor-pointer text-[11px] font-mono"
          />
        </div>
      </div>

      {/* 3. TABLE (13 Columns, UPPERCASE Headers, Split ERT/Comm) */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse font-sans text-sm win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400 text-slate-800 text-[13px] font-bold py-2">
              <th className="py-2 px-1.5 border-r border-slate-300 w-10 text-center">NO.</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-[170px] min-w-[170px] text-center">NAME</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-[105px] min-w-[105px] text-center">EMP ID</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-40 text-center">POSITION</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-[135px] min-w-[135px] text-center">TEAM</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-[105px] min-w-[105px] text-center">STATUS</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-[65px] min-w-[65px] text-center">SHIFT</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-[145px] min-w-[145px] text-center">ON-SITE DATE</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-40 text-center">DAYS (90D)</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-36 text-center">DUE DATE</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-36 text-center">ERT ROLE</th>
              <th className="py-2 px-1.5 border-r border-slate-300 w-28 text-center">RADIO CH</th>
              <th className="py-2 px-1.5 text-center w-32">CONTACT NO</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((m, idx) => {
              const isSelected = selectedEmpId === m.id;
              const isResident = m.isLocalResident;
              const isOffDuty = m.status === 'OFF_DUTY';

              return (
                <tr
                  key={m.id}
                  onClick={() => onSelectEmployee?.(m.id)}
                  className={`h-11 cursor-pointer transition-colors duration-150 border-b border-slate-300 ${
                    isSelected ? 'bg-sky-100/80 border-l-4 border-sky-600' : idx % 2 === 0 ? 'bg-white hover:bg-sky-50/70' : 'bg-slate-50 hover:bg-sky-50/70'
                  }`}
                >
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-sm text-slate-700">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-300 w-[170px] min-w-[170px] whitespace-nowrap text-sm font-bold text-slate-900 text-center">
                    {m.name}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 w-[105px] min-w-[105px] whitespace-nowrap text-xs font-mono font-bold text-slate-700 text-center">
                    {m.id}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-slate-800 whitespace-nowrap text-xs font-bold text-center uppercase tracking-normal">{m.position}</td>
                  <td className="p-1.5 border-r border-slate-300 w-[135px] min-w-[135px] text-center whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-900">{m.team}</span>
                  </td>
                  <td className="p-1.5 border-r border-slate-300 w-[105px] min-w-[105px] text-center whitespace-nowrap">
                    {m.status === 'RESIDENT' ? (
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 rounded-xs">Resident</span>
                    ) : m.status === 'OFF_DUTY' ? (
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-xs">Off-Duty</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xs">On-Site</span>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 w-[65px] min-w-[65px] text-center whitespace-nowrap">
                    {m.todayShift === 'D' ? (
                      <span className="w-6 h-6 inline-flex items-center justify-center font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-400 rounded-xs">D</span>
                    ) : m.todayShift === 'N' ? (
                      <span className="w-6 h-6 inline-flex items-center justify-center font-bold text-xs bg-blue-100 text-blue-800 border border-blue-400 rounded-xs">N</span>
                    ) : m.todayShift === 'R' ? (
                      <span className="w-6 h-6 inline-flex items-center justify-center font-bold text-xs bg-slate-200 text-slate-700 border border-slate-400 rounded-xs">R</span>
                    ) : (
                      <span className="w-8 h-6 inline-flex items-center justify-center font-bold text-xs bg-amber-200 text-amber-900 border border-amber-400 rounded-xs">OFF</span>
                    )}
                  </td>
                  <td className="p-0 border-r border-slate-300 w-[145px] min-w-[145px] font-mono text-center bg-inherit" onClick={(e) => e.stopPropagation()}>
                    {isResident ? (
                      <span className="text-slate-400 font-normal text-xs inline-flex items-center justify-center w-full h-9">-</span>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <input
                          type="date"
                          value={m.onSiteDate}
                          onChange={(e) => handleUpdateField(m.id, 'startDate', e.target.value)}
                          className="w-[115px] h-8 px-1 text-center font-mono font-bold text-xs text-slate-900 bg-transparent border border-slate-300 rounded cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-1"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center">
                    {isResident || isOffDuty ? (
                      <span className="text-sm font-mono font-medium text-slate-400">-</span>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full max-w-[140px] mx-auto">
                        <div className="flex items-center justify-center gap-1.5 text-xs mb-1 font-mono font-bold text-slate-900">
                          <span className="font-black text-blue-900 text-sm">{m.onSiteDays}d</span>
                          <span className="text-slate-600 font-semibold">/ 90d</span>
                          <span className={`font-bold text-xs ${m.pct >= 90 ? 'text-rose-700 font-black' : m.pct >= 70 ? 'text-amber-700' : 'text-slate-600'}`}>({m.pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 border border-slate-300 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${m.pct >= 90 ? 'bg-rose-600' : m.pct >= 70 ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(m.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-center whitespace-nowrap text-sm font-semibold text-slate-900">
                    {isResident || !m.dynamicLeaveDue || m.dynamicLeaveDue === '-' ? (
                      <span className="text-slate-400 font-normal">-</span>
                    ) : (
                      <span className={m.onSiteDays >= 83 && !isOffDuty ? 'text-rose-800 font-black' : 'font-semibold'}>
                        {m.dynamicLeaveDue}
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center whitespace-nowrap text-sm font-semibold text-slate-800">
                    {m.ertRole && m.ertRole !== 'None' ? m.ertRole : '-'}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center whitespace-nowrap font-mono text-sm font-semibold text-slate-900">
                    {m.radioCh || '-'}
                  </td>
                  <td className="p-1.5 text-center whitespace-nowrap font-mono text-sm font-semibold text-slate-900">
                    {formatContactNo(m.contactNo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 border-t-2 border-slate-400 font-bold text-slate-800 text-sm">
              <td className="p-2 border-r border-slate-300"></td>
              <td colSpan={12} className="p-2 pl-3 text-slate-700 font-mono text-left">
                TOTAL DISPLAYED: <span className="text-slate-900 font-black">{displayList.length}</span> / {allStaff.length} PERSONNEL
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. ANNUAL LEAVE (AL) APPLICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-[90vw] max-w-5xl max-h-[90vh] flex flex-col bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-2xl p-2 font-sans text-xs select-none">
            {/* Title Bar */}
            <div className="bg-[#000080] text-white px-3 py-1.5 font-bold text-sm flex items-center justify-between mb-2 shrink-0">
              <span>ANNUAL LEAVE (AL) APPLICATION FORM</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="win-btn px-1.5 py-0.5 text-[10px] font-bold bg-[#d4d0c8] text-black border border-black cursor-pointer active:translate-y-px"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono">
              <div>
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Personnel:</label>
                <select className="w-full bg-white border border-slate-400 py-2 px-3 text-sm outline-none cursor-pointer text-slate-900 font-semibold">
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Leave Type:</label>
                <select className="w-full bg-white border border-slate-400 py-2 px-3 text-sm outline-none cursor-pointer text-slate-900 font-semibold">
                  <option value="ANNUAL_LEAVE">Annual Leave (AL)</option>
                  <option value="COMPASSIONATE">Compassionate Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="SPECIAL">Special Rotation Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Start Date:</label>
                  <input
                    type="date"
                    defaultValue={todayStr}
                    className="w-full bg-white border border-slate-400 px-3 py-1.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">End Date:</label>
                  <input
                    type="date"
                    defaultValue={endStr}
                    className="w-full bg-white border border-slate-400 px-3 py-1.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Reliever:</label>
                <select className="w-full bg-white border border-slate-400 py-2 px-3 text-sm outline-none cursor-pointer text-slate-900 font-semibold">
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Reason / Remarks:</label>
                <textarea rows={6} className="w-full min-h-[120px] bg-white border border-slate-400 p-3 text-sm outline-none resize-none text-slate-900 font-sans" placeholder="Enter reason or handover details for leave request..." />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-400 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="win-btn px-5 py-2 font-bold text-sm bg-[#d4d0c8] border border-gray-700 hover:bg-slate-200 cursor-pointer shadow-xs active:translate-y-px text-slate-900"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="win-btn px-5 py-2 font-bold text-sm bg-[#d4d0c8] border border-gray-700 hover:bg-slate-200 cursor-pointer shadow-xs active:translate-y-px text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
