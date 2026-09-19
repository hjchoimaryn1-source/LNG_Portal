// src/app/api/v1/cmms/daily-report-critical-events/route.ts
//
// PURPOSE
//   CriticalEventsEditor.tsx(Stage C2)의 CRUD API — 클라이언트/서버 경계
//   (dailyReportChildDao.ts가 node:sqlite를 간접 임포트)를 넘기기 위한 라우트.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import {
  insertCriticalEvent,
  listCriticalEvents,
  deleteCriticalEvent,
  type CriticalEventInput,
} from '../../../../../cmms-daily-ops/dao/dailyReportChildDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

// RBAC audit remediation — Phase 13 follow-up, 2026-09-16. roleCode is no
// longer read from the body/query string (Stage 3, 2026-09-19) — the Stage 1B
// session is the sole authorization source now that the client login has
// been replaced.
function isValidInput(body: unknown): body is CriticalEventInput {
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
  return NextResponse.json({ success: true, records: listCriticalEvents(db, snapshotId) });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid critical event payload.' }, { status: 400 });
  }
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canCreate !== true) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not permitted to record critical events.` },
      { status: 403 }
    );
  }
  const db = getDailyOpsDb();
  const id = insertCriticalEvent(db, body);
  return NextResponse.json({ success: true, id });
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ success: false, error: 'id required.' }, { status: 400 });
  }
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT')?.canCreate !== true) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not permitted to delete critical events.` },
      { status: 403 }
    );
  }
  const db = getDailyOpsDb();
  deleteCriticalEvent(db, id);
  return NextResponse.json({ success: true });
}
