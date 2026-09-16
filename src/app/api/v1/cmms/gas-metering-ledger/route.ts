// src/app/api/v1/cmms/gas-metering-ledger/route.ts
//
// PURPOSE
//   Client/server boundary for gas_metering_ledger_daily (gasMeteringLedgerDao.ts
//   imports node:sqlite indirectly, can't be called from 'use client' components
//   — same reason as daily-ops-patrol-entries/route.ts).
//
//   GET                  -> recent daily ledger rows (GasMeteringDailyTab)
//   GET + ?snapshot=1     -> latest composition + meter-stream GHV
//                            (SettlementAuditView's weathering comparison,
//                            replaces the old client-side CSV fetch)
//   Read-only — no POST. Ingestion happens via
//   src/db/migrations/gasMeteringLedgerDailyRunner.ts (Stage 1), not this route.

import { NextRequest, NextResponse } from 'next/server';
import { getGasMeteringDb } from '../../../../../gas-metering/db/gasMeteringDbSingleton';
import { getRecentGasMeteringLedger, getLatestGasMeteringSnapshot } from '../../../../../gas-metering/dao/gasMeteringLedgerDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const db = getGasMeteringDb();

  if (params.get('snapshot') === '1') {
    const snapshot = getLatestGasMeteringSnapshot(db);
    return NextResponse.json({ success: true, snapshot });
  }

  const limitParam = Number(params.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 60;
  const records = getRecentGasMeteringLedger(db, limit);
  return NextResponse.json({ success: true, records });
}
