// src/cmms-mro-bridge/safetyGate/evaluateSafetyGateRules.ts
//
// PURPOSE
//   CMMS_Architecture.md §4.2 "CM 결함 보고 및 e-PTW 필수 연동 분기 알고리즘"
//   verbatim port. Decides only whether a work order requires an e-PTW —
//   it does NOT touch PTW status transitions, approval flow, or issuance
//   (those remain entirely owned by the hard-boundary files: ptwStatusMapper.ts,
//   gasSafetyAdapter.ts, ptwCargoHandlingRules.ts/Transitions.ts/Validators.ts,
//   permit_gas_tests logic — none of which are imported, read for editing, or
//   modified by this file).
//
// SCOPE
//   Pure function only — no DB access, no React. Per
//   docs/phase10-stage0-investigation-report.md Task 4, this function did not
//   exist anywhere in the codebase before this stage (it was spec-only). This
//   is a new, isolated implementation; it is invoked from the work-orders
//   creation API route (see route.ts hook) and nowhere else.

export interface SafetyGateWorkOrderInput {
  jobCategories: string[];
  workAreaZone: string;
  equipmentCriticality: string;
  priority: string;
}

export interface SafetyGateResult {
  isPtwRequired: boolean;
  reason: string;
}

const HIGH_RISK_JOB_TYPES = ['HOT_WORK', 'CONFINED_SPACE', 'HIGH_VOLTAGE', 'CRYOGENIC_LINE_OPENING'];
const HIGH_RISK_ZONES = ['NP09-ZONE-01-ATEX', 'NP09-ZONE-02-FLAMMABLE'];

/** CMMS_Architecture.md §4.2 그대로. 입력 → {isPtwRequired, reason} 판정 이외의 부수효과 없음. */
export function evaluateSafetyGateRules(woInput: SafetyGateWorkOrderInput): SafetyGateResult {
  if (woInput.jobCategories.some((cat) => HIGH_RISK_JOB_TYPES.includes(cat))) {
    return { isPtwRequired: true, reason: 'Mandatory e-PTW: High-risk job type detected.' };
  }
  if (HIGH_RISK_ZONES.includes(woInput.workAreaZone)) {
    return { isPtwRequired: true, reason: 'Mandatory e-PTW: Hazardous ATEX/Flammable area entry.' };
  }
  if (woInput.equipmentCriticality === 'CRITICAL' && (woInput.priority === 'EMERGENCY' || woInput.priority === 'HIGH')) {
    return { isPtwRequired: true, reason: 'Mandatory e-PTW: High priority work on CRITICAL asset.' };
  }
  return { isPtwRequired: false, reason: 'Standard maintenance work. e-PTW not mandatory.' };
}

/** jobCategories/workAreaZone/equipmentCriticality/priority가 아직 없는 호출부용 안전 기본값 — 항상 false로 판정된다. */
export const EMPTY_SAFETY_GATE_INPUT: SafetyGateWorkOrderInput = {
  jobCategories: [],
  workAreaZone: '',
  equipmentCriticality: '',
  priority: '',
};
