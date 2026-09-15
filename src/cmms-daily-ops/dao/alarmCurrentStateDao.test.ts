import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureAlarmAuditSchema } from '../db/alarmAuditSchema';
import { upsertOnset, clearOnset, getOnset, getAllOnsets } from './alarmCurrentStateDao';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb(): SqlExecutor {
  const raw = new DatabaseSync(':memory:');
  ensureAlarmAuditSchema(raw);
  return {
    run: (sql, params = {}) => {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).get(params) as T | undefined,
    all: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).all(params) as T[],
  };
}

const KEY = { domain: 'aav', equipmentTag: 'AAV-102', columnName: 'temperature_gauge_us_c' };

describe('alarmCurrentStateDao', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('starts with no onsets', () => {
    expect(getAllOnsets(db)).toEqual([]);
    expect(getOnset(db, KEY)).toBeNull();
  });

  it('records a first onset and reads it back', () => {
    const returned = upsertOnset(db, KEY, '2026-01-01T00:00:00.000Z');
    expect(returned).toBe('2026-01-01T00:00:00.000Z');
    expect(getOnset(db, KEY)).toBe('2026-01-01T00:00:00.000Z');
  });

  it('does NOT overwrite an existing onset on repeated upserts (ON CONFLICT DO NOTHING)', () => {
    upsertOnset(db, KEY, '2026-01-01T00:00:00.000Z');
    const second = upsertOnset(db, KEY, '2026-01-01T00:05:00.000Z');
    expect(second).toBe('2026-01-01T00:00:00.000Z');
    expect(getOnset(db, KEY)).toBe('2026-01-01T00:00:00.000Z');
    expect(getAllOnsets(db)).toHaveLength(1);
  });

  it('clearOnset deletes the row so the next upsert records a fresh onset', () => {
    upsertOnset(db, KEY, '2026-01-01T00:00:00.000Z');
    clearOnset(db, KEY);
    expect(getOnset(db, KEY)).toBeNull();
    const fresh = upsertOnset(db, KEY, '2026-01-01T04:00:00.000Z');
    expect(fresh).toBe('2026-01-01T04:00:00.000Z');
  });

  it('keeps distinct keys independent', () => {
    upsertOnset(db, KEY, '2026-01-01T00:00:00.000Z');
    upsertOnset(db, { ...KEY, columnName: 'pressure_gauge_us_bar' }, '2026-01-01T01:00:00.000Z');
    expect(getAllOnsets(db)).toHaveLength(2);
  });
});
