// src/adapters/db/shiftOverrideDao.ts
//
// PURPOSE
//   shift_overrides 테이블에 대한 순수 DAO. SqlExecutor에만 의존하며
//   React/Next 바인딩이 없다 (workOrderDao.ts/purchaseRequisitionDao.ts와
//   동일 패턴).

import type { SqlExecutor } from './sqlExecutor';

export type ShiftOverrideApprovalStatus = 'PENDING_SITE_APPROVAL' | 'SITE_APPROVED' | 'REJECTED';
export type ShiftOverrideType = 'EXTEND_STAY_14D' | 'FORCE_SHIFT';
export type ShiftOverrideAssignedShift = 'D' | 'N' | 'R' | 'OFF';

export interface ShiftOverrideRecord {
  id: number;
  staffId: string;
  targetDate: string;
  overrideType: ShiftOverrideType;
  assignedShift: ShiftOverrideAssignedShift;
  reason: string;
  requestedBy: string;
  approvalStatus: ShiftOverrideApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface NewShiftOverrideInput {
  staffId: string;
  targetDate: string;
  overrideType: ShiftOverrideType;
  assignedShift: ShiftOverrideAssignedShift;
  reason: string;
  requestedBy: string;
  approvalStatus: ShiftOverrideApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
}

interface ShiftOverrideRow {
  id: number;
  staff_id: string;
  target_date: string;
  override_type: string;
  assigned_shift: string;
  reason: string;
  requested_by: string;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

const INSERT_SQL = `
  INSERT INTO shift_overrides (
    staff_id, target_date, override_type, assigned_shift, reason, requested_by,
    approval_status, approved_by, approved_at
  ) VALUES (
    @staffId, @targetDate, @overrideType, @assignedShift, @reason, @requestedBy,
    @approvalStatus, @approvedBy, @approvedAt
  )
`;

const SELECT_LAST_INSERTED_SQL = `
  SELECT * FROM shift_overrides WHERE staff_id = @staffId AND target_date = @targetDate ORDER BY id DESC LIMIT 1
`;

const SELECT_ALL_SQL = `SELECT * FROM shift_overrides ORDER BY created_at DESC`;

const SELECT_PENDING_SQL = `SELECT * FROM shift_overrides WHERE approval_status = 'PENDING_SITE_APPROVAL' ORDER BY created_at DESC`;

const UPDATE_APPROVAL_STATUS_SQL = `
  UPDATE shift_overrides SET approval_status = @approvalStatus, approved_by = @approvedBy, approved_at = @approvedAt
  WHERE id = @id
`;

const SELECT_BY_ID_SQL = `SELECT * FROM shift_overrides WHERE id = @id`;

function rowToRecord(row: ShiftOverrideRow): ShiftOverrideRecord {
  return {
    id: row.id,
    staffId: row.staff_id,
    targetDate: row.target_date,
    overrideType: row.override_type as ShiftOverrideType,
    assignedShift: row.assigned_shift as ShiftOverrideAssignedShift,
    reason: row.reason,
    requestedBy: row.requested_by,
    approvalStatus: row.approval_status as ShiftOverrideApprovalStatus,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  };
}

export function insertShiftOverride(db: SqlExecutor, input: NewShiftOverrideInput): ShiftOverrideRecord {
  db.run(INSERT_SQL, { ...input });
  const row = db.get<ShiftOverrideRow>(SELECT_LAST_INSERTED_SQL, {
    staffId: input.staffId,
    targetDate: input.targetDate,
  })!;
  return rowToRecord(row);
}

export function selectAllShiftOverrides(db: SqlExecutor): ShiftOverrideRecord[] {
  return db.all<ShiftOverrideRow>(SELECT_ALL_SQL).map(rowToRecord);
}

export function selectPendingShiftOverrides(db: SqlExecutor): ShiftOverrideRecord[] {
  return db.all<ShiftOverrideRow>(SELECT_PENDING_SQL).map(rowToRecord);
}

export function updateShiftOverrideApprovalStatus(
  db: SqlExecutor,
  id: number,
  approvalStatus: ShiftOverrideApprovalStatus,
  approvedBy: string
): ShiftOverrideRecord | undefined {
  db.run(UPDATE_APPROVAL_STATUS_SQL, {
    id,
    approvalStatus,
    approvedBy,
    approvedAt: new Date().toISOString(),
  });
  const row = db.get<ShiftOverrideRow>(SELECT_BY_ID_SQL, { id });
  return row ? rowToRecord(row) : undefined;
}
