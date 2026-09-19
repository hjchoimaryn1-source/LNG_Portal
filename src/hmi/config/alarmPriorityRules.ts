// src/hmi/config/alarmPriorityRules.ts
//
// PURPOSE
//   (domain, columnName)별 알람 임계값 테이블. instrumentType(PT/TT) 패턴이 아니라
//   patrolFieldMaps.ts 실제 컬럼명으로 키잉한다 — instrumentType은 useHmiLiveStore.ts에서
//   항상 'OTHER'로 고정돼(HMI-1b 디비에이션) 런타임에 도달 불가능하기 때문(HMI-2 pre-flight
//   확인 사항).
//
//   HMI-2a-final: AAV DS 온도 규칙을 NIAS-IS-LS-0004(Rev B, 승인) TAL-08C/TALL-08C 실측치로
//   교체했다 — 이전 -140/-120/35/45는 이 블루프린트 문서 이전의 추정 placeholder였다(HJ 확인,
//   addendum). TAL-08C(Low)=10°C, TALL-08C(Low-Low)=5°C이며 High/High-High 알람은 정의되지
//   않으므로 H/HH를 만들어 내지 않는다 — AlarmThresholdRule.H/HH가 optional로 바뀐 이유.
//
//   AAV temperature 규칙은 DS(하류, 기화 후·상온 근접)에만 적용한다. US(상류, LNG
//   유입측·극저온) 컬럼은 의도적으로 규칙 미등록 — getAlarmThresholds()가 undefined를
//   반환해야 하며, 이는 아직 채울 값이 없는 갭이지 버그가 아니다.
//
//   Stage E-4: AAV inlet DP(differential_pressure_us_barg)는 NIAS-IS-LS-0004에 High만
//   정의돼 있다(DPIA-01C/D, DPI-01E/F, H=0.5 barg — LL/L/HH 없음). 이 때문에
//   AlarmThresholdRule.LL/L도 H/HH처럼 optional로 바꿨다 — evaluateAlarmState.ts가 동일한
//   패턴(undefined면 해당 단계 건너뜀)으로 처리한다.
//
//   NG Buffer Tank pressure (Stage E-1로 컬럼 실재: pressure_gauge_barg/
//   pressure_transmitter_barg): NIAS-IS-LS-0004에 이 용기의 DCS 알람 설정치가 없다
//   (PSV-03 기계적 릴리프 14.1 Barg만 존재) — 컬럼은 있지만 의도적으로 규칙 미등록.
//   V-101 PSV 정정압력(14.1 Barg)은 MECHANICAL_RELIEF_REFERENCE_BARG로 별도 보관한다 —
//   HH 임계값이 아니며 evaluateAlarmState.ts가 소비해서는 안 된다(기계적 릴리프 기준치일 뿐,
//   계기 알람 판정과 무관).

import type { PatrolDomain } from '../types/hmiCore';
import { getAlarmSetpointOverride } from '../state/alarmSetpointOverrideCache';

export interface AlarmThresholdRule {
  /** 하단 경계 — NIAS-IS-LS-0004에 Low/Low-Low가 정의되지 않은 계기는 생략한다(임의 값 금지). */
  LL?: number;
  L?: number;
  /** 상단 경계 — NIAS-IS-LS-0004에 High/High-High가 정의되지 않은 계기는 생략한다(임의 값 금지). */
  H?: number;
  HH?: number;
  /** 임계값이 정의된 단위 — 저장값 단위와 다르면 evaluateAlarmState.ts가 변환 후 비교한다. */
  unit: 'bar' | 'c';
}

type ColumnRuleMap = Record<string, AlarmThresholdRule>;

/** NIAS-IS-LS-0004 Rev B, TAL-08C(L)=10°C / TALL-08C(LL)=5°C — Outlet Vaporizer, H/HH 미정의. */
const AAV_DS_TEMPERATURE_RULE: AlarmThresholdRule = { LL: 5.0, L: 10.0, unit: 'c' };
const ISO_TANK_PRESSURE_RULE: AlarmThresholdRule = { LL: 1.0, L: 2.0, H: 15.0, HH: 18.0, unit: 'bar' };

/** NIAS-IS-LS-0004, DPIA-01C/D·DPI-01E/F(H)=0.5 barg — Inlet Vaporizer DP, High만 정의(LL/L/HH 없음). */
const AAV_INLET_DP_RULE: AlarmThresholdRule = { H: 0.5, unit: 'bar' };

/** V-101 PSV(Pressure Safety Valve) 정정압력 — 참고용 상수, HH 임계값 아님. */
export const MECHANICAL_RELIEF_REFERENCE_BARG = 14.1;

const ALARM_PRIORITY_RULES: Partial<Record<PatrolDomain, ColumnRuleMap>> = {
  aav: {
    temperature_gauge_ds_c: AAV_DS_TEMPERATURE_RULE,
    temperature_transmitter_ds_c: AAV_DS_TEMPERATURE_RULE,
    // temperature_gauge_us_c / temperature_transmitter_us_c: 의도적 미등록(US, 극저온측).
    differential_pressure_us_barg: AAV_INLET_DP_RULE,
  },
  iso_tank_unloading_skid: {
    pressure_mpa: ISO_TANK_PRESSURE_RULE,
  },
  iso_tank_cargo: {
    pressure_mpa: ISO_TANK_PRESSURE_RULE,
  },
};

/**
 * 규칙이 없으면 undefined — 호출자는 "평가 불가"로 취급해야 하며 NORMAL로 기본값 처리하면 안 된다.
 * alarm_setpoint_overrides(HMI-2a-final)가 있으면 블루프린트 기본값보다 우선한다.
 */
export function getAlarmThresholds(domain: PatrolDomain, columnName: string): AlarmThresholdRule | undefined {
  return getAlarmSetpointOverride(domain, columnName) ?? ALARM_PRIORITY_RULES[domain]?.[columnName];
}
