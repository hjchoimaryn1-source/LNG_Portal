// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useMroInventory } from './useMroInventory';
import { setActiveSession, clearActiveSession, type ActiveSession } from '../../../lib/rbac/activeSessionStore';
import { getEffectivePermission } from '../../../lib/rbac/rolePermissionService';
import type { Stage1RoleCode } from '../../../lib/rbac/userSecurityRolePermissionSeed';

function sessionFor(roleCode: Stage1RoleCode): ActiveSession {
  return {
    employeeId: 'E-1',
    roleCode,
    homeLocation: 'SITE',
    permissions: { MAINTENANCE_MRO_HUB: getEffectivePermission(roleCode, 'MAINTENANCE_MRO_HUB') ?? undefined },
  };
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

const EXISTING_PART = { partNo: 'P-1', description: 'Gasket', qtyOnHand: 10 };

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  clearActiveSession();
  vi.unstubAllGlobals();
});

function stubFetch() {
  const postCalls: unknown[] = [];
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === 'POST' && url.includes('/adjustments')) {
      postCalls.push(JSON.parse(init.body as string));
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, part: { ...EXISTING_PART, qtyOnHand: 12 }, generatedPr: null }),
      } as Response);
    }
    return Promise.resolve({ ok: true, json: async () => ({ success: true, parts: [EXISTING_PART] }) } as Response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, postCalls };
}

function Probe({ onReady }: { onReady: (fn: ReturnType<typeof useMroInventory>) => void }) {
  const result = useMroInventory();
  onReady(result);
  return null;
}

async function mountAndCapture() {
  let result: ReturnType<typeof useMroInventory> | null = null;
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

describe('useMroInventory adjustStock RBAC gate', () => {
  it('POSTs the roleCode alongside the adjustment for an allowed role', async () => {
    setActiveSession(sessionFor('SITE_MANAGER'));
    const { postCalls } = stubFetch();
    const getResult = await mountAndCapture();

    let outcome: Awaited<ReturnType<ReturnType<typeof useMroInventory>['adjustStock']>> | null = null;
    await act(async () => {
      outcome = await getResult().adjustStock({
        partNo: 'P-1',
        txType: 'RECEIPT',
        quantity: 2,
        performedBy: 'u1',
      });
    });

    expect(outcome!.success).toBe(true);
    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({ partNo: 'P-1', roleCode: 'SITE_MANAGER' });
  });

  it('blocks the adjustment and does not fetch when the active role has no canCreate on MAINTENANCE_MRO_HUB', async () => {
    // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
    setActiveSession(sessionFor('HSSE'));
    const { fetchMock } = stubFetch();
    const getResult = await mountAndCapture();
    const callsBeforeAdjust = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/adjustments')).length;

    let outcome: Awaited<ReturnType<ReturnType<typeof useMroInventory>['adjustStock']>> | null = null;
    await act(async () => {
      outcome = await getResult().adjustStock({
        partNo: 'P-1',
        txType: 'RECEIPT',
        quantity: 2,
        performedBy: 'u1',
      });
    });

    const callsAfterAdjust = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/adjustments')).length;
    expect(callsAfterAdjust).toBe(callsBeforeAdjust);
    expect(outcome!.success).toBe(false);
    expect(outcome!.error).toContain('권한이 없습니다');
  });
});
