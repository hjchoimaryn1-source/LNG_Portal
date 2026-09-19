// src/app/api/v1/cmms/monthly-report/gas-delivery-manual/route.ts
//
// PURPOSE
//   Client/server boundary for the "Summary Gas Delivery P5" manual-entry
//   fields (gas_delivery_daily_manual + gas_delivery_monthly_manual — no
//   CSV source, contract/operational values entered by hand), enriched at
//   GET-time with two computed sources (P5 Stage 2, no new manual columns):
//   `contractReference` (DCQ/Nom./Prod. Plan default, monthly grain) and
//   `computed` (per-day Delivery Vol/Energy from gas_metering_ledger_daily —
//   see gasDeliveryComputedDao.ts). Neither is persisted into
//   gas_delivery_daily_manual; the client applies them as read-time
//   defaults/display only.
//
//   GET  ?month=YYYY-MM -> { daily: [...], monthly: {...} | null,
//                             contractReference: {...} | null, computed: [...] }
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
import { getGasDeliveryContractReference } from '../../../../../../cmms-monthly-report/dao/gasDeliveryContractReferenceDao';
import { getDeliveryComputedForMonth } from '../../../../../../cmms-monthly-report/dao/gasDeliveryComputedDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, error: 'Query param "month" (YYYY-MM) is required.' }, { status: 400 });
  }
  const db = getMonthlyReportDb();
  const daily = getGasDeliveryDailyManualForMonth(db, month);
  const monthly = getGasDeliveryMonthlyManual(db, month) ?? null;
  const contractReference = getGasDeliveryContractReference(db, month) ?? null;
  const computed = getDeliveryComputedForMonth(db, month);
  return NextResponse.json({ success: true, daily, monthly, contractReference, computed });
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
