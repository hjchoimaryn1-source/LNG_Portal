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
