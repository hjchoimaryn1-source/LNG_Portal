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
      const payload: StockAdjustmentInput = {
        partNo: input.partNo,
        txType: input.txType,
        quantity: input.quantity,
        reason: input.reason ?? null,
        performedBy: input.performedBy,
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
    []
  );

  return { parts, loading, error, adjustStock };
}
