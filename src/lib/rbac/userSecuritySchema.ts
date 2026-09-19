// src/lib/rbac/userSecuritySchema.ts
//
// PURPOSE
//   Stage 1 User & Security Management 5개 테이블 DDL.
//   src/cmms-daily-ops/db/dailyOpsDbSingleton.ts / truckingDbSingleton.ts와
//   동일한 컨벤션 — cmmsDbSingleton.ts 자체는 건드리지 않고, getCmmsDb()의
//   연결을 재사용하는 이 모듈 전용 ensure*()에서만 CREATE TABLE IF NOT EXISTS로
//   보강한다(하드 바운더리 유지, Step 0에서
//   src/cmms-daily-ops/db/dailyOpsDbSingleton.ts:9-10 "cmmsDbSingleton.ts 자체는
//   수정하지 않는다" 주석 및 phase11b/11c 하드블록 재확인 이력으로 확인됨).
//
//   role_permissions는 Step 0 재검토 결과, 최초 지시안의 3컬럼(can_view/
//   can_edit/can_approve)이 아니라 기존 001_role_permissions.sql / RolePermission
//   (src/types/rbac.ts) 7필드 형태를 그대로 채택한다 — isReadOnlyForced/
//   canUnlockApproved를 실제로 쓰는 기존 라우트(ptw-signatures,
//   daily-report-hq-edit-open/close)를 깨뜨리지 않기 위함.
//
//   ⚠ role_permissions.role_code 값(ADMIN/SITE_MANAGER/OP_TEAM/HSSE/
//   MAINTENANCE/LOGISTIC/HR)은 personnel_master.department_group /
//   user_accounts.role_code와 같은 "신규 Stage 1 어휘"이며, 기존
//   src/types/rbac.ts의 RoleCode(SYSTEM_ADMIN/ACTING_SITE_MANAGER/
//   OPERATION_TEAM_LEADER/HSSE_OFFICER/WORK_LEADER_TECH/HQ_SUPERVISOR_AUDITOR —
//   SITE_MANAGER만 문자열이 우연히 겹침)와 값 집합이 다르다.
//   getEffectivePermission()은 이번 스테이지에서 이 테이블을 조회하도록
//   재작성하지 않는다 — 재작성 시 기존 31개 호출부가 SYSTEM_ADMIN 등 6/7
//   역할에 대해 항상 null을 받아 RBAC가 조용히 깨진다(최종 보고서 참조,
//   HJ 결정 대기).
//
//   personnel_master/user_accounts/user_sessions는 src/db/schema/cmms_schema.sql
//   에도 동명(user_accounts/user_sessions) 테이블이 "문서로만" 존재하지만
//   (런타임 미실행 확인, 이전 STEP 0 조사) 컬럼 구성이 다르다 — 그 문서 파일은
//   이번 스테이지 범위 밖이라 수정하지 않는다(후속 문서 정리 필요 항목으로 플래그).

import type { DatabaseSync } from 'node:sqlite';

export const PERSONNEL_MASTER_DDL = `
  CREATE TABLE IF NOT EXISTS personnel_master (
      employee_id        TEXT PRIMARY KEY,
      full_name          TEXT NOT NULL,
      position_title     TEXT NOT NULL,
      department_group   TEXT NOT NULL CHECK (department_group IN
                            ('ADMIN','SITE_MANAGER','OP_TEAM','HSSE','MAINTENANCE','LOGISTIC','HR')),
      employment_status  TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (employment_status IN
                            ('ACTIVE','OFF_DUTY_ROTATION','RESIGNED')),
      hire_date          TEXT,
      resignation_date   TEXT,
      is_local_resident  INTEGER NOT NULL DEFAULT 0,
      contact_no         TEXT,
      remarks            TEXT,
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const USER_ACCOUNTS_DDL = `
  CREATE TABLE IF NOT EXISTS user_accounts (
      account_id            TEXT PRIMARY KEY,
      employee_id           TEXT NOT NULL UNIQUE REFERENCES personnel_master(employee_id),
      username              TEXT NOT NULL UNIQUE,
      password_hash         TEXT NOT NULL,
      role_code             TEXT NOT NULL CHECK (role_code IN
                              ('ADMIN','SITE_MANAGER','OP_TEAM','HSSE','MAINTENANCE','LOGISTIC','HR')),
      account_status        TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE','LOCKED','DISABLED')),
      failed_attempt_count  INTEGER NOT NULL DEFAULT 0,
      locked_until          TEXT,
      must_change_password  INTEGER NOT NULL DEFAULT 1,
      last_login_at         TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const USER_SESSIONS_DDL = `
  CREATE TABLE IF NOT EXISTS user_sessions (
      session_token_hash  TEXT PRIMARY KEY,
      account_id          TEXT NOT NULL REFERENCES user_accounts(account_id),
      role_code           TEXT NOT NULL,
      issued_at           TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at          TEXT NOT NULL,
      last_seen_at        TEXT,
      revoked_at          TEXT,
      ip_address          TEXT
  );
`;

export const ROLE_PERMISSIONS_DDL = `
  CREATE TABLE IF NOT EXISTS role_permissions (
      role_code            TEXT NOT NULL,
      module_code          TEXT NOT NULL,
      can_read             INTEGER NOT NULL DEFAULT 0,
      can_create           INTEGER NOT NULL DEFAULT 0,
      can_update           INTEGER NOT NULL DEFAULT 0,
      can_delete           INTEGER NOT NULL DEFAULT 0,
      can_approve          INTEGER NOT NULL DEFAULT 0,
      is_read_only_forced  INTEGER NOT NULL DEFAULT 0,
      can_unlock_approved  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (role_code, module_code)
  );
`;

export const USER_ACCOUNT_AUDIT_LOG_DDL = `
  CREATE TABLE IF NOT EXISTS user_account_audit_log (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id       TEXT,
      account_id        TEXT,
      event_type        TEXT NOT NULL,
      actor_account_id  TEXT,
      detail            TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_user_account_audit_log_employee ON user_account_audit_log(employee_id);
  CREATE INDEX IF NOT EXISTS idx_user_account_audit_log_account ON user_account_audit_log(account_id);
`;

/** 5개 테이블을 멱등하게 보강한다. FK 순서(personnel_master -> user_accounts -> user_sessions)를 지킨다. */
export function ensureUserSecurityTables(raw: DatabaseSync): void {
  raw.exec(PERSONNEL_MASTER_DDL);
  raw.exec(USER_ACCOUNTS_DDL);
  raw.exec(USER_SESSIONS_DDL);
  raw.exec(ROLE_PERMISSIONS_DDL);
  raw.exec(USER_ACCOUNT_AUDIT_LOG_DDL);
}
