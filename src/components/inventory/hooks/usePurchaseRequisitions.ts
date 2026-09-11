// src/components/inventory/hooks/usePurchaseRequisitions.ts
//
// PURPOSE
//   MroInventoryView가 부품별 OPEN 자동 구매요청(PR) 여부를 표시하기 위한
//   State Layer. useMroInventory.ts와 동일한 fetch-on-mount 패턴이며, 발행
//   쓰기는 하지 않는다(트리거는 useMroInventory().adjustStock() 소관).

import { useCallback, useEffect, useState } from 'react';
import type { PurchaseRequisitionRecord } from '../../../adapters/db/purchaseRequisitionDao';

const REQUISITIONS_API = '/api/v1/cmms/mro-inventory/requisitions';

interface RequisitionsApiResponse {
  success: boolean;
  requisitions: PurchaseRequisitionRecord[];
}

export function usePurchaseRequisitions() {
  const [requisitions, setRequisitions] = useState<PurchaseRequisitionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(REQUISITIONS_API, { cache: 'no-store' });
      const json = (await res.json()) as RequisitionsApiResponse;
      if (res.ok && json.success) setRequisitions(json.requisitions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { requisitions, loading, refresh };
}
