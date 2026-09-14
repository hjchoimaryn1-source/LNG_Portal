// src/app/api/v1/cmms/work-orders/route.ts
//
// PURPOSE
//   WorkOrderListView가 SQLite work_orders 테이블을 조회/시딩/상태갱신하는 API.
//   src/app/api/v1/cmms/gas-tests/route.ts와 동일 구조 — 실제 도메인 로직은
//   src/adapters/workOrderDbAdapter.ts에 위임하고, 이 route는 입력 검증과
//   HTTP 응답 매핑만 담당한다.
//
//   category/priority/tech/permitRefNo 등 장식적 필드는 이 API의 관심사가
//   아니다(mockWorkOrderGenerator.ts가 클라이언트에서 파생) — 여기서는
//   work_orders 테이블 컬럼(WorkOrderRecord)만 주고받는다.

import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkOrderRecords, seedWorkOrdersIfEmpty, markWorkOrderPerformed } from '../../../../../adapters/workOrderDbAdapter';
import type { NewWorkOrderInput, WorkOrderStatus } from '../../../../../adapters/db/workOrderDao';
import {
  evaluateSafetyGateRules,
  EMPTY_SAFETY_GATE_INPUT,
  type SafetyGateWorkOrderInput,
} from '../../../../../cmms-mro-bridge/safetyGate/evaluateSafetyGateRules';

export const runtime = 'nodejs';

const VALID_STATUSES: WorkOrderStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'PARTS_PENDING', 'COMPLETED'];

/**
 * Phase10 Stage1C hook: work order 생성(seed) 시점에만 evaluateSafetyGateRules()를
 * 호출해 is_ptw_required를 세팅한다. 오늘의 유일한 호출부(useWorkOrders.ts ->
 * toNewWorkOrderInput)는 jobCategories/workAreaZone/equipmentCriticality를 아직
 * 채워 보내지 않으므로(WOItem에 그런 필드가 없음 — Stage 0 Task 2 확인), 그 경우
 * safetyGateInput 생략 시 EMPTY_SAFETY_GATE_INPUT으로 평가되어 항상 false가 된다.
 * 이 값을 실제로 채워 보내는 호출부가 생기면 그대로 판정에 반영된다. PTW
 * 상태전이/승인 라우트는 이 파일과 무관하며 미변경이다.
 */
type SeedInputWithSafetyGate = NewWorkOrderInput & { safetyGateInput?: Partial<SafetyGateWorkOrderInput> };

function isValidSeedInput(body: unknown): body is SeedInputWithSafetyGate[] {
  if (!Array.isArray(body)) return false;
  return body.every((d) => {
    if (!d || typeof d !== 'object') return false;
    const r = d as Record<string, unknown>;
    return typeof r.workOrderId === 'string' && r.workOrderId.length > 0 &&
      typeof r.assetTag === 'string' && r.assetTag.length > 0 &&
      typeof r.title === 'string';
  });
}

function applySafetyGate(items: SeedInputWithSafetyGate[]): NewWorkOrderInput[] {
  return items.map(({ safetyGateInput, ...item }) => {
    const gateResult = evaluateSafetyGateRules({ ...EMPTY_SAFETY_GATE_INPUT, ...safetyGateInput });
    return { ...item, isPtwRequired: gateResult.isPtwRequired };
  });
}

function isValidPerformanceUpdate(body: unknown): body is { workOrderId: string; lastPerformedAt: string; status?: WorkOrderStatus } {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.workOrderId === 'string' && r.workOrderId.length > 0 &&
    typeof r.lastPerformedAt === 'string' && r.lastPerformedAt.length > 0 &&
    (r.status === undefined || VALID_STATUSES.includes(r.status as WorkOrderStatus));
}

export async function GET() {
  const records = getAllWorkOrderRecords();
  return NextResponse.json({ success: true, records });
}

/** DB가 비어있을 때만 폴백 목업 WO를 시딩한다(멱등 — 이미 데이터가 있으면 no-op). */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidSeedInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid NewWorkOrderInput[] payload.' }, { status: 400 });
  }

  const records = seedWorkOrdersIfEmpty(applySafetyGate(body));
  return NextResponse.json({ success: true, records });
}

/** WO 수행 완료(또는 지정 상태) 기록 — next_due_date는 DAO가 재계산한다. */
export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidPerformanceUpdate(body)) {
    return NextResponse.json({ success: false, error: 'Invalid performance update payload.' }, { status: 400 });
  }

  const record = markWorkOrderPerformed(body.workOrderId, body.lastPerformedAt, body.status);
  if (!record) {
    return NextResponse.json({ success: false, error: `Work order not found: ${body.workOrderId}` }, { status: 404 });
  }
  return NextResponse.json({ success: true, record });
}
