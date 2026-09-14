// src/app/api/v1/cmms/daily-report-snapshots/route.ts
//
// PURPOSE
//   GET: Stage C3(DailyReportPrintView) 조회 — report_date로 스냅샷을 찾아
//   snapshot_payload를 파싱해 반환한다.
//   POST: Stage C4 "Generate Daily Report" 액션이 C1의 generateSnapshot을
//   호출한다. is_finalized=true면 C1이 이미 명시적 실패 결과를 반환하므로
//   그대로 전달한다(서명 완료본을 조용히 덮어쓰지 않음).

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { getSnapshot, generateSnapshot } from '../../../../../cmms-daily-ops/dao/dailyReportSnapshotDao';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  const r = body as Record<string, unknown>;
  if (typeof r.reportDate !== 'string' || typeof r.generatedBy !== 'string') {
    return NextResponse.json({ success: false, error: 'reportDate and generatedBy required.' }, { status: 400 });
  }

  const db = getDailyOpsDb();
  const result = generateSnapshot(db, r.reportDate, r.generatedBy);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error, existing: result.existing }, { status: 409 });
  }
  return NextResponse.json({ success: true, snapshot: result.snapshot, payload: result.payload });
}

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
