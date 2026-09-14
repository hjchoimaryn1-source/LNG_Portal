// src/cmms-daily-ops/dao/dailyReportStatusLogDao.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-3) — daily_report_status_log 공용 writer/reader.
//   status_transition(approve/reject) + hq_unlock/hq_relock/hq_edit_ack
//   (Stage D Addendum D-ADD-1/2/2b) 이벤트를 한 테이블에 기록한다. from/to
//   status는 상태가 실제로 이동하지 않는 hq_unlock/hq_relock/hq_edit_ack
//   이벤트에서는 null로 남는다 — event_type이 의미를 담는다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { DailyReportStatus } from './dailyReportSnapshotDao';
import type { RoleCode } from '../../types/rbac';

export type StatusLogEventType = 'status_transition' | 'hq_unlock' | 'hq_relock' | 'hq_edit_ack';

export interface StatusLogEntryInput {
  snapshotId: number;
  eventType: StatusLogEventType;
  fromStatus: DailyReportStatus | null;
  toStatus: DailyReportStatus | null;
  actorUserId: string;
  actorRole: RoleCode;
  reasonText: string | null;
}

export interface StatusLogEntry extends StatusLogEntryInput {
  id: number;
  createdAt: string;
}

interface StatusLogRow {
  id: number;
  snapshot_id: number;
  event_type: StatusLogEventType;
  from_status: DailyReportStatus | null;
  to_status: DailyReportStatus | null;
  actor_user_id: string;
  actor_role: RoleCode;
  reason_text: string | null;
  created_at: string;
}

function rowToEntry(row: StatusLogRow): StatusLogEntry {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    eventType: row.event_type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    reasonText: row.reason_text,
    createdAt: row.created_at,
  };
}

const INSERT_SQL = `
  INSERT INTO daily_report_status_log
    (snapshot_id, event_type, from_status, to_status, actor_user_id, actor_role, reason_text)
  VALUES (@snapshotId, @eventType, @fromStatus, @toStatus, @actorUserId, @actorRole, @reasonText)
`;
const SELECT_BY_SNAPSHOT_SQL = `
  SELECT * FROM daily_report_status_log WHERE snapshot_id = @snapshotId ORDER BY id ASC
`;

export function logStatusEvent(db: SqlExecutor, input: StatusLogEntryInput): void {
  db.run(INSERT_SQL, { ...input });
}

export function listStatusLog(db: SqlExecutor, snapshotId: number): StatusLogEntry[] {
  return db.all<StatusLogRow>(SELECT_BY_SNAPSHOT_SQL, { snapshotId }).map(rowToEntry);
}
