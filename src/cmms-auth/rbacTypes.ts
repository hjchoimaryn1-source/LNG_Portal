// src/cmms-auth/rbacTypes.ts
//
// Pure type definitions for Phase 8 Staff PIN Auth / RBAC role tiers.
// No logic, no imports from outside this file (Stage 0 Task 5/6 boundary rule:
// this module must stay import-free so it can never accidentally pull in
// ptwStatusMapper / gasSafetyAdapter / simopsDbAdapter).

// One base OPERATOR tier + one Sr. Team Leader tier per department
// (see roleTierMap.ts for the department -> tier mapping) + SITE_MANAGER.
export type RoleTier =
  | 'OPERATOR'
  | 'SR_TEAM_LEADER_OPERATIONS'
  | 'SR_TEAM_LEADER_MAINTENANCE'
  | 'SR_TEAM_LEADER_HSSE'
  | 'SR_TEAM_LEADER_LOGISTICS'
  | 'SR_TEAM_LEADER_HR_GA'
  | 'SITE_MANAGER';

export interface EffectiveRole {
  staffId: string;
  tier: RoleTier;
  isDelegated: boolean;
  delegatedFrom?: string;
  validUntil?: string;
}

// Hand-constructable delegation record shape consumed by resolveEffectiveRole.ts.
// Deliberately decoupled from the `approval_delegations` DB schema — wiring a
// real data source to this shape is deferred to delegationAdapter.ts (not in scope here).
export interface DelegationRecord {
  originalStaffId: string;
  delegateStaffId: string;
  tier: RoleTier;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
