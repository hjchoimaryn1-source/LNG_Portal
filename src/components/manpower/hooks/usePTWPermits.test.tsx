// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { usePTWPermits } from './usePTWPermits';
import { setActiveSession, clearActiveSession } from '../../../lib/rbac/activeSessionStore';

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
    setActiveSession({ userId: 'u1', roleCode: 'WORK_LEADER_TECH', homeLocation: 'SITE' });
    const { signaturePostCalls } = stubFetch();
    const getResult = await mountAndCapture();
    const permitId = getResult().permits[0].id;

    await act(async () => {
      getResult().addSignature(permitId, 'WORK_LEADER_ACCEPT', 'S-1', 'Tech One');
      await Promise.resolve();
    });

    expect(signaturePostCalls).toHaveLength(1);
    expect(signaturePostCalls[0]).toMatchObject({ permitId, roleCode: 'WORK_LEADER_TECH', role: 'WORK_LEADER_ACCEPT' });
  });

  it('blocks the signature and does not fetch when the active role is forced read-only on PTW_PERMITS', async () => {
    // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
    setActiveSession({ userId: 'u1', roleCode: 'HQ_SUPERVISOR_AUDITOR', homeLocation: 'HQ' });
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { fetchMock } = stubFetch();
    const getResult = await mountAndCapture();
    const permitId = getResult().permits[0].id;
    const signatureCallsBefore = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/ptw-signatures')).length;

    await act(async () => {
      getResult().addSignature(permitId, 'WORK_LEADER_ACCEPT', 'S-1', 'Auditor One');
      await Promise.resolve();
    });

    const signatureCallsAfter = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/ptw-signatures')).length;
    expect(signatureCallsAfter).toBe(signatureCallsBefore);
    expect(alertSpy).toHaveBeenCalled();
  });
});
