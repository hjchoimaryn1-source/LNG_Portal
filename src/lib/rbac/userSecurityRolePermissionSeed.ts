// src/lib/rbac/userSecurityRolePermissionSeed.ts
//
// PURPOSE
//   role_permissions 초기 시딩 — 7개 role_code(Stage1RoleCode) x 15개
//   module_code(기존 14개 ModuleCode + 신규 PERSONNEL_MANAGEMENT).
//
//   보수적 기본값:
//     - PERSONNEL_MANAGEMENT: ADMIN만 전권(개인정보/계정 데이터이므로), 그 외
//       역할은 can_read를 포함해 전부 0.
//     - 그 외 기존 14개 모듈 중, Stage 2A-i 인벤토리에서 실제
//       getEffectivePermission()/resolveSessionPermission() 호출부가 발견된
//       6개(WORK_ORDER_DIRECTORY/DAILY_OPS_REPORT/DAILY_OPS_PATROL_ENTRY/
//       PTW_PERMITS/ALARM_ACTION_LOG/MAINTENANCE_MRO_HUB)는 아래
//       CONFIRMED_ROLE_PERMISSION_MATRIX(HJ 확정, Stage 2A-ii, 2026-09-19)를
//       따른다. 그 외 8개 모듈은 여전히 전 역할 can_read=1만 부여하는 보수적
//       기본값 — 호출부가 없어 이번 스테이지 범위 밖이다.
//   idempotent: INSERT OR IGNORE — 이미 있는 행(관리자가 Stage 1D UI로 이후에
//   직접 수정했을 값 포함)은 덮어쓰지 않는다.
//
//   ⚠ Stage 2A-ii 재검토 결과: 이 파일이 처음 만들어졌을 때(Stage 1C/1D) 이미
//   위 6개 모듈에도 보수적 READ_ONLY 플레이스홀더 값으로 시딩이 실행되어
//   nias_cmms.db에 반영돼 있었다 — INSERT OR IGNORE라 HJ 확정 매트릭스로
//   단순히 재시딩해도 기존 플레이스홀더 행을 덮어쓰지 못한다. 그래서
//   applyConfirmedRolePermissionMatrix()를 별도로 두어, 이 6개 모듈 42행만
//   UPSERT(ON CONFLICT DO UPDATE)로 확정 매트릭스 값으로 정정한다 — 나머지
//   9개 모듈(63행)은 기존 INSERT OR IGNORE 경로로만 채워지고 건드리지 않는다.
//   role_permissions를 편집하는 어드민 UI가 아직 없음을 확인했으므로(Stage 1D
//   Personnel Management 탭은 personnel_master/user_accounts만 다룸) 이 UPSERT가
//   관리자의 수동 수정값을 덮어쓸 위험은 없다.

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

