import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { createPersonnel } from './personnelMasterDao';
import { verifyPassword } from './passwordHash';
import { createAccount, changeRole, setAccountLock, resetPassword, listAccounts, getAccountById } from './userAccountAdminDao';

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

describe('userAccountAdminDao', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
    createPersonnel(db, { employeeId: 'E-1', fullName: 'Test', positionTitle: 'Tester', departmentGroup: 'HSSE' }, 'BOOTSTRAP');
  });

  it('creates an account with a verifiable, hashed temp password and must_change_password=1', () => {
    const result = createAccount(db, { employeeId: 'E-1', username: 'tester', roleCode: 'HSSE' }, 'ACTOR-1');
    const account = getAccountById(db, result.accountId);

    expect(account?.roleCode).toBe('HSSE');
    expect(account?.mustChangePassword).toBe(true);

    const row = db.get<{ password_hash: string }>('SELECT password_hash FROM user_accounts WHERE account_id = @id', {
      id: result.accountId,
    });
    expect(verifyPassword(result.tempPassword, row!.password_hash)).toBe(true);

    const audit = db.all<{ event_type: string }>('SELECT event_type FROM user_account_audit_log WHERE event_type = @e', {
      e: 'ACCOUNT_CREATED',
    });
    expect(audit).toHaveLength(1);
  });

  it('changes role_code and writes a ROLE_CHANGED audit row', () => {
    const { accountId } = createAccount(db, { employeeId: 'E-1', username: 'tester', roleCode: 'HSSE' }, 'ACTOR-1');
    changeRole(db, accountId, 'MAINTENANCE', 'ACTOR-1');

    expect(getAccountById(db, accountId)?.roleCode).toBe('MAINTENANCE');
    const audit = db.all<{ event_type: string }>('SELECT event_type FROM user_account_audit_log WHERE event_type = @e', {
      e: 'ROLE_CHANGED',
    });
    expect(audit).toHaveLength(1);
  });

  it('locks and unlocks an account, resetting failed_attempt_count/locked_until', () => {
    const { accountId } = createAccount(db, { employeeId: 'E-1', username: 'tester', roleCode: 'HSSE' }, 'ACTOR-1');
    db.run('UPDATE user_accounts SET failed_attempt_count = 3 WHERE account_id = @id', { id: accountId });

    setAccountLock(db, accountId, true, 'ACTOR-1');
    let account = getAccountById(db, accountId);
    expect(account?.accountStatus).toBe('LOCKED');
    expect(account?.failedAttemptCount).toBe(0);

    setAccountLock(db, accountId, false, 'ACTOR-1');
    account = getAccountById(db, accountId);
    expect(account?.accountStatus).toBe('ACTIVE');
  });

  it('resets the password to a fresh temp value and sets must_change_password', () => {
    const created = createAccount(db, { employeeId: 'E-1', username: 'tester', roleCode: 'HSSE' }, 'ACTOR-1');
    const reset = resetPassword(db, created.accountId, 'ACTOR-1');

    expect(reset.tempPassword).not.toBe(created.tempPassword);
    const row = db.get<{ password_hash: string; must_change_password: number }>(
      'SELECT password_hash, must_change_password FROM user_accounts WHERE account_id = @id',
      { id: created.accountId }
    );
    expect(verifyPassword(reset.tempPassword, row!.password_hash)).toBe(true);
    expect(row!.must_change_password).toBe(1);
  });

  it('lists all accounts', () => {
    createAccount(db, { employeeId: 'E-1', username: 'tester', roleCode: 'HSSE' }, 'ACTOR-1');
    expect(listAccounts(db)).toHaveLength(1);
  });
});
