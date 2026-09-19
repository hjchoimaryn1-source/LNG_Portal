import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { seedBootstrapAdminAccount, BOOTSTRAP_EMPLOYEE_ID, BOOTSTRAP_USERNAME } from './userSecurityBootstrapSeed';
import { verifyPassword } from './passwordHash';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createSeededDb() {
  const raw = new DatabaseSync(':memory:');
  ensureUserSecurityTables(raw);
  return raw;
}

interface UserAccountRow {
  account_id: string;
  employee_id: string;
  username: string;
  password_hash: string;
  role_code: string;
  must_change_password: number;
}

describe('seedBootstrapAdminAccount', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates exactly one ADMIN-001/admin account with a hashed, must-change temp password', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const raw = createSeededDb();

    seedBootstrapAdminAccount(raw);

    const account = raw
      .prepare('SELECT * FROM user_accounts WHERE username = @username')
      .get({ username: BOOTSTRAP_USERNAME }) as unknown as UserAccountRow;

    expect(account.employee_id).toBe(BOOTSTRAP_EMPLOYEE_ID);
    expect(account.role_code).toBe('ADMIN');
    expect(account.must_change_password).toBe(1);
    expect(account.password_hash).not.toContain(' ');

    // The printed temp password must actually match the stored hash.
    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0] as string;
    const match = /tempPassword=(\S+)/.exec(logged);
    expect(match).not.toBeNull();
    expect(verifyPassword(match![1], account.password_hash)).toBe(true);
  });

  it('never hardcodes a fixed password value across runs', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const rawA = createSeededDb();
    seedBootstrapAdminAccount(rawA);
    const passwordA = /tempPassword=(\S+)/.exec(logSpy.mock.calls[0][0] as string)![1];

    logSpy.mockClear();
    const rawB = createSeededDb();
    seedBootstrapAdminAccount(rawB);
    const passwordB = /tempPassword=(\S+)/.exec(logSpy.mock.calls[0][0] as string)![1];

    expect(passwordA).not.toBe(passwordB);
  });

  it('is idempotent — a second call does not duplicate or reprint', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const raw = createSeededDb();

    seedBootstrapAdminAccount(raw);
    seedBootstrapAdminAccount(raw);

    const count = raw
      .prepare('SELECT COUNT(*) as c FROM user_accounts WHERE username = @username')
      .get({ username: BOOTSTRAP_USERNAME }) as { c: number };
    expect(count.c).toBe(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
