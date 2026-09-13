// src/cmms-trucking/index.ts
//
// Barrel — Phase 11a NP-03 트럭킹/차량 검사 모듈의 공개 진입점.
// Sub-stage A: 타입만 재노출하는 빈 셸. 컴포넌트/DAO 재노출은 이후
// 서브스테이지에서 필요에 따라 추가한다.

export type {
  TruckInspectionType,
  TruckInspectionFormCode,
  TruckInspectionStatus,
  InspectionItemStatus,
  TruckInspectionHeader,
  NewTruckInspectionHeaderInput,
  InspectionItem,
  NewInspectionItemInput,
  IncidentType,
  IncidentLogEntry,
  NewIncidentLogEntryInput,
} from './types';
