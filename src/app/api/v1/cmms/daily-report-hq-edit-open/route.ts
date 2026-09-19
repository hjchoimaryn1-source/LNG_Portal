// src/app/api/v1/cmms/daily-report-hq-edit-open/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2) — APPROVED 리포트에 HQ 임시 수정 창을 연다.
//   서버에서 getEffectivePermission(roleCode, 'DAILY_OPS_REPORT').canUnlockApproved
//   를 재검증한다(SYSTEM_ADMIN만 true) — daily-report-approval/route.ts와 동일 패턴.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { openHqEditWindow } from '../../../../../cmms-daily-ops/dao/dailyReportHqEditDao';
import { getEffectivePermission } from '../../../../../lib/rbac/rolePermissionService';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';
import type { RoleCode } from '../../../../../types/rbac';

export const runtime = 'nodejs';

interface OpenHqEditPayload {
  snapshotId: number;
  roleCode: RoleCode;
  actorId: string;
  reasonText: string;
}

function isValidPayload(body: unknown): body is OpenHqEditPayload {
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
  if (!permission?.canUnlockApproved) {
    return NextResponse.json(
      { success: false, error: `Role ${roleLabel} is not authorized to open an HQ edit window.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = openHqEditWindow(db, body.snapshotId, body.actorId, body.roleCode, body.reasonText);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
