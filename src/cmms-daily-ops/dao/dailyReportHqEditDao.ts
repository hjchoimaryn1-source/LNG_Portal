// src/cmms-daily-ops/dao/dailyReportHqEditDao.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2 / D-ADD-2b) — APPROVED 상태를 유지한 채 HQ가
//   일시적으로 patrol/스냅샷 재생성을 여는 임시 수정 창. status는 이동하지
//   않는다(계속 APPROVED) — hq_edit_unlock_active/hq_edit_pending_ack 플래그로만
//   표현한다. dailyReportApprovalDao.ts(반려/승인, SUBMITTED<->APPROVED 전이)
//   에서 분리한 이유는 250줄 파일 상한(AGENTS.md §3) 초과 때문.
//
//   role 검증은 이 DAO의 책임이 아니다 — openHqEditWindow는 canUnlockApproved,
//   acknowledgeHqEdit은 canApprove 티어를 호출부(API 라우트)가 먼저 확인한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { DailyReportStatus } from './dailyReportSnapshotDao';
import type { RoleCode } from '../../types/rbac';
import type { ApproveSnapshotResult } from './dailyReportApprovalDao';
import { logStatusEvent } from './dailyReportStatusLogDao';

const SELECT_HQ_EDIT_STATE_BY_ID_SQL = `
  SELECT id, status, hq_edit_unlock_active, hq_edit_pending_ack FROM daily_report_snapshots WHERE id = @id
`;
// status는 APPROVED로 유지한 채 unlock_active만 켠다.
const OPEN_HQ_EDIT_WINDOW_SQL = `
  UPDATE daily_report_snapshots
  SET hq_edit_unlock_active = 1
  WHERE id = @id AND status = 'APPROVED' AND hq_edit_unlock_active = 0
`;
const CLOSE_HQ_EDIT_WINDOW_SQL = `
  UPDATE daily_report_snapshots
  SET hq_edit_unlock_active = 0, hq_edit_pending_ack = 1, hq_edit_notice_text = @summaryText, hq_edit_notice_at = @now
  WHERE id = @id AND hq_edit_unlock_active = 1
`;
const ACK_HQ_EDIT_SQL = `
  UPDATE daily_report_snapshots
  SET hq_edit_pending_ack = 0
  WHERE id = @id AND hq_edit_pending_ack = 1
`;

interface HqEditStateRow {
  id: number;
  status: DailyReportStatus;
  hq_edit_unlock_active: number;
  hq_edit_pending_ack: number;
}

/**
 * D-ADD-2 — APPROVED 리포트에 HQ(SYSTEM_ADMIN) 임시 수정 창을 연다. status는
 * APPROVED로 유지되고 hq_edit_unlock_active만 켜진다.
 */
export function openHqEditWindow(
  db: SqlExecutor,
  snapshotId: number,
  unlockedBy: string,
  unlockedByRole: RoleCode,
  reasonText: string
): ApproveSnapshotResult {
  const existing = db.get<HqEditStateRow>(SELECT_HQ_EDIT_STATE_BY_ID_SQL, { id: snapshotId });
  if (!existing) {
    return { success: false, error: `snapshot id ${snapshotId} not found.`, currentStatus: null };
  }
  if (existing.status !== 'APPROVED') {
    return {
      success: false,
      error: `snapshot id ${snapshotId} is ${existing.status}, not APPROVED — cannot open an HQ edit window.`,
      currentStatus: existing.status,
    };
  }
  if (existing.hq_edit_unlock_active === 1) {
    return { success: false, error: `snapshot id ${snapshotId} already has an open HQ edit window.`, currentStatus: existing.status };
  }

  db.run(OPEN_HQ_EDIT_WINDOW_SQL, { id: snapshotId });
  logStatusEvent(db, {
    snapshotId,
    eventType: 'hq_unlock',
    fromStatus: 'APPROVED',
    toStatus: 'APPROVED',
    actorUserId: unlockedBy,
    actorRole: unlockedByRole,
    reasonText,
  });
  return { success: true };
}

/**
 * D-ADD-2 — HQ 수정 창을 닫고 Site Manager에게 통보한다(hq_edit_pending_ack=true).
 * HQ가 patrol/스냅샷 재생성을 여러 번 반복한 뒤 마지막에 한 번 호출하는
 * 명시적 "수정 완료" 액션이다 — 매 저장마다 자동으로 닫히지 않는다.
 */
export function closeHqEditWindowAndNotify(
  db: SqlExecutor,
  snapshotId: number,
  actorId: string,
  actorRole: RoleCode,
  summaryText: string
): ApproveSnapshotResult {
  const existing = db.get<HqEditStateRow>(SELECT_HQ_EDIT_STATE_BY_ID_SQL, { id: snapshotId });
  if (!existing) {
    return { success: false, error: `snapshot id ${snapshotId} not found.`, currentStatus: null };
  }
  if (existing.hq_edit_unlock_active !== 1) {
    return { success: false, error: `snapshot id ${snapshotId} has no open HQ edit window.`, currentStatus: existing.status };
  }

  db.run(CLOSE_HQ_EDIT_WINDOW_SQL, { id: snapshotId, summaryText, now: new Date().toISOString() });
  logStatusEvent(db, {
    snapshotId,
    eventType: 'hq_relock',
    fromStatus: 'APPROVED',
    toStatus: 'APPROVED',
    actorUserId: actorId,
    actorRole,
    reasonText: summaryText,
  });
  return { success: true };
}

/** D-ADD-2b — Site Manager/Acting Site Manager/System Admin의 HQ 수정 통보 확인. */
export function acknowledgeHqEdit(
  db: SqlExecutor,
  snapshotId: number,
  actorId: string,
  actorRole: RoleCode
): ApproveSnapshotResult {
  const existing = db.get<HqEditStateRow>(SELECT_HQ_EDIT_STATE_BY_ID_SQL, { id: snapshotId });
  if (!existing) {
    return { success: false, error: `snapshot id ${snapshotId} not found.`, currentStatus: null };
  }
  if (existing.hq_edit_pending_ack !== 1) {
    return {
      success: false,
      error: `snapshot id ${snapshotId} has no pending HQ edit notice to acknowledge.`,
      currentStatus: existing.status,
    };
  }

  db.run(ACK_HQ_EDIT_SQL, { id: snapshotId });
  logStatusEvent(db, {
    snapshotId,
    eventType: 'hq_edit_ack',
    fromStatus: null,
    toStatus: null,
    actorUserId: actorId,
    actorRole,
    reasonText: null,
  });
  return { success: true };
}
