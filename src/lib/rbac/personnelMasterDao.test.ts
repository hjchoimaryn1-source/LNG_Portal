import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { listPersonnel, getPersonnelByEmployeeId, createPersonnel, updatePersonnel, resignPersonnel } from './personnelMasterDao';

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

describe('personnelMasterDao', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('creates and retrieves a personnel record, and writes a PERSONNEL_CREATED audit row', () => {
    createPersonnel(
      db,
      { employeeId: 'E-1', fullName: 'Test Person', positionTitle: 'Tester', departmentGroup: 'ADMIN' },
      'ACTOR-1'
    );

    const record = getPersonnelByEmployeeId(db, 'E-1');
    expect(record).toMatchObject({
      employeeId: 'E-1',
      fullName: 'Test Person',
      positionTitle: 'Tester',
      departmentGroup: 'ADMIN',
      employmentStatus: 'ACTIVE',
    });

    const audit = db.all<{ event_type: string; actor_account_id: string }>('SELECT event_type, actor_account_id FROM user_account_audit_log');
    expect(audit).toEqual([{ event_type: 'PERSONNEL_CREATED', actor_account_id: 'ACTOR-1' }]);
  });

  it('lists and filters by departmentGroup and employmentStatus', () => {
    createPersonnel(db, { employeeId: 'E-1', fullName: 'A', positionTitle: 'X', departmentGroup: 'ADMIN' }, 'ACTOR-1');
    createPersonnel(db, { employeeId: 'E-2', fullName: 'B', positionTitle: 'Y', departmentGroup: 'HSSE' }, 'ACTOR-1');

    expect(listPersonnel(db)).toHaveLength(2);
    expect(listPersonnel(db, { departmentGroup: 'HSSE' })).toHaveLength(1);
    expect(listPersonnel(db, { employmentStatus: 'RESIGNED' })).toHaveLength(0);
  });

  it('updates only the provided fields', () => {
    createPersonnel(db, { employeeId: 'E-1', fullName: 'A', positionTitle: 'X', departmentGroup: 'ADMIN' }, 'ACTOR-1');
    updatePersonnel(db, 'E-1', { positionTitle: 'Y' }, 'ACTOR-1');

    const record = getPersonnelByEmployeeId(db, 'E-1');
    expect(record?.positionTitle).toBe('Y');
    expect(record?.departmentGroup).toBe('ADMIN'); // unchanged
  });

  it('resigns a person: sets RESIGNED status, resignation_date, and writes an audit row — never hard-deletes', () => {
    createPersonnel(db, { employeeId: 'E-1', fullName: 'A', positionTitle: 'X', departmentGroup: 'ADMIN' }, 'ACTOR-1');
    resignPersonnel(db, 'E-1', '2026-09-19', 'ACTOR-1');

    const record = getPersonnelByEmployeeId(db, 'E-1');
    expect(record?.employmentStatus).toBe('RESIGNED');
    expect(record?.resignationDate).toBe('2026-09-19');

    const audit = db.all<{ event_type: string }>('SELECT event_type FROM user_account_audit_log');
    expect(audit.map((a) => a.event_type)).toContain('RESIGNED');
  });
});
