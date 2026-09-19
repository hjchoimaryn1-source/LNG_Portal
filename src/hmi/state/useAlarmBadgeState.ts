// src/hmi/state/useAlarmBadgeState.ts
//
// PURPOSE
//   HMI-2e-1 — PidTagBadge.tsx는 장비 1개(equipmentTag)당 배지 1개를 그리므로,
//   FaceplateReadoutRow.tsx의 컬럼 단위 flash/ack/suppress 판정을 장비의 전 컬럼에
//   걸쳐 "최악값 하나"로 접어야 한다. useAlarmAckStore.ts / useAlarmSuppressionStore.ts의
//   기존 훅(useIsAlarmAcknowledged/useIsAlarmSuppressed)은 컬럼 1개 전용이라 배열에
//   루프로 호출할 수 없다(Rules of Hooks) — 두 스토어가 신설 export한 동기 판정
//   함수(isAlarmAcknowledgedNow/isAlarmSuppressedNow)를 재사용해 이 파일에서만
//   루프를 돈다. 두 스토어의 기존 훅/판정 로직 자체는 변경하지 않는다.
//
//   REDUCE 규칙(행 단위 판정 재사용, 우선순위만 배지 스코프로 확장):
//   - isFlashing: 실행 가능(HIGH/CRITICAL) 컬럼 중 "억제되지 않고 미확인"인 컬럼이
//     하나라도 있으면 true — 다른 컬럼이 억제 중이어도 이 컬럼의 미확인 알람은 가려지지
//     않는다(행 단위와 동일하게, suppressed는 그 컬럼 자신의 flash만 막는다).
//   - isSuppressed: flashing이 아닐 때만(위 규칙으로 이미 우선순위 확보) 실행 가능 컬럼
//     중 억제된 것이 하나라도 있으면 true — "억제 중" 사실이 조용히 묻히지 않게 한다.

import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { HmiInstrumentReading } from '../types/hmiCore';
import { isAlarmAcknowledgedNow, subscribeToAlarmAckChanges } from './useAlarmAckStore';
import { isAlarmSuppressedNow, subscribeToSuppressionChanges } from './useAlarmSuppressionStore';

export interface AlarmBadgeState {
  /** readings 중 HIGH/CRITICAL이 하나라도 있는가. */
  isActionable: boolean;
  /** 미확인·비억제 실행 가능 알람이 하나라도 있는가 — 배지가 깜빡여야 하는가. */
  isFlashing: boolean;
  /** flashing이 아니면서 억제된 실행 가능 알람이 있는가. */
  isSuppressed: boolean;
}

function isActionablePriority(reading: HmiInstrumentReading): boolean {
  return reading.alarmPriority === 'HIGH' || reading.alarmPriority === 'CRITICAL';
}

function computeBadgeState(readings: HmiInstrumentReading[]): AlarmBadgeState {
  let isActionable = false;
  let isFlashing = false;
  let anySuppressed = false;

  for (const reading of readings) {
    if (!isActionablePriority(reading)) continue;
    isActionable = true;
    const suppressed = isAlarmSuppressedNow(reading.domain, reading.tagId, reading.columnName);
    if (suppressed) {
      anySuppressed = true;
      continue;
    }
    if (!isAlarmAcknowledgedNow(reading.domain, reading.tagId, reading.columnName)) isFlashing = true;
  }

  return { isActionable, isFlashing, isSuppressed: !isFlashing && anySuppressed };
}

function statesEqual(a: AlarmBadgeState, b: AlarmBadgeState): boolean {
  return a.isActionable === b.isActionable && a.isFlashing === b.isFlashing && a.isSuppressed === b.isSuppressed;
}

function subscribe(listener: () => void): () => void {
  const unsubAck = subscribeToAlarmAckChanges(listener);
  const unsubSuppression = subscribeToSuppressionChanges(listener);
  return () => {
    unsubAck();
    unsubSuppression();
  };
}

/** 장비 1개(readings = useHmiEquipment().readings)의 배지 flash/ack/suppress 집계 상태를 구독한다. */
export function useAlarmBadgeState(readings: HmiInstrumentReading[]): AlarmBadgeState {
  // useSyncExternalStore는 동일 커밋 내 getSnapshot 재호출 시 참조 동일성을 요구한다 —
  // computeBadgeState가 매번 새 객체를 만들므로, 값이 같으면 이전 스냅샷 객체를 그대로
  // 반환해 불필요한 재렌더/경고를 막는다.
  const cacheRef = useRef<AlarmBadgeState | null>(null);
  const readingsKey = readings.map((r) => `${r.domain}:${r.tagId}:${r.columnName}:${r.alarmPriority}`).join('|');

  const getSnapshot = useCallback(() => {
    const next = computeBadgeState(readings);
    const cached = cacheRef.current;
    if (cached && statesEqual(cached, next)) return cached;
    cacheRef.current = next;
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingsKey]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
