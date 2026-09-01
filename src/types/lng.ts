// src/types/lng.ts

export enum NodeState {
  NODE_1_ARUN_PAG_TERMINAL = 'NODE_1_ARUN_PAG_TERMINAL',
  NODE_2_MV_SAVIOUR_TRANSIT = 'NODE_2_MV_SAVIOUR_TRANSIT',
  NODE_3_NIAS_LAYDOWN_YARD = 'NODE_3_NIAS_LAYDOWN_YARD',
  NODE_4_REGAS_ACTIVE_BAY = 'NODE_4_REGAS_ACTIVE_BAY',
  NODE_5_EMPTY_RETURN_CYCLE = 'NODE_5_EMPTY_RETURN_CYCLE',
  NODE_MAINTENANCE_MRO = 'NODE_MAINTENANCE_MRO',
}

export type DefectCategory =
  | 'VACUUM_LOSS'
  | 'VALVE_LEAK'
  | 'INSTRUMENT_FAULT'
  | 'STRUCTURE_DAMAGE'
  | 'PERIODIC_INSPECTION';

export type MaintenanceLocation = 'ARUN_WORKSHOP' | 'NIAS_MRO_BAY';

export type SubProcessKey =
  // Arun PAG Terminal
  | 'ARUN_LOADING_COQ'
  | 'ARUN_MASTER_HISTORY'
  | 'ARUN_HEEL_BOG_LOSS'
  | 'ARUN_STAGING_YARD'
  // MV. Saviour Transit
  | 'SAVIOUR_VOYAGE_MONITORING'
  | 'SAVIOUR_MARINE_PRESSURE'
  // LNG-Process Virtual Pipeline Main Overview
  | 'LNG_PROCESS_OVERVIEW'
  | 'NIAS_TERMINAL_OVERVIEW'
  // Nias Regas Terminal - Domain 1: ISO Tank Management
  | 'NIAS_TANK_OVERVIEW'
  | 'NIAS_LAYDOWN_1_2_LOG'
  | 'NIAS_ACTIVE_BAY_TANKS'
  | 'NIAS_LAYDOWN_3_HEEL'
  // Nias Regas Terminal - Domain 2: Regas System & Gas-to-Power
  | 'NIAS_GAS_PROCESS_TELEMETRY'
  | 'NIAS_GC_GAS_QUALITY'
  | 'NIAS_GAS_METERING_LEDGER'
  | 'NIAS_PLTMG_POWER_OUTPUT'
  | 'NIAS_HEAT_SETTLEMENT'
  // Legacy Aliases for Backwards Compatibility
  | 'NIAS_OPERATIONS_OVERVIEW'
  | 'NIAS_DAILY_CONDITION_BOG'
  | 'NIAS_FOUR_BAY_REGAS'
  | 'NIAS_EMPTY_RETURN'
  | 'NIAS_LAYDOWN_DEPRESS'
  | 'NIAS_ACTIVE_REGAS'
  | 'NIAS_BAY_MOUNTED_TANKS'
  | 'NIAS_CUSTODY_HEAT_SETTLEMENT'
  // Global Fleet Hub
  | 'GLOBAL_FLEET_HUB'
  // Maintenance & System
  | 'MAINTENANCE_MRO_HUB'
  | 'DATA_INGESTION_HUB'
  // CMMS Enterprise Modules
  | 'EQUIPMENT_ASSET_REGISTRY'
  | 'WORK_ORDER_MAINTENANCE'
  | 'WORK_ORDER_DIRECTORY'
  | 'PM_SCHEDULES'
  | 'MANPOWER_SHIFT_ROSTER'
  | 'MANPOWER_DAILY_SHIFT'
  | 'MANPOWER_ROTATION_TRACKER'
  | 'MANPOWER_MONTHLY_GRID'
  | 'MANPOWER_TRAINING_MATRIX'
  | 'MANPOWER_PTW'
  | 'PTW_PERMITS'
  | 'SAFETY_GAS_TESTING'
  | 'SAFETY_ERT_READINESS'
  | 'CALIBRATION_COMPLIANCE';

export interface OffloadHeelMetrics {
  offloadDate: string;
  heelLevelPct: number;
  heelVolumeM3: number;
  heelMmH2O: number;
  heelMassKg: number;
  holdingPressureMPa: number;
  tempC: number;
  bayId?: string;
  remarks?: string;
}

export interface BackhaulDepartureMetrics {
  departureDate: string;
  departureLevelPct: number;
  departureMassKg: number;
  departurePressureMPa: number;
  departureTempC: number;
  manifestNo: string;
  vesselName: string;
  safetyClearance: boolean;
  remarks?: string;
}

