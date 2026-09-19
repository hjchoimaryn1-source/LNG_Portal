// src/lib/rbac/userSecuritySessionMiddleware.ts
//
// PURPOSE
//   Next.js Route Handler 진입점. 순수 검증 로직/타입은 전부
//   userSecuritySessionCore.ts에 있고, 이 파일은 실제 getUserSecurityDb()
//   연결 + 요청 쿠키 추출만 담당한다 — node:sqlite 체인을 끌고 오면 안 되는
//   이유는 userSecuritySessionCore.ts 헤더 주석 참조.
//
//   이번 스테이지에서는 기존 38개 감사 완료 라우트에 붙이지 않는다 — 이 파일이
//   보호하는 것은 신규 로그인 라우트 자신과 Stage 1C/1D의 신규 라우트뿐이다.

import type { NextRequest } from 'next/server';
import { getUserSecurityDb } from './userSecurityDbSingleton';
import { verifySessionToken, SESSION_COOKIE_NAME } from './userSecuritySessionCore';
import type { UserSecurityRequestContext } from './userSecuritySessionCore';

export { SESSION_COOKIE_NAME, hashSessionToken } from './userSecuritySessionCore';
export type { UserSecurityRequestContext } from './userSecuritySessionCore';

/** Next.js Route Handler에서 바로 쓰는 진입점 — 쿠키를 읽고 실제 DB로 검증한다. */
export function verifyUserSecuritySession(request: NextRequest): UserSecurityRequestContext | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(getUserSecurityDb(), token);
}
