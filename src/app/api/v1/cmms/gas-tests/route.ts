// src/app/api/v1/cmms/gas-tests/route.ts
//
// PURPOSE
//   AGT(Authorized Gas Tester) 가스 재측정 기록(GasTestRecordDraft)을 서버
//   프로세스 메모리에 보관하는 API. gasSafetyAdapter.ts의 in-memory store를
//   클라이언트 번들이 아닌 이 Node 서버 프로세스에서 유지시켜, 브라우저
//   새로고침에는 감사 기록이 살아남도록 한다.
//
//   ⚠⚠⚠ AUDIT-ONLY — NOT THE SAFETY GATE, NOT REAL DB PERSISTENCE ⚠⚠⚠
//   - 이 API가 호출하는 gasSafetyAdapter.ts의 저장소는 여전히 plain in-memory
//     array(`gasTestRecordStore: GasTestRecordDraft[]`)다. SqlExecutor/db.run()을
//     전혀 거치지 않으며, 실 SQLite `permit_gas_tests` 테이블도 실제 런타임
//     스키마(schema/cmms_schema.sqlite.sql)에 아직 존재하지 않는다(설계 문서
//     CMMS_Architecture.md §2.4에만 정의되어 있음). 즉 이 API가 지키는 값은
//     "Node 서버 프로세스가 살아있는 동안만" 유효하며, 서버 재시작 시 소멸한다.
//   - 이 API는 감사 기록 저장/조회 전용이다. PTW PASS/FAIL 게이트 판정의
//     유일한 권위 있는 소스(SSOT)는 여전히 client-side validatePTWGasSafety이며,
//     이 route는 그 판정을 재구현/재검증하지 않는다 — 클라이언트가
//     toGasTestRecordDraft() 내부에서 validatePTWGasSafety를 통해 이미 계산한
//     GasTestRecordDraft를 그대로 신뢰하고 저장만 한다. 이 API의 응답 여부/
//     지연/실패는 PTW 게이트 통과 여부에 어떠한 영향도 주지 않는다.
//   - 실제 permit_gas_tests 테이블 연동(Option A) 또는 게이트의 async
//     DB-backed 재검증(Option 2)이 필요해지면 별도 작업으로 명시적으로
//     결정한 뒤 진행한다 — 이 파일을 조용히 "실제 연동됨"으로 취급하지 말 것.

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

  // Audit-only write — in-memory, non-authoritative (see file header). Does
  // not re-run validatePTWGasSafety; body.resultStatus is trusted as-is.
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
