// src/app/api/v1/cmms/moc/route.ts
//
// PURPOSE
//   NP-12 Management of Change 모듈의 읽기 전용 집계 API. src/app/api/v1/cmms/
//   environment/route.ts와 동일 구조 — 도메인 로직은 src/cmms-moc/dao/*.ts에
//   위임하고, 이 route는 HTTP 응답 매핑만 담당한다. Stage 2는 GET-only 요건이므로
//   Plan of Change 신규 작성/Completion Report 제출(Site Manager 승인 워크플로우,
//   NP-12 §2.2)은 이 route에서 노출하지 않는다 — 별도 스테이지에서 승인 게이팅
//   설계 리뷰와 함께 다룬다.
//
//   mocDbSingleton.ts(→ cmmsDbSingleton.ts → node:sqlite)는 서버 전용 모듈이라
//   "use client" 컴포넌트에서 직접 import할 수 없다 — MocDataContext.tsx는 이
//   route를 통해서만 데이터를 읽는다(EnvironmentDataContext.tsx와 동일 패턴).

import { NextResponse } from 'next/server';
import { getMocDb } from '../../../../../cmms-moc/db/mocDbSingleton';
import { selectAllPlansOfChange } from '../../../../../cmms-moc/dao/mocPlanDao';
import { selectAllCompletionReports } from '../../../../../cmms-moc/dao/mocCompletionDao';

export const runtime = 'nodejs';

export async function GET() {
  const db = getMocDb();
  return NextResponse.json({
    success: true,
    plansOfChange: selectAllPlansOfChange(db),
    completionReports: selectAllCompletionReports(db),
  });
}
