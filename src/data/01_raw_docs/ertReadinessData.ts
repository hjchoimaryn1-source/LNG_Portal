// src/data/ertReadinessData.ts
// ERT Readiness mock data & evaluation — SOP NP08-33 (ERT Manning) / NP08-37 (Firefighting & Emergency Equipment)

export type ERTPosition = 'INCIDENT_COMMANDER' | 'FIRE_TEAM_LEADER' | 'FIRE_WATCH' | 'FIRST_AIDER';

export const ERT_POSITION_LABEL: Record<ERTPosition, string> = {
  INCIDENT_COMMANDER: 'Incident Commander',
  FIRE_TEAM_LEADER: 'Fire Team Leader',
  FIRE_WATCH: 'Fire Watch',
  FIRST_AIDER: 'First Aider',
};

export interface ERTAssignment {
  position: ERTPosition;
  name: string;
  jobTitle: string;
  radioChannel: string;
  isOnSite: boolean;
}

export const TOTAL_POB = 12;

export const MOCK_ERT_ASSIGNMENTS: ERTAssignment[] = [
  { position: 'INCIDENT_COMMANDER', name: 'Edi Hermawan', jobTitle: 'Site Manager', radioChannel: 'CH-01 (CMD)', isOnSite: true },
  { position: 'FIRE_TEAM_LEADER', name: 'Arsyan AN', jobTitle: 'HSE Officer', radioChannel: 'CH-04 (HSSE)', isOnSite: true },
  { position: 'FIRE_WATCH', name: 'Yusuf', jobTitle: 'Field Operator (Work Area Dedicated)', radioChannel: 'CH-02 (OPS)', isOnSite: true },
  { position: 'FIRST_AIDER', name: 'Erwin Supriatna', jobTitle: 'Field Operator', radioChannel: 'CH-02 (OPS)', isOnSite: true },
];

export type EquipmentStatus = 'GREEN' | 'DUE' | 'RED';

export interface ScbaSet {
  id: string;
  pressureBar: number;
}

export const MOCK_SCBA_SETS: ScbaSet[] = [
  { id: 'SCBA-01', pressureBar: 210 },
  { id: 'SCBA-02', pressureBar: 205 },
  { id: 'SCBA-03', pressureBar: 198 },
  { id: 'SCBA-04', pressureBar: 215 },
];

export const SCBA_MIN_PRESSURE_BAR = 200;

export interface ExtinguisherUnit {
  id: string;
  tagId: string; // T-201..204 (Unloading Skid) or PRSS-HDR
  type: 'DCP' | 'CO2';
  status: EquipmentStatus;
}

export const MOCK_EXTINGUISHERS: ExtinguisherUnit[] = [
  { id: 'EXT-01', tagId: 'T-201', type: 'DCP', status: 'GREEN' },
  { id: 'EXT-02', tagId: 'T-201', type: 'CO2', status: 'GREEN' },
  { id: 'EXT-03', tagId: 'T-202', type: 'DCP', status: 'GREEN' },
  { id: 'EXT-04', tagId: 'T-202', type: 'CO2', status: 'GREEN' },
  { id: 'EXT-05', tagId: 'T-203', type: 'DCP', status: 'DUE' },
  { id: 'EXT-06', tagId: 'T-203', type: 'CO2', status: 'GREEN' },
  { id: 'EXT-07', tagId: 'T-204', type: 'DCP', status: 'GREEN' },
  { id: 'EXT-08', tagId: 'T-204', type: 'CO2', status: 'GREEN' },
  { id: 'EXT-09', tagId: 'PRSS-HDR', type: 'DCP', status: 'GREEN' },
  { id: 'EXT-10', tagId: 'PRSS-HDR', type: 'CO2', status: 'GREEN' },
];

export const MIN_EXTINGUISHER_COUNT = 8;

export interface EmergencyStation {
  id: string;
  name: string;
  location: string;
  isOperational: boolean;
}

export const MOCK_EMERGENCY_STATIONS: EmergencyStation[] = [
  { id: 'EWS-01', name: 'Emergency Eye Wash & Safety Shower', location: 'Unloading Skid Platform', isOperational: true },
  { id: 'EWS-02', name: 'Emergency Eye Wash & Safety Shower', location: 'PRSS Header Deck', isOperational: true },
];

export type ERTReadinessStatus = 'ALL_READY' | 'ATTENTION' | 'STANDBY';

export interface ERTReadinessSummary {
  totalPOB: number;
  ertAssignedCount: number;
  ertPositionsFilled: boolean;
  scbaReadyCount: number;
  scbaTotalCount: number;
  extinguisherGreenCount: number;
  extinguisherTotalCount: number;
  stationsOperationalCount: number;
  stationsTotalCount: number;
  readinessStatus: ERTReadinessStatus;
}

export function computeERTReadinessSummary(
  assignments: ERTAssignment[],
  scbaSets: ScbaSet[],
  extinguishers: ExtinguisherUnit[],
  stations: EmergencyStation[]
): ERTReadinessSummary {
  const ertAssignedCount = assignments.filter((a) => a.isOnSite).length;
  const ertPositionsFilled = ertAssignedCount === assignments.length;

  const scbaReadyCount = scbaSets.filter((s) => s.pressureBar >= SCBA_MIN_PRESSURE_BAR).length;
  const extinguisherGreenCount = extinguishers.filter((e) => e.status === 'GREEN').length;
  const stationsOperationalCount = stations.filter((s) => s.isOperational).length;

  const equipmentAllReady =
    scbaReadyCount === scbaSets.length &&
    extinguisherGreenCount === extinguishers.length &&
    extinguisherGreenCount >= MIN_EXTINGUISHER_COUNT &&
    stationsOperationalCount === stations.length;

  const readinessStatus: ERTReadinessStatus = !ertPositionsFilled
    ? 'STANDBY'
    : equipmentAllReady
    ? 'ALL_READY'
    : 'ATTENTION';

  return {
    totalPOB: TOTAL_POB,
    ertAssignedCount,
    ertPositionsFilled,
    scbaReadyCount,
    scbaTotalCount: scbaSets.length,
    extinguisherGreenCount,
    extinguisherTotalCount: extinguishers.length,
    stationsOperationalCount,
    stationsTotalCount: stations.length,
    readinessStatus,
  };
}
