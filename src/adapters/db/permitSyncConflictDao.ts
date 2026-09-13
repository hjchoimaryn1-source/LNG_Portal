// src/adapters/db/permitSyncConflictDao.ts
//
// PURPOSE
//   permit_sync_conflicts 테이블(CMMS_Architecture.md §5.5 오프라인 우선 동기화
//   충돌 로그)에 대한 순수 DAO. ptwPermitDao.ts와 동일 패턴 — SqlExecutor에만
//   의존하며 React/Next 바인딩이 없다.
//
// NOT IN SCOPE
//   충돌 여부 판정(safety-critical 필드 비교) — permitPersistenceAdapter.ts의
//   책임이며 이 파일은 이미 판정된 결과 행을 저장/조회만 한다.

import type { SqlExecutor } from './sqlExecutor';

export type PermitSyncConflictStatus = 'REQUIRES_SITE_MANAGER_REVIEW' | 'RESOLVED';

export interface PermitSyncConflictRow {
  conflictId: number;
  permitRefNo: string;
  serverPayloadHash: string;
  clientBasePayloadHash: string;
  conflictPayload: string;
  status: PermitSyncConflictStatus;
  createdAt: string;
  resolvedAt: string | null;
}

interface PermitSyncConflictSqlRow {
  conflict_id: number;
  permit_ref_no: string;
  server_payload_hash: string;
  client_base_payload_hash: string;
  conflict_payload: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

const INSERT_SQL = `
  INSERT INTO permit_sync_conflicts (
    permit_ref_no, server_payload_hash, client_base_payload_hash, conflict_payload, status
  ) VALUES (
    @permitRefNo, @serverPayloadHash, @clientBasePayloadHash, @conflictPayload, 'REQUIRES_SITE_MANAGER_REVIEW'
  )
`;

const SELECT_OPEN_SQL = `
  SELECT * FROM permit_sync_conflicts
  WHERE status = 'REQUIRES_SITE_MANAGER_REVIEW'
  ORDER BY created_at DESC
`;

function rowToConflict(row: PermitSyncConflictSqlRow): PermitSyncConflictRow {
  return {
    conflictId: row.conflict_id,
    permitRefNo: row.permit_ref_no,
    serverPayloadHash: row.server_payload_hash,
    clientBasePayloadHash: row.client_base_payload_hash,
    conflictPayload: row.conflict_payload,
    status: row.status as PermitSyncConflictStatus,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

/** 안전 필수 필드 충돌 1건을 REQUIRES_SITE_MANAGER_REVIEW 상태로 기록한다. */
export function insertPermitSyncConflict(
  db: SqlExecutor,
  input: { permitRefNo: string; serverPayloadHash: string; clientBasePayloadHash: string; conflictPayload: string }
): PermitSyncConflictRow {
  db.run(INSERT_SQL, input);
  const row = db.get<PermitSyncConflictSqlRow>(
    `SELECT * FROM permit_sync_conflicts WHERE permit_ref_no = @permitRefNo ORDER BY conflict_id DESC LIMIT 1`,
    { permitRefNo: input.permitRefNo }
  );
  if (!row) throw new Error(`[permitSyncConflictDao] insert succeeded but row not found for ${input.permitRefNo}`);
  return rowToConflict(row);
}

/** Site Manager 검토 대기 중(미해결)인 충돌 전체 조회 — 배지/알림 표시용. */
export function selectOpenPermitSyncConflicts(db: SqlExecutor): PermitSyncConflictRow[] {
  return db.all<PermitSyncConflictSqlRow>(SELECT_OPEN_SQL).map(rowToConflict);
}
