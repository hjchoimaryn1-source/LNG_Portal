// src/app/api/v1/cmms/daily-report-hq-edit-close/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2) — HQ 수정 창을 닫고 Site Manager에게 통보한다
//   (hq_edit_pending_ack=true). openHqEditWindow와 동일하게 canUnlockApproved를
//   재검증한다 — 연 사람만 닫을 수 있다는 세션 소유권 추적은 이 앱에 실
//   인증이 없어(dev-mode roleCode 전달) 범위 밖.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { closeHqEditWindowAndNotify } from '../../../../../cmms-daily-ops/dao/dailyReportHqEditDao';
import { getEffectivePermission } from '../../../../../lib/rbac/rolePermissionService';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';
import type { RoleCode } from '../../../../../types/rbac';

export const runtime = 'nodejs';

interface CloseHqEditPayload {
  snapshotId: number;
  roleCode: RoleCode;
  actorId: string;
  summaryText: string;
}

function isValidPayload(body: unknown): body is CloseHqEditPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.snapshotId === 'number' &&
    typeof r.roleCode === 'string' &&
    typeof r.actorId === 'string' &&
    typeof r.summaryText === 'string' &&
    r.summaryText.trim().length > 0
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
    return NextResponse.json({ success: false, error: 'snapshotId, roleCode, actorId, summaryText required.' }, { status: 400 });
  }

  // Stage 2A-ii (HJ decision 2026-09-19): prefer a verified Stage 1B session;
  // fall back to the client-supplied (spoofable) legacy roleCode until the
  // deferred client-side migration stage lands — see final report.
  const session = verifyUserSecuritySession(request);
  const permission = session
    ? resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')
    : getEffectivePermission(body.roleCode, 'DAILY_OPS_REPORT');
  const roleLabel = session?.roleCode ?? body.roleCode;
  if (!permission?.canUnlockApproved) {
    return NextResponse.json(
      { success: false, error: `Role ${roleLabel} is not authorized to close an HQ edit window.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = closeHqEditWindowAndNotify(db, body.snapshotId, body.actorId, body.roleCode, body.summaryText);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
