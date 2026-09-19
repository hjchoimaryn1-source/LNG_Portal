// src/app/api/v1/cmms/work-orders/approve/route.ts
//
// PURPOSE
//   Approval Hub Phase 1 — Stage 2c. WO의 approval_status(Stage 1a)를
//   SITE_APPROVED/REJECTED로 전환하는 승인 액션 전용 엔드포인트.
//   기존 PATCH(수행 기록)와 분리한 이유: 승인은 별도 권한 축(roleCode
//   SITE_MANAGER/ADMIN only, HJ Option A)이고, work_orders.status(진행 상태)와
//   approval_status(결재 상태)는 서로 다른 축이라 한 핸들러에 섞지 않는다.
//
//   MAINTENANCE_MRO_HUB의 canApprove가 SITE_MANAGER=0으로 확정되어 있는 등
//   (userSecurityRolePermissionSeed.ts CONFIRMED_ROLE_PERMISSION_MATRIX) 기존
//   모듈별 canApprove 매트릭스는 이 신규 크로스 도메인 승인 액션을 염두에 두고
//   설계된 것이 아니다 — 그래서 resolveSessionPermission()의 canApprove가 아니라
//   session.roleCode를 직접 SITE_MANAGER/ADMIN으로 게이팅한다(HJ Option A 문구
//   그대로). 인증 자체는 기존 13개 라우트와 동일하게 verifyUserSecuritySession으로 검증한다.

import { NextRequest, NextResponse } from 'next/server';
import { approveWorkOrder } from '../../../../../../adapters/workOrderDbAdapter';
import type { WorkOrderApprovalStatus } from '../../../../../../adapters/db/workOrderDao';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';

export const runtime = 'nodejs';

const APPROVER_ROLES = ['SITE_MANAGER', 'ADMIN'] as const;
const VALID_DECISIONS: WorkOrderApprovalStatus[] = ['SITE_APPROVED', 'REJECTED'];

interface ApprovalBody {
  workOrderId: string;
  decision: WorkOrderApprovalStatus;
}

function isValidApprovalBody(body: unknown): body is ApprovalBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.workOrderId === 'string' && r.workOrderId.length > 0 &&
    typeof r.decision === 'string' && VALID_DECISIONS.includes(r.decision as WorkOrderApprovalStatus);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidApprovalBody(body)) {
    return NextResponse.json({ success: false, error: 'Invalid approval payload.' }, { status: 400 });
  }

  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (!APPROVER_ROLES.includes(session.roleCode as (typeof APPROVER_ROLES)[number])) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not permitted to approve work orders.` },
      { status: 403 }
    );
  }

  const record = approveWorkOrder(body.workOrderId, body.decision);
  if (!record) {
    return NextResponse.json({ success: false, error: `Work order not found: ${body.workOrderId}` }, { status: 404 });
  }
  return NextResponse.json({ success: true, record });
}
