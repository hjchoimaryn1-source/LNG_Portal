// src/cmms-daily-ops/hmi-overview/HmiOverviewContainer.tsx
//
// PURPOSE
//   Sub-stage B data wiring. Feeds HmiOverviewView.tsx (Sub-stage A, pure
//   presentation, untouched internals) with real data instead of the mock
//   fixture: unit tiles from useOverviewHmiData() (live B2 store
//   subscription), shift-strip status from getShiftInputStatus() via the
//   new daily-ops-shift-input-status API route (client/server boundary —
//   see that route's header comment).
//
//   NOT mounted to any nav/route/sidebar in this sub-stage — standalone,
//   unwired tree (Sub-stage C wires nav/routes).

'use client';

import { useEffect, useState } from 'react';
import { HmiOverviewView } from './HmiOverviewView';
import { useOverviewHmiData } from './useOverviewHmiData';
import type { ShiftTimeSlot } from '../types/patrolLog';

const SHIFT_INPUT_STATUS_API = '/api/v1/cmms/daily-ops-shift-input-status';

interface HmiOverviewContainerProps {
  reportDate: string;
}

export function HmiOverviewContainer({ reportDate }: HmiOverviewContainerProps) {
  const data = useOverviewHmiData(reportDate);
  const [shiftInputStatus, setShiftInputStatus] = useState<Record<ShiftTimeSlot, boolean> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`${SHIFT_INPUT_STATUS_API}?reportDate=${encodeURIComponent(reportDate)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; status: Record<ShiftTimeSlot, boolean> }) => {
        if (!cancelled && json.success) setShiftInputStatus(json.status);
      })
      .catch(() => {
        // Shift-strip degrades to ShiftInputStatusStrip's own placeholder — display-layer only.
      });
    return () => {
      cancelled = true;
    };
  }, [reportDate]);

  return <HmiOverviewView data={data} shiftInputStatus={shiftInputStatus} />;
}
