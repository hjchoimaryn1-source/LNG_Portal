import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { writeUserAccountAudit, listAuditLog } from './userAccountAuditLog';

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

describe('userAccountAuditLog', () => {
  it('lists entries most-recent-first', () => {
    const db = createTestDb();
    writeUserAccountAudit(db, { employeeId: 'E-1', accountId: 'A-1', eventType: 'ACCOUNT_CREATED', actorAccountId: 'A-0' });
    writeUserAccountAudit(db, { employeeId: 'E-1', accountId: 'A-1', eventType: 'ROLE_CHANGED', actorAccountId: 'A-0' });

    const rows = listAuditLog(db);
    expect(rows.map((r) => r.eventType)).toEqual(['ROLE_CHANGED', 'ACCOUNT_CREATED']);
  });

  it('respects the limit parameter', () => {
    const db = createTestDb();
    for (let i = 0; i < 5; i++) {
      writeUserAccountAudit(db, { employeeId: 'E-1', accountId: 'A-1', eventType: 'LOGIN_SUCCESS', actorAccountId: 'A-1' });
    }
    expect(listAuditLog(db, 2)).toHaveLength(2);
  });
});
