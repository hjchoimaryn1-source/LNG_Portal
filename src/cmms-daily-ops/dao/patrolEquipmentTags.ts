// src/cmms-daily-ops/dao/patrolEquipmentTags.ts
//
// PURPOSE
//   PatrolDomain별 실제 equipment_tag 순수 레지스트리 (Logic/Data Layer,
//   React 바인딩 없음 — AGENTS.md §3). Stage B B1 폼들이 원래 각자 로컬로
//   정의했던 태그 상수를 여기로 승격했다 — dailyReportSnapshotDao.ts(Stage C1)와
//   pidCandidateTags.ts(Addendum 2)가 'use client' 컴포넌트 파일을 거치지
//   않고 동일한 값을 참조하기 위함(서버 DAO가 UI 레이어에 의존하는 역방향
//   레이어링을 피함). B1 폼들은 이제 이 파일에서 import해서 쓴다.
//
//   iso_tank_cargo는 여기 없다 — Stage C1 당시엔 순찰 폼 자체가 없어 정적
//   등록을 보류했고(ISO Tank UI는 NiasActiveBayWorkspace.tsx 소관, 범위 밖),
//   지금은 SIMU 탱크 모집단이 Nias↔Saviour 선적 사이클로 교체되어 정적
//   배열이 원천적으로 부적합하다 — 대신 deriveIsoTankCargoTags.ts가
//   fleetTanks에서 Laydown 1/2 소재 탱크만 매 렌더마다 동적으로 도출한다.

import type { PatrolDomain } from '../types/patrolLog';

export const METERING_EQUIPMENT_TAGS = ['METERING-TRAIN-A', 'METERING-TRAIN-B'];
export const AAV_EQUIPMENT_TAGS = ['AAV-102', 'AAV-103', 'AAV-105', 'AAV-106'];
export const N2_CYLINDER_TAGS = Array.from({ length: 10 }, (_, i) => `N2-CYL-${String(i + 1).padStart(2, '0')}`);
export const N2_SKID_AREA_TAGS = ['N2-SKID-SUPPLY-1', 'N2-SKID-SUPPLY-2', 'N2-SKID-SUPPLY-3'];
export const N2_ALL_TAGS = [...N2_CYLINDER_TAGS, ...N2_SKID_AREA_TAGS];
export const GC_EQUIPMENT_TAG = 'GC-01';
export const ELECTRICAL_EQUIPMENT_TAGS = ['MV-SWGR-01', 'LV-SWGR-01', 'TRAFO-01', 'UPS-01'];

export interface ElectricalSubBlock {
  tag: string;
  label: string;
  columns: string[];
}

const [MV_SWGR_TAG, LV_SWGR_TAG, TRAFO_TAG, UPS_TAG] = ELECTRICAL_EQUIPMENT_TAGS;

// B1 폼(ElectricalPatrolForm.tsx)과 인쇄본(PrintPage4.tsx)이 공유하는 태그별
// 컬럼 부분집합. PATROL_FIELD_MAP.electrical(9개 와이드 컬럼)을 서브블록
// 성격에 맞게 나눠 쓴다 — 원래 ElectricalPatrolForm.tsx 로컬 정의였으나,
// print 레이어가 재사용하려면 'use client' 컴포넌트 파일에 의존하는 역방향
// 레이어링이 생기므로(본 파일 상단 주석과 동일한 문제) 여기로 이전.
export const ELECTRICAL_SUB_BLOCKS: ElectricalSubBlock[] = [
  { tag: MV_SWGR_TAG, label: 'MV SWGR', columns: ['status_text', 'bus_voltage', 'total_load_current_a', 'room_temperature_c'] },
  { tag: LV_SWGR_TAG, label: 'LV SWGR', columns: ['status_text', 'bus_voltage', 'total_load_current_a', 'room_temperature_c'] },
  { tag: TRAFO_TAG, label: 'TRAFO', columns: ['status_text', 'oil_temperature_c', 'winding_temperature_c', 'oil_level_text'] },
  { tag: UPS_TAG, label: 'UPS', columns: ['status_text', 'battery_capacity_pct', 'ups_load_pct', 'room_temperature_c'] },
];

// FORM-NP-08-33-N p2 Section C(UNLOADING SKID) 대상 4기.
export const ISO_TANK_UNLOADING_SKID_TAGS = ['T-201', 'T-202', 'T-203', 'T-204'];

// Phase 12 Stage E-1 — NG Buffer Tank는 단일 용기(P&ID/계기 index와 일치,
// pms-master-specification.md §NG Buffer Tank 행 및 sopIndex.json NP08-40-3 근거).
export const NG_BUFFER_TANK_EQUIPMENT_TAG = 'V-101';

/**
 * (domain → equipment_tag[]) 전체 — iso_tank_cargo 제외 8개 도메인.
 * Stage C1 generateSnapshot과 pidCandidateTags.ts가 공유하는 그룹핑.
 * iso_tank_cargo는 순찰 폼이 없어(ISO Tank UI는 NiasActiveBayWorkspace.tsx
 * 소관) 의도적으로 빠져 있다 — 임의의 태그를 지어내지 않기 위함.
 */
export const PATROL_EQUIPMENT_TAGS_BY_DOMAIN: Partial<Record<PatrolDomain, string[]>> = {
  metering_train_a: [METERING_EQUIPMENT_TAGS[0]],
  metering_train_b: [METERING_EQUIPMENT_TAGS[1]],
  aav: AAV_EQUIPMENT_TAGS,
  n2_skid: N2_ALL_TAGS,
  gc: [GC_EQUIPMENT_TAG],
  electrical: ELECTRICAL_EQUIPMENT_TAGS,
  iso_tank_unloading_skid: ISO_TANK_UNLOADING_SKID_TAGS,
  ng_buffer_tank: [NG_BUFFER_TANK_EQUIPMENT_TAG],
};
