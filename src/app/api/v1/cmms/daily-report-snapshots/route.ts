// src/app/api/v1/cmms/daily-report-snapshots/route.ts
//
// PURPOSE
//   Stage C3(DailyReportPrintView)의 조회 전용 GET — report_date로 스냅샷을
//   찾아 snapshot_payload를 파싱해 반환한다. 생성(POST, C1의
//   generateSnapshot 호출)은 Stage C4에서 "Generate Daily Report" 액션과
//   함께 추가한다(지시가 그 배선을 C4로 명시).

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { getSnapshot } from '../../../../../cmms-daily-ops/dao/dailyReportSnapshotDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const reportDate = request.nextUrl.searchParams.get('reportDate');
  if (!reportDate) {
    return NextResponse.json({ success: false, error: 'reportDate required.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  const snapshot = getSnapshot(db, reportDate);
  if (!snapshot) {
    return NextResponse.json({ success: true, snapshot: null });
  }
  return NextResponse.json({
    success: true,
    snapshot: {
      id: snapshot.id,
      reportDate: snapshot.reportDate,
      generatedAt: snapshot.generatedAt,
      generatedBy: snapshot.generatedBy,
      isFinalized: snapshot.isFinalized,
      payload: JSON.parse(snapshot.snapshotPayload),
    },
  });
}
