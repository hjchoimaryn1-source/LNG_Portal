// src/hmi/alarms/evaluateAlarmState.ts
//
// PURPOSE
//   HmiInstrumentReading 1건의 알람 등급을 판정하는 순수 함수. useHmiLiveStore.ts는
//   이 함수를 호출만 하고 임계값 로직을 직접 갖지 않는다.
//
//   STUB — NotebookLM 임계값 데이터 도착 전까지 항상 'NORMAL'을 반환한다.
//   거짓 알람 판정을 막기 위한 의도적 스텁이며, 이번 스테이지에서 임계값
//   테이블을 채우지 않는다.

import type { HmiInstrumentReading, AlarmPriority } from '../types/hmiCore';

export function evaluateAlarmState(_reading: HmiInstrumentReading): AlarmPriority {
  return 'NORMAL';
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
