// src/app/api/v1/cmms/alarm-setpoint-overrides/route.ts
//
// PURPOSE
//   alarm_setpoint_overrides 전체 조회 API — HMI-2a-final. alarmSetpointOverrideCache.ts
//   하이드레이션 전용, pid-tag-aliases/route.ts와 동일한 client/server 경계 이유.
//   쓰기(override 생성/리셋 트리거) UI는 이 스테이지 범위 밖 — GET만 노출한다.

import { NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { listOverrides } from '../../../../../cmms-daily-ops/dao/alarmSetpointOverridesDao';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDailyOpsDb();
  return NextResponse.json({ success: true, records: listOverrides(db) });
}
