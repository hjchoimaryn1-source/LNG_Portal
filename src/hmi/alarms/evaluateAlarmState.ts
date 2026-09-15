// src/hmi/alarms/evaluateAlarmState.ts
//
// PURPOSE
//   HmiInstrumentReading 1건의 알람 등급을 판정하는 순수 함수. useHmiLiveStore.ts는
//   이 함수를 호출만 하고 임계값 로직을 직접 갖지 않는다.
//
//   Stage HMI-2b — alarmPriorityRules.ts의 (domain, columnName) 규칙으로 실제 판정한다.
//   규칙이 없거나(getAlarmThresholds() undefined) 값을 평가할 수 없는 경우(null/비숫자)
//   'NORMAL'을 반환하지만, 이는 AlarmPriority가 4단계 고정(5번째 UNKNOWN 멤버 추가는
//   이번 스테이지 범위 밖, HJ 승인 필요)이라 "평가 불가"와 "확인된 정상"을 타입 레벨에서
//   구분 못 하는 알려진 표현 한계다 — 이 자리에서 조용히 해소된 것으로 간주하지 말 것.
//
//   HMI-2a-final — rule.H/HH가 optional이 됐다(블루프린트에 상단 알람이 없는 계기 존재,
//   예: AAV DS 온도). H가 없으면 L 초과 시 곧바로 NORMAL로 판정하며, `value < undefined`가
//   항상 false라는 JS 암묵 동작에 기대 CRITICAL로 새는 것을 명시적으로 막는다 — "무한대
//   HH"가 아니라 "상단 알람 불가능"으로 취급한다.

import type { HmiInstrumentReading, AlarmPriority } from '../types/hmiCore';
import { getAlarmThresholds } from '../config/alarmPriorityRules';

/** iso_tank* pressure_mpa(patrolFieldMaps.ts 저장 단위) → alarmPriorityRules.ts 'bar' 규칙 변환 계수. */
const MPA_TO_BAR = 10;

export function evaluateAlarmState(reading: HmiInstrumentReading): AlarmPriority {
  const rule = getAlarmThresholds(reading.domain, reading.columnName);
  // "평가 불가"(규칙 없음/null/비숫자)와 "확인된 NORMAL"을 구분 못 하는 알려진 갭 — 위 PURPOSE 참고.
  if (rule === undefined || reading.value === null || typeof reading.value !== 'number') {
    return 'NORMAL';
  }

  const comparisonValue = rule.unit === 'bar' && reading.unit === 'MPa' ? reading.value * MPA_TO_BAR : reading.value;

  if (comparisonValue <= rule.LL) return 'CRITICAL';
  if (comparisonValue <= rule.L) return 'LOW';
  if (rule.H === undefined) return 'NORMAL';
  if (comparisonValue < rule.H) return 'NORMAL';
  if (rule.HH === undefined) return 'HIGH';
  if (comparisonValue < rule.HH) return 'HIGH';
  return 'CRITICAL';
}

const PRIORITY_RANK: Record<AlarmPriority, number> = { CRITICAL: 0, HIGH: 1, LOW: 2, NORMAL: 3 };

/** readings 배열 중 가장 심각한 등급 하나를 고른다 — 빈 배열이면 'NORMAL'. */
export function worstAlarmPriority(readings: HmiInstrumentReading[]): AlarmPriority {
  let worst: AlarmPriority = 'NORMAL';
  for (const reading of readings) {
    if (PRIORITY_RANK[reading.alarmPriority] < PRIORITY_RANK[worst]) worst = reading.alarmPriority;
  }
  return worst;
}
