import React, { useMemo } from 'react';
import {
  INITIAL_MANPOWER_MASTER_RECORDS,
  getStaffCompetencyStatus,
} from '../../../data/manpowerMasterData';
import { StaffPersonnel } from '../../../types/lng';

export type RotationSortMode = 'DEFAULT' | 'OFF_FIRST' | 'ONSITE_FIRST';

interface RotationPlanTabProps {
  filteredPersonnel: StaffPersonnel[];
  selectedEmpId: string | null;
  statusSortMode: RotationSortMode;
  onToggleStatusSort: () => void;
  onSelectEmployee: (empId: string) => void;
  onUpdateStartDate: (staffId: string, newDateStr: string) => void;
  onNavigateToMatrix: (empId: string) => void;
}

function normalizePositionTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  const t = rawTitle.trim();
  const lower = t.toLowerCase();
  if (lower === '-' || lower === '') return '';

  if (lower.includes('site manager')) return 'Site Manager';
  if (lower.includes('team leader') || lower.includes('lead engineer') || lower.includes('mechanical engineer') || lower.includes('mech. team leader')) {
    if (lower.includes('mech')) return 'Mechanical Lead Engineer';
    return 'OP Team Leader';
  }
  if (lower.includes('dcs') || lower.includes('scada')) return 'DCS Control Technician';
  if (lower.includes('valve mechanic') || lower.includes('mechanical tech') || lower.includes('cryogenic valve') || lower.includes('mech. team') || lower.includes('mechanic')) return 'Mechanical Technician';
  if (lower.includes('sr. hse') || lower.includes('senior hse') || lower.includes('fire chief')) return 'Senior HSE Officer';
  if (lower.includes('hse') || lower.includes('hsse')) return 'HSE Officer';
  if (lower.includes('electrical')) return 'Electrical Systems Engineer';
  if (lower.includes('instrumentation') || lower.includes('gas detector')) return 'Instrumentation Technician';
  if (lower.includes('coordinator') || lower.includes('admin staff')) return 'HR / GA Coordinator';
  if (lower.includes('hr') || lower.includes('ga')) return 'HR / GA Officer';
  if (lower.includes('truck driver')) return 'Truck Driver';
  if (lower.includes('super cargo')) return 'Super Cargo';
  if (lower.includes('reach stacker')) return 'Reach Stacker Operator';
  if (lower.includes('field operator')) return 'Field Operator';

  return t;
}

const calcReturnDueDate = (leaveStartDateStr: string, leaveDurationDays: number = 14): string => {
  if (!leaveStartDateStr || leaveStartDateStr === 'N/A' || leaveStartDateStr === '-') return '-';
  const parts = leaveStartDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return '-';
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + leaveDurationDays);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
};

const calcRotationDueDate = (startDateStr: string, cycleLengthDays: number = 42): string => {
  if (!startDateStr || startDateStr === 'N/A' || startDateStr === '-') return '-';
  const parts = startDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return '-';
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + cycleLengthDays);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
};

