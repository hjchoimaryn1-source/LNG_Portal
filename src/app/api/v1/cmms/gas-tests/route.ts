// src/app/api/v1/cmms/gas-tests/route.ts
//
// PURPOSE
//   AGT(Authorized Gas Tester) 가스 재측정 기록(GasTestRecordDraft)을 실제
//   SQLite `permit_gas_tests` 테이블에 영속화하는 API. 2026-09-10부터
//   gasSafetyAdapter.ts가 in-memory array 대신 src/adapters/db/gasTestDao.ts
//   (SqlExecutor 기반)를 통해 서버 재시작에도 살아남는 기록을 저장/조회한다
//   (스키마: schema/cmms_schema.sqlite.sql, src/db/schema/cmms_schema.sql).
//
//   ⚠ 이 API는 여전히 감사 기록 저장/조회 전용이다. PTW PASS/FAIL 게이트
//     판정의 유일한 권위 있는 소스(SSOT)는 client-side validatePTWGasSafety이며,
//     이 route는 그 판정을 재구현/재검증하지 않는다 — 클라이언트가
//     toGasTestRecordDraft() 내부에서 validatePTWGasSafety를 통해 이미 계산한
//     GasTestRecordDraft를 그대로 신뢰하고 저장만 한다. 이 API의 응답 여부/
//     지연/실패는 PTW 게이트 통과 여부에 어떠한 영향도 주지 않는다.
//   - 게이트의 async DB-backed 재검증(재조회 후 재판정)은 여전히 별도
//     결정 없이 이 route에 암묵적으로 추가하지 말 것.

import { NextRequest, NextResponse } from 'next/server';
import { recordGasTestDraft, getGasTestRecordsForPermit, getAllGasTestRecords } from '../../../../../adapters/gasSafetyAdapter';
import type { GasTestRecordDraft } from '../../../../../adapters/ptwFormAdapter';

export const runtime = 'nodejs';

function isValidDraft(body: unknown): body is GasTestRecordDraft {
  if (!body || typeof body !== 'object') return false;
  const d = body as Record<string, unknown>;
  return (
    typeof d.permitRefNo === 'string' && d.permitRefNo.length > 0 &&
    typeof d.testType === 'string' &&
    typeof d.lelPercent === 'number' &&
    typeof d.o2Percent === 'number' &&
    typeof d.h2sPpm === 'number' &&
    typeof d.coPpm === 'number' &&
    (d.resultStatus === 'PASS' || d.resultStatus === 'FAIL') &&
    (d.blockReason === null || typeof d.blockReason === 'string') &&
    typeof d.testedByAgt === 'string' &&
    typeof d.agtSignature === 'string' && d.agtSignature.trim().length > 0 &&
    typeof d.testedAt === 'string'
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidDraft(body)) {
    return NextResponse.json({ success: false, error: 'Invalid GasTestRecordDraft payload.' }, { status: 400 });
  }

  // Audit-only write — persisted to SQLite permit_gas_tests, non-authoritative
  // for the gate (see file header). Does not re-run validatePTWGasSafety;
  // body.resultStatus is trusted as-is.
  recordGasTestDraft(body);
  return NextResponse.json({ success: true, record: body });
}

export async function GET(request: NextRequest) {
  // Audit-only read — for display (e.g. PTWGasSafetyGate history panel), not
  // for gate decisions. Nothing in this codebase should call this GET to
  // decide PASS/FAIL; that stays client-side via validatePTWGasSafety.
  const permitId = request.nextUrl.searchParams.get('permitId');
  const records = permitId ? getGasTestRecordsForPermit(permitId) : getAllGasTestRecords();
  return NextResponse.json({ success: true, records });
}
