import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureDailyOpsPatrolSchema } from '../db/dailyOpsPatrolSchema';
import { ensureDailyReportSchema } from '../db/dailyReportSchema';
import { insertPatrolEntry } from './dailyOpsPatrolDao';
import { generateSnapshot, finalizeSnapshot, getSnapshot } from './dailyReportSnapshotDao';
import { approveSnapshot } from './dailyReportApprovalDao';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb(): SqlExecutor {
  const raw = new DatabaseSync(':memory:');
  ensureDailyOpsPatrolSchema(raw);
  ensureDailyReportSchema(raw);
  return {
    run: (sql, params = {}) => {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).get(params) as T | undefined,
    all: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).all(params) as T[],
  };
}

describe('dailyReportSnapshotDao.generateSnapshot', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('freezes the latest patrol values across all 7 non-cargo domains, with nulls where no entry exists', () => {
    insertPatrolEntry(
      db,
      'aav',
      'AAV-102',
      '2026-09-14',
      '08:00',
      { pressure_gauge_us_bar: 4.2 },
      'normal',
      null,
      'FIELD OP-1'
    );

    const result = generateSnapshot(db, '2026-09-14', 'HJ');
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.payload.domains.aav?.['AAV-102']?.pressure_gauge_us_bar).toBe(4.2);
    expect(result.payload.domains.aav?.['AAV-103']).toBeNull();
    expect(result.payload.domains.gc?.['GC-01']).toBeNull();
    expect(result.payload.domains.iso_tank_cargo).toBeUndefined();
  });

  it('computes STATION TOTAL as the sum of Metering Train A + B', () => {
    insertPatrolEntry(
      db,
      'metering_train_a',
      'METERING-TRAIN-A',
      '2026-09-14',
      '08:00',
      { volume_flowrate_mmscfd: 10, energy_flowrate_mmbtud: 100, volume_total_mmcf: 5, energy_total_mmbtu: 50 },
      'normal',
      null,
      'FIELD OP-1'
    );
    insertPatrolEntry(
      db,
      'metering_train_b',
      'METERING-TRAIN-B',
      '2026-09-14',
      '08:00',
      { volume_flowrate_mmscfd: 8, energy_flowrate_mmbtud: 80, volume_total_mmcf: 3, energy_total_mmbtu: 30 },
      'normal',
      null,
      'FIELD OP-1'
    );

    const result = generateSnapshot(db, '2026-09-14', 'HJ');
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.payload.stationTotal.volumeFlowrateMmscfd).toBe(18);
    expect(result.payload.stationTotal.energyFlowrateMmbtud).toBe(180);
    expect(result.payload.stationTotal.volumeTotalMmcf).toBe(8);
    expect(result.payload.stationTotal.energyTotalMmbtu).toBe(80);
    expect(result.payload.stationTotal.volumeTotalMscf).toBe(8000); // mscfFromMmcf(8)
  });

  it('overwrites a non-finalized snapshot for the same report_date instead of duplicating rows', () => {
    generateSnapshot(db, '2026-09-14', 'HJ');
    generateSnapshot(db, '2026-09-14', 'HJ2');

    const snapshot = getSnapshot(db, '2026-09-14');
    expect(snapshot?.generatedBy).toBe('HJ2');
  });

  it('still allows regeneration once SUBMITTED (both signatures done, awaiting Site Manager approval)', () => {
    const first = generateSnapshot(db, '2026-09-14', 'HJ');
    expect(first.success).toBe(true);
    if (!first.success) return;
    finalizeSnapshot(db, first.snapshot.id);
    expect(getSnapshot(db, '2026-09-14')?.status).toBe('SUBMITTED');
    expect(getSnapshot(db, '2026-09-14')?.isFinalized).toBe(false);

    const second = generateSnapshot(db, '2026-09-14', 'HJ2');
    expect(second.success).toBe(true);
  });

  it('rejects regeneration once APPROVED by Site Manager, returning the existing snapshot rather than overwriting', () => {
    const first = generateSnapshot(db, '2026-09-14', 'HJ');
    expect(first.success).toBe(true);
    if (!first.success) return;
    finalizeSnapshot(db, first.snapshot.id);
    const approval = approveSnapshot(db, first.snapshot.id);
    expect(approval.success).toBe(true);

    const second = generateSnapshot(db, '2026-09-14', 'HJ2');
    expect(second.success).toBe(false);
    if (second.success) return;
    expect(second.error).toMatch(/already finalized/);
    expect(second.existing.isFinalized).toBe(true);
    expect(second.existing.generatedBy).toBe('HJ');
  });
});
