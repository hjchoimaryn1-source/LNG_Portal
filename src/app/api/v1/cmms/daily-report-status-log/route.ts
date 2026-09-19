// src/app/api/v1/cmms/daily-report-status-log/route.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-3) — AuditTrailView.tsx의 조회 전용 API.
//   snapshotId의 daily_report_status_log 전체를 시간순으로 반환한다.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { listStatusLog } from '../../../../../cmms-daily-ops/dao/dailyReportStatusLogDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const snapshotId = Number(request.nextUrl.searchParams.get('snapshotId'));
  if (!snapshotId) {
    return NextResponse.json({ success: false, error: 'snapshotId required.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  return NextResponse.json({ success: true, entries: listStatusLog(db, snapshotId) });
}
