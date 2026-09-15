// src/cmms-daily-ops/hmi-overview/hmiOverviewColumnMap.ts
//
// PURPOSE
//   Primary column is NOT redefined here — re-exported from
//   pidCandidateTags.ts's PRIMARY_COLUMN_BY_DOMAIN, the single source
//   PIDOverlayView's badges already use, so this module's tiles and the
//   P&ID badges never disagree about which column represents a unit.
//   Secondary column is a new per-domain pick for this module's two-value
//   tile layout; n2_skid has none (its only other field, cylinder_status,
//   is text, not number) — mapped to '' (dummy key), the same convention
//   PidTagBadge.tsx/useHmiEquipment.ts use for "no column at this slot".
//   Units are derived from PATROL_FIELD_MAP, never duplicated by hand, so
//   they cannot drift from the DDL/label source of truth.

import type { PatrolDomain } from '../types/patrolLog';
import { PATROL_FIELD_MAP } from '../dao/patrolFieldMaps';
import { PRIMARY_COLUMN_BY_DOMAIN } from '../pid/pidCandidateTags';

export { PRIMARY_COLUMN_BY_DOMAIN };

export const SECONDARY_COLUMN_BY_DOMAIN: Partial<Record<PatrolDomain, string>> = {
  aav: 'temperature_gauge_us_c',
  metering_train_a: 'energy_flowrate_mmbtud',
  metering_train_b: 'energy_flowrate_mmbtud',
  // Cross-check pair with the primary PT-07A transmitter reading — same pairing
  // pms-master-specification.md's NG Buffer Tank row already calls out.
  ng_buffer_tank: 'pressure_gauge_barg',
  gc: 'mol_h2s_ppm',
  iso_tank_unloading_skid: 'pressure_mpa',
};

export function columnUnit(domain: PatrolDomain, columnName: string): string {
  if (!columnName) return '';
  return PATROL_FIELD_MAP[domain].find((f) => f.columnName === columnName)?.unit ?? '';
}
