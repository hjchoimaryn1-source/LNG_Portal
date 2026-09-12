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
  | 'SECTOR_LAUNCHER'
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
  | 'MRO_PARTS_INVENTORY'
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
  | 'SAFETY_OVERVIEW'
  | 'PTW_PERMITS'
  | 'SAFETY_GAS_TESTING'
  | 'SAFETY_ERT_READINESS'
  | 'SAFETY_SOP_REFERENCE'
  | 'CALIBRATION_COMPLIANCE'
  // CMMS-wide Overview Dashboard (cross-module KPI landing)
  | 'CMMS_OVERVIEW_DASHBOARD'
  // Jakarta HQ Overview Dashboard (Sector 7 — CMMS_Architecture.md §3.1.1)
  | 'HQ_OVERVIEW_DASHBOARD';

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

export type ShiftCode = 'D' | 'N' | 'Off' | 'OFF' | 'On' | 'AL' | 'O' | 'R';

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
  onSiteDate: string;
  nextRotationDueDate: string;
  relieverName: string;
  contactNo: string;
  radioChannel: string;
  rosterDays: ShiftCode[];
  isLocalResident?: boolean;
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
  | 'RADIOGRAPHY'
  | 'CARGO_HANDLING';

export type PTWWorkflowStatus =
  | 'DRAFT'
  | 'PREPARED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'CLOSED';

// Single-point gas re-test history entry (Hot Work / Confined Space / Cold
// Work / Electrical / Excavation / Radiography). Cargo Handling's multi-point
// AGT flow (CargoHandlingGasPoint / isGasRetestDue()) is a separate mechanism
// and does not use this type.
export interface GasTestLogEntry {
  id: string;
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  testedAt: string;
  testerName: string;
  testerId?: string;
  note?: string;
  isSafeForWork: boolean; // computed by validatePTWGasSafety() inside usePTWPermits — never caller-supplied
}

export type GasTestLogEntryInput = Omit<GasTestLogEntry, 'isSafeForWork'>;

interface PTWPermitBase {
  id: string;
  formNumber: string; // NP07-10 to NP07-15
  title: string;
  location: string;
  // PPE Matrix hazard-zone classification (NIAS_NP-09 App 01), distinct from
  // `location` (specific plant tag/site string). See src/data/ptwWorkAreas.ts.
  workArea?: string;
  // SOP-designated responsible person for the permit (distinct from
  // workLeaderName, which is the eligibility-gated field-crew lead). Optional;
  // renders as N/A until backfilled on existing mock data.
  responsiblePerson?: string;
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
    // Mercury vapor (Hg), required as an input field per SSHQE §4.3 (PART D
    // activation gate lists LEL/O2/H2S/CO/HG together) but SSHQE publishes no
    // numeric ceiling for it ("가스상 노출 수치 제한 요건 준수" only) — captured
    // for audit/print record, NOT wired into validatePTWGasSafety() until a
    // numeric threshold is confirmed. Optional; renders as N/A until backfilled.
    hgPpm?: number;
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
    // Additional Safety Control, independent of PTWType category. Not a
    // permit category — see NIAS_NP-09 App 01 PPE Matrix "Non-Routine / High
    // Risk Tasks" fall-protection requirement.
    workingAtHeight?: boolean;
  };
  validFrom: string;
  validTo: string;
  emergencyProtocol: string;
  createdAt: string;
  closedAt?: string;
  hazardDescription: string;
  // Ticket card TAG display. Not present on existing mock data (title/location
  // strings embed tags inconsistently, e.g. "PRSS-01", "MCC-01" — not safely
  // regex-extractable). Optional; renders as N/A until backfilled.
  equipmentTag?: string;
  // Single-point re-test history (Hot Work / Confined Space / etc). Not used
  // by CARGO_HANDLING, which keeps its own gasReadingPoints history.
  gasTestHistory?: GasTestLogEntry[];
  // Electronic signature log (SSHQE §4.2 PART C/D/E). Append-only, same
  // convention as gasTestHistory — never mutated/removed, only pushed to by
  // usePTWPermits.addSignature(). A role may appear at most once per permit
  // (evaluateSignatureGate/hasSignedRole treat the first match as authoritative).
  signatures?: PTWSignatureEntry[];
  // PRAC Stage-1 ALARP outcome (CMMS_Architecture.md §2.2). false = at least
  // one identified hazard's residual risk was NOT ALARP. Optional; undefined
  // is treated as "no non-ALARP risk recorded" (permissive) until backfilled.
  isAlarpYes?: boolean;
  // Stage-2/3 mandatory JSA document reference, required by §2.2 before
  // Stage-3 approval when isAlarpYes === false. null/absent = not attached yet.
  jsaAttachmentRef?: string | null;
}

// Discriminated on `type`: only CARGO_HANDLING carries `cargoHandling`, and it
// is required there (not optional) so a `type === 'CARGO_HANDLING'` narrow
// guarantees the NP08 detail block exists — no `cargoHandling!`/`?.` needed in
// gate code that has already checked `type`. Unnarrowed access (e.g. iterating
// PTWPermit[]) still resolves to `CargoHandlingPermitDetails | undefined` via
// the union, so existing `permit.cargoHandling?.x` call sites are unaffected.
export interface PTWStandardPermit extends PTWPermitBase {
  type: Exclude<PTWType, 'CARGO_HANDLING'>;
  cargoHandling?: never;
}

