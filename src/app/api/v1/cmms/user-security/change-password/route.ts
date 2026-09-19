// src/app/api/v1/cmms/user-security/change-password/route.ts
//
// PURPOSE
//   로그인 직후(must_change_password=1) 강제 비밀번호 변경 HTTP 진입점.
//   판정 로직은 userSecurityPasswordChangeService.changePassword()에 위임하고,
//   이 라우트는 세션 인증(누구나 로그인만 되어 있으면 자기 자신의 비밀번호를
//   바꿀 수 있음 — ADMIN 전용 아님) + 입력 검증 + HTTP 상태 매핑만 담당한다.

import { NextRequest, NextResponse } from 'next/server';
import { getUserSecurityDb } from '../../../../../../lib/rbac/userSecurityDbSingleton';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';
import { changePassword } from '../../../../../../lib/rbac/userSecurityPasswordChangeService';

export const runtime = 'nodejs';

function isValidChangeInput(body: unknown): body is { currentPassword: string; newPassword: string } {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.currentPassword === 'string' &&
    r.currentPassword.length > 0 &&
    typeof r.newPassword === 'string' &&
    r.newPassword.length > 0
  );
}

export async function POST(request: NextRequest) {
  const context = verifyUserSecuritySession(request);
  if (!context) {
    return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidChangeInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid { currentPassword, newPassword } payload.' }, { status: 400 });
  }

  const db = getUserSecurityDb();
  const result = changePassword(db, context.accountId, body.currentPassword, body.newPassword);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
