// src/app/api/v1/cmms/alarm-current-state/route.ts
//
// PURPOSE
//   HMI-2d-2-fix-b — alarm_current_state(현재 onset) 조회/기록 API. pid-tag-coordinates
//   /pid-tag-aliases와 동일한 client/server 경계 이유(DAO가 node:sqlite를 간접 임포트)로
//   라우트를 통해서만 'use client' 컴포넌트에서 접근한다.
//
//   onset_at은 항상 서버 시각(new Date().toISOString())이다 — 안전 관련 onset 값을
//   클라이언트 시계에서 신뢰하지 않는다(지시문 명시 제약).

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { upsertOnset, clearOnset, getAllOnsets } from '../../../../../cmms-daily-ops/dao/alarmCurrentStateDao';

export const runtime = 'nodejs';

interface AlarmCurrentStatePayload {
  domain: string;
  equipmentTag: string;
  columnName: string;
  action: 'enter' | 'clear';
}

function isValidPayload(body: unknown): body is AlarmCurrentStatePayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.domain === 'string' &&
    typeof r.equipmentTag === 'string' &&
    typeof r.columnName === 'string' &&
    (r.action === 'enter' || r.action === 'clear')
  );
}

export async function GET() {
  const db = getDailyOpsDb();
  return NextResponse.json({ success: true, records: getAllOnsets(db) });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'Invalid alarm-current-state payload.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  const key = { domain: body.domain, equipmentTag: body.equipmentTag, columnName: body.columnName };

  if (body.action === 'clear') {
    clearOnset(db, key);
    return NextResponse.json({ success: true });
  }

  const onsetAt = upsertOnset(db, key, new Date().toISOString());
  return NextResponse.json({ success: true, onsetAt });
}
