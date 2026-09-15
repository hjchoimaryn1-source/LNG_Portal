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
//
//   HMI-2b-final — 데드밴드/히스테리시스. previousPriority(선택 인자)가 주어지면, "그
//   임계값을 발생시킨 등급"으로부터 회복(덜 심각한 등급으로 전환)할 때만 해당 임계값에
//   데드밴드를 더해(하단) 또는 빼서(상단) 적용한다 — 임계값을 살짝 다시 터치하는 것만으로
//   등급이 바뀌지 않게 막는다. 반대로 더 심각한 등급으로 악화될 때는 즉시(데드밴드 없이)
//   반영한다 — 알람 SET은 지연시키지 않는다. 순수 함수 — 실제 "직전 등급" 저장은
//   useHmiLiveStore.ts가 소유(호출부마다 훅 로컬 state로), 이 파일은 모듈 스코프 상태를
//   두지 않는다.
//
//   KNOWN LIMITATION: previousPriority='CRITICAL'은 저측(LL)/고측(HH) 중 어느 쪽 CRITICAL인지
//   구분하지 못한다(AlarmPriority가 4단계 고정, side 정보 없음 — hmiCore.ts 참고). 한 번의
//   평가 호출 사이에 저측 CRITICAL에서 고측 CRITICAL로(또는 반대로) 직접 점프하는 물리적으로
//   비현실적인 경우, 반대쪽 임계값에도 불필요하게 데드밴드가 적용될 수 있다 — 온도/압력이
//   연속적으로 변하는 한 발생하지 않는다.

import type { HmiInstrumentReading, AlarmPriority } from '../types/hmiCore';
import { getAlarmThresholds } from '../config/alarmPriorityRules';

/** iso_tank* pressure_mpa(patrolFieldMaps.ts 저장 단위) → alarmPriorityRules.ts 'bar' 규칙 변환 계수. */
const MPA_TO_BAR = 10;

const TEMPERATURE_DEADBAND_C = 0.5;
const PRESSURE_DEADBAND_BAR = 0.1;

export function evaluateAlarmState(reading: HmiInstrumentReading, previousPriority?: AlarmPriority): AlarmPriority {
  const rule = getAlarmThresholds(reading.domain, reading.columnName);
  // "평가 불가"(규칙 없음/null/비숫자)와 "확인된 NORMAL"을 구분 못 하는 알려진 갭 — 위 PURPOSE 참고.
  if (rule === undefined || reading.value === null || typeof reading.value !== 'number') {
    return 'NORMAL';
  }

  const comparisonValue = rule.unit === 'bar' && reading.unit === 'MPa' ? reading.value * MPA_TO_BAR : reading.value;
  const deadband = rule.unit === 'c' ? TEMPERATURE_DEADBAND_C : PRESSURE_DEADBAND_BAR;

  const llThreshold = previousPriority === 'CRITICAL' ? rule.LL + deadband : rule.LL;
  if (comparisonValue <= llThreshold) return 'CRITICAL';

  const lThreshold = previousPriority === 'LOW' ? rule.L + deadband : rule.L;
  if (comparisonValue <= lThreshold) return 'LOW';

  if (rule.H === undefined) return 'NORMAL';
  const hThreshold = previousPriority === 'HIGH' ? rule.H - deadband : rule.H;
  if (comparisonValue < hThreshold) return 'NORMAL';

  if (rule.HH === undefined) return 'HIGH';
  const hhThreshold = previousPriority === 'CRITICAL' ? rule.HH - deadband : rule.HH;
  if (comparisonValue < hhThreshold) return 'HIGH';
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
