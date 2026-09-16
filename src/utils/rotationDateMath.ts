// src/utils/rotationDateMath.ts
//
// PURPOSE
//   Manpower rotation date arithmetic (return/rotation due dates, on-site day count) —
//   순수 함수 (React 미의존, AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B
//   Sub-stage C: extracted verbatim from cycleEngine.ts (250-line cap cleanup, logic
//   move only, no behavior change).

/**
 * Calculate Return Due Date = Leave_Start_Date + leaveDurationDays (Default 30 days)
 */
export const calcReturnDueDate = (
  leaveStartDateStr: string,
  leaveDurationDays: number = 30
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
 * Calculate Rotation Due Date = OnSite_Date + cycleLengthDays (Default 90 days)
 */
export const calcRotationDueDate = (
  startDateStr: string,
  cycleLengthDays: number = 90
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
 * Calculate dynamic On-Site Days = (Today - OnSite_Date) + 1
 */
export const calcOnSiteDays = (
  startDateStr: string,
  todayStr: string = new Date().toISOString().slice(0, 10)
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