export interface ArrivalHeelMetrics {
  arrivalDate: string;
  arrivalMassKg: number;
  arrivalPressureMPa: number;
  arrivalTempC: number;
  heelLevelPct?: number;
  tareWeightKg?: number;
  grossWeightKg?: number;
  inspectorRemarks?: string;
}

export interface VoyageHeelLoss {
  massLossKg: number;
  pressureRiseMPa: number;
  preservationEfficiencyPct: number;
  heelCreditMMBtu: number;
}

export interface FleetTankItem {
  no: number;
  tankNo: string; // e.g. "ISOT-001"
  rawTankNo: string;
  serialNo: string;
  cargoNo?: string;
  location: string;
  position: string;
  node: NodeState;
  level: number; // %
  levelM3: number;
  levelMmH2O: number;
  battery: number;
  pressureMPa: number;
  tempC: number;
  depress: string;
  pressBeforeMPa: number;
  pressAfterMPa: number;
  remarks: string;
  lastReportDate: string;
  shipment?: string;
  isMountedToBay?: string | null;
  // Heel Lifecycle Audit Fields
  offloadHeelMetrics?: OffloadHeelMetrics;
  backhaulDepartureMetrics?: BackhaulDepartureMetrics;
  arrivalHeelMetrics?: ArrivalHeelMetrics;
  voyageHeelLoss?: VoyageHeelLoss;
  // MRO & Maintenance Fields
  isUnderMaintenance?: boolean;
  defectCategory?: DefectCategory;
  maintenanceLocation?: MaintenanceLocation;
  defectDescription?: string;
  repairStartedAt?: string;
}

export interface SettlementLedgerEntry {
  id: string;
  tankNo: string;
  serialNo: string;
  shipment: string;
  date: string;
  // 1. Weight Measurement (Kg)
  weightBeforeKg?: number;
  weightAfterKg?: number;
  deliveredWeightKg: number; // Net Loaded
  // 2. Cryogenic Properties
  deliveredDensity: number;
  deliveredTempC: number;
  deliveredVolumeM3: number;
  deliveredGHV: number;
  // 3. Pre-Cooling & Gassing Up (GUP / CD)
  gassingUpVolM3?: number;
  gassingUpEnergyMMBtu?: number;
  coolingDownTempC?: number;
  coolingDownVolM3?: number;
  coolingDownEnergyMMBtu?: number;
  // 4. Final Custody Delivery
  btuLoadedMMBtu?: number;
  btuLoaded?: number;
  totalDeliveredVolM3?: number;
  deliveredMMBtu: number;
  // Consumed Metrics (Nias ORU)
  consumedWeightKg: number;
  consumedVolumeM3: number;
  consumedMMBtu: number;
  consumedDensity: number;
  // Losses & Variances
  lossesKg: number;
  lossesPercent: number;
  varianceMMBtu: number;
  disputeStatus: 'VERIFIED' | 'DISPUTE_ALERT' | 'PENDING';
  remarks: string;
}

export interface GasCompositionComparison {
  id: string;
  source: string;
  samplePoint: string;
  shipment?: string;
  reportDate: string;
  methane: number;
  ethane: number;
  propane: number;
  iButane: number;
  nButane: number;
  iPentane: number;
  nPentane: number;
  c6Plus?: number;
  nitrogen: number;
  co2: number;
  ghv: number;
}

export interface DailyMasterRecord {
  id?: string;
  reportDate: string; // "Report Date" (e.g. 2026-08-13)
  serialNo: string; // "Serial No." (e.g. SIMU-8101513)
  tankNo: string; // "ISO Tk No." (e.g. ISOT-014)
  shipment: string; // "Shipment" (e.g. N1, N-1)
  position: string; // "Yard Position" (e.g. Laydown 1, Laydown 2, Laydown 3, Bay 01~04, Empty Yard)
  level: number; // "Level (%)"
  levelM3: number; // "Level (m³)"
  levelMmH2O: number; // "Level (mmH2O)"
  battery: number; // "Battery (%)"
  pressureMPa: number; // "Pressure (MPa)"
  tempC: number; // "Temp (°C)"
  depress: string; // "Depress" ('None' | 'Depressurized' | 'Pending')
  pressBeforeMPa: number; // "Press_Before (MPa)"
  pressAfterMPa: number; // "Press_After (MPa)"
  remarks: string; // "Remarks"
  lossesKg?: number;
  lossesPercent?: number;
}

