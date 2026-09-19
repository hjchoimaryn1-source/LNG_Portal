// src/app/api/v1/cmms/monthly-report/arun-delivery-certificate/route.ts
//
// PURPOSE
//   Client/server boundary for arun_lng_delivery_certificate — read-only,
//   Mass Balance's Net Usable Stock source. Seeded via
//   arunLngDeliveryCertificateSeedRunner.ts, no live write path (seed-only
//   this stage, HJ decision).
//
//   GET -> all certificate rows (every shipment; "latest batch" grouping
//   happens client-side in massBalanceCalculations.ts).

import { NextResponse } from 'next/server';
import { getMonthlyReportDb } from '../../../../../../cmms-monthly-report/db/monthlyReportDbSingleton';
import { getAllArunLngDeliveryCertificates } from '../../../../../../cmms-monthly-report/dao/arunLngDeliveryCertificateDao';

export const runtime = 'nodejs';

export async function GET() {
  const db = getMonthlyReportDb();
  const records = getAllArunLngDeliveryCertificates(db);
  return NextResponse.json({ success: true, records });
}
