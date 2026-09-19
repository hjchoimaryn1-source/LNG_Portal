// src/scripts/seedStage1PersonnelAccounts.ts
//
// PURPOSE
//   Part B(2026-09-19, HJ 지시) — 레거시 Operation Manpower Roster.csv /
//   STAFF_MASTER_DATA(src/data/01_raw_docs/manpowerMasterData.ts)에 실존하는
//   12명의 BSG employee_id를 그대로 재사용해 personnel_master + user_accounts
//   행을 1건씩 생성한다. employee_id 재검증 결과, 두 소스(CSV/STAFF_MASTER_DATA)
//   12명 전원 완전히 일치(2026-09-19 교차검증 완료) — 새 ID를 추측하지 않는다.
//
//   ADMIN(ADMIN-001/admin)은 userSecurityBootstrapSeed.ts가 이미 별도로 시딩하므로
//   이 스크립트의 대상에서 제외한다(지시 원문).
//
//   멱등: personnel_master는 employee_id PK 충돌 시, user_accounts는 username
//   UNIQUE 충돌 시 각각 건너뛴다 — 재실행해도 중복 생성/덮어쓰기 없음.
//
// CLI 사용
//   $ npx tsx src/scripts/seedStage1PersonnelAccounts.ts

import { createNodeSqliteExecutor } from '../adapters/db/nodeSqliteExecutor';
import { ensureUserSecurityTables } from '../lib/rbac/userSecuritySchema';
import { hashPassword } from '../lib/rbac/passwordHash';
import { writeUserAccountAudit } from '../lib/rbac/userAccountAuditLog';
import type { Stage1RoleCode } from '../lib/rbac/userSecurityRolePermissionSeed';

const INITIAL_PASSWORD = 'Nias2026!';

interface SeedPersonnel {
  employeeId: string;
  fullName: string;
  positionTitle: string;
  roleCode: Stage1RoleCode;
  username: string;
  /** userSecurityLoginDirectoryDao.ts의 그룹 내 2차 정렬 키(4차 지시). 대부분 NULL(fullName 알파벳순). */
  displayRank?: number;
}

// Operation Manpower Roster.csv / STAFF_MASTER_DATA 교차검증 완료된 12명 (2026-09-19).
const SEED_PERSONNEL: SeedPersonnel[] = [
  { employeeId: 'BSG259529', fullName: 'Edi Hermawan', positionTitle: 'Site Manager', roleCode: 'SITE_MANAGER', username: 'edi' },
  // Sr. OP Team Leader — 새 role_code를 만들지 않고 OP_TEAM 그룹 안에서 표시
  // 순서만 최상단으로 고정(HJ 지시, 4차, NP07 SOP 위계 아님 — 화면 표시 전용).
  { employeeId: 'BSG259524', fullName: 'Shadiq M. Shalih', positionTitle: 'OP Team Leader', roleCode: 'OP_TEAM', username: 'shadiq', displayRank: 1 },
  { employeeId: 'BSG259833', fullName: 'Asman Sampeaman', positionTitle: 'OP Team Leader', roleCode: 'OP_TEAM', username: 'asman' },
  { employeeId: 'BSG259530', fullName: 'Juli Surungan', positionTitle: 'OP Team Leader', roleCode: 'OP_TEAM', username: 'juli' },
  { employeeId: 'BSG259641', fullName: 'Arsyan AN', positionTitle: 'HSE Officer', roleCode: 'HSSE', username: 'arsyan' },
  { employeeId: 'BSG259919', fullName: 'Chandra R.D', positionTitle: 'HSE Officer', roleCode: 'HSSE', username: 'chandra' },
  { employeeId: 'BSG259237', fullName: 'Indra Prabayugo', positionTitle: 'Mechanic Engineer', roleCode: 'MAINTENANCE', username: 'indra' },
  { employeeId: 'BSG259420', fullName: 'Agunawan', positionTitle: 'Maintenance E&I', roleCode: 'MAINTENANCE', username: 'agunawan' },
  { employeeId: 'BSG259245', fullName: 'Indra Parulian', positionTitle: 'Super Cargo', roleCode: 'LOGISTIC', username: 'parulian' },
  { employeeId: 'BSG259646', fullName: 'Rafi Anggara', positionTitle: 'Crane Operator', roleCode: 'LOGISTIC', username: 'rafi' },
  { employeeId: 'BSG259444', fullName: 'Albert A. Gea', positionTitle: 'HR / GA Officer', roleCode: 'HR', username: 'albert' },
  { employeeId: 'BSG199551', fullName: 'Jefi R. Zega', positionTitle: 'HR / GA Coordinator', roleCode: 'HR', username: 'jefi' },
];

