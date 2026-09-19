// DB/session/DAO layers are mocked out (same convention as ptw-permits/route.test.ts —
// this is a unit test of the route's own auth-gate/validation logic, not the DB layer).

import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyUserSecuritySession = vi.fn();
const listPersonnel = vi.fn(() => []);
const createPersonnel = vi.fn();
const updatePersonnel = vi.fn();
const resignPersonnel = vi.fn();

vi.mock('../../../../../../lib/rbac/userSecurityDbSingleton', () => ({
  getUserSecurityDb: vi.fn(() => ({})),
}));
vi.mock('../../../../../../lib/rbac/userSecuritySessionMiddleware', () => ({
  verifyUserSecuritySession: (...args: unknown[]) => verifyUserSecuritySession(...(args as [])),
}));
vi.mock('../../../../../../lib/rbac/personnelMasterDao', () => ({
  listPersonnel: (...args: unknown[]) => listPersonnel(...(args as [])),
  createPersonnel: (...args: unknown[]) => createPersonnel(...(args as [])),
  updatePersonnel: (...args: unknown[]) => updatePersonnel(...(args as [])),
  resignPersonnel: (...args: unknown[]) => resignPersonnel(...(args as [])),
}));

import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from './route';

function req(method: string, body?: unknown, search = ''): NextRequest {
  return new NextRequest(`http://localhost/api/v1/cmms/user-security/personnel${search}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const ADMIN_CTX = { accountId: 'ACC-1', employeeId: 'E-1', roleCode: 'ADMIN' };
const NON_ADMIN_CTX = { accountId: 'ACC-2', employeeId: 'E-2', roleCode: 'HSSE' };

describe('user-security/personnel route — server-side ADMIN gate', () => {
  beforeEach(() => {
    verifyUserSecuritySession.mockReset();
    listPersonnel.mockClear();
    createPersonnel.mockClear();
    updatePersonnel.mockClear();
    resignPersonnel.mockClear();
  });

  it('GET returns 401 with no session', async () => {
    verifyUserSecuritySession.mockReturnValue(null);
    const res = await GET(req('GET'));
    expect(res.status).toBe(401);
    expect(listPersonnel).not.toHaveBeenCalled();
  });

  it('GET returns 403 for a non-ADMIN session, before touching the DAO', async () => {
    verifyUserSecuritySession.mockReturnValue(NON_ADMIN_CTX);
    const res = await GET(req('GET'));
    expect(res.status).toBe(403);
    expect(listPersonnel).not.toHaveBeenCalled();
  });

  it('GET passes filters through for an ADMIN session', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    await GET(req('GET', undefined, '?departmentGroup=HSSE&employmentStatus=ACTIVE'));
    expect(listPersonnel).toHaveBeenCalledWith(expect.anything(), {
      departmentGroup: 'HSSE',
      employmentStatus: 'ACTIVE',
    });
  });

  it('POST rejects a non-ADMIN session with 403 before validating the body', async () => {
    verifyUserSecuritySession.mockReturnValue(NON_ADMIN_CTX);
    const res = await POST(req('POST', { employeeId: 'E-9' }));
    expect(res.status).toBe(403);
    expect(createPersonnel).not.toHaveBeenCalled();
  });

  it('POST rejects an incomplete payload with 400 for an ADMIN session', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    const res = await POST(req('POST', { employeeId: 'E-9' }));
    expect(res.status).toBe(400);
    expect(createPersonnel).not.toHaveBeenCalled();
  });

  it('POST creates personnel and attributes the actor to the session, not the body', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    await POST(
      req('POST', { employeeId: 'E-9', fullName: 'New Hire', positionTitle: 'Tech', departmentGroup: 'MAINTENANCE' })
    );
    expect(createPersonnel).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ employeeId: 'E-9' }),
      'ACC-1' // from session, never from body
    );
  });

  it('PATCH with resign calls resignPersonnel, not updatePersonnel', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    await PATCH(req('PATCH', { employeeId: 'E-9', resign: { resignationDate: '2026-09-19' } }));
    expect(resignPersonnel).toHaveBeenCalledWith(expect.anything(), 'E-9', '2026-09-19', 'ACC-1');
    expect(updatePersonnel).not.toHaveBeenCalled();
  });

  it('PATCH with update calls updatePersonnel', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    await PATCH(req('PATCH', { employeeId: 'E-9', update: { positionTitle: 'Senior Tech' } }));
    expect(updatePersonnel).toHaveBeenCalledWith(expect.anything(), 'E-9', { positionTitle: 'Senior Tech' }, 'ACC-1');
  });
});
