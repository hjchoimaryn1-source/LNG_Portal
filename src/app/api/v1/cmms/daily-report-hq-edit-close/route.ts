// src/app/api/v1/cmms/daily-report-hq-edit-close/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2) — HQ 수정 창을 닫고 Site Manager에게 통보한다
//   (hq_edit_pending_ack=true). openHqEditWindow와 동일하게 canUnlockApproved를
//   재검증한다 — 연 사람만 닫을 수 있다는 세션 소유권 추적은 범위 밖.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { closeHqEditWindowAndNotify } from '../../../../../cmms-daily-ops/dao/dailyReportHqEditDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

interface CloseHqEditPayload {
  snapshotId: number;
  actorId: string;
  summaryText: string;
}

function isValidPayload(body: unknown): body is CloseHqEditPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.snapshotId === 'number' &&
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
    return NextResponse.json({ success: false, error: 'snapshotId, actorId, summaryText required.' }, { status: 400 });
  }

  // Stage 3 (HJ decision 2026-09-19): full replacement of the PIN-login
  // fallback — a valid Stage 1B session is now required.
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (!resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canUnlockApproved) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not authorized to close an HQ edit window.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = closeHqEditWindowAndNotify(db, body.snapshotId, body.actorId, session.roleCode, body.summaryText);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
