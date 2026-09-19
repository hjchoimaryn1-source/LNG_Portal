// src/app/api/v1/cmms/user-security/login-directory/route.ts
//
// PURPOSE
//   Part C 로그인 화면(선택형 카드 그리드)이 로그인 전에 호출하는 공개
//   엔드포인트 — 인증 불필요(로그인 화면 자체가 호출부이므로). ADMIN을 포함한
//   ACTIVE 계정의 username/roleCode/fullName만 노출한다(비밀번호 등 민감정보는
//   userSecurityLoginDirectoryDao.ts의 SELECT 자체에 포함되지 않음).

import { NextResponse } from 'next/server';
import { getUserSecurityDb } from '../../../../../../lib/rbac/userSecurityDbSingleton';
import { listLoginDirectory } from '../../../../../../lib/rbac/userSecurityLoginDirectoryDao';

export const runtime = 'nodejs';

export async function GET() {
  const db = getUserSecurityDb();
  return NextResponse.json({ success: true, accounts: listLoginDirectory(db) });
}
