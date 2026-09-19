import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { ensureUserSecurityTables } from './userSecuritySchema';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  return raw;
}

describe('userSecuritySchema', () => {
  it('creates all 5 tables and is idempotent (no throw on repeated calls)', () => {
    const raw = createTestDb();
    ensureUserSecurityTables(raw);
    ensureUserSecurityTables(raw);

    const tables = raw
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((r) => (r as { name: string }).name);

    expect(tables).toEqual(
      expect.arrayContaining([
        'personnel_master',
        'user_accounts',
        'user_sessions',
        'role_permissions',
        'user_account_audit_log',
      ])
    );
  });

  it('enforces personnel_master department_group CHECK constraint', () => {
    const raw = createTestDb();
    ensureUserSecurityTables(raw);
    expect(() =>
      raw
        .prepare(
          `INSERT INTO personnel_master (employee_id, full_name, position_title, department_group)
           VALUES ('X-001', 'Test', 'Test', 'NOT_A_REAL_GROUP')`
        )
        .run()
    ).toThrow();
  });

  it('enforces the user_accounts -> personnel_master FK', () => {
    const raw = createTestDb();
    ensureUserSecurityTables(raw);
    expect(() =>
      raw
        .prepare(
          `INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code)
           VALUES ('A-001', 'MISSING-EMP', 'someone', 'hash', 'ADMIN')`
        )
        .run()
    ).toThrow();
  });

  it('allows a valid personnel_master + user_accounts pair', () => {
    const raw = createTestDb();
    ensureUserSecurityTables(raw);
    raw
      .prepare(
        `INSERT INTO personnel_master (employee_id, full_name, position_title, department_group)
         VALUES ('E-001', 'Test Person', 'Tester', 'ADMIN')`
      )
      .run();
    expect(() =>
      raw
        .prepare(
          `INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code)
           VALUES ('A-001', 'E-001', 'tester', 'hash', 'ADMIN')`
        )
        .run()
    ).not.toThrow();
  });

  it('enforces role_permissions PRIMARY KEY(role_code, module_code) uniqueness', () => {
    const raw = createTestDb();
    ensureUserSecurityTables(raw);
    raw
      .prepare(
        `INSERT INTO role_permissions (role_code, module_code, can_read) VALUES ('ADMIN', 'PERSONNEL_MANAGEMENT', 1)`
      )
      .run();
    expect(() =>
      raw
        .prepare(
          `INSERT INTO role_permissions (role_code, module_code, can_read) VALUES ('ADMIN', 'PERSONNEL_MANAGEMENT', 0)`
        )
        .run()
    ).toThrow();
  });
});
