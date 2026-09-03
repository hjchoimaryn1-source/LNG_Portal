// src/utils/manpowerCalculations.ts
import {
  DepartmentCode,
  StaffPersonnel,
  ShiftCode,
  TeamNameStandard,
  ERTRole,
} from '../types/lng';
import {
  generateRosterPattern,
  getDaysInMonth,
  generateMonthlyRoster,
  getStaffCompetencyStatus,
  INITIAL_MANPOWER_MASTER_RECORDS,
} from '../data/manpowerMasterData';

/**
 * Get current date adjusted for Western Indonesia Time (WIB, UTC+7)
 */
export const getWibDate = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

/**
 * Format Date instance to ISO YYYY-MM-DD string
 */
export const formatIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Standardize Position Titles to concise, professional industry names
 */
export function normalizePositionTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  const t = rawTitle.trim();
  const lower = t.toLowerCase();
  if (lower === '-' || lower === '') return '';

  if (lower.includes('site manager')) return 'Site Manager';
  if (
    lower.includes('team leader') ||
    lower.includes('lead engineer') ||
    lower.includes('mechanical engineer') ||
    lower.includes('mech. team leader')
  ) {
    if (lower.includes('mech')) return 'Mechanical Lead Engineer';
    return 'OP Team Leader';
  }
  if (lower.includes('dcs') || lower.includes('scada')) return 'DCS Control Technician';
  if (
    lower.includes('valve mechanic') ||
    lower.includes('mechanical tech') ||
    lower.includes('cryogenic valve') ||
    lower.includes('mech. team') ||
    lower.includes('mechanic')
  )
    return 'Mechanical Technician';
  if (lower.includes('sr. hse') || lower.includes('senior hse') || lower.includes('fire chief'))
    return 'Senior HSE Officer';
  if (lower.includes('hse') || lower.includes('hsse')) return 'HSE Officer';
  if (lower.includes('electrical')) return 'Electrical Systems Engineer';
  if (lower.includes('instrumentation') || lower.includes('gas detector'))
    return 'Instrumentation Technician';
  if (lower.includes('coordinator') || lower.includes('admin staff')) return 'HR / GA Coordinator';
  if (lower.includes('hr') || lower.includes('ga')) return 'HR / GA Officer';
  if (lower.includes('truck driver')) return 'Truck Driver';
  if (lower.includes('super cargo')) return 'Super Cargo';
  if (lower.includes('reach stacker')) return 'Reach Stacker Operator';
  if (lower.includes('field operator')) return 'Field Operator';

  return t;
}

/**
 * Calculate Return Due Date = Leave_Start_Date + 14 days (For Off-Day personnel e.g. Team-C)
 */
