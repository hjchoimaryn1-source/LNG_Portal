// src/cmms-environment/index.ts
//
// Barrel — Phase 11b NP-10 환경/폐기물 관리 모듈의 공개 진입점.
// Stage 1은 백엔드 스캐폴딩 전용이므로 컴포넌트 export는 없다
// (프런트엔드 내비게이션 배선은 Stage 2에서 진행).

export type {
  EnvMonitoringStatus,
  AirQualityLog,
  NewAirQualityLogInput,
  WastewaterLog,
  NewWastewaterLogInput,
  NoiseLog,
  NewNoiseLogInput,
  SeawaterLog,
  NewSeawaterLogInput,
  WasteCategory,
  WasteTransferLog,
  NewWasteTransferLogInput,
  ThwsStatus,
  ThwsInventoryItem,
  NewThwsInventoryItemInput,
} from './types/environment';

export {
  insertAirQualityLog,
  selectAllAirQualityLogs,
  insertWastewaterLog,
  selectAllWastewaterLogs,
  insertNoiseLog,
  selectAllNoiseLogs,
  insertSeawaterLog,
  selectAllSeawaterLogs,
} from './dao/environmentMonitoringDao';

export {
  getThwsDaysRemaining,
  flagPendingReview,
  type MonitoringStatusRecord,
} from './services/environmentMonitoringService';
