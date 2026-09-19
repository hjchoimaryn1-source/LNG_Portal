import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { resolveSessionPermissionCore } from './sessionPermissionCore';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb(): SqlExecutor {
  const raw = new DatabaseSync(':memory:');
  ensureUserSecurityTables(raw);
  return {
    run: (sql, params = {}) => {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).get(params) as T | undefined,
    all: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).all(params) as T[],
  };
}

function seedAccount(
  db: SqlExecutor,
  opts: { employeeId: string; roleCode: string; actingUntil: string | null }
): void {
  db.run(
    `INSERT INTO personnel_master (employee_id, full_name, position_title, department_group) VALUES (@employeeId, 'Test', 'Test', @roleCode)`,
    { employeeId: opts.employeeId, roleCode: opts.roleCode }
  );
  db.run(
    `INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code, acting_as_site_manager_until)
     VALUES (@accountId, @employeeId, @username, 'hash', @roleCode, @actingUntil)`,
    {
      accountId: `A-${opts.employeeId}`,
      employeeId: opts.employeeId,
      username: `u-${opts.employeeId}`,
      roleCode: opts.roleCode,
      actingUntil: opts.actingUntil,
    }
  );
}

describe('resolveSessionPermissionCore', () => {
  it('returns the base role permission when no delegation is active', () => {
    const db = createTestDb();
    seedAccount(db, { employeeId: 'E-1', roleCode: 'OP_TEAM', actingUntil: null });

    const permission = resolveSessionPermissionCore(db, 'E-1', 'DAILY_OPS_REPORT');

    expect(permission?.canCreate).toBe(true); // OP_TEAM base canCreate=true on DAILY_OPS_REPORT
    expect(permission?.canApprove).toBe(false); // OP_TEAM base canApprove=false, no delegation to merge in
  });

  it('OR-merges canApprove from SITE_MANAGER during an active delegation window', () => {
    const db = createTestDb();
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    seedAccount(db, { employeeId: 'E-2', roleCode: 'OP_TEAM', actingUntil: future });

    const permission = resolveSessionPermissionCore(db, 'E-2', 'DAILY_OPS_REPORT');

    expect(permission?.canApprove).toBe(true); // delegated SITE_MANAGER canApprove=true merged in
    expect(permission?.canCreate).toBe(true); // base OP_TEAM field untouched by the merge
    expect(permission?.canRead).toBe(true); // base field untouched by the merge
  });

  it('does not apply delegation once acting_as_site_manager_until has expired', () => {
    const db = createTestDb();
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    seedAccount(db, { employeeId: 'E-3', roleCode: 'OP_TEAM', actingUntil: past });

    const permission = resolveSessionPermissionCore(db, 'E-3', 'DAILY_OPS_REPORT');

    expect(permission?.canApprove).toBe(false);
  });

  it('returns null for an unknown employeeId', () => {
    const db = createTestDb();
    expect(resolveSessionPermissionCore(db, 'NOPE', 'DAILY_OPS_REPORT')).toBeNull();
  });
});
