// src/data/ptwCargoHandlingValidators.ts
// Pure gatekeeping functions for the Cargo Handling PTW category.
// Does not modify or call into existing validatePTWCompetency / validatePTWGasSafety
// (ptwMasterData.ts) or the DRAFT/PREPARED/APPROVED/ACTIVE/CLOSED pipeline itself —
// these are additive wrapper gates evaluated by the Cargo Handling UI only.
// DRAFT..CLOSED transition wrappers built on top of these gates live in
// ptwCargoHandlingTransitions.ts (kept separate to respect the 250-line cap).

import {
  CargoHandlingActivityType,
  CargoHandlingGasPoint,
} from '../types/lng';
import {
  CARGO_HANDLING_AGT_MANDATORY_POINTS,
  CARGO_HANDLING_SOP_BY_ACTIVITY,
  ATMOSPHERE_SAFE_LEL_MAX_PERCENT,
  ATMOSPHERE_SAFE_O2_TARGET_PERCENT,
  ATMOSPHERE_SAFE_O2_TOLERANCE_PERCENT,
  BARRICADE_RADIUS_LIFTING_MIN_M,
  BARRICADE_RADIUS_UNLOADING_MIN_M,
  CRITICAL_HIGH_RISK_WEIGHT_TON,
  DEPRESSURIZATION_T203_TAG_ID,
  DEPRESSURIZATION_TARGET_MPA_DEFAULT,
  DEPRESSURIZATION_TARGET_MPA_HOSE,
  DEPRESSURIZATION_TARGET_MPA_T203,
  GAS_RETEST_INTERVAL_HOURS,
  GROUNDING_RESISTANCE_MAX_OHM,
  SCBA_REQUIRED_BELOW_O2_PERCENT,
  UNLOADING_LEL_MAX_PERCENT,
  UNLOADING_O2_MAX_PERCENT,
  UNLOADING_O2_MIN_PERCENT,
} from './ptwCargoHandlingRules';

// --- 1. PTW classification: activity type -> required SOP codes ---
export function resolveCargoHandlingSopCodes(activityType: CargoHandlingActivityType): string[] {
  return CARGO_HANDLING_SOP_BY_ACTIVITY[activityType];
}

// --- 2. Critical High Risk auto-escalation ---
export function evaluateCriticalHighRiskEscalation(input: {
  loadedWeightTon: number;
  isActiveCryogenicFlow: boolean;
  hoseDisconnectionInProgress: boolean;
}): { isCriticalHighRisk: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (input.loadedWeightTon >= CRITICAL_HIGH_RISK_WEIGHT_TON) {
    reasons.push(`Loaded Weight ${input.loadedWeightTon}t >= ${CRITICAL_HIGH_RISK_WEIGHT_TON}t threshold`);
  }
  if (input.isActiveCryogenicFlow && input.hoseDisconnectionInProgress) {
    reasons.push('Hose/Piping disconnection requested while cryogenic flow is active');
  }

  return { isCriticalHighRisk: reasons.length > 0, reasons };
}

// --- 3. AGT gate (Unloading only, multi-point) ---
export function evaluateAgtGate(
  activityType: CargoHandlingActivityType,
  gasReadingPoints: CargoHandlingGasPoint[]
): {
  isSafe: boolean;
  blockReason: string | null;
  scbaRequiredTagIds: string[];
  isAtmosphereSafeCertifiable: boolean;
} {
  if (activityType === 'LIFTING') {
    return { isSafe: true, blockReason: null, scbaRequiredTagIds: [], isAtmosphereSafeCertifiable: false };
  }

  const readingByTag = new Map(gasReadingPoints.map((p) => [p.tagId, p]));
  const missingTags = CARGO_HANDLING_AGT_MANDATORY_POINTS.filter((tag) => !readingByTag.has(tag));
  if (missingTags.length > 0) {
    return {
      isSafe: false,
      blockReason: `Missing AGT reading for mandatory point(s): ${missingTags.join(', ')}`,
      scbaRequiredTagIds: [],
      isAtmosphereSafeCertifiable: false,
    };
  }

  const scbaRequiredTagIds = gasReadingPoints
    .filter((p) => p.o2Percent < SCBA_REQUIRED_BELOW_O2_PERCENT)
    .map((p) => p.tagId);

  for (const point of gasReadingPoints) {
    if (point.lelPercent >= UNLOADING_LEL_MAX_PERCENT) {
      return {
        isSafe: false,
        blockReason: `[STOP ACTION] LEL at ${point.tagId} is ${point.lelPercent}% (>= ${UNLOADING_LEL_MAX_PERCENT}% ceiling) — immediate work stoppage required`,
        scbaRequiredTagIds,
        isAtmosphereSafeCertifiable: false,
      };
    }
    if (point.o2Percent < UNLOADING_O2_MIN_PERCENT || point.o2Percent > UNLOADING_O2_MAX_PERCENT) {
      return {
        isSafe: false,
        blockReason: `[ENTRY BLOCKED] O2 at ${point.tagId} is ${point.o2Percent}% (safe band ${UNLOADING_O2_MIN_PERCENT}%~${UNLOADING_O2_MAX_PERCENT}%)`,
        scbaRequiredTagIds,
        isAtmosphereSafeCertifiable: false,
      };
    }
  }

  // Epsilon guards against IEEE754 rounding at the exact tolerance boundary
  // (e.g. 21.3 - 20.9 evaluates to 0.40000000000000213 in JS, not 0.4).
  const FLOAT_TOLERANCE_EPSILON = 1e-9;
  const isAtmosphereSafeCertifiable = gasReadingPoints.every(
    (p) =>
      p.lelPercent === ATMOSPHERE_SAFE_LEL_MAX_PERCENT &&
      Math.abs(p.o2Percent - ATMOSPHERE_SAFE_O2_TARGET_PERCENT) <= ATMOSPHERE_SAFE_O2_TOLERANCE_PERCENT + FLOAT_TOLERANCE_EPSILON
  );

  return { isSafe: true, blockReason: null, scbaRequiredTagIds, isAtmosphereSafeCertifiable };
}

