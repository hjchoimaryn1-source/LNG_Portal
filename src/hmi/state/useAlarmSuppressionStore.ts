// src/hmi/state/useAlarmSuppressionStore.ts
//
// PURPOSE
//   HMI-2c-final — (domain, equipmentTag, columnName)별 활성 suppress 상태의 클라이언트
//   구독형 캐시. useDailyOpsPatrolStore.ts(B2)와 동일한 useSyncExternalStore 패턴 — 여기는
//   정적 참조 데이터가 아니라 사용자 액션(suppress 버튼)으로 즉시 바뀌어야 하므로 구독이
//   필요하다(hmiTagAliasCache.ts/alarmSetpointOverrideCache.ts와 다른 이유).
//
//   만료 판정은 "조회 시점" 문자열 비교(ISO 8601 UTC, 사전순=시간순)로만 하고 별도
//   cleanup 타이머를 두지 않는다 — suppress_expires_at 지시사항 그대로.

import { useCallback, useSyncExternalStore } from 'react';

type SuppressionKey = string;

const suppressExpiresAtByKey = new Map<SuppressionKey, string>();
const listeners = new Set<() => void>();

function makeKey(domain: string, equipmentTag: string, columnName: string): SuppressionKey {
  return `${domain}:${equipmentTag}:${columnName}`;
}

function emitChange(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export interface ActiveSuppressionRecord {
  domain: string;
  equipmentTag: string;
  columnName: string;
  suppressExpiresAt: string;
}

/** DailyOpsDataContext 하이드레이션이 마운트 시 1회 호출 — 캐시를 전체 교체한다. */
export function setActiveSuppressions(records: ActiveSuppressionRecord[]): void {
  suppressExpiresAtByKey.clear();
  for (const r of records) suppressExpiresAtByKey.set(makeKey(r.domain, r.equipmentTag, r.columnName), r.suppressExpiresAt);
  emitChange();
}

/** suppress 액션 성공 콜백(useAlarmActionLog.ts) — 재조회 없이 즉시 반영. */
export function addActiveSuppression(domain: string, equipmentTag: string, columnName: string, suppressExpiresAt: string): void {
  suppressExpiresAtByKey.set(makeKey(domain, equipmentTag, columnName), suppressExpiresAt);
  emitChange();
}

function computeIsSuppressed(key: SuppressionKey): boolean {
  const expiresAt = suppressExpiresAtByKey.get(key);
  return expiresAt !== undefined && expiresAt > new Date().toISOString();
}

/** (domain, equipmentTag, columnName)에 만료되지 않은 suppress가 있는지 구독한다. */
export function useIsAlarmSuppressed(domain: string, equipmentTag: string, columnName: string): boolean {
  const key = makeKey(domain, equipmentTag, columnName);
  const getSnapshot = useCallback(() => computeIsSuppressed(key), [key]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** HMI-2e-1 — 동기 판정(non-hook). useAlarmBadgeState.ts의 다컬럼 집계 reduce용. */
export function isAlarmSuppressedNow(domain: string, equipmentTag: string, columnName: string): boolean {
  return computeIsSuppressed(makeKey(domain, equipmentTag, columnName));
}

/** HMI-2e-1 — 이 스토어의 구독만 필요한 소비자(배지 집계)용. useIsAlarmSuppressed와 동일 리스너 집합. */
export function subscribeToSuppressionChanges(listener: () => void): () => void {
  return subscribe(listener);
}

/** 테스트 전용 — 모듈 스코프 캐시를 초기화한다. */
export function __resetAlarmSuppressionStoreForTests(): void {
  suppressExpiresAtByKey.clear();
}
