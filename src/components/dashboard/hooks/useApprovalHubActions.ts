// src/components/dashboard/hooks/useApprovalHubActions.ts
//
// PURPOSE
//   ApprovalHubPanel의 State Layer. WO/MRO_REQ/SHIFT_OVERRIDE 승인/반려
//   액션(Stage 2c 엔드포인트 3개)을 문서 타입별로 올바른 라우트/payload로
//   분기해 호출한다. PTW는 이 훅의 대상이 아니다(기존 PTWStatusActions.tsx
//   딥링크를 그대로 쓴다 — Stage 1d 보류 중이라 가짜 인라인 승인 버튼을 만들지 않음).

import { useState, useCallback } from 'react';
import type { ApprovalHubDocType } from '../../../adapters/overviewSummaryAdapter';

type ApprovalDecision = 'SITE_APPROVED' | 'REJECTED';

const APPROVE_ENDPOINTS: Partial<Record<ApprovalHubDocType, string>> = {
  WORK_ORDER: '/api/v1/cmms/work-orders/approve',
  MRO_REQ: '/api/v1/cmms/mro-inventory/requisitions/approve',
  SHIFT_OVERRIDE: '/api/v1/cmms/shift-overrides/approve',
};

function buildBody(docType: ApprovalHubDocType, id: string, decision: ApprovalDecision): Record<string, unknown> | null {
  switch (docType) {
    case 'WORK_ORDER':
      return { workOrderId: id, decision };
    case 'MRO_REQ':
      return { prId: Number(id), decision };
    case 'SHIFT_OVERRIDE':
      return { id: Number(id), decision };
    default:
      return null;
  }
}

export function useApprovalHubActions(onApplied: () => void) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(
    async (docType: ApprovalHubDocType, id: string, decision: ApprovalDecision) => {
      const endpoint = APPROVE_ENDPOINTS[docType];
      const body = buildBody(docType, id, decision);
      if (!endpoint || !body) return;

      const key = `${docType}:${id}`;
      setPendingKey(key);
      setError(null);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? `${docType} approval failed`);
        }
        onApplied();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setPendingKey(null);
      }
    },
    [onApplied]
  );

  return { approve, pendingKey, error };
}
