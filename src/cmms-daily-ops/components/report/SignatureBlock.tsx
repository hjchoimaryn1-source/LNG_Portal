// src/cmms-daily-ops/components/report/SignatureBlock.tsx
//
// PURPOSE
//   Name + Title 입력 + Sign 버튼. signature_image_ref는 항상 null
//   (Stage A name+timestamp 모드) — 서명 완료 후에는 이름+시각만 텍스트로
//   표시한다. 양쪽 역할(prepared_by/acknowledged_by)이 모두 서명되면
//   API 라우트가 서버에서 직접 finalizeSnapshot()을 호출한다(이 컴포넌트는
//   그 사실만 인지할 뿐 오케스트레이션하지 않는다 — client/server 경계).

'use client';

import { useEffect, useState } from 'react';
import { SUNKEN_INPUT, BEVEL_BUTTON, RAISED_PANEL } from '../../../components/cmms/scadaStyles';
import type { SignatureRole } from '../../dao/dailyReportChildDao';
import { useActiveSession, type ActiveSession } from '../../../lib/rbac/activeSessionStore';

const SIGNATURES_API = '/api/v1/cmms/daily-report-signatures';

const ROLE_LABEL: Record<SignatureRole, string> = {
  prepared_by: 'Prepared By',
  acknowledged_by: 'Acknowledged By',
};

interface SignatureDto {
  role: SignatureRole;
  signerName: string;
  signerTitle: string | null;
  signedAt: string;
}

export interface SignatureBlockProps {
  snapshotId: number;
  role: SignatureRole;
}

// 로그인 계정 기반 기본값 — 자유 텍스트 입력의 편의 프리필일 뿐 신원 검증이
// 아니다. Stage 3(2026-09-19): USER_ACCOUNTS(구 PIN 로스터, userId 기반)와
// STAFF_MASTER_DATA(.id도 동일 구 로스터 형식)는 더 이상 ActiveSession.employeeId
// (Stage 1 personnel_master 어휘)와 같은 ID 공간이 아니라 조회 근거가 사라졌다 —
// personnel_master.full_name/position_title을 클라이언트에 내려주는 경로가
// 아직 없어(범위 밖, 필요 시 후속 스테이지) 두 필드 모두 항상 빈 값으로
// 폴백한다. 기존에도 로스터 미매칭 계정은 동일하게 ''였다 — 사용자가 자유롭게
// 직접 입력하는 흐름 자체는 그대로 동작한다.
function defaultSignerName(_session: ActiveSession | null): string {
  return '';
}

function defaultSignerTitle(_session: ActiveSession | null): string {
  return '';
}

export function SignatureBlock({ snapshotId, role }: SignatureBlockProps) {
  const activeSession = useActiveSession();
  const [signed, setSigned] = useState<SignatureDto | null>(null);
  const [signerName, setSignerName] = useState(() => defaultSignerName(activeSession));
  const [signerTitle, setSignerTitle] = useState(() => defaultSignerTitle(activeSession));
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${SIGNATURES_API}?snapshotId=${snapshotId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records: SignatureDto[] }) => {
        if (json.success) {
          const mine = json.records.find((r) => r.role === role);
          if (mine) setSigned(mine);
        }
      })
      .catch(() => {});
  }, [snapshotId, role]);

  async function handleSign() {
    setBlockedMessage(null);
    if (!signerName.trim()) return;
    if (!activeSession) {
      setBlockedMessage('로그인 세션이 없습니다.');
      return;
    }
    // RBAC audit remediation — Phase 13 follow-up, 2026-09-16. prepared_by
    // reuses DAILY_OPS_REPORT.canCreate; acknowledged_by reuses canApprove
    // (SITE_MANAGER has canCreate:false but canApprove:true on this module).
    const permission = activeSession.permissions.DAILY_OPS_REPORT;
    const permitted = role === 'prepared_by' ? permission?.canCreate : permission?.canApprove;
    if (!permitted) {
      setBlockedMessage(`역할 ${activeSession.roleCode}은(는) ${ROLE_LABEL[role]} 서명 권한이 없습니다.`);
      return;
    }

    const res = await fetch(SIGNATURES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotId, role, signerName, signerTitle: signerTitle || null, roleCode: activeSession.roleCode }),
    });
    const json = await res.json();
    if (!json.success) {
      setBlockedMessage(json.error ?? '서명 실패');
      return;
    }
    const mine = (json.records as SignatureDto[]).find((r) => r.role === role);
    if (mine) setSigned(mine);
  }

  return (
    <div className={`${RAISED_PANEL} p-2 space-y-1`}>
      <div className="text-[10px] font-bold text-slate-700 uppercase">{ROLE_LABEL[role]}</div>
      {blockedMessage && <div className="text-[11px] text-red-600 font-bold">{blockedMessage}</div>}
      {signed ? (
        <div className="text-[11px] font-mono">
          <div>
            {signed.signerName}
            {signed.signerTitle ? ` (${signed.signerTitle})` : ''}
          </div>
          <div className="text-slate-500">{signed.signedAt}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Name" className={SUNKEN_INPUT} />
          <input
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
            placeholder="Title"
            className={SUNKEN_INPUT}
          />
          <button type="button" onClick={handleSign} className={BEVEL_BUTTON}>
            Sign
          </button>
        </div>
      )}
    </div>
  );
}
