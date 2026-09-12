// src/components/manpower/hooks/usePTWPermitSync.ts
//
// PURPOSE
//   usePTWPermits.ts의 SQLite 동기화 전담 State Layer. useWorkOrders.ts와
//   동일 구조 — mount 시 permit lifecycle을 ptw_permits/ptw_signatures에
//   시딩(존재하는 행은 INSERT OR IGNORE로 무시됨, 멱등)하고, 응답으로 받은
//   DB 상태를 usePTWPermits.ts가 병합할 수 있도록 노출한다.
//
// NOT IN SCOPE
//   병합 시점 결정(언제 permits state에 덮어쓸지)은 usePTWPermits.ts 책임.
//   이 훅은 fetch/시딩/서버 상태 보관만 담당한다.

import { useCallback, useEffect, useState } from 'react';
import type { PTWPermit, PTWSignatureEntry, PTWWorkflowStatus } from '../../../types/lng';
import type { PTWPermitLifecycleDraft } from '../../../adapters/db/ptwPermitDao';
import type { PermitSuspensionRow } from '../../../adapters/db/permitSuspensionDao';
import { toPermitLifecycleSeed } from '../../../utils/ptwPermitRecordMapper';

const PTW_PERMITS_API = '/api/v1/cmms/ptw-permits';
const PTW_SIGNATURES_API = '/api/v1/cmms/ptw-signatures';

interface PermitsApiResponse {
  success: boolean;
  records: PTWPermitLifecycleDraft[];
  signaturesByPermit: Record<string, PTWSignatureEntry[]>;
  suspensions?: PermitSuspensionRow[];
}

export function usePTWPermitSync(permits: PTWPermit[]) {
  const [lifecycleByPermit, setLifecycleByPermit] = useState<Map<string, PTWPermitLifecycleDraft>>(new Map());
  const [signaturesByPermit, setSignaturesByPermit] = useState<Map<string, PTWSignatureEntry[]>>(new Map());
  // §5.3 AGT 4h timeout / shift-change 정지 상태 — 서버가 GET/POST 응답마다
  // on-demand로 재평가한 결과를 그대로 반영한다(클라이언트는 타이머를 돌리지 않음).
  const [suspendedByPermit, setSuspendedByPermit] = useState<Map<string, PermitSuspensionRow>>(new Map());
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (permits.length === 0) return;
    let cancelled = false;

    async function seedAndLoad() {
      try {
        const res = await fetch(PTW_PERMITS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(permits.map(toPermitLifecycleSeed)),
        });
        const json = (await res.json()) as PermitsApiResponse;
        if (!res.ok || !json.success) throw new Error('ptw-permits seed POST failed');
        if (cancelled) return;
        setLifecycleByPermit(new Map(json.records.map((r) => [r.permitId, r])));
        setSignaturesByPermit(new Map(Object.entries(json.signaturesByPermit)));
        if (json.suspensions) {
          setSuspendedByPermit(new Map(json.suspensions.map((s) => [s.permitRefNo, s])));
        }
      } catch (err) {
        console.error('[usePTWPermitSync] permit lifecycle seed/load failed:', err);
      } finally {
        if (!cancelled) setSynced(true);
      }
    }

    seedAndLoad();
    return () => {
      cancelled = true;
    };
    // permits.length만 의존성으로 둔다 — addPermit()으로 새 permit이 추가될 때만
    // 재시딩하면 되고(멱등이라 기존 행 재전송은 안전), 매 렌더 참조 변경까지
    // 추적할 필요는 없다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permits.length]);

  /** transitionStatus() 로컬 갱신 직후 호출되는 fire-and-forget 영속화 — 게이트 판정에 영향 없음. */
  const persistStatusChange = useCallback((permitId: string, status: PTWWorkflowStatus, closedAt: string | null) => {
    (async () => {
      try {
        const res = await fetch(PTW_PERMITS_API, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permitId, status, closedAt }),
        });
        const json = (await res.json()) as { success: boolean; record?: PTWPermitLifecycleDraft };
        if (res.ok && json.success && json.record) {
          setLifecycleByPermit((prev) => new Map(prev).set(permitId, json.record!));
        }
      } catch (err) {
        console.error('[usePTWPermitSync] status persistence failed:', err);
      }
    })();
  }, []);

  /** addSignature() 로컬 갱신 직후 호출되는 fire-and-forget 영속화 — 게이트 판정에 영향 없음. */
  const persistSignature = useCallback((permitId: string, entry: PTWSignatureEntry) => {
    (async () => {
      try {
        const res = await fetch(PTW_SIGNATURES_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permitId, ...entry }),
        });
        const json = (await res.json()) as { success: boolean; records?: PTWSignatureEntry[] };
        if (res.ok && json.success && json.records) {
          setSignaturesByPermit((prev) => new Map(prev).set(permitId, json.records!));
        }
      } catch (err) {
        console.error('[usePTWPermitSync] signature persistence failed:', err);
      }
    })();
  }, []);

  return { synced, lifecycleByPermit, signaturesByPermit, suspendedByPermit, persistStatusChange, persistSignature };
}
