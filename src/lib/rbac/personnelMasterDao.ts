// src/lib/rbac/personnelMasterDao.ts
//
// PURPOSE
//   personnel_master CRUD. 인력은 하드 삭제하지 않는다 — 퇴직 처리는
//   employment_status='RESIGNED' + resignation_date UPDATE로만 표현한다
//   (요청 지시 원문). RBAC 게이트/HTTP 매핑은 route.ts가 담당하고, 이 DAO는
//   SqlExecutor만 의존하며 호출자(actorAccountId)를 신뢰한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { writeUserAccountAudit } from './userAccountAuditLog';

export interface PersonnelRecord {
  employeeId: string;
  fullName: string;
  positionTitle: string;
  departmentGroup: string;
  employmentStatus: string;
  hireDate: string | null;
  resignationDate: string | null;
  isLocalResident: boolean;
  contactNo: string | null;
  remarks: string | null;
}

interface PersonnelRow {
  employee_id: string;
  full_name: string;
  position_title: string;
  department_group: string;
  employment_status: string;
  hire_date: string | null;
  resignation_date: string | null;
  is_local_resident: number;
  contact_no: string | null;
  remarks: string | null;
}

function rowToRecord(row: PersonnelRow): PersonnelRecord {
  return {
    employeeId: row.employee_id,
    fullName: row.full_name,
    positionTitle: row.position_title,
    departmentGroup: row.department_group,
    employmentStatus: row.employment_status,
    hireDate: row.hire_date,
    resignationDate: row.resignation_date,
    isLocalResident: row.is_local_resident === 1,
    contactNo: row.contact_no,
    remarks: row.remarks,
  };
}

export interface PersonnelFilter {
  departmentGroup?: string;
  employmentStatus?: string;
}

export function listPersonnel(db: SqlExecutor, filter: PersonnelFilter = {}): PersonnelRecord[] {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (filter.departmentGroup) {
    clauses.push('department_group = @departmentGroup');
    params.departmentGroup = filter.departmentGroup;
  }
  if (filter.employmentStatus) {
    clauses.push('employment_status = @employmentStatus');
    params.employmentStatus = filter.employmentStatus;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.all<PersonnelRow>(`SELECT * FROM personnel_master ${where} ORDER BY employee_id`, params).map(rowToRecord);
}

export function getPersonnelByEmployeeId(db: SqlExecutor, employeeId: string): PersonnelRecord | undefined {
  const row = db.get<PersonnelRow>('SELECT * FROM personnel_master WHERE employee_id = @employeeId', { employeeId });
  return row ? rowToRecord(row) : undefined;
}

export interface CreatePersonnelInput {
  employeeId: string;
  fullName: string;
  positionTitle: string;
  departmentGroup: string;
  hireDate?: string | null;
  isLocalResident?: boolean;
  contactNo?: string | null;
  remarks?: string | null;
}

const INSERT_PERSONNEL_SQL = `
  INSERT INTO personnel_master
    (employee_id, full_name, position_title, department_group, hire_date, is_local_resident, contact_no, remarks)
  VALUES (@employeeId, @fullName, @positionTitle, @departmentGroup, @hireDate, @isLocalResident, @contactNo, @remarks)
`;

export function createPersonnel(db: SqlExecutor, input: CreatePersonnelInput, actorAccountId: string): void {
  db.run(INSERT_PERSONNEL_SQL, {
    employeeId: input.employeeId,
    fullName: input.fullName,
    positionTitle: input.positionTitle,
    departmentGroup: input.departmentGroup,
    hireDate: input.hireDate ?? null,
    isLocalResident: input.isLocalResident ? 1 : 0,
    contactNo: input.contactNo ?? null,
    remarks: input.remarks ?? null,
  });
  writeUserAccountAudit(db, {
    employeeId: input.employeeId,
    accountId: null,
    eventType: 'PERSONNEL_CREATED',
    actorAccountId,
    detail: `${input.fullName} / ${input.positionTitle} / ${input.departmentGroup}`,
  });
}

export interface UpdatePersonnelInput {
  positionTitle?: string;
  departmentGroup?: string;
  contactNo?: string | null;
  remarks?: string | null;
}

export function updatePersonnel(
  db: SqlExecutor,
  employeeId: string,
  patch: UpdatePersonnelInput,
  actorAccountId: string
): void {
  const sets: string[] = [];
  const params: Record<string, unknown> = { employeeId, now: new Date().toISOString() };
  if (patch.positionTitle !== undefined) {
    sets.push('position_title = @positionTitle');
    params.positionTitle = patch.positionTitle;
  }
  if (patch.departmentGroup !== undefined) {
    sets.push('department_group = @departmentGroup');
    params.departmentGroup = patch.departmentGroup;
  }
  if (patch.contactNo !== undefined) {
    sets.push('contact_no = @contactNo');
    params.contactNo = patch.contactNo;
  }
  if (patch.remarks !== undefined) {
    sets.push('remarks = @remarks');
    params.remarks = patch.remarks;
  }
  if (sets.length === 0) return;
  sets.push('updated_at = @now');
  db.run(`UPDATE personnel_master SET ${sets.join(', ')} WHERE employee_id = @employeeId`, params);
  writeUserAccountAudit(db, {
    employeeId,
    accountId: null,
    eventType: 'PERSONNEL_UPDATED',
    actorAccountId,
    detail: JSON.stringify(patch),
  });
}

export function resignPersonnel(
  db: SqlExecutor,
  employeeId: string,
  resignationDate: string,
  actorAccountId: string
): void {
  db.run(
    `UPDATE personnel_master
     SET employment_status = 'RESIGNED', resignation_date = @resignationDate, updated_at = @now
     WHERE employee_id = @employeeId`,
    { employeeId, resignationDate, now: new Date().toISOString() }
  );
  writeUserAccountAudit(db, {
    employeeId,
    accountId: null,
    eventType: 'RESIGNED',
    actorAccountId,
    detail: `resignationDate=${resignationDate}`,
  });
}
