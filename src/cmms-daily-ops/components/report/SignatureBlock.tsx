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

export function SignatureBlock({ snapshotId, role }: SignatureBlockProps) {
  const [signed, setSigned] = useState<SignatureDto | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');

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
    if (!signerName.trim()) return;
    const res = await fetch(SIGNATURES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotId, role, signerName, signerTitle: signerTitle || null }),
    });
    const json = await res.json();
    if (!json.success) return;
    const mine = (json.records as SignatureDto[]).find((r) => r.role === role);
    if (mine) setSigned(mine);
  }

  return (
    <div className={`${RAISED_PANEL} p-2 space-y-1`}>
      <div className="text-[10px] font-bold text-slate-700 uppercase">{ROLE_LABEL[role]}</div>
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
