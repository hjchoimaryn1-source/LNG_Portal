// src/cmms-daily-ops/dao/dailyReportChildDao.ts
//
// PURPOSE
//   daily_report_snapshots의 3개 child 테이블(critical_events, safety_notes,
//   signatures) CRUD. Stage C2 지시는 "critical events + safety notes"만
//   명시했으나 signatures도 동일한 (snapshot_id FK) 구조라 별도 4번째 DAO
//   파일을 만들지 않고 여기 포함했다 — SignatureBlock.tsx가 쓸 곳이 필요.
//
//   safety_notes는 UNIQUE 제약이 없어(스냅샷당 1행 개념이지만 스키마상
//   강제되지 않음) SELECT→UPDATE/INSERT 앱 레벨 upsert로 구현한다(Addendum 1
//   이전 dailyOpsPatrolDao.ts와 동일한 이유 — ALTER-only 정책상 이 테이블에
//   새 UNIQUE 인덱스를 추가하려면 HJ 확인이 필요해 지금은 건드리지 않는다).
//   signatures는 UNIQUE(snapshot_id, role) 실제 제약이 있어 ON CONFLICT upsert가 안전하다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface CriticalEventInput {
  snapshotId: number;
  eventTime: string | null;
  equipmentSystem: string | null;
  conditionAlarm: string | null;
  impact: string | null;
  immediateAction: string | null;
  status: string | null;
  pic: string | null;
}

export interface CriticalEvent extends CriticalEventInput {
  id: number;
  createdAt: string;
}

interface CriticalEventRow {
  id: number;
  snapshot_id: number;
  event_time: string | null;
  equipment_system: string | null;
  condition_alarm: string | null;
  impact: string | null;
  immediate_action: string | null;
  status: string | null;
  pic: string | null;
  created_at: string;
}

function rowToCriticalEvent(row: CriticalEventRow): CriticalEvent {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    eventTime: row.event_time,
    equipmentSystem: row.equipment_system,
    conditionAlarm: row.condition_alarm,
    impact: row.impact,
    immediateAction: row.immediate_action,
    status: row.status,
    pic: row.pic,
    createdAt: row.created_at,
  };
}

const INSERT_CRITICAL_EVENT_SQL = `
  INSERT INTO daily_report_critical_events
    (snapshot_id, event_time, equipment_system, condition_alarm, impact, immediate_action, status, pic)
  VALUES (@snapshotId, @eventTime, @equipmentSystem, @conditionAlarm, @impact, @immediateAction, @status, @pic)
`;
const SELECT_CRITICAL_EVENTS_SQL = `
  SELECT * FROM daily_report_critical_events WHERE snapshot_id = @snapshotId ORDER BY id ASC
`;
const DELETE_CRITICAL_EVENT_SQL = `DELETE FROM daily_report_critical_events WHERE id = @id`;
const LAST_INSERT_ID_SQL = `SELECT last_insert_rowid() AS id`;

export function insertCriticalEvent(db: SqlExecutor, input: CriticalEventInput): number {
  db.run(INSERT_CRITICAL_EVENT_SQL, { ...input });
  return db.get<{ id: number }>(LAST_INSERT_ID_SQL)!.id;
}

export function listCriticalEvents(db: SqlExecutor, snapshotId: number): CriticalEvent[] {
  return db.all<CriticalEventRow>(SELECT_CRITICAL_EVENTS_SQL, { snapshotId }).map(rowToCriticalEvent);
}

export function deleteCriticalEvent(db: SqlExecutor, id: number): void {
  db.run(DELETE_CRITICAL_EVENT_SQL, { id });
}

export interface SafetyNotesInput {
  snapshotId: number;
  unsafeActionText: string | null;
  unsafeConditionText: string | null;
  incidentText: string | null;
  remarksText: string | null;
}

export interface SafetyNotes extends SafetyNotesInput {
  id: number;
}

interface SafetyNotesRow {
  id: number;
  snapshot_id: number;
  unsafe_action_text: string | null;
  unsafe_condition_text: string | null;
  incident_text: string | null;
  remarks_text: string | null;
}

