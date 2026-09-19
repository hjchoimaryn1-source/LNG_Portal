// src/lib/rbac/rolePermissionService.ts
//
// PURPOSE
//   Pure, DB-free lookup: Stage1RoleCode x ModuleCode -> RolePermission. Backed
//   by userSecurityRolePermissionSeed.ts's HJ-confirmed matrix (Stage 2A-ii,
//   2026-09-19) — the exact same source of truth the role_permissions table is
//   seeded from, so this in-memory lookup and the DB never drift.
//
//   Deliberately has zero import chain into cmmsDbSingleton.ts/'node:sqlite' —
//   userSecurityRolePermissionSeed.ts only has `import type { DatabaseSync }`
//   (erased at compile time), so this file stays safe for tests that call
//   getEffectivePermission() directly with no DB setup (e.g.
//   useAlarmActionLog.test.tsx) under vitest/vite-node, which cannot statically
//   resolve a value import of the experimental 'node:sqlite' core module
//   (see userSecuritySessionCore.ts's header comment for the identical
//   constraint on that file).
//
// Stage 3 (2026-09-19, full PIN-login replacement, HJ decision) — the legacy
// 7-value RoleCode vocabulary (src/types/rbac.ts) and its static
// ROLE_PERMISSIONS array (91-row mirror of 001_role_permissions.sql) are
// deleted from this file. RoleCode itself is NOT deleted from types/rbac.ts —
// userAccountsSeed.ts (PIN-login backend, deliberately kept inert per this
// stage's instructions) still declares fields typed as RoleCode — but nothing
// in this file, and no live call site, references it anymore. See the final
// Stage 3 report for the full repo-wide search.

import type { ModuleCode, RolePermission } from '../../types/rbac';
import { resolveStage1PermissionFlags, type Stage1RoleCode } from './userSecurityRolePermissionSeed';

export function getEffectivePermission(roleCode: Stage1RoleCode, moduleCode: ModuleCode): RolePermission | null {
  const flags = resolveStage1PermissionFlags(roleCode, moduleCode);
  return {
    rolePermissionId: 0, // role_permissions(신규 스키마)에는 합성 ID 컬럼이 없다 — 아무 소비처도 읽지 않는 placeholder.
    roleCode,
    moduleCode,
    canRead: flags.canRead === 1,
    canCreate: flags.canCreate === 1,
    canUpdate: flags.canUpdate === 1,
    canDelete: flags.canDelete === 1,
    canApprove: flags.canApprove === 1,
    isReadOnlyForced: flags.isReadOnlyForced === 1,
    canUnlockApproved: flags.canUnlockApproved === 1,
  };
}
