// RBAC Session Guard 타입 명세 — CMMS_Architecture.md §3.3.3 참조
// resolveEffectivePermission(src/lib/rbac/guardrails.ts)은 Phase 1-3 감사에서
// 구현 완료가 확인되었으며, OverviewCalibrationRoutes.tsx 등 실제 프로덕션
// 라우팅 지점에서 HQ->SITE 크로스 컨텍스트 권한 판정에 사용 중이다.
// validateApprovalGuardrails 역시 guardrails.ts에 구현되어 있다. Sector 6
// 라우팅 연동만 별도 승인 전까지 미구현 (§3.1.1 Gap Note 참조).

export type RoleCode =
  | 'SYSTEM_ADMIN'
  | 'SITE_MANAGER'
  | 'ACTING_SITE_MANAGER'
  | 'OPERATION_TEAM_LEADER'
  | 'HSSE_OFFICER'
  | 'WORK_LEADER_TECH'
  | 'HQ_SUPERVISOR_AUDITOR';

export type ModuleCode =
  | 'HQ_OVERVIEW'
  | 'LNG_PROCESS_OVERVIEW'
  | 'EQUIPMENT_ASSET_REGISTRY'
  | 'WORK_ORDER_DIRECTORY'
  | 'MAINTENANCE_MRO_HUB'
  | 'MANPOWER_DAILY_SHIFT'
  | 'MANPOWER_ROTATION_TRACKER'
  | 'PTW_PERMITS'
  | 'SAFETY_GAS_TESTING'
  | 'SAFETY_ERT_READINESS'
  | 'SAFETY_OVERVIEW';

export interface RolePermission {
  rolePermissionId: number;
  roleCode: RoleCode;
  moduleCode: ModuleCode;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  isReadOnlyForced: boolean;
}
