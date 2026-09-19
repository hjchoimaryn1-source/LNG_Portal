// src/lib/rbac/sessionPermissionResolver.ts
//
// PURPOSE
//   resolveSessionPermissionCore()의 얇은 서버 어댑터 — 실제 getUserSecurityDb()
//   연결만 붙인다. userSecuritySessionMiddleware.ts와 동일 패턴(전용 테스트
//   파일 없음 — 로직 자체는 sessionPermissionCore.test.ts가 검증한다).
//
//   이 함수는 서버(Next.js Route Handler) 전용이다 — node:sqlite 체인을 타므로
//   'use client' 컴포넌트/훅에서 직접 호출할 수 없다. Stage 2A-ii에서는 14개
//   서버 라우트만 이 함수로 전환했고, activeSession 기반 13개 클라이언트
//   호출부는 별도 스테이지로 이연했다(최종 보고서 참조).

import { getUserSecurityDb } from './userSecurityDbSingleton';
import { resolveSessionPermissionCore } from './sessionPermissionCore';
import type { ModuleCode, RolePermission } from '../../types/rbac';

export function resolveSessionPermission(employeeId: string, moduleCode: ModuleCode): RolePermission | null {
  return resolveSessionPermissionCore(getUserSecurityDb(), employeeId, moduleCode);
}

// Stage 3 — the only 6 ModuleCodes with a live client-side permission check
// (Stage 2A-i inventory). Used to precompute a permissions map the login/session
// HTTP responses hand to the client, so client hooks never need direct DB access
// (resolveSessionPermission() itself is server-only, see file header).
const CLIENT_MODULE_CODES: ModuleCode[] = [
  'WORK_ORDER_DIRECTORY',
  'DAILY_OPS_REPORT',
  'DAILY_OPS_PATROL_ENTRY',
  'PTW_PERMITS',
  'ALARM_ACTION_LOG',
  'MAINTENANCE_MRO_HUB',
];

export function buildClientPermissionsMap(employeeId: string): Partial<Record<ModuleCode, RolePermission>> {
  const map: Partial<Record<ModuleCode, RolePermission>> = {};
  for (const moduleCode of CLIENT_MODULE_CODES) {
    const permission = resolveSessionPermission(employeeId, moduleCode);
    if (permission) map[moduleCode] = permission;
  }
  return map;
}
