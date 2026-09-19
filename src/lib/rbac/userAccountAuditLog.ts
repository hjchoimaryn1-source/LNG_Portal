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
