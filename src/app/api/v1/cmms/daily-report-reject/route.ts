// src/app/api/v1/cmms/daily-report-reject/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-1) — SUBMITTED -> DRAFT 반려 API. 승인과 동일한
//   RBAC 재검증(getEffectivePermission(...).canApprove) 패턴을 따른다
//   (daily-report-approval/route.ts 참고).

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { rejectSubmission } from '../../../../../cmms-daily-ops/dao/dailyReportApprovalDao';
import { getEffectivePermission } from '../../../../../lib/rbac/rolePermissionService';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';
import type { RoleCode } from '../../../../../types/rbac';

export const runtime = 'nodejs';

interface RejectPayload {
  snapshotId: number;
  roleCode: RoleCode;
  actorId: string;
  reasonText: string;
}

function isValidPayload(body: unknown): body is RejectPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.snapshotId === 'number' &&
    typeof r.roleCode === 'string' &&
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
    return NextResponse.json({ success: false, error: 'snapshotId, roleCode, actorId, reasonText required.' }, { status: 400 });
  }

  // Stage 2A-ii (HJ decision 2026-09-19): prefer a verified Stage 1B session;
  // fall back to the client-supplied (spoofable) legacy roleCode until the
  // deferred client-side migration stage lands — see final report.
  const session = verifyUserSecuritySession(request);
  const permission = session
    ? resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')
    : getEffectivePermission(body.roleCode, 'DAILY_OPS_REPORT');
  const roleLabel = session?.roleCode ?? body.roleCode;
  if (!permission?.canApprove) {
    return NextResponse.json(
      { success: false, error: `Role ${roleLabel} is not authorized to reject Daily Ops reports.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  // rejectSubmission()'s persisted actorRole column is still typed to the
  // legacy RoleCode vocabulary — keep passing the client-supplied body.roleCode
  // here (unchanged) rather than the new-vocabulary session role; widening this
  // DAO's type is out of scope for this stage.
  const result = rejectSubmission(db, body.snapshotId, body.actorId, body.roleCode, body.reasonText);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
