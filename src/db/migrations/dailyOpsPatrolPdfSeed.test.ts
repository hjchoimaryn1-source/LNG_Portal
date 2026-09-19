import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureDailyOpsPatrolSchema } from '../../cmms-daily-ops/db/dailyOpsPatrolSchema';
import { insertPatrolEntry, getAllLatestPatrolValues } from '../../cmms-daily-ops/dao/dailyOpsPatrolDao';
import { DAILY_OPS_PATROL_PDF_SEED_ROWS } from './dailyOpsPatrolPdfSeed';

// dailyOpsPatrolDao.test.ts와 동일한 우회 — vite-node가 'node:sqlite'를 정적으로
// 리졸브하지 못한다.
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

describe('dailyOpsPatrolPdfSeed (2026-09-15 Daily Operation Report backfill)', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
    for (const row of DAILY_OPS_PATROL_PDF_SEED_ROWS) {
      insertPatrolEntry(
        db,
        row.domain,
        row.equipmentTag,
        row.reportDate,
        row.shiftTimeSlot,
        row.values,
        row.readingStatus,
        row.remarkText,
        row.recordedBy
      );
    }
  });

  it('writes all 8 seed rows through the official DAO without a whitelist rejection', () => {
    const all = getAllLatestPatrolValues(db);
    expect(all).toHaveLength(DAILY_OPS_PATROL_PDF_SEED_ROWS.length);
  });

  it('exposes NG Buffer Tank pressure via the same column useOverviewHmiData reads as primary (pressure_transmitter_barg), flagged low_pressure_warning', () => {
    const all = getAllLatestPatrolValues(db);
    const row = all.find((e) => e.domain === 'ng_buffer_tank' && e.equipmentTag === 'V-101');
    expect(row?.values.pressure_transmitter_barg).toBe(4.2);
    expect(row?.readingStatus).toBe('low_pressure_warning');
  });

  it('exposes Metering Train A/B press_barg/temp_c/energy_total_mmbtu as reported', () => {
    const all = getAllLatestPatrolValues(db);
    const a = all.find((e) => e.equipmentTag === 'METERING-TRAIN-A');
    const b = all.find((e) => e.equipmentTag === 'METERING-TRAIN-B');
    expect(a?.values).toMatchObject({ press_barg: 6.34, temp_c: 28, energy_total_mmbtu: 26.8 });
    expect(b?.values).toMatchObject({ press_barg: 2.69, temp_c: 29, energy_total_mmbtu: 338.36 });
  });

  it('exposes GC methane mol% via the same column useOverviewHmiData reads as primary (mol_methane)', () => {
    const all = getAllLatestPatrolValues(db);
    const gc = all.find((e) => e.equipmentTag === 'GC-01');
    expect(gc?.values.mol_methane).toBe(96.6);
    expect(gc?.values.gc_analyzer_status).toBe('Normal / Running');
  });

  it('AAV rows carry D/S transmitter readings, but NOT the U/S gauge columns useOverviewHmiData currently reads as primary/secondary (known HJ-decision gap, see dailyOpsPatrolPdfSeed.ts header)', () => {
    const all = getAllLatestPatrolValues(db);
    const aav102 = all.find((e) => e.equipmentTag === 'AAV-102');
    expect(aav102?.values.pressure_transmitter_ds_bar).toBe(5.1);
    expect(aav102?.values.temperature_transmitter_ds_c).toBe(26.87);
    // PRIMARY_COLUMN_BY_DOMAIN.aav = pressure_gauge_us_bar, SECONDARY = temperature_gauge_us_c
    // (hmiOverviewColumnMap.ts) — neither is populated by this report, so the HMI Overview
    // tile for this unit stays OFFLINE until that mapping is revisited (HJ decision, not
    // silently changed here).
    expect(aav102?.values.pressure_gauge_us_bar).toBeNull();
    expect(aav102?.values.temperature_gauge_us_c).toBeNull();
  });
});
