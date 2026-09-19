// src/app/api/v1/cmms/ptw-permits/route.test.ts
//
// RBAC audit remediation — Phase 13 follow-up, 2026-09-16. Covers the PATCH
// route's Stage 1B session -> PTW_PERMITS.canUpdate gate added to
// ptw-permits/route.ts.
//
// permitPersistenceAdapter (and its transitive cmmsDbSingleton -> nodeSqliteExecutor
// -> 'node:sqlite' import) is mocked out: vitest's vite-node ESM resolver cannot
// statically load the experimental 'node:sqlite' core module (see the identical
// workaround note in dailyOpsPatrolDao.test.ts), and this route module graph
// pulls it in transitively with no test-only entry point to inject a fake
// executor. Mocking the adapter both sidesteps that and keeps this a proper
// unit test of the route's own validation/RBAC-gate logic, not the DB layer.
//
// userSecuritySessionMiddleware.ts/sessionPermissionResolver.ts pull in the
// same 'node:sqlite' chain via getUserSecurityDb(), so they are mocked out
// here too — verifyUserSecuritySession()/resolveSessionPermission() are
// mockable per test via their mock implementations below.
//
// Stage 3 (2026-09-19, HJ decision — full PIN-login replacement): the route
// no longer has a no-session fallback — every caller (including NP08 cargo
// handling, which previously bypassed this check entirely by omitting
// roleCode) now requires a valid Stage 1B session.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const applyPermitUpdateWithConflictCheck = vi.fn(() => ({ outcome: 'NOT_FOUND' as const }));

vi.mock('../../../../../adapters/permitPersistenceAdapter', () => ({
  applyPermitUpdateWithConflictCheck: (...args: unknown[]) => applyPermitUpdateWithConflictCheck(...(args as [])),
  seedPermitLifecycleIfAbsent: vi.fn(),
  getAllPermitLifecycleWithSignatures: vi.fn(() => ({ lifecycle: [], signaturesByPermit: new Map() })),
  getActiveSuspensionsSnapshot: vi.fn(() => []),
}));

const verifyUserSecuritySession = vi.fn();
const resolveSessionPermission = vi.fn();

vi.mock('../../../../../lib/rbac/userSecuritySessionMiddleware', () => ({
  verifyUserSecuritySession: (...args: unknown[]) => verifyUserSecuritySession(...args),
}));

vi.mock('../../../../../lib/rbac/sessionPermissionResolver', () => ({
  resolveSessionPermission: (...args: unknown[]) => resolveSessionPermission(...args),
}));

import { NextRequest } from 'next/server';
import { PATCH } from './route';

function patchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/v1/cmms/ptw-permits', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  applyPermitUpdateWithConflictCheck.mockClear();
  verifyUserSecuritySession.mockReset();
  resolveSessionPermission.mockReset();
});

describe('PATCH /api/v1/cmms/ptw-permits — RBAC session gate', () => {
  it('rejects with 401 when there is no valid Stage 1B session, before touching the DB layer', async () => {
    verifyUserSecuritySession.mockReturnValue(null);
    const res = await PATCH(patchRequest({ permitId: 'PTW-ANY-ID', status: 'PREPARED', closedAt: null }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(applyPermitUpdateWithConflictCheck).not.toHaveBeenCalled();
  });

  it('blocks a role without PTW_PERMITS.canUpdate with 403, before touching the DB layer', async () => {
    // MAINTENANCE has canUpdate:false on PTW_PERMITS (userSecurityRolePermissionSeed.ts confirmed matrix).
    verifyUserSecuritySession.mockReturnValue({ accountId: 'A-1', employeeId: 'E-1', roleCode: 'MAINTENANCE' });
    resolveSessionPermission.mockReturnValue({ canUpdate: false });
    const res = await PATCH(patchRequest({ permitId: 'PTW-ANY-ID', status: 'PREPARED', closedAt: null }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(applyPermitUpdateWithConflictCheck).not.toHaveBeenCalled();
  });

  it('lets an allowed role (SITE_MANAGER) past the gate and through to the DB layer', async () => {
    verifyUserSecuritySession.mockReturnValue({ accountId: 'A-2', employeeId: 'E-2', roleCode: 'SITE_MANAGER' });
    resolveSessionPermission.mockReturnValue({ canUpdate: true });
    const res = await PATCH(patchRequest({ permitId: 'PTW-DOES-NOT-EXIST', status: 'PREPARED', closedAt: null }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(applyPermitUpdateWithConflictCheck).toHaveBeenCalledTimes(1);
  });

  it('gates NP08 cargo-handling callers the same way — they now carry a session cookie too and are no longer exempt', async () => {
    verifyUserSecuritySession.mockReturnValue({ accountId: 'A-3', employeeId: 'E-3', roleCode: 'OP_TEAM' });
    resolveSessionPermission.mockReturnValue({ canUpdate: true });
    // No roleCode in the body at all (NP08's historical shape) — the session is what matters now.
    const res = await PATCH(patchRequest({ permitId: 'PTW-DOES-NOT-EXIST', status: 'ACTIVE', closedAt: null }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(applyPermitUpdateWithConflictCheck).toHaveBeenCalledTimes(1);
  });
});
