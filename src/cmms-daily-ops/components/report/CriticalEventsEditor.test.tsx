// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CriticalEventsEditor } from './CriticalEventsEditor';
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

function stubFetch(existing: unknown[]) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      return Promise.resolve({ ok: true, json: async () => ({ success: true, id: 99 }) } as Response);
    }
    if (init?.method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
    }
    return Promise.resolve({ ok: true, json: async () => ({ success: true, records: existing }) } as Response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function mountAndFlush(snapshotId = 1) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<CriticalEventsEditor snapshotId={snapshotId} />);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('CriticalEventsEditor', () => {
  it('always shows at least 3 blank draft rows even with no saved events', async () => {
    stubFetch([]);
    await mountAndFlush();
    const rows = container!.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('renders saved events read-only above the draft rows, still keeping 3 drafts', async () => {
    stubFetch([{ id: 1, eventTime: '10:00', equipmentSystem: 'AAV-102', conditionAlarm: null, impact: null, immediateAction: null, status: null, pic: null }]);
    await mountAndFlush();
    expect(container!.textContent).toContain('AAV-102');
    expect(container!.querySelectorAll('tbody tr')).toHaveLength(4); // 1 saved + 3 drafts
  });

  it('saving a draft row replaces it with a saved row and keeps the minimum of 3 drafts', async () => {
    setActiveSession({ userId: 'u1', roleCode: 'OPERATION_TEAM_LEADER', homeLocation: 'SITE' });
    stubFetch([]);
    await mountAndFlush();

    const firstInput = container!.querySelector('tbody tr td input') as HTMLInputElement;
    const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      nativeValueSetter.call(firstInput, '08:00');
      firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === '저장')!;
    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container!.querySelectorAll('tbody tr')).toHaveLength(4); // 1 saved + 3 fresh drafts
    expect(container!.textContent).toContain('08:00');
  });

  it('blocks the save and does not fetch when the active role has no canCreate on DAILY_OPS_REPORT', async () => {
    // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
    setActiveSession({ userId: 'u1', roleCode: 'WORK_LEADER_TECH', homeLocation: 'SITE' });
    const fetchMock = stubFetch([]);
    await mountAndFlush();

    const firstInput = container!.querySelector('tbody tr td input') as HTMLInputElement;
    const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      nativeValueSetter.call(firstInput, '08:00');
      firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === '저장')!;
    const postCallsBefore = (fetchMock as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => (c[1] as RequestInit | undefined)?.method === 'POST'
    ).length;
    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const postCallsAfter = (fetchMock as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => (c[1] as RequestInit | undefined)?.method === 'POST'
    ).length;
    expect(postCallsAfter).toBe(postCallsBefore);
    expect(container!.textContent).toContain('권한이 없습니다');
  });
});
