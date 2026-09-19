import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyUserSecuritySession = vi.fn();
const listAuditLog = vi.fn(() => []);

vi.mock('../../../../../../lib/rbac/userSecurityDbSingleton', () => ({
  getUserSecurityDb: vi.fn(() => ({})),
}));
vi.mock('../../../../../../lib/rbac/userSecuritySessionMiddleware', () => ({
  verifyUserSecuritySession: (...args: unknown[]) => verifyUserSecuritySession(...(args as [])),
}));
vi.mock('../../../../../../lib/rbac/userAccountAuditLog', () => ({
  listAuditLog: (...args: unknown[]) => listAuditLog(...(args as [])),
}));

import { NextRequest } from 'next/server';
import { GET } from './route';

function req(search = ''): NextRequest {
  return new NextRequest(`http://localhost/api/v1/cmms/user-security/audit-log${search}`);
}

describe('GET /api/v1/cmms/user-security/audit-log', () => {
  beforeEach(() => {
    verifyUserSecuritySession.mockReset();
    listAuditLog.mockClear();
  });

  it('returns 401 with no session', async () => {
    verifyUserSecuritySession.mockReturnValue(null);
    expect((await GET(req())).status).toBe(401);
    expect(listAuditLog).not.toHaveBeenCalled();
  });

  it('returns 403 for a non-ADMIN session', async () => {
    verifyUserSecuritySession.mockReturnValue({ accountId: 'A', employeeId: 'E', roleCode: 'HSSE' });
    expect((await GET(req())).status).toBe(403);
    expect(listAuditLog).not.toHaveBeenCalled();
  });

  it('passes a numeric limit through for an ADMIN session', async () => {
    verifyUserSecuritySession.mockReturnValue({ accountId: 'A', employeeId: 'E', roleCode: 'ADMIN' });
    await GET(req('?limit=50'));
    expect(listAuditLog).toHaveBeenCalledWith(expect.anything(), 50);
  });
});
