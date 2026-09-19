// src/hmi/hooks/useFaceplateTrend.ts
//
// PURPOSE
//   HMI-2d-3b — FaceplateSparkline.tsx가 쓰는 (domain, equipmentTag, columnName)
//   24시간 트렌드 fetch 훅. daily-ops-patrol-entries GET ?trend=1(신규 분기,
//   HMI-2d-3b)을 얇게 감싸며, DailyOpsDataContext.tsx의
//   fetch(url, { cache: 'no-store' }) 컨벤션을 따른다.

'use client';

import { useEffect, useState } from 'react';
import type { PatrolDomain } from '../types/hmiCore';

export interface FaceplateTrendPoint {
  timestamp: string;
  value: number | null;
}

const TREND_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_OPS_PATROL_ENTRIES_API = '/api/v1/cmms/daily-ops-patrol-entries';

export function useFaceplateTrend(domain: PatrolDomain, equipmentTag: string, columnName: string): FaceplateTrendPoint[] {
  const [points, setPoints] = useState<FaceplateTrendPoint[]>([]);

  useEffect(() => {
    if (!equipmentTag || !columnName) return;
    let cancelled = false;
    const sinceTimestamp = new Date(Date.now() - TREND_WINDOW_MS).toISOString();
    const url = `${DAILY_OPS_PATROL_ENTRIES_API}?trend=1&domain=${domain}&equipmentTag=${encodeURIComponent(equipmentTag)}&columnName=${encodeURIComponent(columnName)}&sinceTimestamp=${encodeURIComponent(sinceTimestamp)}`;

    (async () => {
      const res = await fetch(url, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; points?: FaceplateTrendPoint[] };
      if (!cancelled && json.success && json.points) setPoints(json.points);
    })();

    return () => {
      cancelled = true;
    };
  }, [domain, equipmentTag, columnName]);

  return points;
}
