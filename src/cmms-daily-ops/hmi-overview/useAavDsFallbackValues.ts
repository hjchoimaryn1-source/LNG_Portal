// src/cmms-daily-ops/hmi-overview/useAavDsFallbackValues.ts
//
// PURPOSE
//   AAV-only U/S→D/S fallback data source (2026-09-17, HJ-approved) —
//   isolated into its own hook so useOverviewHmiData.ts doesn't have to
//   unroll 8 more hook calls (4 tags x primary/secondary) inline and risk
//   the 250-line file cap (AGENTS.md §3). Rules-of-Hooks: AAV_EQUIPMENT_TAGS
//   has a fixed length (4) — hand-unrolled below, same discipline as
//   useOverviewHmiData.ts's own OVERVIEW_UNIT_SLOTS unrolling.

'use client';

import { useDailyOpsPatrolValue } from '../state/useDailyOpsPatrolStore';
import { AAV_EQUIPMENT_TAGS } from '../dao/patrolEquipmentTags';
import type { PatrolFieldValue } from '../dao/dailyOpsPatrolDao';
import { FALLBACK_PRIMARY_COLUMN_BY_DOMAIN, FALLBACK_SECONDARY_COLUMN_BY_DOMAIN } from './hmiOverviewColumnMap';

const FALLBACK_PRIMARY_COLUMN = FALLBACK_PRIMARY_COLUMN_BY_DOMAIN.aav ?? '';
const FALLBACK_SECONDARY_COLUMN = FALLBACK_SECONDARY_COLUMN_BY_DOMAIN.aav ?? '';

export interface AavDsFallbackValues {
  primaryByTag: Record<string, PatrolFieldValue | undefined>;
  secondaryByTag: Record<string, PatrolFieldValue | undefined>;
}

export function useAavDsFallbackValues(): AavDsFallbackValues {
  const p0 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[0], FALLBACK_PRIMARY_COLUMN);
  const p1 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[1], FALLBACK_PRIMARY_COLUMN);
  const p2 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[2], FALLBACK_PRIMARY_COLUMN);
  const p3 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[3], FALLBACK_PRIMARY_COLUMN);

  const s0 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[0], FALLBACK_SECONDARY_COLUMN);
  const s1 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[1], FALLBACK_SECONDARY_COLUMN);
  const s2 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[2], FALLBACK_SECONDARY_COLUMN);
  const s3 = useDailyOpsPatrolValue('aav', AAV_EQUIPMENT_TAGS[3], FALLBACK_SECONDARY_COLUMN);

  return {
    primaryByTag: {
      [AAV_EQUIPMENT_TAGS[0]]: p0,
      [AAV_EQUIPMENT_TAGS[1]]: p1,
      [AAV_EQUIPMENT_TAGS[2]]: p2,
      [AAV_EQUIPMENT_TAGS[3]]: p3,
    },
    secondaryByTag: {
      [AAV_EQUIPMENT_TAGS[0]]: s0,
      [AAV_EQUIPMENT_TAGS[1]]: s1,
      [AAV_EQUIPMENT_TAGS[2]]: s2,
      [AAV_EQUIPMENT_TAGS[3]]: s3,
    },
  };
}
