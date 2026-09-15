// src/utils/fatigueRules.ts
//
// PURPOSE
//   Manpower 154h/14-day fatigue compliance calculations — 순수 함수 (React 미의존,
//   AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B Sub-stage A: extracted verbatim
//   from manpowerCalculations.ts (logic move only, no behavior change).

import { StaffPersonnel } from '../types/lng';
import { get3to1Shift } from './cycleEngine';

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
