// src/cmms-daily-ops/dao/alarmSetpointOverridesDao.ts
//
// PURPOSE
//   alarm_setpoint_overrides(alarmAuditSchema.ts) 순수 DAO. HMI-2a-final.
//   오버라이드는 (domain, column_name) 단위 — alarm_action_log와 달리 특정 장비에
//   묶이지 않는다(alarmPriorityRules.ts의 블루프린트 규칙과 동일한 키잉).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { logAlarmAction } from './alarmActionLogDao';

export interface AlarmSetpointOverride {
  domain: string;
  columnName: string;
  ll: number;
  l: number;
  h: number | null;
  hh: number | null;
  unit: 'bar' | 'c';
  overriddenBy: string;
  overriddenAt: string;
  reasonText: string;
}

interface AlarmSetpointOverrideRow {
  domain: string;
  column_name: string;
  ll: number;
  l: number;
  h: number | null;
  hh: number | null;
  unit: string;
  overridden_by: string;
  overridden_at: string;
  reason_text: string;
}

function rowToOverride(row: AlarmSetpointOverrideRow): AlarmSetpointOverride {
  return {
    domain: row.domain,
    columnName: row.column_name,
    ll: row.ll,
    l: row.l,
    h: row.h,
    hh: row.hh,
    unit: row.unit as 'bar' | 'c',
    overriddenBy: row.overridden_by,
    overriddenAt: row.overridden_at,
    reasonText: row.reason_text,
  };
}

const SELECT_ALL_SQL = `SELECT * FROM alarm_setpoint_overrides`;

/** alarmSetpointOverrideCache 하이드레이션이 사용 — 전체 활성 오버라이드. */
export function listOverrides(db: SqlExecutor): AlarmSetpointOverride[] {
  return db.all<AlarmSetpointOverrideRow>(SELECT_ALL_SQL).map(rowToOverride);
}

const DELETE_SQL = `DELETE FROM alarm_setpoint_overrides WHERE domain = @domain AND column_name = @columnName`;

/**
 * 오버라이드 삭제 + alarm_action_log에 reset_to_default 기록. equipment_tag는 '*'(도메인
 * 전체) 센티널 — 오버라이드가 장비 단위가 아니라 (domain, columnName) 단위이기 때문.
 */
export function resetToBlueprintDefaults(
  db: SqlExecutor,
  domain: string,
  columnName: string,
  actorId: string,
  actorRole: string
): void {
  db.run(DELETE_SQL, { domain, columnName });
  logAlarmAction(db, {
    domain,
    equipmentTag: '*',
    columnName,
    actionType: 'reset_to_default',
    actorId,
    actorRole,
    reasonText: null,
    suppressExpiresAt: null,
  });
}
