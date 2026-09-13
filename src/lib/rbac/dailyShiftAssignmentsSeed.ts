// src/lib/rbac/dailyShiftAssignmentsSeed.ts
//
// TS 정적 미러 — src/db/seeds/003_daily_shift_assignments_test.sql(CMMS_Architecture.md §3.4)를
// 그대로 옮긴 in-memory 데이터셋. userAccountsSeed.ts와 동일한 이유로 실제 DB가 없어(런타임
// 드라이버 미설치, PART A 재검증 결과 동일) checkFatigueBlock이 이 배열을 직접 조회한다.
// 시드 SQL 파일 내용이 바뀌면 이 배열도 함께 갱신해야 한다.
//
// TEST DATA ONLY: synthetic rows for guardrail validation, not real attendance records.

export interface DailyShiftAssignmentSeedRow {
  userId: string;
  shiftDate: string; // YYYY-MM-DD
  shiftType: 'D' | 'N';
  hoursWorked: number;
  restHoursPrior24h: number | null;
  consecutiveDays: number;
}

export const DAILY_SHIFT_ASSIGNMENTS: DailyShiftAssignmentSeedRow[] = [
  // BSG259529 — clean case (targetDate=2026-09-05): no violation on any rule.
  { userId: 'BSG259529', shiftDate: '2026-09-05', shiftType: 'D', hoursWorked: 12, restHoursPrior24h: 14, consecutiveDays: 5 },
  // BSG259529 — feeds Rule 1 (day before the violation row, itself compliant).
  { userId: 'BSG259529', shiftDate: '2026-09-09', shiftType: 'D', hoursWorked: 12, restHoursPrior24h: 11, consecutiveDays: 13 },
  // BSG259529 — Rule 1 violation (targetDate=2026-09-10): consecutive_days >= 14.
  { userId: 'BSG259529', shiftDate: '2026-09-10', shiftType: 'D', hoursWorked: 12, restHoursPrior24h: 11, consecutiveDays: 14 },

  // BSG259524 — feeds Rule 2 (preceding day has insufficient rest).
  { userId: 'BSG259524', shiftDate: '2026-09-08', shiftType: 'N', hoursWorked: 12, restHoursPrior24h: 6, consecutiveDays: 3 },
  // BSG259524 — Rule 2 violation (targetDate=2026-09-09): preceding row's rest_hours_prior_24h < 10.
  { userId: 'BSG259524', shiftDate: '2026-09-09', shiftType: 'D', hoursWorked: 12, restHoursPrior24h: 11, consecutiveDays: 4 },

  // DEV-HQ-001 — Rule 3 violation (targetDate=2026-09-11): D and N both recorded same day.
  { userId: 'DEV-HQ-001', shiftDate: '2026-09-11', shiftType: 'D', hoursWorked: 8, restHoursPrior24h: 12, consecutiveDays: 2 },
  { userId: 'DEV-HQ-001', shiftDate: '2026-09-11', shiftType: 'N', hoursWorked: 8, restHoursPrior24h: 12, consecutiveDays: 2 },
];
