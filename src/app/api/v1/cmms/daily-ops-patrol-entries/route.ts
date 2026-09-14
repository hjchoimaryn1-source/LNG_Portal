// src/app/api/v1/cmms/daily-ops-patrol-entries/route.ts
//
// PURPOSE
//   daily_ops_patrol_entries client/server 경계(dailyOpsPatrolDao.ts가
//   node:sqlite를 간접 임포트해 'use client' 컴포넌트에서 직접 쓸 수 없음,
//   trucking-inspections/route.ts와 동일한 이유)를 넘기기 위한 라우트.
//
//   GET: Stage B3(DailyOpsDataContext) 초기 로드 — (domain, equipment_tag)별
//   최신 1건씩 전체를 반환해 B2 Live-sync 스토어를 DB 마지막 값으로 채운다.
//   POST: Stage C4에서 B1 폼의 onSave 콜백을 실제 저장에 연결하며 추가.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { getAllLatestPatrolValues, insertPatrolEntry } from '../../../../../cmms-daily-ops/dao/dailyOpsPatrolDao';
import type { PatrolValues } from '../../../../../cmms-daily-ops/dao/dailyOpsPatrolDao';
import type { PatrolDomain, ReadingStatus, ShiftTimeSlot } from '../../../../../cmms-daily-ops/types/patrolLog';

export const runtime = 'nodejs';

interface InsertPayload {
  domain: PatrolDomain;
  equipmentTag: string;
  reportDate: string;
  shiftTimeSlot: ShiftTimeSlot;
  values: PatrolValues;
  readingStatus: ReadingStatus;
  remarkText: string | null;
  recordedBy: string;
}

function isValidPayload(body: unknown): body is InsertPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.domain === 'string' &&
    typeof r.equipmentTag === 'string' &&
    typeof r.reportDate === 'string' &&
    typeof r.shiftTimeSlot === 'string' &&
    typeof r.values === 'object' &&
    r.values !== null &&
    typeof r.readingStatus === 'string' &&
    typeof r.recordedBy === 'string'
  );
}

export async function GET() {
  const db = getDailyOpsDb();
  const records = getAllLatestPatrolValues(db);
  return NextResponse.json({ success: true, records });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'Invalid patrol entry payload.' }, { status: 400 });
  }

  const db = getDailyOpsDb();
  try {
    insertPatrolEntry(
      db,
      body.domain,
      body.equipmentTag,
      body.reportDate,
      body.shiftTimeSlot,
      body.values,
      body.readingStatus,
      body.remarkText ?? null,
      body.recordedBy
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Insert failed.' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
