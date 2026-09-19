import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { seedRolePermissions, STAGE1_ROLE_CODES, ALL_MODULE_CODES } from './userSecurityRolePermissionSeed';

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

  it('grants read-only access to every role on the 14 pre-existing modules', () => {
    const raw = createSeededDb();
    seedRolePermissions(raw);
    const rows = raw
      .prepare(`SELECT * FROM role_permissions WHERE module_code != 'PERSONNEL_MANAGEMENT'`)
      .all() as unknown as RolePermissionRow[];
    expect(rows).toHaveLength(7 * 14);
    for (const row of rows) {
      expect(row.can_read).toBe(1);
      expect(row.can_create).toBe(0);
      expect(row.can_update).toBe(0);
      expect(row.can_delete).toBe(0);
      expect(row.can_approve).toBe(0);
    }
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
