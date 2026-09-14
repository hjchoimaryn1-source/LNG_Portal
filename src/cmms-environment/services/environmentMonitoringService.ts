// src/cmms-environment/services/environmentMonitoringService.ts
//
// PURPOSE
//   Chapter 1(환경 모니터링) 순수 계산 함수 모음. DB/React 바인딩 없음
//   (src/cmms-mro-bridge/safetyGate/evaluateSafetyGateRules.ts와 동일한
//   순수함수 격리 패턴).
//
//   NP-10 Appendix 3의 규제기준값(오일&그리스 ≤10mg/L, BOD ≤30mg/L 등)은
//   원문상 샘플 참조행일 뿐 검증된 전체 규제표가 아니므로, 이 서비스는
//   PASS/FAIL을 자동판정하지 않는다 — status는 사람이 입력한 값을 그대로
//   신뢰하고, 값이 비어 있는지만 판별한다 (Global Constraint #6).

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * THWS(임시 유해폐기물 보관소) 처리 기한까지 남은 일수 — UI 카운트다운 표시용.
 * 음수면 기한 경과. 부수효과 없음(현재 시각은 Date.now()로만 읽는다).
 */
export function getThwsDaysRemaining(disposalDueDate: string): number {
  const due = new Date(disposalDueDate).getTime();
  const now = Date.now();
  return Math.ceil((due - now) / MS_PER_DAY);
}

/** status 필드가 있는 최소 형태 — 4개 모니터링 로그 타입 모두를 만족한다. */
export interface MonitoringStatusRecord {
  status?: 'PASS' | 'FAIL' | 'PENDING_REVIEW' | null;
}

/**
 * status가 비어 있으면(null/undefined) 검토 대기(PENDING_REVIEW 후보)로 플래그한다.
 * PASS/FAIL을 자동으로 결정하지 않는다 — 값이 있으면 그 값을 그대로 신뢰한다.
 */
export function flagPendingReview(record: MonitoringStatusRecord): boolean {
  return record.status === null || record.status === undefined;
}
