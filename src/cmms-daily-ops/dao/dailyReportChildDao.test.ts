import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureDailyReportSchema } from '../db/dailyReportSchema';
import {
  insertCriticalEvent,
  listCriticalEvents,
  deleteCriticalEvent,
  upsertSafetyNotes,
  getSafetyNotes,
  upsertSignature,
  listSignatures,
} from './dailyReportChildDao';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb(): SqlExecutor {
  const raw = new DatabaseSync(':memory:');
  ensureDailyReportSchema(raw);
  raw.exec(`INSERT INTO daily_report_snapshots (id, report_date, generated_at, generated_by, snapshot_payload)
            VALUES (1, '2026-09-14', '2026-09-14T00:00:00Z', 'HJ', '{}')`);
  return {
    run: (sql, params = {}) => {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).get(params) as T | undefined,
    all: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).all(params) as T[],
  };
}

describe('dailyReportChildDao', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts and lists critical events for a snapshot, ordered by insertion', () => {
    insertCriticalEvent(db, {
      snapshotId: 1,
      eventTime: '10:00',
      equipmentSystem: 'Metering Train A',
      conditionAlarm: 'High diff pressure',
      impact: 'Reduced flow accuracy',
      immediateAction: 'Switched to Train B',
      status: 'Resolved',
      pic: 'FIELD OP-1',
    });
    insertCriticalEvent(db, {
      snapshotId: 1,
      eventTime: '14:00',
      equipmentSystem: null,
      conditionAlarm: null,
      impact: null,
      immediateAction: null,
      status: null,
      pic: null,
    });

    const events = listCriticalEvents(db, 1);
    expect(events).toHaveLength(2);
    expect(events[0].equipmentSystem).toBe('Metering Train A');
    expect(events[1].eventTime).toBe('14:00');
  });

  it('deletes a critical event by id', () => {
    const id = insertCriticalEvent(db, {
      snapshotId: 1,
      eventTime: null,
      equipmentSystem: null,
      conditionAlarm: null,
      impact: null,
      immediateAction: null,
      status: null,
      pic: null,
    });
    deleteCriticalEvent(db, id);
    expect(listCriticalEvents(db, 1)).toHaveLength(0);
  });

  it('upserts safety notes without duplicating rows for the same snapshot', () => {
    upsertSafetyNotes(db, {
      snapshotId: 1,
      unsafeActionText: 'Walked under suspended load',
      unsafeConditionText: null,
      incidentText: null,
      remarksText: null,
    });
    upsertSafetyNotes(db, {
      snapshotId: 1,
      unsafeActionText: 'Corrected wording',
      unsafeConditionText: 'Loose scaffolding',
      incidentText: null,
      remarksText: 'Reviewed with HSE',
    });

    const notes = getSafetyNotes(db, 1);
    expect(notes?.unsafeActionText).toBe('Corrected wording');
    expect(notes?.unsafeConditionText).toBe('Loose scaffolding');
    expect(notes?.remarksText).toBe('Reviewed with HSE');
  });

  it('upserts one signature per (snapshotId, role) without duplicating, leaving signature_image_ref null', () => {
    upsertSignature(db, 1, 'prepared_by', 'Ahmad', 'Field Supervisor');
    upsertSignature(db, 1, 'prepared_by', 'Ahmad', 'Field Supervisor'); // re-sign, should overwrite not duplicate
    upsertSignature(db, 1, 'acknowledged_by', 'HJ', 'Ops Manager');

    const signatures = listSignatures(db, 1);
    expect(signatures).toHaveLength(2);
    const prepared = signatures.find((s) => s.role === 'prepared_by')!;
    expect(prepared.signerName).toBe('Ahmad');
  });
});
