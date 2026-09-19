// src/lib/rbac/userAccountAdminDao.ts
//
// PURPOSE
//   user_accounts에 대한 관리자 전용 CRUD(계정 생성/역할 변경/잠금-해제/
//   비밀번호 리셋). role_code==='ADMIN' 세션 게이트는 route.ts가 담당한다 —
//   이 DAO 자체는 호출자(actorAccountId)를 신뢰하고 실행만 한다.

import { randomBytes } from 'node:crypto';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { hashPassword, generateTempPassword } from './passwordHash';
import { writeUserAccountAudit } from './userAccountAuditLog';
import type { Stage1RoleCode } from './userSecurityRolePermissionSeed';

export interface UserAccountRecord {
  accountId: string;
  employeeId: string;
  username: string;
  roleCode: Stage1RoleCode;
  accountStatus: string;
  failedAttemptCount: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

interface AccountRow {
  account_id: string;
  employee_id: string;
  username: string;
  role_code: Stage1RoleCode;
  account_status: string;
  failed_attempt_count: number;
  locked_until: string | null;
  must_change_password: number;
  last_login_at: string | null;
}

function rowToRecord(row: AccountRow): UserAccountRecord {
  return {
    accountId: row.account_id,
    employeeId: row.employee_id,
    username: row.username,
    roleCode: row.role_code,
    accountStatus: row.account_status,
    failedAttemptCount: row.failed_attempt_count,
    lockedUntil: row.locked_until,
    mustChangePassword: row.must_change_password === 1,
    lastLoginAt: row.last_login_at,
  };
}

export function listAccounts(db: SqlExecutor): UserAccountRecord[] {
  return db.all<AccountRow>('SELECT * FROM user_accounts ORDER BY account_id').map(rowToRecord);
}

export function getAccountById(db: SqlExecutor, accountId: string): UserAccountRecord | undefined {
  const row = db.get<AccountRow>('SELECT * FROM user_accounts WHERE account_id = @accountId', { accountId });
  return row ? rowToRecord(row) : undefined;
}

export function getAccountByEmployeeId(db: SqlExecutor, employeeId: string): UserAccountRecord | undefined {
  const row = db.get<AccountRow>('SELECT * FROM user_accounts WHERE employee_id = @employeeId', { employeeId });
  return row ? rowToRecord(row) : undefined;
}

export interface CreateAccountInput {
  employeeId: string;
  username: string;
  roleCode: Stage1RoleCode;
}

export interface CreateAccountResult {
  accountId: string;
  tempPassword: string;
}

const INSERT_ACCOUNT_SQL = `
  INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code)
  VALUES (@accountId, @employeeId, @username, @passwordHash, @roleCode)
`;

/** 기존 personnel_master 행에 대해 로그인 계정 1건을 새로 발급한다. */
export function createAccount(db: SqlExecutor, input: CreateAccountInput, actorAccountId: string): CreateAccountResult {
  const accountId = randomBytes(8).toString('hex');
  const tempPassword = generateTempPassword();
  db.run(INSERT_ACCOUNT_SQL, {
    accountId,
    employeeId: input.employeeId,
    username: input.username,
    passwordHash: hashPassword(tempPassword),
    roleCode: input.roleCode,
  });
  writeUserAccountAudit(db, {
    employeeId: input.employeeId,
    accountId,
    eventType: 'ACCOUNT_CREATED',
    actorAccountId,
    detail: `username=${input.username} roleCode=${input.roleCode}`,
  });
  return { accountId, tempPassword };
}

export function changeRole(db: SqlExecutor, accountId: string, newRoleCode: Stage1RoleCode, actorAccountId: string): void {
  const account = getAccountById(db, accountId);
  db.run('UPDATE user_accounts SET role_code = @newRoleCode, updated_at = @now WHERE account_id = @accountId', {
    accountId,
    newRoleCode,
    now: new Date().toISOString(),
  });
  writeUserAccountAudit(db, {
    employeeId: account?.employeeId ?? null,
    accountId,
    eventType: 'ROLE_CHANGED',
    actorAccountId,
    detail: `${account?.roleCode ?? '?'} -> ${newRoleCode}`,
  });
}

export function setAccountLock(db: SqlExecutor, accountId: string, locked: boolean, actorAccountId: string): void {
  const account = getAccountById(db, accountId);
  db.run(
    `UPDATE user_accounts
     SET account_status = @status, failed_attempt_count = 0, locked_until = NULL, updated_at = @now
     WHERE account_id = @accountId`,
    { accountId, status: locked ? 'LOCKED' : 'ACTIVE', now: new Date().toISOString() }
  );
  writeUserAccountAudit(db, {
    employeeId: account?.employeeId ?? null,
    accountId,
    eventType: locked ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED',
    actorAccountId,
    detail: 'Manual admin action',
  });
}

export function resetPassword(db: SqlExecutor, accountId: string, actorAccountId: string): { tempPassword: string } {
  const account = getAccountById(db, accountId);
  const tempPassword = generateTempPassword();
  db.run(
    `UPDATE user_accounts
     SET password_hash = @passwordHash, must_change_password = 1, failed_attempt_count = 0, locked_until = NULL, updated_at = @now
     WHERE account_id = @accountId`,
    { accountId, passwordHash: hashPassword(tempPassword), now: new Date().toISOString() }
  );
  writeUserAccountAudit(db, {
    employeeId: account?.employeeId ?? null,
    accountId,
    eventType: 'PASSWORD_RESET',
    actorAccountId,
    detail: 'Admin-initiated reset',
  });
  return { tempPassword };
}
