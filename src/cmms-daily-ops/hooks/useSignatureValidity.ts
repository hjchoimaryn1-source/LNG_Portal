// src/cmms-daily-ops/hooks/useSignatureValidity.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-4) — snapshotId의 서명(daily-report-signatures
//   GET, 기존 라우트 재사용)을 가져와 isSignatureStale()로 판정한다.
//   ApprovalPanel의 "재발행됨 — 서명 확인 필요" 배지가 사용.

'use client';

import { useEffect, useState } from 'react';
import { isSignatureStale } from '../utils/signatureValidity';

const SIGNATURES_API = '/api/v1/cmms/daily-report-signatures';

export function useSignatureValidity(snapshotId: number | null, lastRegeneratedAt: string | null): boolean {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!snapshotId) {
      setStale(false);
      return;
    }
    fetch(`${SIGNATURES_API}?snapshotId=${snapshotId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records: { signedAt: string }[] }) => {
        const signedAtTimestamps = json.success ? json.records.map((r) => r.signedAt) : [];
        setStale(isSignatureStale(lastRegeneratedAt, signedAtTimestamps));
      })
      .catch(() => setStale(false));
  }, [snapshotId, lastRegeneratedAt]);

  return stale;
}
