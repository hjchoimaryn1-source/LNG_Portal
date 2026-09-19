// src/app/api/v1/cmms/daily-report-approval/route.ts
//
// PURPOSE
//   Phase 12 Pre-Flight III — SUBMITTED -> APPROVED 전이 API (Site Manager
//   승인). Stage 3(2026-09-19)부터 roleCode는 body가 아니라 Stage 1B 세션
//   (verifyUserSecuritySession)에서만 가져온다. 서버에서도
//   resolveSessionPermission(employeeId, 'DAILY_OPS_REPORT').canApprove를
//   재검증해 클라이언트 측 가드(evaluateMutationGuardrails)만으로 승인
//   버튼이 우회되지 않게 한다.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { approveSnapshot } from '../../../../../cmms-daily-ops/dao/dailyReportApprovalDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

interface ApprovalPayload {
  snapshotId: number;
  actorId: string;
}

function isValidPayload(body: unknown): body is ApprovalPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.snapshotId === 'number' && typeof r.actorId === 'string';
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'snapshotId and actorId required.' }, { status: 400 });
  }

  // Stage 3 (HJ decision 2026-09-19): full replacement of the PIN-login
  // fallback — a valid Stage 1B session is now required.
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (!resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canApprove) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not authorized to approve Daily Ops reports.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = approveSnapshot(db, body.snapshotId, body.actorId, session.roleCode);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
