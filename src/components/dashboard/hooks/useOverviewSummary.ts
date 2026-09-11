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
const AUTO_REFRESH_INTERVAL_MS = 10_000;

interface OverviewSummaryApiResponse {
  success: boolean;
  summary: OverviewSummary;
}

export function useOverviewSummary() {
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // silent=true: 10초 백그라운드 폴링 전용 — loading/error 토글을 건너뛰어
  // 데이터 미변경 시 패널이 "로딩 중..."으로 깜빡이는 현상을 방지한다.
  const refresh = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(OVERVIEW_SUMMARY_API, { cache: 'no-store' });
      const json = (await res.json()) as OverviewSummaryApiResponse;
      if (!res.ok || !json.success) throw new Error('overview/summary GET failed');
      // 내용이 동일하면 이전 참조를 그대로 반환해 불필요한 리렌더를 막는다.
      setSummary((prev) => (prev && JSON.stringify(prev) === JSON.stringify(json.summary) ? prev : json.summary));
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // AGT 가스 측정치(permit_gas_tests) 실시간성 확보 — 10초 간격 폴링.
  useEffect(() => {
    const intervalId = setInterval(() => refresh(true), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  return { summary, loading, error, refresh };
}
