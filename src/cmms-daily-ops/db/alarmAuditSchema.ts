// src/cmms-daily-ops/db/alarmAuditSchema.ts
//
// PURPOSE
//   HMI-2a-final(alarm_setpoint_overrides) + HMI-2c-final(alarm_action_log) 2개
//   테이블 DDL. alarm_action_log는 HMI-2c-final의 acknowledge/suppress가 재사용할
//   수 있도록 이 스테이지에서 먼저 만든다 — 지시문이 제시한 두 옵션(HMI-2c 테이블
//   선(先)구축 vs 로그 호출 스텁) 중 선구축을 택했다(순서상 스키마가 간단해 스텁의
//   이점이 없음).
//
//   suppress_expires_at은 action_type='suppress'일 때 NOT NULL을 CHECK로 강제한다 —
//   무기한 억제(indefinite suppression) 자체를 스키마 레벨에서 금지한다.

import type { DatabaseSync } from 'node:sqlite';

export const ALARM_SETPOINT_OVERRIDES_DDL = `
  CREATE TABLE IF NOT EXISTS alarm_setpoint_overrides (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      domain          TEXT NOT NULL,
      column_name     TEXT NOT NULL,
      ll              REAL NOT NULL,
      l               REAL NOT NULL,
      h               REAL,
      hh              REAL,
      unit            TEXT NOT NULL CHECK (unit IN ('bar', 'c')),
      overridden_by   TEXT NOT NULL,
      overridden_at   TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
      reason_text     TEXT NOT NULL,
      UNIQUE(domain, column_name)
  );
`;

export const ALARM_ACTION_LOG_DDL = `
  CREATE TABLE IF NOT EXISTS alarm_action_log (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      domain                TEXT NOT NULL,
      equipment_tag         TEXT NOT NULL,
      column_name           TEXT NOT NULL,
      action_type           TEXT NOT NULL CHECK (action_type IN ('acknowledge', 'suppress', 'reset_to_default')),
      actor_id              TEXT NOT NULL,
      actor_role            TEXT NOT NULL,
      reason_text           TEXT,
      created_at            TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
      suppress_expires_at   TEXT,
      CHECK (action_type != 'suppress' OR reason_text IS NOT NULL),
      CHECK (action_type != 'suppress' OR suppress_expires_at IS NOT NULL)
  );
`;

/**
 * HMI-2d-2-fix-a — "현재 onset" 전용 상태 테이블(HJ 승인, alarm_current_state 그대로).
 * alarm_action_log(사람 조치를 append하는 감사로그)와 별개다 — 태그+컬럼당 onset 1행만
 * 유지하며, 알람 해제 시 행을 지운다(재진입 시 새 onset을 다시 기록하기 위함).
 */
export const ALARM_CURRENT_STATE_DDL = `
  CREATE TABLE IF NOT EXISTS alarm_current_state (
      domain          TEXT NOT NULL,
      equipment_tag   TEXT NOT NULL,
      column_name     TEXT NOT NULL,
      onset_at        TEXT NOT NULL,
      PRIMARY KEY (domain, equipment_tag, column_name)
  );
`;

/** alarm_setpoint_overrides + alarm_action_log + alarm_current_state를 멱등 보강한다. */
export function ensureAlarmAuditSchema(raw: DatabaseSync): void {
  raw.exec(ALARM_SETPOINT_OVERRIDES_DDL);
  raw.exec(ALARM_ACTION_LOG_DDL);
  raw.exec(ALARM_CURRENT_STATE_DDL);
}