// HJ 확정 매트릭스 — Stage 2A-ii, 2026-09-19. 7 role_code x 6 live-call-site
// module_code = 42행. ACTING_SITE_MANAGER는 이 표에 없다 — user_accounts.
// acting_as_site_manager_until 기반 위임으로 재설계(sessionPermissionCore.ts).
// HQ_SUPERVISOR_AUDITOR도 이 표에 없다 — 8번째 role_code를 만들지 않고 향후
// HQ-view 스테이지로 이연(HJ 결정). "(no row — no access)"로 명시된 셀은
// ALL_ZERO로 인코딩한다 — 모든 29개 호출부가 optional-chaining(`?.field`)으로
// 필드를 읽으므로 null과 ALL_ZERO 객체는 관측 가능한 차이가 없다(Stage 2A-ii
// 조사에서 PTW_PERMITS의 strict null 체크 2곳도 이 매트릭스에서는 전 역할이
// 명시적 행을 가져 영향 없음을 확인).
const CONFIRMED_ROLE_PERMISSION_MATRIX: Record<Stage1RoleCode, Partial<Record<ModuleCode, PermissionFlags>>> = {
  ADMIN: {
    WORK_ORDER_DIRECTORY: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 1, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    DAILY_OPS_REPORT: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 1, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 1 },
    DAILY_OPS_PATROL_ENTRY: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    PTW_PERMITS: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 1, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    ALARM_ACTION_LOG: { canRead: 1, canCreate: 1, canUpdate: 0, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    MAINTENANCE_MRO_HUB: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 1, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
  },
  SITE_MANAGER: {
    WORK_ORDER_DIRECTORY: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    DAILY_OPS_REPORT: { canRead: 1, canCreate: 0, canUpdate: 1, canDelete: 0, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    DAILY_OPS_PATROL_ENTRY: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    PTW_PERMITS: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    ALARM_ACTION_LOG: { canRead: 1, canCreate: 1, canUpdate: 0, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    MAINTENANCE_MRO_HUB: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
  },
  HSSE: {
    WORK_ORDER_DIRECTORY: { ...ALL_ZERO },
    DAILY_OPS_REPORT: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    DAILY_OPS_PATROL_ENTRY: { ...ALL_ZERO },
    PTW_PERMITS: { canRead: 1, canCreate: 0, canUpdate: 1, canDelete: 0, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    ALARM_ACTION_LOG: { canRead: 1, canCreate: 1, canUpdate: 0, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    MAINTENANCE_MRO_HUB: { ...ALL_ZERO },
  },
  OP_TEAM: {
    WORK_ORDER_DIRECTORY: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    DAILY_OPS_REPORT: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    DAILY_OPS_PATROL_ENTRY: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    PTW_PERMITS: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    ALARM_ACTION_LOG: { canRead: 1, canCreate: 1, canUpdate: 0, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    MAINTENANCE_MRO_HUB: { ...ALL_ZERO },
  },
  MAINTENANCE: {
    WORK_ORDER_DIRECTORY: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
    DAILY_OPS_REPORT: { ...ALL_ZERO },
    DAILY_OPS_PATROL_ENTRY: { ...ALL_ZERO },
    PTW_PERMITS: { canRead: 1, canCreate: 0, canUpdate: 0, canDelete: 0, canApprove: 1, isReadOnlyForced: 0, canUnlockApproved: 0 },
    ALARM_ACTION_LOG: { ...ALL_ZERO },
    // newly granted per HJ decision (legacy WORK_LEADER_TECH had no MRO Hub access).
    MAINTENANCE_MRO_HUB: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 0, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
  },
  LOGISTIC: {
    WORK_ORDER_DIRECTORY: { ...ALL_ZERO },
    DAILY_OPS_REPORT: { ...ALL_ZERO },
    DAILY_OPS_PATROL_ENTRY: { ...ALL_ZERO },
    PTW_PERMITS: { ...ALL_ZERO },
    ALARM_ACTION_LOG: { ...ALL_ZERO },
    // primary grant — no approve.
    MAINTENANCE_MRO_HUB: { canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 1, canApprove: 0, isReadOnlyForced: 0, canUnlockApproved: 0 },
  },
  HR: {
    WORK_ORDER_DIRECTORY: { ...ALL_ZERO },
    DAILY_OPS_REPORT: { ...ALL_ZERO },
    DAILY_OPS_PATROL_ENTRY: { ...ALL_ZERO },
    PTW_PERMITS: { ...ALL_ZERO },
    ALARM_ACTION_LOG: { ...ALL_ZERO },
    MAINTENANCE_MRO_HUB: { ...ALL_ZERO },
  },
};

function flagsFor(roleCode: Stage1RoleCode, moduleCode: ModuleCode): PermissionFlags {
  const confirmed = CONFIRMED_ROLE_PERMISSION_MATRIX[roleCode][moduleCode];
  if (confirmed) return confirmed;
  if (moduleCode === 'PERSONNEL_MANAGEMENT') {
    return roleCode === 'ADMIN' ? ADMIN_FULL : ALL_ZERO;
  }
  return READ_ONLY;
}

/** rolePermissionService.ts의 순수 in-memory getEffectivePermission()이 재사용하는 공개 진입점 — DB에 접근하지 않는다. */
export function resolveStage1PermissionFlags(roleCode: Stage1RoleCode, moduleCode: ModuleCode): PermissionFlags {
  return flagsFor(roleCode, moduleCode);
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

const UPSERT_CONFIRMED_SQL = `
  INSERT INTO role_permissions
    (role_code, module_code, can_read, can_create, can_update, can_delete, can_approve, is_read_only_forced, can_unlock_approved)
  VALUES (@roleCode, @moduleCode, @canRead, @canCreate, @canUpdate, @canDelete, @canApprove, @isReadOnlyForced, @canUnlockApproved)
  ON CONFLICT (role_code, module_code) DO UPDATE SET
    can_read = excluded.can_read,
    can_create = excluded.can_create,
    can_update = excluded.can_update,
    can_delete = excluded.can_delete,
    can_approve = excluded.can_approve,
    is_read_only_forced = excluded.is_read_only_forced,
    can_unlock_approved = excluded.can_unlock_approved
`;

/**
 * HJ 확정 매트릭스(CONFIRMED_ROLE_PERMISSION_MATRIX) 42행을 role_permissions에
 * UPSERT한다 — seedRolePermissions()의 INSERT OR IGNORE가 이미 심어둔 구
 * 플레이스홀더 값을 정정하기 위해 별도로 둔 함수(파일 헤더 주석 참조).
 * seedRolePermissions() 이후에 호출해야 한다. 이 6개 모듈 밖의 나머지 9개
 * 모듈(63행)은 건드리지 않는다.
 */
export function applyConfirmedRolePermissionMatrix(raw: DatabaseSync): void {
  const stmt = raw.prepare(UPSERT_CONFIRMED_SQL);
  for (const roleCode of STAGE1_ROLE_CODES) {
    const moduleFlags = CONFIRMED_ROLE_PERMISSION_MATRIX[roleCode];
    for (const moduleCode of Object.keys(moduleFlags) as ModuleCode[]) {
      const flags = moduleFlags[moduleCode]!;
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
