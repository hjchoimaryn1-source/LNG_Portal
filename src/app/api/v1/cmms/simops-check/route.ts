// src/app/api/v1/cmms/simops-check/route.ts
//
// PURPOSE
//   CMMS_Architecture.md §5.2 SIMOPS 간섭 판정의 DB-backed 조회 API.
//   src/adapters/simopsDbAdapter.ts에 위임 — 이 route는 쿼리 파라미터 검증과
//   HTTP 응답 매핑만 담당한다.
//
//   ⚠ 이 API는 useNewPTWPermitForm.ts의 기존 client-side dry-run 제출 게이트를
//     대체하지 않는다. 그 게이트는 오프라인 허용/즉시성 우선의 1차 UX 안전장치로
//     그대로 유지되며, 이 API는 실제 DB 전체를 조회하는 별도의 권위 있는 2차 소스다.

import { NextRequest, NextResponse } from 'next/server';
import { evaluateSimopsInterferenceDb } from '../../../../../adapters/simopsDbAdapter';
import type { PTWType } from '../../../../../types/lng';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get('type');
  const workArea = params.get('workArea') ?? '';
  const equipmentTag = params.get('equipmentTag') ?? '';

  if (!type) {
    return NextResponse.json({ success: false, error: 'Missing required query param: type' }, { status: 400 });
  }

  const result = evaluateSimopsInterferenceDb(type as PTWType, workArea, equipmentTag);
  return NextResponse.json({ success: true, result });
}
