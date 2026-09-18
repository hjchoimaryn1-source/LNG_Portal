// src/app/api/v1/cmms/monthly-report/iso-tank/route.ts
//
// PURPOSE
//   Client/server boundary for the two ISO Tank monthly-report tables.
//   GET is read-only for both kinds. POST (kind=daily only) is the live
//   write path for NiasLaydownLogTab.tsx ("ISO TK - LOG", ISO Tank & Mass
//   Balance relocation stage) — iso_tank_daily_readings is no longer
//   CSV-seed-only, live entry extends the same table going forward.
//   HJ-confirmed: the two sources' tank rosters are NOT reconciled
//   (ISOT-064 present only in `kind=daily`).
//
//   GET  ?month=YYYY-MM&kind=daily       -> iso_tank_daily_readings rows
//   GET  ?month=YYYY-MM&kind=consumption -> iso_tank_consumption_monthly rows
//   GET  ?kind=latest (no month)         -> latest row per iso_tank_no, table-wide
//                                            (Yard Map KPI strip, Part 2 live rewiring)
//   POST { kind: 'daily', row } -> upsert one iso_tank_daily_readings row

import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyReportDb } from '../../../../../../cmms-monthly-report/db/monthlyReportDbSingleton';
import {
  getIsoTankDailyReadingsForMonth,
  getLatestIsoTankDailyReadings,
  upsertIsoTankDailyReading,
  type IsoTankDailyReadingRow,
} from '../../../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import { getIsoTankConsumptionForMonth } from '../../../../../../cmms-monthly-report/dao/isoTankConsumptionDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const month = params.get('month');
  const kind = params.get('kind');

  if (kind === 'latest') {
    const db = getMonthlyReportDb();
    return NextResponse.json({ success: true, records: getLatestIsoTankDailyReadings(db) });
  }

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  if (kind !== 'daily' && kind !== 'consumption') {
    return NextResponse.json({ success: false, error: 'Query param "kind" must be "daily", "consumption", or "latest".' }, { status: 400 });
  }
  const db = getMonthlyReportDb();
  const records = kind === 'daily' ? getIsoTankDailyReadingsForMonth(db, month) : getIsoTankConsumptionForMonth(db, month);
  return NextResponse.json({ success: true, records });
}

interface PostBody {
  kind: 'daily';
  row: IsoTankDailyReadingRow;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PostBody;
  if (body.kind !== 'daily') {
    return NextResponse.json({ success: false, error: '"kind" must be "daily".' }, { status: 400 });
  }
  if (!body.row?.reportDate || !body.row?.isoTankNo) {
    return NextResponse.json({ success: false, error: 'row.reportDate and row.isoTankNo are required.' }, { status: 400 });
  }
  const db = getMonthlyReportDb();
  upsertIsoTankDailyReading(db, body.row);
  return NextResponse.json({ success: true });
}
