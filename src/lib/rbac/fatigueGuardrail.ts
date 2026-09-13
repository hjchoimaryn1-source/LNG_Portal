// src/lib/rbac/fatigueGuardrail.ts
//
// daily_shift_assignments 실데이터 소스: CMMS_Architecture.md §3.4 DDL.
// userAccountsSeed.ts와 동일한 이유로 실제 DB가 없어(런타임 드라이버 미설치, PART A
// 재검증 결과 동일) 라이브 쿼리 대신 TS 미러 dailyShiftAssignmentsSeed.ts
// (src/db/seeds/003_daily_shift_assignments_test.sql의 미러, TEST DATA ONLY)를 조회한다.
//
// KNOWN GAP (fail-open): userId에 대한 행이 하나도 없으면(신규 입사자 등 실데이터
// 미적재 상태) blocked:false를 반환한다. 이는 침묵 가정이 아니라 명시적으로 의도된
// 기본값이나, 실데이터 적재 전까지는 신규 사용자에 대해 이 가드레일이 사실상
// 무력화된다는 뜻이다 — 알려진 갭으로 별도 관리 필요.

import { DAILY_SHIFT_ASSIGNMENTS } from './dailyShiftAssignmentsSeed';

export function checkFatigueBlock(
  userId: string,
  targetDate: string
): { blocked: boolean; reason?: string; warning?: string } {
  const rows = DAILY_SHIFT_ASSIGNMENTS.filter((r) => r.userId === userId).sort((a, b) =>
    a.shiftDate < b.shiftDate ? 1 : a.shiftDate > b.shiftDate ? -1 : 0
  );

  if (rows.length === 0) {
    // Fail-open default — see KNOWN GAP note above. Surfaced explicitly (log +
    // warning field) so the gap is visible instead of silently passing.
    console.warn(
      `[FATIGUE_GUARDRAIL] No shift history for userId=${userId} (targetDate=${targetDate}) — ` +
        `treating as new onboarding, fail-open (not blocked).`
    );
    return { blocked: false, warning: 'FATIGUE_GUARDRAIL_NO_HISTORY_ONBOARDING' };
  }

  // Rule 1: consecutive worked days >= 14, using the most recent row at or before targetDate.
  const atOrBefore = rows.find((r) => r.shiftDate <= targetDate);
  if (atOrBefore && atOrBefore.consecutiveDays >= 14) {
    return { blocked: true, reason: 'FATIGUE_BLOCK_14_DAY_CONSECUTIVE_LIMIT' };
  }

  // Rule 2: insufficient rest recorded on the shift immediately preceding targetDate.
  const preceding = rows.find((r) => r.shiftDate < targetDate);
  if (preceding && preceding.restHoursPrior24h !== null && preceding.restHoursPrior24h < 10) {
    return { blocked: true, reason: 'FATIGUE_BLOCK_INSUFFICIENT_REST_10HR' };
  }

  // Rule 3: duplicate/overlapping same-day shift (both D and N recorded for targetDate).
  const sameDay = rows.filter((r) => r.shiftDate === targetDate);
  const hasDay = sameDay.some((r) => r.shiftType === 'D');
  const hasNight = sameDay.some((r) => r.shiftType === 'N');
  if (hasDay && hasNight) {
    return { blocked: true, reason: 'FATIGUE_BLOCK_DUPLICATE_SHIFT' };
  }

  return { blocked: false };
}
