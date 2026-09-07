export interface ManagerOverrideRecord {
  id: string;
  staffId: string;
  staffName: string;
  targetDate: string; // YYYY-MM-DD
  overrideType: 'EXTEND_STAY_14D' | 'FORCE_SHIFT';
  assignedShift: 'D' | 'N' | 'R' | 'OFF';
  reason: string;
  approvedBy: string;
  approvedAt: string;
}

export type OverstayTier = 'NORMAL' | 'TIER_1_MANAGER_14D' | 'TIER_2_HQ_DIRECTOR';

export interface OverstayGuardrailResult {
  tier: OverstayTier;
  notice: string;
  isCompliant: boolean;
  requiresHqApproval: boolean;
}

export function evaluateOverstayGuardrail(onSiteDays: number): OverstayGuardrailResult {
  if (onSiteDays <= 90) {
    return {
      tier: 'NORMAL',
      notice: 'Normal rotation hitch',
      isCompliant: true,
      requiresHqApproval: false,
    };
  }

  if (onSiteDays <= 104) {
    return {
      tier: 'TIER_1_MANAGER_14D',
      notice: 'Tier 1: Site Manager Authorized Extension (Within 14-day limit / 154h Fatigue Rule)',
      isCompliant: true,
      requiresHqApproval: false,
    };
  }

  return {
    tier: 'TIER_2_HQ_DIRECTOR',
    notice: 'Tier 2: Exceeds 14-day extension! Requires HQ Director & Fit-to-Work MCU approval',
    isCompliant: false,
    requiresHqApproval: true,
  };
}
