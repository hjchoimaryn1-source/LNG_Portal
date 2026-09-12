// src/cmms-auth/authAuditBridge.ts
//
// PURPOSE
//   Resolves Stage 0 §4 "Contradiction #5": no audit-log write path existed
//   that sourced its actor/role from a real authenticated session (only DDL
//   for `approval_line_histories` existed, never applied, never written to).
//
//   This bridge writes audit rows whose staff_id/role_tier/is_delegated come
//   from a real, persisted `auth_sessions` record (sessionStore.ts) plus a
//   fresh resolveEffectiveRole() resolution against delegationAdapter.ts —
//   never from a caller-supplied identity string. A forged/stale sessionId
//   simply fails to resolve (SESSION_INVALID / SESSION_EXPIRED) rather than
//   being trusted.
//
//   Table is a SQLite-realized subset of approval_line_histories's
//   actor/action/timestamp columns (CMMS_Architecture.md §3.3) — the
//   approval_id FK is dropped because `approval_documents` itself is still
//   DDL-only/unmaterialized (Stage 0 §3), so referencing it would dangle.
//   `reference_id` (permit ref no / work order id / etc.) is used instead,
//   matching approval_documents.reference_id's free-text convention.

import { getCmmsDb } from '../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import { getSession } from './sessionStore';
import { resolveEffectiveRole } from './resolveEffectiveRole';
import { selectAllDelegationRecords } from './delegationAdapter';

const AUDIT_LOG_DDL = `
  CREATE TABLE IF NOT EXISTS auth_audit_log (
      audit_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_id         TEXT NOT NULL,
      action_type          TEXT NOT NULL CHECK (action_type IN ('APPROVE', 'REJECT', 'DELEGATE', 'OVERRIDE')),
      staff_id             TEXT NOT NULL,
      role_tier            TEXT NOT NULL,
      is_delegated         INTEGER NOT NULL DEFAULT 0,
      delegated_from       TEXT,
      session_id           TEXT NOT NULL,
      comments             TEXT,
      action_timestamp     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_auth_audit_reference ON auth_audit_log(reference_id, action_timestamp DESC);
`;

// Keyed by db instance — see staffCredentialsDb.ts's ensuredDbs for why a
// bare boolean is wrong here (breaks on a second, distinct SqlExecutor).
const ensuredDbs = new WeakSet<SqlExecutor>();

function ensureAuditLogTable(db: SqlExecutor): void {
  if (ensuredDbs.has(db)) return;
  db.run(AUDIT_LOG_DDL);
  ensuredDbs.add(db);
}

export type ApprovalActionType = 'APPROVE' | 'REJECT' | 'DELEGATE' | 'OVERRIDE';

export interface RecordApprovalActionInput {
  sessionId: string;
  referenceId: string;
  actionType: ApprovalActionType;
  comments?: string;
}

export interface RecordApprovalActionResult {
  success: boolean;
  reason?: 'SESSION_INVALID' | 'SESSION_EXPIRED';
  auditId?: number;
  staffId?: string;
  roleTier?: string;
}

interface InsertedIdRow {
  audit_id: number;
}

/** Writes one audit row, sourcing the actor identity from the real session — never from a caller-passed string. */
export function recordApprovalAction(
  input: RecordApprovalActionInput,
  db: SqlExecutor = getCmmsDb(),
  now: Date = new Date()
): RecordApprovalActionResult {
  ensureAuditLogTable(db);

  const session = getSession(input.sessionId, db);
  if (!session) {
    return { success: false, reason: 'SESSION_INVALID' };
  }
  if (new Date(session.expiresAt) <= now) {
    return { success: false, reason: 'SESSION_EXPIRED' };
  }

  const delegationRecords = selectAllDelegationRecords(db);
  const effectiveRole = resolveEffectiveRole(session.staffId, delegationRecords, now);

  db.run(
    `INSERT INTO auth_audit_log
       (reference_id, action_type, staff_id, role_tier, is_delegated, delegated_from, session_id, comments, action_timestamp)
     VALUES
       (@referenceId, @actionType, @staffId, @roleTier, @isDelegated, @delegatedFrom, @sessionId, @comments, @actionTimestamp)`,
    {
      referenceId: input.referenceId,
      actionType: input.actionType,
      staffId: effectiveRole.staffId,
      roleTier: effectiveRole.tier,
      isDelegated: effectiveRole.isDelegated ? 1 : 0,
      delegatedFrom: effectiveRole.delegatedFrom ?? null,
      sessionId: input.sessionId,
      comments: input.comments ?? null,
      actionTimestamp: now.toISOString(),
    }
  );

  const inserted = db.get<InsertedIdRow>('SELECT last_insert_rowid() as audit_id');

  return {
    success: true,
    auditId: inserted?.audit_id,
    staffId: effectiveRole.staffId,
    roleTier: effectiveRole.tier,
  };
}

interface AuditLogRow {
  audit_id: number;
  reference_id: string;
  action_type: ApprovalActionType;
  staff_id: string;
  role_tier: string;
  is_delegated: number;
  delegated_from: string | null;
  session_id: string;
  comments: string | null;
  action_timestamp: string;
}

export interface AuditLogEntry {
  auditId: number;
  referenceId: string;
  actionType: ApprovalActionType;
  staffId: string;
  roleTier: string;
  isDelegated: boolean;
  delegatedFrom: string | null;
  actionTimestamp: string;
}

export function selectAuditLogByReference(referenceId: string, db: SqlExecutor = getCmmsDb()): AuditLogEntry[] {
  ensureAuditLogTable(db);
  const rows = db.all<AuditLogRow>(
    'SELECT * FROM auth_audit_log WHERE reference_id = @referenceId ORDER BY action_timestamp DESC',
    { referenceId }
  );
  return rows.map((row) => ({
    auditId: row.audit_id,
    referenceId: row.reference_id,
    actionType: row.action_type,
    staffId: row.staff_id,
    roleTier: row.role_tier,
    isDelegated: row.is_delegated === 1,
    delegatedFrom: row.delegated_from,
    actionTimestamp: row.action_timestamp,
  }));
}