export const calcReturnDueDate = (
  leaveStartDateStr: string,
  leaveDurationDays: number = 14
): string => {
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

/**
 * Calculate Leave Due = OnSite_Start_Date + cycleLengthDays (For On-Site personnel e.g. Team-A, Team-B)
 */
export const calcRotationDueDate = (
  startDateStr: string,
  cycleLengthDays: number = 42
): string => {
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

/**
 * Calculate dynamic On-Site Days = (Today - Cycle_Start_Date) + 1
 */
export const calcOnSiteDays = (
  startDateStr: string,
  todayStr: string = '2026-09-02'
): number => {
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

/**
 * 3:1 Rotation Pattern Helper (2D-2N-2Off 6-day cycle from COD date)
 */
export function get3to1Shift(
  staff: StaffPersonnel,
  dateStr: string,
  codDate: string = '2026-09-15'
): ShiftCode {
  const isResident = staff.department === 'HR_GA';
  if (isResident) {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    return dayOfWeek === 0 || dayOfWeek === 6 ? 'Off' : 'D';
  }

  // Management / Site Manager
  if (staff.department === 'MANAGEMENT' && staff.id === 'EMP-001') {
    return 'D';
  }

  // Support teams: Maintenance, HSSE, Logistics
  if (
    staff.department === 'MAINTENANCE' ||
    staff.department === 'HSSE' ||
    staff.department === 'LOGISTICS'
  ) {
    return 'D';
  }

  // Operations Teams (OP_ALPHA, OP_BRAVO, OP_CHARLIE)
  const d1 = new Date(dateStr + 'T00:00:00');
  const d0 = new Date(codDate + 'T00:00:00');
  const diffDays = Math.floor((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24));
  const phase = ((diffDays % 6) + 6) % 6; // 0, 1, 2, 3, 4, 5

  // Team-A: Days 0,1: D | Days 2,3: N | Days 4,5: Off
  if (staff.department === 'OP_ALPHA' || staff.id === 'EMP-002') {
    if (phase === 0 || phase === 1) return 'D';
    if (phase === 2 || phase === 3) return 'N';
    return 'Off';
  }

  // Team-C: Days 0,1: N | Days 2,3: Off | Days 4,5: D
  if (staff.department === 'OP_CHARLIE') {
    if (phase === 0 || phase === 1) return 'N';
    if (phase === 2 || phase === 3) return 'Off';
    return 'D';
  }

  // Team-B: Days 0,1: Off | Days 2,3: D | Days 4,5: N
  if (staff.department === 'OP_BRAVO') {
    if (phase === 0 || phase === 1) return 'Off';
    if (phase === 2 || phase === 3) return 'D';
    return 'N';
  }

  return 'D';
}

export interface Get14dHoursOptions {
  simMode?: 'SIMULATION' | 'LIVE';
  isCodRosterApplied?: boolean;
  codBaselineDate?: string;
}

/**
 * Cumulative 14-Day Hours of Service calculator (Includes today's cover duty if assigned)
 */
export function get14dHours(
  staff: StaffPersonnel,
  isAssignedCoverToday: boolean = false,
  targetDateStr: string = '2026-09-02',
  options: Get14dHoursOptions = {}
): number {
  const {
    simMode = 'SIMULATION',
    isCodRosterApplied = true,
    codBaselineDate = '2026-09-15',
  } = options;

  if (simMode === 'SIMULATION' && isCodRosterApplied && targetDateStr >= codBaselineDate) {
    const dTarget = new Date(targetDateStr + 'T00:00:00');
    const dCod = new Date(codBaselineDate + 'T00:00:00');
    const daysSinceCod = Math.floor((dTarget.getTime() - dCod.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysInWindow = Math.min(Math.max(daysSinceCod, 1), 14);

    let shiftsWorked = 0;
    for (let i = 0; i < daysInWindow; i++) {
      const pastDate = new Date(dTarget);
      pastDate.setDate(dTarget.getDate() - i);
      const pStr = pastDate.toISOString().split('T')[0];
      if (pStr < codBaselineDate) break;
      const shift = get3to1Shift(staff, pStr, codBaselineDate);
      if (shift === 'D' || shift === 'N') {
        shiftsWorked++;
      }
    }
    let hours = shiftsWorked * 12;
    if (isAssignedCoverToday) hours += 12;
    return hours;
  }

  let baseHours = 144;
  if (staff.currentStatus === 'OFF_DUTY') baseHours = 0;
  else if (staff.id === 'EMP-005' || staff.id === 'EMP-007') baseHours = 132;
  else if (
    staff.id === 'EMP-006' ||
    staff.id === 'EMP-003' ||
    staff.id === 'EMP-002' ||
    staff.id === 'EMP-004'
  )
    baseHours = 144;

  if (isAssignedCoverToday) {
    baseHours += 12;
  }
  return baseHours;
}

export interface ERTSummaryResult {
  icCount: number;
  fireChiefCount: number;
  firstAiderCount: number;
  gasResponseCount: number;
  isICMet: boolean;
  isFireChiefMet: boolean;
  isFirstAiderMet: boolean;
  isGasResponseMet: boolean;
  isAllERTMet: boolean;
}

/**
 * 3. ERT Manning & Compliance Gate Calculation (Dynamic with Inline Absences & Standby Replacements)
 */
export function calculateERTSummary(
  manpowerData: StaffPersonnel[],
  dailyStaffStatus: Record<string, { status: string; replacementId?: string }>,
  dailyRestAssignments: Record<string, { coveringStaffId?: string }>
): ERTSummaryResult {
  const activeStaffIds = new Set<string>();

  manpowerData.forEach((m) => {
    if (m.currentStatus === 'OFF_DUTY' || m.department === 'OP_ALPHA') return;
    const st = dailyStaffStatus[m.id];
    const isRestLegacy = !!dailyRestAssignments[m.id];
    if ((!st || st.status === 'PRESENT') && !isRestLegacy) {
      activeStaffIds.add(m.id);
    }
  });

  Object.values(dailyStaffStatus).forEach((st) => {
    if (st.status !== 'PRESENT' && st.replacementId) {
      activeStaffIds.add(st.replacementId);
    }
  });

  Object.values(dailyRestAssignments).forEach((assign) => {
    if (assign.coveringStaffId) {
      activeStaffIds.add(assign.coveringStaffId);
    }
  });

  const activeCertifiedPersonnel = manpowerData.filter(
    (m) => activeStaffIds.has(m.id) && !getStaffCompetencyStatus(m).hasExpired
  );

  const icCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Incident Commander').length;
  const fireChiefCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Fire Chief').length;
  const firstAiderCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'First Aider').length;
  const gasResponseCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Gas Leak Response').length;

  const isICMet = icCount >= 1;
  const isFireChiefMet = fireChiefCount >= 1;
  const isFirstAiderMet = firstAiderCount >= 1;
  const isGasResponseMet = gasResponseCount >= 2;

  const isAllERTMet = isICMet && isFireChiefMet && isFirstAiderMet && isGasResponseMet;

  return {
    icCount,
    fireChiefCount,
    firstAiderCount,
    gasResponseCount,
    isICMet,
    isFireChiefMet,
    isFirstAiderMet,
    isGasResponseMet,
    isAllERTMet,
  };
}

/**
 * Active On-Duty Shift Personnel with 154h Fatigue Exceeded
 */
export function calculateExceeded154hPersonnel(
  manpowerData: StaffPersonnel[],
  teamBPersonnel: StaffPersonnel[],
  teamCPersonnel: StaffPersonnel[],
  dailyStaffStatus: Record<string, { status: string; replacementId?: string }>,
  dailyRestAssignments: Record<string, { coveringStaffId?: string }>,
  get14dHoursFn: (staff: StaffPersonnel, isAssignedCoverToday: boolean) => number
): StaffPersonnel[] {
  const activeOnDutyStaff: StaffPersonnel[] = [];

  teamBPersonnel.forEach((m) => {
    const st = dailyStaffStatus[m.id];
    if ((!st || st.status === 'PRESENT') && !dailyRestAssignments[m.id]) {
      activeOnDutyStaff.push(m);
    }
  });

  teamCPersonnel.forEach((m) => {
    const st = dailyStaffStatus[m.id];
    if ((!st || st.status === 'PRESENT') && !dailyRestAssignments[m.id]) {
      activeOnDutyStaff.push(m);
    }
  });

  Object.values(dailyStaffStatus).forEach((st) => {
    if (st.status !== 'PRESENT' && st.replacementId) {
      const cover = manpowerData.find((s) => s.id === st.replacementId);
      if (cover && !activeOnDutyStaff.some((s) => s.id === cover.id)) {
        activeOnDutyStaff.push(cover);
      }
    }
  });

  Object.values(dailyRestAssignments).forEach((assign) => {
    const cover = manpowerData.find((s) => s.id === assign.coveringStaffId);
    if (cover && !activeOnDutyStaff.some((s) => s.id === cover.id)) {
      activeOnDutyStaff.push(cover);
    }
  });

  return activeOnDutyStaff.filter((m) => {
    const isCover =
      Object.values(dailyStaffStatus).some((st) => st.status !== 'PRESENT' && st.replacementId === m.id) ||
      Object.values(dailyRestAssignments).some((assign) => assign.coveringStaffId === m.id);
    return get14dHoursFn(m, isCover) >= 154;
  });
}

/**
 * Fatigue limit boolean check
 */
export function checkHas154hViolation(exceededPersonnel: StaffPersonnel[]): boolean {
  return exceededPersonnel.length > 0;
}

export interface RollingHorizonDay {
  dateStr: string;
  dayLabel: string;
  dayNum: number;
  month: number;
  year: number;
  isToday: boolean;
  availableHeadcount: number;
  status: 'OK' | 'WARNING' | 'DANGER';
  badgeText: string;
  detailText: string;
}

/**
 * 7-Day Rolling Horizon Risk Strip Forecast Calculator
 */
export function calculateRolling7Days(
  manpowerData: StaffPersonnel[],
  dailyStaffStatus: Record<string, { status: string; replacementId?: string }>,
  ertSummary: ERTSummaryResult,
  has154hViolation: boolean,
  exceededPersonnelCount: number,
  getStaffRosterFn: (staff: StaffPersonnel) => ShiftCode[],
  codBaselineDate: string = '2026-09-15'
): RollingHorizonDay[] {
  const days: RollingHorizonDay[] = [];

  const wibToday = getWibDate();
  const baseYear = wibToday.getUTCFullYear();
  const baseMonth = wibToday.getUTCMonth() + 1;
  const startDay = wibToday.getUTCDate();

  for (let offset = 0; offset < 7; offset++) {
    const horizonDate = new Date(Date.UTC(baseYear, baseMonth - 1, startDay + offset));
    const currentDayNum = horizonDate.getUTCDate();
    const isToday = offset === 0;
    const dateStr = formatIsoDate(horizonDate);
    const monthLabel = String(horizonDate.getUTCMonth() + 1).padStart(2, '0');
    const dayLabel = isToday
      ? `${monthLabel}/${String(currentDayNum).padStart(2, '0')} (TODAY)`
      : `${monthLabel}/${String(currentDayNum).padStart(2, '0')} (+${offset}D)`;

    if (isToday) {
      const totalPlanned = 16;
      const unreplacedAbsence = Object.values(dailyStaffStatus).filter(
        (s) => s.status !== 'PRESENT' && !s.replacementId
      ).length;
      const activeHeadcount = totalPlanned - unreplacedAbsence;

      let status: 'OK' | 'WARNING' | 'DANGER' = 'OK';
      let badgeText = `${activeHeadcount}p OK`;
      let detailText = '100% Manning Cleared';

      if (!ertSummary.isAllERTMet || unreplacedAbsence > 0) {
        status = 'DANGER';
        badgeText = unreplacedAbsence > 0 ? `${activeHeadcount}p Shortage` : 'ERT Deficit';
        detailText = !ertSummary.isAllERTMet
          ? `ERT Deficit (Gas:${ertSummary.gasResponseCount}/2)`
          : `${unreplacedAbsence}p Unreplaced`;
      } else if (has154hViolation) {
        status = 'WARNING';
        badgeText = `${activeHeadcount}p Fatigue Alert`;
        detailText = `154h Risk (${exceededPersonnelCount} staff)`;
      }

      days.push({
        dateStr,
        dayLabel,
        dayNum: currentDayNum,
        month: horizonDate.getUTCMonth() + 1,
        year: horizonDate.getUTCFullYear(),
        isToday,
        availableHeadcount: activeHeadcount,
        status,
        badgeText,
        detailText,
      });
    } else {
      let onDutyCount = 0;
      let hasRotationRisk = false;

      manpowerData.forEach((m) => {
        const roster = getStaffRosterFn(m);
        const shift = roster[currentDayNum - 1];
        if (shift === 'D' || shift === 'N') {
          onDutyCount++;
        }
        if (dateStr < codBaselineDate) {
          if (m.id === 'EMP-010' && currentDayNum >= 3) {
            hasRotationRisk = true;
          }
          if (m.id === 'EMP-004' && currentDayNum >= 4) {
            hasRotationRisk = true;
          }
        }
      });

      let status: 'OK' | 'WARNING' | 'DANGER' = 'OK';
      let badgeText = `${onDutyCount}p OK`;
      let detailText = 'Normal Operations';

      if (onDutyCount < 13) {
        status = 'DANGER';
        badgeText = `${onDutyCount}p Shortage`;
        detailText = 'Deficit Below Threshold';
      } else if (hasRotationRisk) {
        status = 'WARNING';
        badgeText = `${onDutyCount}p Fatigue / AL Due`;
        detailText = 'Rotation Overdue Risk';
      }

      days.push({
        dateStr,
        dayLabel,
        dayNum: currentDayNum,
        month: horizonDate.getUTCMonth() + 1,
        year: horizonDate.getUTCFullYear(),
        isToday,
        availableHeadcount: onDutyCount,
        status,
        badgeText,
        detailText,
      });
    }
  }

  return days;
}

export interface RelieverCandidateItem {
  staff: StaffPersonnel;
  label: string;
  isPrimary: boolean;
}

/**
 * Rule-Based Delegation & Eligible Reliever Candidate Generator
 */
export function getEligibleRelieverCandidates(
  targetStaff: StaffPersonnel,
  manpowerData: StaffPersonnel[]
): RelieverCandidateItem[] {
  const targetRole = targetStaff.role;
  const targetDept = targetStaff.department;
  const candidates: RelieverCandidateItem[] = [];

  // Rule 1: Site Manager (EMP-001) -> Sr. OP Team Leader as Primary Acting Delegate
  if (targetStaff.id === 'EMP-001' || targetRole === 'Site Manager') {
    const shadiq = manpowerData.find((m) => m.id === 'EMP-002');
    if (shadiq) {
      candidates.push({
        staff: shadiq,
        label: `${shadiq.name} (Acting Site Manager - Primary Delegate)`,
        isPrimary: true,
      });
    }
    manpowerData
      .filter((m) => m.id !== 'EMP-001' && m.id !== 'EMP-002' && m.role.includes('OP Team Leader'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (OP Team Leader - Secondary Delegate)`,
          isPrimary: false,
        });
      });
    return candidates;
  }

  // Rule 2: Sr. OP Team Leader (EMP-002) -> Other OP Team Leaders as Rotation Relievers
  if (targetStaff.id === 'EMP-002') {
    manpowerData
      .filter((m) => m.id !== 'EMP-002' && m.role.includes('OP Team Leader'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (OP Team Leader - Rotation Reliever)`,
          isPrimary: true,
        });
      });
    manpowerData
      .filter((m) => m.role.includes('DCS'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (DCS Control Technician - Shift Lead Delegate)`,
          isPrimary: false,
        });
      });
    return candidates;
  }

  // Rule 3: OP Team Leaders (Asman, Juli) -> Other Team Leaders or Sr. DCS Control Technicians
  if (targetRole.includes('OP Team Leader')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.role.includes('OP Team Leader') || m.id === 'EMP-002'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (OP Team Leader Pool)`,
          isPrimary: true,
        });
      });
    manpowerData
      .filter((m) => m.role.includes('DCS'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (DCS Control Technician - Shift Lead Delegate)`,
          isPrimary: false,
        });
      });
    return candidates;
  }

  // Rule 4: Field Operator -> Only Field Operator & DCS Control Technician Pool
  if (targetRole.includes('Field Operator')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.role.includes('Field Operator') || m.role.includes('DCS')))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (${m.role} • ${m.teamName})`,
          isPrimary: true,
        });
      });
    return candidates;
  }

  // Rule 5: DCS Control Technician -> Same Operations DCS / Operator Pool
  if (targetRole.includes('DCS Control Technician')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.role.includes('DCS') || m.role.includes('Field Operator')))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (${m.role} • ${m.teamName})`,
          isPrimary: true,
        });
      });
    return candidates;
  }

  // Rule 6: HSSE Team -> Direct mutual cross-rotation (Arsyan AN <-> Chandra R.D)
  if (targetDept === 'HSSE' || targetRole.includes('HSE')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.department === 'HSSE' || m.role.includes('HSE')))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (${m.role} - Direct HSSE Cross-Rotation)`,
          isPrimary: true,
        });
      });
    return candidates;
  }

  // Rule 7: Maintenance, Logistics, HR/GA -> Same department acting/reliever pool
  manpowerData
    .filter((m) => m.id !== targetStaff.id && m.department === targetDept)
    .forEach((m) => {
      candidates.push({
        staff: m,
        label: `${m.name} (${m.role} • ${m.teamName})`,
        isPrimary: true,
      });
    });

  return candidates;
}

