// src/lib/rbac/userSecurityBootstrapSeed.ts
//
// PURPOSE
//   부트스트랩 ADMIN 계정 1건 시딩 — employee_id='ADMIN-001'(현장 BSG 로스터
//   포맷에 해당 없음, 지시에 따른 placeholder), username='admin'.
//
//   full_name/position_title은 기존 src/lib/rbac/userAccountsSeed.ts의
//   DEV-HQ-001 계정(roleCode: SYSTEM_ADMIN, displayName: "Choi Hong-joon" —
//   Operation Manpower Roster.csv에 매칭 없어 현장 인력이 아닌 개발자/관리자
//   계정으로 이미 지정된 이력, src/cmms-auth/devStaffPins.ts 주석 동일)를
//   그대로 재사용한다 — 새 이름을 추측하지 않는다.
//
//   임시 비밀번호는 매 프로세스 시작마다 재발급하지 않는다: username='admin'
//   행이 이미 있으면 완전히 건너뛴다(이미 로그인해 비밀번호를 바꿨을 수 있는
//   실제 운영 계정을 서버 재시작마다 초기화하면 안 됨). 최초 1회에 한해 평문
//   임시 비밀번호를 콘솔에 1회 출력하고, DB에는 해시만 저장한다 — 하드코딩된
//   고정값 금지, 소스에 커밋되지 않음(요청 지시 원문).

import type { DatabaseSync } from 'node:sqlite';
import { hashPassword, generateTempPassword } from './passwordHash';

export const BOOTSTRAP_EMPLOYEE_ID = 'ADMIN-001';
export const BOOTSTRAP_USERNAME = 'admin';

const SELECT_EXISTING_SQL = `SELECT account_id FROM user_accounts WHERE username = @username`;

const INSERT_PERSONNEL_SQL = `
  INSERT INTO personnel_master (employee_id, full_name, position_title, department_group, employment_status)
  VALUES (@employeeId, @fullName, @positionTitle, 'ADMIN', 'ACTIVE')
`;

const INSERT_ACCOUNT_SQL = `
  INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code, must_change_password)
  VALUES (@accountId, @employeeId, @username, @passwordHash, 'ADMIN', 1)
`;

/** user_accounts에 부트스트랩 ADMIN 계정이 없을 때만 1건 생성한다(멱등). */
export function seedBootstrapAdminAccount(raw: DatabaseSync): void {
  const existing = raw.prepare(SELECT_EXISTING_SQL).get({ username: BOOTSTRAP_USERNAME });
  if (existing) return;

  const tempPassword = generateTempPassword();
  const passwordHash = hashPassword(tempPassword);

  raw.prepare(INSERT_PERSONNEL_SQL).run({
    employeeId: BOOTSTRAP_EMPLOYEE_ID,
    fullName: 'Choi Hong-joon',
    positionTitle: 'System Administrator',
  });
  raw.prepare(INSERT_ACCOUNT_SQL).run({
    accountId: BOOTSTRAP_EMPLOYEE_ID,
    employeeId: BOOTSTRAP_EMPLOYEE_ID,
    username: BOOTSTRAP_USERNAME,
    passwordHash,
  });

  // eslint-disable-next-line no-console -- 최초 1회, 임시 비밀번호를 전달할 유일한 경로.
  console.log(
    `[user-security-bootstrap] ADMIN account created: username=${BOOTSTRAP_USERNAME} employeeId=${BOOTSTRAP_EMPLOYEE_ID} ` +
      `tempPassword=${tempPassword} (must_change_password=1 — change on first login; printed once, not persisted in plaintext).`
  );
}
