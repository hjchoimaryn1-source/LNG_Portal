// src/app/api/v1/cmms/auth/login/route.ts
//
// PURPOSE
//   LoginGateway.tsx(use client)가 src/cmms-auth barrel의 authenticate()를
//   직접 import하면 node:sqlite가 클라이언트 번들에 딸려 들어간다
//   (src/app/api/v1/cmms/work-orders/route.ts와 동일한 이유로 도메인 로직은
//   서버 전용 모듈에 두고, 이 route는 입력 검증과 HTTP 응답 매핑만 담당한다).

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, ensureDevQuickLoginCredential } from '../../../../../../cmms-auth';

export const runtime = 'nodejs';

function isValidLoginInput(body: unknown): body is { pin: string; staffId: string } {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.pin === 'string' && r.pin.length > 0 &&
    typeof r.staffId === 'string' && r.staffId.length > 0;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidLoginInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid { pin, staffId } payload.' }, { status: 400 });
  }

  // DEV-ONLY: auto-provision the fixed Quick-Login PIN on first use (see
  // ensureDevQuickLoginCredential doc comment in ../../../../../../cmms-auth/index.ts).
  ensureDevQuickLoginCredential(body.staffId, 'UNASSIGNED');

  const result = authenticate(body.pin, body.staffId);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.reason ?? 'AUTH_FAILED' }, { status: 401 });
  }

  return NextResponse.json({ success: true, session: result.session, effectiveRole: result.effectiveRole });
}
