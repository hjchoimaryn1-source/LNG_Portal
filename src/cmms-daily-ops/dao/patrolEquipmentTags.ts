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
//   iso_tank_cargo는 여기 없다 — 해당 순찰 폼이 Stage B에 존재하지 않고
//   (ISO Tank UI는 NiasActiveBayWorkspace.tsx 소관, 범위 밖), 임의의 태그를
//   지어내지 않기 위해 의도적으로 제외했다(Stage C1 deviation note 참고).

export const METERING_EQUIPMENT_TAGS = ['METERING-TRAIN-A', 'METERING-TRAIN-B'];
export const AAV_EQUIPMENT_TAGS = ['AAV-102', 'AAV-103', 'AAV-105', 'AAV-106'];
export const N2_CYLINDER_TAGS = Array.from({ length: 10 }, (_, i) => `N2-CYL-${String(i + 1).padStart(2, '0')}`);
export const N2_SKID_AREA_TAGS = ['N2-SKID-SUPPLY-1', 'N2-SKID-SUPPLY-2', 'N2-SKID-SUPPLY-3'];
export const N2_ALL_TAGS = [...N2_CYLINDER_TAGS, ...N2_SKID_AREA_TAGS];
export const GC_EQUIPMENT_TAG = 'GC-01';
export const ELECTRICAL_EQUIPMENT_TAGS = ['MV-SWGR-01', 'LV-SWGR-01', 'TRAFO-01', 'UPS-01'];

// Phase 12 Addendum 2 자리표시자 — 실제 순찰 폼이 아직 없는 유일한 도메인이라
// 지시에 명시된 값을 그대로 쓴다.
export const ISO_TANK_UNLOADING_SKID_TAGS = ['T-201', 'T-202', 'T-203', 'T-204'];
