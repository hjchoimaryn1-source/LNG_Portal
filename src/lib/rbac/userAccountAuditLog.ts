// src/lib/rbac/userAccountAuditLog.ts
//
// PURPOSE
//   user_account_audit_log에 대한 단일 쓰기 헬퍼. event_type 컬럼 자체는
//   자유 TEXT(CHECK 제약 없음)지만, 이 타입으로 어휘를 한곳에 고정해 Stage 1C
//   DAO들이 서로 다른 문자열을 쓰지 않게 한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export type UserAccountAuditEventType =
  | 'ACCOUNT_CREATED'
  | 'ROLE_CHANGED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_CHANGE_FAILED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'ACCOUNT_DISABLED'
  | 'PERSONNEL_CREATED'
  | 'PERSONNEL_UPDATED'
  | 'RESIGNED';

export interface UserAccountAuditEntry {
  employeeId: string | null;
  accountId: string | null;
  eventType: UserAccountAuditEventType;
  actorAccountId: string | null;
  detail?: string;
}

const INSERT_AUDIT_SQL = `
  INSERT INTO user_account_audit_log (employee_id, account_id, event_type, actor_account_id, detail)
  VALUES (@employeeId, @accountId, @eventType, @actorAccountId, @detail)
`;

export function writeUserAccountAudit(db: SqlExecutor, entry: UserAccountAuditEntry): void {
  db.run(INSERT_AUDIT_SQL, {
    employeeId: entry.employeeId,
    accountId: entry.accountId,
    eventType: entry.eventType,
    actorAccountId: entry.actorAccountId,
    detail: entry.detail ?? null,
  });
}

export interface UserAccountAuditRow {
  id: number;
  employeeId: string | null;
  accountId: string | null;
  eventType: string;
  actorAccountId: string | null;
  detail: string | null;
  createdAt: string;
}

interface RawAuditRow {
  id: number;
  employee_id: string | null;
  account_id: string | null;
  event_type: string;
  actor_account_id: string | null;
  detail: string | null;
  created_at: string;
}

const SELECT_AUDIT_LOG_SQL = `SELECT * FROM user_account_audit_log ORDER BY id DESC LIMIT @limit`;

/** Stage 1D 감사 로그 뷰어용 — 최신순, 기본 최대 200건. */
export function listAuditLog(db: SqlExecutor, limit = 200): UserAccountAuditRow[] {
  return db.all<RawAuditRow>(SELECT_AUDIT_LOG_SQL, { limit }).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    accountId: row.account_id,
    eventType: row.event_type,
    actorAccountId: row.actor_account_id,
    detail: row.detail,
    createdAt: row.created_at,
  }));
}
