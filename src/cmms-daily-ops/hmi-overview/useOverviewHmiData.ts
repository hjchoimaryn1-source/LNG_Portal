// src/cmms-daily-ops/hmi-overview/useOverviewHmiData.ts
//
// PURPOSE
//   Client-side hook composing existing useDailyOpsPatrolValue(domain,
//   equipmentTag, columnName) subscriptions (useDailyOpsPatrolStore.ts,
//   unmodified) into the Sub-stage A OverviewHmiData contract
//   (hmiOverviewTypes.ts). No new store, no direct writes — pure composition
//   over the same B2 store PIDOverlayView/PidTagBadge already read.
//
//   Stage 3 Step 2 (HJ decision 2026-09-15) — cross-device polling: the B2
//   store is in-memory per browser tab, so a tablet's patrol POST never
//   reaches a control-room PC's tab on its own; the tab-local B2 subscription
//   above is a fast path only. DailyOpsDataContext.tsx's refresh() is the
//   actual server round-trip (GET daily-ops-patrol-entries -> B2 upsert),
//   today only called once on mount. Re-invoking that same refresh() on a
//   20s interval closes the cross-device gap without duplicating its
//   fetch/parse logic here.
//
//   Rules-of-Hooks: OVERVIEW_UNIT_SLOTS (overviewUnitSlots.ts) has a fixed
//   length (25 today, derived from static imports only) — hand-unrolled
//   below instead of a .map()/for loop, same discipline as
//   useHmiLiveStore.ts's MAX_FIELD_SLOTS. If patrolEquipmentTags.ts grows
//   past 25 units, add slot calls here (and in overviewUnitSlots.ts)
//   together.
//
//   `reportDate` param: the B2 store only ever holds each (domain,
//   equipmentTag, columnName)'s single latest value across ALL dates
//   (dailyOpsPatrolDao.ts's getAllLatestPatrolValues — same limitation
//   PidTagBadge/PIDOverlayView already live with), not a per-date value —
//   there is no date-scoped query this store can answer. The parameter is
//   kept for contract stability (and to line up with getShiftInputStatus's
//   real date-scoping) but does not currently filter the returned units.
//
//   Status derivation (deliberately conservative — no useHmiEquipment/alarm
//   store coupling in this sub-stage, per hmi-overview module scope):
//   OFFLINE when the primary value is null/undefined; otherwise every
//   in-scope domain (DOMAIN_BANDS below, hmiOverviewConstants.ts) bands its
//   primary value into NORMAL/WARNING/ALARM. ng_buffer_tank's band is
//   HJ-confirmed; every other domain's band is a Stage 1 PLACEHOLDER (see
//   hmiOverviewConstants.ts header) — isThresholdValidated on each unit
//   tells the UI which is which. Only the primary value is banded (matches
//   the pre-Stage-1 ng_buffer_tank pattern); secondary values stay
//   informational/un-banded.
//   TODO(hmi-overview-C-or-later): replace with full alarm-priority
//   thresholds via useHmiEquipment once that scope is separately approved.

'use client';

import { useEffect } from 'react';
import { useDailyOpsPatrolValue } from '../state/useDailyOpsPatrolStore';
import { useDailyOpsData } from '../../context/DailyOpsDataContext';
import type { HmiOverviewUnitStatus, OverviewHmiData, OverviewHmiUnit } from './hmiOverviewTypes';
import { OVERVIEW_UNIT_SLOTS } from './overviewUnitSlots';
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

