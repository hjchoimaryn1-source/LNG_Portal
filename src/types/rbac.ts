// RBAC Session Guard 타입 명세 — CMMS_Architecture.md §3.3.3 참조
// resolveEffectivePermission / validateApprovalGuardrails 및 Sector 6 라우팅 연동은
// 별도 승인 전까지 구현하지 않음 (§3.1.1 Gap Note 참조).

export type RBACRole =
  | 'ORIGINATOR'
  | 'HSSE_OFFICER'
  | 'SITE_MANAGER'
  | 'DELEGATED_APPROVER'
  | 'AUDITOR';

export type SessionAccessMode = 'INTERACTIVE' | 'READ_ONLY_AUDIT';

export interface RBACSessionGuard {
  sessionId: string;
  personId: string;
  role: RBACRole;
  accessMode: SessionAccessMode;
  isAuditorMode: boolean;
  grantedScopes: string[];
  sessionIssuedAt: string;
  sessionExpiresAt: string;
  delegatedFromPersonId?: string | null;
}

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
