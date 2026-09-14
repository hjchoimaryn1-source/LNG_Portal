// src/cmms-environment/types/environment.ts
//
// Pure domain types for the NP-10 Environmental & Waste Management module.
// No imports from outside this file (mirrors src/cmms-trucking/types.ts
// isolation rule) — DAOs/services import these, never the other way.

export type EnvMonitoringStatus = 'PASS' | 'FAIL' | 'PENDING_REVIEW';

export interface AirQualityLog {
  id: number;
  logDate: string;
  so2Ugm3: number | null;
  noxUgm3: number | null;
  coUgm3: number | null;
  pm10Ugm3: number | null;
  status: EnvMonitoringStatus | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface NewAirQualityLogInput {
  logDate: string;
  so2Ugm3?: number | null;
  noxUgm3?: number | null;
  coUgm3?: number | null;
  pm10Ugm3?: number | null;
  status?: EnvMonitoringStatus | null;
  recordedBy?: string | null;
}

export interface WastewaterLog {
  id: number;
  logDate: string;
  samplePoint: string;
  parameter: string;
  unit: string;
  standardRef: string | null;
  measuredResult: number;
  status: EnvMonitoringStatus | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface NewWastewaterLogInput {
  logDate: string;
  samplePoint: string;
  parameter: string;
  unit: string;
  standardRef?: string | null;
  measuredResult: number;
  status?: EnvMonitoringStatus | null;
  recordedBy?: string | null;
}

export interface NoiseLog {
  id: number;
  logDate: string;
  location: string;
  readingDba: number;
  status: EnvMonitoringStatus | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface NewNoiseLogInput {
  logDate: string;
  location: string;
  readingDba: number;
  status?: EnvMonitoringStatus | null;
  recordedBy?: string | null;
}

export interface SeawaterLog {
  id: number;
  logDate: string;
  location: string;
  doMgl: number | null;
  salinityPpt: number | null;
  turbidityNtu: number | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface NewSeawaterLogInput {
  logDate: string;
  location: string;
  doMgl?: number | null;
  salinityPpt?: number | null;
  turbidityNtu?: number | null;
  recordedBy?: string | null;
}

export type WasteCategory = 'HAZARDOUS' | 'NON_HAZARDOUS';

export interface WasteTransferLog {
  id: number;
  transferDate: string;
  wasteCategory: WasteCategory;
  wasteType: string;
  sourceDepartment: string;
  quantityKg: number;
  disposalMethod: string;
  transportedTo: string | null;
  picSignature: string | null;
  createdAt: string;
}

export interface NewWasteTransferLogInput {
  transferDate: string;
  wasteCategory: WasteCategory;
  wasteType: string;
  sourceDepartment: string;
  quantityKg: number;
  disposalMethod: string;
  transportedTo?: string | null;
  picSignature?: string | null;
}

export type ThwsStatus = 'IN_STORAGE' | 'DISPOSED' | 'OVERDUE';

export interface ThwsInventoryItem {
  id: number;
  wasteCode: string;
  wasteDescription: string;
  quantityKg: number;
  storageInDate: string;
  disposalDueDate: string;
  status: ThwsStatus;
  handlerPic: string | null;
  createdAt: string;
}

export interface NewThwsInventoryItemInput {
  wasteCode: string;
  wasteDescription: string;
  quantityKg: number;
  storageInDate: string;
  disposalDueDate: string;
  status?: ThwsStatus;
  handlerPic?: string | null;
}
