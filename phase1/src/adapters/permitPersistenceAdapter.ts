// src/adapters/permitPersistenceAdapter.ts
//
// PURPOSE
//   TODO(cmms-permit-lock-state) 해소.
//   ptwStatusMapper.ts의 safeTransition()은 의도적으로 순수 함수로 남겨두었다
//   (파일 상단 NON-GOALS 참조: "DB에 쓰는 것은 이 파일의 책임이 아니다").
//   이 파일이 그 결과값을 실제 permit_lock_state 테이블에 UPSERT하는
//   책임을 담당한다.
//
//   ptwStatusMapper.ts는 이 파일이 수정하지 않는다 — 순수 로직과 영속화를
//   분리하는 원칙(Refactoring Plan §3.1 adapters/ 디렉토리 구조)을 그대로 따른다.

import type { SqlExecutor } from './db/sqlExecutor';
import {
  safeTransition,
  computePayloadHash,
  type PTWWorkflowStatus,
  type PTWStageEnum,
  type PTWStatusEnum,
  type SafeTransitionResult,
} from './ptwStatusMapper';

// ----------------------------------------------------------------------------
// 1. 조회
// ----------------------------------------------------------------------------

export interface PermitLockStateRow {
  permit_ref_no: string;
  stage_code: PTWStageEnum;
  status: PTWStatusEnum;
  payload_hash: string;
  updated_at: string;
}

/** 현재 저장된 lock 상태를 조회한다. 없으면 undefined (신규 permit). */
export function getPermitLockState(db: SqlExecutor, permitRefNo: string): PermitLockStateRow | undefined {
  return db.get<PermitLockStateRow>(
    `SELECT permit_ref_no, stage_code, status, payload_hash, updated_at
     FROM permit_lock_state WHERE permit_ref_no = @permitRefNo`,
    { permitRefNo }
  );
}

// ----------------------------------------------------------------------------
// 2. 신규 permit 최초 등록 (STAGE_1_DRAFT 진입)
// ----------------------------------------------------------------------------

const INSERT_LOCK_STATE_SQL = `
  INSERT INTO permit_lock_state (permit_ref_no, stage_code, status, payload_hash)
  VALUES (@permitRefNo, @stageCode, @status, @payloadHash)
`;

/**
 * 신규 permit을 STAGE_1_DRAFT/DRAFT로 최초 등록한다.
 * 이미 존재하는 permit_ref_no면 에러를 던진다 (초기화는 1회만 허용).
 */
export function initializePermitLockState(
  db: SqlExecutor,
  permitRefNo: string,
  initialPayload: unknown
): PermitLockStateRow {
  const existing = getPermitLockState(db, permitRefNo);
  if (existing) {
    throw new Error(
      `initializePermitLockState: permit_ref_no="${permitRefNo}" already has a lock state. ` +
        `Use applyStateTransition() for subsequent transitions, not initialize again.`
    );
  }
  const payloadHash = computePayloadHash(initialPayload);
  db.run(INSERT_LOCK_STATE_SQL, {
    permitRefNo,
    stageCode: 'STAGE_1_DRAFT',
    status: 'DRAFT',
    payloadHash,
  });
  return { permit_ref_no: permitRefNo, stage_code: 'STAGE_1_DRAFT', status: 'DRAFT', payload_hash: payloadHash, updated_at: new Date().toISOString() };
}

// ----------------------------------------------------------------------------
// 3. 상태 전이 적용 (Optimistic Locking 포함)
// ----------------------------------------------------------------------------

const UPDATE_LOCK_STATE_SQL = `
  UPDATE permit_lock_state
  SET stage_code = @stageCode, status = @status, payload_hash = @payloadHash, updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE permit_ref_no = @permitRefNo AND payload_hash = @expectedHash
`;

export class PermitLockStateNotFoundError extends Error {
  constructor(permitRefNo: string) {
    super(`permit_lock_state row not found for permit_ref_no="${permitRefNo}". Call initializePermitLockState() first.`);
    this.name = 'PermitLockStateNotFoundError';
  }
}

export class PersistedConcurrentModificationError extends Error {
  constructor(permitRefNo: string, expectedHash: string) {
    super(
      `UPDATE affected 0 rows for permit_ref_no="${permitRefNo}" with payload_hash="${expectedHash}". ` +
        `Either the row does not exist, or another process already advanced its state (optimistic lock conflict).`
    );
    this.name = 'PersistedConcurrentModificationError';
  }
}

/**
 * ptwStatusMapper.safeTransition()의 순수 계산 결과를 실제로 DB에 반영한다.
 *   1) 메모리상 해시 검증 (safeTransition 내부, 클라이언트가 보낸 expectedHash 기준)
 *   2) DB UPDATE ... WHERE payload_hash = expectedHash 로 "이중" Optimistic Lock
 *      (동시에 두 요청이 같은 expectedHash로 들어와도 DB 레벨에서 하나만 성공)
 *
 * 트랜잭션 경계는 호출자가 SqlExecutor 구현체(예: better-sqlite3 transaction())로
 * 감싸는 것을 권장한다.
 */
export function applyStateTransition(
  db: SqlExecutor,
  permitRefNo: string,
  currentPayload: unknown,
  expectedHash: string,
  targetLegacyStatus: PTWWorkflowStatus
): SafeTransitionResult {
  const row = getPermitLockState(db, permitRefNo);
  if (!row) throw new PermitLockStateNotFoundError(permitRefNo);

  // 1단계: 메모리 검증 + 상태 변환 (ptwStatusMapper.ts, 순수 함수)
  const result = safeTransition({ currentPayload, expectedHash, targetLegacyStatus });

  // 2단계: DB 레벨 조건부 UPDATE. 영향받은 row가 0건이면 그 사이 다른 프로세스가
  // 이미 상태를 바꾼 것 — 애플리케이션 레벨 해시 검증만으로는 TOCTOU를 막을 수 없으므로
  // WHERE 절에 payload_hash 조건을 반드시 포함시킨다.
  const before = db.get<{ payload_hash: string }>(
    `SELECT payload_hash FROM permit_lock_state WHERE permit_ref_no = @permitRefNo`,
    { permitRefNo }
  );
  db.run(UPDATE_LOCK_STATE_SQL, {
    permitRefNo,
    stageCode: result.stageCode,
    status: result.status,
    payloadHash: result.nextPayloadHash,
    expectedHash,
  });
  const after = db.get<{ payload_hash: string }>(
    `SELECT payload_hash FROM permit_lock_state WHERE permit_ref_no = @permitRefNo`,
    { permitRefNo }
  );
  if (!after || after.payload_hash !== result.nextPayloadHash) {
    // fake in-memory executor 등 rowcount를 지원하지 않는 환경 대비, 반영 여부를 재조회로 확인.
    // 실제 better-sqlite3 사용 시엔 stmt.run(...).changes === 0 체크로 대체 가능.
    if (before?.payload_hash !== expectedHash) {
      throw new PersistedConcurrentModificationError(permitRefNo, expectedHash);
    }
  }

  return result;
}
