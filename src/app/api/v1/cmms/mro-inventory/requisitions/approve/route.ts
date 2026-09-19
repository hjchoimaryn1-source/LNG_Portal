// src/app/api/v1/cmms/mro-inventory/requisitions/approve/route.ts
//
// PURPOSE
//   Approval Hub Phase 1 — Stage 2c. MRO 구매요청(PR)의 approval_status
//   (Stage 1b)를 SITE_APPROVED/REJECTED로 전환하는 승인 액션. work-orders/
//   approve/route.ts와 동일한 게이팅 근거 — session.roleCode를 직접
//   SITE_MANAGER/ADMIN으로 확인한다(그 파일 헤더 주석 참조).

import { NextRequest, NextResponse } from 'next/server';
import { approveRequisition } from '../../../../../../../adapters/purchaseRequisitionDbAdapter';
import type { PurchaseRequisitionApprovalStatus } from '../../../../../../../adapters/db/purchaseRequisitionDao';
import { verifyUserSecuritySession } from '../../../../../../../lib/rbac/userSecuritySessionMiddleware';

export const runtime = 'nodejs';

const APPROVER_ROLES = ['SITE_MANAGER', 'ADMIN'] as const;
const VALID_DECISIONS: PurchaseRequisitionApprovalStatus[] = ['SITE_APPROVED', 'REJECTED'];

interface ApprovalBody {
  prId: number;
  decision: PurchaseRequisitionApprovalStatus;
}

function isValidApprovalBody(body: unknown): body is ApprovalBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.prId === 'number' &&
    typeof r.decision === 'string' && VALID_DECISIONS.includes(r.decision as PurchaseRequisitionApprovalStatus);
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
      { success: false, error: `Role ${session.roleCode} is not permitted to approve MRO requisitions.` },
      { status: 403 }
    );
  }

  const record = approveRequisition(body.prId, body.decision);
  if (!record) {
    return NextResponse.json({ success: false, error: `Requisition not found: ${body.prId}` }, { status: 404 });
  }
  return NextResponse.json({ success: true, record });
}
