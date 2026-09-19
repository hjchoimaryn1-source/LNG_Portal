// src/lib/rbac/userSecuritySessionCore.ts
//
// PURPOSE
//   userSecuritySessionMiddleware.ts에서 "실제 getUserSecurityDb() 연결"과
//   "순수 세션 검증 로직"을 분리한 파일. 이 파일은 userSecurityDbSingleton.ts/
//   cmmsDbSingleton.ts를 전혀 import하지 않는다 — vitest의 vite-node ESM
//   리졸버가 'node:sqlite' 정적 value import를 로드하지 못하는 문제
//   (ptw-permits/route.test.ts 주석과 동일 현상) 때문에, SqlExecutor를
//   주입받아 인메모리 DB로 단위 테스트해야 하는 verifySessionToken()과
//   이를 재사용하는 attemptLogin()(userSecurityLoginService.ts)이 이 체인을
//   절대 끌고 오면 안 된다.

import { createHash } from 'node:crypto';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { Stage1RoleCode } from './userSecurityRolePermissionSeed';

export const SESSION_COOKIE_NAME = 'nias_user_security_session';

export interface UserSecurityRequestContext {
  accountId: string;
  employeeId: string;
  roleCode: Stage1RoleCode;
}

interface SessionRow {
  account_id: string;
  expires_at: string;
  revoked_at: string | null;
}

interface AccountRow {
  employee_id: string;
  role_code: Stage1RoleCode;
  account_status: string;
}

const SELECT_SESSION_SQL = `SELECT account_id, expires_at, revoked_at FROM user_sessions WHERE session_token_hash = @tokenHash`;
const SELECT_ACCOUNT_SQL = `SELECT employee_id, role_code, account_status FROM user_accounts WHERE account_id = @accountId`;
const TOUCH_SESSION_SQL = `UPDATE user_sessions SET last_seen_at = @now WHERE session_token_hash = @tokenHash`;

/** 원본 세션 토큰(쿠키 값)의 SHA-256 해시 — DB에는 이 해시만 저장/조회한다. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 토큰 하나를 검증해 요청 컨텍스트를 돌려준다. DB를 주입받아 단위 테스트 가능. */
export function verifySessionToken(db: SqlExecutor, token: string | undefined): UserSecurityRequestContext | null {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);

  const session = db.get<SessionRow>(SELECT_SESSION_SQL, { tokenHash });
  if (!session || session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;

  const account = db.get<AccountRow>(SELECT_ACCOUNT_SQL, { accountId: session.account_id });
  if (!account || account.account_status !== 'ACTIVE') return null;

  db.run(TOUCH_SESSION_SQL, { tokenHash, now: new Date().toISOString() });

  return { accountId: session.account_id, employeeId: account.employee_id, roleCode: account.role_code };
}
