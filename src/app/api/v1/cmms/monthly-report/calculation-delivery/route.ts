// src/app/api/v1/cmms/monthly-report/calculation-delivery/route.ts
//
// PURPOSE
//   Client/server boundary for Calculation Delivery Gas (P6) monthly
//   aggregation — read-only, no new table (see calculationDeliveryDao.ts).
//
//   GET ?month=YYYY-MM -> P6 monthly totals.

import { NextRequest, NextResponse } from 'next/server';
import { getGasMeteringDb } from '../../../../../../gas-metering/db/gasMeteringDbSingleton';
import { getCalculationDeliveryForMonth } from '../../../../../../cmms-monthly-report/dao/calculationDeliveryDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  const db = getGasMeteringDb();
  const record = getCalculationDeliveryForMonth(db, month);
  return NextResponse.json({ success: true, record });
}
