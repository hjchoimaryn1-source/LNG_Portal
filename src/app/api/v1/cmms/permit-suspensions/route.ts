// src/app/api/v1/cmms/permit-suspensions/route.ts
//
// PURPOSE
//   CMMS_Architecture.md §5.3 AGT 4시간 타임아웃 / 시프트 교대 정지 상태 API.
//   GET은 on-demand 재평가 후 현재 활성 정지 집합을 반환한다(GET/POST
//   /ptw-permits와 동일 스냅샷 — 별도로 폴링하고 싶은 호출부를 위한 전용 엔드포인트).
//   PATCH는 Site Manager/HSSE의 시프트 인수인계 확인을 기록해 SHIFT_CHANGE
//   정지를 해제한다 — permitSuspensionAdapter.acknowledgeShiftHandover의
//   유일한 HTTP 진입점.

import { NextRequest, NextResponse } from 'next/server';
import { getActiveSuspensionsSnapshot } from '../../../../../adapters/permitPersistenceAdapter';
import { acknowledgeShiftHandover } from '../../../../../adapters/permitSuspensionAdapter';

export const runtime = 'nodejs';

export async function GET() {
  const suspensions = getActiveSuspensionsSnapshot();
  return NextResponse.json({ success: true, suspensions });
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const permitId = (body as Record<string, unknown> | null)?.permitId;
  if (typeof permitId !== 'string' || permitId.length === 0) {
    return NextResponse.json({ success: false, error: 'Missing required field: permitId' }, { status: 400 });
  }

  acknowledgeShiftHandover(permitId);
  const suspensions = getActiveSuspensionsSnapshot();
  return NextResponse.json({ success: true, suspensions });
}
