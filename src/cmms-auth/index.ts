// src/cmms-auth/index.ts
//
// Barrel — the only import surface other files should use for Phase 8 auth.
// Composes: PIN verification (staffCredentialsDb) + session issuance
// (sessionStore) + role resolution (resolveEffectiveRole), now backed by real
// delegation records (delegationAdapter.ts) and audit-log identity
// (authAuditBridge.ts).

import { verifyStaffPin, getStaffDepartment, upsertStaffCredential } from './staffCredentialsDb';
import { createSession, type AuthSession } from './sessionStore';
import { resolveEffectiveRole } from './resolveEffectiveRole';
import { isReauthRequired } from './shiftBoundaryMonitor';
import { selectAllDelegationRecords } from './delegationAdapter';
import { getDevStaffPin } from './devStaffPins';
import type { EffectiveRole } from './rbacTypes';

export {
  createDelegation,
  delegateSiteManagerAuthority,
  revokeDelegation,
  selectAllDelegationRecords,
  type CreateDelegationInput,
} from './delegationAdapter';

export {
  recordApprovalAction,
  selectAuditLogByReference,
  type ApprovalActionType,
  type RecordApprovalActionInput,
  type RecordApprovalActionResult,
  type AuditLogEntry,
} from './authAuditBridge';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h — session lifetime unrelated to shift-boundary re-auth signal

// DEV-ONLY bootstrap: real PIN issuance doesn't exist yet (userAccountsSeed.ts
// has no PIN policy — see devStaffPins.ts). Each seed account is
// auto-provisioned with its fixed dev PIN on first use so authenticate() has a
// real (non-mocked) credential check to run against in the meantime. Remove
// once a real PIN-entry/provisioning flow exists.
export function ensureDevQuickLoginCredential(staffId: string, departmentId: string): void {
  if (getStaffDepartment(staffId) === undefined) {
    upsertStaffCredential(staffId, getDevStaffPin(staffId), departmentId);
  }
}

export interface AuthenticateResult {
  success: boolean;
  session?: AuthSession;
  effectiveRole?: EffectiveRole;
  reason?: string;
}

export function authenticate(pin: string, staffId: string): AuthenticateResult {
  const pinValid = verifyStaffPin(staffId, pin);
  if (!pinValid) {
    return { success: false, reason: 'INVALID_PIN' };
  }

  const session = createSession(staffId, SESSION_TTL_MS);
  const delegationRecords = selectAllDelegationRecords();
  const effectiveRole = resolveEffectiveRole(staffId, delegationRecords, new Date());

  return { success: true, session, effectiveRole };
}

export function checkShiftBoundary(session: AuthSession, now: Date = new Date()): boolean {
  return isReauthRequired(session.issuedAt, now);
}
