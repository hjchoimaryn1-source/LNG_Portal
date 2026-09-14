// src/cmms-auth/roleTierMap.ts
//
// Static department -> Sr. Team Leader tier mapping. Department identifiers
// mirror the categories already used across the manpower module (see
// getStaffDepartmentCategory() in NIAS_Portal_Full_Context.md derivations:
// 'OPERATIONS' | 'MAINTENANCE' | 'HSSE' | 'LOGISTICS' | 'HR_GA'). No DB access.

import type { RoleTier } from './rbacTypes';

export type DepartmentId = 'OPERATIONS' | 'MAINTENANCE' | 'HSSE' | 'LOGISTICS' | 'HR_GA';

export const DEPARTMENT_SR_TEAM_LEADER_TIER: Record<DepartmentId, RoleTier> = {
  OPERATIONS: 'SR_TEAM_LEADER_OPERATIONS',
  MAINTENANCE: 'SR_TEAM_LEADER_MAINTENANCE',
  HSSE: 'SR_TEAM_LEADER_HSSE',
  LOGISTICS: 'SR_TEAM_LEADER_LOGISTICS',
  HR_GA: 'SR_TEAM_LEADER_HR_GA',
};
