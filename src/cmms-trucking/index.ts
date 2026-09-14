// src/cmms-trucking/index.ts
//
// Barrel — Phase 11a NP-03 트럭킹/차량 검사 모듈의 공개 진입점.

export { PreOperationChecklist } from './components/PreOperationChecklist';
export { VehicleSecurityChecklist } from './components/VehicleSecurityChecklist';
export { PeriodicInspectionLog } from './components/PeriodicInspectionLog';
export { PreOpsTruckIsoTankChecklist } from './components/PreOpsTruckIsoTankChecklist';
export { PostTransitConditionReport } from './components/PostTransitConditionReport';
export {
  TrafficMgmtVerificationSection,
  type TrafficMgmtVerificationValues,
  type VerificationResult,
} from './components/TrafficMgmtVerificationSection';

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
