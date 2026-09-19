import { describe, it, expect, vi } from 'vitest';

const verifyUserSecuritySession = vi.fn();
vi.mock('../../../../../../lib/rbac/userSecuritySessionMiddleware', () => ({
  verifyUserSecuritySession: (...args: unknown[]) => verifyUserSecuritySession(...(args as [])),
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

  it('returns only roleCode/employeeId for a valid session — no token/hash fields', async () => {
    verifyUserSecuritySession.mockReturnValue({ accountId: 'ACC-1', employeeId: 'E-1', roleCode: 'ADMIN' });
    const res = await GET(req());
    const json = await res.json();
    expect(json).toEqual({ authenticated: true, roleCode: 'ADMIN', employeeId: 'E-1' });
  });
});
