// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SignatureBlock } from './SignatureBlock';
import { setActiveSession, clearActiveSession } from '../../../lib/rbac/activeSessionStore';

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
  clearActiveSession();
  vi.unstubAllGlobals();
});

function stubFetch(getRecords: unknown[], postRecords: unknown[]) {
  const postCalls: unknown[] = [];
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      postCalls.push(JSON.parse(init.body as string));
      return Promise.resolve({ ok: true, json: async () => ({ success: true, records: postRecords }) } as Response);
    }
    return Promise.resolve({ ok: true, json: async () => ({ success: true, records: getRecords }) } as Response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, postCalls };
}

async function signAs(name: string) {
  const nameInput = container!.querySelector('input[placeholder="Name"]') as HTMLInputElement;
  const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    nativeValueSetter.call(nameInput, name);
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const signButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === 'Sign')!;
  await act(async () => {
    signButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
  });
}

async function mountAndFlush(role: 'prepared_by' | 'acknowledged_by' = 'prepared_by') {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<SignatureBlock snapshotId={1} role={role} />);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('SignatureBlock', () => {
  it('shows the sign form when no signature exists yet for this role', async () => {
    stubFetch([], []);
    await mountAndFlush();
    expect(container!.querySelector('input[placeholder="Name"]')).not.toBeNull();
  });

  it('shows only signer name + signed_at as text once signed for this role (no image)', async () => {
    stubFetch(
      [{ role: 'prepared_by', signerName: 'Ahmad', signerTitle: 'Field Supervisor', signedAt: '2026-09-14T10:00:00Z' }],
      []
    );
    await mountAndFlush('prepared_by');
    expect(container!.textContent).toContain('Ahmad (Field Supervisor)');
    expect(container!.textContent).toContain('2026-09-14T10:00:00Z');
    expect(container!.querySelector('img')).toBeNull();
    expect(container!.querySelector('input')).toBeNull();
  });

  it('does not react to the other role signature (only shows its own role)', async () => {
    stubFetch([{ role: 'acknowledged_by', signerName: 'HJ', signerTitle: null, signedAt: '2026-09-14T12:00:00Z' }], []);
    await mountAndFlush('prepared_by');
    expect(container!.querySelector('input[placeholder="Name"]')).not.toBeNull();
    expect(container!.textContent).not.toContain('HJ');
  });

  // RBAC audit remediation — Phase 13 follow-up, 2026-09-16 (split by signature type).
  describe('prepared_by permission gate (DAILY_OPS_REPORT.canCreate)', () => {
    it('allows OPERATION_TEAM_LEADER (canCreate=true) to sign and POSTs roleCode', async () => {
      setActiveSession({ userId: 'u1', roleCode: 'OPERATION_TEAM_LEADER', homeLocation: 'SITE' });
      const { postCalls } = stubFetch([], [{ role: 'prepared_by', signerName: 'OTL', signerTitle: null, signedAt: 'now' }]);
      await mountAndFlush('prepared_by');
      await signAs('OTL');

      expect(postCalls).toHaveLength(1);
      expect(postCalls[0]).toMatchObject({ role: 'prepared_by', roleCode: 'OPERATION_TEAM_LEADER' });
      expect(container!.textContent).toContain('OTL');
    });

    it('blocks SITE_MANAGER (canCreate=false) from signing prepared_by and does not fetch', async () => {
      setActiveSession({ userId: 'u1', roleCode: 'SITE_MANAGER', homeLocation: 'SITE' });
      const { fetchMock } = stubFetch([], []);
      await mountAndFlush('prepared_by');
      const postCallsBefore = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST').length;
      await signAs('SM');
      const postCallsAfter = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST').length;

      expect(postCallsAfter).toBe(postCallsBefore);
      expect(container!.textContent).toContain('권한이 없습니다');
    });
  });

  describe('acknowledged_by permission gate (DAILY_OPS_REPORT.canApprove)', () => {
    it('allows SITE_MANAGER (canApprove=true) to sign and POSTs roleCode', async () => {
      setActiveSession({ userId: 'u1', roleCode: 'SITE_MANAGER', homeLocation: 'SITE' });
      const { postCalls } = stubFetch([], [{ role: 'acknowledged_by', signerName: 'SM', signerTitle: null, signedAt: 'now' }]);
      await mountAndFlush('acknowledged_by');
      await signAs('SM');

      expect(postCalls).toHaveLength(1);
      expect(postCalls[0]).toMatchObject({ role: 'acknowledged_by', roleCode: 'SITE_MANAGER' });
      expect(container!.textContent).toContain('SM');
    });

    it('blocks OPERATION_TEAM_LEADER (canApprove=false) from signing acknowledged_by and does not fetch', async () => {
      setActiveSession({ userId: 'u1', roleCode: 'OPERATION_TEAM_LEADER', homeLocation: 'SITE' });
      const { fetchMock } = stubFetch([], []);
      await mountAndFlush('acknowledged_by');
      const postCallsBefore = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST').length;
      await signAs('OTL');
      const postCallsAfter = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST').length;

      expect(postCallsAfter).toBe(postCallsBefore);
      expect(container!.textContent).toContain('권한이 없습니다');
    });
  });
});
