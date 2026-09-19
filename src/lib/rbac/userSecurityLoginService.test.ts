import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { hashPassword } from './passwordHash';
import { attemptLogin } from './userSecurityLoginService';

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

function seedAccount(db: SqlExecutor, opts: { username: string; password: string; status?: string }): void {
  db.run(
    `INSERT INTO personnel_master (employee_id, full_name, position_title, department_group) VALUES ('E-1', 'Test', 'Test', 'ADMIN')`
  );
  db.run(
    `INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code, account_status)
     VALUES ('A-1', 'E-1', @username, @passwordHash, 'ADMIN', @status)`,
    { username: opts.username, passwordHash: hashPassword(opts.password), status: opts.status ?? 'ACTIVE' }
  );
}

describe('attemptLogin', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('succeeds with correct credentials and issues a session', () => {
    seedAccount(db, { username: 'tester', password: 'Correct-1' });
    const result = attemptLogin(db, 'tester', 'Correct-1');

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('expected success');
    expect(result.roleCode).toBe('ADMIN');
    expect(result.rawSessionToken).toHaveLength(64); // 32 bytes hex

    const sessionCount = db.get<{ c: number }>('SELECT COUNT(*) as c FROM user_sessions');
    expect(sessionCount?.c).toBe(1);
    const audit = db.all<{ event_type: string }>('SELECT event_type FROM user_account_audit_log');
    expect(audit.map((a) => a.event_type)).toContain('LOGIN_SUCCESS');
  });

  it('rejects a wrong password without issuing a session', () => {
    seedAccount(db, { username: 'tester', password: 'Correct-1' });
    const result = attemptLogin(db, 'tester', 'Wrong-Password');

    expect(result).toEqual({ success: false, reason: 'INVALID_CREDENTIALS' });
    const sessionCount = db.get<{ c: number }>('SELECT COUNT(*) as c FROM user_sessions');
    expect(sessionCount?.c).toBe(0);
    const account = db.get<{ failed_attempt_count: number }>(`SELECT failed_attempt_count FROM user_accounts WHERE username = 'tester'`);
    expect(account?.failed_attempt_count).toBe(1);
  });

  it('locks the account after 5 consecutive failures and blocks further attempts even with the right password', () => {
    seedAccount(db, { username: 'tester', password: 'Correct-1' });

    let last;
    for (let i = 0; i < 5; i++) {
      last = attemptLogin(db, 'tester', 'Wrong-Password');
    }
    expect(last).toEqual({ success: false, reason: 'ACCOUNT_LOCKED' });

    const account = db.get<{ locked_until: string | null }>(`SELECT locked_until FROM user_accounts WHERE username = 'tester'`);
    expect(account?.locked_until).not.toBeNull();

    // Correct password no longer works while locked.
    const attemptWhileLocked = attemptLogin(db, 'tester', 'Correct-1');
    expect(attemptWhileLocked).toEqual({ success: false, reason: 'ACCOUNT_LOCKED' });

    const audit = db.all<{ event_type: string }>('SELECT event_type FROM user_account_audit_log');
    expect(audit.map((a) => a.event_type)).toContain('ACCOUNT_LOCKED');
  });

  it('rejects a manually DISABLED account without checking the password', () => {
    seedAccount(db, { username: 'tester', password: 'Correct-1', status: 'DISABLED' });
    const result = attemptLogin(db, 'tester', 'Correct-1');
    expect(result).toEqual({ success: false, reason: 'ACCOUNT_DISABLED' });
  });

  it('rejects an unknown username and still writes an audit row', () => {
    const result = attemptLogin(db, 'nobody', 'whatever');
    expect(result).toEqual({ success: false, reason: 'INVALID_CREDENTIALS' });
    const audit = db.all<{ event_type: string; account_id: string | null }>('SELECT event_type, account_id FROM user_account_audit_log');
    expect(audit).toHaveLength(1);
    expect(audit[0].event_type).toBe('LOGIN_FAILED');
    expect(audit[0].account_id).toBeNull();
  });

  it('resets failed_attempt_count to 0 on a subsequent successful login', () => {
    seedAccount(db, { username: 'tester', password: 'Correct-1' });
    attemptLogin(db, 'tester', 'Wrong-1');
    attemptLogin(db, 'tester', 'Wrong-2');
    attemptLogin(db, 'tester', 'Correct-1');

    const account = db.get<{ failed_attempt_count: number }>(`SELECT failed_attempt_count FROM user_accounts WHERE username = 'tester'`);
    expect(account?.failed_attempt_count).toBe(0);
  });
});
