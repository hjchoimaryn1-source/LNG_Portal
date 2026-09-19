// src/app/api/v1/cmms/monthly-report/gas-composition/route.ts
//
// PURPOSE
//   Client/server boundary for gas_composition_monthly_snapshot ("Gas
//   Analysis P8" — single monthly-snapshot grain, confirmed via direct
//   cell/formula inspection). Read-only — seeded via monthlyReportSeedRunner.ts.
//
//   GET ?month=YYYY-MM -> the snapshot row for that month, or null.

import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyReportDb } from '../../../../../../cmms-monthly-report/db/monthlyReportDbSingleton';
import { getGasCompositionSnapshot } from '../../../../../../cmms-monthly-report/dao/gasCompositionSnapshotDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  const db = getMonthlyReportDb();
  const snapshot = getGasCompositionSnapshot(db, month) ?? null;
  return NextResponse.json({ success: true, snapshot });
}
