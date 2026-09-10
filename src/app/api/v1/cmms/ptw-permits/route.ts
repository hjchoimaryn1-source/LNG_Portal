// src/app/api/v1/cmms/ptw-permits/route.ts
//
// PURPOSE
//   PTW permit lifecycle(status/closedAt/safetyChecklist 스냅샷)을 실제
//   SQLite `ptw_permits` 테이블에 영속화하는 API. gas-tests/work-orders
//   route.ts와 동일 구조 — 도메인 로직은 permitPersistenceAdapter.ts에
//   위임하고, 이 route는 입력 검증과 HTTP 응답 매핑만 담당한다.
//
//   ⚠ 상태 전이 게이트(서명 완결성/O2/LEL/ERT 등)의 SSOT는 여전히
//     client-side usePTWPermits.transitionStatus다. 이 API는 그 판정을
//     재검증하지 않고 이미 통과된 결과만 저장한다.

import { NextRequest, NextResponse } from 'next/server';
import {
  seedPermitLifecycleIfAbsent,
  persistPermitStatus,
  getAllPermitLifecycleWithSignatures,
} from '../../../../../adapters/permitPersistenceAdapter';
import type { PTWPermitLifecycleDraft } from '../../../../../adapters/db/ptwPermitDao';

export const runtime = 'nodejs';

const VALID_STATUSES: PTWPermitLifecycleDraft['status'][] = ['DRAFT', 'PREPARED', 'APPROVED', 'ACTIVE', 'CLOSED'];

function isValidSeedInput(body: unknown): body is PTWPermitLifecycleDraft[] {
  if (!Array.isArray(body)) return false;
  return body.every((d) => {
    if (!d || typeof d !== 'object') return false;
    const r = d as Record<string, unknown>;
    return typeof r.permitId === 'string' && r.permitId.length > 0 &&
      typeof r.status === 'string' && VALID_STATUSES.includes(r.status as PTWPermitLifecycleDraft['status']) &&
      typeof r.fireWatchAssigned === 'boolean' &&
      typeof r.gasDetectorContinuous === 'boolean' &&
      typeof r.lotoApplied === 'boolean' &&
      typeof r.forcedVentilation === 'boolean' &&
      typeof r.ppeVerified === 'boolean' &&
      typeof r.barricadeSet === 'boolean' &&
      (r.workingAtHeight === null || typeof r.workingAtHeight === 'boolean') &&
      (r.closedAt === null || typeof r.closedAt === 'string');
  });
}

function isValidStatusUpdate(body: unknown): body is { permitId: string; status: PTWPermitLifecycleDraft['status']; closedAt: string | null } {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.permitId === 'string' && r.permitId.length > 0 &&
    typeof r.status === 'string' && VALID_STATUSES.includes(r.status as PTWPermitLifecycleDraft['status']) &&
    (r.closedAt === null || typeof r.closedAt === 'string');
}

export async function GET() {
  const { lifecycle, signaturesByPermit } = getAllPermitLifecycleWithSignatures();
  return NextResponse.json({
    success: true,
    records: lifecycle,
    signaturesByPermit: Object.fromEntries(signaturesByPermit),
  });
}

/** DB에 없는 permit_id만 시딩한다 — 이미 존재하는 행은 건드리지 않는다(멱등). */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidSeedInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid PTWPermitLifecycleDraft[] payload.' }, { status: 400 });
  }

  body.forEach(seedPermitLifecycleIfAbsent);
  const { lifecycle, signaturesByPermit } = getAllPermitLifecycleWithSignatures();
  return NextResponse.json({
    success: true,
    records: lifecycle,
    signaturesByPermit: Object.fromEntries(signaturesByPermit),
  });
}

/** 상태 전이(usePTWPermits.transitionStatus) 결과 반영 — safetyChecklist는 불변이라 갱신 대상이 아니다. */
export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidStatusUpdate(body)) {
    return NextResponse.json({ success: false, error: 'Invalid status update payload.' }, { status: 400 });
  }

  const record = persistPermitStatus(body.permitId, body.status, body.closedAt);
  if (!record) {
    return NextResponse.json({ success: false, error: `Permit lifecycle row not found: ${body.permitId}` }, { status: 404 });
  }
  return NextResponse.json({ success: true, record });
}