const calcOnSiteDays = (startDateStr: string, todayStr: string = '2026-09-02'): number => {
  if (!startDateStr || startDateStr === 'N/A' || startDateStr === '-') return 0;
  const sParts = startDateStr.split('-').map(Number);
  const tParts = todayStr.split('-').map(Number);
  if (sParts.length < 3 || isNaN(sParts[0])) return 0;
  const [sy, sm, sd] = sParts;
  const [ty, tm, td] = tParts;
  const startDt = new Date(sy, sm - 1, sd);
  const todayDt = new Date(ty, tm - 1, td);
  const diffTime = todayDt.getTime() - startDt.getTime();
  if (diffTime < 0) return 0;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export default function RotationPlanTab({
  filteredPersonnel,
  selectedEmpId,
  statusSortMode,
  onToggleStatusSort,
  onSelectEmployee,
  onUpdateStartDate,
  onNavigateToMatrix,
}: RotationPlanTabProps) {
  const rotationPersonnelList = useMemo(() => {
    const list = [...filteredPersonnel];

    if (!statusSortMode || statusSortMode === 'DEFAULT') {
      return list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }

    const getStatusWeight = (staff: StaffPersonnel) => {
      const s = String((staff as any).currentStatus || (staff as any).status || '').toUpperCase();
      const isOffDuty = s.includes('OFF') || s.includes('LEAVE') || s.includes('REST');

      if (statusSortMode === 'OFF_FIRST') {
        return isOffDuty ? 1 : 2;
      }
      return isOffDuty ? 2 : 1;
    };

    list.sort((a, b) => {
      const wa = getStatusWeight(a);
      const wb = getStatusWeight(b);
      if (wa !== wb) return wa - wb;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    return list;
  }, [filteredPersonnel, statusSortMode]);

  return (
    <div className="space-y-1.5 bg-[#d4d0c8] p-1.5">
      <div className="bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-3 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between shadow-xs shrink-0 select-none">
        <div className="flex items-center">
          <span className="text-emerald-700 font-black mr-2 text-sm">■</span>
          <span className="uppercase tracking-wider">Rotation &amp; Leave Tracker (3:1 Cycle)</span>
        </div>
      </div>

      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300 w-48 text-center">Position</th>
            <th className="p-1.5 border-r border-slate-300 w-44 text-center">Personnel</th>
            <th
              onClick={onToggleStatusSort}
              className="p-1.5 border-r border-slate-300 cursor-pointer hover:bg-slate-300 transition-colors w-24 select-none text-center"
              title="Click to toggle Status sorting"
            >
              <span className="font-bold text-slate-800">
                Status {statusSortMode === 'OFF_FIRST' ? '▲' : '▼'}
              </span>
            </th>
            <th className="p-1.5 border-r border-slate-300 w-28 text-center">Start Date</th>
            <th className="p-1.5 border-r border-slate-300 w-44 text-center">Progress</th>
            <th className="p-1.5 border-r border-slate-300 w-28 text-center">Leave Due</th>
            <th className="p-1.5 text-center">Training & Due Date (Within 90 Days)</th>
          </tr>
        </thead>
        <tbody>
          {rotationPersonnelList.map((m, i) => {
            const isResident =
              m.department === 'HR_GA' ||
              m.id === 'EMP-017' ||
              m.id === 'EMP-018' ||
              m.cycleStartDate === 'N/A' ||
              m.cycleStartDate === '-';

            const isOpShift =
              m.department === 'OP_ALPHA' ||
              m.department === 'OP_BRAVO' ||
              m.department === 'OP_CHARLIE' ||
              m.id === 'EMP-002';
            const targetCycle = isOpShift ? 42 : (m.targetCycleDays || 90);
            const isOffDuty = !isResident && m.currentStatus === 'OFF_DUTY';

            const dynamicOnSiteDays = isResident || isOffDuty ? 0 : calcOnSiteDays(m.cycleStartDate, '2026-09-02');
            const dynamicRotationDue = isResident
              ? '-'
              : isOffDuty
                ? calcReturnDueDate(m.cycleStartDate, 14)
                : calcRotationDueDate(m.cycleStartDate, targetCycle);
            const pct = isOffDuty ? 0 : Math.min(100, Math.round((dynamicOnSiteDays / targetCycle) * 100));

            const isPending = !isResident && !isOffDuty && dynamicOnSiteDays >= (targetCycle - 5);
            const isDueSoon = !isResident && !isOffDuty && dynamicOnSiteDays >= (targetCycle - 7);
            const compStatus = getStaffCompetencyStatus(m);
            const isSelected = selectedEmpId === m.id;

            return (
              <tr
                key={m.id}
                onClick={() => onSelectEmployee(m.id)}
                className={`cursor-pointer transition-colors duration-150 ${isSelected
                  ? 'bg-sky-100/70 dark:bg-sky-950/40 border-l-4 border-sky-500'
                  : i % 2 === 0
                    ? 'bg-white hover:bg-sky-50/80 dark:hover:bg-slate-800/50'
                    : 'bg-slate-50 hover:bg-sky-50/80 dark:hover:bg-slate-800/50'
                  }`}
              >
                <td className="p-1.5 border-r border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                  {normalizePositionTitle(m.role) || normalizePositionTitle(INITIAL_MANPOWER_MASTER_RECORDS.find((r) => r.id === m.id)?.role || '') || m.role || 'Field Operator'}
                </td>

                <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950 whitespace-nowrap">
                  {m.name}
                </td>

                <td className="p-1.5 border-r border-slate-300 font-mono text-center">
                  {isOffDuty ? (
                    <span className="bg-amber-100 text-amber-900 border border-amber-400 font-bold px-2 py-0.5 rounded text-xs inline-block min-w-[65px]">
                      Off-Day
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold px-2 py-0.5 rounded text-xs inline-block min-w-[65px]">
                      On-Site
                    </span>
                  )}
                </td>

                <td className="p-1 border-r border-slate-300 font-mono text-center" onClick={(e) => e.stopPropagation()}>
                  {isResident ? (
                    <span className="text-slate-500 font-normal text-[10px]">-</span>
                  ) : (
                    <div className="inline-flex items-center justify-center win-sunken bg-white px-1.5 py-0.5 border border-slate-400">
                      <input
                        type="date"
                        value={m.cycleStartDate}
                        onChange={(e) => onUpdateStartDate(m.id, e.target.value)}
                        className="bg-transparent text-slate-900 font-mono font-extrabold text-[11px] focus:outline-none cursor-pointer text-center"
                        title="Click to modify Cycle Start Date"
                      />
                    </div>
                  )}
                </td>

                <td className="p-1.5 border-r border-slate-300 text-center">
                  {isResident ? (
                    <div className="flex items-center justify-center text-[10px] p-1 bg-slate-100 border border-slate-300 font-bold text-slate-700 text-center">
                      <span>Day Work</span>
                    </div>
                  ) : isOffDuty ? (
                    <div className="flex items-center justify-center text-[10px] p-1 bg-amber-50 border border-amber-300 font-bold text-amber-900 text-center">
                      <span>Off-Duty (Leave)</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 text-[10px] mb-1 font-mono">
                        <span className="font-bold text-slate-900">{dynamicOnSiteDays} / {targetCycle} Days</span>
                        <span className={`font-bold ${pct >= 90 ? 'text-rose-700' : 'text-slate-700'}`}>({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 border border-slate-400 overflow-hidden">
                        <div
                          className={`h-full ${pct >= 90
                            ? 'bg-rose-600'
                            : pct >= 75
                              ? 'bg-amber-500'
                              : 'bg-blue-800'
                            }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  )}
                </td>

                <td className="p-1.5 border-r border-slate-300 font-mono font-bold whitespace-nowrap text-center">
                  {isResident ? (
                    <span className="text-slate-500 font-normal text-[10px]">-</span>
                  ) : isOffDuty ? (
                    <span className="text-amber-950 bg-amber-100 px-1.5 py-0.5 border border-amber-300 rounded font-bold">
                      Return: {dynamicRotationDue}
                    </span>
                  ) : (
                    <span
                      className={
                        isDueSoon || isPending
                          ? 'text-rose-800 bg-rose-50 px-1.5 py-0.5 border border-rose-300 rounded font-bold'
                          : 'text-slate-900'
                      }
                    >
                      {dynamicRotationDue}
                    </span>
                  )}
                </td>

                <td className="p-1.5">
                  {isResident || (!compStatus.hasExpired && !compStatus.hasExpiringSoon) ? (
                    <div className="flex items-center justify-center">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-semibold inline-block border border-emerald-200">
                        ✓ All Valid
                      </span>
                    </div>
                  ) : compStatus.hasExpired ? (
                    <div
                      onClick={() => onNavigateToMatrix(m.id)}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-300 px-2 py-1 rounded text-xs cursor-pointer transition-colors shadow-2xs"
                      title="Click to open Training & Competency Matrix"
                    >
                      <span className="text-rose-900 font-bold">
                        {compStatus.expiredCerts.map((c: any) => `❌ ${c.code}: ${c.name} (Expired: ${c.expiryDate})`).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => onNavigateToMatrix(m.id)}
                      className="bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2 py-1 rounded text-xs cursor-pointer transition-colors shadow-2xs"
                      title="Click to open Training & Competency Matrix"
                    >
                      <span className="text-amber-900 font-bold">
                        {compStatus.expiringCerts.map((c: any) => `⚠️ ${c.code}: ${c.name} (Due: ${c.expiryDate})`).join(', ')}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
