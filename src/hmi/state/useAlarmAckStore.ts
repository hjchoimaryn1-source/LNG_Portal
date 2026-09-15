// src/hmi/state/useAlarmAckStore.ts
//
// PURPOSE
//   HMI-2d-2-fix-c — alarmCurrentStateCache.ts(onset, 서버 근거, fix-b)와
//   alarm_action_log의 최신 acknowledge 시각(서버 근거, HMI-2c-final + fix-c 확장)을
//   교차 참조해 "현재 onset이 ack로 커버되는가"를 판정한다. 재무장 조건: ack 기록이
//   없거나, 있어도 그 시각이 현재 onset_at보다 이전이면 미확인(깜빡임) — 알람이 해제됐다
//   재진입한 경우 onset_at이 갱신되므로 옛 ack는 더 이상 커버하지 못한다.
//
//   CORRECTION 이력 — f267d13에서 이전 리비전의 "HJ 승인"이라는 잘못된 표기를 철회했다.
//   이 리비전은 그 정정 이후 HJ가 실제로 승인한 alarm_current_state 스키마(fix-a)로
//   재구현한 것이다. onset은 더 이상 이 파일의 인메모리 상태가 아니라
//   alarmCurrentStateCache.ts를 거쳐 서버에서 읽어온다 — 새로고침·새 탭·다른 세션
//   전부에서 같은 서버 상태를 하이드레이션하므로 일관되게 유지된다.
//
//   acknowledge 액션 자체(POST 요청)의 모양은 바뀌지 않았다 — useAlarmActionLog.ts는
//   그대로 alarm_action_log에 기록하고, 성공 시 markAlarmAcknowledged(이 파일, 시그니처
//   동일)를 호출해 로컬 캐시만 낙관적으로 갱신한다. 바뀐 건 읽기 쪽(깜빡임/고정색 판정)뿐.

import { useCallback, useSyncExternalStore } from 'react';
import { getCachedOnsetAt, subscribeToOnsetChanges } from './alarmCurrentStateCache';

type Key = string;

const acknowledgedAtByKey = new Map<Key, string>();
const ackListeners = new Set<() => void>();

function makeKey(domain: string, equipmentTag: string, columnName: string): Key {
  return `${domain}:${equipmentTag}:${columnName}`;
}

function emitAckChange(): void {
  for (const listener of ackListeners) listener();
}

function subscribeToAckChanges(listener: () => void): () => void {
  ackListeners.add(listener);
  return () => ackListeners.delete(listener);
}

/** onset(alarmCurrentStateCache.ts) 구독과 ack(이 모듈) 구독을 하나로 합친다. */
function subscribe(listener: () => void): () => void {
  const unsubOnset = subscribeToOnsetChanges(listener);
  const unsubAck = subscribeToAckChanges(listener);
  return () => {
    unsubOnset();
    unsubAck();
  };
}

export interface AlarmAcknowledgedAtRecord {
  domain: string;
  equipmentTag: string;
  columnName: string;
  acknowledgedAt: string;
}

/** DailyOpsDataContext 하이드레이션(alarm-action-log GET의 acknowledgements)이 마운트 시 1회 호출. */
export function setAlarmAcknowledgedAts(records: AlarmAcknowledgedAtRecord[]): void {
  acknowledgedAtByKey.clear();
  for (const r of records) acknowledgedAtByKey.set(makeKey(r.domain, r.equipmentTag, r.columnName), r.acknowledgedAt);
  emitAckChange();
}

/** useAlarmActionLog.ts의 acknowledge 성공 콜백 — 재조회 없이 즉시 반영. */
export function markAlarmAcknowledged(domain: string, equipmentTag: string, columnName: string, nowIso: string): void {
  acknowledgedAtByKey.set(makeKey(domain, equipmentTag, columnName), nowIso);
  emitAckChange();
}

function computeIsAcknowledged(domain: string, equipmentTag: string, columnName: string): boolean {
  const onsetAt = getCachedOnsetAt(domain, equipmentTag, columnName);
  const acknowledgedAt = acknowledgedAtByKey.get(makeKey(domain, equipmentTag, columnName));
  if (onsetAt === undefined || acknowledgedAt === undefined) return false;
  return acknowledgedAt >= onsetAt;
}

/** (domain, equipmentTag, columnName)의 현재 onset이 ack로 커버되는지 구독한다. */
export function useIsAlarmAcknowledged(domain: string, equipmentTag: string, columnName: string): boolean {
  const getSnapshot = useCallback(
    () => computeIsAcknowledged(domain, equipmentTag, columnName),
    [domain, equipmentTag, columnName]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 테스트 전용 — 모듈 스코프 캐시를 초기화한다(ack만 — onset은 alarmCurrentStateCache.ts 소관). */
export function __resetAlarmAckStoreForTests(): void {
  acknowledgedAtByKey.clear();
}
