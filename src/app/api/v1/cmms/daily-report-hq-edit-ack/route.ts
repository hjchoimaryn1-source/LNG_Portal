// src/app/api/v1/cmms/daily-report-hq-edit-ack/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2b) — HQ 수정 통보 확인(hq_edit_pending_ack=false).
//   canApprove 티어(SITE_MANAGER/ACTING_SITE_MANAGER/SYSTEM_ADMIN)만 확인
//   가능 — daily-report-approval/route.ts와 동일한 RBAC 재검증 패턴.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { acknowledgeHqEdit } from '../../../../../cmms-daily-ops/dao/dailyReportHqEditDao';
import { getEffectivePermission } from '../../../../../lib/rbac/rolePermissionService';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';
import type { RoleCode } from '../../../../../types/rbac';

export const runtime = 'nodejs';

interface AckHqEditPayload {
  snapshotId: number;
  roleCode: RoleCode;
  actorId: string;
}

function isValidPayload(body: unknown): body is AckHqEditPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.snapshotId === 'number' && typeof r.roleCode === 'string' && typeof r.actorId === 'string';
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'snapshotId, roleCode, actorId required.' }, { status: 400 });
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
      { success: false, error: `Role ${roleLabel} is not authorized to acknowledge HQ edit notices.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = acknowledgeHqEdit(db, body.snapshotId, body.actorId, body.roleCode);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
