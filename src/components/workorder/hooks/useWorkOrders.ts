// src/components/workorder/hooks/useWorkOrders.ts
//
// PURPOSE
//   WorkOrderListView의 State Layer. mockWorkOrderGenerator.ts로 만든 장식적
//   WOItem[](category/priority/tech/permitRefNo 파생)에 SQLite work_orders
//   테이블의 status/next_due_date(SSOT)를 병합한다. DB가 비어있으면 최초
//   1회 폴백 시딩을 수행한다(work_orders 테이블 자체가 SSOT가 되도록).
//
// NOT IN SCOPE
//   category/priority/tech/permitRefNo 파생 로직 재구현 — mockWorkOrderGenerator.ts
//   그대로 재사용. work_orders 스키마 확장 — 별도 결정 없이 추가하지 말 것
//   (src/adapters/db/workOrderDao.ts 헤더 참고).

import { useEffect, useMemo, useState } from 'react';
import type { CmmsAssetRow } from '../../../context/CmmsAwarePortalProvider';
import type { PTWPermit, WOItem } from '../../../types/lng';
import { buildMockWorkOrdersFromAssets } from '../../cmms/mockWorkOrderGenerator';
import { toNewWorkOrderInput, applyRecordToItem } from '../../../utils/workOrderRecordMapper';
import type { WorkOrderRecord } from '../../../adapters/db/workOrderDao';

const WORK_ORDERS_API = '/api/v1/cmms/work-orders';

interface WorkOrdersApiResponse {
  success: boolean;
  records: WorkOrderRecord[];
}

export function useWorkOrders(cmmsAssetRows: CmmsAssetRow[], permits: PTWPermit[]) {
  const [records, setRecords] = useState<WorkOrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const decoratedItems = useMemo(
    () => buildMockWorkOrdersFromAssets(cmmsAssetRows, permits),
    [cmmsAssetRows, permits]
  );

  useEffect(() => {
    if (decoratedItems.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAndSeed() {
      setLoading(true);
      setError(null);
      try {
        const getRes = await fetch(WORK_ORDERS_API, { cache: 'no-store' });
        const getJson = (await getRes.json()) as WorkOrdersApiResponse;
        if (!getRes.ok || !getJson.success) throw new Error('work-orders GET failed');

        let current = getJson.records;
        if (current.length === 0) {
          const seedRes = await fetch(WORK_ORDERS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(decoratedItems.map(toNewWorkOrderInput)),
          });
          const seedJson = (await seedRes.json()) as WorkOrdersApiResponse;
          if (!seedRes.ok || !seedJson.success) throw new Error('work-orders seed POST failed');
          current = seedJson.records;
        }

        if (!cancelled) setRecords(current);
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
    // decoratedItems는 asset/permits 참조가 바뀔 때만 새 배열이 되므로 시딩 재요청은 그때만 일어난다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoratedItems]);

  const recordsById = useMemo(() => new Map(records.map((r) => [r.workOrderId, r])), [records]);
  const workOrders: WOItem[] = useMemo(
    () => decoratedItems.map((item) => applyRecordToItem(item, recordsById.get(item.wo))),
    [decoratedItems, recordsById]
  );

  async function markCompleted(workOrderId: string, lastPerformedAt: string) {
    const res = await fetch(WORK_ORDERS_API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workOrderId, lastPerformedAt, status: 'COMPLETED' }),
    });
    const json = (await res.json()) as { success: boolean; record?: WorkOrderRecord };
    if (res.ok && json.success && json.record) {
      setRecords((prev) => prev.map((r) => (r.workOrderId === workOrderId ? json.record! : r)));
    }
  }

  return { workOrders, loading, error, markCompleted };
}
