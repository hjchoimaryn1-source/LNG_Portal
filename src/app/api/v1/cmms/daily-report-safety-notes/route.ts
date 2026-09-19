// src/app/api/v1/cmms/daily-report-safety-notes/route.ts
//
// PURPOSE
//   SafetyNotesEditor.tsx(Stage C2)의 조회/저장 API — client/server 경계를
//   넘기기 위한 라우트. upsertSafetyNotes는 app-level upsert(DAO 참고).

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { upsertSafetyNotes, getSafetyNotes, type SafetyNotesInput } from '../../../../../cmms-daily-ops/dao/dailyReportChildDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

// RBAC audit remediation — Phase 13 follow-up, 2026-09-16. roleCode is no
// longer read from the body (Stage 3, 2026-09-19) — the Stage 1B session is
// the sole authorization source now that the client login has been replaced.
function isValidInput(body: unknown): body is SafetyNotesInput {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.snapshotId === 'number';
}

export async function GET(request: NextRequest) {
  const snapshotId = Number(request.nextUrl.searchParams.get('snapshotId'));
  if (!snapshotId) {
    return NextResponse.json({ success: false, error: 'snapshotId required.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  return NextResponse.json({ success: true, record: getSafetyNotes(db, snapshotId) ?? null });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid safety notes payload.' }, { status: 400 });
  }
  // Stage 3 (HJ decision 2026-09-19): full replacement of the PIN-login
  // fallback — a valid Stage 1B session is now required.
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canCreate !== true) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not permitted to save safety notes.` },
      { status: 403 }
    );
  }
  const db = getDailyOpsDb();
  upsertSafetyNotes(db, body);
  return NextResponse.json({ success: true });
}
