import React, { useState, useMemo } from 'react';
import { STAFF_MASTER_DATA } from '../../../data/manpowerMasterData';
import { StaffPersonnel, ShiftCode } from '../../../types/lng';

export type RotationFilter = 'ALL' | 'ON_SITE' | 'OFF_DUTY' | 'RESIDENT';

interface RotationPlanTabProps {
  manpowerData?: StaffPersonnel[];
  filteredPersonnel?: StaffPersonnel[];
  selectedEmpId?: string | null;
  onSelectEmployee?: (empId: string) => void;
  onUpdateStartDate?: (staffId: string, newDateStr: string) => void;
  onNavigateToMatrix?: (empId: string) => void;
  onRequestAL?: () => void;
}

const TEAM_OPTIONS = ['Management', 'TEAM-A', 'TEAM-B', 'TEAM-C', 'Maintenance', 'HSSE Team', 'Cargo Operation', 'HR / GA'];
const ONE_DAY_MS = 86400000;
const TODAY_MS = Date.parse('2026-09-04T00:00:00Z');

// Lightweight Date Arithmetic (UTC timestamp math)
const addDaysStr = (dateStr: string, days: number): string => {
  if (!dateStr || dateStr === '-' || dateStr === 'N/A') return '-';
  const ms = Date.parse(`${dateStr}T00:00:00Z`);
  return isNaN(ms) ? '-' : new Date(ms + days * ONE_DAY_MS).toISOString().slice(0, 10);
};

