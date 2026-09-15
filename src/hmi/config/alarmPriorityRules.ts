// src/hmi/config/alarmPriorityRules.ts
//
// PURPOSE
//   (domain, columnName)별 알람 임계값 테이블. instrumentType(PT/TT) 패턴이 아니라
//   patrolFieldMaps.ts 실제 컬럼명으로 키잉한다 — instrumentType은 useHmiLiveStore.ts에서
//   항상 'OTHER'로 고정돼(HMI-1b 디비에이션) 런타임에 도달 불가능하기 때문(HMI-2 pre-flight
//   확인 사항). 값 자체는 HJ 지시 원문 그대로이며 이 파일에서 임의 조정하지 않는다.
//
//   AAV temperature 규칙은 DS(하류, 기화 후·상온 근접)에만 적용한다. US(상류, LNG
//   유입측·극저온) 컬럼은 의도적으로 규칙 미등록 — getAlarmThresholds()가 undefined를
//   반환해야 하며, 이는 아직 채울 값이 없는 갭이지 버그가 아니다.
//
//   NG Buffer Tank pressure: patrolFieldMaps.ts에 해당 domain/컬럼이 아예 없어(재확인됨)
//   플레이스홀더 키조차 등록하지 않는다 — 별도 스테이지의 스키마 갭으로만 추적.

import type { PatrolDomain } from '../types/hmiCore';

export interface AlarmThresholdRule {
  LL: number;
  L: number;
  H: number;
  HH: number;
  /** 임계값이 정의된 단위 — 저장값 단위와 다르면 evaluateAlarmState.ts가 변환 후 비교한다. */
  unit: 'bar' | 'c';
}

type ColumnRuleMap = Record<string, AlarmThresholdRule>;

const AAV_DS_TEMPERATURE_RULE: AlarmThresholdRule = { LL: -140.0, L: -120.0, H: 35.0, HH: 45.0, unit: 'c' };
const ISO_TANK_PRESSURE_RULE: AlarmThresholdRule = { LL: 1.0, L: 2.0, H: 15.0, HH: 18.0, unit: 'bar' };

const ALARM_PRIORITY_RULES: Partial<Record<PatrolDomain, ColumnRuleMap>> = {
  aav: {
    temperature_gauge_ds_c: AAV_DS_TEMPERATURE_RULE,
    temperature_transmitter_ds_c: AAV_DS_TEMPERATURE_RULE,
    // temperature_gauge_us_c / temperature_transmitter_us_c: 의도적 미등록(US, 극저온측).
  },
  iso_tank_unloading_skid: {
    pressure_mpa: ISO_TANK_PRESSURE_RULE,
  },
  iso_tank_cargo: {
    pressure_mpa: ISO_TANK_PRESSURE_RULE,
  },
};

/** 규칙이 없으면 undefined — 호출자는 "평가 불가"로 취급해야 하며 NORMAL로 기본값 처리하면 안 된다. */
export function getAlarmThresholds(domain: PatrolDomain, columnName: string): AlarmThresholdRule | undefined {
  return ALARM_PRIORITY_RULES[domain]?.[columnName];
}