// isThresholdValidated: true only for ng_buffer_tank (HJ-confirmed band). Every other
// entry here is a Stage 1 PLACEHOLDER — see hmiOverviewConstants.ts header.
const DOMAIN_BANDS: Partial<Record<string, DomainBand>> = {
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

const THRESHOLD_VALIDATED_DOMAINS = new Set<string>(['ng_buffer_tank']);

const CROSS_DEVICE_POLL_INTERVAL_MS = 20_000;

function deriveStatus(domain: string, primaryValue: number | null): HmiOverviewUnitStatus {
  if (primaryValue === null) return 'OFFLINE';
  const band = DOMAIN_BANDS[domain];
  if (!band) return 'NORMAL';
  if (primaryValue < band.normalMin || primaryValue > band.normalMax) return 'ALARM';
  if (primaryValue < band.typicalMin || primaryValue > band.typicalMax) return 'WARNING';
  return 'NORMAL';
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

export function useOverviewHmiData(reportDate: string): OverviewHmiData {
  void reportDate; // see header note — the B2 store has no date-scoped query.

  const { refresh } = useDailyOpsData();
  useEffect(() => {
    const intervalId = setInterval(refresh, CROSS_DEVICE_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  const s = OVERVIEW_UNIT_SLOTS;
  const p0 = useDailyOpsPatrolValue(s[0].domain, s[0].equipmentTag, s[0].primaryColumn);
  const p1 = useDailyOpsPatrolValue(s[1].domain, s[1].equipmentTag, s[1].primaryColumn);
  const p2 = useDailyOpsPatrolValue(s[2].domain, s[2].equipmentTag, s[2].primaryColumn);
  const p3 = useDailyOpsPatrolValue(s[3].domain, s[3].equipmentTag, s[3].primaryColumn);
  const p4 = useDailyOpsPatrolValue(s[4].domain, s[4].equipmentTag, s[4].primaryColumn);
  const p5 = useDailyOpsPatrolValue(s[5].domain, s[5].equipmentTag, s[5].primaryColumn);
  const p6 = useDailyOpsPatrolValue(s[6].domain, s[6].equipmentTag, s[6].primaryColumn);
  const p7 = useDailyOpsPatrolValue(s[7].domain, s[7].equipmentTag, s[7].primaryColumn);
  const p8 = useDailyOpsPatrolValue(s[8].domain, s[8].equipmentTag, s[8].primaryColumn);
  const p9 = useDailyOpsPatrolValue(s[9].domain, s[9].equipmentTag, s[9].primaryColumn);
  const p10 = useDailyOpsPatrolValue(s[10].domain, s[10].equipmentTag, s[10].primaryColumn);
  const p11 = useDailyOpsPatrolValue(s[11].domain, s[11].equipmentTag, s[11].primaryColumn);
  const p12 = useDailyOpsPatrolValue(s[12].domain, s[12].equipmentTag, s[12].primaryColumn);
  const p13 = useDailyOpsPatrolValue(s[13].domain, s[13].equipmentTag, s[13].primaryColumn);
  const p14 = useDailyOpsPatrolValue(s[14].domain, s[14].equipmentTag, s[14].primaryColumn);
  const p15 = useDailyOpsPatrolValue(s[15].domain, s[15].equipmentTag, s[15].primaryColumn);
  const p16 = useDailyOpsPatrolValue(s[16].domain, s[16].equipmentTag, s[16].primaryColumn);
  const p17 = useDailyOpsPatrolValue(s[17].domain, s[17].equipmentTag, s[17].primaryColumn);
  const p18 = useDailyOpsPatrolValue(s[18].domain, s[18].equipmentTag, s[18].primaryColumn);
  const p19 = useDailyOpsPatrolValue(s[19].domain, s[19].equipmentTag, s[19].primaryColumn);
  const p20 = useDailyOpsPatrolValue(s[20].domain, s[20].equipmentTag, s[20].primaryColumn);
  const p21 = useDailyOpsPatrolValue(s[21].domain, s[21].equipmentTag, s[21].primaryColumn);
  const p22 = useDailyOpsPatrolValue(s[22].domain, s[22].equipmentTag, s[22].primaryColumn);
  const p23 = useDailyOpsPatrolValue(s[23].domain, s[23].equipmentTag, s[23].primaryColumn);
  const p24 = useDailyOpsPatrolValue(s[24].domain, s[24].equipmentTag, s[24].primaryColumn);

  const q0 = useDailyOpsPatrolValue(s[0].domain, s[0].equipmentTag, s[0].secondaryColumn);
  const q1 = useDailyOpsPatrolValue(s[1].domain, s[1].equipmentTag, s[1].secondaryColumn);
  const q2 = useDailyOpsPatrolValue(s[2].domain, s[2].equipmentTag, s[2].secondaryColumn);
  const q3 = useDailyOpsPatrolValue(s[3].domain, s[3].equipmentTag, s[3].secondaryColumn);
  const q4 = useDailyOpsPatrolValue(s[4].domain, s[4].equipmentTag, s[4].secondaryColumn);
  const q5 = useDailyOpsPatrolValue(s[5].domain, s[5].equipmentTag, s[5].secondaryColumn);
  const q6 = useDailyOpsPatrolValue(s[6].domain, s[6].equipmentTag, s[6].secondaryColumn);
  const q7 = useDailyOpsPatrolValue(s[7].domain, s[7].equipmentTag, s[7].secondaryColumn);
  const q8 = useDailyOpsPatrolValue(s[8].domain, s[8].equipmentTag, s[8].secondaryColumn);
  const q9 = useDailyOpsPatrolValue(s[9].domain, s[9].equipmentTag, s[9].secondaryColumn);
  const q10 = useDailyOpsPatrolValue(s[10].domain, s[10].equipmentTag, s[10].secondaryColumn);
  const q11 = useDailyOpsPatrolValue(s[11].domain, s[11].equipmentTag, s[11].secondaryColumn);
  const q12 = useDailyOpsPatrolValue(s[12].domain, s[12].equipmentTag, s[12].secondaryColumn);
  const q13 = useDailyOpsPatrolValue(s[13].domain, s[13].equipmentTag, s[13].secondaryColumn);
  const q14 = useDailyOpsPatrolValue(s[14].domain, s[14].equipmentTag, s[14].secondaryColumn);
  const q15 = useDailyOpsPatrolValue(s[15].domain, s[15].equipmentTag, s[15].secondaryColumn);
  const q16 = useDailyOpsPatrolValue(s[16].domain, s[16].equipmentTag, s[16].secondaryColumn);
  const q17 = useDailyOpsPatrolValue(s[17].domain, s[17].equipmentTag, s[17].secondaryColumn);
  const q18 = useDailyOpsPatrolValue(s[18].domain, s[18].equipmentTag, s[18].secondaryColumn);
  const q19 = useDailyOpsPatrolValue(s[19].domain, s[19].equipmentTag, s[19].secondaryColumn);
  const q20 = useDailyOpsPatrolValue(s[20].domain, s[20].equipmentTag, s[20].secondaryColumn);
  const q21 = useDailyOpsPatrolValue(s[21].domain, s[21].equipmentTag, s[21].secondaryColumn);
  const q22 = useDailyOpsPatrolValue(s[22].domain, s[22].equipmentTag, s[22].secondaryColumn);
  const q23 = useDailyOpsPatrolValue(s[23].domain, s[23].equipmentTag, s[23].secondaryColumn);
  const q24 = useDailyOpsPatrolValue(s[24].domain, s[24].equipmentTag, s[24].secondaryColumn);

  const primaryValues = [
    p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12,
    p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23, p24,
  ];
  const secondaryValues = [
    q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12,
    q13, q14, q15, q16, q17, q18, q19, q20, q21, q22, q23, q24,
  ];

  const units: OverviewHmiUnit[] = s.map((slot, i) => {
    const primaryValue = toNumber(primaryValues[i]);
    return {
      equipmentTag: slot.equipmentTag,
      label: slot.equipmentTag,
      domain: slot.domain,
      status: deriveStatus(slot.domain, primaryValue),
      primaryValue,
      primaryUnit: slot.primaryUnit,
      secondaryValue: slot.secondaryColumn ? toNumber(secondaryValues[i]) : undefined,
      secondaryUnit: slot.secondaryColumn ? slot.secondaryUnit : undefined,
      isThresholdValidated: THRESHOLD_VALIDATED_DOMAINS.has(slot.domain),
    };
  });

  return { generatedAt: new Date().toISOString(), units };
}
