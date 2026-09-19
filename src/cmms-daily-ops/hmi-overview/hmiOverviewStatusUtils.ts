// src/cmms-daily-ops/hmi-overview/hmiOverviewStatusUtils.ts
//
// PURPOSE
//   Pure NORMAL/WARNING/ALARM/OFFLINE banding logic for HMI Overview tiles —
//   extracted out of useOverviewHmiData.ts (AGENTS.md §3 Logic/Data Layer:
//   pure functions, no React bindings) to keep that hook file under the
//   250-line hard cap after the 2026-09-17 AAV D/S fallback addition. Pure
//   in-place move, no behavior change — same DOMAIN_BANDS/deriveStatus/
//   toNumber bodies useOverviewHmiData.ts had before.
//
//   isThresholdValidated: true only for ng_buffer_tank (HJ-confirmed band).
//   Every other entry here is a Stage 1 PLACEHOLDER — see
//   hmiOverviewConstants.ts header.

import type { HmiOverviewUnitStatus } from './hmiOverviewTypes';
import {
  AAV_NORMAL_MAX_BAR,
  AAV_NORMAL_MIN_BAR,
  AAV_TYPICAL_MAX_BAR,
  AAV_TYPICAL_MIN_BAR,
  GC_METHANE_NORMAL_MAX_PCT,
  GC_METHANE_NORMAL_MIN_PCT,
  GC_METHANE_TYPICAL_MAX_PCT,
  GC_METHANE_TYPICAL_MIN_PCT,
  ISO_TANK_UNLOADING_SKID_NORMAL_MAX_PCT,
  ISO_TANK_UNLOADING_SKID_NORMAL_MIN_PCT,
  ISO_TANK_UNLOADING_SKID_TYPICAL_MAX_PCT,
  ISO_TANK_UNLOADING_SKID_TYPICAL_MIN_PCT,
  METERING_TRAIN_NORMAL_MAX_BARG,
  METERING_TRAIN_NORMAL_MIN_BARG,
  METERING_TRAIN_TYPICAL_MAX_BARG,
  METERING_TRAIN_TYPICAL_MIN_BARG,
  N2_SKID_NORMAL_MAX_BAR,
  N2_SKID_NORMAL_MIN_BAR,
  N2_SKID_TYPICAL_MAX_BAR,
  N2_SKID_TYPICAL_MIN_BAR,
  NG_BUFFER_TANK_NORMAL_MAX_BARG,
  NG_BUFFER_TANK_NORMAL_MIN_BARG,
  NG_BUFFER_TANK_TYPICAL_MAX_BARG,
  NG_BUFFER_TANK_TYPICAL_MIN_BARG,
} from './hmiOverviewConstants';

interface DomainBand {
  normalMin: number;
  normalMax: number;
  typicalMin: number;
  typicalMax: number;
}

export const DOMAIN_BANDS: Partial<Record<string, DomainBand>> = {
  ng_buffer_tank: {
    normalMin: NG_BUFFER_TANK_NORMAL_MIN_BARG,
    normalMax: NG_BUFFER_TANK_NORMAL_MAX_BARG,
    typicalMin: NG_BUFFER_TANK_TYPICAL_MIN_BARG,
    typicalMax: NG_BUFFER_TANK_TYPICAL_MAX_BARG,
  },
  aav: {
    normalMin: AAV_NORMAL_MIN_BAR,
    normalMax: AAV_NORMAL_MAX_BAR,
    typicalMin: AAV_TYPICAL_MIN_BAR,
    typicalMax: AAV_TYPICAL_MAX_BAR,
  },
  metering_train_a: {
    normalMin: METERING_TRAIN_NORMAL_MIN_BARG,
    normalMax: METERING_TRAIN_NORMAL_MAX_BARG,
    typicalMin: METERING_TRAIN_TYPICAL_MIN_BARG,
    typicalMax: METERING_TRAIN_TYPICAL_MAX_BARG,
  },
  metering_train_b: {
    normalMin: METERING_TRAIN_NORMAL_MIN_BARG,
    normalMax: METERING_TRAIN_NORMAL_MAX_BARG,
    typicalMin: METERING_TRAIN_TYPICAL_MIN_BARG,
    typicalMax: METERING_TRAIN_TYPICAL_MAX_BARG,
  },
  n2_skid: {
    normalMin: N2_SKID_NORMAL_MIN_BAR,
    normalMax: N2_SKID_NORMAL_MAX_BAR,
    typicalMin: N2_SKID_TYPICAL_MIN_BAR,
    typicalMax: N2_SKID_TYPICAL_MAX_BAR,
  },
  gc: {
    normalMin: GC_METHANE_NORMAL_MIN_PCT,
    normalMax: GC_METHANE_NORMAL_MAX_PCT,
    typicalMin: GC_METHANE_TYPICAL_MIN_PCT,
    typicalMax: GC_METHANE_TYPICAL_MAX_PCT,
  },
  iso_tank_unloading_skid: {
    normalMin: ISO_TANK_UNLOADING_SKID_NORMAL_MIN_PCT,
    normalMax: ISO_TANK_UNLOADING_SKID_NORMAL_MAX_PCT,
    typicalMin: ISO_TANK_UNLOADING_SKID_TYPICAL_MIN_PCT,
    typicalMax: ISO_TANK_UNLOADING_SKID_TYPICAL_MAX_PCT,
  },
};

export const THRESHOLD_VALIDATED_DOMAINS = new Set<string>(['ng_buffer_tank']);

export function deriveStatus(domain: string, primaryValue: number | null): HmiOverviewUnitStatus {
  if (primaryValue === null) return 'OFFLINE';
  const band = DOMAIN_BANDS[domain];
  if (!band) return 'NORMAL';
  if (primaryValue < band.normalMin || primaryValue > band.normalMax) return 'ALARM';
  if (primaryValue < band.typicalMin || primaryValue > band.typicalMax) return 'WARNING';
  return 'NORMAL';
}

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}
