// src/cmms-daily-ops/db/dailyReportSchema.ts
//
// PURPOSE
//   Phase 12 Stage A — FORM-NP-08-33-N 일일 리포트 스냅샷 계열 4개 테이블 DDL
//   (daily_report_snapshots + 3개 child 테이블). truckingSchema.ts와 동일한
//   "CREATE TABLE IF NOT EXISTS + executor.raw.exec()" 컨벤션을 따른다.
//
//   daily_report_snapshots는 report_date당 1행(UNIQUE)이며 생성 시점에
//   daily_ops_patrol_entries의 "장비태그/도메인별 최신 타임슬롯" 값을 얼려
//   snapshot_payload(JSON)에 저장한다 — 이후 patrol 원본이 바뀌어도 발행된
//   리포트는 불변으로 유지하기 위함. is_finalized=1(양쪽 서명 완료) 이후
//   재생성 차단 여부는 DAO 레벨에서 확인 절차로 처리한다(스키마는 플래그만 보관).
//
//   Phase 12 Pre-Flight III 결정: DRAFT -> SUBMITTED -> APPROVED 3단계
//   승인 상태 머신을 위해 status 컬럼을 ALTER TABLE ADD COLUMN으로 추가한다
//   (CLAUDE.md §5 ALTER-only 정책 — 테이블 재생성 아님). is_finalized 컬럼은
//   그대로 두되(ALTER-only 정책상 DROP 불가) dailyReportSnapshotDao.ts의
//   DTO 계층에서 `status === 'APPROVED'`로부터 계산되는 값으로 취급하고
//   더 이상 신뢰하지 않는다 — 레거시 컬럼. node:sqlite(DatabaseSync)에서
//   CHECK 제약을 포함한 ALTER TABLE ADD COLUMN이 정상 동작함을 확인했다.

import type { DatabaseSync } from 'node:sqlite';

export const DAILY_REPORT_SNAPSHOTS_DDL = `
  CREATE TABLE IF NOT EXISTS daily_report_snapshots (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date        TEXT NOT NULL UNIQUE,
      generated_at       TEXT NOT NULL,
      generated_by       TEXT NOT NULL,
      snapshot_payload   TEXT NOT NULL,
      is_finalized       INTEGER NOT NULL DEFAULT 0
  );
`;

// 3개 blank row(FORM-NP-08-33-N p5)에 대응 — 값이 없어도 되는 free-text 컬럼들.
export const DAILY_REPORT_CRITICAL_EVENTS_DDL = `
  CREATE TABLE IF NOT EXISTS daily_report_critical_events (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id        INTEGER NOT NULL,
      event_time         TEXT,
      equipment_system   TEXT,
      condition_alarm    TEXT,
      impact             TEXT,
      immediate_action   TEXT,
      status             TEXT,
      pic                TEXT,
      created_at         TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
      CONSTRAINT fk_critevt_snapshot FOREIGN KEY (snapshot_id) REFERENCES daily_report_snapshots(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_daily_report_critical_events_snapshot ON daily_report_critical_events(snapshot_id);
`;

export const DAILY_REPORT_SAFETY_NOTES_DDL = `
  CREATE TABLE IF NOT EXISTS daily_report_safety_notes (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id            INTEGER NOT NULL,
      unsafe_action_text     TEXT,
      unsafe_condition_text  TEXT,
      incident_text          TEXT,
      remarks_text           TEXT,
      CONSTRAINT fk_safetynote_snapshot FOREIGN KEY (snapshot_id) REFERENCES daily_report_snapshots(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_daily_report_safety_notes_snapshot ON daily_report_safety_notes(snapshot_id);
`;

// role당 1회 서명 — ptw_signatures(UNIQUE(permit_id, role))와 동일한 기존
// 컨벤션을 재사용(data map Answer F: 이미지 업로드 전례 없음, name+timestamp만
// 지원하되 signature_image_ref는 향후 확장을 위해 nullable로 예약).
export const DAILY_REPORT_SIGNATURES_DDL = `
  CREATE TABLE IF NOT EXISTS daily_report_signatures (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id            INTEGER NOT NULL,
      role                   TEXT NOT NULL CHECK (role IN ('prepared_by', 'acknowledged_by')),
      signer_name            TEXT NOT NULL,
      signer_title           TEXT,
      signed_at              TEXT NOT NULL,
      signature_image_ref    TEXT,
      CONSTRAINT fk_signature_snapshot FOREIGN KEY (snapshot_id) REFERENCES daily_report_snapshots(id) ON DELETE CASCADE,
      UNIQUE(snapshot_id, role)
  );
  CREATE INDEX IF NOT EXISTS idx_daily_report_signatures_snapshot ON daily_report_signatures(snapshot_id);
`;

const ADD_STATUS_COLUMN_SQL = `
  ALTER TABLE daily_report_snapshots
  ADD COLUMN status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED'))
`;

// SQLite has no `ADD COLUMN IF NOT EXISTS` — guard via PRAGMA table_info(), same
// convention as src/db/migrations/phase10Stage1ARunner.ts's WORK_ORDER_NEW_COLUMNS.
function ensureStatusColumn(raw: DatabaseSync): void {
  const columns = raw.prepare(`PRAGMA table_info(daily_report_snapshots)`).all();
  const hasStatus = columns.some((c) => (c as { name: string }).name === 'status');
  if (!hasStatus) {
    raw.exec(ADD_STATUS_COLUMN_SQL);
  }
}

/** daily_report_snapshots + 3개 child 테이블을 멱등(idempotent)하게 보강한다. */
export function ensureDailyReportSchema(raw: DatabaseSync): void {
  raw.exec(DAILY_REPORT_SNAPSHOTS_DDL);
  ensureStatusColumn(raw);
  raw.exec(DAILY_REPORT_CRITICAL_EVENTS_DDL);
  raw.exec(DAILY_REPORT_SAFETY_NOTES_DDL);
  raw.exec(DAILY_REPORT_SIGNATURES_DDL);
}
