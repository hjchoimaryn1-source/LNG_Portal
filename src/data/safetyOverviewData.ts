// src/data/safetyOverviewData.ts
// Safety Overview (Safety & PTW module landing tab) aggregates.
// KPI ratios reuse the same pure evaluators as GasTestingLogTab / ERTReadinessTab
// so the tabs never disagree; the Plant Safety Zone Matrix and Actions Needed
// list are purpose-built mock data for this dashboard (SOP-referenced, not
// derived via fragile cross-tab location-string matching).

import { INITIAL_PTW_PERMITS } from './ptwMasterData';
import { MOCK_GAS_TEST_READINGS, computeGasTestingStats } from './gasTestingLogData';
import {
  MOCK_ERT_ASSIGNMENTS,
  MOCK_SCBA_SETS,
  MOCK_EXTINGUISHERS,
  MOCK_EMERGENCY_STATIONS,
  computeERTReadinessSummary,
} from './ertReadinessData';

export const HIGH_RISK_PTW_TYPES = ['HOT_WORK', 'CONFINED_SPACE'] as const;

export type ZoneSafetyStatus = 'SAFE' | 'CAUTION' | 'ALERT';

export interface PlantSafetyZone {
  id: string;
  name: string;
  ongoingWorkCount: number;
  status: ZoneSafetyStatus;
  note: string;
}

export const MOCK_PLANT_SAFETY_ZONES: PlantSafetyZone[] = [
  { id: 'VAPORIZATION_SKID', name: 'Vaporization Skid', ongoingWorkCount: 1, status: 'CAUTION', note: 'Hot Work active (NP07-14) — LEL 0.0% enforced' },
  { id: 'LOADING_BAY', name: 'Loading Bay T-201~204', ongoingWorkCount: 2, status: 'CAUTION', note: 'SIMOPS: Cold Work + Cargo Handling concurrent' },
  { id: 'PRSS_HEADER', name: 'PRSS Header', ongoingWorkCount: 1, status: 'SAFE', note: 'Continuous gas monitor nominal' },
  { id: 'JETTY', name: 'Jetty', ongoingWorkCount: 1, status: 'CAUTION', note: 'Radiography permit in Draft — barricade pending' },
];

export type ActionUrgency = 'RETEST_DUE' | 'EXPIRY_IMMINENT';

export interface SafetyActionItem {
  id: string;
  urgency: ActionUrgency;
  permitId: string;
  description: string;
  dueAt: string;
}

export const MOCK_SAFETY_ACTIONS: SafetyActionItem[] = [
  { id: 'ACT-01', urgency: 'RETEST_DUE', permitId: 'PTW-2026-0901-01', description: 'Vaporization Skid #1 (Hot Work) AGT 재계측 도래 (4시간 경과)', dueAt: '2026-09-01 12:00' },
  { id: 'ACT-02', urgency: 'RETEST_DUE', permitId: 'PTW-2026-0901-05', description: 'Loading Bay 02 (Cold Work) AGT 재계측 도래 (4시간 경과)', dueAt: '2026-09-01 13:00' },
  { id: 'ACT-03', urgency: 'EXPIRY_IMMINENT', permitId: 'PTW-2026-0901-03', description: 'ORU Confined Space 허가 유효기간 만료 임박 (30분 이내)', dueAt: '2026-09-01 16:30' },
  { id: 'ACT-04', urgency: 'EXPIRY_IMMINENT', permitId: 'PTW-2026-0901-02', description: 'Laydown Area 2 Hot Work 허가 유효기간 만료 임박 (30분 이내)', dueAt: '2026-09-01 17:00' },
];

export interface SafetyOverviewKpis {
  activeHighRiskCount: number;
  agtSafeRatePercent: number;
  simopsAlertCount: number;
  ertDispatchReadyRatePercent: number;
}

export function computeSafetyOverviewKpis(): SafetyOverviewKpis {
  const activeHighRiskCount = INITIAL_PTW_PERMITS.filter(
    (p) => (HIGH_RISK_PTW_TYPES as readonly string[]).includes(p.type) && p.status === 'ACTIVE'
  ).length;

  const gasStats = computeGasTestingStats(MOCK_GAS_TEST_READINGS);
  const agtSafeRatePercent = gasStats.total > 0 ? Math.round((gasStats.safeCount / gasStats.total) * 100) : 100;

  const simopsAlertCount = MOCK_PLANT_SAFETY_ZONES.filter((z) => z.ongoingWorkCount >= 2).length;

  const ertSummary = computeERTReadinessSummary(MOCK_ERT_ASSIGNMENTS, MOCK_SCBA_SETS, MOCK_EXTINGUISHERS, MOCK_EMERGENCY_STATIONS);
  const ertDispatchReadyRatePercent = Math.round((ertSummary.ertAssignedCount / MOCK_ERT_ASSIGNMENTS.length) * 100);

  return { activeHighRiskCount, agtSafeRatePercent, simopsAlertCount, ertDispatchReadyRatePercent };
}
