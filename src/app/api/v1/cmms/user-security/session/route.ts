// src/app/api/v1/cmms/user-security/session/route.ts
//
// PURPOSE
//   Stage 1D의 "누구로 로그인했는가" 조회 전용 엔드포인트. httpOnly 쿠키는
//   자바스크립트에서 직접 읽을 수 없으므로(의도된 보안 속성), Admin 탭이
//   client-side로 role_code==='ADMIN'인지 판단하려면 서버가 쿠키를 검증한
//   결과(민감하지 않은 roleCode/employeeId만)를 내려주는 이 경로가 필요하다.
//   세션 토큰 원본이나 해시는 응답에 담지 않는다.

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const context = verifyUserSecuritySession(request);
  if (!context) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    roleCode: context.roleCode,
    employeeId: context.employeeId,
  });
}
