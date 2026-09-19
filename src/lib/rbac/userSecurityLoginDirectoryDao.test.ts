import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureUserSecurityTables } from './userSecuritySchema';
import { createPersonnel } from './personnelMasterDao';
import { createAccount } from './userAccountAdminDao';
import { setAccountLock } from './userAccountAdminDao';
import { listLoginDirectory } from './userSecurityLoginDirectoryDao';
import type { Stage1RoleCode } from './userSecurityRolePermissionSeed';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

function createTestDb(): SqlExecutor {
  const raw = new DatabaseSync(':memory:');
  ensureUserSecurityTables(raw);
  return {
    run: (sql, params = {}) => {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).get(params) as T | undefined,
    all: <T,>(sql: string, params: Record<string, unknown> = {}) => raw.prepare(sql).all(params) as T[],
  };
}

function seedAccount(db: SqlExecutor, employeeId: string, fullName: string, roleCode: Stage1RoleCode, username: string) {
  createPersonnel(db, { employeeId, fullName, positionTitle: 'Staff', departmentGroup: roleCode }, 'BOOTSTRAP');
  return createAccount(db, { employeeId, username, roleCode }, 'BOOTSTRAP');
}

describe('userSecurityLoginDirectoryDao — listLoginDirectory', () => {
  let db: SqlExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it('orders groups by org hierarchy (SITE_MANAGER > OP_TEAM > HSSE > MAINTENANCE > LOGISTIC > HR), fullName alphabetically within a group when display_rank is NULL, regardless of insertion order', () => {
    // 의도적으로 조직 위계와 무관한 뒤섞인 순서로 삽입 — 알파벳순 role_code
    // 정렬이었다면 결과가 HR/HSSE/LOGISTIC/MAINTENANCE/OP_TEAM/SITE_MANAGER로
    // 나왔을 것이므로, 이 테스트가 통과하면 CASE 기반 rank가 실제로 적용됐음을
    // 뜻한다(우연히 삽입 순서와 일치해서 통과하는 게 아님을 보장). display_rank는
    // 전원 NULL이므로 그룹 내부는 순수 fullName 알파벳순이어야 한다.
    seedAccount(db, 'E-HR1', 'Albert A. Gea', 'HR', 'albert');
    seedAccount(db, 'E-LOG1', 'Indra Parulian', 'LOGISTIC', 'parulian');
    seedAccount(db, 'E-MAINT2', 'Indra Prabayugo', 'MAINTENANCE', 'indra');
    seedAccount(db, 'E-MAINT1', 'Agunawan', 'MAINTENANCE', 'agunawan');
    seedAccount(db, 'E-HSSE2', 'Chandra R.D', 'HSSE', 'chandra');
    seedAccount(db, 'E-HSSE1', 'Arsyan AN', 'HSSE', 'arsyan');
    seedAccount(db, 'E-OP3', 'Shadiq M. Shalih', 'OP_TEAM', 'shadiq');
    seedAccount(db, 'E-OP1', 'Asman Sampeaman', 'OP_TEAM', 'asman');
    seedAccount(db, 'E-OP2', 'Juli Surungan', 'OP_TEAM', 'juli');
    seedAccount(db, 'E-SM1', 'Edi Hermawan', 'SITE_MANAGER', 'edi');

    const result = listLoginDirectory(db);

    expect(result.map((r) => ({ username: r.username, roleCode: r.roleCode, fullName: r.fullName }))).toEqual([
      { username: 'edi', roleCode: 'SITE_MANAGER', fullName: 'Edi Hermawan' },
      { username: 'asman', roleCode: 'OP_TEAM', fullName: 'Asman Sampeaman' },
      { username: 'juli', roleCode: 'OP_TEAM', fullName: 'Juli Surungan' },
      { username: 'shadiq', roleCode: 'OP_TEAM', fullName: 'Shadiq M. Shalih' },
      { username: 'arsyan', roleCode: 'HSSE', fullName: 'Arsyan AN' },
      { username: 'chandra', roleCode: 'HSSE', fullName: 'Chandra R.D' },
      { username: 'agunawan', roleCode: 'MAINTENANCE', fullName: 'Agunawan' },
      { username: 'indra', roleCode: 'MAINTENANCE', fullName: 'Indra Prabayugo' },
      { username: 'parulian', roleCode: 'LOGISTIC', fullName: 'Indra Parulian' },
      { username: 'albert', roleCode: 'HR', fullName: 'Albert A. Gea' },
    ]);
    expect(result.every((r) => r.displayRank === null)).toBe(true);
  });

  it('places a display_rank=1 row (Shadiq, Sr. OP Team Leader) first within its role group, ahead of NULL-ranked rows sorted by fullName — HJ 4차 지시', () => {
    // 삽입 순서를 알파벳순과 반대로 둬서(juli -> asman -> shadiq) 우연히 맞는
    // 케이스를 배제한다. display_rank가 없었다면 asman/juli/shadiq 알파벳순
    // (Asman < Juli < Shadiq)으로 나왔을 것 — 이 테스트가 통과하면 display_rank
    // 2차 정렬이 실제로 fullName보다 우선한다는 뜻이다.
    seedAccount(db, 'E-OP2', 'Juli Surungan', 'OP_TEAM', 'juli');
    seedAccount(db, 'E-OP1', 'Asman Sampeaman', 'OP_TEAM', 'asman');
    seedAccount(db, 'E-OP3', 'Shadiq M. Shalih', 'OP_TEAM', 'shadiq');
    db.run('UPDATE personnel_master SET display_rank = 1 WHERE employee_id = @id', { id: 'E-OP3' });
    seedAccount(db, 'E-SM1', 'Edi Hermawan', 'SITE_MANAGER', 'edi');

    const result = listLoginDirectory(db);

    expect(result.map((r) => r.username)).toEqual(['edi', 'shadiq', 'asman', 'juli']);
    expect(result.find((r) => r.username === 'shadiq')?.displayRank).toBe(1);
    expect(result.find((r) => r.username === 'asman')?.displayRank).toBeNull();
    expect(result.find((r) => r.username === 'juli')?.displayRank).toBeNull();
  });

  it('excludes ADMIN accounts even when present, and excludes LOCKED/DISABLED accounts', () => {
    seedAccount(db, 'E-SM1', 'Edi Hermawan', 'SITE_MANAGER', 'edi');
    const { accountId: hrAccountId } = seedAccount(db, 'E-HR1', 'Albert A. Gea', 'HR', 'albert');
    seedAccount(db, 'E-ADM1', 'Root Admin', 'ADMIN', 'admin');
    setAccountLock(db, hrAccountId, true, 'BOOTSTRAP');

    const result = listLoginDirectory(db);

    expect(result.map((r) => r.username)).toEqual(['edi']);
  });
});
