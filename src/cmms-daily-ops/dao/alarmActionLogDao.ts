// src/cmms-daily-ops/dao/alarmActionLogDao.ts
//
// PURPOSE
//   alarm_action_log(alarmAuditSchema.ts) 순수 DAO. HMI-2a-final의 reset_to_default와
//   HMI-2c-final의 acknowledge/suppress가 공유한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export type AlarmActionType = 'acknowledge' | 'suppress' | 'reset_to_default';

export interface AlarmActionLogEntry {
  domain: string;
  /** domain 전체(컬럼 단위) 조치인 reset_to_default는 특정 장비가 없어 '*'(전체) 센티널을 쓴다. */
  equipmentTag: string;
  columnName: string;
  actionType: AlarmActionType;
  actorId: string;
  actorRole: string;
  reasonText: string | null;
  suppressExpiresAt: string | null;
}

const INSERT_SQL = `
  INSERT INTO alarm_action_log
    (domain, equipment_tag, column_name, action_type, actor_id, actor_role, reason_text, suppress_expires_at)
  VALUES
    (@domain, @equipmentTag, @columnName, @actionType, @actorId, @actorRole, @reasonText, @suppressExpiresAt)
`;

/** ack/suppress/reset_to_default 공통 감사로그 기록 — reason_text/suppress_expires_at 필수 여부는 DDL CHECK가 강제. */
export function logAlarmAction(db: SqlExecutor, entry: AlarmActionLogEntry): void {
  db.run(INSERT_SQL, { ...entry });
}

interface ActiveSuppressionRow {
  domain: string;
  equipment_tag: string;
  column_name: string;
  suppress_expires_at: string;
}

export interface ActiveSuppression {
  domain: string;
  equipmentTag: string;
  columnName: string;
  suppressExpiresAt: string;
}

const ACTIVE_SUPPRESSIONS_SQL = `
  SELECT domain, equipment_tag, column_name, suppress_expires_at
  FROM alarm_action_log
  WHERE action_type = 'suppress' AND suppress_expires_at > @nowIso
  ORDER BY created_at DESC
`;

/** 만료되지 않은 suppress만 — 만료 판정은 조회 시점 비교(cleanup job 없음, HMI-2c-final). */
export function listActiveSuppressions(db: SqlExecutor, nowIso: string): ActiveSuppression[] {
  return db.all<ActiveSuppressionRow>(ACTIVE_SUPPRESSIONS_SQL, { nowIso }).map((row) => ({
    domain: row.domain,
    equipmentTag: row.equipment_tag,
    columnName: row.column_name,
    suppressExpiresAt: row.suppress_expires_at,
  }));
}

interface LatestAcknowledgedAtRow {
  domain: string;
  equipment_tag: string;
  column_name: string;
  acknowledged_at: string;
}

export interface LatestAcknowledgedAt {
  domain: string;
  equipmentTag: string;
  columnName: string;
  acknowledgedAt: string;
}

const LATEST_ACKNOWLEDGED_AT_SQL = `
  SELECT domain, equipment_tag, column_name, MAX(created_at) AS acknowledged_at
  FROM alarm_action_log
  WHERE action_type = 'acknowledge'
  GROUP BY domain, equipment_tag, column_name
`;

/**
 * (domain, equipment_tag, column_name)별 가장 최근 acknowledge 시각 — HMI-2d-2-fix-c
 * 재무장 판정(alarm_current_state.onset_at과 교차 참조)용.
 */
export function listLatestAcknowledgedAt(db: SqlExecutor): LatestAcknowledgedAt[] {
  return db.all<LatestAcknowledgedAtRow>(LATEST_ACKNOWLEDGED_AT_SQL).map((row) => ({
    domain: row.domain,
    equipmentTag: row.equipment_tag,
    columnName: row.column_name,
    acknowledgedAt: row.acknowledged_at,
  }));
}
