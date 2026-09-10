// src/app/api/v1/cmms/mro-inventory/route.ts
//
// PURPOSE
//   MroInventoryView가 SQLite mro_parts 테이블을 조회/시딩하는 API.
//   src/app/api/v1/cmms/work-orders/route.ts와 동일 구조 — 실제 도메인 로직은
//   src/adapters/mroInventoryDbAdapter.ts에 위임한다.
//   입출고/조정 쓰기는 이 route가 아닌 ./adjustments/route.ts 소관.

import { NextRequest, NextResponse } from 'next/server';
import { getAllParts, seedPartsIfEmpty } from '../../../../../adapters/mroInventoryDbAdapter';
import type { NewMroPartInput } from '../../../../../adapters/db/mroInventoryDao';

export const runtime = 'nodejs';

function isValidSeedInput(body: unknown): body is NewMroPartInput[] {
  if (!Array.isArray(body)) return false;
  return body.every((d) => {
    if (!d || typeof d !== 'object') return false;
    const r = d as Record<string, unknown>;
    return typeof r.partNo === 'string' && r.partNo.length > 0 &&
      typeof r.partName === 'string' && r.partName.length > 0 &&
      typeof r.uom === 'string' && r.uom.length > 0;
  });
}

export async function GET() {
  const parts = getAllParts();
  return NextResponse.json({ success: true, parts });
}

/** DB가 비어있을 때만 폴백 목업 부품을 시딩한다(멱등 — 이미 데이터가 있으면 no-op). */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidSeedInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid NewMroPartInput[] payload.' }, { status: 400 });
  }

  const parts = seedPartsIfEmpty(body);
  return NextResponse.json({ success: true, parts });
}
