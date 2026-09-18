// src/app/api/v1/cmms/monthly-report/gas-delivery-manual/route.ts
//
// PURPOSE
//   Client/server boundary for the "Summary Gas Delivery P5" manual-entry
//   fields (gas_delivery_daily_manual + gas_delivery_monthly_manual — no
//   CSV source, contract/operational values entered by hand).
//
//   GET  ?month=YYYY-MM -> { daily: [...], monthly: {...} | null }
//   POST { kind: 'daily', row }   -> upsert one gas_delivery_daily_manual row
//   POST { kind: 'monthly', row } -> upsert the gas_delivery_monthly_manual row

import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyReportDb } from '../../../../../../cmms-monthly-report/db/monthlyReportDbSingleton';
import {
  getGasDeliveryDailyManualForMonth,
  getGasDeliveryMonthlyManual,
  upsertGasDeliveryDailyManual,
  upsertGasDeliveryMonthlyManual,
  type GasDeliveryDailyManualRow,
  type GasDeliveryMonthlyManualRow,
} from '../../../../../../cmms-monthly-report/dao/gasDeliveryManualDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  const db = getMonthlyReportDb();
  const daily = getGasDeliveryDailyManualForMonth(db, month);
  const monthly = getGasDeliveryMonthlyManual(db, month) ?? null;
  return NextResponse.json({ success: true, daily, monthly });
}

interface PostBody {
  kind: 'daily' | 'monthly';
  row: GasDeliveryDailyManualRow | GasDeliveryMonthlyManualRow;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PostBody;
  if (body.kind !== 'daily' && body.kind !== 'monthly') {
    return NextResponse.json({ success: false, error: '"kind" must be "daily" or "monthly".' }, { status: 400 });
  }
  const db = getMonthlyReportDb();
  if (body.kind === 'daily') {
    const row = body.row as GasDeliveryDailyManualRow;
    if (!row.reportDate) {
      return NextResponse.json({ success: false, error: 'row.reportDate is required.' }, { status: 400 });
    }
    upsertGasDeliveryDailyManual(db, row);
  } else {
    const row = body.row as GasDeliveryMonthlyManualRow;
    if (!row.reportMonth) {
      return NextResponse.json({ success: false, error: 'row.reportMonth is required.' }, { status: 400 });
    }
    upsertGasDeliveryMonthlyManual(db, row);
  }
  return NextResponse.json({ success: true });
}
