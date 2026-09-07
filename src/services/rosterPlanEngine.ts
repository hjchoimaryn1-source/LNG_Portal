// src/services/rosterPlanEngine.ts
import { StaffPersonnel, ShiftCode } from '../types/lng';

export const SAFE_MANNING_THRESHOLD = 21;
export const DEFAULT_BASE_DATE = new Date('2026-09-01T00:00:00');

export interface RotationStatusResult {
  onSiteDays: number;
  remainingDays: number;
  isOverdue: boolean;
  targetDueDate: string;
}

export interface ShiftLeadersResult {
  dayShiftLeader: StaffPersonnel | null;
  nightShiftLeader: StaffPersonnel | null;
  isBackupActive: boolean;
  backupReason?: string;
}

export interface SafeManningValidation {
  isValid: boolean;
  isUnderManning: boolean;
  threshold: number;
  activeCount: number;
  deficit: number;
  warningFlag: boolean;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  alertMessage: string;
}

export interface TenDayCycleInfo {
  cycleDay: number; // 1 to 10
  daysRemaining: number;
  nextSwapDate: string;
  blockIndex: number;
}

/**
 * 1. Calculate 3:1 rotation status (90 days on-site, 30 days off-duty)
 * Dual-state handling:
 * - ON_SITE: evaluates tour days elapsed vs 90d target.
 * - OFF_DUTY: onSiteDays = 0, evaluates leave elapsed vs 30d target.
 */
export function calculateRotationStatus(
  status: string = 'ON_SITE',
  anchorDate: string,
  targetTourDays: number = 90,
  leaveDays: number = 30,
  referenceDate: Date = DEFAULT_BASE_DATE
): RotationStatusResult {
  if (!anchorDate || anchorDate === '-' || anchorDate === 'N/A') {
    return { onSiteDays: 0, remainingDays: targetTourDays, isOverdue: false, targetDueDate: '-' };
  }

  const start = new Date(anchorDate + 'T00:00:00');
  if (isNaN(start.getTime())) {
    return { onSiteDays: 0, remainingDays: targetTourDays, isOverdue: false, targetDueDate: '-' };
  }

  const diffMs = referenceDate.getTime() - start.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const isOffDuty = status === 'OFF_DUTY';
  const targetDays = isOffDuty ? leaveDays : targetTourDays;
  const onSiteDays = isOffDuty ? 0 : elapsedDays;
  const remainingDays = Math.max(0, targetDays - elapsedDays);
  const isOverdue = elapsedDays > targetDays;

  const dueDt = new Date(start.getTime());
  dueDt.setDate(dueDt.getDate() + targetDays);
  const targetDueDate = dueDt.toISOString().slice(0, 10);

  return { onSiteDays, remainingDays, isOverdue, targetDueDate };
}

/**
 * Helper to calculate 10-day shift swap cycle metrics
 */
