// src/components/locations/nias/hooks/useMassBalanceData.ts
//
// PURPOSE
//   Live data fetch for the rebuilt Mass Balance tab — reads
//   iso_tank_daily_readings (Total Yard BOG Loss source),
//   iso_tank_consumption_monthly (Total Gas Consumed source) for the given
//   report month, and arun_lng_delivery_certificate (Arun Inbound Stock
//   source, batch-based not month-scoped, so fetched independent of
//   reportMonth) — the three inputs to Net Usable Stock. State/fetch layer
//   only — aggregation logic lives in massBalanceCalculations.ts
//   (AGENTS.md §3 separation).

'use client';

import { useEffect, useState } from 'react';
import type { IsoTankDailyReadingRow } from '../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import type { IsoTankConsumptionRow } from '../../../../cmms-monthly-report/dao/isoTankConsumptionDao';
import type { ArunLngDeliveryCertificateRow } from '../../../../cmms-monthly-report/dao/arunLngDeliveryCertificateDao';

export function useMassBalanceData(reportMonth: string) {
  const [readings, setReadings] = useState<IsoTankDailyReadingRow[]>([]);
  const [consumption, setConsumption] = useState<IsoTankConsumptionRow[]>([]);
  const [certificates, setCertificates] = useState<ArunLngDeliveryCertificateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      fetch(`/api/v1/cmms/monthly-report/iso-tank?month=${reportMonth}&kind=daily`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/v1/cmms/monthly-report/iso-tank?month=${reportMonth}&kind=consumption`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/v1/cmms/monthly-report/arun-delivery-certificate`, { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([readingsJson, consumptionJson, certJson]) => {
        if (cancelled) return;
        if (readingsJson.success && consumptionJson.success && certJson.success) {
          setReadings(readingsJson.records ?? []);
          setConsumption(consumptionJson.records ?? []);
          setCertificates(certJson.records ?? []);
        } else {
          setError(readingsJson.error || consumptionJson.error || certJson.error || 'Failed to load Mass Balance data.');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load Mass Balance data.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reportMonth]);

  return { readings, consumption, certificates, isLoading, error };
}