function rowToSafetyNotes(row: SafetyNotesRow): SafetyNotes {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    unsafeActionText: row.unsafe_action_text,
    unsafeConditionText: row.unsafe_condition_text,
    incidentText: row.incident_text,
    remarksText: row.remarks_text,
  };
}

const SELECT_SAFETY_NOTES_ID_SQL = `SELECT id FROM daily_report_safety_notes WHERE snapshot_id = @snapshotId`;
const SELECT_SAFETY_NOTES_SQL = `SELECT * FROM daily_report_safety_notes WHERE snapshot_id = @snapshotId`;
const UPDATE_SAFETY_NOTES_SQL = `
  UPDATE daily_report_safety_notes
  SET unsafe_action_text = @unsafeActionText, unsafe_condition_text = @unsafeConditionText,
      incident_text = @incidentText, remarks_text = @remarksText
  WHERE id = @id
`;
const INSERT_SAFETY_NOTES_SQL = `
  INSERT INTO daily_report_safety_notes
    (snapshot_id, unsafe_action_text, unsafe_condition_text, incident_text, remarks_text)
  VALUES (@snapshotId, @unsafeActionText, @unsafeConditionText, @incidentText, @remarksText)
`;

export function upsertSafetyNotes(db: SqlExecutor, input: SafetyNotesInput): void {
  const existing = db.get<{ id: number }>(SELECT_SAFETY_NOTES_ID_SQL, { snapshotId: input.snapshotId });
  if (existing) {
    db.run(UPDATE_SAFETY_NOTES_SQL, {
      id: existing.id,
      unsafeActionText: input.unsafeActionText,
      unsafeConditionText: input.unsafeConditionText,
      incidentText: input.incidentText,
      remarksText: input.remarksText,
    });
  } else {
    db.run(INSERT_SAFETY_NOTES_SQL, { ...input });
  }
}

export function getSafetyNotes(db: SqlExecutor, snapshotId: number): SafetyNotes | undefined {
  const row = db.get<SafetyNotesRow>(SELECT_SAFETY_NOTES_SQL, { snapshotId });
  return row ? rowToSafetyNotes(row) : undefined;
}

export type SignatureRole = 'prepared_by' | 'acknowledged_by';

export interface Signature {
  id: number;
  snapshotId: number;
  role: SignatureRole;
  signerName: string;
  signerTitle: string | null;
  signedAt: string;
}

interface SignatureRow {
  id: number;
  snapshot_id: number;
  role: SignatureRole;
  signer_name: string;
  signer_title: string | null;
  signed_at: string;
}

function rowToSignature(row: SignatureRow): Signature {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    role: row.role,
    signerName: row.signer_name,
    signerTitle: row.signer_title,
    signedAt: row.signed_at,
  };
}

// signature_image_ref는 Stage A 결정(name+timestamp 모드, moc_plan_of_change
// 패턴)에 따라 항상 null — 이미지 서명은 지원하지 않는다.
const UPSERT_SIGNATURE_SQL = `
  INSERT INTO daily_report_signatures (snapshot_id, role, signer_name, signer_title, signed_at, signature_image_ref)
  VALUES (@snapshotId, @role, @signerName, @signerTitle, @signedAt, NULL)
  ON CONFLICT(snapshot_id, role) DO UPDATE SET
    signer_name = @signerName, signer_title = @signerTitle, signed_at = @signedAt
`;
const SELECT_SIGNATURES_SQL = `SELECT * FROM daily_report_signatures WHERE snapshot_id = @snapshotId`;

export function upsertSignature(
  db: SqlExecutor,
  snapshotId: number,
  role: SignatureRole,
  signerName: string,
  signerTitle: string | null
): void {
  db.run(UPSERT_SIGNATURE_SQL, { snapshotId, role, signerName, signerTitle, signedAt: new Date().toISOString() });
}

export function listSignatures(db: SqlExecutor, snapshotId: number): Signature[] {
  return db.all<SignatureRow>(SELECT_SIGNATURES_SQL, { snapshotId }).map(rowToSignature);
}
