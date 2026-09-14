// src/app/api/v1/cmms/pid-tag-coordinates/route.ts
//
// PURPOSE
//   PIDOverlayView(B4)의 좌표 조회/저장 API. dailyOpsPatrolDao 계열과 동일한
//   client/server 경계 이유(pidCoordinatesDao.ts가 node:sqlite를 간접
//   임포트)로 라우트를 통해서만 'use client' 컴포넌트에서 접근한다.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { listCoordinates, upsertTagCoordinate } from '../../../../../cmms-daily-ops/pid/pidCoordinatesDao';

export const runtime = 'nodejs';

interface UpsertCoordinatePayload {
  tagId: string;
  x: number;
  y: number;
  calibrated: boolean;
  notes?: string | null;
}

function isValidPayload(body: unknown): body is UpsertCoordinatePayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.tagId === 'string' &&
    typeof r.x === 'number' &&
    typeof r.y === 'number' &&
    typeof r.calibrated === 'boolean'
  );
}

export async function GET() {
  const db = getDailyOpsDb();
  return NextResponse.json({ success: true, records: listCoordinates(db) });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'Invalid coordinate payload.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  upsertTagCoordinate(db, body.tagId, body.x, body.y, body.calibrated, body.notes ?? null);
  return NextResponse.json({ success: true });
}
