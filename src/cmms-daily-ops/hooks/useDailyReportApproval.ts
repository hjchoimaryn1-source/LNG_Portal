// src/cmms-daily-ops/hooks/useDailyReportApproval.ts
//
// PURPOSE
//   Phase 12 Pre-Flight III — Daily Ops Overview 탭의 상태 계층. reportDate
//   기준 스냅샷(id/status) 조회, "Generate Daily Report" 액션, Site Manager
//   승인 액션을 담당한다. 승인 액션은 PTWStatusActions.tsx와 동일한 패턴으로
//   evaluateMutationGuardrails(Auditor Mode/피로도 공용 가드) +
//   getEffectivePermission(역할별 DAILY_OPS_REPORT.canApprove) 두 겹으로
//   막는다 — 서버(daily-report-approval/route.ts)도 후자를 재검증한다.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useActiveSession } from '../../lib/rbac/activeSessionStore';
import { evaluateMutationGuardrails } from '../../adapters/guardrailUiAdapter';
import { getEffectivePermission } from '../../lib/rbac/rolePermissionService';
import type { DailyReportStatus } from '../dao/dailyReportSnapshotDao';

const SNAPSHOTS_API = '/api/v1/cmms/daily-report-snapshots';
const APPROVAL_API = '/api/v1/cmms/daily-report-approval';
const REJECT_API = '/api/v1/cmms/daily-report-reject';

export interface DailyReportSnapshotSummary {
  id: number;
  status: DailyReportStatus;
  generatedBy: string;
  generatedAt: string;
}

export function useDailyReportApproval(reportDate: string) {
  const activeSession = useActiveSession();
  const [snapshot, setSnapshot] = useState<DailyReportSnapshotSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    fetch(`${SNAPSHOTS_API}?reportDate=${reportDate}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; snapshot: DailyReportSnapshotSummary | null }) => {
        setSnapshot(json.success ? json.snapshot : null);
      })
      .catch(() => setSnapshot(null))
      .finally(() => setLoading(false));
  }, [reportDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function generate(generatedBy: string): Promise<void> {
    setMessage(null);
    if (!generatedBy.trim()) {
      setMessage('이름을 입력하세요.');
      return;
    }
    const res = await fetch(SNAPSHOTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportDate, generatedBy }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error ?? '리포트 생성 실패');
      return;
    }
    setMessage('리포트가 생성되었습니다.');
    reload();
  }

  // canApprove: 역할이 DAILY_OPS_REPORT.canApprove 권한을 갖는지(SITE_MANAGER/
  // ACTING_SITE_MANAGER/SYSTEM_ADMIN). 세션이 아직 없으면(로그인 전) false.
  const canApprove = activeSession
    ? getEffectivePermission(activeSession.roleCode, 'DAILY_OPS_REPORT')?.canApprove === true
    : false;

  async function approve(): Promise<void> {
    setMessage(null);
    if (!snapshot) return;
    if (!activeSession) {
      setMessage('로그인 세션이 없습니다.');
      return;
    }
    if (!canApprove) {
      setMessage(`역할 ${activeSession.roleCode}은(는) Daily Ops 리포트를 승인할 권한이 없습니다.`);
      return;
    }
    const guard = evaluateMutationGuardrails({ roleCode: activeSession.roleCode, action: 'APPROVE' });
    if (!guard.allowed) {
      setMessage(guard.reason ?? 'APPROVAL BLOCKED');
      return;
    }

    const res = await fetch(APPROVAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotId: snapshot.id, roleCode: activeSession.roleCode, actorId: activeSession.userId }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error ?? '승인 실패');
      return;
    }
    setMessage('Site Manager 승인이 완료되었습니다. 해당 날짜는 잠겼습니다.');
    reload();
  }

  // D-ADD-1 — 반려는 승인과 동일한 canApprove 권한 티어를 요구한다.
  async function reject(reasonText: string): Promise<void> {
    setMessage(null);
    if (!snapshot) return;
    if (!activeSession) {
      setMessage('로그인 세션이 없습니다.');
      return;
    }
    if (!canApprove) {
      setMessage(`역할 ${activeSession.roleCode}은(는) Daily Ops 리포트를 반려할 권한이 없습니다.`);
      return;
    }
    if (!reasonText.trim()) {
      setMessage('반려 사유를 입력하세요.');
      return;
    }
    const guard = evaluateMutationGuardrails({ roleCode: activeSession.roleCode, action: 'APPROVE' });
    if (!guard.allowed) {
      setMessage(guard.reason ?? 'REJECT BLOCKED');
      return;
    }

    const res = await fetch(REJECT_API, {
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
      setMessage(json.error ?? '반려 실패');
      return;
    }
    setMessage('리포트가 반려되어 DRAFT로 되돌아갔습니다.');
    reload();
  }

  return { snapshot, loading, message, canApprove, generate, approve, reject, reload };
}
