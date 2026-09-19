// src/app/api/v1/cmms/mro-inventory/adjustments/route.ts
//
// PURPOSE
//   부품 입출고/조정(RECEIPT/ISSUE/ADJUSTMENT/RETURN) 기록 및 이력 조회 API.
//   실제 쓰기는 src/adapters/db/mroInventoryDao.ts의 adjustPartStock()이
//   유일하게 수행한다(재고 갱신 + 트랜잭션 로그가 항상 함께 일어남을 보장).

import { NextRequest, NextResponse } from 'next/server';
import { adjustStock, getStockTransactions } from '../../../../../../adapters/mroInventoryDbAdapter';
import type { StockAdjustmentInput, StockTxType } from '../../../../../../adapters/db/mroInventoryDao';
import { verifyUserSecuritySession } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../../lib/rbac/sessionPermissionResolver';

export const runtime = 'nodejs';

const VALID_TX_TYPES: StockTxType[] = ['RECEIPT', 'ISSUE', 'ADJUSTMENT', 'RETURN', 'SCRAP'];

// RBAC audit remediation — Phase 13 follow-up, 2026-09-16. roleCode is no
// longer read from the body (Stage 3, 2026-09-19) — the Stage 1B session is
// the sole authorization source now that the client login has been replaced.
function isValidAdjustmentInput(body: unknown): body is StockAdjustmentInput {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.partNo === 'string' && r.partNo.length > 0 &&
    typeof r.txType === 'string' && VALID_TX_TYPES.includes(r.txType as StockTxType) &&
    typeof r.quantity === 'number' && r.quantity > 0 &&
    typeof r.performedBy === 'string' && r.performedBy.length > 0 &&
    (r.reason === undefined || r.reason === null || typeof r.reason === 'string') &&
    (r.workOrderId === undefined || r.workOrderId === null || typeof r.workOrderId === 'string');
}

export async function GET(request: NextRequest) {
  const partNo = request.nextUrl.searchParams.get('partNo') ?? undefined;
  const transactions = getStockTransactions(partNo);
  return NextResponse.json({ success: true, transactions });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidAdjustmentInput(body)) {
    return NextResponse.json({ success: false, error: 'Invalid StockAdjustmentInput payload.' }, { status: 400 });
  }
  // Stage 3 (HJ decision 2026-09-19): full replacement of the PIN-login
  // fallback — a valid Stage 1B session is now required.
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (resolveSessionPermission(session.employeeId, 'MAINTENANCE_MRO_HUB')?.canCreate !== true) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not permitted to adjust MRO stock.` },
      { status: 403 }
    );
  }

  const result = adjustStock(body);
  if (!result) {
    return NextResponse.json(
      { success: false, error: `Adjustment rejected: part not found or resulting stock would be negative (partNo=${body.partNo}).` },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, part: result.part, transaction: result.transaction, generatedPr: result.generatedPr });
}
