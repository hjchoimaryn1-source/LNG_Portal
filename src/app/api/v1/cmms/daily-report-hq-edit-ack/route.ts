// src/app/api/v1/cmms/daily-report-hq-edit-ack/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2b) — HQ 수정 통보 확인(hq_edit_pending_ack=false).
//   canApprove 티어(SITE_MANAGER 및 위임 활성 시 그 권한을 위임받은 역할)만
//   확인 가능 — daily-report-approval/route.ts와 동일한 RBAC 재검증 패턴.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { acknowledgeHqEdit } from '../../../../../cmms-daily-ops/dao/dailyReportHqEditDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

interface AckHqEditPayload {
  snapshotId: number;
  actorId: string;
}

function isValidPayload(body: unknown): body is AckHqEditPayload {
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
    return NextResponse.json({ success: false, error: 'snapshotId, actorId required.' }, { status: 400 });
  }

  // Stage 3 (HJ decision 2026-09-19): full replacement of the PIN-login
  // fallback — a valid Stage 1B session is now required.
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (!resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canApprove) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not authorized to acknowledge HQ edit notices.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = acknowledgeHqEdit(db, body.snapshotId, body.actorId, session.roleCode);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
