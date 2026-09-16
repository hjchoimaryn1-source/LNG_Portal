// src/components/inventory/hooks/useMroInventory.ts
//
// PURPOSE
//   MroInventoryView의 State Layer. mro_parts 테이블을 최초 로드 시 조회하고,
//   비어있으면 mockMroInventoryGenerator.ts로 1회 폴백 시딩한다
//   (useWorkOrders.ts와 동일한 fetch-then-seed 패턴).

import { useCallback, useEffect, useState } from 'react';
import { buildMockMroParts } from '../../../data/mockMroInventoryGenerator';
import type { MroPartRecord, StockAdjustmentInput, StockTxType } from '../../../adapters/db/mroInventoryDao';
import type { PurchaseRequisitionRecord } from '../../../adapters/db/purchaseRequisitionDao';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import { evaluateMutationGuardrails } from '../../../adapters/guardrailUiAdapter';
import { getEffectivePermission } from '../../../lib/rbac/rolePermissionService';
import { SESSION_EXPIRED_MESSAGE } from '../../../lib/rbac/sessionExpiryMessage';

const PARTS_API = '/api/v1/cmms/mro-inventory';
const ADJUSTMENTS_API = '/api/v1/cmms/mro-inventory/adjustments';

interface PartsApiResponse {
  success: boolean;
  parts: MroPartRecord[];
}

export function useMroInventory() {
  const [parts, setParts] = useState<MroPartRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const activeSession = useActiveSession();

  useEffect(() => {
    let cancelled = false;

    async function loadAndSeed() {
      setLoading(true);
      setError(null);
      try {
        const getRes = await fetch(PARTS_API, { cache: 'no-store' });
        const getJson = (await getRes.json()) as PartsApiResponse;
        if (!getRes.ok || !getJson.success) throw new Error('mro-inventory GET failed');

        let current = getJson.parts;
        if (current.length === 0) {
          const seedRes = await fetch(PARTS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildMockMroParts()),
          });
          const seedJson = (await seedRes.json()) as PartsApiResponse;
          if (!seedRes.ok || !seedJson.success) throw new Error('mro-inventory seed POST failed');
          current = seedJson.parts;
        }

        if (!cancelled) setParts(current);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAndSeed();
    return () => {
      cancelled = true;
    };
  }, []);

  const adjustStock = useCallback(
    async (input: {
      partNo: string;
      txType: StockTxType;
      quantity: number;
      reason?: string;
      performedBy: string;
    }): Promise<{ success: boolean; error?: string; generatedPr?: PurchaseRequisitionRecord | null }> => {
      // Phase 3 MOD_5: Auditor Mode hard block. No fatigueCheck — `performedBy` is
      // freeform text (StockAdjustmentModal.tsx: "사번 또는 이름"), not a validated
      // userId matching daily_shift_assignments.userId, so it can't be looked up
      // reliably (see CMMS_Architecture.md §3.4 Phase 3 notes).
      // Stage 3 Step 3: previously fail-open when no active session existed —
      // now blocks with a session-expired message instead of proceeding unguarded.
      if (!activeSession) {
        return { success: false, error: SESSION_EXPIRED_MESSAGE };
      }
      // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
      if (getEffectivePermission(activeSession.roleCode, 'MAINTENANCE_MRO_HUB')?.canCreate !== true) {
        return { success: false, error: `역할 ${activeSession.roleCode}은(는) 재고 조정 권한이 없습니다.` };
      }
      const guard = evaluateMutationGuardrails({ roleCode: activeSession.roleCode, action: 'UPDATE' });
      if (!guard.allowed) {
        return { success: false, error: guard.reason };
      }

      const payload: StockAdjustmentInput & { roleCode: typeof activeSession.roleCode } = {
        partNo: input.partNo,
        txType: input.txType,
        quantity: input.quantity,
        reason: input.reason ?? null,
        performedBy: input.performedBy,
        roleCode: activeSession.roleCode,
      };
      const res = await fetch(ADJUSTMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success: boolean;
        part?: MroPartRecord;
        error?: string;
        generatedPr?: PurchaseRequisitionRecord | null;
      };
      if (res.ok && json.success && json.part) {
        setParts((prev) => prev.map((p) => (p.partNo === json.part!.partNo ? json.part! : p)));
        return { success: true, generatedPr: json.generatedPr ?? null };
      }
      return { success: false, error: json.error ?? 'Adjustment failed' };
    },
    [activeSession]
  );

  return { parts, loading, error, adjustStock };
}
