// src/app/api/v1/cmms/monthly-report/floboss/route.ts
//
// PURPOSE
//   Client/server boundary for Floboss P1-P4 daily rows (gas_metering_ledger_daily,
//   GC_REPORT source). Read-only — ingestion happens via gasMeteringLedgerDailyRunner.ts,
//   not this route.
//
//   GET ?month=YYYY-MM -> Floboss daily rows for that report month.

import { NextRequest, NextResponse } from 'next/server';
import { getGasMeteringDb } from '../../../../../../gas-metering/db/gasMeteringDbSingleton';
import { getFlobossLedgerForMonth } from '../../../../../../gas-metering/dao/gasMeteringLedgerDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  const db = getGasMeteringDb();
  const records = getFlobossLedgerForMonth(db, month);
  return NextResponse.json({ success: true, records });
}
