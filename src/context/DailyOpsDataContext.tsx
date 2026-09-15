// src/context/DailyOpsDataContext.tsx
//
// Phase 12 Stage B3 — parallel, isolated context for the Daily Ops patrol
// module, sibling pattern to TruckingDataContext.tsx. Does NOT touch
// PortalDataContext.tsx or its provider tree.
//
// Client/server boundary note: dailyOpsDbSingleton.ts / dailyOpsPatrolDao.ts
// transitively import node:sqlite (via cmmsDbSingleton.ts) and cannot be
// imported into a "use client" component. This provider instead calls the
// Stage B3 API route (src/app/api/v1/cmms/daily-ops-patrol-entries/route.ts).
//
// Unlike TruckingDataProvider, this context does not expose a records array —
// its only job is the *initial load*: on mount, fetch the DB's last-known
// value per (domain, equipmentTag) and seed useDailyOpsPatrolStore (B2) with
// it, so PIDOverlayView (B4) badges aren't blank before anyone saves a new
// patrol entry in the current session. Live updates after that flow through
// the B2 store directly, not through this context.

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setLatestPatrolEntry } from '../cmms-daily-ops/state/useDailyOpsPatrolStore';
import { setHmiTagAliases } from '../hmi/state/hmiTagAliasCache';
import type { PatrolDomain } from '../cmms-daily-ops/types/patrolLog';

const DAILY_OPS_PATROL_ENTRIES_API = '/api/v1/cmms/daily-ops-patrol-entries';
// HMI-2-alias: 기존 refresh() 로직과 별개의 하이드레이션 경로 — pure addition, 아래 기존
// fetch/상태 로직은 한 줄도 변경하지 않는다.
const PID_TAG_ALIASES_API = '/api/v1/cmms/pid-tag-aliases';

interface LatestPatrolEntryDto {
  domain: PatrolDomain;
  equipmentTag: string;
  values: Record<string, number | string | null>;
}

export interface DailyOpsDataContextType {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DailyOpsDataContext = createContext<DailyOpsDataContextType | undefined>(undefined);

export function DailyOpsDataProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(DAILY_OPS_PATROL_ENTRIES_API, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; records: LatestPatrolEntryDto[] };
      if (!res.ok || !json.success) throw new Error('daily-ops-patrol-entries GET failed');
      for (const record of json.records) {
        setLatestPatrolEntry(record.domain, record.equipmentTag, record.values);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // HMI-2-alias: 별도 하이드레이션 — 실패해도 위 refresh()의 isLoading/error 상태는 건드리지 않는다.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(PID_TAG_ALIASES_API, { cache: 'no-store' });
        const json = (await res.json()) as {
          success: boolean;
          records: { canonicalTagId: string; aliasTagId: string; sourceDocument: string }[];
        };
        if (res.ok && json.success) setHmiTagAliases(json.records);
      } catch {
        // 표시 레이어 저하(별칭 미해결)일 뿐 — 조용히 무시.
      }
    })();
  }, []);

  return <DailyOpsDataContext.Provider value={{ isLoading, error, refresh }}>{children}</DailyOpsDataContext.Provider>;
}

export function useDailyOpsData(): DailyOpsDataContextType {
  const ctx = useContext(DailyOpsDataContext);
  if (!ctx) throw new Error('useDailyOpsData must be used within DailyOpsDataProvider');
  return ctx;
}
