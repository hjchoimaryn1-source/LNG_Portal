// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { usePTWPermits } from './usePTWPermits';
import { setActiveSession, clearActiveSession, type ActiveSession } from '../../../lib/rbac/activeSessionStore';
import { getEffectivePermission } from '../../../lib/rbac/rolePermissionService';
import { STAGE1_ROLE_CODES, type Stage1RoleCode } from '../../../lib/rbac/userSecurityRolePermissionSeed';

function sessionFor(roleCode: Stage1RoleCode): ActiveSession {
  return {
    employeeId: 'E-1',
    roleCode,
    homeLocation: 'SITE',
    permissions: { PTW_PERMITS: getEffectivePermission(roleCode, 'PTW_PERMITS') ?? undefined },
  };
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;
let alertSpy: ReturnType<typeof vi.spyOn> | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  clearActiveSession();
  alertSpy?.mockRestore();
  alertSpy = null;
  vi.unstubAllGlobals();
});

function stubFetch() {
  const signaturePostCalls: unknown[] = [];
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.includes('/ptw-signatures') && init?.method === 'POST') {
      signaturePostCalls.push(JSON.parse(init.body as string));
      return Promise.resolve({ ok: true, json: async () => ({ success: true, records: [] }) } as Response);
    }
    if (url.includes('/ptw-permits')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, records: [], signaturesByPermit: {} }),
      } as Response);
    }
    return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, signaturePostCalls };
}

function Probe({ onReady }: { onReady: (fn: ReturnType<typeof usePTWPermits>) => void }) {
  const result = usePTWPermits();
  onReady(result);
  return null;
}

async function mountAndCapture() {
  let result: ReturnType<typeof usePTWPermits> | null = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<Probe onReady={(r) => (result = r)} />);
    await Promise.resolve();
    await Promise.resolve();
  });
  return () => result!;
}

describe('usePTWPermits.addSignature RBAC gate', () => {
  it('persists the signature with roleCode for a role with real PTW_PERMITS access', async () => {
    setActiveSession(sessionFor('MAINTENANCE'));
    const { signaturePostCalls } = stubFetch();
    const getResult = await mountAndCapture();
    const permitId = getResult().permits[0].id;

    await act(async () => {
      getResult().addSignature(permitId, 'WORK_LEADER_ACCEPT', 'S-1', 'Tech One');
      await Promise.resolve();
    });

    expect(signaturePostCalls).toHaveLength(1);
    expect(signaturePostCalls[0]).toMatchObject({ permitId, roleCode: 'MAINTENANCE', role: 'WORK_LEADER_ACCEPT' });
  });

  // RBAC audit remediation — Phase 13 follow-up, 2026-09-16. This test used to
  // exercise HQ_SUPERVISOR_AUDITOR's forced-read-only block. That role has no
  // equivalent in the new Stage1RoleCode vocabulary (Stage 2A-i HJ decision:
  // deferred to a future HQ-view phase, not ported — it would no longer even
  // type-check as a literal here). Repurposed (Stage 3, 2026-09-19) to assert
  // the fact that makes the old scenario unreachable today: no current-vocabulary
  // role has isReadOnlyForced:true on PTW_PERMITS, so addSignature's
  // `!permission || permission.isReadOnlyForced` guard has no live blocking case
  // until an auditor-equivalent role is reintroduced.
  it('documents that no current-vocabulary role is forced-read-only on PTW_PERMITS (HQ_SUPERVISOR_AUDITOR deferred, not ported)', () => {
    for (const roleCode of STAGE1_ROLE_CODES) {
      expect(getEffectivePermission(roleCode, 'PTW_PERMITS')?.isReadOnlyForced).toBe(false);
    }
  });
});
