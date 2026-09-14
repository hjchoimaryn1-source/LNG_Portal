// src/cmms-auth/resolveEffectiveRole.ts
//
// Pure delegation-resolution function. Takes delegation records as a parameter
// instead of querying `approval_delegations` directly — wiring a real data
// source (delegationAdapter.ts) is explicitly out of scope for this file.

import type { DelegationRecord, EffectiveRole } from './rbacTypes';

export function resolveEffectiveRole(
  staffId: string,
  delegationRecords: DelegationRecord[],
  now: Date
): EffectiveRole {
  const activeDelegation = delegationRecords.find((record) => {
    if (record.delegateStaffId !== staffId || !record.isActive) return false;
    const start = new Date(record.startDate);
    const end = new Date(record.endDate);
    return start <= now && end > now;
  });

  if (activeDelegation) {
    return {
      staffId,
      tier: activeDelegation.tier,
      isDelegated: true,
      delegatedFrom: activeDelegation.originalStaffId,
      validUntil: activeDelegation.endDate,
    };
  }

  return {
    staffId,
    tier: 'OPERATOR',
    isDelegated: false,
  };
}
