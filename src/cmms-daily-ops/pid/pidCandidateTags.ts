// src/cmms-daily-ops/pid/pidCandidateTags.ts
//
// PURPOSE
//   Phase 12 Addendum 2 — 캘리브레이션 모드에서 선택 가능한 태그 후보 전체
//   8개 PatrolDomain 중 7개(ISO Tank Cargo 제외, 아래 참고)로 확장한다.
//   태그 값은 patrolEquipmentTags.ts(순수 Logic/Data Layer 레지스트리,
//   Stage C1 리팩터로 B1 컴포넌트 파일에서 승격됨)에서 가져온다.
//
//   iso_tank_cargo는 지시에 따라 이 목록에서 제외한다 — ISO Tank 순찰 UI/
//   태그는 NiasActiveBayWorkspace.tsx의 기존 도메인 소관이며 범위 밖이다.

import {
  AAV_EQUIPMENT_TAGS,
  METERING_EQUIPMENT_TAGS,
  N2_ALL_TAGS,
  GC_EQUIPMENT_TAG,
  ELECTRICAL_EQUIPMENT_TAGS,
  ISO_TANK_UNLOADING_SKID_TAGS,
} from '../dao/patrolEquipmentTags';
import type { PatrolDomain } from '../types/patrolLog';

function domainMap(tags: string[], domain: PatrolDomain): Array<[string, PatrolDomain]> {
  return tags.map((tag) => [tag, domain]);
}

export const CANDIDATE_TAG_DOMAIN: Record<string, PatrolDomain> = Object.fromEntries([
  // METERING_EQUIPMENT_TAGS === ['METERING-TRAIN-A', 'METERING-TRAIN-B'] — index 0/1 map
  // 1:1 to the two metering domains, unlike the other domains' single-domain tag lists.
  [METERING_EQUIPMENT_TAGS[0], 'metering_train_a' as PatrolDomain],
  [METERING_EQUIPMENT_TAGS[1], 'metering_train_b' as PatrolDomain],
  ...domainMap(AAV_EQUIPMENT_TAGS, 'aav'),
  ...domainMap(N2_ALL_TAGS, 'n2_skid'),
  ...domainMap([GC_EQUIPMENT_TAG], 'gc'),
  ...domainMap(ELECTRICAL_EQUIPMENT_TAGS, 'electrical'),
  ...domainMap(ISO_TANK_UNLOADING_SKID_TAGS, 'iso_tank_unloading_skid'),
]);

/** 배지에 표시할 도메인별 대표 컬럼 1개 — PidTagBadge.tsx가 사용한다. */
export const PRIMARY_COLUMN_BY_DOMAIN: Partial<Record<PatrolDomain, string>> = {
  metering_train_a: 'press_barg',
  metering_train_b: 'press_barg',
  aav: 'pressure_gauge_us_bar',
  n2_skid: 'cylinder_pressure_bar',
  gc: 'mol_methane',
  electrical: 'bus_voltage',
  iso_tank_unloading_skid: 'level_iot_pct',
};
