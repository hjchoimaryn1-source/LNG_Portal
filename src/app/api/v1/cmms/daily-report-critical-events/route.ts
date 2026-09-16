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
import { getEffectivePermission } from '../../../../../lib/rbac/rolePermissionService';
import type { RoleCode } from '../../../../../types/rbac';

export const runtime = 'nodejs';

// RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
type CriticalEventInputWithRole = CriticalEventInput & { roleCode: RoleCode };

function isValidInput(body: unknown): body is CriticalEventInputWithRole {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.snapshotId === 'number' && typeof r.roleCode === 'string';
}

function isPermitted(roleCode: RoleCode): boolean {
  return getEffectivePermission(roleCode, 'DAILY_OPS_REPORT')?.canCreate === true;
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
  if (!isPermitted(body.roleCode)) {
    return NextResponse.json(
      { success: false, error: `Role ${body.roleCode} is not permitted to record critical events.` },
      { status: 403 }
    );
  }
  const { roleCode: _roleCode, ...input } = body;
  const db = getDailyOpsDb();
  const id = insertCriticalEvent(db, input);
  return NextResponse.json({ success: true, id });
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get('id'));
  const roleCode = request.nextUrl.searchParams.get('roleCode') as RoleCode | null;
  if (!id) {
    return NextResponse.json({ success: false, error: 'id required.' }, { status: 400 });
  }
  if (!roleCode || !isPermitted(roleCode)) {
    return NextResponse.json(
      { success: false, error: `Role ${roleCode ?? '(none)'} is not permitted to delete critical events.` },
      { status: 403 }
    );
  }
  const db = getDailyOpsDb();
  deleteCriticalEvent(db, id);
  return NextResponse.json({ success: true });
}
