// src/cmms-daily-ops/hmi-overview/overviewUnitSlots.ts
//
// PURPOSE
//   Static (domain, equipmentTag, primary/secondary column) slot list that
//   useOverviewHmiData.ts hand-unrolls its hook calls against (Rules-of-Hooks
//   — same technique useHmiLiveStore.ts's MAX_FIELD_SLOTS already uses for
//   one equipment's columns, scaled here to all in-scope units). Every value
//   is derived from existing registries (patrolEquipmentTags.ts,
//   pidCandidateTags.ts via hmiOverviewColumnMap.ts, patrolFieldMaps.ts) —
//   no tag or column literal is invented in this file.
//
//   Scope: exactly the 7 domains this Overview covers (metering train A/B,
//   AAV, NG buffer tank, N2 skid, GC, ISO tank unloading skid). electrical
//   and iso_tank_cargo are intentionally excluded — iso_tank_cargo has no
//   patrol form/tags at all (patrolEquipmentTags.ts's own note).
//
//   Length is fixed at module load (static imports only, currently 25) — if
//   patrolEquipmentTags.ts grows, add unrolled slot calls in
//   useOverviewHmiData.ts and bump the count together (same discipline as
//   useHmiLiveStore.ts's MAX_FIELD_SLOTS comment).

import type { PatrolDomain } from '../types/patrolLog';
import { PATROL_EQUIPMENT_TAGS_BY_DOMAIN } from '../dao/patrolEquipmentTags';
import { PRIMARY_COLUMN_BY_DOMAIN, SECONDARY_COLUMN_BY_DOMAIN, columnUnit } from './hmiOverviewColumnMap';

export interface OverviewUnitSlot {
  domain: PatrolDomain;
  equipmentTag: string;
  primaryColumn: string;
  primaryUnit: string;
  secondaryColumn: string;
  secondaryUnit: string;
}

const IN_SCOPE_DOMAINS: PatrolDomain[] = [
  'ng_buffer_tank',
  'aav',
  'metering_train_a',
  'metering_train_b',
  'gc',
  'n2_skid',
  'iso_tank_unloading_skid',
];

export const OVERVIEW_UNIT_SLOTS: OverviewUnitSlot[] = IN_SCOPE_DOMAINS.flatMap((domain) => {
  const tags = PATROL_EQUIPMENT_TAGS_BY_DOMAIN[domain] ?? [];
  const primaryColumn = PRIMARY_COLUMN_BY_DOMAIN[domain] ?? '';
  const secondaryColumn = SECONDARY_COLUMN_BY_DOMAIN[domain] ?? '';
  return tags.map((equipmentTag) => ({
    domain,
    equipmentTag,
    primaryColumn,
    primaryUnit: columnUnit(domain, primaryColumn),
    secondaryColumn,
    secondaryUnit: columnUnit(domain, secondaryColumn),
  }));
});
