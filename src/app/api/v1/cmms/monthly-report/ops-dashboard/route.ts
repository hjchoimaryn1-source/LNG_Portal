// src/app/api/v1/cmms/monthly-report/ops-dashboard/route.ts
//
// PURPOSE
//   Client/server boundary for Monthly Report Ops. dashboard's Metering A/B
//   block — read-only, no new table (see opsDashboardDao.ts). ISO Tank
//   Unloading/logistics sub-block deferred (see DAO file header).
//
//   GET ?month=YYYY-MM -> Ops. Metering A/B day rows + derived summary.

import { NextRequest, NextResponse } from 'next/server';
import { getGasMeteringDb } from '../../../../../../gas-metering/db/gasMeteringDbSingleton';
import { getOpsMeteringDaysForMonth, getOpsMeteringSummaryForMonth } from '../../../../../../cmms-monthly-report/dao/opsDashboardDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  const db = getGasMeteringDb();
  const days = getOpsMeteringDaysForMonth(db, month);
  const summary = getOpsMeteringSummaryForMonth(days);
  return NextResponse.json({ success: true, days, summary });
}
