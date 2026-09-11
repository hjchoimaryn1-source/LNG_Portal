// src/app/api/v1/cmms/mro-inventory/requisitions/route.ts
//
// PURPOSE
//   저재고 자동 발행 구매요청(PR) 목록 조회 API. 발행 자체는 이 route가 아닌
//   ./adjustments/route.ts -> mroInventoryDbAdapter.adjustStock()이 트리거한다
//   (여기서는 읽기 전용).

import { NextResponse } from 'next/server';
import { getAllRequisitions } from '../../../../../../adapters/purchaseRequisitionDbAdapter';

export const runtime = 'nodejs';

export async function GET() {
  const requisitions = getAllRequisitions();
  return NextResponse.json({ success: true, requisitions });
}
