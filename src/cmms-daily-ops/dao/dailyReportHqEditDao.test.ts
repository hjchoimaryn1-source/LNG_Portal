import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureDailyOpsPatrolSchema } from '../db/dailyOpsPatrolSchema';
import { ensureDailyReportSchema } from '../db/dailyReportSchema';
import { generateSnapshot, finalizeSnapshot, getSnapshot } from './dailyReportSnapshotDao';
import { approveSnapshot, isReportDateApproved } from './dailyReportApprovalDao';
import { openHqEditWindow, closeHqEditWindowAndNotify, acknowledgeHqEdit } from './dailyReportHqEditDao';

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

function approveReportDate(db: SqlExecutor, reportDate: string): number {
  const gen = generateSnapshot(db, reportDate, 'HJ');
  if (!gen.success) throw new Error('setup: generateSnapshot failed');
  finalizeSnapshot(db, gen.snapshot.id);
  const approval = approveSnapshot(db, gen.snapshot.id, 'SM1', 'SITE_MANAGER');
  if (!approval.success) throw new Error('setup: approveSnapshot failed');
  return gen.snapshot.id;
}

describe('dailyReportHqEditDao', () => {
  let db: SqlExecutor;
  const reportDate = '2026-09-14';

  beforeEach(() => {
    db = createTestDb();
  });

  it('openHqEditWindow lifts the APPROVED regeneration/patrol lock while status stays APPROVED', () => {
    const snapshotId = approveReportDate(db, reportDate);
    expect(isReportDateApproved(db, reportDate)).toBe(true);

    const opened = openHqEditWindow(db, snapshotId, 'ADMIN1', 'SYSTEM_ADMIN', 'urgent correction');
    expect(opened.success).toBe(true);
    expect(getSnapshot(db, reportDate)?.status).toBe('APPROVED');
    expect(isReportDateApproved(db, reportDate)).toBe(false);

    const regenerated = generateSnapshot(db, reportDate, 'ADMIN1');
    expect(regenerated.success).toBe(true);
  });

  it('rejects opening a window on a non-APPROVED snapshot', () => {
    const gen = generateSnapshot(db, reportDate, 'HJ');
    expect(gen.success).toBe(true);
    if (!gen.success) return;

    const opened = openHqEditWindow(db, gen.snapshot.id, 'ADMIN1', 'SYSTEM_ADMIN', 'reason');
    expect(opened.success).toBe(false);
  });

  it('closeHqEditWindowAndNotify re-locks and sets hq_edit_pending_ack, restoring the APPROVED guard', () => {
    const snapshotId = approveReportDate(db, reportDate);
    openHqEditWindow(db, snapshotId, 'ADMIN1', 'SYSTEM_ADMIN', 'reason');

    const closed = closeHqEditWindowAndNotify(db, snapshotId, 'ADMIN1', 'SYSTEM_ADMIN', 'fixed the flowrate typo');
    expect(closed.success).toBe(true);

    const snapshot = getSnapshot(db, reportDate);
    expect(snapshot?.hqEditUnlockActive).toBe(false);
    expect(snapshot?.hqEditPendingAck).toBe(true);
    expect(snapshot?.hqEditNoticeText).toBe('fixed the flowrate typo');
    expect(isReportDateApproved(db, reportDate)).toBe(true);
  });

  it('acknowledgeHqEdit clears hq_edit_pending_ack', () => {
    const snapshotId = approveReportDate(db, reportDate);
    openHqEditWindow(db, snapshotId, 'ADMIN1', 'SYSTEM_ADMIN', 'reason');
    closeHqEditWindowAndNotify(db, snapshotId, 'ADMIN1', 'SYSTEM_ADMIN', 'fixed the flowrate typo');

    const ack = acknowledgeHqEdit(db, snapshotId, 'SM1', 'SITE_MANAGER');
    expect(ack.success).toBe(true);
    expect(getSnapshot(db, reportDate)?.hqEditPendingAck).toBe(false);
  });
});
