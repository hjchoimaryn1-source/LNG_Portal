// src/hmi/state/alarmCurrentStateCache.ts
//
// PURPOSE
//   HMI-2d-2-fix-b — alarm_current_state(서버, alarmCurrentStateDao.ts)의 클라이언트
//   캐시 + HIGH/CRITICAL 진입/해제 감지 시 서버 기록(POST) 트리거. onset은 이제 서버가
//   근거(source of truth)다 — 하이드레이션(마운트 1회, DailyOpsDataContext.tsx) + POST
//   응답으로만 채워진다.
//
//   DEVIATION — 지시문은 "hmiTagAliasCache.ts 패턴(리스너 없는 단순 맵)"을 템플릿으로
//   들었지만, onset은 정적 참조 데이터가 아니라 세션 중 실시간으로 바뀌고
//   FaceplateReadoutRow(깜빡임/고정색 판정)가 구독해야 한다. 그래서 실제로는
//   useAlarmSuppressionStore.ts(같은 이유로 이미 리스너를 쓰는 기존 모듈)와 동일한
//   "맵 + listeners" 모양을 재사용했다 — 무반응 캐시인 척 흉내내는 대신, 실제로 맞는
//   기존 패턴을 그대로 재사용한다. useAlarmAckStore.ts가 이 모듈의 구독을 자신의 ack
//   구독과 합쳐서 하나의 useSyncExternalStore로 노출한다.
//
//   동시 진입 경합: 서버(alarmCurrentStateDao.upsertOnset)가 ON CONFLICT DO NOTHING 후
//   항상 "실제 저장된" onset_at을 반환하므로, POST 응답으로 로컬을 그 값에 재동기화한다
//   (먼저 기록된 쪽이 이긴다).

import type { AlarmPriority } from '../types/hmiCore';

const ALARM_CURRENT_STATE_API = '/api/v1/cmms/alarm-current-state';

type Key = string;

const onsetAtByKey = new Map<Key, string>();
const listeners = new Set<() => void>();

function makeKey(domain: string, equipmentTag: string, columnName: string): Key {
  return `${domain}:${equipmentTag}:${columnName}`;
}

function emitChange(): void {
  for (const listener of listeners) listener();
}

/** useAlarmAckStore.ts가 자신의 ack 구독과 합쳐 하나의 useSyncExternalStore로 노출한다. */
export function subscribeToOnsetChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isActionablePriority(priority: AlarmPriority): boolean {
  return priority === 'HIGH' || priority === 'CRITICAL';
}

export interface AlarmOnsetRecord {
  domain: string;
  equipmentTag: string;
  columnName: string;
  onsetAt: string;
}

/** DailyOpsDataContext 하이드레이션(alarm-current-state GET)이 마운트 시 1회 호출. */
export function setAlarmOnsets(records: AlarmOnsetRecord[]): void {
  onsetAtByKey.clear();
  for (const r of records) onsetAtByKey.set(makeKey(r.domain, r.equipmentTag, r.columnName), r.onsetAt);
  emitChange();
}

/** 동기 읽기 — useAlarmAckStore.ts의 교차 참조 계산에 쓰인다. */
export function getCachedOnsetAt(domain: string, equipmentTag: string, columnName: string): string | undefined {
  return onsetAtByKey.get(makeKey(domain, equipmentTag, columnName));
}

/**
 * useHmiLiveStore.ts가 평가 직후(useEffect 내부, 렌더 중이 아님) 매 커밋마다 호출한다.
 * HIGH/CRITICAL "처음" 진입만 로컬 낙관 반영 + 서버 기록(fire-and-forget, 렌더를 막지
 * 않는다). 해제는 로컬 삭제 + 서버 삭제. 이미 같은 상태면 no-op(멱등) — 매번 호출해도
 * 안전하다.
 */
export function recordAlarmOnsetObservation(
  domain: string,
  equipmentTag: string,
  columnName: string,
  priority: AlarmPriority,
  nowIso: string
): void {
  const key = makeKey(domain, equipmentTag, columnName);
  const hasOnset = onsetAtByKey.has(key);

  if (isActionablePriority(priority)) {
    if (hasOnset) return;
    onsetAtByKey.set(key, nowIso);
    emitChange();
    void fetch(ALARM_CURRENT_STATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, equipmentTag, columnName, action: 'enter' }),
    })
      .then((res) => res.json())
      .then((json: { success: boolean; onsetAt?: string }) => {
        if (json.success && json.onsetAt && onsetAtByKey.get(key) !== json.onsetAt) {
          onsetAtByKey.set(key, json.onsetAt);
          emitChange();
        }
      })
      .catch(() => {
        // 네트워크 실패 시 낙관적 로컬 onset 유지(안전측 — 계속 미확인으로 표시) — 조용히 무시.
      });
    return;
  }

  if (!hasOnset) return;
  onsetAtByKey.delete(key);
  emitChange();
  void fetch(ALARM_CURRENT_STATE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, equipmentTag, columnName, action: 'clear' }),
  }).catch(() => {
    // 서버 삭제 실패해도 로컬은 이미 해제 표시 — 다음 재진입 시 enter POST가 다시 시도된다.
  });
}

/** 테스트 전용 — 모듈 스코프 캐시를 초기화한다. */
export function __resetAlarmCurrentStateCacheForTests(): void {
  onsetAtByKey.clear();
}
