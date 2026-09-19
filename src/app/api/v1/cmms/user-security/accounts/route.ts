// src/app/api/v1/cmms/user-security/accounts/route.ts
//
// PURPOSE
//   Stage 1C user_accounts 관리자 CRUD(계정 생성/역할 변경/잠금-해제/비밀번호
//   리셋). 모든 메서드는 세션 role_code==='ADMIN'을 서버에서 직접 재검증한다
//   (클라이언트 탭 가드는 UX일 뿐 보안 경계가 아니다, 지시 원문).
//
//   생성/리셋 시 발급되는 임시 비밀번호는 응답 JSON에 1회 실려 ADMIN 세션의
//   화면에만 보인다 — user_account_audit_log에는 절대 평문으로 남기지 않는다
//   (userAccountAdminDao.ts writeUserAccountAudit 호출부 참조).

import { NextRequest, NextResponse } from 'next/server';
import { getUserSecurityDb } from '../../../../../../lib/rbac/userSecurityDbSingleton';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';
import { createAccount, changeRole, setAccountLock, resetPassword, listAccounts } from '../../../../../../lib/rbac/userAccountAdminDao';
import { STAGE1_ROLE_CODES, type Stage1RoleCode } from '../../../../../../lib/rbac/userSecurityRolePermissionSeed';

export const runtime = 'nodejs';

function requireAdmin(request: NextRequest) {
  const context = verifyUserSecuritySession(request);
  if (!context) return { context: null, error: NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 }) };
  if (context.roleCode !== 'ADMIN') {
    return { context: null, error: NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 }) };
  }
  return { context, error: null };
}

function isValidRoleCode(value: unknown): value is Stage1RoleCode {
  return typeof value === 'string' && (STAGE1_ROLE_CODES as string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const { context, error } = requireAdmin(request);
  if (!context) return error;
  const db = getUserSecurityDb();
  return NextResponse.json({ success: true, records: listAccounts(db) });
}

interface CreateBody {
  employeeId: string;
  username: string;
  roleCode: Stage1RoleCode;
}

function isCreateInput(body: unknown): body is CreateBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.employeeId === 'string' &&
    r.employeeId.length > 0 &&
    typeof r.username === 'string' &&
    r.username.length > 0 &&
    isValidRoleCode(r.roleCode)
  );
}

export async function POST(request: NextRequest) {
  const { context, error } = requireAdmin(request);
  if (!context) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isCreateInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid { employeeId, username, roleCode } payload.' }, { status: 400 });
  }

  const db = getUserSecurityDb();
  const result = createAccount(db, body, context.accountId);
  return NextResponse.json({ success: true, accountId: result.accountId, tempPassword: result.tempPassword });
}

type PatchBody =
  | { accountId: string; action: 'CHANGE_ROLE'; roleCode: Stage1RoleCode }
  | { accountId: string; action: 'LOCK' }
  | { accountId: string; action: 'UNLOCK' }
  | { accountId: string; action: 'RESET_PASSWORD' };

function isPatchInput(body: unknown): body is PatchBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  if (typeof r.accountId !== 'string' || r.accountId.length === 0) return false;
  if (r.action === 'CHANGE_ROLE') return isValidRoleCode(r.roleCode);
  return r.action === 'LOCK' || r.action === 'UNLOCK' || r.action === 'RESET_PASSWORD';
}

export async function PATCH(request: NextRequest) {
  const { context, error } = requireAdmin(request);
  if (!context) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isPatchInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid account action payload.' }, { status: 400 });
  }

  const db = getUserSecurityDb();
  switch (body.action) {
    case 'CHANGE_ROLE':
      changeRole(db, body.accountId, body.roleCode, context.accountId);
      return NextResponse.json({ success: true });
    case 'LOCK':
      setAccountLock(db, body.accountId, true, context.accountId);
      return NextResponse.json({ success: true });
    case 'UNLOCK':
      setAccountLock(db, body.accountId, false, context.accountId);
      return NextResponse.json({ success: true });
    case 'RESET_PASSWORD': {
      const result = resetPassword(db, body.accountId, context.accountId);
      return NextResponse.json({ success: true, tempPassword: result.tempPassword });
    }
  }
}
