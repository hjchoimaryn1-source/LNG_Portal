// src/components/dashboard/hooks/useOverviewSummary.ts
//
// PURPOSE
//   CmmsOverviewDashboardView의 State Layer. /api/v1/cmms/overview/summary
//   (src/adapters/overviewSummaryAdapter.ts)를 조회한다. useWorkOrders.ts/
//   useMroInventory.ts와 동일한 fetch 패턴 — 이 API는 읽기 전용(GET)만
//   노출하므로 시딩 로직은 없다.

import { useCallback, useEffect, useState } from 'react';
import type { OverviewSummary } from '../../../adapters/overviewSummaryAdapter';

const OVERVIEW_SUMMARY_API = '/api/v1/cmms/overview/summary';

interface OverviewSummaryApiResponse {
  success: boolean;
  summary: OverviewSummary;
}

export function useOverviewSummary() {
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OVERVIEW_SUMMARY_API, { cache: 'no-store' });
      const json = (await res.json()) as OverviewSummaryApiResponse;
      if (!res.ok || !json.success) throw new Error('overview/summary GET failed');
      setSummary(json.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
