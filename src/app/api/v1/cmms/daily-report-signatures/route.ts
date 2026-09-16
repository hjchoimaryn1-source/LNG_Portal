// src/app/api/v1/cmms/daily-report-signatures/route.ts
//
// PURPOSE
//   SignatureBlock.tsx(Stage C2)의 조회/서명 저장 API. 지시("Once both
//   roles signed, call finalizeSnapshot() from C1")에 따라, prepared_by +
//   acknowledged_by 두 역할이 모두 저장된 시점에 이 라우트가 서버에서
//   직접 finalizeSnapshot()을 호출한다 — 'use client' 컴포넌트는 C1 DAO를
//   임포트할 수 없어(node:sqlite 경계) 클라이언트가 오케스트레이션할 수 없다.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import {
  upsertSignature,
  listSignatures,
  type SignatureRole,
} from '../../../../../cmms-daily-ops/dao/dailyReportChildDao';
import { finalizeSnapshot } from '../../../../../cmms-daily-ops/dao/dailyReportSnapshotDao';
import { getEffectivePermission } from '../../../../../lib/rbac/rolePermissionService';
import type { RoleCode } from '../../../../../types/rbac';

export const runtime = 'nodejs';

const VALID_ROLES: SignatureRole[] = ['prepared_by', 'acknowledged_by'];

// RBAC audit remediation — Phase 13 follow-up, 2026-09-16 (split by signature type).
interface SignaturePayload {
  snapshotId: number;
  role: SignatureRole;
  signerName: string;
  signerTitle: string | null;
  roleCode: RoleCode;
}

function isValidPayload(body: unknown): body is SignaturePayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.snapshotId === 'number' &&
    typeof r.role === 'string' &&
    VALID_ROLES.includes(r.role as SignatureRole) &&
    typeof r.signerName === 'string' &&
    typeof r.roleCode === 'string'
  );
}

/**
 * prepared_by reuses the DAILY_OPS_REPORT.canCreate allow-list (same as the
 * sibling child editors). acknowledged_by is an approval-adjacent action —
 * SITE_MANAGER has canCreate:false on this module (report generation is not
 * their job) but canApprove:true, which is exactly the semantics an
 * "acknowledgement" needs. No new moduleCode/field required.
 */
function isPermitted(roleCode: RoleCode, signatureRole: SignatureRole): boolean {
  const permission = getEffectivePermission(roleCode, 'DAILY_OPS_REPORT');
  if (!permission) return false;
  return signatureRole === 'prepared_by' ? permission.canCreate : permission.canApprove;
}

export async function GET(request: NextRequest) {
  const snapshotId = Number(request.nextUrl.searchParams.get('snapshotId'));
  if (!snapshotId) {
    return NextResponse.json({ success: false, error: 'snapshotId required.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  return NextResponse.json({ success: true, records: listSignatures(db, snapshotId) });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'Invalid signature payload.' }, { status: 400 });
  }
  if (!isPermitted(body.roleCode, body.role)) {
    return NextResponse.json(
      { success: false, error: `Role ${body.roleCode} is not permitted to sign as ${body.role}.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  upsertSignature(db, body.snapshotId, body.role, body.signerName, body.signerTitle ?? null);

  const signatures = listSignatures(db, body.snapshotId);
  const roles = new Set(signatures.map((s) => s.role));
  const bothSigned = VALID_ROLES.every((role) => roles.has(role));
  if (bothSigned) {
    finalizeSnapshot(db, body.snapshotId);
  }

  return NextResponse.json({ success: true, records: signatures, finalized: bothSigned });
}
