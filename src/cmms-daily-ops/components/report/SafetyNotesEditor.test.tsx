// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SafetyNotesEditor } from './SafetyNotesEditor';
import { setActiveSession, clearActiveSession, type ActiveSession } from '../../../lib/rbac/activeSessionStore';
import { getEffectivePermission } from '../../../lib/rbac/rolePermissionService';
import type { Stage1RoleCode } from '../../../lib/rbac/userSecurityRolePermissionSeed';

function sessionFor(roleCode: Stage1RoleCode): ActiveSession {
  return {
    employeeId: 'E-1',
    roleCode,
    homeLocation: 'SITE',
    permissions: { DAILY_OPS_REPORT: getEffectivePermission(roleCode, 'DAILY_OPS_REPORT') ?? undefined },
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
  clearActiveSession();
  vi.unstubAllGlobals();
});

function stubFetch(record: unknown) {
  const postCalls: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        postCalls.push(JSON.parse(init.body as string));
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, record }) } as Response);
    })
  );
  return postCalls;
}

async function mountAndFlush() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<SafetyNotesEditor snapshotId={1} />);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('SafetyNotesEditor', () => {
  it('pre-fills fields from an existing record', async () => {
    stubFetch({ unsafeActionText: 'Ran near loading area', unsafeConditionText: null, incidentText: null, remarksText: null });
    await mountAndFlush();
    const textareas = container!.querySelectorAll('textarea');
    expect((textareas[0] as HTMLTextAreaElement).value).toBe('Ran near loading area');
  });

  it('saves all 4 fields, converting blanks to null', async () => {
    setActiveSession(sessionFor('HSSE'));
    const postCalls = stubFetch(null);
    await mountAndFlush();

    const textareas = container!.querySelectorAll('textarea');
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
    act(() => {
      nativeSetter.call(textareas[0], 'Loose valve handle');
      textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === '저장')!;
    act(() => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      snapshotId: 1,
      roleCode: 'HSSE',
      unsafeActionText: 'Loose valve handle',
      unsafeConditionText: null,
      incidentText: null,
      remarksText: null,
    });
  });

  it('blocks the save and does not fetch when the active role has no canCreate on DAILY_OPS_REPORT', async () => {
    // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
    setActiveSession(sessionFor('MAINTENANCE'));
    const postCalls = stubFetch(null);
    await mountAndFlush();

    const textareas = container!.querySelectorAll('textarea');
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
    act(() => {
      nativeSetter.call(textareas[0], 'Loose valve handle');
      textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === '저장')!;
    act(() => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(postCalls).toHaveLength(0);
    expect(container!.textContent).toContain('권한이 없습니다');
  });
});
