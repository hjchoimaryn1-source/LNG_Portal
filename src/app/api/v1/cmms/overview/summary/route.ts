// src/app/api/v1/cmms/overview/summary/route.ts
//
// PURPOSE
//   메인 Overview 대시보드가 조회하는 요약 API. src/app/api/v1/cmms/work-orders/
//   route.ts와 동일 구조 — 실제 집계 로직은 src/adapters/overviewSummaryAdapter.ts에
//   위임하고, 이 route는 응답 매핑만 담당한다. 읽기 전용(GET)만 노출한다.

import { NextResponse } from 'next/server';
import { getOverviewSummary } from '../../../../../../adapters/overviewSummaryAdapter';

export const runtime = 'nodejs';

export async function GET() {
  const summary = getOverviewSummary();
  return NextResponse.json({ success: true, summary });
}
