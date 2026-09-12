// src/cmms-auth/staffCredentialsDb.ts
//
// PURPOSE
//   Additive-only PIN credential store. Consumes the existing cmmsDbSingleton.ts
//   (node:sqlite) connection — no new DB connection is created here. Table DDL
//   is applied lazily through the singleton's SqlExecutor, following the same
//   CREATE TABLE IF NOT EXISTS convention as cmmsDbSingleton.ts's own DDL
//   blocks, without editing that file.

import { createHash } from 'node:crypto';
import { getCmmsDb } from '../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../adapters/db/sqlExecutor';

const STAFF_CREDENTIALS_DDL = `
  CREATE TABLE IF NOT EXISTS staff_credentials (
      staff_id       TEXT PRIMARY KEY,
      pin_hash       TEXT NOT NULL,
      department_id  TEXT NOT NULL
  );
`;

let tableEnsured = false;

function ensureStaffCredentialsTable(db: SqlExecutor): void {
  if (tableEnsured) return;
  db.run(STAFF_CREDENTIALS_DDL);
  tableEnsured = true;
}

/** SHA-256 PIN hash — no plaintext PIN is ever persisted. */
export function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

interface StaffCredentialRow {
  staff_id: string;
  pin_hash: string;
  department_id: string;
}

/** Verifies a PIN against the stored hash. Returns false if the staffId is unknown. */
export function verifyStaffPin(staffId: string, pin: string, db: SqlExecutor = getCmmsDb()): boolean {
  ensureStaffCredentialsTable(db);
  const row = db.get<StaffCredentialRow>(
    'SELECT pin_hash FROM staff_credentials WHERE staff_id = @staffId',
    { staffId }
  );
  if (!row) return false;
  return row.pin_hash === hashPin(pin);
}

/** Creates or replaces a staff member's PIN credential. */
export function upsertStaffCredential(
  staffId: string,
  pin: string,
  departmentId: string,
  db: SqlExecutor = getCmmsDb()
): void {
  ensureStaffCredentialsTable(db);
  db.run(
    `INSERT INTO staff_credentials (staff_id, pin_hash, department_id)
     VALUES (@staffId, @pinHash, @departmentId)
     ON CONFLICT(staff_id) DO UPDATE SET
       pin_hash = excluded.pin_hash,
       department_id = excluded.department_id`,
    { staffId, pinHash: hashPin(pin), departmentId }
  );
}

export function getStaffDepartment(staffId: string, db: SqlExecutor = getCmmsDb()): string | undefined {
  ensureStaffCredentialsTable(db);
  const row = db.get<StaffCredentialRow>(
    'SELECT department_id FROM staff_credentials WHERE staff_id = @staffId',
    { staffId }
  );
  return row?.department_id;
}
