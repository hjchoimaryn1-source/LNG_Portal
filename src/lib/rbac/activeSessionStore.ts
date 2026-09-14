// src/lib/rbac/activeSessionStore.ts
//
// DEV-ONLY in-memory session bridge. LoginGateway.tsx의 Quick-Login 카드 클릭이
// setActiveSession()으로 세션을 기록하면, resolveEffectivePermission/blockIfAuditorMode를
// 호출하는 지점(OverviewCalibrationRoutes.tsx 등)이 useActiveSession()으로 구독해
// 더 이상 하드코딩된 세션 스텁을 쓰지 않는다.
// 새로고침 시 초기화되며 user_sessions 테이블/토큰 발급을 대체하지 않는다 — 실제
// 세션 백엔드 도입 전까지의 임시 어댑터. CMMS_Architecture.md §3.5 참조.
//
// effectiveRole은 Phase 8 Stage 3에서 추가된 부가 필드다 — src/cmms-auth의
// EffectiveRole(RoleTier, 위임 인지)을 실어 나르기만 할 뿐, roleCode(RoleCode)는
// 그대로 두었다. evaluateMutationGuardrails({ roleCode })를 호출하는 8개
// 프로덕션 소비처(useWorkOrders.ts, PTWStatusActions.tsx 등)는 무수정 — RoleCode/
// RoleTier를 서로 파생시키는 결합은 별도 승인 대상으로 남겨둔다.

import { useSyncExternalStore } from 'react';
import type { RoleCode } from '../../types/rbac';
import type { EffectiveRole } from '../../cmms-auth/rbacTypes';

export interface ActiveSession {
  userId: string;
  roleCode: RoleCode;
  homeLocation: 'HQ' | 'SITE';
  effectiveRole?: EffectiveRole;
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
