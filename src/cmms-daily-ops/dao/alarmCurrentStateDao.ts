// src/cmms-daily-ops/dao/alarmCurrentStateDao.ts
//
// PURPOSE
//   alarm_current_state(alarmAuditSchema.ts) 순수 DAO — HMI-2d-2-fix-a. 사람 조치를
//   append하는 alarm_action_log와 달리, 태그+컬럼당 "현재 onset" 1행만 유지한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface AlarmCurrentStateKey {
  domain: string;
  equipmentTag: string;
  columnName: string;
}

export interface AlarmOnsetRecord extends AlarmCurrentStateKey {
  onsetAt: string;
}

interface AlarmCurrentStateRow {
  domain: string;
  equipment_tag: string;
  column_name: string;
  onset_at: string;
}

const UPSERT_ONSET_SQL = `
  INSERT INTO alarm_current_state (domain, equipment_tag, column_name, onset_at)
  VALUES (@domain, @equipmentTag, @columnName, @onsetAt)
  ON CONFLICT (domain, equipment_tag, column_name) DO NOTHING
`;

const GET_ONSET_SQL = `
  SELECT domain, equipment_tag, column_name, onset_at
  FROM alarm_current_state
  WHERE domain = @domain AND equipment_tag = @equipmentTag AND column_name = @columnName
`;

const DELETE_ONSET_SQL = `
  DELETE FROM alarm_current_state
  WHERE domain = @domain AND equipment_tag = @equipmentTag AND column_name = @columnName
`;

const GET_ALL_ONSETS_SQL = `SELECT domain, equipment_tag, column_name, onset_at FROM alarm_current_state`;

function toRecord(row: AlarmCurrentStateRow): AlarmOnsetRecord {
  return { domain: row.domain, equipmentTag: row.equipment_tag, columnName: row.column_name, onsetAt: row.onset_at };
}

/**
 * 첫 진입만 onset을 기록한다(ON CONFLICT DO NOTHING) — 이미 알람 중이면 재평가마다
 * 호출돼도 onset_at을 덮어쓰지 않는다(먼저 기록된 값이 진짜 onset). 동시 진입 경합이
 * 있어도 삽입 성공 여부와 무관하게 항상 현재 저장된 onset_at을 다시 읽어 반환하므로,
 * 호출자는 이 반환값으로 로컬 캐시를 재동기화하면 된다.
 */
export function upsertOnset(db: SqlExecutor, key: AlarmCurrentStateKey, onsetAt: string): string {
  db.run(UPSERT_ONSET_SQL, { ...key, onsetAt });
  const row = db.get<AlarmCurrentStateRow>(GET_ONSET_SQL, { ...key });
  return row?.onset_at ?? onsetAt;
}

/** 알람 해제 — 다음 재진입이 새 onset을 기록할 수 있도록 행을 삭제한다. */
export function clearOnset(db: SqlExecutor, key: AlarmCurrentStateKey): void {
  db.run(DELETE_ONSET_SQL, { ...key });
}

export function getOnset(db: SqlExecutor, key: AlarmCurrentStateKey): string | null {
  const row = db.get<AlarmCurrentStateRow>(GET_ONSET_SQL, { ...key });
  return row?.onset_at ?? null;
}

/** API 라우트 하이드레이션 페이로드용 — 테이블 전체. */
export function getAllOnsets(db: SqlExecutor): AlarmOnsetRecord[] {
  return db.all<AlarmCurrentStateRow>(GET_ALL_ONSETS_SQL).map(toRecord);
}
