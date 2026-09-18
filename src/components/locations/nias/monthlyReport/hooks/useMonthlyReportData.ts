// src/components/locations/nias/monthlyReport/hooks/useMonthlyReportData.ts
//
// PURPOSE
//   Client fetch wrappers for the Monthly Report (PLN EPI) Stage 3 API
//   routes. Same cancelled-on-unmount fetch pattern as useGasMeteringLedger.ts.

'use client';

import { useEffect, useState } from 'react';
import type { FlobossDailyRow } from '../../../../../gas-metering/dao/gasMeteringLedgerDao';
import type { GasCompositionSnapshotRow } from '../../../../../cmms-monthly-report/dao/gasCompositionSnapshotDao';
import type { IsoTankDailyReadingRow } from '../../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import type { IsoTankConsumptionRow } from '../../../../../cmms-monthly-report/dao/isoTankConsumptionDao';
import type {
  GasDeliveryDailyManualRow,
  GasDeliveryMonthlyManualRow,
} from '../../../../../cmms-monthly-report/dao/gasDeliveryManualDao';

function useMonthlyFetch<T>(url: string, extractRecords: (json: Record<string, unknown>) => T, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(url, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: Record<string, unknown>) => {
        if (cancelled) return;
        if (json.success) {
          setData(extractRecords(json));
        } else {
          setError((json.error as string) ?? 'Failed to load monthly report data.');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load monthly report data.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { data, isLoading, error };
}

export function useFlobossLedger(reportMonth: string) {
  const { data, isLoading, error } = useMonthlyFetch<FlobossDailyRow[]>(
    `/api/v1/cmms/monthly-report/floboss?month=${reportMonth}`,
    (json) => (json.records as FlobossDailyRow[]) ?? [],
    []
  );
  return { records: data, isLoading, error };
}

export function useGasCompositionSnapshot(reportMonth: string) {
  const { data, isLoading, error } = useMonthlyFetch<GasCompositionSnapshotRow | null>(
    `/api/v1/cmms/monthly-report/gas-composition?month=${reportMonth}`,
    (json) => (json.snapshot as GasCompositionSnapshotRow | null) ?? null,
    null
  );
  return { snapshot: data, isLoading, error };
}

export function useIsoTankDailyReadings(reportMonth: string) {
  const { data, isLoading, error } = useMonthlyFetch<IsoTankDailyReadingRow[]>(
    `/api/v1/cmms/monthly-report/iso-tank?month=${reportMonth}&kind=daily`,
    (json) => (json.records as IsoTankDailyReadingRow[]) ?? [],
    []
  );
  return { records: data, isLoading, error };
}

export function useIsoTankConsumption(reportMonth: string) {
  const { data, isLoading, error } = useMonthlyFetch<IsoTankConsumptionRow[]>(
    `/api/v1/cmms/monthly-report/iso-tank?month=${reportMonth}&kind=consumption`,
    (json) => (json.records as IsoTankConsumptionRow[]) ?? [],
    []
  );
  return { records: data, isLoading, error };
}

interface GasDeliveryManualData {
  daily: GasDeliveryDailyManualRow[];
  monthly: GasDeliveryMonthlyManualRow | null;
}

export function useGasDeliveryManual(reportMonth: string) {
  const url = `/api/v1/cmms/monthly-report/gas-delivery-manual?month=${reportMonth}`;
  const { data, isLoading, error } = useMonthlyFetch<GasDeliveryManualData>(
    url,
    (json) => ({
      daily: (json.daily as GasDeliveryDailyManualRow[]) ?? [],
      monthly: (json.monthly as GasDeliveryMonthlyManualRow | null) ?? null,
    }),
    { daily: [], monthly: null }
  );

  async function saveDaily(row: GasDeliveryDailyManualRow): Promise<boolean> {
    const res = await fetch('/api/v1/cmms/monthly-report/gas-delivery-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'daily', row }),
    });
    const json = await res.json();
    return Boolean(json.success);
  }

  async function saveMonthly(row: GasDeliveryMonthlyManualRow): Promise<boolean> {
    const res = await fetch('/api/v1/cmms/monthly-report/gas-delivery-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'monthly', row }),
    });
    const json = await res.json();
    return Boolean(json.success);
  }

  return { daily: data.daily, monthly: data.monthly, isLoading, error, saveDaily, saveMonthly };
}
