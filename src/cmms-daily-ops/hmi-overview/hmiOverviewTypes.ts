// src/cmms-daily-ops/hmi-overview/hmiOverviewTypes.ts
//
// PURPOSE
//   Phase 12 Daily Ops HMI Overview — Sub-stage A. This is the CONTRACT the
//   future `useOverviewHmiData()` hook (later sub-stage) will produce; this
//   sub-stage only consumes it via props (HmiOverviewView.tsx), never builds
//   the hook. `domain` reuses PatrolDomain (patrolLog.ts) rather than
//   redefining it — single source of truth per existing convention
//   (see hmiCore.ts's own re-export of PatrolDomain for the same reason).

import type { PatrolDomain } from '../types/patrolLog';

export type HmiOverviewUnitStatus = 'NORMAL' | 'WARNING' | 'ALARM' | 'OFFLINE';

export interface OverviewHmiUnit {
  equipmentTag: string;
  label: string;
  domain: PatrolDomain;
  status: HmiOverviewUnitStatus;
  primaryValue: number | null;
  primaryUnit: string;
  secondaryValue?: number | null;
  secondaryUnit?: string;
}

export interface OverviewHmiData {
  generatedAt: string;
  units: OverviewHmiUnit[];
}
