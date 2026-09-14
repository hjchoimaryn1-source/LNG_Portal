// src/cmms-daily-ops/dao/dailyReportApprovalDao.ts
//
// PURPOSE
//   Phase 12 Pre-Flight III 결정 반영 — DRAFT -> SUBMITTED -> APPROVED
//   승인 상태 머신의 SUBMITTED -> APPROVED 전이(Site Manager 승인)와
//   "승인 완료 시 해당 report_date의 패트롤 수정 + 스냅샷 재생성 모두 차단"
//   (옵션 c) 판정을 담당한다. DRAFT -> SUBMITTED 전이는 기존
//   dailyReportSnapshotDao.ts의 finalizeSnapshot()(양쪽 서명 완료 트리거)이
//   그대로 수행하므로 이 파일에서 다루지 않는다.
//
//   역할(role) 검증 자체는 이 DAO의 책임이 아니다 — 호출부(API 라우트)가
//   src/lib/rbac/rolePermissionService.ts의 getEffectivePermission()으로
//   canApprove 여부를 먼저 확인한 뒤에만 approveSnapshot()을 호출해야 한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { DailyReportStatus } from './dailyReportSnapshotDao';
import type { RoleCode } from '../../types/rbac';
import { logStatusEvent } from './dailyReportStatusLogDao';

const SELECT_STATUS_BY_DATE_SQL = `SELECT status FROM daily_report_snapshots WHERE report_date = @reportDate`;
const SELECT_LOCK_STATE_BY_DATE_SQL = `
  SELECT status, hq_edit_unlock_active FROM daily_report_snapshots WHERE report_date = @reportDate
`;
const SELECT_STATUS_BY_ID_SQL = `SELECT id, status FROM daily_report_snapshots WHERE id = @id`;
const APPROVE_SQL = `
  UPDATE daily_report_snapshots
  SET status = 'APPROVED'
  WHERE id = @id AND status = 'SUBMITTED'
`;
// D-ADD-1 — Site Manager 반려: 서명 완료본을 승인 전 단계로 되돌려 patrol
// 재작업을 허용한다(SUBMITTED -> DRAFT). APPROVED에서는 반려할 수 없다 —
// 그 경우는 D-ADD-2의 HQ 수정 창(openHqEditWindow)을 사용한다.
const REJECT_SQL = `
  UPDATE daily_report_snapshots
  SET status = 'DRAFT'
  WHERE id = @id AND status = 'SUBMITTED'
`;
/** report_date의 현재 승인 상태. 스냅샷이 없으면 undefined(아직 DRAFT 대상조차 없음). */
export function getReportStatus(db: SqlExecutor, reportDate: string): DailyReportStatus | undefined {
  const row = db.get<{ status: DailyReportStatus }>(SELECT_STATUS_BY_DATE_SQL, { reportDate });
  return row?.status;
}

/**
 * 승인 락(옵션 c) 판정 — true면 해당 report_date의 패트롤 저장/스냅샷 재생성을
 * 모두 거부해야 한다. (D-ADD-2) hq_edit_unlock_active=true인 동안은 APPROVED여도
 * false를 반환한다 — HQ가 명시적으로 연 수정 창 안에서는 패트롤 저장/재생성을 허용한다.
 */
export function isReportDateApproved(db: SqlExecutor, reportDate: string): boolean {
  const row = db.get<{ status: DailyReportStatus; hq_edit_unlock_active: number }>(
    SELECT_LOCK_STATE_BY_DATE_SQL,
    { reportDate }
  );
  if (!row) return false;
  return row.status === 'APPROVED' && row.hq_edit_unlock_active !== 1;
}

export type ApproveSnapshotResult =
  | { success: true }
  | { success: false; error: string; currentStatus: DailyReportStatus | null };

/**
 * SUBMITTED -> APPROVED 전이 (Site Manager 승인). SUBMITTED 상태가 아니면
 * 거부한다 — 서명 미완료(DRAFT) 리포트를 건너뛰어 승인하거나, 이미
 * APPROVED된 리포트를 중복 승인하는 것을 막는다. (D-ADD-3) 성공 시
 * daily_report_status_log에 status_transition 이벤트를 남긴다.
 */
export function approveSnapshot(
  db: SqlExecutor,
  snapshotId: number,
  approvedBy: string,
  approverRole: RoleCode
): ApproveSnapshotResult {
  const existing = db.get<{ id: number; status: DailyReportStatus }>(SELECT_STATUS_BY_ID_SQL, { id: snapshotId });
  if (!existing) {
    return { success: false, error: `snapshot id ${snapshotId} not found.`, currentStatus: null };
  }
  if (existing.status !== 'SUBMITTED') {
    return {
      success: false,
      error: `snapshot id ${snapshotId} is ${existing.status}, not SUBMITTED — cannot approve.`,
      currentStatus: existing.status,
    };
  }

  db.run(APPROVE_SQL, { id: snapshotId });
  logStatusEvent(db, {
    snapshotId,
    eventType: 'status_transition',
    fromStatus: 'SUBMITTED',
    toStatus: 'APPROVED',
    actorUserId: approvedBy,
    actorRole: approverRole,
    reasonText: null,
  });
  return { success: true };
}

/**
 * D-ADD-1 — SUBMITTED -> DRAFT 전이 (Site Manager 반려). SUBMITTED 상태가
 * 아니면 거부한다. reasonText는 필수(빈 문자열 거부는 호출부 책임).
 */
export function rejectSubmission(
  db: SqlExecutor,
  snapshotId: number,
  rejectedBy: string,
  rejectorRole: RoleCode,
  reasonText: string
): ApproveSnapshotResult {
  const existing = db.get<{ id: number; status: DailyReportStatus }>(SELECT_STATUS_BY_ID_SQL, { id: snapshotId });
  if (!existing) {
    return { success: false, error: `snapshot id ${snapshotId} not found.`, currentStatus: null };
  }
  if (existing.status !== 'SUBMITTED') {
    return {
      success: false,
      error: `snapshot id ${snapshotId} is ${existing.status}, not SUBMITTED — cannot reject.`,
      currentStatus: existing.status,
    };
  }

  db.run(REJECT_SQL, { id: snapshotId });
  logStatusEvent(db, {
    snapshotId,
    eventType: 'status_transition',
    fromStatus: 'SUBMITTED',
    toStatus: 'DRAFT',
    actorUserId: rejectedBy,
    actorRole: rejectorRole,
    reasonText,
  });
  return { success: true };
}
