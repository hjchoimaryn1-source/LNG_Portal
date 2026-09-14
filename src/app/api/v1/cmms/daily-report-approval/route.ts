// src/app/api/v1/cmms/daily-report-approval/route.ts
//
// PURPOSE
//   Phase 12 Pre-Flight III — SUBMITTED -> APPROVED 전이 API (Site Manager
//   승인). roleCode는 클라이언트가 body로 전달한다(이 프로젝트에 실 세션/
//   토큰 인증이 아직 없음 — usePatrolSaveHandler.ts의 recordedBy와 동일한
//   dev-mode 한계, 인증 연동은 범위 밖). 서버에서도
//   getEffectivePermission(roleCode, 'DAILY_OPS_REPORT').canApprove를
//   재검증해 클라이언트 측 가드(evaluateMutationGuardrails)만으로 승인
//   버튼이 우회되지 않게 한다.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { approveSnapshot } from '../../../../../cmms-daily-ops/dao/dailyReportApprovalDao';
import { getEffectivePermission } from '../../../../../lib/rbac/rolePermissionService';
import type { RoleCode } from '../../../../../types/rbac';

export const runtime = 'nodejs';

interface ApprovalPayload {
  snapshotId: number;
  roleCode: RoleCode;
  actorId: string;
}

function isValidPayload(body: unknown): body is ApprovalPayload {
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
    return NextResponse.json({ success: false, error: 'snapshotId and roleCode required.' }, { status: 400 });
  }

  const permission = getEffectivePermission(body.roleCode, 'DAILY_OPS_REPORT');
  if (!permission?.canApprove) {
    return NextResponse.json(
      { success: false, error: `Role ${body.roleCode} is not authorized to approve Daily Ops reports.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  const result = approveSnapshot(db, body.snapshotId, body.actorId, body.roleCode);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, currentStatus: result.currentStatus }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