export interface ActiveBayState {
  bayId: string; // 'Bay 01', 'Bay 02', 'Bay 03', 'Bay 04'
  tankNo: string | null;
  serialNo?: string;
  pressure: number; // MPa
  temp: number; // °C
  level: number; // %
  flowRate: number; // t/h or Nm3/h
  status: 'RUNNING' | 'STANDBY' | 'MAINTENANCE' | 'DISCONNECTED';
  totalVaporizedM3: number;
  startTime?: string;
}

export interface DataIngestionStatus {
  fileKey: string;
  fileName: string;
  title: string;
  description: string;
  rowCount: number;
  lastLoaded: string;
  status: 'LOADED' | 'ERROR' | 'PENDING';
  sizeBytes?: number;
}

export interface GlobalPortalData {
  fleetTanks: FleetTankItem[];
  dailyMasterRecords: DailyMasterRecord[];
  settlementRecords: SettlementLedgerEntry[];
  gasCompositions: GasCompositionComparison[];
  activeBays: ActiveBayState[];
  ingestionStatuses: DataIngestionStatus[];
}

export type ShiftCode = 'D' | 'N' | 'Off' | 'On' | 'AL' | 'O';

export type DepartmentCode =
  | 'MANAGEMENT'
  | 'OP_ALPHA'
  | 'OP_BRAVO'
  | 'OP_CHARLIE'
  | 'MAINTENANCE'
  | 'HSSE'
  | 'HR_GA'
  | 'LOGISTICS';

export type TeamNameStandard =
  | 'Management'
  | 'Management ( Team A )'
  | 'TEAM-A'
  | 'TEAM-B'
  | 'TEAM-C'
  | 'Maintenance'
  | 'HSSE Team'
  | 'HR / GA'
  | 'Logistic Team';

export type CompetencyStatus = 'VALID' | 'EXPIRING_SOON' | 'DUE_SOON' | 'EXPIRED' | 'PENDING_APPROVAL' | 'NOT_APPLICABLE';

export type ERTRole = 'Incident Commander' | 'Fire Chief' | 'First Aider' | 'Gas Leak Response' | 'None';

export interface CompetencyCertification {
  code: string;
  name: string;
  category: 'SAFETY_HSE' | 'CRYOGENIC_OPS' | 'ELECTRICAL_INST' | 'MECHANICAL' | 'LOGISTICS_MARINE' | 'MANAGEMENT';
  issueDate: string;
  expiryDate: string;
  certNumber: string;
  issuingBody: string;
  status: CompetencyStatus;
  evidenceFileName?: string;
  submittedDate?: string;
}

export interface StaffPersonnel {
  id: string;
  name: string;
  role: string;
  department: DepartmentCode;
  teamName: TeamNameStandard | string;
  currentStatus: 'ON_SITE' | 'OFF_DUTY' | 'MOBILIZING' | 'HANDOVER_PENDING';
  todayShift: ShiftCode;
  onSiteDays: number;
  targetCycleDays: number;
  cycleStartDate: string;
  nextRotationDueDate: string;
  relieverName: string;
  contactNo: string;
  radioChannel: string;
  rosterDays: ShiftCode[];
  competencies?: CompetencyCertification[];
  complianceWarning?: boolean;
  ertRole?: ERTRole;
}

export type PTWType =
  | 'COLD_WORK'
  | 'HOT_WORK'
  | 'CONFINED_SPACE'
  | 'ELECTRICAL'
  | 'EXCAVATION'
  | 'RADIOGRAPHY';

export type PTWWorkflowStatus =
  | 'DRAFT'
  | 'PREPARED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'CLOSED';

export interface PTWPermit {
  id: string;
  formNumber: string; // NP07-10 to NP07-15
  type: PTWType;
  title: string;
  location: string;
  status: PTWWorkflowStatus;
  workLeaderId: string;
  workLeaderName: string;
  assignedWorkerIds: string[];
  assignedWorkerNames: string[];
  agtStaffId?: string;
  approverStaffId?: string;
  gasReadings: {
    lelPercent: number;
    o2Percent: number;
    h2sPpm: number;
    coPpm: number;
    testedAt: string;
    isSafeForWork: boolean;
  };
  safetyChecklist: {
    fireWatchAssigned: boolean;
    gasDetectorContinuous: boolean;
    lotoApplied: boolean;
    forcedVentilation: boolean;
    ppeVerified: boolean;
    barricadeSet: boolean;
  };
  validFrom: string;
  validTo: string;
  emergencyProtocol: string;
  createdAt: string;
  closedAt?: string;
  hazardDescription: string;
}
