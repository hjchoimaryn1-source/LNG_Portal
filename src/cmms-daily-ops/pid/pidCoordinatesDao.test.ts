import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensurePidReconciliationSchema } from '../db/pidReconciliationSchema';
import { upsertTagCoordinate, listCoordinates, listUncalibrated } from './pidCoordinatesDao';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb(): SqlExecutor {
  const raw = new DatabaseSync(':memory:');
  ensurePidReconciliationSchema(raw);
  return {
    run: (sql, params = {}) => {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).get(params) as T | undefined,
    all: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).all(params) as T[],
  };
}

describe('pidCoordinatesDao', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('starts with no coordinates (Stage A empty-seed deviation)', () => {
    expect(listCoordinates(db)).toEqual([]);
  });

  it('upserts a coordinate and reads it back as calibrated', () => {
    upsertTagCoordinate(db, 'AAV-102', 120.5, 340, true);
    const coords = listCoordinates(db);
    expect(coords).toHaveLength(1);
    expect(coords[0]).toEqual({ tagId: 'AAV-102', x: 120.5, y: 340, calibrated: true, notes: null });
  });

  it('overwrites an existing coordinate on re-calibration without duplicating rows', () => {
    upsertTagCoordinate(db, 'AAV-102', 100, 100, true);
    upsertTagCoordinate(db, 'AAV-102', 200, 250, true, 'moved after diagram correction');
    const coords = listCoordinates(db);
    expect(coords).toHaveLength(1);
    expect(coords[0].x).toBe(200);
    expect(coords[0].y).toBe(250);
    expect(coords[0].notes).toBe('moved after diagram correction');
  });

  it('listUncalibrated excludes tags with a calibrated=true coordinate', () => {
    upsertTagCoordinate(db, 'AAV-102', 100, 100, true);
    upsertTagCoordinate(db, 'AAV-103', 150, 150, false);

    const uncalibrated = listUncalibrated(db, ['AAV-102', 'AAV-103', 'AAV-105', 'AAV-106']);
    expect(uncalibrated.sort()).toEqual(['AAV-103', 'AAV-105', 'AAV-106'].sort());
  });
});
