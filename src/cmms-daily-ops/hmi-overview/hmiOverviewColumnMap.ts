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
//
//   FALLBACK_*_COLUMN_BY_DOMAIN (2026-09-17, HJ-approved): AAV-only D/S
//   fallback. The 2026-09-15 Daily Operation Report backfill
//   (dailyOpsPatrolPdfSeed.ts) only ever supplies D/S (downstream) AAV
//   readings, never U/S — so PRIMARY/SECONDARY_COLUMN_BY_DOMAIN.aav (U/S
//   gauge) stayed permanently null for those rows, showing "no reading" on
//   HMI Overview tiles. This map is consumed ONLY by
//   useAavDsFallbackValues.ts -> useOverviewHmiData.ts (HMI Overview), not
//   by pidCandidateTags.ts / PidTagBadge.tsx — PIDOverlayView's P&ID badges
//   import PRIMARY_COLUMN_BY_DOMAIN directly from pidCandidateTags.ts and
//   never touch this file, so they are unaffected by this fallback (confirmed
//   via import-graph check, not by design intent alone).

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

export const FALLBACK_PRIMARY_COLUMN_BY_DOMAIN: Partial<Record<PatrolDomain, string>> = {
  aav: 'pressure_transmitter_ds_bar',
};

export const FALLBACK_SECONDARY_COLUMN_BY_DOMAIN: Partial<Record<PatrolDomain, string>> = {
  aav: 'temperature_transmitter_ds_c',
};

export function columnUnit(domain: PatrolDomain, columnName: string): string {
  if (!columnName) return '';
  return PATROL_FIELD_MAP[domain].find((f) => f.columnName === columnName)?.unit ?? '';
}

/** primary가 null/undefined면 fallback을, 아니면 primary를 그대로 쓴다 (AAV U/S→D/S 전용). */
export function resolveWithFallback(primary: number | null, fallback: number | null): number | null {
  return primary !== null ? primary : fallback;
}
