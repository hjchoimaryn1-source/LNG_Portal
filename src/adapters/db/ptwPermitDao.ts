// src/adapters/db/ptwPermitDao.ts
//
// PURPOSE
//   ptw_permits 테이블(permit lifecycle 스냅샷: status/closedAt/safetyChecklist)
//   에 대한 순수 DAO. SqlExecutor에만 의존하며 React/Next 바인딩이 없다.
//   상태 전이 게이트 로직(evaluateSignatureGate, O2/LEL 체크 등)은 재구현하지
//   않는다 — usePTWPermits.transitionStatus가 이미 통과시킨 결과만 저장한다.

import type { SqlExecutor } from './sqlExecutor';
import type { PTWWorkflowStatus } from '../../types/lng';

export interface PTWPermitLifecycleDraft {
  permitId: string;
  status: PTWWorkflowStatus;
  fireWatchAssigned: boolean;
  gasDetectorContinuous: boolean;
  lotoApplied: boolean;
  forcedVentilation: boolean;
  ppeVerified: boolean;
  barricadeSet: boolean;
  workingAtHeight: boolean | null;
  closedAt: string | null;
}

interface PTWPermitRow {
  permit_id: string;
  status: string;
  fire_watch_assigned: number;
  gas_detector_continuous: number;
  loto_applied: number;
  forced_ventilation: number;
  ppe_verified: number;
  barricade_set: number;
  working_at_height: number | null;
  closed_at: string | null;
}

const INSERT_IGNORE_SQL = `
  INSERT OR IGNORE INTO ptw_permits (
    permit_id, status, fire_watch_assigned, gas_detector_continuous, loto_applied,
    forced_ventilation, ppe_verified, barricade_set, working_at_height, closed_at
  ) VALUES (
    @permitId, @status, @fireWatchAssigned, @gasDetectorContinuous, @lotoApplied,
    @forcedVentilation, @ppeVerified, @barricadeSet, @workingAtHeight, @closedAt
  )
`;

const UPDATE_STATUS_SQL = `
  UPDATE ptw_permits SET
    status = @status,
    closed_at = @closedAt,
    updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE permit_id = @permitId
`;

const SELECT_BY_ID_SQL = `SELECT * FROM ptw_permits WHERE permit_id = @permitId`;
const SELECT_ALL_SQL = `SELECT * FROM ptw_permits`;

function toBool(value: number | null): boolean {
  return value === 1;
}

function rowToDraft(row: PTWPermitRow): PTWPermitLifecycleDraft {
  return {
    permitId: row.permit_id,
    status: row.status as PTWWorkflowStatus,
    fireWatchAssigned: toBool(row.fire_watch_assigned),
    gasDetectorContinuous: toBool(row.gas_detector_continuous),
    lotoApplied: toBool(row.loto_applied),
    forcedVentilation: toBool(row.forced_ventilation),
    ppeVerified: toBool(row.ppe_verified),
    barricadeSet: toBool(row.barricade_set),
    workingAtHeight: row.working_at_height === null ? null : toBool(row.working_at_height),
    closedAt: row.closed_at,
  };
}

/** 이미 존재하는 permit_id는 건드리지 않는다 — seed-if-empty 시딩 전용(work_orders와 동일 컨벤션). */
export function insertPermitLifecycleIfAbsent(db: SqlExecutor, draft: PTWPermitLifecycleDraft): void {
  db.run(INSERT_IGNORE_SQL, {
    permitId: draft.permitId,
    status: draft.status,
    fireWatchAssigned: draft.fireWatchAssigned ? 1 : 0,
    gasDetectorContinuous: draft.gasDetectorContinuous ? 1 : 0,
    lotoApplied: draft.lotoApplied ? 1 : 0,
    forcedVentilation: draft.forcedVentilation ? 1 : 0,
    ppeVerified: draft.ppeVerified ? 1 : 0,
    barricadeSet: draft.barricadeSet ? 1 : 0,
    workingAtHeight: draft.workingAtHeight === null ? null : draft.workingAtHeight ? 1 : 0,
    closedAt: draft.closedAt,
  });
}

/** 상태 전이(usePTWPermits.transitionStatus) 결과만 갱신한다 — safetyChecklist는 불변이라 건드리지 않는다. */
export function updatePermitStatus(db: SqlExecutor, permitId: string, status: PTWWorkflowStatus, closedAt: string | null): PTWPermitLifecycleDraft | undefined {
  const existing = db.get<PTWPermitRow>(SELECT_BY_ID_SQL, { permitId });
  if (!existing) return undefined;
  db.run(UPDATE_STATUS_SQL, { permitId, status, closedAt });
  return rowToDraft({ ...existing, status, closed_at: closedAt });
}

export function selectPermitLifecycle(db: SqlExecutor, permitId: string): PTWPermitLifecycleDraft | undefined {
  const row = db.get<PTWPermitRow>(SELECT_BY_ID_SQL, { permitId });
  return row ? rowToDraft(row) : undefined;
}

export function selectAllPermitLifecycle(db: SqlExecutor): PTWPermitLifecycleDraft[] {
  return db.all<PTWPermitRow>(SELECT_ALL_SQL).map(rowToDraft);
}
