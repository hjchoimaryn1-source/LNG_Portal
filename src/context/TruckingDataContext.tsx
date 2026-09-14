// src/context/TruckingDataContext.tsx
//
// Phase 11a Stage 2-D — parallel, isolated context for the NP-03 Trucking
// module. Does NOT touch PortalDataContext.tsx or its provider tree.
//
// Client/server boundary note: truckingDbSingleton.ts / truckInspectionDao.ts
// transitively import node:sqlite (via cmmsDbSingleton.ts) and cannot be
// imported into a "use client" component. This provider instead calls the
// existing Stage 1 API route (src/app/api/v1/cmms/trucking-inspections/route.ts),
// which itself calls getTruckingDb()/selectAllTruckInspections() — the same
// reuse-don't-invent DAO path, just through the client/server boundary that
// every other CMMS data hook in this codebase already uses (see useWorkOrders.ts).

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TruckInspectionHeader } from '../cmms-trucking/types';

const TRUCKING_INSPECTIONS_API = '/api/v1/cmms/trucking-inspections';

export interface TruckingDataContextType {
  inspections: TruckInspectionHeader[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const TruckingDataContext = createContext<TruckingDataContextType | undefined>(undefined);

export function TruckingDataProvider({ children }: { children: React.ReactNode }) {
  const [inspections, setInspections] = useState<TruckInspectionHeader[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(TRUCKING_INSPECTIONS_API, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; records: TruckInspectionHeader[] };
      if (!res.ok || !json.success) throw new Error('trucking-inspections GET failed');
      setInspections(json.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <TruckingDataContext.Provider value={{ inspections, isLoading, error, refresh }}>
      {children}
    </TruckingDataContext.Provider>
  );
}

export function useTruckingData(): TruckingDataContextType {
  const ctx = useContext(TruckingDataContext);
  if (!ctx) throw new Error('useTruckingData must be used within TruckingDataProvider');
  return ctx;
}
