import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { ensureUserSecurityTables } from './userSecuritySchema';
import {
  seedRolePermissions,
  applyConfirmedRolePermissionMatrix,
  STAGE1_ROLE_CODES,
  ALL_MODULE_CODES,
} from './userSecurityRolePermissionSeed';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createSeededDb() {
  const raw = new DatabaseSync(':memory:');
  ensureUserSecurityTables(raw);
  return raw;
}

interface RolePermissionRow {
  role_code: string;
  module_code: string;
  can_read: number;
  can_create: number;
  can_update: number;
  can_delete: number;
  can_approve: number;
  is_read_only_forced: number;
  can_unlock_approved: number;
}

describe('seedRolePermissions', () => {
  it('seeds exactly 7 roles x 15 modules = 105 rows', () => {
    const raw = createSeededDb();
    seedRolePermissions(raw);
    const count = raw.prepare('SELECT COUNT(*) as c FROM role_permissions').get() as { c: number };
    expect(count.c).toBe(STAGE1_ROLE_CODES.length * ALL_MODULE_CODES.length);
    expect(count.c).toBe(105);
  });

  it('grants ADMIN full access to PERSONNEL_MANAGEMENT', () => {
    const raw = createSeededDb();
    seedRolePermissions(raw);
    const row = raw
      .prepare(`SELECT * FROM role_permissions WHERE role_code = 'ADMIN' AND module_code = 'PERSONNEL_MANAGEMENT'`)
      .get() as unknown as RolePermissionRow;
    expect(row).toMatchObject({
      can_read: 1,
      can_create: 1,
      can_update: 1,
      can_delete: 1,
      can_approve: 1,
      is_read_only_forced: 0,
      can_unlock_approved: 1,
    });
  });

  it('denies every non-ADMIN role all access to PERSONNEL_MANAGEMENT', () => {
    const raw = createSeededDb();
    seedRolePermissions(raw);
    const rows = raw
      .prepare(`SELECT * FROM role_permissions WHERE module_code = 'PERSONNEL_MANAGEMENT' AND role_code != 'ADMIN'`)
      .all() as unknown as RolePermissionRow[];
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.can_read).toBe(0);
      expect(row.can_create).toBe(0);
      expect(row.can_update).toBe(0);
      expect(row.can_delete).toBe(0);
      expect(row.can_approve).toBe(0);
    }
  });

  // Stage 2A-ii (2026-09-19): the 6 modules with a live getEffectivePermission()/
  // resolveSessionPermission() call site now follow the HJ-confirmed matrix
  // (userSecurityRolePermissionSeed.ts's CONFIRMED_ROLE_PERMISSION_MATRIX)
  // instead of the blanket read-only default — flagsFor() checks that matrix
  // first. Only the remaining 8 modules (no call site) stay blanket read-only.
  const CONFIRMED_MATRIX_MODULES = [
    'WORK_ORDER_DIRECTORY',
    'DAILY_OPS_REPORT',
    'DAILY_OPS_PATROL_ENTRY',
    'PTW_PERMITS',
    'ALARM_ACTION_LOG',
    'MAINTENANCE_MRO_HUB',
  ];

  it('grants read-only access to every role on the 8 modules with no live call site', () => {
    const raw = createSeededDb();
    seedRolePermissions(raw);
    const rows = raw
      .prepare(
        `SELECT * FROM role_permissions WHERE module_code != 'PERSONNEL_MANAGEMENT' AND module_code NOT IN (${CONFIRMED_MATRIX_MODULES.map((m) => `'${m}'`).join(',')})`
      )
      .all() as unknown as RolePermissionRow[];
    expect(rows).toHaveLength(7 * (14 - CONFIRMED_MATRIX_MODULES.length));
    for (const row of rows) {
      expect(row.can_read).toBe(1);
      expect(row.can_create).toBe(0);
      expect(row.can_update).toBe(0);
      expect(row.can_delete).toBe(0);
      expect(row.can_approve).toBe(0);
    }
  });

  it('seeds the HJ-confirmed (non-read-only) matrix directly on the 6 live-call-site modules', () => {
    const raw = createSeededDb();
    seedRolePermissions(raw);
    const admin = raw
      .prepare(`SELECT * FROM role_permissions WHERE role_code = 'ADMIN' AND module_code = 'PTW_PERMITS'`)
      .get() as unknown as RolePermissionRow;
    expect(admin).toMatchObject({ can_read: 1, can_create: 1, can_update: 1, can_delete: 1, can_approve: 1 });

    const logistic = raw
      .prepare(`SELECT * FROM role_permissions WHERE role_code = 'LOGISTIC' AND module_code = 'MAINTENANCE_MRO_HUB'`)
      .get() as unknown as RolePermissionRow;
    expect(logistic).toMatchObject({ can_read: 1, can_create: 1, can_update: 1, can_delete: 1, can_approve: 0 });

    const hrPtw = raw
      .prepare(`SELECT * FROM role_permissions WHERE role_code = 'HR' AND module_code = 'PTW_PERMITS'`)
      .get() as unknown as RolePermissionRow;
    expect(hrPtw).toMatchObject({ can_read: 0, can_create: 0, can_update: 0, can_delete: 0, can_approve: 0 });
  });

  it('applyConfirmedRolePermissionMatrix corrects a stale pre-Stage-2A-ii placeholder row without touching unrelated rows', () => {
    const raw = createSeededDb();
    // Simulate a DB seeded by the pre-Stage-2A-ii flagsFor() (blanket read-only
    // placeholder on a now-confirmed-matrix cell) — this is the real shape of
    // the already-committed nias_cmms.db before this stage.
    raw
      .prepare(
        `INSERT INTO role_permissions (role_code, module_code, can_read, can_create, can_update, can_delete, can_approve, is_read_only_forced, can_unlock_approved)
         VALUES ('ADMIN', 'WORK_ORDER_DIRECTORY', 1, 0, 0, 0, 0, 0, 0)`
      )
      .run();
    raw
      .prepare(
        `INSERT INTO role_permissions (role_code, module_code, can_read, can_create, can_update, can_delete, can_approve, is_read_only_forced, can_unlock_approved)
         VALUES ('ADMIN', 'HQ_OVERVIEW', 1, 0, 0, 0, 0, 0, 0)`
      )
      .run();

    applyConfirmedRolePermissionMatrix(raw);

    const corrected = raw
      .prepare(`SELECT * FROM role_permissions WHERE role_code = 'ADMIN' AND module_code = 'WORK_ORDER_DIRECTORY'`)
      .get() as unknown as RolePermissionRow;
    expect(corrected).toMatchObject({ can_read: 1, can_create: 1, can_update: 1, can_delete: 1, can_approve: 1 });

    // Out-of-matrix module untouched.
    const untouched = raw
      .prepare(`SELECT * FROM role_permissions WHERE role_code = 'ADMIN' AND module_code = 'HQ_OVERVIEW'`)
      .get() as unknown as RolePermissionRow;
    expect(untouched).toMatchObject({ can_read: 1, can_create: 0 });
  });

  it('is idempotent and never overwrites a row already modified after seeding', () => {
    const raw = createSeededDb();
    seedRolePermissions(raw);

    // Simulate an admin having edited a row via the Stage 1D UI after the initial seed.
    raw
      .prepare(
        `UPDATE role_permissions SET can_create = 1 WHERE role_code = 'SITE_MANAGER' AND module_code = 'WORK_ORDER_DIRECTORY'`
      )
      .run();

    seedRolePermissions(raw);

    const row = raw
      .prepare(`SELECT can_create FROM role_permissions WHERE role_code = 'SITE_MANAGER' AND module_code = 'WORK_ORDER_DIRECTORY'`)
      .get() as { can_create: number };
    expect(row.can_create).toBe(1);

    const count = raw.prepare('SELECT COUNT(*) as c FROM role_permissions').get() as { c: number };
    expect(count.c).toBe(105);
  });
});
