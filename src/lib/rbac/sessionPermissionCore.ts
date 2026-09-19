// src/lib/rbac/sessionPermissionCore.ts
//
// PURPOSE
//   Stage 2A-ii — employeeId 기반 위임 인지(delegation-aware) 권한 판정의
//   순수 로직. userSecuritySessionCore.ts와 동일 컨벤션으로 SqlExecutor를
//   주입받아, DB 싱글톤(cmmsDbSingleton.ts -> 'node:sqlite' 정적 value import
//   체인)을 이 파일에 끌어들이지 않는다 — vite-node가 그 체인을 정적으로
//   리졸브하지 못해 이 로직을 재사용하는 테스트가 깨지는 문제는
//   userSecuritySessionCore.ts 헤더 주석 참조. 실제 getUserSecurityDb() 연결은
//   sessionPermissionResolver.ts(얇은 래퍼, 전용 테스트 없음 —
//   userSecuritySessionMiddleware.ts와 동일 패턴)에서만 한다.
//
//   acting_as_site_manager_until이 설정되어 있고 아직 만료되지 않았으면(위임
//   활성) 본인 역할의 기본 권한에 SITE_MANAGER의 canApprove/canUnlockApproved
//   만 OR 병합한다 — canRead/canCreate/canUpdate/canDelete/isReadOnlyForced는
//   병합하지 않는다(역할 전체를 SITE_MANAGER로 바꾸는 것이 아니라 승인 권한만
//   위임하는 것이므로, HJ 확정 2026-09-19).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { ModuleCode, RolePermission } from '../../types/rbac';
import { getEffectivePermission } from './rolePermissionService';
import type { Stage1RoleCode } from './userSecurityRolePermissionSeed';

interface AccountRow {
  role_code: Stage1RoleCode;
  acting_as_site_manager_until: string | null;
}

const SELECT_ACCOUNT_SQL = `SELECT role_code, acting_as_site_manager_until FROM user_accounts WHERE employee_id = @employeeId`;

export function resolveSessionPermissionCore(
  db: SqlExecutor,
  employeeId: string,
  moduleCode: ModuleCode,
  now: Date = new Date()
): RolePermission | null {
  const account = db.get<AccountRow>(SELECT_ACCOUNT_SQL, { employeeId });
  if (!account) return null;

  const base = getEffectivePermission(account.role_code, moduleCode);
  if (!base) return null;

  const delegationActive =
    account.acting_as_site_manager_until !== null &&
    new Date(account.acting_as_site_manager_until).getTime() > now.getTime();

  if (!delegationActive) return base;

  const delegated = getEffectivePermission('SITE_MANAGER', moduleCode);
  if (!delegated) return base;

  return {
    ...base,
    canApprove: base.canApprove || delegated.canApprove,
    canUnlockApproved: (base.canUnlockApproved ?? false) || (delegated.canUnlockApproved ?? false),
  };
}