/**
 * Sort rotation personnel list according to statusSortMode
 */
export function sortRotationPersonnelList(
  list: StaffPersonnel[],
  statusSortMode: 'DEFAULT' | 'OFF_FIRST' | 'ONSITE_FIRST'
): StaffPersonnel[] {
  const result = [...list];

  if (statusSortMode === 'DEFAULT') {
    return result.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }

  const getStatusWeight = (staff: StaffPersonnel) => {
    const s = String(staff.currentStatus || '').toUpperCase();
    const isOffDuty = s.includes('OFF') || s.includes('LEAVE') || s.includes('REST');

    if (statusSortMode === 'OFF_FIRST') {
      return isOffDuty ? 1 : 2;
    }
    return isOffDuty ? 2 : 1;
  };

  result.sort((a, b) => {
    const wa = getStatusWeight(a);
    const wb = getStatusWeight(b);
    if (wa !== wb) return wa - wb;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  return result;
}

/**
 * Resolve staff monthly roster considering manual overrides
 */
export function resolveStaffMonthlyRoster(
  staff: StaffPersonnel,
  selectedYear: number,
  selectedMonth: number,
  monthOverrides: Record<string, ShiftCode[]>
): ShiftCode[] {
  const key = `${staff.id}_${selectedYear}_${selectedMonth}`;
  const overrides = monthOverrides[key];
  const totalDays = getDaysInMonth(selectedYear, selectedMonth);
  const defaultRoster = generateMonthlyRoster(staff, selectedYear, selectedMonth);

  if (overrides) {
    return Array.from({ length: totalDays }, (_, i) => (overrides[i] !== undefined ? overrides[i] : defaultRoster[i]));
  }
  return defaultRoster;
}

/**
 * Parse manpower CSV row data into strongly typed StaffPersonnel objects
 */
export function parseManpowerCsvData(
  parsedRows: Record<string, string>[],
  masterRecords: StaffPersonnel[] = INITIAL_MANPOWER_MASTER_RECORDS
): StaffPersonnel[] {
  return parsedRows
    .filter((row) => row.Emp_ID || row.id || row.Name)
    .map((row, idx) => {
      const id = row.Emp_ID || row.id || `EMP-${String(idx + 1).padStart(3, '0')}`;
      const name = row.Name || row.name || '';
      const dept = (row.Department_Code || row.department || 'MANAGEMENT') as DepartmentCode;
      const teamName = (row.Team_Name || row.teamName || 'Management') as TeamNameStandard;
      const baseMaster = masterRecords.find((r) => r.id === id);
      const rawRole =
        row.Position ||
        row.Role_Title ||
        row.Position_Role_Title ||
        row.position ||
        row.role ||
        baseMaster?.role ||
        '';
      const role =
        normalizePositionTitle(rawRole) ||
        normalizePositionTitle(baseMaster?.role || '') ||
        'Field Operator';
      const currentStatus = (row.Current_Status ||
        row.currentStatus ||
        baseMaster?.currentStatus ||
        'ON_SITE') as StaffPersonnel['currentStatus'];
      const todayShift = (row.Today_Shift ||
        row.todayShift ||
        baseMaster?.todayShift ||
        'D') as ShiftCode;
      const isOpDept =
        dept === 'OP_ALPHA' ||
        dept === 'OP_BRAVO' ||
        dept === 'OP_CHARLIE' ||
        id === 'EMP-001' ||
        id === 'EMP-002';
      const targetCycleDays =
        parseInt(row.Target_Cycle_Days || row.targetCycleDays || (isOpDept ? '42' : '90'), 10) ||
        (isOpDept ? 42 : 90);
      const cycleStartDate =
        row.Cycle_Start_Date || row.cycleStartDate || baseMaster?.cycleStartDate || '2026-08-15';
      const isOffDuty = currentStatus === 'OFF_DUTY';
      const onSiteDays = isOffDuty ? 0 : calcOnSiteDays(cycleStartDate, '2026-09-02');
      const nextRotationDueDate = isOffDuty
        ? calcReturnDueDate(cycleStartDate, 14)
        : calcRotationDueDate(cycleStartDate, targetCycleDays);
      const relieverName = row.Reliever_Name || row.relieverName || baseMaster?.relieverName || '-';
      const contactNo = row.Contact_No || row.contactNo || '';
      const radioChannel = row.Radio_Channel || row.radioChannel || '';
      const rosterDays = generateRosterPattern(dept, idx, id);

      return {
        id,
        name,
        role,
        department: dept,
        teamName,
        currentStatus,
        todayShift,
        onSiteDays,
        targetCycleDays,
        cycleStartDate,
        nextRotationDueDate,
        relieverName,
        contactNo,
        radioChannel,
        rosterDays,
        competencies: baseMaster?.competencies || [],
        complianceWarning: baseMaster?.complianceWarning || false,
        ertRole: (row.ERT_Role as ERTRole) || baseMaster?.ertRole || 'None',
      };
    });
}
