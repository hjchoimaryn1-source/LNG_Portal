// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { usePatrolSaveHandler } from './usePatrolSaveHandler';
import {
  useDailyOpsPatrolValue,
  __resetDailyOpsPatrolStoreForTests,
} from '../state/useDailyOpsPatrolStore';
import { setActiveSession, clearActiveSession, type ActiveSession } from '../../lib/rbac/activeSessionStore';
import { getEffectivePermission } from '../../lib/rbac/rolePermissionService';
import type { Stage1RoleCode } from '../../lib/rbac/userSecurityRolePermissionSeed';

function sessionFor(roleCode: Stage1RoleCode): ActiveSession {
  return {
    employeeId: 'E-1',
    roleCode,
    homeLocation: 'SITE',
    permissions: { DAILY_OPS_PATROL_ENTRY: getEffectivePermission(roleCode, 'DAILY_OPS_PATROL_ENTRY') ?? undefined },
  };
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  __resetDailyOpsPatrolStoreForTests();
  clearActiveSession();
  vi.unstubAllGlobals();
});

function Probe({
  onSaved,
  onBlocked,
}: {
  onSaved: (fn: ReturnType<typeof usePatrolSaveHandler>) => void;
  onBlocked?: (reason: string) => void;
}) {
  const handler = usePatrolSaveHandler('aav', '2026-09-14', 'FIELD OP-1', onBlocked);
  onSaved(handler);
  const value = useDailyOpsPatrolValue('aav', 'AAV-102', 'pressure_gauge_us_bar');
  return <span data-testid="value">{value === undefined ? 'undefined' : String(value)}</span>;
}

async function mountAndCapture() {
  let handler: ReturnType<typeof usePatrolSaveHandler> | null = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<Probe onSaved={(fn) => (handler = fn)} />);
  });
  return handler!;
}

describe('usePatrolSaveHandler', () => {
  it('POSTs the domain/reportDate/recordedBy alongside the form input, then updates the B2 store on success', async () => {
    setActiveSession(sessionFor('SITE_MANAGER'));
    const postCalls: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        postCalls.push(JSON.parse(init!.body as string));
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
      })
    );

    const handler = await mountAndCapture();
    await act(async () => {
      handler({
        equipmentTag: 'AAV-102',
        shiftTimeSlot: '08:00',
        values: { pressure_gauge_us_bar: 4.2 },
        readingStatus: 'normal',
        remarkText: null,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      domain: 'aav',
      reportDate: '2026-09-14',
      recordedBy: 'FIELD OP-1',
      roleCode: 'SITE_MANAGER',
      equipmentTag: 'AAV-102',
    });
    expect(container!.querySelector('[data-testid="value"]')!.textContent).toBe('4.2');
  });

  it('does not update the B2 store when the save fails', async () => {
    setActiveSession(sessionFor('SITE_MANAGER'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) }));

    const handler = await mountAndCapture();
    await act(async () => {
      handler({
        equipmentTag: 'AAV-102',
        shiftTimeSlot: '08:00',
        values: { pressure_gauge_us_bar: 9.9 },
        readingStatus: 'normal',
        remarkText: null,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container!.querySelector('[data-testid="value"]')!.textContent).toBe('undefined');
  });

  it('blocks the save and does not fetch when the active role is outside the allow-list', async () => {
    setActiveSession(sessionFor('HSSE'));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const blocked: string[] = [];

    let handler: ReturnType<typeof usePatrolSaveHandler> | null = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(
        <Probe onSaved={(fn) => (handler = fn)} onBlocked={(reason) => blocked.push(reason)} />
      );
    });

    await act(async () => {
      handler!({
        equipmentTag: 'AAV-102',
        shiftTimeSlot: '08:00',
        values: { pressure_gauge_us_bar: 4.2 },
        readingStatus: 'normal',
        remarkText: null,
      });
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(blocked).toHaveLength(1);
  });

  it('blocks the save when there is no active session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const handler = await mountAndCapture();
    await act(async () => {
      handler({
        equipmentTag: 'AAV-102',
        shiftTimeSlot: '08:00',
        values: { pressure_gauge_us_bar: 4.2 },
        readingStatus: 'normal',
        remarkText: null,
      });
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
