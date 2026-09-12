// src/app/api/v1/cmms/permit-metadata/route.ts
//
// PURPOSE
//   permit 생성 시점의 type/work_area/equipment_tag 스냅샷을 실제 SQLite
//   `permit_metadata` 테이블에 영속화하는 API (CMMS_Architecture.md §5.2 SIMOPS
//   DB 판정용 후보 집합 소스). ptw-permits/gas-tests route.ts와 동일 구조 —
//   도메인 로직은 permitPersistenceAdapter.ts에 위임한다.
//
//   ⚠ 이 API는 permit_metadata를 저장만 한다. SIMOPS 판정 자체는
//     src/adapters/simopsDbAdapter.ts / /api/v1/cmms/simops-check가 담당한다.

import { NextRequest, NextResponse } from 'next/server';
import { seedPermitMetadataIfAbsent } from '../../../../../adapters/permitPersistenceAdapter';

export const runtime = 'nodejs';

interface PermitMetadataBody {
  permitId: string;
  ptwType: string;
  workArea: string;
  equipmentTag: string;
}

function isValidBody(body: unknown): body is PermitMetadataBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.permitId === 'string' && r.permitId.length > 0 &&
    typeof r.ptwType === 'string' && r.ptwType.length > 0 &&
    typeof r.workArea === 'string' &&
    typeof r.equipmentTag === 'string'
  );
}

/** 이미 존재하는 permit_ref_no는 건드리지 않는다(멱등) — 생성 시점 1회 시딩 전용. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ success: false, error: 'Invalid permit metadata payload.' }, { status: 400 });
  }

  seedPermitMetadataIfAbsent(body.permitId, body.ptwType, body.workArea, body.equipmentTag);
  return NextResponse.json({ success: true });
}
