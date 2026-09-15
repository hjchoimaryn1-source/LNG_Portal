// src/cmms-daily-ops/hmi-overview/domainGroupLabels.ts
//
// PURPOSE
//   Human-readable section headers for grouping OverviewHmiUnit[] by
//   PatrolDomain. This is a category label map (9 fixed domain keys from
//   patrolLog.ts), not a per-equipment-tag mapping — it does not violate the
//   "no hardcoded unit tag/naming scheme" constraint, since no vaporizer
//   unit tag (AAV-xxx / VAP-xxx / UNIT-x) appears here.

import type { PatrolDomain } from '../types/patrolLog';

export const DOMAIN_GROUP_LABEL: Record<PatrolDomain, string> = {
  metering_train_a: 'Metering Train A',
  metering_train_b: 'Metering Train B',
  aav: 'Ambient Vaporizer',
  n2_skid: 'N2 Skid',
  gc: 'Gas Chromatograph',
  electrical: 'Electrical',
  iso_tank_unloading_skid: 'ISO Tank Unloading Skid',
  iso_tank_cargo: 'ISO Tank Cargo',
  ng_buffer_tank: 'NG Buffer Tank',
};

/** Render order for domain sections — fixed layout, independent of unit count per domain. */
export const DOMAIN_GROUP_ORDER: PatrolDomain[] = [
  'ng_buffer_tank',
  'aav',
  'metering_train_a',
  'metering_train_b',
  'gc',
  'n2_skid',
  'iso_tank_unloading_skid',
  'iso_tank_cargo',
  'electrical',
];
