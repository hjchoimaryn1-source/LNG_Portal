// src/gas-metering/hooks/useGasMeteringLedger.ts
//
// PURPOSE
//   Client fetch wrapper for GET /api/v1/cmms/gas-metering-ledger. Used by
//   GasMeteringDailyTab (recent rows) and useGasMeteringSnapshot below
//   (SettlementAuditView's latest-composition/meter-stream lookup).

'use client';

import { useEffect, useState } from 'react';
import type { GasMeteringLedgerDailyRow, GasMeteringSnapshot } from '../dao/gasMeteringLedgerDao';
import type { GcReportEntryRow, GcCompositionEntryRow } from '../dao/gasMeteringLedgerEntryDao';

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

/** Live daily-entry fetch/save for FlobossDailyEntryForm (P12 Stage 2 reversal — see gasMeteringLedgerEntryDao.ts). */
export function useGasMeteringDailyEntry(reportDate: string) {
  const [gcReport, setGcReport] = useState<GcReportEntryRow | null>(null);
  const [gcComposition, setGcComposition] = useState<GcCompositionEntryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`${GAS_METERING_LEDGER_API}?entryDate=${reportDate}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; gcReport?: GcReportEntryRow | null; gcComposition?: GcCompositionEntryRow | null; error?: string }) => {
        if (cancelled) return;
        if (json.success) {
          setGcReport(json.gcReport ?? null);
          setGcComposition(json.gcComposition ?? null);
        } else {
          setError(json.error ?? 'Failed to load daily entry.');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load daily entry.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportDate]);

  async function saveGcReport(row: GcReportEntryRow): Promise<boolean> {
    const res = await fetch(GAS_METERING_LEDGER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'gc_report', row }),
    });
    const json = await res.json();
    return Boolean(json.success);
  }

  async function saveGcComposition(row: GcCompositionEntryRow): Promise<boolean> {
    const res = await fetch(GAS_METERING_LEDGER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'gc_composition', row }),
    });
    const json = await res.json();
    return Boolean(json.success);
  }

  return { gcReport, gcComposition, isLoading, error, saveGcReport, saveGcComposition };
}
