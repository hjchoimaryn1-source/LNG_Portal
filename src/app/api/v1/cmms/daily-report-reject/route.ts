// src/app/api/v1/cmms/daily-report-reject/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-1) — SUBMITTED -> DRAFT 반려 API. 승인과 동일한
//   RBAC 재검증(resolveSessionPermission(...).canApprove) 패턴을 따른다
//   (daily-report-approval/route.ts 참고).

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { rejectSubmission } from '../../../../../cmms-daily-ops/dao/dailyReportApprovalDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

interface RejectPayload {
  snapshotId: number;
  actorId: string;
  reasonText: string;
}

// roleCode is no longer read from the body (Stage 3, 2026-09-19) — the
// Stage 1B session is the sole authorization AND persisted-actor-role source
// now that the client login has been replaced.
function isValidPayload(body: unknown): body is RejectPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.snapshotId === 'number' &&
    typeof r.actorId === 'string' &&
    typeof r.reasonText === 'string' &&
    r.reasonText.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'snapshotId, actorId, reasonText required.' }, { status: 400 });
  }

  // Stage 3 (HJ decision 2026-09-19): full replacement of the PIN-login
  // fallback — a valid Stage 1B session is now required.
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (!resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canApprove) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not authorized to reject Daily Ops reports.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = rejectSubmission(db, body.snapshotId, body.actorId, session.roleCode, body.reasonText);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
