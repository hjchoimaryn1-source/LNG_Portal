// src/lib/rbac/userSecurityDbSingleton.ts
//
// PURPOSE
//   getCmmsDb()가 반환하는 공유 SQLite 연결을 재사용하되(새 연결을 열지 않음),
//   Stage 1 User & Security Management 5개 테이블(personnel_master,
//   user_accounts, user_sessions, role_permissions, user_account_audit_log)만
//   이 모듈 자신의 책임으로 최초 1회 보강한다.
//
//   src/cmms-daily-ops/db/dailyOpsDbSingleton.ts와 동일한 패턴 — cmmsDbSingleton.ts
//   자체는 수정하지 않는다(하드 바운더리, Step 0 재확인).

import type { DatabaseSync } from 'node:sqlite';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { seedRolePermissions, applyConfirmedRolePermissionMatrix } from './userSecurityRolePermissionSeed';
import { seedBootstrapAdminAccount } from './userSecurityBootstrapSeed';

let userSecuritySchemaEnsured = false;

/** CMMS 공유 연결 + Stage 1 User & Security 5개 테이블이 보강된 SqlExecutor를 반환한다. */
export function getUserSecurityDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!userSecuritySchemaEnsured) {
    const raw = (db as SqlExecutor & { raw: DatabaseSync }).raw;
    ensureUserSecurityTables(raw);
    seedRolePermissions(raw);
    applyConfirmedRolePermissionMatrix(raw);
    seedBootstrapAdminAccount(raw);
    userSecuritySchemaEnsured = true;
  }
  return db;
}
