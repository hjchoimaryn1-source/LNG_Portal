// DB/session/DAO layers are mocked out (same convention as ptw-permits/route.test.ts).

import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyUserSecuritySession = vi.fn();
const createAccount = vi.fn(() => ({ accountId: 'ACC-9', tempPassword: 'temp-pass' }));
const changeRole = vi.fn();
const setAccountLock = vi.fn();
const resetPassword = vi.fn(() => ({ tempPassword: 'new-temp-pass' }));
const listAccounts = vi.fn(() => []);

vi.mock('../../../../../../lib/rbac/userSecurityDbSingleton', () => ({
  getUserSecurityDb: vi.fn(() => ({})),
}));
vi.mock('../../../../../../lib/rbac/userSecuritySessionMiddleware', () => ({
  verifyUserSecuritySession: (...args: unknown[]) => verifyUserSecuritySession(...(args as [])),
}));
vi.mock('../../../../../../lib/rbac/userAccountAdminDao', () => ({
  createAccount: (...args: unknown[]) => createAccount(...(args as [])),
  changeRole: (...args: unknown[]) => changeRole(...(args as [])),
  setAccountLock: (...args: unknown[]) => setAccountLock(...(args as [])),
  resetPassword: (...args: unknown[]) => resetPassword(...(args as [])),
  listAccounts: (...args: unknown[]) => listAccounts(...(args as [])),
}));

import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from './route';

function req(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/v1/cmms/user-security/accounts', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const ADMIN_CTX = { accountId: 'ACC-1', employeeId: 'E-1', roleCode: 'ADMIN' };
const NON_ADMIN_CTX = { accountId: 'ACC-2', employeeId: 'E-2', roleCode: 'SITE_MANAGER' };

describe('user-security/accounts route — server-side ADMIN gate', () => {
  beforeEach(() => {
    verifyUserSecuritySession.mockReset();
    createAccount.mockClear();
    changeRole.mockClear();
    setAccountLock.mockClear();
    resetPassword.mockClear();
    listAccounts.mockClear();
  });

  it('rejects every method for a non-ADMIN session with 403', async () => {
    verifyUserSecuritySession.mockReturnValue(NON_ADMIN_CTX);
    expect((await GET(req('GET'))).status).toBe(403);
    expect((await POST(req('POST', { employeeId: 'E-9', username: 'x', roleCode: 'HSSE' }))).status).toBe(403);
    expect((await PATCH(req('PATCH', { accountId: 'ACC-9', action: 'LOCK' }))).status).toBe(403);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it('POST rejects an invalid roleCode not in STAGE1_ROLE_CODES', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    const res = await POST(req('POST', { employeeId: 'E-9', username: 'x', roleCode: 'SYSTEM_ADMIN' }));
    expect(res.status).toBe(400);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it('POST creates an account and returns the temp password once', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    const res = await POST(req('POST', { employeeId: 'E-9', username: 'newuser', roleCode: 'HSSE' }));
    const json = await res.json();
    expect(json.tempPassword).toBe('temp-pass');
    expect(createAccount).toHaveBeenCalledWith(
      expect.anything(),
      { employeeId: 'E-9', username: 'newuser', roleCode: 'HSSE' },
      'ACC-1'
    );
  });

  it('PATCH CHANGE_ROLE routes to changeRole with the acting admin as actor', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    await PATCH(req('PATCH', { accountId: 'ACC-9', action: 'CHANGE_ROLE', roleCode: 'MAINTENANCE' }));
    expect(changeRole).toHaveBeenCalledWith(expect.anything(), 'ACC-9', 'MAINTENANCE', 'ACC-1');
  });

  it('PATCH LOCK/UNLOCK route to setAccountLock with the right boolean', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    await PATCH(req('PATCH', { accountId: 'ACC-9', action: 'LOCK' }));
    expect(setAccountLock).toHaveBeenCalledWith(expect.anything(), 'ACC-9', true, 'ACC-1');
    await PATCH(req('PATCH', { accountId: 'ACC-9', action: 'UNLOCK' }));
    expect(setAccountLock).toHaveBeenCalledWith(expect.anything(), 'ACC-9', false, 'ACC-1');
  });

  it('PATCH RESET_PASSWORD returns the new temp password once', async () => {
    verifyUserSecuritySession.mockReturnValue(ADMIN_CTX);
    const res = await PATCH(req('PATCH', { accountId: 'ACC-9', action: 'RESET_PASSWORD' }));
    const json = await res.json();
    expect(json.tempPassword).toBe('new-temp-pass');
  });
});