export interface PTWCargoHandlingPermit extends PTWPermitBase {
  type: 'CARGO_HANDLING';
  cargoHandling: CargoHandlingPermitDetails;
}

export type PTWPermit = PTWStandardPermit | PTWCargoHandlingPermit;

// --- Electronic Signature / Approval Workflow (SSHQE §4.2) ---
// 5-stage lifecycle -> 9 named signature slots across PART C (Approval),
// PART D (Issue & Activation) and PART E (Return & Close-out). PART A/B
// (Description/Preparation) require no signature, only documentation —
// see PTW_TRANSITION_REQUIRED_ROLES in data/ptwSignatureRoles.ts.
export type PTWSignatureRole =
  | 'AUTHORIZER_APPROVE' // PART C — Permit Authorizer
  | 'RESPONSIBLE_PERSON_APPROVE' // PART C — Responsible Person
  | 'ISSUER_ACTIVATE' // PART D — Permit Issuer
  | 'WORK_LEADER_ACCEPT' // PART D — Work Leader
  | 'SITE_CHECKER_ACTIVATE' // PART D — Site Checker / FSO
  | 'WORK_LEADER_RETURN' // PART E — Work Leader
  | 'SITE_CHECKER_VERIFY' // PART E — Site Checker / FSO
  | 'ISSUER_ACCEPT_RETURN' // PART E — Permit Issuer
  | 'AUTHORIZER_CLOSE'; // PART E — Permit Authorizer

export interface PTWSignatureEntry {
  role: PTWSignatureRole;
  staffId: string;
  staffName: string;
  signedAt: string;
}

// --- Cargo Handling (CARGO_HANDLING) extension types ---
// ISO Tank Unloading / Crane-Reachstacker Lifting Transfer. Kept as a separate
// optional block on PTWPermit rather than reusing gasReadings/safetyChecklist,
// since Cargo Handling needs multi-point AGT (T-201..T-204) and gates the
// other PTW categories don't have (grounding, depressurization, crane/rigger).

export type CargoHandlingActivityType = 'UNLOADING' | 'LIFTING' | 'COMBINED';

export type CargoHandlingApprovalSignerRole = 'SITE_MANAGER' | 'SR_OM_LEADER_ACTING';

export interface CargoHandlingGasPoint {
  tagId: string; // T-201..T-204 (Unloading Skid)
  lelPercent: number;
  o2Percent: number;
  testedAt: string; // ISO timestamp
}

export interface CargoHandlingPermitDetails {
  activityType: CargoHandlingActivityType;

  // Critical High Risk escalation inputs
  loadedWeightTon: number;
  isActiveCryogenicFlow: boolean;
  hoseDisconnectionInProgress: boolean;

  // PREPARED -> APPROVED gate
  siteManagerAvailable: boolean;
  delegationMemoAttached: boolean;
  esdvThreeStageIsolationConfirmed: boolean;
  approverRole?: CargoHandlingApprovalSignerRole;

  // AGT gate (Unloading only, multi-point)
  gasReadingPoints: CargoHandlingGasPoint[];
  lastGasTestAt?: string;
  atmosphereSafeCertifiedByHseOfficer: boolean;

  // Grounding & Bonding gate (Unloading only)
  groundingResistanceOhm: number;
  allHosesDisconnected: boolean;

  // Depressurization gate (ISO Tank / cryogenic hose disconnection)
  depressurizationTagId: string;
  currentPressureMPa: number;
  isFlexibleHoseOrQccDisconnection: boolean;
  icingPresent: boolean;

  // Mandatory Safety Controls (Cargo Handling specific)
  fireWatchAssigned: boolean;
  barricadeRadiusM: number;
  ertStandbyReady: boolean;

  // Competency gate (Lifting / Combined only)
  craneOperatorSioClassIIOrAbove: boolean;
  riggerCertificateHeld: boolean;

  // ACTIVE -> CLOSED gate
  workLeaderSignedOff: boolean;
  hseOfficerSignedOff: boolean;
  siteManagerSignedOff: boolean;
  allLotoLocksRemoved: boolean;
  leakTestPassed: boolean;
}

// --- Work Order (CMMS Work Order & Maintenance) types ---

export type WorkOrderCategory = 'PMS' | 'OVERHAUL' | 'MRO';

export type WorkOrderStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PARTS_PENDING' | 'COMPLETED';

export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface WOItem {
  wo: string; // e.g. "WO-2026-0841"
  cat: WorkOrderCategory;
  tag: string; // target equipment tag
  type: string; // work type label (e.g. "Preventive (PMS)")
  desc: string;
  priority: WorkOrderPriority;
  due: string;
  tech: string;
  status: WorkOrderStatus;
  // Legacy string ref to a PTWPermit.id, same convention as
  // ptwFormAdapter.ts's permitRefNo — not a DB foreign key (no `permits`
  // table yet, see src/db/schema/cmms_schema.sql). Undefined when the work
  // does not require an e-PTW.
  permitRefNo?: string;
}
