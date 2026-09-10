// src/utils/pmScheduleCalculator.ts
//
// PURPOSE
//   work_orders.next_due_date를 last_performed_at + pm_cycle_days로 계산하는
//   순수 함수. React/DB 바인딩 없음 (AGENTS.md 계층 분리 원칙) —
//   src/adapters/db/workOrderDao.ts가 레코드를 쓰기 직전에 호출한다.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * last_performed_at(ISO8601 date/datetime) + pm_cycle_days(일)로 다음 정비
 * 예정일(YYYY-MM-DD)을 계산한다. 둘 중 하나라도 없으면(아직 수행 이력이
 * 없거나 PM 주기가 설정되지 않은 WO) 스케줄을 계산할 수 없으므로 null을
 * 반환한다 — CM/1회성 WO가 이 컬럼에 값을 갖지 않는 것은 정상이다.
 */
export function computeNextDueDate(
  lastPerformedAt: string | null | undefined,
  pmCycleDays: number | null | undefined
): string | null {
  if (!lastPerformedAt || pmCycleDays === null || pmCycleDays === undefined) {
    return null;
  }
  if (!Number.isFinite(pmCycleDays) || pmCycleDays <= 0) {
    throw new RangeError(`pm_cycle_days must be a positive finite number, got ${pmCycleDays}`);
  }

  const lastPerformedMs = Date.parse(lastPerformedAt);
  if (Number.isNaN(lastPerformedMs)) {
    throw new RangeError(`lastPerformedAt is not a valid ISO date/time: "${lastPerformedAt}"`);
  }

  return new Date(lastPerformedMs + pmCycleDays * MS_PER_DAY).toISOString().slice(0, 10);
}

/** next_due_date가 기준일(asOf, 기본값 오늘) 이전이면 지연(overdue)으로 판정한다. */
export function isPmOverdue(nextDueDate: string | null | undefined, asOf: Date = new Date()): boolean {
  if (!nextDueDate) return false;
  return Date.parse(nextDueDate) < Date.parse(asOf.toISOString().slice(0, 10));
}
