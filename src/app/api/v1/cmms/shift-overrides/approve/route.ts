// src/app/api/v1/cmms/shift-overrides/approve/route.ts
//
// PURPOSE
//   Approval Hub Phase 1 — Stage 2c. Shift Override의 approval_status
//   (Stage 1c)를 SITE_APPROVED/REJECTED로 전환하는 승인 액션. work-orders/
//   approve/route.ts와 동일한 게이팅 근거 — session.roleCode를 직접
//   SITE_MANAGER/ADMIN으로 확인한다(그 파일 헤더 주석 참조).

import { NextRequest, NextResponse } from 'next/server';
import { approveShiftOverride } from '../../../../../../adapters/shiftOverrideDbAdapter';
import type { ShiftOverrideApprovalStatus } from '../../../../../../adapters/db/shiftOverrideDao';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';

export const runtime = 'nodejs';

const APPROVER_ROLES = ['SITE_MANAGER', 'ADMIN'] as const;
const VALID_DECISIONS: ShiftOverrideApprovalStatus[] = ['SITE_APPROVED', 'REJECTED'];

interface ApprovalBody {
  id: number;
  decision: ShiftOverrideApprovalStatus;
}

function isValidApprovalBody(body: unknown): body is ApprovalBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.id === 'number' &&
    typeof r.decision === 'string' && VALID_DECISIONS.includes(r.decision as ShiftOverrideApprovalStatus);
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
      { success: false, error: `Role ${session.roleCode} is not permitted to approve shift overrides.` },
      { status: 403 }
    );
  }

  const record = approveShiftOverride(body.id, body.decision, session.employeeId);
  if (!record) {
    return NextResponse.json({ success: false, error: `Shift override not found: ${body.id}` }, { status: 404 });
  }
  return NextResponse.json({ success: true, record });
}
