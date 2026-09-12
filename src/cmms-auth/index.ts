// src/cmms-auth/index.ts
//
// Barrel — the only import surface other files should use for Phase 8 auth.
// Composes: PIN verification (staffCredentialsDb) + session issuance
// (sessionStore) + role resolution (resolveEffectiveRole).
//
// NOTE: delegationAdapter.ts (real `approval_delegations` data source for
// resolveEffectiveRole) is explicitly deferred/out of scope for this pass —
// authenticate() resolves with an empty delegation list, so every staff member
// authenticates at the base OPERATOR tier until that adapter exists.

import { verifyStaffPin, getStaffDepartment, upsertStaffCredential } from './staffCredentialsDb';
import { createSession, type AuthSession } from './sessionStore';
import { resolveEffectiveRole } from './resolveEffectiveRole';
import { isReauthRequired } from './shiftBoundaryMonitor';
import type { EffectiveRole } from './rbacTypes';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h — session lifetime unrelated to shift-boundary re-auth signal

// DEV-ONLY bootstrap: LoginGateway.tsx's Quick-Login cards have no PIN-entry
// UI yet (see Stage 0 §2 audit — click-to-login only). Every seed account is
// auto-provisioned with this fixed PIN on first use so authenticate() has a
// real (non-mocked) credential check to run against in the meantime. Remove
// once a real PIN-entry/provisioning flow exists (Phase 8 Stage 2).
export const DEV_QUICK_LOGIN_PIN = '0000';

export function ensureDevQuickLoginCredential(staffId: string, departmentId: string): void {
  if (getStaffDepartment(staffId) === undefined) {
    upsertStaffCredential(staffId, DEV_QUICK_LOGIN_PIN, departmentId);
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
  const effectiveRole = resolveEffectiveRole(staffId, [], new Date());

  return { success: true, session, effectiveRole };
}

export function checkShiftBoundary(session: AuthSession, now: Date = new Date()): boolean {
  return isReauthRequired(session.issuedAt, now);
}
