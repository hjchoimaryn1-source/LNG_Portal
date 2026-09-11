// src/lib/rbac/fatigueGuardrail.ts
//
// LIMITATION: only same-day check possible — no dated shift history table exists yet,
// see CMMS_Architecture.md §3.4 for full spec pending a real schema.
//
// PART A 재검증 결과: `daily_shift_assignments` 또는 이에 준하는 날짜별 시프트 배정
// 테이블/타입은 src/ 어디에도 없다 (src/db/schema/cmms_schema.sql,
// schema/cmms_schema.sqlite.sql 모두 확인). 유일하게 존재하는 것은
// `StaffPersonnel.todayShift`(src/types/lng.ts:316) — 인원별 "현재" 시프트 1개만
// 갖는 프론트엔드 필드이며, 과거/미래 날짜별 이력은 저장하지 않는다.
// 따라서 targetDate와 실제로 비교 가능한 것은 "오늘" 하루뿐이며, 그 이상의
// 24시간 연속 근무 여부나 다일 누적 피로도 체크는 이 데이터만으로는 구현 불가능하다.

import { INITIAL_MANPOWER_MASTER_RECORDS } from '../../data/manpowerMasterData';
import type { ShiftCode } from '../../types/lng';

const NON_WORKING_SHIFT_CODES: ReadonlySet<ShiftCode> = new Set<ShiftCode>(['Off', 'OFF', 'AL', 'O', 'R']);

export function checkFatigueBlock(
  staffId: string,
  targetDate: string
): { blocked: boolean; reason?: string } {
  const staff = INITIAL_MANPOWER_MASTER_RECORDS.find((s) => s.id === staffId);
  if (!staff) {
    return { blocked: false };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (targetDate !== todayStr) {
    // No dated shift history exists to evaluate a non-today targetDate against.
    return { blocked: false };
  }

  if (!NON_WORKING_SHIFT_CODES.has(staff.todayShift)) {
    return {
      blocked: true,
      reason: `DUPLICATE_SAME_DAY_ASSIGNMENT: staff ${staffId} already has shift '${staff.todayShift}' recorded for ${targetDate}`,
    };
  }

  return { blocked: false };
}
