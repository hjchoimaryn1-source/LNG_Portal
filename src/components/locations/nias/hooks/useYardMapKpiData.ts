// src/components/locations/nias/hooks/useYardMapKpiData.ts
//
// PURPOSE
//   Live data fetch for the Yard Map KPI strip (NiasTankOverviewKpiStrip) —
//   reads iso_tank_daily_readings latest-per-tank (ORU LD-1/LD-2 source) and
//   daily_ops_patrol_entries latest-per-tag (ORU ISO TK-Skid source, domain
//   iso_tank_unloading_skid). State/fetch layer only — aggregation logic
//   lives in yardMapKpiCalculations.ts (AGENTS.md §3 separation).

'use client';

import { useEffect, useState } from 'react';
import type { IsoTankDailyReadingRow } from '../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import type { PatrolEntry } from '../../../../cmms-daily-ops/dao/dailyOpsPatrolDao';

export function useYardMapKpiData() {
  const [latestReadings, setLatestReadings] = useState<IsoTankDailyReadingRow[]>([]);
  const [latestPatrolEntries, setLatestPatrolEntries] = useState<PatrolEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      fetch(`/api/v1/cmms/monthly-report/iso-tank?kind=latest`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/v1/cmms/daily-ops-patrol-entries`, { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([readingsJson, patrolJson]) => {
        if (cancelled) return;
        if (readingsJson.success && patrolJson.success) {
          setLatestReadings(readingsJson.records ?? []);
          setLatestPatrolEntries(patrolJson.records ?? []);
        } else {
          setError(readingsJson.error || patrolJson.error || 'Failed to load Yard Map KPI data.');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load Yard Map KPI data.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { latestReadings, latestPatrolEntries, isLoading, error };
}