const calcDaysOnSite = (startDateStr: string): number => {
  if (!startDateStr || startDateStr === '-' || startDateStr === 'N/A') return 0;
  const ms = Date.parse(`${startDateStr}T00:00:00Z`);
  return isNaN(ms) || ms > TODAY_MS ? 0 : Math.floor((TODAY_MS - ms) / ONE_DAY_MS) + 1;
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
}: RotationPlanTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const endStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [activeFilter, setActiveFilter] = useState<RotationFilter>('ALL');
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, { team?: string; status?: string; shift?: ShiftCode; startDate?: string; reliever?: string }>
  >({});

  // Base list resolution
  const baseList = useMemo(() => {
    const raw = manpowerData && manpowerData.length > 0 ? manpowerData : filteredPersonnel;
    if (raw && raw.length > 0) {
      return raw.map((m) => {
        const isResident = m.isLocalResident === true || m.department === 'HR_GA';
        return {
          id: m.id,
          name: m.name,
          position: (m as any).position || m.role || 'Field Operator',
          team: (m as any).team || m.teamName || 'Management',
          department: m.department,
          isLocalResident: isResident,
          status: m.currentStatus || 'ON_SITE',
          todayShift: m.todayShift || 'D',
          cycleStartDate: m.cycleStartDate && m.cycleStartDate !== 'N/A' && m.cycleStartDate !== '-' ? m.cycleStartDate : isResident ? '-' : '2026-08-15',
          designatedReliever: (m as any).designatedReliever || m.relieverName || '-',
          contactNo: m.contactNo || '-',
          radioCh: (m as any).radioCh || m.radioChannel || '-',
          ertRole: (m as any).ertRole || 'None',
        };
      });
    }

    return STAFF_MASTER_DATA.map((s) => {
      const isResident = s.isLocalResident || s.department === 'HR_GA';
      const cycleStart = isResident ? '-' : s.team.includes('TEAM-B') ? '2026-07-31' : s.team.includes('TEAM-C') ? '2026-07-26' : (s.department === 'MAINTENANCE' || s.department === 'HSSE' || s.department === 'Cargo Logistic') ? '2026-08-01' : '2026-08-15';
      return {
        id: s.id, name: s.name, position: s.position, team: s.team, department: s.department, isLocalResident: s.isLocalResident,
        status: s.defaultShift === 'Off' ? 'OFF_DUTY' : 'ON_SITE', todayShift: s.defaultShift as ShiftCode,
        cycleStartDate: cycleStart, designatedReliever: s.designatedReliever || '-', contactNo: s.contactNo, radioCh: s.radioCh, ertRole: s.ertRole,
      };
    });
  }, [manpowerData, filteredPersonnel]);

  // Combined staff items with user edits
  const allStaff = useMemo(() => {
    return baseList.map((m) => {
      const ov = localOverrides[m.id] || {};
      const status = ov.status || m.status;
      const cycleStartDate = ov.startDate || m.cycleStartDate;
      const isResident = m.isLocalResident;
      const onSiteDays = isResident || status === 'OFF_DUTY' ? 0 : calcDaysOnSite(cycleStartDate);
      const isOffDuty = !isResident && (status === 'OFF_DUTY' || onSiteDays > 90);
      const dynamicLeaveDue = isResident ? '-' : isOffDuty ? addDaysStr(cycleStartDate, 30) : addDaysStr(cycleStartDate, 90);

      return {
        ...m,
        team: ov.team || m.team,
        status: isResident ? 'RESIDENT' : (isOffDuty ? 'OFF_DUTY' : 'ON_SITE'),
        todayShift: ov.shift || m.todayShift,
        cycleStartDate,
        designatedReliever: ov.reliever || m.designatedReliever,
        onSiteDays,
        dynamicLeaveDue,
        pct: isResident || isOffDuty ? 0 : Math.min(100, Math.round((onSiteDays / 90) * 100)),
      };
    });
  }, [baseList, localOverrides]);


  // Precomputed KPI and Filter Counts in a single memoized pass
  const kpiData = useMemo(() => {
    const totalStaff = allStaff.length;
    let countOnSite = 0, countOffDuty = 0, countResident = 0, demobDueSoon = 0, handoverGapAlert = 0, fatigueOverstay = 0, plannedInbound = 0;

    for (let i = 0; i < totalStaff; i++) {
      const s = allStaff[i];
      if (s.isLocalResident) {
        countResident++;
      } else if (s.status === 'OFF_DUTY') {
        countOffDuty++;
        if (s.dynamicLeaveDue.startsWith('2026-09')) plannedInbound++;
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
  }, [allStaff]);

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

  const handleUpdateField = (id: string, field: 'team' | 'status' | 'shift' | 'startDate' | 'reliever', value: any) => {
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
          <span className="font-bold text-slate-500">BASELINE:</span>
          <span className="font-black text-slate-900">2026-09-04</span>
        </div>
      </div>

      {/* 3. TABLE (13 Columns, UPPERCASE Headers, Split ERT/Comm) */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400 text-slate-800 text-[10px]">
              <th className="p-1 border-r border-slate-300 w-10 text-center">NO.</th>
              <th className="p-1 border-r border-slate-300 w-[150px] min-w-[150px] text-center">NAME</th>
              <th className="p-1 border-r border-slate-300 w-[100px] min-w-[100px] text-center">EMP ID</th>
              <th className="p-1 border-r border-slate-300 w-36 text-center">POSITION</th>
              <th className="p-1 border-r border-slate-300 w-[130px] min-w-[130px] text-center">TEAM</th>
              <th className="p-1 border-r border-slate-300 w-[105px] min-w-[105px] text-center">STATUS</th>
              <th className="p-1 border-r border-slate-300 w-[65px] min-w-[65px] text-center">SHIFT</th>
              <th className="p-1 border-r border-slate-300 w-[125px] min-w-[125px] text-center">ON-SITE DATE</th>
              <th className="p-1 border-r border-slate-300 w-40 text-center">DAYS (90D)</th>
              <th className="p-1 border-r border-slate-300 w-32 text-center">DUE DATE</th>
              <th className="p-1 border-r border-slate-300 w-36 text-center">ERT ROLE</th>
              <th className="p-1 border-r border-slate-300 w-28 text-center">RADIO CH</th>
              <th className="p-1 text-center w-32">CONTACT NO</th>
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
                  <td className="p-1.5 border-r border-slate-300 w-[150px] min-w-[150px] whitespace-nowrap text-sm font-bold text-slate-900 text-left px-2.5">
                    {m.name}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 w-[100px] min-w-[100px] whitespace-nowrap text-sm font-mono font-semibold text-slate-700 text-center">
                    {m.id}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-slate-800 whitespace-nowrap text-sm font-semibold text-center uppercase tracking-wide">{m.position}</td>
                  <td className="p-0 border-r border-slate-300 w-[130px] min-w-[130px] text-center bg-inherit" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={m.team}
                      onChange={(e) => handleUpdateField(m.id, 'team', e.target.value)}
                      className="w-full h-8 px-1 text-center bg-transparent border-none outline-none font-semibold text-sm text-slate-900 cursor-pointer"
                    >
                      {TEAM_OPTIONS.map((t) => (<option key={t} value={t} className="bg-white text-slate-900">{t}</option>))}
                    </select>
                  </td>
                  <td className="p-0 border-r border-slate-300 w-[105px] min-w-[105px] text-center bg-inherit" onClick={(e) => e.stopPropagation()}>
                    {isResident ? (
                      <span className="font-semibold text-sm text-slate-900 inline-flex items-center justify-center w-full h-8 font-mono">Resident</span>
                    ) : (
                      <select
                        value={m.status}
                        onChange={(e) => handleUpdateField(m.id, 'status', e.target.value)}
                        className="w-full h-8 px-1 text-center bg-transparent border-none outline-none font-semibold text-sm text-slate-900 cursor-pointer"
                      >
                        <option value="ON_SITE" className="bg-white text-slate-900">On-Site</option>
                        <option value="OFF_DUTY" className="bg-white text-slate-900">Off-Duty</option>
                      </select>
                    )}
                  </td>
                  <td className="p-0 border-r border-slate-300 w-[65px] min-w-[65px] text-center bg-inherit" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={m.todayShift}
                      onChange={(e) => handleUpdateField(m.id, 'shift', e.target.value as ShiftCode)}
                      className="w-full h-8 px-1 text-center bg-transparent border-none outline-none font-bold text-sm text-slate-900 cursor-pointer"
                    >
                      <option value="D" className="bg-white text-slate-900">D</option>
                      <option value="N" className="bg-white text-slate-900">N</option>
                      <option value="Off" className="bg-white text-slate-900">Off</option>
                      <option value="R" className="bg-white text-slate-900">R</option>
                    </select>
                  </td>
                  <td className="p-0 border-r border-slate-300 w-[125px] min-w-[125px] font-mono text-center bg-inherit" onClick={(e) => e.stopPropagation()}>
                    {isResident ? (
                      <span className="text-slate-400 font-normal text-sm inline-flex items-center justify-center w-full h-8">-</span>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <input
                          type="date"
                          value={m.cycleStartDate}
                          onChange={(e) => handleUpdateField(m.id, 'startDate', e.target.value)}
                          className="w-[120px] h-8 px-1 text-center bg-transparent border-none outline-none font-mono font-semibold text-sm text-slate-900 cursor-pointer"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center">
                    {isResident || isOffDuty ? (
                      <span className="text-sm font-mono text-slate-400">-</span>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full max-w-[140px] mx-auto">
                        <div className="flex items-center justify-center gap-1.5 text-xs mb-1 font-mono font-semibold text-slate-900">
                          <span className="font-bold text-blue-900 text-sm">{m.onSiteDays}d</span>
                          <span className="text-slate-600">/ 90d</span>
                          <span className={`font-semibold ${m.pct >= 90 ? 'text-rose-700 font-black' : m.pct >= 70 ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>({m.pct}%)</span>
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
                      <span className="text-slate-400">-</span>
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
            <tr className="bg-slate-200 border-t-2 border-slate-400 font-bold text-slate-800 text-[10px]">
              <td className="p-1.5 border-r border-slate-300"></td>
              <td colSpan={12} className="p-1.5 pl-3 text-slate-700 font-mono text-left">
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
