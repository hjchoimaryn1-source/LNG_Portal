// src/cmms-auth/sessionStore.ts
//
// PURPOSE
//   Additive-only auth session store, backed by the existing cmmsDbSingleton.ts
//   (node:sqlite) connection — no new DB connection is created here. Table DDL
//   is applied lazily through the singleton's SqlExecutor, without editing
//   cmmsDbSingleton.ts itself. Replaces the in-memory-only, refresh-volatile
//   activeSessionStore.ts session bridge with a persisted record.

import { randomUUID } from 'node:crypto';
import { getCmmsDb } from '../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../adapters/db/sqlExecutor';

const AUTH_SESSIONS_DDL = `
  CREATE TABLE IF NOT EXISTS auth_sessions (
      session_id            TEXT PRIMARY KEY,
      staff_id              TEXT NOT NULL,
      issued_at             TEXT NOT NULL,
      expires_at            TEXT NOT NULL,
      shift_boundary_flag   INTEGER NOT NULL DEFAULT 0
  );
`;

// Keyed by db instance — see staffCredentialsDb.ts's ensuredDbs for why a
// bare boolean is wrong here (breaks on a second, distinct SqlExecutor).
const ensuredDbs = new WeakSet<SqlExecutor>();

function ensureAuthSessionsTable(db: SqlExecutor): void {
  if (ensuredDbs.has(db)) return;
  db.run(AUTH_SESSIONS_DDL);
  ensuredDbs.add(db);
}

export interface AuthSession {
  sessionId: string;
  staffId: string;
  issuedAt: string;
  expiresAt: string;
  shiftBoundaryFlag: boolean;
}

interface AuthSessionRow {
  session_id: string;
  staff_id: string;
  issued_at: string;
  expires_at: string;
  shift_boundary_flag: number;
}

function rowToSession(row: AuthSessionRow): AuthSession {
  return {
    sessionId: row.session_id,
    staffId: row.staff_id,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    shiftBoundaryFlag: row.shift_boundary_flag === 1,
  };
}

export function createSession(
  staffId: string,
  ttlMs: number,
  db: SqlExecutor = getCmmsDb(),
  now: Date = new Date()
): AuthSession {
  ensureAuthSessionsTable(db);
  const session: AuthSession = {
    sessionId: randomUUID(),
    staffId,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    shiftBoundaryFlag: false,
  };
  db.run(
    `INSERT INTO auth_sessions (session_id, staff_id, issued_at, expires_at, shift_boundary_flag)
     VALUES (@sessionId, @staffId, @issuedAt, @expiresAt, 0)`,
    {
      sessionId: session.sessionId,
      staffId: session.staffId,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    }
  );
  return session;
}

export function getSession(sessionId: string, db: SqlExecutor = getCmmsDb()): AuthSession | undefined {
  ensureAuthSessionsTable(db);
  const row = db.get<AuthSessionRow>(
    'SELECT * FROM auth_sessions WHERE session_id = @sessionId',
    { sessionId }
  );
  return row ? rowToSession(row) : undefined;
}

export function markShiftBoundaryCrossed(sessionId: string, db: SqlExecutor = getCmmsDb()): void {
  ensureAuthSessionsTable(db);
  db.run(
    'UPDATE auth_sessions SET shift_boundary_flag = 1 WHERE session_id = @sessionId',
    { sessionId }
  );
}

export function invalidateSession(sessionId: string, db: SqlExecutor = getCmmsDb()): void {
  ensureAuthSessionsTable(db);
  db.run('DELETE FROM auth_sessions WHERE session_id = @sessionId', { sessionId });
}
