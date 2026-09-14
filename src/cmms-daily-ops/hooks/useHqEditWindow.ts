// src/cmms-daily-ops/hooks/useHqEditWindow.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-2) — APPROVED 리포트의 HQ 임시 수정 창(open/close)
//   상태 계층. useDailyReportApproval과 동일하게 evaluateMutationGuardrails +
//   getEffectivePermission(canUnlockApproved) 두 겹으로 막고, 서버도 후자를
//   재검증한다. 열기/닫기 성공 후에는 호출부가 넘겨준 reloadSnapshot()으로
//   최신 hq_edit_* 상태를 다시 읽어온다.

'use client';

import { useState } from 'react';
import { useActiveSession } from '../../lib/rbac/activeSessionStore';
import { evaluateMutationGuardrails } from '../../adapters/guardrailUiAdapter';
import { getEffectivePermission } from '../../lib/rbac/rolePermissionService';
import type { DailyReportSnapshotSummary } from './useDailyReportApproval';

const OPEN_API = '/api/v1/cmms/daily-report-hq-edit-open';
const CLOSE_API = '/api/v1/cmms/daily-report-hq-edit-close';

export function useHqEditWindow(snapshot: DailyReportSnapshotSummary | null, reloadSnapshot: () => void) {
  const activeSession = useActiveSession();
  const [message, setMessage] = useState<string | null>(null);

  // canUnlockApproved: SYSTEM_ADMIN만 true(rolePermissionService.ts D-ADD-2).
  const canUnlockApproved = activeSession
    ? getEffectivePermission(activeSession.roleCode, 'DAILY_OPS_REPORT')?.canUnlockApproved === true
    : false;

  async function openWindow(reasonText: string): Promise<void> {
    setMessage(null);
    if (!snapshot || !activeSession) {
      setMessage('로그인 세션이 없습니다.');
      return;
    }
    if (!canUnlockApproved) {
      setMessage(`역할 ${activeSession.roleCode}은(는) HQ 수정 창을 열 권한이 없습니다.`);
      return;
    }
    if (!reasonText.trim()) {
      setMessage('수정 창을 여는 사유를 입력하세요.');
      return;
    }
    const guard = evaluateMutationGuardrails({ roleCode: activeSession.roleCode, action: 'APPROVE' });
    if (!guard.allowed) {
      setMessage(guard.reason ?? 'HQ EDIT OPEN BLOCKED');
      return;
    }

    const res = await fetch(OPEN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshotId: snapshot.id,
        roleCode: activeSession.roleCode,
        actorId: activeSession.userId,
        reasonText,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error ?? 'HQ 수정 창 열기 실패');
      return;
    }
    setMessage('HQ 수정 창이 열렸습니다 — patrol 저장/리포트 재생성이 임시로 허용됩니다.');
    reloadSnapshot();
  }

  async function closeWindow(summaryText: string): Promise<void> {
    setMessage(null);
    if (!snapshot || !activeSession) {
      setMessage('로그인 세션이 없습니다.');
      return;
    }
    if (!canUnlockApproved) {
      setMessage(`역할 ${activeSession.roleCode}은(는) HQ 수정 창을 닫을 권한이 없습니다.`);
      return;
    }
    if (!summaryText.trim()) {
      setMessage('수정 완료 통보 요약을 입력하세요.');
      return;
    }
    const guard = evaluateMutationGuardrails({ roleCode: activeSession.roleCode, action: 'APPROVE' });
    if (!guard.allowed) {
      setMessage(guard.reason ?? 'HQ EDIT CLOSE BLOCKED');
      return;
    }

    const res = await fetch(CLOSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshotId: snapshot.id,
        roleCode: activeSession.roleCode,
        actorId: activeSession.userId,
        summaryText,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error ?? 'HQ 수정 창 닫기 실패');
      return;
    }
    setMessage('HQ 수정이 완료되어 Site Manager에게 통보되었습니다.');
    reloadSnapshot();
  }

  return { canUnlockApproved, message, openWindow, closeWindow };
}
