// src/app/api/v1/cmms/daily-ops-patrol-entries/route.ts
//
// PURPOSE
//   Stage B3(DailyOpsDataContext)의 초기 로드 전용 GET — daily_ops_patrol_entries
//   client/server 경계(dailyOpsPatrolDao.ts가 node:sqlite를 간접 임포트해
//   'use client' 컴포넌트에서 직접 쓸 수 없음, trucking-inspections/route.ts와
//   동일한 이유)를 넘기기 위한 최소 라우트. (domain, equipment_tag)별 최신
//   1건씩 전체를 반환해 B2 Live-sync 스토어를 DB 마지막 값으로 채운다.
//
//   POST(개별 순찰 기록 저장)는 아직 없다 — B1 폼은 저장 방법을 모르는 순수
//   콜백(onSave)만 노출하고, 실제 저장 배선은 Stage C(내비 탭 연결)에서
//   추가된다. 그때 이 라우트에 POST를 보강한다.

import { NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { getAllLatestPatrolValues } from '../../../../../cmms-daily-ops/dao/dailyOpsPatrolDao';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDailyOpsDb();
  const records = getAllLatestPatrolValues(db);
  return NextResponse.json({ success: true, records });
}
