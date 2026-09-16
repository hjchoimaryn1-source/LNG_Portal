// @vitest-environment jsdom
//
// RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
// Covers the ALARM_ACTION_LOG gate wired into useAlarmActionLog.ts.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useAlarmActionLog } from './useAlarmActionLog';
import { setActiveSession, clearActiveSession } from '../../lib/rbac/activeSessionStore';
import { getEffectivePermission } from '../../lib/rbac/rolePermissionService';
import { __resetAlarmSuppressionStoreForTests } from '../state/useAlarmSuppressionStore';
import { __resetAlarmAckStoreForTests } from '../state/useAlarmAckStore';

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
  __resetAlarmSuppressionStoreForTests();
  __resetAlarmAckStoreForTests();
  clearActiveSession();
  vi.unstubAllGlobals();
});

function Probe({ onReady }: { onReady: (fn: ReturnType<typeof useAlarmActionLog>) => void }) {
  const handler = useAlarmActionLog();
  onReady(handler);
  return null;
}

async function mountAndCapture() {
  let handler: ReturnType<typeof useAlarmActionLog> | null = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<Probe onReady={(fn) => (handler = fn)} />);
  });
  return handler!;
}

describe('useAlarmActionLog RBAC gate', () => {
  it.each(['SYSTEM_ADMIN', 'SITE_MANAGER', 'OPERATION_TEAM_LEADER'] as const)(
    'allows %s to acknowledge and fires the request',
    async (roleCode) => {
      setActiveSession({ userId: 'u1', roleCode, homeLocation: 'SITE' });
      const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true }) });
      vi.stubGlobal('fetch', fetchMock);

      const handler = await mountAndCapture();
      let err: string | null = null;
      await act(async () => {
        err = await handler.acknowledge('aav', 'AAV-102', 'pressure_gauge_us_bar');
      });

      expect(err).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );

  it('blocks a disallowed role (WORK_LEADER_TECH) and does not fetch', async () => {
    setActiveSession({ userId: 'u1', roleCode: 'WORK_LEADER_TECH', homeLocation: 'SITE' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const handler = await mountAndCapture();
    let err: string | null = null;
    await act(async () => {
      err = await handler.acknowledge('aav', 'AAV-102', 'pressure_gauge_us_bar');
    });

    expect(err).toBe('역할 WORK_LEADER_TECH은(는) 알람 조치 기록 권한이 없습니다.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('confirms the HSSE_OFFICER forward-provisioned row is wired (static permission-table check only)', () => {
    expect(getEffectivePermission('HSSE_OFFICER', 'ALARM_ACTION_LOG')?.canCreate).toBe(true);
  });
});
