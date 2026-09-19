// src/lib/rbac/userSecurityRolePermissionSeed.ts
//
// PURPOSE
//   role_permissions 초기 시딩 — 7개 role_code(Stage1RoleCode) x 15개
//   module_code(기존 14개 ModuleCode + 신규 PERSONNEL_MANAGEMENT).
//
//   보수적 기본값:
//     - PERSONNEL_MANAGEMENT: ADMIN만 전권(개인정보/계정 데이터이므로), 그 외
//       역할은 can_read를 포함해 전부 0.
//     - 그 외 기존 14개 모듈: 전 역할 can_read=1만 부여하고 나머지는 전부 0.
//       PTW 승인 등급, 삭제 권한 등 안전/감사 관련 세부 등급은 이 작업 범위에서
//       추측하지 않는다 — HJ의 명시적 후속 검토가 필요하다(요청 지시 원문).
//   idempotent: INSERT OR IGNORE — 이미 있는 행(관리자가 Stage 1D UI로 이후에
//   직접 수정했을 값 포함)은 덮어쓰지 않는다.

import type { DatabaseSync } from 'node:sqlite';
import type { ModuleCode } from '../../types/rbac';

export type Stage1RoleCode = 'ADMIN' | 'SITE_MANAGER' | 'OP_TEAM' | 'HSSE' | 'MAINTENANCE' | 'LOGISTIC' | 'HR';

export const STAGE1_ROLE_CODES: Stage1RoleCode[] = [
  'ADMIN',
  'SITE_MANAGER',
  'OP_TEAM',
  'HSSE',
  'MAINTENANCE',
  'LOGISTIC',
  'HR',
];

// 기존 14개 ModuleCode(src/types/rbac.ts) + 이번 스테이지에서 추가한 PERSONNEL_MANAGEMENT.
export const ALL_MODULE_CODES: ModuleCode[] = [
  'HQ_OVERVIEW',
  'LNG_PROCESS_OVERVIEW',
  'EQUIPMENT_ASSET_REGISTRY',
  'WORK_ORDER_DIRECTORY',
  'MAINTENANCE_MRO_HUB',
  'MANPOWER_DAILY_SHIFT',
  'MANPOWER_ROTATION_TRACKER',
  'PTW_PERMITS',
  'SAFETY_GAS_TESTING',
  'SAFETY_ERT_READINESS',
  'SAFETY_OVERVIEW',
  'DAILY_OPS_REPORT',
  'DAILY_OPS_PATROL_ENTRY',
  'ALARM_ACTION_LOG',
  'PERSONNEL_MANAGEMENT',
];

interface PermissionFlags {
  canRead: 0 | 1;
  canCreate: 0 | 1;
  canUpdate: 0 | 1;
  canDelete: 0 | 1;
  canApprove: 0 | 1;
  isReadOnlyForced: 0 | 1;
  canUnlockApproved: 0 | 1;
}

const ALL_ZERO: PermissionFlags = {
  canRead: 0,
  canCreate: 0,
  canUpdate: 0,
  canDelete: 0,
  canApprove: 0,
  isReadOnlyForced: 0,
  canUnlockApproved: 0,
};
const READ_ONLY: PermissionFlags = { ...ALL_ZERO, canRead: 1 };
const ADMIN_FULL: PermissionFlags = {
  canRead: 1,
  canCreate: 1,
  canUpdate: 1,
  canDelete: 1,
  canApprove: 1,
  isReadOnlyForced: 0,
  canUnlockApproved: 1,
};

function flagsFor(roleCode: Stage1RoleCode, moduleCode: ModuleCode): PermissionFlags {
  if (moduleCode === 'PERSONNEL_MANAGEMENT') {
    return roleCode === 'ADMIN' ? ADMIN_FULL : ALL_ZERO;
  }
  return READ_ONLY;
}

const INSERT_IGNORE_SQL = `
  INSERT OR IGNORE INTO role_permissions
    (role_code, module_code, can_read, can_create, can_update, can_delete, can_approve, is_read_only_forced, can_unlock_approved)
  VALUES (@roleCode, @moduleCode, @canRead, @canCreate, @canUpdate, @canDelete, @canApprove, @isReadOnlyForced, @canUnlockApproved)
`;

/** 7 role x 15 module = 105행을 멱등하게 시딩한다. */
export function seedRolePermissions(raw: DatabaseSync): void {
  const stmt = raw.prepare(INSERT_IGNORE_SQL);
  for (const roleCode of STAGE1_ROLE_CODES) {
    for (const moduleCode of ALL_MODULE_CODES) {
      const flags = flagsFor(roleCode, moduleCode);
      stmt.run({
        roleCode,
        moduleCode,
        canRead: flags.canRead,
        canCreate: flags.canCreate,
        canUpdate: flags.canUpdate,
        canDelete: flags.canDelete,
        canApprove: flags.canApprove,
        isReadOnlyForced: flags.isReadOnlyForced,
        canUnlockApproved: flags.canUnlockApproved,
      });
    }
  }
}
