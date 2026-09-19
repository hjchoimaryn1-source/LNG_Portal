// src/app/api/v1/cmms/user-security/login/route.ts
//
// PURPOSE
//   Stage 1B username+password 로그인 HTTP 진입점. 기존
//   src/app/api/v1/cmms/auth/login/route.ts(PIN 기반, staff_credentials)는
//   이번 스테이지에서 무수정 — 완전히 별개의 신규 경로다.
//
//   판정 로직은 userSecurityLoginService.attemptLogin()에 위임하고, 이 라우트는
//   입력 검증 + 쿠키 설정 + HTTP 상태 매핑만 담당한다(daily-report-signatures/
//   route.ts와 동일한 얇은 어댑터 패턴).
//
//   ⚠ Secure 쿠키 플래그 — STEP 0 조사 결과 이 포털이 현장 PC에 HTTPS로
//   서비스되는지 확인할 수 없었다(next.config.ts에 TLS 설정 없음, 리버스
//   프록시/배포 문서 없음). 따라서 Secure:false로 둔다 — 평문 HTTP 환경에서
//   세션 쿠키가 네트워크상에서 그대로 노출될 수 있다는 뜻이며, 이는 후속
//   조치가 필요한 항목이다(HJ 확인 필요: 현장 PC가 실제로 HTTPS로 서비스되는지,
//   또는 리버스 프록시에서 TLS를 종단하는지 확인 후 이 값을 true로 바꿀 것).

import { NextRequest, NextResponse } from 'next/server';
import { getUserSecurityDb } from '../../../../../../lib/rbac/userSecurityDbSingleton';
import { attemptLogin } from '../../../../../../lib/rbac/userSecurityLoginService';
import { SESSION_COOKIE_NAME } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';

export const runtime = 'nodejs';

function isValidLoginInput(body: unknown): body is { username: string; password: string } {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.username === 'string' && r.username.length > 0 && typeof r.password === 'string' && r.password.length > 0;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidLoginInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid { username, password } payload.' }, { status: 400 });
  }

  const db = getUserSecurityDb();
  const ipAddress = request.headers.get('x-forwarded-for') ?? null;
  const result = attemptLogin(db, body.username, body.password, new Date(), ipAddress);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.reason }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    roleCode: result.roleCode,
    employeeId: result.employeeId,
    mustChangePassword: result.mustChangePassword,
  });

  response.cookies.set(SESSION_COOKIE_NAME, result.rawSessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: false, // TODO(security-followup): flip to true once HTTPS/reverse-proxy TLS is confirmed for on-site PCs (Step 0 — unconfirmed).
    path: '/',
    expires: new Date(result.expiresAt),
  });

  return response;
}
