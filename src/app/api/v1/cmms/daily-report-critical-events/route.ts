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
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';
import type { RoleCode, RolePermission } from '../../../../../types/rbac';

export const runtime = 'nodejs';

// RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
type CriticalEventInputWithRole = CriticalEventInput & { roleCode: RoleCode };

function isValidInput(body: unknown): body is CriticalEventInputWithRole {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.snapshotId === 'number' && typeof r.roleCode === 'string';
}

function isPermitted(permission: RolePermission | null): boolean {
  return permission?.canCreate === true;
}

// Stage 2A-ii (HJ decision 2026-09-19): prefer a verified Stage 1B session;
// fall back to the client-supplied (spoofable) legacy roleCode until the
// deferred client-side migration stage lands — see final report.
function resolvePermission(request: NextRequest, legacyRoleCode: RoleCode | null): { permission: RolePermission | null; roleLabel: string | null } {
  const session = verifyUserSecuritySession(request);
  if (session) {
    return { permission: resolveSessionPermission(session.employeeId, 'DAILY_OPS_REPORT'), roleLabel: session.roleCode };
  }
  return { permission: legacyRoleCode ? getEffectivePermission(legacyRoleCode, 'DAILY_OPS_REPORT') : null, roleLabel: legacyRoleCode };
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
  const { permission, roleLabel } = resolvePermission(request, body.roleCode);
  if (!isPermitted(permission)) {
    return NextResponse.json(
      { success: false, error: `Role ${roleLabel} is not permitted to record critical events.` },
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
  const { permission, roleLabel } = resolvePermission(request, roleCode);
  if (!isPermitted(permission)) {
    return NextResponse.json(
      { success: false, error: `Role ${roleLabel ?? '(none)'} is not permitted to delete critical events.` },
      { status: 403 }
    );
  }
  const db = getDailyOpsDb();
  deleteCriticalEvent(db, id);
  return NextResponse.json({ success: true });
}