const SELECT_PERSONNEL_SQL = `SELECT employee_id FROM personnel_master WHERE employee_id = @employeeId`;
const INSERT_PERSONNEL_SQL = `
  INSERT INTO personnel_master (employee_id, full_name, position_title, department_group, employment_status)
  VALUES (@employeeId, @fullName, @positionTitle, @departmentGroup, 'ACTIVE')
`;
// 이미 존재하는 행(과거 실행분)에도 display_rank를 반영해야 하므로 INSERT와
// 별개로 매 실행마다 무조건 적용한다(멱등 — 같은 값을 다시 써도 무해).
const UPDATE_DISPLAY_RANK_SQL = `UPDATE personnel_master SET display_rank = @displayRank WHERE employee_id = @employeeId`;
const SELECT_ACCOUNT_BY_USERNAME_SQL = `SELECT account_id FROM user_accounts WHERE username = @username`;
const INSERT_ACCOUNT_SQL = `
  INSERT INTO user_accounts (account_id, employee_id, username, password_hash, role_code, must_change_password)
  VALUES (@accountId, @employeeId, @username, @passwordHash, @roleCode, 1)
`;

interface SeedRowResult {
  username: string;
  employeeId: string;
  fullName: string;
  roleCode: Stage1RoleCode;
  personnelCreated: boolean;
  accountCreated: boolean;
}

export function seedStage1PersonnelAccounts(raw: ReturnType<typeof createNodeSqliteExecutor>['raw']): SeedRowResult[] {
  const results: SeedRowResult[] = [];

  for (const person of SEED_PERSONNEL) {
    let personnelCreated = false;
    let accountCreated = false;

    const existingPersonnel = raw.prepare(SELECT_PERSONNEL_SQL).get({ employeeId: person.employeeId });
    if (!existingPersonnel) {
      raw.prepare(INSERT_PERSONNEL_SQL).run({
        employeeId: person.employeeId,
        fullName: person.fullName,
        positionTitle: person.positionTitle,
        departmentGroup: person.roleCode,
      });
      personnelCreated = true;
    }

    if (person.displayRank !== undefined) {
      raw.prepare(UPDATE_DISPLAY_RANK_SQL).run({ employeeId: person.employeeId, displayRank: person.displayRank });
    }

    const existingAccount = raw.prepare(SELECT_ACCOUNT_BY_USERNAME_SQL).get({ username: person.username });
    if (!existingAccount) {
      raw.prepare(INSERT_ACCOUNT_SQL).run({
        accountId: person.employeeId,
        employeeId: person.employeeId,
        username: person.username,
        passwordHash: hashPassword(INITIAL_PASSWORD),
        roleCode: person.roleCode,
      });
      accountCreated = true;
    }

    results.push({
      username: person.username,
      employeeId: person.employeeId,
      fullName: person.fullName,
      roleCode: person.roleCode,
      personnelCreated,
      accountCreated,
    });
  }

  return results;
}

if (require.main === module) {
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const executor = createNodeSqliteExecutor(dbPath);
  ensureUserSecurityTables(executor.raw);

  const results = seedStage1PersonnelAccounts(executor.raw);

  for (const r of results) {
    if (r.personnelCreated) {
      writeUserAccountAudit(executor, {
        employeeId: r.employeeId,
        accountId: null,
        eventType: 'PERSONNEL_CREATED',
        actorAccountId: 'BOOTSTRAP_SEED',
        detail: `fullName=${r.fullName} roleCode=${r.roleCode}`,
      });
    }
    if (r.accountCreated) {
      writeUserAccountAudit(executor, {
        employeeId: r.employeeId,
        accountId: r.employeeId,
        eventType: 'ACCOUNT_CREATED',
        actorAccountId: 'BOOTSTRAP_SEED',
        detail: `username=${r.username} roleCode=${r.roleCode} (Part B batch seed)`,
      });
    }
  }

  console.log('\n[seed-stage1-personnel] 결과:');
  console.table(
    results.map((r) => ({
      username: r.username,
      employeeId: r.employeeId,
      fullName: r.fullName,
      roleCode: r.roleCode,
      personnel: r.personnelCreated ? 'CREATED' : 'SKIPPED(이미 존재)',
      account: r.accountCreated ? 'CREATED' : 'SKIPPED(이미 존재)',
    }))
  );
  console.log(`초기 비밀번호(공통): ${INITIAL_PASSWORD} — must_change_password=1, 최초 로그인 시 변경 필요.`);

  executor.close();
}
