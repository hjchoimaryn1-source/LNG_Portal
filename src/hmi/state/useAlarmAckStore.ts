// src/hmi/state/useAlarmAckStore.ts
//
// PURPOSE
//   HMI-2d-2 — HIGH/CRITICAL 알람의 "현재 onset(연속 상태 시작)" 추적 + 그 onset이
//   ack로 커버되는지 판정. useAlarmSuppressionStore.ts와 동일한 모듈 스코프 Map +
//   useSyncExternalStore 패턴.
//
//   DEVIATION (HMI-2d 프리플라이트, HJ 승인 채택) — alarm_action_log(서버, append-only
//   감사로그)에는 "현재 onset 시각" 개념이 없고 이번 스테이지에서 스키마도 바꾸지
//   않는다(ALTER-only 정책, 신규 상태 테이블은 별도 승인 필요). 그래서 onset은 이
//   모듈의 휘발성 클라이언트 상태로만 둔다 — 새로고침/재로그인 시 초기화되며, 이는
//   "가짜로 재무장 로직을 만들지 않는다"는 원칙과 "DB 변경 없이 프론트 전용으로
//   구현한다"는 승인된 절충이다. 서버 alarm_action_log의 created_at은 감사 목적의
//   진실 기록으로 계속 남고, 이 모듈은 표시(깜빡임/고정색) 판정에만 쓰인다.

import { useCallback, useSyncExternalStore } from 'react';
import type { AlarmPriority } from '../types/hmiCore';

interface AlarmOnsetRecord {
  onsetAt: string;
  ackedAt: string | null;
}

type OnsetKey = string;

const onsetByKey = new Map<OnsetKey, AlarmOnsetRecord>();
const listeners = new Set<() => void>();

function makeKey(domain: string, equipmentTag: string, columnName: string): OnsetKey {
  return `${domain}:${equipmentTag}:${columnName}`;
}

function emitChange(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isActionablePriority(priority: AlarmPriority): boolean {
  return priority === 'HIGH' || priority === 'CRITICAL';
}

function computeIsAcknowledged(key: OnsetKey): boolean {
  const record = onsetByKey.get(key);
  if (record === undefined) return false;
  return record.ackedAt !== null && record.ackedAt >= record.onsetAt;
}

/**
 * useHmiLiveStore.ts가 평가 직후(useEffect 내부 — 렌더 중 store를 쓰지 않아 React
 * 렌더 순수성을 지킨다) 매 커밋마다 호출한다. 이미 같은 상태(계속 알람 중, 또는
 * 계속 정상)면 no-op(멱등)이라 매번 호출해도 안전하다.
 *   - HIGH/CRITICAL로 "처음" 진입(onset 없음) → onset 기록(ack 없음 상태로 시작)
 *   - HIGH/CRITICAL 유지 중 → 그대로(재무장 안 함 — 연속 상태는 기존 ack 유지)
 *   - HIGH/CRITICAL 해제(NORMAL/LOW로 회복) → onset 기록 삭제, 다음 재진입은 새 onset
 */
export function recordAlarmOnsetObservation(
  domain: string,
  equipmentTag: string,
  columnName: string,
  priority: AlarmPriority,
  nowIso: string
): void {
  const key = makeKey(domain, equipmentTag, columnName);
  const existing = onsetByKey.get(key);
  if (isActionablePriority(priority)) {
    if (existing === undefined) {
      onsetByKey.set(key, { onsetAt: nowIso, ackedAt: null });
      emitChange();
    }
    return;
  }
  if (existing !== undefined) {
    onsetByKey.delete(key);
    emitChange();
  }
}

/** useAlarmActionLog.ts의 acknowledge 성공 콜백 — 재조회 없이 즉시 반영. */
export function markAlarmAcknowledged(domain: string, equipmentTag: string, columnName: string, nowIso: string): void {
  const key = makeKey(domain, equipmentTag, columnName);
  const existing = onsetByKey.get(key);
  // onset이 아직 없으면(예: 클릭과 재평가 타이밍 경합) ack만 선반영 — 뒤이은 재평가가
  // 같은 nowIso 근방으로 onset을 기록해도 ackedAt >= onsetAt 비교라 안전하다.
  onsetByKey.set(key, { onsetAt: existing?.onsetAt ?? nowIso, ackedAt: nowIso });
  emitChange();
}

/** (domain, equipmentTag, columnName)의 현재 onset이 ack로 커버되는지 구독한다. */
export function useIsAlarmAcknowledged(domain: string, equipmentTag: string, columnName: string): boolean {
  const key = makeKey(domain, equipmentTag, columnName);
  const getSnapshot = useCallback(() => computeIsAcknowledged(key), [key]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 테스트 전용 — 모듈 스코프 캐시를 초기화한다. */
export function __resetAlarmAckStoreForTests(): void {
  onsetByKey.clear();
}
