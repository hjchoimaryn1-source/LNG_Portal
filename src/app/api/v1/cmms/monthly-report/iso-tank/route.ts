// src/app/api/v1/cmms/monthly-report/iso-tank/route.ts
//
// PURPOSE
//   Client/server boundary for the two ISO Tank monthly-report tables.
//   Read-only — seeded via monthlyReportSeedRunner.ts. HJ-confirmed: the
//   two sources' tank rosters are NOT reconciled (ISOT-064 present only
//   in `kind=daily`).
//
//   GET ?month=YYYY-MM&kind=daily       -> iso_tank_daily_readings rows
//   GET ?month=YYYY-MM&kind=consumption -> iso_tank_consumption_monthly rows

import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyReportDb } from '../../../../../../cmms-monthly-report/db/monthlyReportDbSingleton';
import { getIsoTankDailyReadingsForMonth } from '../../../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import { getIsoTankConsumptionForMonth } from '../../../../../../cmms-monthly-report/dao/isoTankConsumptionDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const month = params.get('month');
  const kind = params.get('kind');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  if (kind !== 'daily' && kind !== 'consumption') {
    return NextResponse.json({ success: false, error: 'Query param "kind" must be "daily" or "consumption".' }, { status: 400 });
  }
  const db = getMonthlyReportDb();
  const records = kind === 'daily' ? getIsoTankDailyReadingsForMonth(db, month) : getIsoTankConsumptionForMonth(db, month);
  return NextResponse.json({ success: true, records });
}
