// src/app/api/v1/cmms/user-security/audit-log/route.ts
//
// PURPOSE
//   Stage 1D 읽기 전용 감사 로그 뷰어 API. ADMIN 세션만 조회 가능 — personnel/
//   accounts 라우트와 동일한 서버 사이드 게이트 패턴.

import { NextRequest, NextResponse } from 'next/server';
import { getUserSecurityDb } from '../../../../../../lib/rbac/userSecurityDbSingleton';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';
import { listAuditLog } from '../../../../../../lib/rbac/userAccountAuditLog';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const context = verifyUserSecuritySession(request);
  if (!context) {
    return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });
  }
  if (context.roleCode !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const db = getUserSecurityDb();
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;
  const records = listAuditLog(db, limit && !Number.isNaN(limit) ? limit : undefined);
  return NextResponse.json({ success: true, records });
}
