// src/data/ptwCargoHandlingTransitions.ts
// DRAFT/PREPARED/APPROVED/ACTIVE/CLOSED transition wrappers for the Cargo
// Handling PTW category. Split out of ptwCargoHandlingValidators.ts to keep
// each file under the 250-line cap (AGENTS.md); wraps the same pure gates,
// does not modify the existing DRAFT..CLOSED pipeline itself.

import { CargoHandlingActivityType, CargoHandlingApprovalSignerRole } from '../types/lng';
import { evaluateCompetencyGate, evaluateMandatorySafetyControls } from './ptwCargoHandlingValidators';

// --- DRAFT -> PREPARED transition wrapper ---
export function canPrepareCargoHandlingPermit(input: {
  activityType: CargoHandlingActivityType;
  craneOperatorSioClassIIOrAbove: boolean;
  riggerCertificateHeld: boolean;
}): { canTransition: boolean; blockReasons: string[] } {
  const competency = evaluateCompetencyGate(input.activityType, input);
  return { canTransition: competency.isEligible, blockReasons: competency.blockReasons };
}

// --- PREPARED -> APPROVED transition gate ---
export function canApproveCargoHandlingPermit(input: {
  isCriticalHighRisk: boolean;
  siteManagerAvailable: boolean;
  delegationMemoAttached: boolean;
  esdvThreeStageIsolationConfirmed: boolean;
}): { canTransition: boolean; blockReasons: string[]; requiredApproverRole: CargoHandlingApprovalSignerRole } {
  const blockReasons: string[] = [];

  const requiredApproverRole: CargoHandlingApprovalSignerRole =
    input.isCriticalHighRisk && !input.siteManagerAvailable ? 'SR_OM_LEADER_ACTING' : 'SITE_MANAGER';

  if (requiredApproverRole === 'SR_OM_LEADER_ACTING' && !input.delegationMemoAttached) {
    blockReasons.push('Site Manager absent — Sr. O&M Leader acting approval requires delegation memo attachment');
  }

  if (input.isCriticalHighRisk && !input.esdvThreeStageIsolationConfirmed) {
    blockReasons.push('Critical High Risk requires ESDV 3-stage full isolation confirmation');
  }

  return { canTransition: blockReasons.length === 0, blockReasons, requiredApproverRole };
}

// --- APPROVED -> ACTIVE transition wrapper ---
export function canActivateCargoHandlingPermit(input: {
  activityType: CargoHandlingActivityType;
  fireWatchAssigned: boolean;
  barricadeRadiusM: number;
  ertStandbyReady: boolean;
}): { canTransition: boolean; blockReasons: string[] } {
  const safetyControls = evaluateMandatorySafetyControls(input.activityType, input);
  return { canTransition: safetyControls.allSatisfied, blockReasons: safetyControls.missingItems };
}

// --- ACTIVE -> CLOSED transition gate ---
export function canCloseCargoHandlingPermit(input: {
  workLeaderSignedOff: boolean;
  hseOfficerSignedOff: boolean;
  siteManagerSignedOff: boolean;
  allLotoLocksRemoved: boolean;
  leakTestPassed: boolean;
}): { canTransition: boolean; incompleteItems: string[] } {
  const incompleteItems: string[] = [];

  if (!input.workLeaderSignedOff) incompleteItems.push('Work Leader sign-off');
  if (!input.hseOfficerSignedOff) incompleteItems.push('HSE Officer sign-off');
  if (!input.siteManagerSignedOff) incompleteItems.push('Site Manager sign-off');
  if (!input.allLotoLocksRemoved) incompleteItems.push('All LOTO locks removed');
  if (!input.leakTestPassed) incompleteItems.push('Piping leak/tightness test passed');

  return { canTransition: incompleteItems.length === 0, incompleteItems };
}
