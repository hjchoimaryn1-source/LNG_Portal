// src/app/api/v1/cmms/user-security/personnel/route.ts
//
// PURPOSE
//   Stage 1C personnel_master CRUD. 모든 메서드는 세션 role_code==='ADMIN'을
//   서버에서 직접 재검증한다 — 클라이언트 탭 가드(Stage 1D)는 UX일 뿐 보안
//   경계가 아니다(지시 원문). 하드 삭제는 없다 — 퇴직은 PATCH의 resign
//   액션으로만 표현한다.

import { NextRequest, NextResponse } from 'next/server';
import { getUserSecurityDb } from '../../../../../../lib/rbac/userSecurityDbSingleton';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';
import {
  listPersonnel,
  createPersonnel,
  updatePersonnel,
  resignPersonnel,
  type CreatePersonnelInput,
  type UpdatePersonnelInput,
} from '../../../../../../lib/rbac/personnelMasterDao';

export const runtime = 'nodejs';

function requireAdmin(request: NextRequest) {
  const context = verifyUserSecuritySession(request);
  if (!context) return { context: null, error: NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 }) };
  if (context.roleCode !== 'ADMIN') {
    return { context: null, error: NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 }) };
  }
  return { context, error: null };
}

export async function GET(request: NextRequest) {
  const { context, error } = requireAdmin(request);
  if (!context) return error;

  const db = getUserSecurityDb();
  const departmentGroup = request.nextUrl.searchParams.get('departmentGroup') ?? undefined;
  const employmentStatus = request.nextUrl.searchParams.get('employmentStatus') ?? undefined;
  const records = listPersonnel(db, { departmentGroup, employmentStatus });
  return NextResponse.json({ success: true, records });
}

function isCreateInput(body: unknown): body is CreatePersonnelInput {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.employeeId === 'string' &&
    r.employeeId.length > 0 &&
    typeof r.fullName === 'string' &&
    r.fullName.length > 0 &&
    typeof r.positionTitle === 'string' &&
    r.positionTitle.length > 0 &&
    typeof r.departmentGroup === 'string' &&
    r.departmentGroup.length > 0
  );
}

export async function POST(request: NextRequest) {
  const { context, error } = requireAdmin(request);
  if (!context) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isCreateInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid personnel payload.' }, { status: 400 });
  }

  const db = getUserSecurityDb();
  createPersonnel(db, body, context.accountId);
  return NextResponse.json({ success: true });
}

interface PatchBody {
  employeeId: string;
  resign?: { resignationDate: string };
  update?: UpdatePersonnelInput;
}

function isPatchInput(body: unknown): body is PatchBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  if (typeof r.employeeId !== 'string' || r.employeeId.length === 0) return false;
  if (r.resign !== undefined) {
    const resign = r.resign as Record<string, unknown>;
    return typeof resign?.resignationDate === 'string' && resign.resignationDate.length > 0;
  }
  return r.update !== undefined && typeof r.update === 'object';
}

export async function PATCH(request: NextRequest) {
  const { context, error } = requireAdmin(request);
  if (!context) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isPatchInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid { employeeId, resign | update } payload.' }, { status: 400 });
  }

  const db = getUserSecurityDb();
  if (body.resign) {
    resignPersonnel(db, body.employeeId, body.resign.resignationDate, context.accountId);
  } else if (body.update) {
    updatePersonnel(db, body.employeeId, body.update, context.accountId);
  }
  return NextResponse.json({ success: true });
}
