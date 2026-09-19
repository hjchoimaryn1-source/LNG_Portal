// src/lib/rbac/activeSessionStore.ts
//
// In-memory session bridge, in front of the actual Stage 1B session (httpOnly
// cookie, /api/v1/cmms/user-security/login). LoginGateway.tsx's username/
// password form calls setActiveSession() on a successful login response;
// every RBAC call site (client hooks/components) subscribes via
// useActiveSession() instead of hitting the server directly for permission
// data (that data arrives precomputed in the login response — see
// permissions below).
// Resets on page refresh (in-memory only) — a refresh currently forces
// re-login; this store does not itself read back the httpOnly cookie (it
// can't, by design) or restore state from it. CMMS_Architecture.md §3.5.
//
// Stage 3 (2026-09-19, full PIN-login replacement, HJ decision): roleCode is
// now the new Stage 1 vocabulary (Stage1RoleCode: ADMIN/SITE_MANAGER/OP_TEAM/
// HSSE/MAINTENANCE/LOGISTIC/HR). permissions is the delegation-aware
// RolePermission map the server already computed via resolveSessionPermission()
// for the 6 modules with a live client-side check (sessionPermissionResolver.ts's
// buildClientPermissionsMap) — client call sites read permissions[moduleCode]
// directly instead of recomputing anything themselves; this is a UX-only
// mirror of the same data the migrated server routes authoritatively enforce.
//
// homeLocation has no equivalent field in the Stage 1 schema (personnel_master
// only has department_group, not a HQ/SITE distinction) — LoginGateway.tsx
// derives it as 'HQ' for ADMIN (matching the retired SYSTEM_ADMIN/DEV-HQ-001
// precedent) and 'SITE' for every other role. This only feeds
// resolveEffectivePermission()'s HQ->SITE cross-context DOA check
// (OverviewCalibrationRoutes.tsx) — flagged as an interim default, not a
// real HQ/SITE modeling decision.
//
// effectiveRole (Phase 8 RoleTier) is dropped — it was never read off
// ActiveSession by anything (confirmed via repo search), only set and never
// consumed.

import { useSyncExternalStore } from 'react';
import type { ModuleCode, RolePermission } from '../../types/rbac';
import type { Stage1RoleCode } from './userSecurityRolePermissionSeed';

export interface ActiveSession {
  employeeId: string;
  roleCode: Stage1RoleCode;
  homeLocation: 'HQ' | 'SITE';
  permissions: Partial<Record<ModuleCode, RolePermission>>;
  /** Part A(2026-09-19) — 로그인 응답의 mustChangePassword 미러. 기존 호출부(약
   *  15개 테스트 파일)를 깨지 않기 위해 optional로 둔다: 생략 시 false와 동일하게
   *  취급한다(LoginGateway.tsx만 이 필드를 실제로 채워 넣는다). */
  mustChangePassword?: boolean;
}

let activeSession: ActiveSession | null = null;
const listeners = new Set<() => void>();

export function setActiveSession(session: ActiveSession): void {
  activeSession = session;
  listeners.forEach((listener) => listener());
}

export function clearActiveSession(): void {
  activeSession = null;
  listeners.forEach((listener) => listener());
}

export function getActiveSession(): ActiveSession | null {
  return activeSession;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getServerSnapshot(): ActiveSession | null {
  return null;
}

export function useActiveSession(): ActiveSession | null {
  return useSyncExternalStore(subscribe, getActiveSession, getServerSnapshot);
}
