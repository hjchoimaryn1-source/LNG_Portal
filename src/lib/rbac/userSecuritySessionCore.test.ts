import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { verifySessionToken, hashSessionToken } from './userSecuritySessionCore';

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

function seedAccountAndSession(
  db: SqlExecutor,
  opts: { token: string; expiresAt: string; accountStatus?: string; revokedAt?: string | null }
): void {
  db.run(
    `INSERT INTO personnel_master (employee_id, full_name, position_title, department_group) VALUES ('E-1', 'Test', 'Test', 'ADMIN')`
  );
  db.run(
    `INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code, account_status)
     VALUES ('A-1', 'E-1', 'tester', 'hash', 'ADMIN', @status)`,
    { status: opts.accountStatus ?? 'ACTIVE' }
  );
  db.run(
    `INSERT INTO user_sessions (session_token_hash, account_id, role_code, expires_at, revoked_at)
     VALUES (@tokenHash, 'A-1', 'ADMIN', @expiresAt, @revokedAt)`,
    { tokenHash: hashSessionToken(opts.token), expiresAt: opts.expiresAt, revokedAt: opts.revokedAt ?? null }
  );
}

describe('verifySessionToken', () => {
  let db: SqlExecutor;
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    db = createTestDb();
  });

  it('returns null when no token is given', () => {
    expect(verifySessionToken(db, undefined)).toBeNull();
  });

  it('returns null for an unknown token', () => {
    expect(verifySessionToken(db, 'not-a-real-token')).toBeNull();
  });

  it('returns the request context for a valid, unexpired session', () => {
    seedAccountAndSession(db, { token: 'good-token', expiresAt: future });
    const ctx = verifySessionToken(db, 'good-token');
    expect(ctx).toEqual({ accountId: 'A-1', employeeId: 'E-1', roleCode: 'ADMIN' });
  });

  it('touches last_seen_at on a successful verification', () => {
    seedAccountAndSession(db, { token: 'good-token', expiresAt: future });
    verifySessionToken(db, 'good-token');
    const row = db.get<{ last_seen_at: string | null }>(
      `SELECT last_seen_at FROM user_sessions WHERE session_token_hash = @h`,
      { h: hashSessionToken('good-token') }
    );
    expect(row?.last_seen_at).not.toBeNull();
  });

  it('rejects an expired session', () => {
    seedAccountAndSession(db, { token: 'expired-token', expiresAt: past });
    expect(verifySessionToken(db, 'expired-token')).toBeNull();
  });

  it('rejects a revoked session', () => {
    seedAccountAndSession(db, { token: 'revoked-token', expiresAt: future, revokedAt: new Date().toISOString() });
    expect(verifySessionToken(db, 'revoked-token')).toBeNull();
  });

  it('rejects a session whose account is no longer ACTIVE (locked/disabled after issuance)', () => {
    seedAccountAndSession(db, { token: 'stale-token', expiresAt: future, accountStatus: 'LOCKED' });
    expect(verifySessionToken(db, 'stale-token')).toBeNull();
  });
});
