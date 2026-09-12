// src/cmms-auth/delegationAdapter.ts
//
// PURPOSE
//   Real `approval_delegations` data source for resolveEffectiveRole.ts, built
//   on the existing cmmsDbSingleton.ts (node:sqlite) connection — no new DB
//   connection is created. Site Manager (Pak Edi, BSG259529 per
//   userAccountsSeed.ts) delegation is the primary scenario: while he is
//   off-site/on leave, a delegate temporarily holds SITE_MANAGER tier.
//
//   Stage 0 §3 found `approval_delegations` as DDL-only in a Postgres-flavored
//   seed (004_rbac_approval_schema.sql — BIGSERIAL/TIMESTAMP WITH TIME ZONE)
//   that is never applied to the actual SQLite runtime, and guardrails.ts's own
//   comment notes that schema has no role/tier column at all (role is only on
//   user_accounts.role_code there). Since resolveEffectiveRole.ts's
//   DelegationRecord needs a concrete RoleTier to elevate to, this adapter
//   defines its own SQLite-realized table with an explicit `granted_tier`
//   column instead of reusing the undocumented, unmaterialized Postgres shape.

import { getCmmsDb } from '../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import type { DelegationRecord, RoleTier } from './rbacTypes';

const DELEGATIONS_DDL = `
  CREATE TABLE IF NOT EXISTS approval_delegations (
      delegation_id       INTEGER PRIMARY KEY AUTOINCREMENT,
      original_staff_id   TEXT NOT NULL,
      delegate_staff_id   TEXT NOT NULL,
      granted_tier        TEXT NOT NULL,
      start_date          TEXT NOT NULL,
      end_date            TEXT NOT NULL,
      is_active           INTEGER NOT NULL DEFAULT 1,
      reason              TEXT NOT NULL,
      created_at          TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_delegations_delegate ON approval_delegations(delegate_staff_id, is_active);
`;

// Keyed by db instance — see staffCredentialsDb.ts's ensuredDbs for why a
// bare boolean is wrong here (breaks on a second, distinct SqlExecutor).
const ensuredDbs = new WeakSet<SqlExecutor>();

function ensureDelegationsTable(db: SqlExecutor): void {
  if (ensuredDbs.has(db)) return;
  db.run(DELEGATIONS_DDL);
  ensuredDbs.add(db);
}

interface DelegationRow {
  delegation_id: number;
  original_staff_id: string;
  delegate_staff_id: string;
  granted_tier: string;
  start_date: string;
  end_date: string;
  is_active: number;
}

function rowToRecord(row: DelegationRow): DelegationRecord {
  return {
    originalStaffId: row.original_staff_id,
    delegateStaffId: row.delegate_staff_id,
    tier: row.granted_tier as RoleTier,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active === 1,
  };
}

export interface CreateDelegationInput {
  originalStaffId: string;
  delegateStaffId: string;
  tier: RoleTier;
  startDate: string;
  endDate: string;
  reason: string;
}

/** Creates a delegation grant. Callers must supply ISO date strings for startDate/endDate. */
export function createDelegation(input: CreateDelegationInput, db: SqlExecutor = getCmmsDb()): void {
  ensureDelegationsTable(db);
  db.run(
    `INSERT INTO approval_delegations
       (original_staff_id, delegate_staff_id, granted_tier, start_date, end_date, is_active, reason)
     VALUES (@originalStaffId, @delegateStaffId, @tier, @startDate, @endDate, 1, @reason)`,
    {
      originalStaffId: input.originalStaffId,
      delegateStaffId: input.delegateStaffId,
      tier: input.tier,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
    }
  );
}

// Pak Edi (Site Manager, BSG259529 per userAccountsSeed.ts) delegating his
// SITE_MANAGER authority to a stand-in while off-site/on leave.
export function delegateSiteManagerAuthority(
  delegateStaffId: string,
  startDate: string,
  endDate: string,
  reason: string,
  db: SqlExecutor = getCmmsDb()
): void {
  createDelegation(
    { originalStaffId: 'BSG259529', delegateStaffId, tier: 'SITE_MANAGER', startDate, endDate, reason },
    db
  );
}

export function revokeDelegation(delegationId: number, db: SqlExecutor = getCmmsDb()): void {
  ensureDelegationsTable(db);
  db.run('UPDATE approval_delegations SET is_active = 0 WHERE delegation_id = @delegationId', { delegationId });
}

/** All delegation records, for resolveEffectiveRole.ts to filter by staffId/date. */
export function selectAllDelegationRecords(db: SqlExecutor = getCmmsDb()): DelegationRecord[] {
  ensureDelegationsTable(db);
  return db.all<DelegationRow>('SELECT * FROM approval_delegations').map(rowToRecord);
}
