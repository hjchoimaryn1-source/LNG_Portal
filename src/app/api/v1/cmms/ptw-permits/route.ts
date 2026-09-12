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
  applyPermitUpdateWithConflictCheck,
  getAllPermitLifecycleWithSignatures,
  getActiveSuspensionsSnapshot,
  type PermitLifecycleLocalChanges,
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

const LOCAL_CHANGE_BOOLEAN_KEYS = ['lotoApplied', 'gasDetectorContinuous', 'ppeVerified', 'barricadeSet', 'forcedVentilation'] as const;

interface StatusUpdateBody {
  permitId: string;
  status: PTWPermitLifecycleDraft['status'];
  closedAt: string | null;
  /** permit_lock_state.payload_hash 베이스라인 — 생략 시 잠금 검증 없이 기존처럼 적용된다(하위호환). */
  baseVersion?: string;
  /** status/closedAt 외에 함께 반영할 안전 체크리스트 필드만 담는다(§5.5 동기화 충돌 판정 대상). */
  localChanges?: PermitLifecycleLocalChanges;
}

function isValidLocalChanges(value: unknown): value is PermitLifecycleLocalChanges {
  if (typeof value !== 'object' || value === null) return false;
  const lc = value as Record<string, unknown>;
  for (const key of LOCAL_CHANGE_BOOLEAN_KEYS) {
    if (key in lc && typeof lc[key] !== 'boolean') return false;
  }
  if ('workingAtHeight' in lc && lc.workingAtHeight !== null && typeof lc.workingAtHeight !== 'boolean') return false;
  return true;
}

function isValidStatusUpdate(body: unknown): body is StatusUpdateBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  const baseOk = typeof r.permitId === 'string' && r.permitId.length > 0 &&
    typeof r.status === 'string' && VALID_STATUSES.includes(r.status as PTWPermitLifecycleDraft['status']) &&
    (r.closedAt === null || typeof r.closedAt === 'string');
  if (!baseOk) return false;
  if (r.baseVersion !== undefined && typeof r.baseVersion !== 'string') return false;
  if (r.localChanges !== undefined && !isValidLocalChanges(r.localChanges)) return false;
  return true;
}

export async function GET() {
  const { lifecycle, signaturesByPermit } = getAllPermitLifecycleWithSignatures();
  // §5.3 정지 상태를 이 조회 시점 기준으로 재평가한다 — on-demand 엔진의 읽기 경로 진입점.
  const suspensions = getActiveSuspensionsSnapshot();
  return NextResponse.json({
    success: true,
    records: lifecycle,
    signaturesByPermit: Object.fromEntries(signaturesByPermit),
    suspensions,
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
  const suspensions = getActiveSuspensionsSnapshot();
  return NextResponse.json({
    success: true,
    records: lifecycle,
    signaturesByPermit: Object.fromEntries(signaturesByPermit),
    suspensions,
  });
}

/**
 * 상태 전이(usePTWPermits.transitionStatus) 결과 반영.
 * baseVersion/localChanges를 함께 보내면 §5.5 낙관적 잠금 + 동기화 충돌 감지를
 * 거친다 — 안전 필수 필드(LOTO/가스감지/승인단계) 충돌 시 적용을 보류하고
 * permit_sync_conflicts에 기록한다(409). 두 필드를 생략하는 기존 호출부는
 * 잠금 검증 없이 기존과 동일하게 적용된다.
 */
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

  const result = applyPermitUpdateWithConflictCheck({
    permitId: body.permitId,
    status: body.status,
    closedAt: body.closedAt,
    baseVersion: body.baseVersion,
    localChanges: body.localChanges,
  });

  if (result.outcome === 'NOT_FOUND') {
    return NextResponse.json({ success: false, error: `Permit lifecycle row not found: ${body.permitId}` }, { status: 404 });
  }
  if (result.outcome === 'REQUIRES_SITE_MANAGER_REVIEW') {
    return NextResponse.json(
      { success: false, error: result.message, status: result.outcome, conflictId: result.conflict.conflictId },
      { status: 409 }
    );
  }
  return NextResponse.json({ success: true, record: result.record, syncOutcome: result.outcome });
}
