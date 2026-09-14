import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureDailyOpsPatrolSchema } from '../db/dailyOpsPatrolSchema';
import { insertPatrolEntry, getPatrolEntries, getLatestPatrolValue, getAllLatestPatrolValues } from './dailyOpsPatrolDao';

// vitest(vite-node)의 정적 ESM 리졸버가 실험적 코어 모듈 'node:sqlite'를
// 인식하지 못해(Vite builtin 목록 미포함) 직접 import 시 실패한다 — CJS
// require 경로로 우회해 실제 Node 런타임 모듈 해석에 맡긴다.
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

describe('dailyOpsPatrolDao', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts a new patrol entry and reads it back', () => {
    insertPatrolEntry(
      db,
      'aav',
      'AAV-102',
      '2026-09-14',
      '08:00',
      { pressure_gauge_us_bar: 4.2, temperature_gauge_us_c: -155.1 },
      'normal',
      null,
      'FIELD OP-1'
    );

    const entries = getPatrolEntries(db, 'aav', 'AAV-102', '2026-09-14');
    expect(entries).toHaveLength(1);
    expect(entries[0].values.pressure_gauge_us_bar).toBe(4.2);
    expect(entries[0].values.temperature_gauge_us_c).toBe(-155.1);
    expect(entries[0].values.pressure_gauge_ds_bar).toBeNull();
    expect(entries[0].readingStatus).toBe('normal');
  });

  it('upserts on (domain, equipmentTag, reportDate, shiftTimeSlot) without duplicating rows', () => {
    insertPatrolEntry(
      db,
      'aav',
      'AAV-103',
      '2026-09-14',
      '08:00',
      { pressure_gauge_us_bar: 4.0 },
      'normal',
      null,
      'FIELD OP-1'
    );
    insertPatrolEntry(
      db,
      'aav',
      'AAV-103',
      '2026-09-14',
      '08:00',
      { pressure_gauge_us_bar: 4.5 },
      'low_pressure_warning',
      'Dropped after valve cycling',
      'FIELD OP-2'
    );

    const entries = getPatrolEntries(db, 'aav', 'AAV-103', '2026-09-14');
    expect(entries).toHaveLength(1);
    expect(entries[0].values.pressure_gauge_us_bar).toBe(4.5);
    expect(entries[0].readingStatus).toBe('low_pressure_warning');
    expect(entries[0].recordedBy).toBe('FIELD OP-2');
  });

  it('rejects a column name outside the domain field manifest', () => {
    expect(() =>
      insertPatrolEntry(
        db,
        'aav',
        'AAV-105',
        '2026-09-14',
        '08:00',
        { mol_methane: 90 },
        'normal',
        null,
        'FIELD OP-1'
      )
    ).toThrow(/Unknown patrol column/);
  });

  it('getLatestPatrolValue returns the most recent row across dates/slots', () => {
    insertPatrolEntry(db, 'n2_skid', 'N2-CYL-01', '2026-09-13', '20:00', { cylinder_pressure_bar: 150 }, 'normal', null, 'FIELD OP-1');
    insertPatrolEntry(db, 'n2_skid', 'N2-CYL-01', '2026-09-14', '00:00', { cylinder_pressure_bar: 148 }, 'normal', null, 'FIELD OP-1');

    const latest = getLatestPatrolValue(db, 'n2_skid', 'N2-CYL-01');
    expect(latest?.reportDate).toBe('2026-09-14');
    expect(latest?.shiftTimeSlot).toBe('00:00');
    expect(latest?.values.cylinder_pressure_bar).toBe(148);
  });

  it('getLatestPatrolValue returns undefined when no entries exist', () => {
    expect(getLatestPatrolValue(db, 'gc', 'GC-01')).toBeUndefined();
  });

  it('getAllLatestPatrolValues returns one row per (domain, equipmentTag), each the most recent', () => {
    insertPatrolEntry(db, 'aav', 'AAV-102', '2026-09-13', '20:00', { pressure_gauge_us_bar: 4.0 }, 'normal', null, 'FIELD OP-1');
    insertPatrolEntry(db, 'aav', 'AAV-102', '2026-09-14', '08:00', { pressure_gauge_us_bar: 4.3 }, 'normal', null, 'FIELD OP-1');
    insertPatrolEntry(db, 'n2_skid', 'N2-CYL-01', '2026-09-14', '00:00', { cylinder_pressure_bar: 148 }, 'normal', null, 'FIELD OP-1');

    const all = getAllLatestPatrolValues(db);
    expect(all).toHaveLength(2);

    const aavRow = all.find((e) => e.equipmentTag === 'AAV-102');
    expect(aavRow?.reportDate).toBe('2026-09-14');
    expect(aavRow?.values.pressure_gauge_us_bar).toBe(4.3);

    const n2Row = all.find((e) => e.equipmentTag === 'N2-CYL-01');
    expect(n2Row?.values.cylinder_pressure_bar).toBe(148);
  });
});
