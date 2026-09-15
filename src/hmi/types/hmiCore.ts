// src/hmi/types/hmiCore.ts
//
// PURPOSE
//   Phase HMI-1 — src/hmi/* 모듈의 공용 도메인 타입. PatrolDomain/ReadingStatus는
//   patrolLog.ts 원본을 재사용하며 여기서 재정의하지 않는다(단일 소스 유지).

import type { PatrolDomain, ReadingStatus } from '../../cmms-daily-ops/types/patrolLog';

export type { PatrolDomain, ReadingStatus };

/**
 * PLACEHOLDER — 실제 등급 수/명칭은 NotebookLM 추출 결과(주제 B) 도착 후
 * 재조정 예정. 지금은 4단계 임시값이며 임계값 로직은 evaluateAlarmState.ts에서
 * 항상 'NORMAL' 스텁을 반환한다(HMI-1b 참고).
 */
export type AlarmPriority = 'CRITICAL' | 'HIGH' | 'LOW' | 'NORMAL';

export interface HmiInstrumentReading {
  tagId: string;
  instrumentType: 'PT' | 'TT' | 'DPT' | 'LEVEL' | 'STATUS' | 'OTHER';
  value: number | string | null;
  unit: string;
  readingStatus: ReadingStatus;
  lastUpdatedAt: string | null;
  alarmPriority: AlarmPriority;
}

/**
 * 실제 인터락 스키마가 생기기 전까지 status는 반드시 'NOT_IMPLEMENTED' 고정.
 * 이 타입을 소비하는 모든 UI는 'NOT_IMPLEMENTED'일 때 "인터락 정보 없음"
 * 문구를 렌더링해야 하며, OK/TRIPPED 등 안전 관련 값을 임의로 채워 넣으면 안 된다.
 */
export interface HmiInterlockState {
  status: 'NOT_IMPLEMENTED' | 'OK' | 'TRIPPED' | 'BYPASSED';
  reason: string | null;
}

export interface HmiEquipmentSnapshot {
  equipmentTag: string;
  domain: PatrolDomain;
  displayName: string;
  readings: HmiInstrumentReading[];
  interlock: HmiInterlockState;
  worstAlarmPriority: AlarmPriority;
}
