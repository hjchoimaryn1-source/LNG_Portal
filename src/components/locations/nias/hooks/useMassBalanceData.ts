// src/components/locations/nias/hooks/useMassBalanceData.ts
//
// PURPOSE
//   Live data fetch for the rebuilt Mass Balance tab — reads
//   iso_tank_daily_readings (same table NiasLaydownLogTab now writes to,
//   ISO Tank & Mass Balance relocation stage) for the given report month,
//   replacing the old DEFAULT_MASS_BALANCE_DATA mock + settlementRecords
//   overlay. State/fetch layer only — aggregation logic lives in
//   massBalanceCalculations.ts (AGENTS.md §3 separation).

'use client';

import { useEffect, useState } from 'react';
import type { IsoTankDailyReadingRow } from '../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';

export function useMassBalanceData(reportMonth: string) {
  const [readings, setReadings] = useState<IsoTankDailyReadingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/v1/cmms/monthly-report/iso-tank?month=${reportMonth}&kind=daily`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records?: IsoTankDailyReadingRow[]; error?: string }) => {
        if (cancelled) return;
        if (json.success) {
          setReadings(json.records ?? []);
        } else {
          setError(json.error ?? 'Failed to load ISO tank daily readings.');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load ISO tank daily readings.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportMonth]);

  return { readings, isLoading, error };
}
