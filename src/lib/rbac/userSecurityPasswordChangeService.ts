// src/lib/rbac/userSecurityPasswordChangeService.ts
//
// PURPOSE
//   must_change_password=1 로그인 직후 강제 비밀번호 변경(및 향후 일반
//   비밀번호 변경)에 공통으로 쓰는 순수 판정 로직. userSecurityLoginService.ts의
//   attemptLogin()과 동일한 패턴 — SqlExecutor 주입, HTTP 무관, 단위 테스트 가능.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { hashPassword, verifyPassword } from './passwordHash';
import { writeUserAccountAudit } from './userAccountAuditLog';

const MIN_PASSWORD_LENGTH = 8;

export type PasswordChangeFailureReason = 'INVALID_CURRENT_PASSWORD' | 'PASSWORD_TOO_SHORT' | 'ACCOUNT_NOT_FOUND';

export interface PasswordChangeSuccessResult {
  success: true;
}

export interface PasswordChangeFailureResult {
  success: false;
  reason: PasswordChangeFailureReason;
}

interface AccountRow {
  account_id: string;
  employee_id: string;
  password_hash: string;
}

const SELECT_ACCOUNT_SQL = `SELECT account_id, employee_id, password_hash FROM user_accounts WHERE account_id = @accountId`;
const UPDATE_PASSWORD_SQL = `
  UPDATE user_accounts
  SET password_hash = @passwordHash, must_change_password = 0, updated_at = @now
  WHERE account_id = @accountId
`;

/** 현재 비밀번호를 검증한 뒤 새 비밀번호로 교체하고 must_change_password를 해제한다. */
export function changePassword(
  db: SqlExecutor,
  accountId: string,
  currentPassword: string,
  newPassword: string,
  now: Date = new Date()
): PasswordChangeSuccessResult | PasswordChangeFailureResult {
  const account = db.get<AccountRow>(SELECT_ACCOUNT_SQL, { accountId });
  if (!account) {
    return { success: false, reason: 'ACCOUNT_NOT_FOUND' };
  }

  if (!verifyPassword(currentPassword, account.password_hash)) {
    writeUserAccountAudit(db, {
      employeeId: account.employee_id,
      accountId: account.account_id,
      eventType: 'PASSWORD_CHANGE_FAILED',
      actorAccountId: account.account_id,
      detail: 'Current password mismatch',
    });
    return { success: false, reason: 'INVALID_CURRENT_PASSWORD' };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { success: false, reason: 'PASSWORD_TOO_SHORT' };
  }

  db.run(UPDATE_PASSWORD_SQL, {
    accountId: account.account_id,
    passwordHash: hashPassword(newPassword),
    now: now.toISOString(),
  });
  writeUserAccountAudit(db, {
    employeeId: account.employee_id,
    accountId: account.account_id,
    eventType: 'PASSWORD_CHANGED',
    actorAccountId: account.account_id,
    detail: 'Self-service password change (must_change_password flow)',
  });

  return { success: true };
}
