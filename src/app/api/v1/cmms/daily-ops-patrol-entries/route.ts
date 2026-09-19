// src/app/api/v1/cmms/daily-ops-patrol-entries/route.ts
//
// PURPOSE
//   daily_ops_patrol_entries client/server 경계(dailyOpsPatrolDao.ts가
//   node:sqlite를 간접 임포트해 'use client' 컴포넌트에서 직접 쓸 수 없음,
//   trucking-inspections/route.ts와 동일한 이유)를 넘기기 위한 라우트.
//
//   GET: Stage B3(DailyOpsDataContext) 초기 로드 — (domain, equipment_tag)별
//   최신 1건씩 전체를 반환해 B2 Live-sync 스토어를 DB 마지막 값으로 채운다.
//   GET + ?trend=1: Stage HMI-2d-3b — FaceplateSparkline.tsx가 쓰는 단일
//   (domain, equipmentTag, columnName) 시계열 조회. 별도 라우트 대신 기존
//   GET을 query param으로 분기(최소 diff) — POST/기존 GET 동작은 변경 없음.
//   POST: Stage C4에서 B1 폼의 onSave 콜백을 실제 저장에 연결하며 추가.
//
//   Phase 12 Pre-Flight III 승인 락(옵션 c): report_date가 이미 APPROVED면
//   저장을 거부한다(409) — Site Manager 승인 완료 후 패트롤 데이터 수정 차단.
//
//   Explicit allow-list per HJ decision 2026-09-15 — Phase 12 field-readiness pass.
//   roleCode가 SITE_MANAGER/OPERATION_TEAM_LEADER/SYSTEM_ADMIN 밖이면 APPROVED
//   락 체크보다 먼저 403으로 거부한다 — 클라이언트(usePatrolSaveHandler.ts)의
//   getEffectivePermission 체크를 서버에서 재검증.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import {
  getAllLatestPatrolValues,
  getPatrolEntriesForTrend,
  insertPatrolEntry,
} from '../../../../../cmms-daily-ops/dao/dailyOpsPatrolDao';
import type { PatrolValues } from '../../../../../cmms-daily-ops/dao/dailyOpsPatrolDao';
import type { PatrolDomain, ReadingStatus, ShiftTimeSlot } from '../../../../../cmms-daily-ops/types/patrolLog';
import { isReportDateApproved } from '../../../../../cmms-daily-ops/dao/dailyReportApprovalDao';
import { verifyUserSecuritySession } from '../../../../../lib/rbac/userSecuritySessionMiddleware';
import { resolveSessionPermission } from '../../../../../lib/rbac/sessionPermissionResolver';

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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const db = getDailyOpsDb();

  if (params.get('trend') === '1') {
    const domain = params.get('domain');
    const equipmentTag = params.get('equipmentTag');
    const columnName = params.get('columnName');
    const sinceTimestamp = params.get('sinceTimestamp');
    if (!domain || !equipmentTag || !columnName || !sinceTimestamp) {
      return NextResponse.json(
        { success: false, error: 'trend query requires domain, equipmentTag, columnName, sinceTimestamp.' },
        { status: 400 }
      );
    }
    try {
      const points = getPatrolEntriesForTrend(db, domain as PatrolDomain, equipmentTag, columnName, sinceTimestamp);
      return NextResponse.json({ success: true, points });
    } catch (err) {
      return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Trend query failed.' }, { status: 400 });
    }
  }

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

  // Stage 3 (HJ decision 2026-09-19): full replacement of the PIN-login
  // fallback — a valid Stage 1B session is now required.
  const session = verifyUserSecuritySession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (resolveSessionPermission(session.employeeId, 'DAILY_OPS_PATROL_ENTRY')?.canCreate !== true) {
    return NextResponse.json(
      { success: false, error: `Role ${session.roleCode} is not permitted to record patrol entries.` },
      { status: 403 }
    );
  }

  const db = getDailyOpsDb();
  if (isReportDateApproved(db, body.reportDate)) {
    return NextResponse.json(
      { success: false, error: `Report date ${body.reportDate} is already approved by Site Manager — patrol entries are locked.` },
      { status: 409 }
    );
  }
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
