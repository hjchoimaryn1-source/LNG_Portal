// src/utils/manningCompliance.ts
//
// PURPOSE
//   ERT manning-gate compliance, rolling 7-day manning forecast, and reliever/delegation
//   candidate rules — 순수 함수 (React 미의존, AGENTS.md §3 Logic/Data Layer 컨벤션). These
//   didn't cleanly fit fatigueRules/rosterParsers/cycleEngine per Step 0's concern mapping, so
//   they landed in this 4th file. Phase 13 Target B Sub-stage A: extracted verbatim from
//   manpowerCalculations.ts (logic move only, no behavior change).

import { StaffPersonnel, ShiftCode } from '../types/lng';
import { getStaffCompetencyStatus } from '../data/manpowerMasterData';

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
