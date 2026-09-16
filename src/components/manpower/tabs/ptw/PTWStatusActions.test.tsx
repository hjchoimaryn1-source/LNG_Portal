// @vitest-environment jsdom
//
// RBAC audit remediation — Phase 13 follow-up, 2026-09-16. Covers the
// PREPARE/ACTIVATE/CLOSE pre-flight canUpdate gate added to PTWStatusActions.tsx
// (mirrors usePatrolSaveHandler.test.tsx's manual createRoot/act mount pattern —
// no @testing-library/react in this repo).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import PTWStatusActions from './PTWStatusActions';
import { setActiveSession, clearActiveSession } from '../../../../lib/rbac/activeSessionStore';
import type { PTWPermit } from '../../../../types/lng';

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
});

const draftPermit: PTWPermit = {
  id: 'PTW-TEST-DRAFT-01',
  formNumber: 'NP07-10',
  type: 'COLD_WORK',
  equipmentTag: 'NIAS-TEST-01',
  title: 'Test cold work permit',
  location: 'Test Area',
  status: 'DRAFT',
  workLeaderId: 'EMP-999',
  workLeaderName: 'Test Work Leader',
  assignedWorkerIds: [],
  assignedWorkerNames: [],
  agtStaffId: 'EMP-998',
  approverStaffId: 'EMP-997',
  gasReadings: {
    lelPercent: 0.0,
    o2Percent: 20.9,
    h2sPpm: 0.0,
    coPpm: 0.0,
    testedAt: '2026-09-16 08:00 WIB',
    isSafeForWork: true,
  },
  safetyChecklist: {
    fireWatchAssigned: false,
    gasDetectorContinuous: false,
    lotoApplied: false,
    forcedVentilation: false,
    ppeVerified: true,
    barricadeSet: false,
  },
  validFrom: '2026-09-16 08:00',
  validTo: '2026-09-16 18:00',
  emergencyProtocol: 'Radio Ch 1',
  createdAt: '2026-09-16 07:45',
  hazardDescription: 'Test fixture — no real hazard.',
};

async function mountPrepareAction(onTransitionStatus: (permitId: string, status: PTWPermit['status']) => void) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <PTWStatusActions
        activePermit={draftPermit}
        isERTMet={true}
        isGasSafe={true}
        gasBlockReason={null}
        onTransitionStatus={onTransitionStatus}
      />
    );
  });
}

function clickPrepareButton() {
  const button = Array.from(container!.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('PREPARE & SUBMIT TO HSE')
  );
  if (!button) throw new Error('PREPARE button not found');
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('PTWStatusActions — PREPARE pre-flight RBAC gate', () => {
  it('blocks PREPARE and shows a guardrail banner when the role lacks PTW_PERMITS.canUpdate', async () => {
    // WORK_LEADER_TECH has canUpdate:false on PTW_PERMITS (rolePermissionService.ts).
    setActiveSession({ userId: 'u1', roleCode: 'WORK_LEADER_TECH', homeLocation: 'SITE' });
    const onTransitionStatus = vi.fn();
    await mountPrepareAction(onTransitionStatus);

    await act(async () => {
      clickPrepareButton();
    });

    expect(onTransitionStatus).not.toHaveBeenCalled();
    expect(container!.textContent).toContain('WORK_LEADER_TECH');
  });

  it('allows PREPARE to fire when the role has PTW_PERMITS.canUpdate', async () => {
    setActiveSession({ userId: 'u2', roleCode: 'SITE_MANAGER', homeLocation: 'SITE' });
    const onTransitionStatus = vi.fn();
    await mountPrepareAction(onTransitionStatus);

    await act(async () => {
      clickPrepareButton();
    });

    expect(onTransitionStatus).toHaveBeenCalledWith('PTW-TEST-DRAFT-01', 'PREPARED');
  });
});
