// src/adapters/shiftOverrideDbAdapter.ts
//
// PURPOSE
//   shift_overrides 테이블 영속화 전담 어댑터. workOrderDbAdapter.ts와 동일
//   패턴 — src/adapters/db/shiftOverrideDao.ts(순수 DAO) + getApprovalHubDb()
//   (cmms-approval-hub 도메인 wrapper singleton)을 재사용한다.

import { getApprovalHubDb } from '../cmms-approval-hub/db/approvalHubDbSingleton';
import {
  selectAllShiftOverrides,
  selectPendingShiftOverrides,
  updateShiftOverrideApprovalStatus,
  type ShiftOverrideRecord,
  type ShiftOverrideApprovalStatus,
} from './db/shiftOverrideDao';

/** 전체 Shift Override 레코드 조회 (최신 생성순). */
export function getAllShiftOverrides(): ShiftOverrideRecord[] {
  return selectAllShiftOverrides(getApprovalHubDb());
}

/** 승인 대기(PENDING_SITE_APPROVAL) 레코드만 조회 — Approval Hub 집계용. */
export function getPendingShiftOverrides(): ShiftOverrideRecord[] {
  return selectPendingShiftOverrides(getApprovalHubDb());
}

/** Approval Hub Phase 1 Stage 2c — Shift Override 승인/반려 액션. */
export function approveShiftOverride(id: number, approvalStatus: ShiftOverrideApprovalStatus, approvedBy: string): ShiftOverrideRecord | undefined {
  return updateShiftOverrideApprovalStatus(getApprovalHubDb(), id, approvalStatus, approvedBy);
}
