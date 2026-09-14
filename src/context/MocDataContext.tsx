// src/context/MocDataContext.tsx
//
// Phase 11c Stage 2-E — parallel, isolated context for the NP-12 Management
// of Change module. Does NOT touch PortalDataContext.tsx or its provider tree.
//
// Client/server boundary note: mocDbSingleton.ts / *Dao.ts transitively import
// node:sqlite (via cmmsDbSingleton.ts) and cannot be imported into a
// "use client" component. This provider instead calls the Stage 2-D API
// route (src/app/api/v1/cmms/moc/route.ts), which itself calls
// getMocDb()/selectAll*() — the same reuse-don't-invent DAO path used by
// EnvironmentDataContext.tsx / TruckingDataContext.tsx.
//
// Read-only for now (Stage 1 DAOs expose insert/update functions, but no
// write action is wired here — Plan of Change authoring / Completion Report
// submission is a Site-Manager-approval workflow deferred to its own stage).

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PlanOfChange, CompletionReport } from '../cmms-moc/types/moc';

const MOC_API = '/api/v1/cmms/moc';

interface MocApiResponse {
  success: boolean;
  plansOfChange: PlanOfChange[];
  completionReports: CompletionReport[];
}

export interface MocDataContextType {
  plansOfChange: PlanOfChange[];
  completionReports: CompletionReport[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MocDataContext = createContext<MocDataContextType | undefined>(undefined);

export function MocDataProvider({ children }: { children: React.ReactNode }) {
  const [plansOfChange, setPlansOfChange] = useState<PlanOfChange[]>([]);
  const [completionReports, setCompletionReports] = useState<CompletionReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(MOC_API, { cache: 'no-store' });
      const json = (await res.json()) as MocApiResponse;
      if (!res.ok || !json.success) throw new Error('moc GET failed');
      setPlansOfChange(json.plansOfChange);
      setCompletionReports(json.completionReports);
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
    <MocDataContext.Provider value={{ plansOfChange, completionReports, isLoading, error, refresh }}>
      {children}
    </MocDataContext.Provider>
  );
}

export function useMocData(): MocDataContextType {
  const ctx = useContext(MocDataContext);
  if (!ctx) throw new Error('useMocData must be used within MocDataProvider');
  return ctx;
}
