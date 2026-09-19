// src/cmms-daily-ops/state/useDailyOpsPatrolStore.ts
//
// PURPOSE
//   B1 폼이 저장에 성공했을 때 즉시 반영하는(optimistic, pre-refetch)
//   장비/컬럼별 최신값 메모리 맵. 원 지시는 Zustand를 지정했으나 이
//   저장소에는 미설치(package.json에 없음, npm install 필요) — HJ 확인 후
//   React 내장 useSyncExternalStore 기반 외부 스토어로 대체했다(신규
//   의존성 없이 동일한 구독/발행 동작 확보, deviation note 참고).
//
//   Confirmed safe per PRE-FLIGHT: LNGPortalInner는 탭 전환에 로컬 React
//   state(usePortalNavigation)만 쓰고 라우터/리마운트가 없으므로, 이
//   모듈 스코프 상태는 LNG-Process 섹터 내 탭 전환 중에도 그대로 유지된다
//   (DailyOpsDataContext를 동기화 폴백으로 쓸 필요 없음).

'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { PatrolDomain } from '../types/patrolLog';
import type { PatrolFieldValue, PatrolValues } from '../dao/dailyOpsPatrolDao';

type PatrolStoreKey = string;

function makeKey(domain: PatrolDomain, equipmentTag: string, columnName: string): PatrolStoreKey {
  return `${domain}:${equipmentTag}:${columnName}`;
}

const latestValues = new Map<PatrolStoreKey, PatrolFieldValue>();
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** B1 폼의 저장 성공 콜백에서 호출 — 한 저장 라운드의 모든 컬럼을 한 번에 반영한다. */
export function setLatestPatrolEntry(domain: PatrolDomain, equipmentTag: string, values: PatrolValues): void {
  for (const [columnName, value] of Object.entries(values)) {
    latestValues.set(makeKey(domain, equipmentTag, columnName), value);
  }
  emitChange();
}

/** (domain, equipmentTag, columnName) 단일 컬럼의 최신값을 구독한다 — PIDOverlayView(B4) 배지가 사용. */
export function useDailyOpsPatrolValue(
  domain: PatrolDomain,
  equipmentTag: string,
  columnName: string
): PatrolFieldValue | undefined {
  const key = makeKey(domain, equipmentTag, columnName);
  const getSnapshot = useCallback(() => latestValues.get(key), [key]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 테스트 전용 — 모듈 스코프 맵을 초기화해 테스트 간 상태 누수를 막는다. */
export function __resetDailyOpsPatrolStoreForTests(): void {
  latestValues.clear();
}
