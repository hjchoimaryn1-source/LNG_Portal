// src/cmms-approval-hub/db/approvalHubDbSingleton.ts
//
// PURPOSE
//   getCmmsDb()가 반환하는 공유 SQLite 연결을 재사용하되(새 연결을 열지 않음),
//   Approval Hub 모듈 1개 테이블(shift_overrides)만 이 모듈 자신의 책임으로
//   최초 1회 보강한다.
//
//   src/cmms-daily-ops/db/dailyOpsDbSingleton.ts와 동일한 패턴 —
//   cmmsDbSingleton.ts 자체는 수정하지 않는다(하드 바운더리).

import type { DatabaseSync } from 'node:sqlite';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureShiftOverrideSchema } from './shiftOverrideSchema';

let approvalHubSchemaEnsured = false;

/** CMMS 공유 연결 + Approval Hub 테이블이 보강된 SqlExecutor를 반환한다. */
export function getApprovalHubDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!approvalHubSchemaEnsured) {
    const raw = (db as SqlExecutor & { raw: DatabaseSync }).raw;
    ensureShiftOverrideSchema(raw);
    approvalHubSchemaEnsured = true;
  }
  return db;
}
