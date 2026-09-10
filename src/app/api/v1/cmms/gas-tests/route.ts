// src/app/api/v1/cmms/gas-tests/route.ts
//
// PURPOSE
//   AGT(Authorized Gas Tester) 가스 재측정 기록(GasTestRecordDraft)을 서버
//   프로세스 메모리에 영속화하는 API. gasSafetyAdapter.ts의 in-memory store를
//   클라이언트 번들이 아닌 이 Node 서버 프로세스에서 유지시켜, 브라우저
//   새로고침에도 감사 기록이 살아남도록 한다 (서버 프로세스 재시작까지).
//
//   ⚠ 이 API는 감사 기록 저장/조회 전용이다. PASS/FAIL 게이트 판정
//   (validatePTWGasSafety)은 여전히 client-side SSOT를 그대로 사용하며 여기서
//   재구현하지 않는다 — 클라이언트가 toGasTestRecordDraft()로 이미 계산한
//   GasTestRecordDraft를 그대로 신뢰하고 저장만 한다.

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

  recordGasTestDraft(body);
  return NextResponse.json({ success: true, record: body });
}

export async function GET(request: NextRequest) {
  const permitId = request.nextUrl.searchParams.get('permitId');
  const records = permitId ? getGasTestRecordsForPermit(permitId) : getAllGasTestRecords();
  return NextResponse.json({ success: true, records });
}
