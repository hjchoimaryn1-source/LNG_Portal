// src/app/api/v1/cmms/shift-overrides/route.ts
//
// PURPOSE
//   Approval Hub Phase 1 — Stage 1c. Shift Override(ManagerOverrideRecord)를
//   실제 SQLite `shift_overrides` 테이블에 영속화하는 API. Step 0 확인 결과
//   이전까지는 localStorage에만 저장되고 서버 데이터소스가 전혀 없었다.
//
//   SiteManagerOverrideModal.tsx의 "Authorize Override"는 Site Manager가 직접
//   승인자로서 즉시 확정하는 흐름(approvedBy/approvedAt이 이미 채워진 채
//   onSave로 넘어옴)이라, 여기서 생성되는 행은 항상 approval_status=
//   'SITE_APPROVED'로 기록한다 — 별도 "대기 중 요청" 작성 경로는 없다.
//
//   MANPOWER_ROTATION_TRACKER는 6개 live-call-site 모듈(사전 확인 매트릭스)에
//   포함되지 않아 role_permissions 기본값이 전 역할 canCreate=0(READ_ONLY)이다.
//   기존 localStorage 전용 흐름은 애초에 이 모듈의 권한 체크를 거친 적이 없으므로,
//   여기서도 기존 화면 기능을 막지 않도록 로그인 세션 존재 여부만 요구하고
//   모듈별 canCreate는 검사하지 않는다(다른 12개 서버 라우트의 canCreate/canUpdate
//   패턴과 의도적으로 다른 지점 — Approval Hub 승인 액션 자체는 Stage 2c에서
//   SITE_MANAGER/ADMIN roleCode로 별도 게이팅한다).

import { NextRequest, NextResponse } from 'next/server';
import { getApprovalHubDb } from '../../../../../cmms-approval-hub/db/approvalHubDbSingleton';
import {
  insertShiftOverride,
  selectAllShiftOverrides,
  type NewShiftOverrideInput,
  type ShiftOverrideAssignedShift,
  type ShiftOverrideType,
} from '../../../../../adapters/db/shiftOverrideDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';

export const runtime = 'nodejs';

const VALID_OVERRIDE_TYPES: ShiftOverrideType[] = ['EXTEND_STAY_14D', 'FORCE_SHIFT'];
const VALID_ASSIGNED_SHIFTS: ShiftOverrideAssignedShift[] = ['D', 'N', 'R', 'OFF'];

interface ShiftOverrideCreateBody {
  staffId: string;
  targetDate: string;
  overrideType: ShiftOverrideType;
  assignedShift: ShiftOverrideAssignedShift;
  reason: string;
  approvedBy: string;
  approvedAt: string;
}

function isValidCreateBody(body: unknown): body is ShiftOverrideCreateBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.staffId === 'string' && r.staffId.length > 0 &&
    typeof r.targetDate === 'string' && r.targetDate.length > 0 &&
    typeof r.overrideType === 'string' && VALID_OVERRIDE_TYPES.includes(r.overrideType as ShiftOverrideType) &&
    typeof r.assignedShift === 'string' && VALID_ASSIGNED_SHIFTS.includes(r.assignedShift as ShiftOverrideAssignedShift) &&
    typeof r.reason === 'string' && r.reason.length > 0 &&
    typeof r.approvedBy === 'string' && r.approvedBy.length > 0 &&
    typeof r.approvedAt === 'string' && r.approvedAt.length > 0
  );
}

export async function GET() {
  const db = getApprovalHubDb();
  const records = selectAllShiftOverrides(db);
  return NextResponse.json({ success: true, records });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidCreateBody(body)) {
    return NextResponse.json({ success: false, error: 'Invalid shift override payload.' }, { status: 400 });
  }

  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const input: NewShiftOverrideInput = {
    staffId: body.staffId,
    targetDate: body.targetDate,
    overrideType: body.overrideType,
    assignedShift: body.assignedShift,
    reason: body.reason,
    requestedBy: session.employeeId,
    approvalStatus: 'SITE_APPROVED',
    approvedBy: body.approvedBy,
    approvedAt: body.approvedAt,
  };

  const db = getApprovalHubDb();
  const record = insertShiftOverride(db, input);
  return NextResponse.json({ success: true, record });
}