export function isGasRetestDue(lastGasTestAt: string | undefined, nowIso: string): boolean {
  if (!lastGasTestAt) return true;
  const elapsedHours = (new Date(nowIso).getTime() - new Date(lastGasTestAt).getTime()) / (1000 * 60 * 60);
  return elapsedHours >= GAS_RETEST_INTERVAL_HOURS;
}

// --- 4. Grounding & Bonding gate (Unloading only) ---
export function evaluateGroundingGate(input: {
  groundingResistanceOhm: number;
  allHosesDisconnected: boolean;
}): { canStartPressurizedTransfer: boolean; canCheckDegrounding: boolean; blockReason: string | null } {
  const canStartPressurizedTransfer = input.groundingResistanceOhm < GROUNDING_RESISTANCE_MAX_OHM;
  const canCheckDegrounding = input.allHosesDisconnected === true;

  return {
    canStartPressurizedTransfer,
    canCheckDegrounding,
    blockReason: canStartPressurizedTransfer
      ? null
      : `Grounding resistance ${input.groundingResistanceOhm}Ω >= ${GROUNDING_RESISTANCE_MAX_OHM}Ω ceiling`,
  };
}

// --- Depressurization gate (ISO Tank / cryogenic hose disconnection) ---
// Gates the "all hoses disconnected" checkbox itself: while this fails, the
// disconnection-complete flag cannot be checked, which in turn keeps the
// degrounding checkbox (evaluateGroundingGate) disabled — enforcing sequence.
export function evaluateDepressurizationGate(input: {
  depressurizationTagId: string;
  currentPressureMPa: number;
  isFlexibleHoseOrQccDisconnection: boolean;
  icingPresent: boolean;
}): { isDisconnectionApproved: boolean; targetPressureMPa: number; blockReason: string | null } {
  if (input.isFlexibleHoseOrQccDisconnection) {
    const isApproved = input.currentPressureMPa === DEPRESSURIZATION_TARGET_MPA_HOSE && !input.icingPresent;
    return {
      isDisconnectionApproved: isApproved,
      targetPressureMPa: DEPRESSURIZATION_TARGET_MPA_HOSE,
      blockReason: isApproved
        ? null
        : `Cryogenic hose/QCC disconnection requires ${DEPRESSURIZATION_TARGET_MPA_HOSE} MPa convergence and no piping icing (current ${input.currentPressureMPa} MPa, icing: ${input.icingPresent})`,
    };
  }

  const targetPressureMPa =
    input.depressurizationTagId === DEPRESSURIZATION_T203_TAG_ID
      ? DEPRESSURIZATION_TARGET_MPA_T203
      : DEPRESSURIZATION_TARGET_MPA_DEFAULT;
  const isApproved = input.currentPressureMPa <= targetPressureMPa;

  return {
    isDisconnectionApproved: isApproved,
    targetPressureMPa,
    blockReason: isApproved
      ? null
      : `${input.depressurizationTagId} pressure ${input.currentPressureMPa} MPa exceeds ${targetPressureMPa} MPa disconnection target`,
  };
}

// --- 5. Mandatory Safety Controls (Cargo Handling specific) ---
export function validateBarricadeRadius(
  activityType: CargoHandlingActivityType,
  radiusM: number
): { isValid: boolean; error: string | null } {
  const minRadiusM = activityType === 'UNLOADING' ? BARRICADE_RADIUS_UNLOADING_MIN_M : BARRICADE_RADIUS_LIFTING_MIN_M;
  if (radiusM < minRadiusM) {
    return { isValid: false, error: `Barricade radius ${radiusM}m is below the ${minRadiusM}m minimum for ${activityType}` };
  }
  return { isValid: true, error: null };
}

export function evaluateMandatorySafetyControls(
  activityType: CargoHandlingActivityType,
  input: { fireWatchAssigned: boolean; barricadeRadiusM: number; ertStandbyReady: boolean }
): { allSatisfied: boolean; missingItems: string[] } {
  const missingItems: string[] = [];

  if (!input.fireWatchAssigned) missingItems.push('Fire Watch Assigned (DCP/CO2 extinguisher on hand)');

  const radiusCheck = validateBarricadeRadius(activityType, input.barricadeRadiusM);
  if (!radiusCheck.isValid && radiusCheck.error) missingItems.push(radiusCheck.error);

  if (!input.ertStandbyReady) missingItems.push('ERT Standby Ready (SCBA equipped)');

  return { allSatisfied: missingItems.length === 0, missingItems };
}

// --- 6. Competency gate (Lifting / Combined activities only) ---
export function evaluateCompetencyGate(
  activityType: CargoHandlingActivityType,
  input: { craneOperatorSioClassIIOrAbove: boolean; riggerCertificateHeld: boolean }
): { isEligible: boolean; blockReasons: string[] } {
  if (activityType === 'UNLOADING') {
    return { isEligible: true, blockReasons: [] };
  }

  const blockReasons: string[] = [];
  if (!input.craneOperatorSioClassIIOrAbove) blockReasons.push('Crane Operator missing SIO Class II or above certification');
  if (!input.riggerCertificateHeld) blockReasons.push('Rigger missing Rigger Certificate');

  return { isEligible: blockReasons.length === 0, blockReasons };
}
