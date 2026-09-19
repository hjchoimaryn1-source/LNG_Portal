// src/app/api/v1/cmms/user-security/login/route.test.ts
//
// DB layer (getUserSecurityDb -> cmmsDbSingleton -> node:sqlite) and the login
// service are mocked out, matching ptw-permits/route.test.ts's convention —
// vitest's vite-node ESM resolver cannot statically load the experimental
// 'node:sqlite' core module. This is a unit test of the route's own request
// validation / cookie-setting behavior, not the DB layer (covered separately
// in userSecurityLoginService.test.ts).

import { describe, it, expect, vi } from 'vitest';

const attemptLogin = vi.fn();
vi.mock('../../../../../../lib/rbac/userSecurityDbSingleton', () => ({
  getUserSecurityDb: vi.fn(() => ({})),
}));
vi.mock('../../../../../../lib/rbac/userSecurityLoginService', () => ({
  attemptLogin: (...args: unknown[]) => attemptLogin(...(args as [])),
}));

import { NextRequest } from 'next/server';
import { POST } from './route';
import { SESSION_COOKIE_NAME } from '../../../../../../lib/rbac/userSecuritySessionMiddleware';

function loginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/v1/cmms/user-security/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/v1/cmms/user-security/login', () => {
  it('rejects a malformed body with 400 before touching the login service', async () => {
    attemptLogin.mockClear();
    const res = await POST(loginRequest({ username: 'x' }));
    expect(res.status).toBe(400);
    expect(attemptLogin).not.toHaveBeenCalled();
  });

  it('sets an httpOnly, SameSite=Strict, Secure=false session cookie on success', async () => {
    attemptLogin.mockReturnValueOnce({
      success: true,
      rawSessionToken: 'a'.repeat(64),
      accountId: 'A-1',
      employeeId: 'E-1',
      roleCode: 'ADMIN',
      mustChangePassword: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    });

    const res = await POST(loginRequest({ username: 'admin', password: 'temp-pass' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.mustChangePassword).toBe(true);

    const cookie = res.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBe('a'.repeat(64));
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('strict');
    expect(cookie?.secure).toBe(false);
  });

  it('returns 401 without setting a cookie on failure', async () => {
    attemptLogin.mockReturnValueOnce({ success: false, reason: 'INVALID_CREDENTIALS' });
    const res = await POST(loginRequest({ username: 'admin', password: 'wrong' }));
    expect(res.status).toBe(401);
    expect(res.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });
});
