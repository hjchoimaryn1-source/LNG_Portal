// src/context/EnvironmentDataContext.tsx
//
// Phase 11b Stage 2-E — parallel, isolated context for the NP-10
// Environmental & Waste Management module. Does NOT touch
// PortalDataContext.tsx or TruckingDataContext.tsx or their provider trees.
//
// Client/server boundary note: environmentDbSingleton.ts / *Dao.ts
// transitively import node:sqlite (via cmmsDbSingleton.ts) and cannot be
// imported into a "use client" component. This provider instead calls the
// new Stage 2 API route (src/app/api/v1/cmms/environment/route.ts), which
// itself calls getEnvironmentDb()/selectAll*() — the same reuse-don't-invent
// DAO path used by TruckingDataContext.tsx / useWorkOrders.ts.
//
// Read-only for now (Stage 1 DAOs expose insert/update functions, but no
// write action is wired here — mirrors TruckingDataContext.tsx scope).

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AirQualityLog,
  WastewaterLog,
  NoiseLog,
  SeawaterLog,
  WasteTransferLog,
  ThwsInventoryItem,
} from '../cmms-environment/types/environment';

const ENVIRONMENT_API = '/api/v1/cmms/environment';

interface EnvironmentApiResponse {
  success: boolean;
  airQuality: AirQualityLog[];
  wastewater: WastewaterLog[];
  noise: NoiseLog[];
  seawater: SeawaterLog[];
  wasteTransfers: WasteTransferLog[];
  thwsInventory: ThwsInventoryItem[];
}

export interface EnvironmentDataContextType {
  airQuality: AirQualityLog[];
  wastewater: WastewaterLog[];
  noise: NoiseLog[];
  seawater: SeawaterLog[];
  wasteTransfers: WasteTransferLog[];
  thwsInventory: ThwsInventoryItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const EnvironmentDataContext = createContext<EnvironmentDataContextType | undefined>(undefined);

export function EnvironmentDataProvider({ children }: { children: React.ReactNode }) {
  const [airQuality, setAirQuality] = useState<AirQualityLog[]>([]);
  const [wastewater, setWastewater] = useState<WastewaterLog[]>([]);
  const [noise, setNoise] = useState<NoiseLog[]>([]);
  const [seawater, setSeawater] = useState<SeawaterLog[]>([]);
  const [wasteTransfers, setWasteTransfers] = useState<WasteTransferLog[]>([]);
  const [thwsInventory, setThwsInventory] = useState<ThwsInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(ENVIRONMENT_API, { cache: 'no-store' });
      const json = (await res.json()) as EnvironmentApiResponse;
      if (!res.ok || !json.success) throw new Error('environment GET failed');
      setAirQuality(json.airQuality);
      setWastewater(json.wastewater);
      setNoise(json.noise);
      setSeawater(json.seawater);
      setWasteTransfers(json.wasteTransfers);
      setThwsInventory(json.thwsInventory);
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
    <EnvironmentDataContext.Provider
      value={{ airQuality, wastewater, noise, seawater, wasteTransfers, thwsInventory, isLoading, error, refresh }}
    >
      {children}
    </EnvironmentDataContext.Provider>
  );
}

export function useEnvironmentData(): EnvironmentDataContextType {
  const ctx = useContext(EnvironmentDataContext);
  if (!ctx) throw new Error('useEnvironmentData must be used within EnvironmentDataProvider');
  return ctx;
}
