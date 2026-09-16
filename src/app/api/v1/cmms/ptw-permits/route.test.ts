// src/app/api/v1/cmms/ptw-permits/route.test.ts
//
// RBAC audit remediation — Phase 13 follow-up, 2026-09-16. Covers the PATCH
// route's roleCode -> PTW_PERMITS.canUpdate gate added to ptw-permits/route.ts.
//
// permitPersistenceAdapter (and its transitive cmmsDbSingleton -> nodeSqliteExecutor
// -> 'node:sqlite' import) is mocked out: vitest's vite-node ESM resolver cannot
// statically load the experimental 'node:sqlite' core module (see the identical
// workaround note in dailyOpsPatrolDao.test.ts), and this route module graph
// pulls it in transitively with no test-only entry point to inject a fake
// executor. Mocking the adapter both sidesteps that and keeps this a proper
// unit test of the route's own validation/RBAC-gate logic, not the DB layer.

import { describe, it, expect, vi } from 'vitest';

const applyPermitUpdateWithConflictCheck = vi.fn(() => ({ outcome: 'NOT_FOUND' as const }));

vi.mock('../../../../../adapters/permitPersistenceAdapter', () => ({
  applyPermitUpdateWithConflictCheck: (...args: unknown[]) => applyPermitUpdateWithConflictCheck(...(args as [])),
  seedPermitLifecycleIfAbsent: vi.fn(),
  getAllPermitLifecycleWithSignatures: vi.fn(() => ({ lifecycle: [], signaturesByPermit: new Map() })),
  getActiveSuspensionsSnapshot: vi.fn(() => []),
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

describe('PATCH /api/v1/cmms/ptw-permits — RBAC role gate', () => {
  it('blocks a role without PTW_PERMITS.canUpdate with 403, before touching the DB layer', async () => {
    applyPermitUpdateWithConflictCheck.mockClear();
    // WORK_LEADER_TECH has canUpdate:false on PTW_PERMITS (rolePermissionService.ts).
    const res = await PATCH(
      patchRequest({ permitId: 'PTW-ANY-ID', status: 'PREPARED', closedAt: null, roleCode: 'WORK_LEADER_TECH' })
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(applyPermitUpdateWithConflictCheck).not.toHaveBeenCalled();
  });

  it('lets an allowed role (SITE_MANAGER) past the gate and through to the DB layer', async () => {
    applyPermitUpdateWithConflictCheck.mockClear();
    const res = await PATCH(
      patchRequest({ permitId: 'PTW-DOES-NOT-EXIST', status: 'PREPARED', closedAt: null, roleCode: 'SITE_MANAGER' })
    );
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(applyPermitUpdateWithConflictCheck).toHaveBeenCalledTimes(1);
  });

  it('is backward-compatible with callers that omit roleCode entirely (e.g. NP08 cargo handling)', async () => {
    applyPermitUpdateWithConflictCheck.mockClear();
    const res = await PATCH(patchRequest({ permitId: 'PTW-DOES-NOT-EXIST', status: 'ACTIVE', closedAt: null }));
    const json = await res.json();

    // No roleCode -> gate is skipped entirely (unchanged pre-existing behavior).
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(applyPermitUpdateWithConflictCheck).toHaveBeenCalledTimes(1);
  });
});
