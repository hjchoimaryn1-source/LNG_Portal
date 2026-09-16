// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useWorkOrders } from './useWorkOrders';
import { setActiveSession, clearActiveSession } from '../../../lib/rbac/activeSessionStore';
import type { CmmsAssetRow } from '../../../context/CmmsAwarePortalProvider';
import type { PTWPermit } from '../../../types/lng';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

const ASSET: CmmsAssetRow = {
  equipmentTag: 'AAV-102',
  assetName: 'AAV Skid',
  isoClass: 'PRSS',
  kksCode: 'K-1',
  criticality: 'HIGH',
  locationArea: 'AAV Bay',
  status: 'OPERATIONAL',
  manufacturer: null,
  parentTag: null,
  isMockData: true,
};

// Stable references — a fresh array literal per render would change decoratedItems'
// identity every time and re-trigger the load effect forever.
const ASSETS: CmmsAssetRow[] = [ASSET];
const PERMITS: PTWPermit[] = [];

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
  const patchCalls: unknown[] = [];
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      patchCalls.push(JSON.parse(init.body as string));
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, record: { workOrderId: 'WO-2026-0001', status: 'COMPLETED' } }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, records: [{ workOrderId: 'WO-2026-0001', status: 'SCHEDULED' }] }),
    } as Response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, patchCalls };
}

function Probe({ onReady }: { onReady: (fn: ReturnType<typeof useWorkOrders>) => void }) {
  const result = useWorkOrders(ASSETS, PERMITS);
  onReady(result);
  return null;
}

async function mountAndCapture() {
  let result: ReturnType<typeof useWorkOrders> | null = null;
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

describe('useWorkOrders markCompleted RBAC gate', () => {
  it('PATCHes the roleCode alongside the completion for an allowed role', async () => {
    setActiveSession({ userId: 'u1', roleCode: 'OPERATION_TEAM_LEADER', homeLocation: 'SITE' });
    const { patchCalls } = stubFetch();
    const getResult = await mountAndCapture();

    await act(async () => {
      await getResult().markCompleted('WO-2026-0001', '2026-09-16T00:00:00.000Z');
    });

    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0]).toMatchObject({ workOrderId: 'WO-2026-0001', roleCode: 'OPERATION_TEAM_LEADER' });
    expect(getResult().blockedMessage).toBeNull();
  });

  it('blocks the completion and does not fetch when the active role has no canUpdate on WORK_ORDER_DIRECTORY', async () => {
    // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
    setActiveSession({ userId: 'u1', roleCode: 'HSSE_OFFICER', homeLocation: 'SITE' });
    const { fetchMock } = stubFetch();
    const getResult = await mountAndCapture();
    const patchCallsBefore = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'PATCH').length;

    await act(async () => {
      await getResult().markCompleted('WO-2026-0001', '2026-09-16T00:00:00.000Z');
    });

    const patchCallsAfter = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'PATCH').length;
    expect(patchCallsAfter).toBe(patchCallsBefore);
    expect(getResult().blockedMessage).toContain('권한이 없습니다');
  });
});
