// src/lib/rbac/userSecurityLoginDirectoryDao.ts
//
// PURPOSE
//   Part C 로그인 화면(선택형 카드 그리드)용 조회 전용 DAO. user_accounts와
//   personnel_master를 JOIN해 "비밀번호 없이 화면에 표시해도 되는" 필드만
//   반환한다 — password_hash/failed_attempt_count 등은 절대 포함하지 않는다.
//   ACTIVE 계정만 노출(LOCKED/DISABLED는 의도적으로 제외 — LoginGateway.tsx의
//   수동 입력 폴백으로만 접근 가능해야 한다).
//
//   2026-09-19(HJ 지시): ADMIN은 HQ에서 관리되는 계정이라 현장 11명과 나란히
//   드롭다운에 노출하지 않는다 — role_code='ADMIN'을 쿼리에서 제외한다. ADMIN도
//   여전히 로그인은 가능해야 하므로(제외되는 건 "드롭다운 노출"뿐, 계정 자체가
//   아님) LoginGateway.tsx의 "Sign in with another account" 수동 입력 폴백으로
//   접근한다 — 그 경로는 이미 임의 username을 받으므로 별도 특별취급이 불필요.
//
//   2026-09-19(HJ 지시, 3차): 그룹 정렬 순서를 조직 위계(SITE_MANAGER ->
//   OP_TEAM -> HSSE -> MAINTENANCE -> LOGISTIC -> HR)로 고정한다. role_code
//   문자열 알파벳순(예: HR/HSSE/LOGISTIC/MAINTENANCE/OP_TEAM/SITE_MANAGER)에
//   기대던 기존 ORDER BY는 이 순서와 무관하고 우연히도 맞지 않았다 — 지금까지는
//   화면에 보이는 최종 순서가 UserDropdownSelect.tsx의 클라이언트 재정렬
//   (STAGE1_ROLE_CODES 기준)로만 보장되고 있었는데, 이 DAO를 직접 쓰는 다른
//   소비자가 생기면 그 보장이 깨진다. CASE 기반 rank 컬럼으로 명시해 SQL
//   자체에서도 결정적으로 고정한다(userSecurityLoginDirectoryDao.test.ts 참조).
//
//   2026-09-19(HJ 지시, 4차): role_code 그룹 내부에서도 fullName 알파벳순만으론
//   부족한 경우(Shadiq M. Shalih — Sr. OP Team Leader — 가 OP_TEAM 그룹 맨
//   위에 와야 함)가 생겨, personnel_master.display_rank(userSecuritySchema.ts)
//   를 2차 정렬 키로 추가한다. NULL은 항상 순번이 있는 행보다 뒤로 정렬되도록
//   `display_rank IS NULL`을 먼저 비교(SQLite에서 IS NULL은 0/1로 평가되므로
//   NOT NULL=0이 먼저, NULL=1이 나중)하고, 그다음 display_rank ASC, 마지막
//   fullName ASC로 동률을 정리한다. UserDropdownSelect.tsx도 이 순서를 그대로
//   재현하도록 같은 규칙으로 클라이언트 재정렬 로직을 갱신했다(DAO의 ORDER BY와
//   클라이언트 재정렬이 항상 같은 결과를 내야 함 — 3차 지시와 동일한 이유).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { Stage1RoleCode } from './userSecurityRolePermissionSeed';

export interface LoginDirectoryEntry {
  username: string;
  roleCode: Stage1RoleCode;
  fullName: string;
  displayRank: number | null;
}

interface LoginDirectoryRow {
  username: string;
  role_code: Stage1RoleCode;
  full_name: string;
  display_rank: number | null;
}

const SELECT_LOGIN_DIRECTORY_SQL = `
  SELECT ua.username AS username, ua.role_code AS role_code, pm.full_name AS full_name, pm.display_rank AS display_rank
  FROM user_accounts ua
  JOIN personnel_master pm ON pm.employee_id = ua.employee_id
  WHERE ua.account_status = 'ACTIVE' AND ua.role_code != 'ADMIN'
  ORDER BY
    CASE ua.role_code
      WHEN 'SITE_MANAGER' THEN 1
      WHEN 'OP_TEAM' THEN 2
      WHEN 'HSSE' THEN 3
      WHEN 'MAINTENANCE' THEN 4
      WHEN 'LOGISTIC' THEN 5
      WHEN 'HR' THEN 6
      ELSE 7
    END,
    pm.display_rank IS NULL,
    pm.display_rank ASC,
    pm.full_name ASC
`;

/** ACTIVE 계정만 username/roleCode/fullName/displayRank로 반환한다(비밀번호 등 민감정보 제외). */
export function listLoginDirectory(db: SqlExecutor): LoginDirectoryEntry[] {
  return db.all<LoginDirectoryRow>(SELECT_LOGIN_DIRECTORY_SQL).map((row) => ({
    username: row.username,
    roleCode: row.role_code,
    fullName: row.full_name,
    displayRank: row.display_rank,
  }));
}
