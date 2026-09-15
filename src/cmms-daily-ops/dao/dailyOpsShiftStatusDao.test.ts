import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureDailyOpsPatrolSchema } from '../db/dailyOpsPatrolSchema';
import { insertPatrolEntry } from './dailyOpsPatrolDao';
import { getShiftInputStatus } from './dailyOpsShiftStatusDao';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb(): SqlExecutor {
  const raw = new DatabaseSync(':memory:');
  ensureDailyOpsPatrolSchema(raw);
  return {
    run: (sql, params = {}) => {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).get(params) as T | undefined,
    all: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).all(params) as T[],
  };
}

describe('getShiftInputStatus', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('marks all 6 slots false when the report date has no entries', () => {
    const status = getShiftInputStatus(db, '2026-09-15');
    expect(status).toEqual({
      '00:00': false,
      '04:00': false,
      '08:00': false,
      '12:00': false,
      '16:00': false,
      '20:00': false,
    });
  });

  it('marks only the slots that actually have an entry for that date', () => {
    insertPatrolEntry(db, 'aav', 'AAV-102', '2026-09-15', '00:00', { pressure_gauge_us_bar: 4.0 }, 'normal', null, 'FIELD OP-1');
    insertPatrolEntry(db, 'n2_skid', 'N2-CYL-01', '2026-09-15', '08:00', { cylinder_pressure_bar: 150 }, 'normal', null, 'FIELD OP-1');

    const status = getShiftInputStatus(db, '2026-09-15');
    expect(status['00:00']).toBe(true);
    expect(status['08:00']).toBe(true);
    expect(status['04:00']).toBe(false);
    expect(status['12:00']).toBe(false);
    expect(status['16:00']).toBe(false);
    expect(status['20:00']).toBe(false);
  });

  it('deduplicates multiple entries in the same slot (different equipment) into one true', () => {
    insertPatrolEntry(db, 'aav', 'AAV-102', '2026-09-15', '00:00', { pressure_gauge_us_bar: 4.0 }, 'normal', null, 'FIELD OP-1');
    insertPatrolEntry(db, 'gc', 'GC-01', '2026-09-15', '00:00', { mol_methane: 96.1 }, 'normal', null, 'FIELD OP-1');

    const status = getShiftInputStatus(db, '2026-09-15');
    expect(status['00:00']).toBe(true);
    expect(Object.values(status).filter(Boolean)).toHaveLength(1);
  });

  it('does not count entries from a different report date', () => {
    insertPatrolEntry(db, 'aav', 'AAV-102', '2026-09-14', '00:00', { pressure_gauge_us_bar: 4.0 }, 'normal', null, 'FIELD OP-1');

    const status = getShiftInputStatus(db, '2026-09-15');
    expect(status['00:00']).toBe(false);
  });
});
