// src/app/api/v1/cmms/daily-report-hq-edit-open/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2) — APPROVED 리포트에 HQ 임시 수정 창을 연다.
//   서버에서 resolveSessionPermission(employeeId, 'DAILY_OPS_REPORT').canUnlockApproved
//   를 재검증한다(ADMIN만 true) — daily-report-approval/route.ts와 동일 패턴.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { openHqEditWindow } from '../../../../../cmms-daily-ops/dao/dailyReportHqEditDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

interface OpenHqEditPayload {
  snapshotId: number;
  actorId: string;
  reasonText: string;
}

function isValidPayload(body: unknown): body is OpenHqEditPayload {
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
  if (!resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canUnlockApproved) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not authorized to open an HQ edit window.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = openHqEditWindow(db, body.snapshotId, body.actorId, session.roleCode, body.reasonText);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
