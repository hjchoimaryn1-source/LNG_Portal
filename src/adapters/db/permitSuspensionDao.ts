// src/adapters/db/permitSuspensionDao.ts
//
// PURPOSE
//   permit_suspension_state 테이블(CMMS_Architecture.md §5.3 AGT 4시간 타임아웃 /
//   시프트 교대 자동 정지)에 대한 순수 DAO. permitLockStateDao.ts와 동일 패턴 —
//   SqlExecutor에만 의존하며 React/Next 바인딩이 없다.
//
// NOT IN SCOPE
//   정지 여부 판정(4시간 경과/시프트 경계 통과) — src/adapters/permitSuspensionAdapter.ts의
//   책임이며 이 파일은 이미 판정된 결과를 저장/조회만 한다.

import type { SqlExecutor } from './sqlExecutor';

export type PermitSuspensionReason = 'AGT_GAS_TIMEOUT' | 'SHIFT_CHANGE';

export interface PermitSuspensionRow {
  permitRefNo: string;
  reason: PermitSuspensionReason;
  suspendedAt: string;
  clearedAt: string | null;
}

interface PermitSuspensionSqlRow {
  permit_ref_no: string;
  reason: string;
  suspended_at: string;
  cleared_at: string | null;
}

const SELECT_SQL = `SELECT * FROM permit_suspension_state WHERE permit_ref_no = @permitRefNo`;
const SELECT_ACTIVE_SQL = `SELECT * FROM permit_suspension_state WHERE cleared_at IS NULL`;

const UPSERT_ACTIVE_SQL = `
  INSERT INTO permit_suspension_state (permit_ref_no, reason, suspended_at, cleared_at)
  VALUES (@permitRefNo, @reason, @suspendedAt, NULL)
  ON CONFLICT(permit_ref_no) DO UPDATE SET
    reason = excluded.reason,
    suspended_at = excluded.suspended_at,
    cleared_at = NULL
`;

const CLEAR_SQL = `
  UPDATE permit_suspension_state SET cleared_at = @clearedAt
  WHERE permit_ref_no = @permitRefNo AND cleared_at IS NULL
`;

function rowToSuspension(row: PermitSuspensionSqlRow): PermitSuspensionRow {
  return {
    permitRefNo: row.permit_ref_no,
    reason: row.reason as PermitSuspensionReason,
    suspendedAt: row.suspended_at,
    clearedAt: row.cleared_at,
  };
}

/** 특정 permit의 최신 정지 기록(활성/해제 무관) 조회. 기록이 없으면 undefined. */
export function selectSuspensionState(db: SqlExecutor, permitRefNo: string): PermitSuspensionRow | undefined {
  const row = db.get<PermitSuspensionSqlRow>(SELECT_SQL, { permitRefNo });
  return row ? rowToSuspension(row) : undefined;
}

/** 현재 활성(cleared_at IS NULL) 정지 상태 전체 조회 — 읽기 경로/UI 배지용. */
export function selectActiveSuspensions(db: SqlExecutor): PermitSuspensionRow[] {
  return db.all<PermitSuspensionSqlRow>(SELECT_ACTIVE_SQL).map(rowToSuspension);
}

/** permit을 지정된 사유로 정지 상태로 기록(이미 정지 중이면 사유/시각만 갱신). */
export function upsertActiveSuspension(
  db: SqlExecutor,
  input: { permitRefNo: string; reason: PermitSuspensionReason; suspendedAt: string }
): void {
  db.run(UPSERT_ACTIVE_SQL, input);
}

/** 활성 정지를 해제한다(이미 해제되었으면 no-op). */
export function clearSuspension(db: SqlExecutor, permitRefNo: string, clearedAt: string): void {
  db.run(CLEAR_SQL, { permitRefNo, clearedAt });
}
