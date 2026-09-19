// src/lib/rbac/userSecurityLoginService.ts
//
// PURPOSE
//   Stage 1B username+password 로그인 판정 로직. 기존 PIN 기반
//   src/cmms-auth(staff_credentials/verifyStaffPin/devStaffPins.ts)와는 완전히
//   별개 경로 — 이번 스테이지에서 그쪽은 무수정이다.
//
//   SqlExecutor를 주입받는 순수 함수로 둬서(React/Next 미의존) 인메모리 DB로
//   단위 테스트 가능하게 한다. 라우트(route.ts)는 이 함수를 부르고 쿠키만
//   붙이는 얇은 HTTP 어댑터로 남는다.

import { randomBytes } from 'node:crypto';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { verifyPassword } from './passwordHash';
import { hashSessionToken } from './userSecuritySessionCore';
import type { Stage1RoleCode } from './userSecurityRolePermissionSeed';

// cmms-auth/index.ts의 SESSION_TTL_MS(12h)와 동일한 기본값을 재사용 — 이 저장소에
// 이미 확립된 세션 수명 관례.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export type LoginFailureReason = 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_DISABLED';

export interface LoginSuccessResult {
  success: true;
  rawSessionToken: string;
  accountId: string;
  employeeId: string;
  roleCode: Stage1RoleCode;
  mustChangePassword: boolean;
  expiresAt: string;
}

export interface LoginFailureResult {
  success: false;
  reason: LoginFailureReason;
}

interface AccountRow {
  account_id: string;
  employee_id: string;
  password_hash: string;
  role_code: Stage1RoleCode;
  account_status: string;
  failed_attempt_count: number;
  locked_until: string | null;
  must_change_password: number;
}

const SELECT_ACCOUNT_SQL = `SELECT * FROM user_accounts WHERE username = @username`;
const INCREMENT_FAILED_SQL = `
  UPDATE user_accounts
  SET failed_attempt_count = @failedAttemptCount, locked_until = @lockedUntil, updated_at = @now
  WHERE account_id = @accountId
`;
const RESET_ON_SUCCESS_SQL = `
  UPDATE user_accounts
  SET failed_attempt_count = 0, locked_until = NULL, last_login_at = @now, updated_at = @now
  WHERE account_id = @accountId
`;
const INSERT_SESSION_SQL = `
  INSERT INTO user_sessions (session_token_hash, account_id, role_code, expires_at, ip_address)
  VALUES (@tokenHash, @accountId, @roleCode, @expiresAt, @ipAddress)
`;
const INSERT_AUDIT_SQL = `
  INSERT INTO user_account_audit_log (employee_id, account_id, event_type, actor_account_id, detail)
  VALUES (@employeeId, @accountId, @eventType, @actorAccountId, @detail)
`;

function isLocked(account: AccountRow, now: Date): boolean {
  if (!account.locked_until) return false;
  return new Date(account.locked_until).getTime() > now.getTime();
}

function writeAudit(
  db: SqlExecutor,
  employeeId: string | null,
  accountId: string | null,
  eventType: string,
  detail: string
): void {
  db.run(INSERT_AUDIT_SQL, { employeeId, accountId, eventType, actorAccountId: accountId, detail });
}

/**
 * username+password를 검증한다. 성공 시 세션 토큰(원본, 해시 아님)을 발급해
 * user_sessions에 해시만 저장하고 반환값에 원본을 실어 보낸다 — 호출자(route.ts)가
 * 이 원본을 쿠키 값으로 그대로 내려보낸다.
 */
export function attemptLogin(
  db: SqlExecutor,
  username: string,
  password: string,
  now: Date = new Date(),
  ipAddress: string | null = null
): LoginSuccessResult | LoginFailureResult {
  const account = db.get<AccountRow>(SELECT_ACCOUNT_SQL, { username });

  if (!account) {
    // 존재하지 않는 username — 어느 계정에 실패를 기록할지 알 수 없어 audit만 남긴다.
    writeAudit(db, null, null, 'LOGIN_FAILED', `Unknown username: ${username}`);
    return { success: false, reason: 'INVALID_CREDENTIALS' };
  }

  if (account.account_status !== 'ACTIVE') {
    writeAudit(db, account.employee_id, account.account_id, 'LOGIN_FAILED', `account_status=${account.account_status}`);
    return { success: false, reason: 'ACCOUNT_DISABLED' };
  }

  if (isLocked(account, now)) {
    writeAudit(db, account.employee_id, account.account_id, 'LOGIN_FAILED', `Locked until ${account.locked_until}`);
    return { success: false, reason: 'ACCOUNT_LOCKED' };
  }

  const passwordOk = verifyPassword(password, account.password_hash);
  if (!passwordOk) {
    const failedAttemptCount = account.failed_attempt_count + 1;
    const willLock = failedAttemptCount >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = willLock ? new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString() : null;

    db.run(INCREMENT_FAILED_SQL, {
      accountId: account.account_id,
      failedAttemptCount,
      lockedUntil,
      now: now.toISOString(),
    });
    writeAudit(db, account.employee_id, account.account_id, 'LOGIN_FAILED', `failed_attempt_count=${failedAttemptCount}`);
    if (willLock) {
      writeAudit(db, account.employee_id, account.account_id, 'ACCOUNT_LOCKED', `locked_until=${lockedUntil}`);
    }
    return { success: false, reason: willLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS' };
  }

  const rawSessionToken = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawSessionToken);
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  db.run(RESET_ON_SUCCESS_SQL, { accountId: account.account_id, now: now.toISOString() });
  db.run(INSERT_SESSION_SQL, {
    tokenHash,
    accountId: account.account_id,
    roleCode: account.role_code,
    expiresAt,
    ipAddress,
  });
  writeAudit(db, account.employee_id, account.account_id, 'LOGIN_SUCCESS', 'Password login');

  return {
    success: true,
    rawSessionToken,
    accountId: account.account_id,
    employeeId: account.employee_id,
    roleCode: account.role_code,
    mustChangePassword: account.must_change_password === 1,
    expiresAt,
  };
}
