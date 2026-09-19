// Stage 3 (2026-09-19) added buildClientPermissionsMap() to the authenticated
// path (computes the client-facing permissions map via the same
// getUserSecurityDb -> cmmsDbSingleton -> 'node:sqlite' chain that
// verifyUserSecuritySession() uses) — mocked out here for the same reason
// documented in ptw-permits/route.test.ts (vite-node cannot statically
// resolve the experimental 'node:sqlite' core module).

import { describe, it, expect, vi } from 'vitest';

const verifyUserSecuritySession = vi.fn();
vi.mock('../../../../../../lib/rbac/userSecuritySessionMiddleware', () => ({
  verifyUserSecuritySession: (...args: unknown[]) => verifyUserSecuritySession(...(args as [])),
}));
vi.mock('../../../../../../lib/rbac/sessionPermissionResolver', () => ({
  buildClientPermissionsMap: vi.fn(() => ({})),
}));

import { NextRequest } from 'next/server';
import { GET } from './route';

function req(): NextRequest {
  return new NextRequest('http://localhost/api/v1/cmms/user-security/session');
}

describe('GET /api/v1/cmms/user-security/session', () => {
  it('returns authenticated:false with no session, never a stack trace or token', async () => {
    verifyUserSecuritySession.mockReturnValue(null);
    const res = await GET(req());
    const json = await res.json();
    expect(json).toEqual({ authenticated: false });
  });

  it('returns only roleCode/employeeId/permissions for a valid session — no token/hash fields', async () => {
    verifyUserSecuritySession.mockReturnValue({ accountId: 'ACC-1', employeeId: 'E-1', roleCode: 'ADMIN' });
    const res = await GET(req());
    const json = await res.json();
    expect(json).toEqual({ authenticated: true, roleCode: 'ADMIN', employeeId: 'E-1', permissions: {} });
  });
});
