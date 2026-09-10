// src/adapters/db/ptwSignatureDao.ts
//
// PURPOSE
//   ptw_signatures 테이블(전자 서명 로그, SSHQE §4.2 PART C/D/E)에 대한 순수
//   DAO. gasTestDao.ts와 동일한 "이벤트 1건당 1행" 컨벤션 — append-only이며
//   UNIQUE(permit_id, role) 제약으로 역할당 1회 서명만 허용한다(usePTWPermits.
//   addSignature()의 기존 클라이언트 측 no-op 규칙을 DB 레벨에서도 보장).

import type { SqlExecutor } from './sqlExecutor';
import type { PTWSignatureEntry, PTWSignatureRole } from '../../types/lng';

interface PTWSignatureRow {
  signature_id: number;
  permit_id: string;
  role: string;
  staff_id: string;
  staff_name: string;
  signed_at: string;
}

const INSERT_IGNORE_SQL = `
  INSERT OR IGNORE INTO ptw_signatures (permit_id, role, staff_id, staff_name, signed_at)
  VALUES (@permitId, @role, @staffId, @staffName, @signedAt)
`;

const SELECT_BY_PERMIT_SQL = `
  SELECT * FROM ptw_signatures WHERE permit_id = @permitId ORDER BY signature_id ASC
`;

const SELECT_ALL_SQL = `SELECT * FROM ptw_signatures ORDER BY signature_id ASC`;

function rowToEntry(row: PTWSignatureRow): PTWSignatureEntry {
  return {
    role: row.role as PTWSignatureRole,
    staffId: row.staff_id,
    staffName: row.staff_name,
    signedAt: row.signed_at,
  };
}

/** 서명 1건 기록. 동일 permit_id+role이 이미 있으면 UNIQUE 제약에 걸려 조용히 무시된다(멱등). */
export function insertSignature(db: SqlExecutor, permitId: string, entry: PTWSignatureEntry): void {
  db.run(INSERT_IGNORE_SQL, {
    permitId,
    role: entry.role,
    staffId: entry.staffId,
    staffName: entry.staffName,
    signedAt: entry.signedAt,
  });
}

export function selectSignaturesByPermit(db: SqlExecutor, permitId: string): PTWSignatureEntry[] {
  return db.all<PTWSignatureRow>(SELECT_BY_PERMIT_SQL, { permitId }).map(rowToEntry);
}

/** permit_id -> 서명 목록 맵으로 전체 조회 (usePTWPermitSync의 초기 병합용). */
export function selectAllSignaturesByPermit(db: SqlExecutor): Map<string, PTWSignatureEntry[]> {
  const rows = db.all<PTWSignatureRow>(SELECT_ALL_SQL);
  const map = new Map<string, PTWSignatureEntry[]>();
  for (const row of rows) {
    const list = map.get(row.permit_id) ?? [];
    list.push(rowToEntry(row));
    map.set(row.permit_id, list);
  }
  return map;
}