export function get10DayCycleInfo(
  targetDate: Date,
  baseCycleDate: Date = DEFAULT_BASE_DATE
): TenDayCycleInfo {
  const diffDays = Math.floor(
    (targetDate.getTime() - baseCycleDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const blockIndex = Math.floor(diffDays / 10);
  const cycleDay = ((diffDays % 10) + 10) % 10 + 1; // 1-10
  const daysRemaining = 10 - cycleDay;

  const nextSwap = new Date(baseCycleDate.getTime());
  nextSwap.setDate(nextSwap.getDate() + (blockIndex + 1) * 10);
  const nextSwapDate = nextSwap.toISOString().split('T')[0];

  return { cycleDay, daysRemaining, nextSwapDate, blockIndex };
}

/**
 * 2. 10-day rotating shift cycle (Day 07:00-19:00 / Night 19:00-07:00) with 3:1 rotation.
 * Staggered 40 days apart so exactly 2 teams are on-site at all times.
 */
export function getShiftForDay(
  teamName: string,
  date: Date,
  baseCycleDate: Date = DEFAULT_BASE_DATE
): ShiftCode {
  const normTeam = (teamName || '').toUpperCase();
  const { blockIndex } = get10DayCycleInfo(date, baseCycleDate);
  const isEvenBlock = blockIndex % 2 === 0;

  // 3:1 rotation: 120 days total (90 days on-site, 30 days off-duty)
  const diffDays = Math.floor(
    (date.getTime() - baseCycleDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const cycleDay120 = ((diffDays % 120) + 120) % 120;

  // Stagger: Team A (0), Team B (40), Team C (80)
  let teamOffset = 0;
  if (normTeam.includes('TEAM-B') || normTeam.includes('BRAVO')) teamOffset = 40;
  else if (normTeam.includes('TEAM-C') || normTeam.includes('CHARLIE')) teamOffset = 80;

  const teamDay = (cycleDay120 - teamOffset + 120) % 120;
  const isOnDuty = teamDay < 90;

  if (!isOnDuty && (normTeam.includes('TEAM-A') || normTeam.includes('TEAM-B') || normTeam.includes('TEAM-C'))) {
    return 'AL';
  }

  // 10-day Day/Night Flip
  if (normTeam.includes('TEAM-B') || normTeam.includes('BRAVO')) {
    return isEvenBlock ? 'D' : 'N';
  }
  if (normTeam.includes('TEAM-C') || normTeam.includes('CHARLIE')) {
    return isEvenBlock ? 'N' : 'D';
  }
  if (normTeam.includes('TEAM-A') || normTeam.includes('ALPHA')) {
    return isEvenBlock ? 'D' : 'N';
  }

  // Support / Admin staff
  if (normTeam.includes('HR') || normTeam.includes('GA')) {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? 'Off' : 'D';
  }

  return 'D';
}

/**
 * 3. Dynamically resolve active Day and Night shift leaders with Pak Shadiq backup logic
 */
export function resolveActiveShiftLeaders(
  staffList: StaffPersonnel[],
  targetDate: Date
): ShiftLeadersResult {
  const isLeader = (s: StaffPersonnel) =>
    /leader/i.test(s.role) || /lead/i.test(s.role) || s.id === 'BSG259524' || s.id === 'BSG259833' || s.id === 'BSG259530';

  const leaders = staffList.filter(isLeader);
  const shadiq = leaders.find((s) => s.id === 'BSG259524' || /shadiq/i.test(s.name));
  const asman = leaders.find((s) => s.id === 'BSG259833' || /asman/i.test(s.name));
  const juli = leaders.find((s) => s.id === 'BSG259530' || /juli/i.test(s.name));

  const teamBShift = getShiftForDay('TEAM-B', targetDate);
  let dayLeader: StaffPersonnel | null = teamBShift === 'D' ? asman ?? null : juli ?? null;
  let nightLeader: StaffPersonnel | null = teamBShift === 'N' ? asman ?? null : juli ?? null;

  let isBackupActive = false;
  let backupReason: string | undefined;

  const isDayAvail = dayLeader && dayLeader.currentStatus === 'ON_SITE' && dayLeader.todayShift !== 'Off' && dayLeader.todayShift !== 'AL';
  const isNightAvail = nightLeader && nightLeader.currentStatus === 'ON_SITE' && nightLeader.todayShift !== 'Off' && nightLeader.todayShift !== 'AL';

  if (!isDayAvail && shadiq) {
    dayLeader = shadiq;
    isBackupActive = true;
    backupReason = 'Pak Shadiq deployed as Backup Day Shift Leader';
  } else if (!isNightAvail && shadiq) {
    nightLeader = shadiq;
    isBackupActive = true;
    backupReason = 'Pak Shadiq deployed as Backup Night Shift Leader';
  }

  return {
    dayShiftLeader: dayLeader,
    nightShiftLeader: nightLeader,
    isBackupActive,
    backupReason,
  };
}

/**
 * 4. Validate safe manning against 21 personnel threshold
 */
export function validateSafeManning(activeOnSiteCount: number): SafeManningValidation {
  const isUnderManning = activeOnSiteCount < SAFE_MANNING_THRESHOLD;
  const deficit = Math.max(0, SAFE_MANNING_THRESHOLD - activeOnSiteCount);
  const complianceRatio = Number((activeOnSiteCount / SAFE_MANNING_THRESHOLD).toFixed(2));
  const severity: 'NORMAL' | 'WARNING' | 'CRITICAL' =
    activeOnSiteCount >= SAFE_MANNING_THRESHOLD ? 'NORMAL' : activeOnSiteCount >= 18 ? 'WARNING' : 'CRITICAL';

  const alertMessage = isUnderManning
    ? `UNDER_MANNING ALERT: Headcount (${activeOnSiteCount}) below required minimum (${SAFE_MANNING_THRESHOLD}). Deficit: -${deficit} personnel.`
    : `Safe Manning Quorum Verified: ${activeOnSiteCount} personnel on-site (Threshold: ${SAFE_MANNING_THRESHOLD}).`;

  return {
    isValid: !isUnderManning,
    isUnderManning,
    threshold: SAFE_MANNING_THRESHOLD,
    activeCount: activeOnSiteCount,
    deficit,
    warningFlag: isUnderManning,
    severity,
    alertMessage,
  };
}
