// src/app/api/v1/cmms/daily-ops-shift-input-status/route.ts
//
// PURPOSE
//   Client/server boundary route for getShiftInputStatus
//   (dailyOpsShiftStatusDao.ts) — same reason as pid-tag-coordinates/route.ts
//   and daily-ops-patrol-entries/route.ts: the DAO transitively imports
//   node:sqlite via dailyOpsDbSingleton.ts and cannot be called directly
//   from a 'use client' component (HmiOverviewContainer.tsx).
//
//   GET only — read-only, no POST/write endpoint on this route.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { getShiftInputStatus } from '../../../../../cmms-daily-ops/dao/dailyOpsShiftStatusDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const reportDate = request.nextUrl.searchParams.get('reportDate');
  if (!reportDate) {
    return NextResponse.json({ success: false, error: 'reportDate query param is required.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  const status = getShiftInputStatus(db, reportDate);
  return NextResponse.json({ success: true, status });
}
