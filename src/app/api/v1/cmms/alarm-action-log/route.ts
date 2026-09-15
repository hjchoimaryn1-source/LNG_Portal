// src/app/api/v1/cmms/alarm-action-log/route.ts
//
// PURPOSE
//   HMI-2c-final — alarm_action_log 기록(acknowledge/suppress) + 활성 suppress 조회 API.
//   GET은 useAlarmSuppressionStore 하이드레이션 전용(DailyOpsDataContext), POST는
//   FaceplateReadoutRowActions.tsx의 버튼이 useAlarmActionLog.ts를 통해 호출한다.
//   reset_to_default는 이 라우트로 노출하지 않는다(HMI-2a-final 범위 — UI 트리거 없음).
//
//   HMI-2d-2-fix-c: GET 응답에 acknowledgements(태그+컬럼별 최신 acknowledge 시각)를
//   추가했다 — useAlarmAckStore.ts가 alarm_current_state.onset_at과 교차 참조해
//   재무장 여부를 판정하는 데 쓴다. 기존 records(suppression) 필드는 그대로 유지.

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import {
  logAlarmAction,
  listActiveSuppressions,
  listLatestAcknowledgedAt,
} from '../../../../../cmms-daily-ops/dao/alarmActionLogDao';

export const runtime = 'nodejs';

interface LogActionPayload {
  domain: string;
  equipmentTag: string;
  columnName: string;
  actionType: 'acknowledge' | 'suppress';
  actorId: string;
  actorRole: string;
  reasonText?: string;
  suppressExpiresAt?: string;
}

function isValidPayload(body: unknown): body is LogActionPayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  if (
    typeof r.domain !== 'string' ||
    typeof r.equipmentTag !== 'string' ||
    typeof r.columnName !== 'string' ||
    typeof r.actorId !== 'string' ||
    typeof r.actorRole !== 'string'
  ) {
    return false;
  }
  if (r.actionType !== 'acknowledge' && r.actionType !== 'suppress') return false;
  // suppress는 사유+만료 필수 — alarm_action_log DDL CHECK도 재검증하지만 400으로 조기 거절한다.
  if (r.actionType === 'suppress') {
    if (typeof r.reasonText !== 'string' || !r.reasonText.trim()) return false;
    if (typeof r.suppressExpiresAt !== 'string' || !r.suppressExpiresAt) return false;
  }
  return true;
}

export async function GET() {
  const db = getDailyOpsDb();
  return NextResponse.json({
    success: true,
    records: listActiveSuppressions(db, new Date().toISOString()),
    acknowledgements: listLatestAcknowledgedAt(db),
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ success: false, error: 'Invalid alarm action payload.' }, { status: 400 });
  }
  const db = getDailyOpsDb();
  logAlarmAction(db, {
    domain: body.domain,
    equipmentTag: body.equipmentTag,
    columnName: body.columnName,
    actionType: body.actionType,
    actorId: body.actorId,
    actorRole: body.actorRole,
    reasonText: body.reasonText ?? null,
    suppressExpiresAt: body.suppressExpiresAt ?? null,
  });
  return NextResponse.json({ success: true });
}
