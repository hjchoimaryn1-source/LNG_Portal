// src/lib/rbac/rolePermissionService.ts
//
// PART A 재검증 결과: `role_permissions` 테이블은 src/db/schema/cmms_schema.sql,
// schema/cmms_schema.sqlite.sql, src/adapters/db/cmmsDbSingleton.ts(런타임 DDL로
// 테이블을 보강하는 유일한 경로)의 어느 곳에도 CREATE TABLE 되어 있지 않고,
// src/db/seeds/001_role_permissions.sql(77행)을 적재하는 시더 실행 코드도
// 존재하지 않는다 — 즉 "실제로 조회 가능한 DB 테이블"이 아니다.
// 따라서 이 서비스는 라이브 DB를 쿼리하지 않고, 001_role_permissions.sql의
// 77행을 그대로 옮긴 정적 데이터셋을 in-memory로 조회한다.
// 시드 SQL 파일 내용이 바뀌면 이 배열도 함께 갱신해야 한다.

import type { RoleCode, ModuleCode, RolePermission } from '../../types/rbac';

const ROLE_PERMISSIONS: RolePermission[] = [
  // SYSTEM_ADMIN: full access to all modules
  { rolePermissionId: 1, roleCode: 'SYSTEM_ADMIN', moduleCode: 'HQ_OVERVIEW', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 2, roleCode: 'SYSTEM_ADMIN', moduleCode: 'LNG_PROCESS_OVERVIEW', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 3, roleCode: 'SYSTEM_ADMIN', moduleCode: 'EQUIPMENT_ASSET_REGISTRY', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 4, roleCode: 'SYSTEM_ADMIN', moduleCode: 'WORK_ORDER_DIRECTORY', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 5, roleCode: 'SYSTEM_ADMIN', moduleCode: 'MAINTENANCE_MRO_HUB', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 6, roleCode: 'SYSTEM_ADMIN', moduleCode: 'MANPOWER_DAILY_SHIFT', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 7, roleCode: 'SYSTEM_ADMIN', moduleCode: 'MANPOWER_ROTATION_TRACKER', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 8, roleCode: 'SYSTEM_ADMIN', moduleCode: 'PTW_PERMITS', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 9, roleCode: 'SYSTEM_ADMIN', moduleCode: 'SAFETY_GAS_TESTING', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 10, roleCode: 'SYSTEM_ADMIN', moduleCode: 'SAFETY_ERT_READINESS', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 11, roleCode: 'SYSTEM_ADMIN', moduleCode: 'SAFETY_OVERVIEW', canRead: true, canCreate: true, canUpdate: true, canDelete: true, canApprove: true, isReadOnlyForced: false },

  // SITE_MANAGER: read all, create/update PTW+WO(row-level), approve PTW/WO/Shift/CAR
  { rolePermissionId: 12, roleCode: 'SITE_MANAGER', moduleCode: 'HQ_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 13, roleCode: 'SITE_MANAGER', moduleCode: 'LNG_PROCESS_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 14, roleCode: 'SITE_MANAGER', moduleCode: 'EQUIPMENT_ASSET_REGISTRY', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 15, roleCode: 'SITE_MANAGER', moduleCode: 'WORK_ORDER_DIRECTORY', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 16, roleCode: 'SITE_MANAGER', moduleCode: 'MAINTENANCE_MRO_HUB', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 17, roleCode: 'SITE_MANAGER', moduleCode: 'MANPOWER_DAILY_SHIFT', canRead: true, canCreate: false, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 18, roleCode: 'SITE_MANAGER', moduleCode: 'MANPOWER_ROTATION_TRACKER', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 19, roleCode: 'SITE_MANAGER', moduleCode: 'PTW_PERMITS', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 20, roleCode: 'SITE_MANAGER', moduleCode: 'SAFETY_GAS_TESTING', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 21, roleCode: 'SITE_MANAGER', moduleCode: 'SAFETY_ERT_READINESS', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 22, roleCode: 'SITE_MANAGER', moduleCode: 'SAFETY_OVERVIEW', canRead: true, canCreate: false, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },

  // ACTING_SITE_MANAGER: mirrors SITE_MANAGER but approve limited to PTW Stage 4 / SM-absence approval
  { rolePermissionId: 23, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'HQ_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 24, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'LNG_PROCESS_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 25, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'EQUIPMENT_ASSET_REGISTRY', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 26, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'WORK_ORDER_DIRECTORY', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 27, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'MAINTENANCE_MRO_HUB', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 28, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'MANPOWER_DAILY_SHIFT', canRead: true, canCreate: false, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 29, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'MANPOWER_ROTATION_TRACKER', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 30, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'PTW_PERMITS', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 31, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'SAFETY_GAS_TESTING', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 32, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'SAFETY_ERT_READINESS', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 33, roleCode: 'ACTING_SITE_MANAGER', moduleCode: 'SAFETY_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },

  // OPERATION_TEAM_LEADER: site/operational modules only
  { rolePermissionId: 34, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'HQ_OVERVIEW', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 35, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'LNG_PROCESS_OVERVIEW', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 36, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'EQUIPMENT_ASSET_REGISTRY', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 37, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'WORK_ORDER_DIRECTORY', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 38, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'MAINTENANCE_MRO_HUB', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 39, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'MANPOWER_DAILY_SHIFT', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 40, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'MANPOWER_ROTATION_TRACKER', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 41, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'PTW_PERMITS', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 42, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'SAFETY_GAS_TESTING', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 43, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'SAFETY_ERT_READINESS', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 44, roleCode: 'OPERATION_TEAM_LEADER', moduleCode: 'SAFETY_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },

  // HSSE_OFFICER: safety/PTW modules only
  { rolePermissionId: 45, roleCode: 'HSSE_OFFICER', moduleCode: 'HQ_OVERVIEW', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 46, roleCode: 'HSSE_OFFICER', moduleCode: 'LNG_PROCESS_OVERVIEW', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 47, roleCode: 'HSSE_OFFICER', moduleCode: 'EQUIPMENT_ASSET_REGISTRY', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 48, roleCode: 'HSSE_OFFICER', moduleCode: 'WORK_ORDER_DIRECTORY', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 49, roleCode: 'HSSE_OFFICER', moduleCode: 'MAINTENANCE_MRO_HUB', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 50, roleCode: 'HSSE_OFFICER', moduleCode: 'MANPOWER_DAILY_SHIFT', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 51, roleCode: 'HSSE_OFFICER', moduleCode: 'MANPOWER_ROTATION_TRACKER', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 52, roleCode: 'HSSE_OFFICER', moduleCode: 'PTW_PERMITS', canRead: true, canCreate: false, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 53, roleCode: 'HSSE_OFFICER', moduleCode: 'SAFETY_GAS_TESTING', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 54, roleCode: 'HSSE_OFFICER', moduleCode: 'SAFETY_ERT_READINESS', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 55, roleCode: 'HSSE_OFFICER', moduleCode: 'SAFETY_OVERVIEW', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },

  // WORK_LEADER_TECH: assigned WO + TBM sign only (row-level filtering required at query level)
  { rolePermissionId: 56, roleCode: 'WORK_LEADER_TECH', moduleCode: 'HQ_OVERVIEW', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 57, roleCode: 'WORK_LEADER_TECH', moduleCode: 'LNG_PROCESS_OVERVIEW', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 58, roleCode: 'WORK_LEADER_TECH', moduleCode: 'EQUIPMENT_ASSET_REGISTRY', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 59, roleCode: 'WORK_LEADER_TECH', moduleCode: 'WORK_ORDER_DIRECTORY', canRead: true, canCreate: true, canUpdate: true, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 60, roleCode: 'WORK_LEADER_TECH', moduleCode: 'MAINTENANCE_MRO_HUB', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 61, roleCode: 'WORK_LEADER_TECH', moduleCode: 'MANPOWER_DAILY_SHIFT', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 62, roleCode: 'WORK_LEADER_TECH', moduleCode: 'MANPOWER_ROTATION_TRACKER', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 63, roleCode: 'WORK_LEADER_TECH', moduleCode: 'PTW_PERMITS', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: true, isReadOnlyForced: false },
  { rolePermissionId: 64, roleCode: 'WORK_LEADER_TECH', moduleCode: 'SAFETY_GAS_TESTING', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 65, roleCode: 'WORK_LEADER_TECH', moduleCode: 'SAFETY_ERT_READINESS', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 66, roleCode: 'WORK_LEADER_TECH', moduleCode: 'SAFETY_OVERVIEW', canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },

  // HQ_SUPERVISOR_AUDITOR: read-only everywhere except own HQ_OVERVIEW home module (forced read-only on all Site modules)
  { rolePermissionId: 67, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'HQ_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: false },
  { rolePermissionId: 68, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'LNG_PROCESS_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 69, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'EQUIPMENT_ASSET_REGISTRY', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 70, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'WORK_ORDER_DIRECTORY', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 71, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'MAINTENANCE_MRO_HUB', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 72, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'MANPOWER_DAILY_SHIFT', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 73, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'MANPOWER_ROTATION_TRACKER', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 74, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'PTW_PERMITS', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 75, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'SAFETY_GAS_TESTING', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 76, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'SAFETY_ERT_READINESS', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
  { rolePermissionId: 77, roleCode: 'HQ_SUPERVISOR_AUDITOR', moduleCode: 'SAFETY_OVERVIEW', canRead: true, canCreate: false, canUpdate: false, canDelete: false, canApprove: false, isReadOnlyForced: true },
];

export function getEffectivePermission(
  roleCode: RoleCode,
  moduleCode: ModuleCode
): RolePermission | null {
  return (
    ROLE_PERMISSIONS.find(
      (row) => row.roleCode === roleCode && row.moduleCode === moduleCode
    ) ?? null
  );
}
