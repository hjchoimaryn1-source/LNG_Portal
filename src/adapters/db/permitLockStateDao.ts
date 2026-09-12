// src/adapters/db/permitLockStateDao.ts
//
// PURPOSE
//   permit_lock_state 테이블(CMMS_Architecture.md §5.5 낙관적 잠금 베이스라인)에
//   대한 순수 DAO. ptwPermitDao.ts와 동일 패턴 — SqlExecutor에만 의존하며
//   React/Next 바인딩이 없다.
//
// NOT IN SCOPE
//   payload_hash 계산(computePayloadHash) — ptwStatusMapper.ts의 책임이며
//   이 파일은 이미 계산된 해시 문자열을 그대로 저장/조회만 한다.

import type { SqlExecutor } from './sqlExecutor';
import type { PTWStageEnum, PTWStatusEnum } from '../ptwStatusMapper';

export interface PermitLockStateRow {
  permitRefNo: string;
  stageCode: PTWStageEnum;
  status: PTWStatusEnum;
  payloadHash: string;
  updatedAt: string;
}

interface PermitLockStateSqlRow {
  permit_ref_no: string;
  stage_code: string;
  status: string;
  payload_hash: string;
  updated_at: string;
}

const SELECT_SQL = `SELECT * FROM permit_lock_state WHERE permit_ref_no = @permitRefNo`;

const UPSERT_SQL = `
  INSERT INTO permit_lock_state (permit_ref_no, stage_code, status, payload_hash)
  VALUES (@permitRefNo, @stageCode, @status, @payloadHash)
  ON CONFLICT(permit_ref_no) DO UPDATE SET
    stage_code = excluded.stage_code,
    status = excluded.status,
    payload_hash = excluded.payload_hash,
    updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
`;

function rowToState(row: PermitLockStateSqlRow): PermitLockStateRow {
  return {
    permitRefNo: row.permit_ref_no,
    stageCode: row.stage_code as PTWStageEnum,
    status: row.status as PTWStatusEnum,
    payloadHash: row.payload_hash,
    updatedAt: row.updated_at,
  };
}

/** permit의 마지막 저장된 잠금 베이스라인 조회. 아직 한 번도 기록되지 않았으면 undefined. */
export function selectPermitLockState(db: SqlExecutor, permitRefNo: string): PermitLockStateRow | undefined {
  const row = db.get<PermitLockStateSqlRow>(SELECT_SQL, { permitRefNo });
  return row ? rowToState(row) : undefined;
}

/** 전이/갱신이 성공적으로 반영된 직후 새 베이스라인으로 덮어쓴다(없으면 생성). */
export function upsertPermitLockState(
  db: SqlExecutor,
  input: { permitRefNo: string; stageCode: PTWStageEnum; status: PTWStatusEnum; payloadHash: string }
): void {
  db.run(UPSERT_SQL, input);
}
