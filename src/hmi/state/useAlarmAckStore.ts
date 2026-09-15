// src/hmi/state/useAlarmAckStore.ts
//
// PURPOSE
//   HMI-2d-2 — HIGH/CRITICAL 알람의 "현재 onset(연속 상태 시작)" 추적 + 그 onset이
//   ack로 커버되는지 판정. useAlarmSuppressionStore.ts와 동일한 모듈 스코프 Map +
//   useSyncExternalStore 패턴.
//
//   CORRECTION (HMI-2d 정정, 2회차) — 이전 버전 주석은 이 설계를 "HJ 승인"이라고
//   적었으나 사실이 아니었다. HJ는 원 지시문(alarm_action_log로 재무장을 계산할 수
//   없으면 승인 없이 만들지 말고 먼저 보고하라)을 그대로 전달했을 뿐, 클라이언트
//   전용 저장을 별도로 승인한 적이 없다 — Claude가 AskUserQuestion에서 이 방식을
//   "권장"으로 제시하고 사용자가 그 선택지를 고른 것을 "승인"으로 잘못 표기했다.
//
//   실제 상태(정정 조사 결과):
//   - ack 상태는 이 모듈의 인메모리 Map에만 있다 — 새로고침/새 탭/다른 로그인
//     세션 전부에서 초기화된다(공유되지 않음).
//   - alarm_action_log는 acknowledge 시 기록(WRITE)만 되고, 이 모듈이나 배지
//     렌더링 경로 어디에서도 다시 읽지 않는다 — 감사로그와 화면 표시가 완전히
//     분리돼 있었다.
//   - 진짜 기술적 차단 요인 확인됨: alarm_action_log는 사람의 조치만 기록하고
//     계기값이 언제 알람에 진입/해제됐는지는 어디에도 남기지 않는다. 그 이력을
//     재구성하려면 순찰 기록 이력 조회 함수가 필요한데, 그런 함수(getPatrolEntriesForTrend
//     계열)는 스테이지 HMI-2d-3에서도 이미 "없음"으로 확인됐다 — 지어내지 않고
//     동일 결론 재확인. 즉 onset을 서버에 영속화할 자리 자체가 없다.
//   - 최소 추가 스키마 제안(구현 전 승인 대기): alarm_current_state 신규 테이블
//     (domain, equipment_tag, column_name, onset_at) — 클라이언트가 알람 진입을
//     관측할 때 upsert, 해제 시 delete. alarm_action_log(append-only 감사로그)에
//     onset을 억지로 끼워 넣지 않고 별도 "현재 상태" 테이블로 분리한다.
//
//   승인 전까지는: onset은 계속 클라이언트 세션 휘발성이며, 새로고침/새 세션은
//   항상 "재확인 필요"로 안전측(fail-safe) 처리한다 — 이미 확인된 알람을 잘못된
//   낙관적 가정으로 조용히 숨기지 않기 위한 의도된 설계다. 이는 완화되지 않은
//   한계이지 버그가 아니다. HJ 승인 시 alarm_current_state 도입 후 이 파일을
//   "true onset을 서버에서 읽어와 seed하는 얇은 캐시" 형태로 다시 정리한다.

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
