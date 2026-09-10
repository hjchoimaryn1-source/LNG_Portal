// src/app/api/v1/cmms/ptw-signatures/route.ts
//
// PURPOSE
//   전자 서명 로그(SSHQE §4.2 PART C/D/E, PTWSignatureEntry)를 실제 SQLite
//   `ptw_signatures` 테이블에 영속화하는 API. gas-tests/route.ts와 동일 구조.
//
//   ⚠ 서명 완결성 게이트(evaluateSignatureGate)의 SSOT는 여전히 client-side
//     usePTWPermits.addSignature/transitionStatus다. 이 API는 감사 기록
//     저장/조회 전용이며 게이트 판정에 관여하지 않는다.

import { NextRequest, NextResponse } from 'next/server';
import { persistPermitSignature, getPermitSignatures } from '../../../../../adapters/permitPersistenceAdapter';
import type { PTWSignatureEntry, PTWSignatureRole } from '../../../../../types/lng';

export const runtime = 'nodejs';

function isValidSignaturePost(body: unknown): body is { permitId: string } & PTWSignatureEntry {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.permitId === 'string' && r.permitId.length > 0 &&
    typeof r.role === 'string' && (r.role as string).length > 0 &&
    typeof r.staffId === 'string' && r.staffId.length > 0 &&
    typeof r.staffName === 'string' && r.staffName.length > 0 &&
    typeof r.signedAt === 'string' && r.signedAt.length > 0;
}

export async function GET(request: NextRequest) {
  const permitId = request.nextUrl.searchParams.get('permitId');
  if (!permitId) {
    return NextResponse.json({ success: false, error: 'permitId query param is required.' }, { status: 400 });
  }
  const records = getPermitSignatures(permitId);
  return NextResponse.json({ success: true, records });
}

/** 서명 1건 기록. 동일 permitId+role 재요청은 DAO의 UNIQUE 제약으로 조용히 무시되고, 저장된 최신 목록을 응답한다. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidSignaturePost(body)) {
    return NextResponse.json({ success: false, error: 'Invalid signature payload.' }, { status: 400 });
  }

  const { permitId, ...entry } = body;
  persistPermitSignature(permitId, { ...entry, role: entry.role as PTWSignatureRole });
  const records = getPermitSignatures(permitId);
  return NextResponse.json({ success: true, records });
}
