// src/hmi/state/alarmSetpointOverrideCache.ts
//
// PURPOSE
//   HMI-2a-final — alarm_setpoint_overrides의 클라이언트 캐시. hmiTagAliasCache.ts와
//   동일한 이유(alarmPriorityRules.ts는 'use client' 훅 체인에서 동기 호출돼야 하고
//   node:sqlite를 직접 임포트할 수 없음)로, DB 조회를 하이드레이션 시점 1회로 미루고
//   getAlarmThresholds()는 이 캐시를 동기적으로만 읽는다. 정적 참조 데이터 취급 —
//   listeners/구독 없음(hmiTagAliasCache.ts와 동일한 스코프 결정).

import type { PatrolDomain } from '../types/hmiCore';
import type { AlarmThresholdRule } from '../config/alarmPriorityRules';

const overrides = new Map<string, AlarmThresholdRule>();

function makeKey(domain: PatrolDomain, columnName: string): string {
  return `${domain}:${columnName}`;
}

export interface AlarmSetpointOverrideRecord {
  domain: PatrolDomain;
  columnName: string;
  ll: number;
  l: number;
  h: number | null;
  hh: number | null;
  unit: 'bar' | 'c';
}

/** DailyOpsDataContext 하이드레이션이 마운트 시 1회 호출 — 캐시를 전체 교체한다. */
export function setAlarmSetpointOverrides(records: AlarmSetpointOverrideRecord[]): void {
  overrides.clear();
  for (const r of records) {
    const rule: AlarmThresholdRule = { LL: r.ll, L: r.l, unit: r.unit };
    if (r.h !== null) rule.H = r.h;
    if (r.hh !== null) rule.HH = r.hh;
    overrides.set(makeKey(r.domain, r.columnName), rule);
  }
}

/** 오버라이드가 없으면 undefined — getAlarmThresholds()가 블루프린트 기본값으로 폴백한다. */
export function getAlarmSetpointOverride(domain: PatrolDomain, columnName: string): AlarmThresholdRule | undefined {
  return overrides.get(makeKey(domain, columnName));
}

/** 테스트 전용 — 모듈 스코프 캐시를 초기화한다. */
export function __resetAlarmSetpointOverrideCacheForTests(): void {
  overrides.clear();
}
