// src/gas-metering/hooks/useGasMeteringLedger.ts
//
// PURPOSE
//   Client fetch wrapper for GET /api/v1/cmms/gas-metering-ledger. Used by
//   GasMeteringDailyTab (recent rows) and useGasMeteringSnapshot below
//   (SettlementAuditView's latest-composition/meter-stream lookup).

'use client';

import { useEffect, useState } from 'react';
import type { GasMeteringLedgerDailyRow, GasMeteringSnapshot } from '../dao/gasMeteringLedgerDao';

const GAS_METERING_LEDGER_API = '/api/v1/cmms/gas-metering-ledger';

export function useGasMeteringLedger(limit = 60) {
  const [records, setRecords] = useState<GasMeteringLedgerDailyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`${GAS_METERING_LEDGER_API}?limit=${limit}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records?: GasMeteringLedgerDailyRow[]; error?: string }) => {
        if (cancelled) return;
        if (json.success && json.records) {
          setRecords(json.records);
        } else {
          setError(json.error ?? 'Failed to load gas metering ledger.');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load gas metering ledger.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { records, isLoading, error };
}

export function useGasMeteringSnapshot() {
  const [snapshot, setSnapshot] = useState<GasMeteringSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${GAS_METERING_LEDGER_API}?snapshot=1`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; snapshot?: GasMeteringSnapshot }) => {
        if (!cancelled && json.success && json.snapshot) setSnapshot(json.snapshot);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}
