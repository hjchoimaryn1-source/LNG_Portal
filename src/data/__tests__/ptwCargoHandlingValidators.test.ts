// src/data/__tests__/ptwCargoHandlingValidators.test.ts
// Boundary-value tests for the 13 pure gatekeeping functions in
// ptwCargoHandlingValidators.ts. Safety thresholds are exercised at the exact
// boundary and one increment past it in the direction that must fail.

import { describe, it, expect } from 'vitest';
import type { CargoHandlingGasPoint } from '../../types/lng';
import { CARGO_HANDLING_SOP_BY_ACTIVITY } from '../ptwCargoHandlingRules';
import {
  resolveCargoHandlingSopCodes,
  evaluateCriticalHighRiskEscalation,
  evaluateAgtGate,
  isGasRetestDue,
  evaluateGroundingGate,
  evaluateDepressurizationGate,
  validateBarricadeRadius,
  evaluateMandatorySafetyControls,
  evaluateCompetencyGate,
} from '../ptwCargoHandlingValidators';
import {
  canPrepareCargoHandlingPermit,
  canApproveCargoHandlingPermit,
  canActivateCargoHandlingPermit,
  canCloseCargoHandlingPermit,
} from '../ptwCargoHandlingTransitions';

const MANDATORY_TAGS = ['T-201', 'T-202', 'T-203', 'T-204'] as const;

// All 4 mandatory AGT points at a fully "Atmosphere Safe" baseline
// (LEL 0%, O2 20.9%), with one tag optionally overridden for the case
// under test — keeps the "missing tag" short-circuit out of unrelated tests.
function buildGasPoints(overrideTagId?: string, overrides?: Partial<CargoHandlingGasPoint>): CargoHandlingGasPoint[] {
  return MANDATORY_TAGS.map((tagId) => ({
    tagId,
    lelPercent: 0,
    o2Percent: 20.9,
    testedAt: '2026-01-01T00:00:00.000Z',
    ...(tagId === overrideTagId ? overrides : {}),
  }));
}

describe('resolveCargoHandlingSopCodes', () => {
  it('returns the UNLOADING SOP set', () => {
    expect(resolveCargoHandlingSopCodes('UNLOADING')).toEqual(CARGO_HANDLING_SOP_BY_ACTIVITY.UNLOADING);
  });

  it('returns the LIFTING SOP set', () => {
    expect(resolveCargoHandlingSopCodes('LIFTING')).toEqual(CARGO_HANDLING_SOP_BY_ACTIVITY.LIFTING);
  });

  it('returns all 4 SOP codes for COMBINED', () => {
    expect(resolveCargoHandlingSopCodes('COMBINED')).toHaveLength(4);
  });
});

describe('evaluateCriticalHighRiskEscalation (weight threshold >= 25t)', () => {
  it('does not escalate at 24.99t', () => {
    const result = evaluateCriticalHighRiskEscalation({
      loadedWeightTon: 24.99,
      isActiveCryogenicFlow: false,
      hoseDisconnectionInProgress: false,
    });
    expect(result.isCriticalHighRisk).toBe(false);
  });

  it('escalates at exactly 25.0t', () => {
    const result = evaluateCriticalHighRiskEscalation({
      loadedWeightTon: 25.0,
      isActiveCryogenicFlow: false,
      hoseDisconnectionInProgress: false,
    });
    expect(result.isCriticalHighRisk).toBe(true);
  });

  it('escalates at 25.01t', () => {
    const result = evaluateCriticalHighRiskEscalation({
      loadedWeightTon: 25.01,
      isActiveCryogenicFlow: false,
      hoseDisconnectionInProgress: false,
    });
    expect(result.isCriticalHighRisk).toBe(true);
  });

  it('escalates regardless of weight when active cryogenic flow + hose disconnection coincide', () => {
    const result = evaluateCriticalHighRiskEscalation({
      loadedWeightTon: 1,
      isActiveCryogenicFlow: true,
      hoseDisconnectionInProgress: true,
    });
    expect(result.isCriticalHighRisk).toBe(true);
  });
});

describe('evaluateAgtGate — LEL gate (Stop Action >= 10%)', () => {
  it('is Safe at LEL 9.99%', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 9.99 }));
    expect(result.isSafe).toBe(true);
  });

  it('is Stop Action at exactly LEL 10.0%', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 10.0 }));
    expect(result.isSafe).toBe(false);
    expect(result.blockReason).toContain('STOP ACTION');
  });

  it('is Stop Action at LEL 10.01%', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 10.01 }));
    expect(result.isSafe).toBe(false);
  });
});

describe('evaluateAgtGate — O2 gate (safe band 19.5%~23.5% inclusive)', () => {
  it('passes at exactly O2 19.5%', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { o2Percent: 19.5 }));
    expect(result.isSafe).toBe(true);
  });

  it('is entry-blocked at O2 19.49% (also flags SCBA requirement)', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { o2Percent: 19.49 }));
    expect(result.isSafe).toBe(false);
    expect(result.blockReason).toContain('ENTRY BLOCKED');
    expect(result.scbaRequiredTagIds).toContain('T-201');
  });

  it('passes at exactly O2 23.5%', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { o2Percent: 23.5 }));
    expect(result.isSafe).toBe(true);
  });

  it('fails (range exceeded) at O2 23.51%', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { o2Percent: 23.51 }));
    expect(result.isSafe).toBe(false);
  });
});

describe('evaluateAgtGate — Atmosphere Safe final certification (LEL === 0 AND O2 20.5%~21.3%)', () => {
  it('is certifiable at O2 exactly 20.5% with LEL 0', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 0, o2Percent: 20.5 }));
    expect(result.isAtmosphereSafeCertifiable).toBe(true);
  });

  it('is not certifiable at O2 20.49% with LEL 0', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 0, o2Percent: 20.49 }));
    expect(result.isAtmosphereSafeCertifiable).toBe(false);
  });

  it('is certifiable at O2 exactly 21.3% with LEL 0', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 0, o2Percent: 21.3 }));
    expect(result.isAtmosphereSafeCertifiable).toBe(true);
  });

  it('is not certifiable at O2 21.31% with LEL 0', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 0, o2Percent: 21.31 }));
    expect(result.isAtmosphereSafeCertifiable).toBe(false);
  });

  it('is not certifiable when LEL is not exactly 0, even with O2 at target 20.9%', () => {
    const result = evaluateAgtGate('UNLOADING', buildGasPoints('T-201', { lelPercent: 0.01, o2Percent: 20.9 }));
    expect(result.isAtmosphereSafeCertifiable).toBe(false);
  });
});

describe('isGasRetestDue (4-hour cycle)', () => {
  it('is due at exactly 240 minutes elapsed', () => {
    expect(isGasRetestDue('2026-01-01T00:00:00.000Z', '2026-01-01T04:00:00.000Z')).toBe(true);
  });

  it('is not due at 239 minutes elapsed', () => {
    expect(isGasRetestDue('2026-01-01T00:00:00.000Z', '2026-01-01T03:59:00.000Z')).toBe(false);
  });

  it('is due at 241 minutes elapsed', () => {
    expect(isGasRetestDue('2026-01-01T00:00:00.000Z', '2026-01-01T04:01:00.000Z')).toBe(true);
  });
});

describe('evaluateGroundingGate (< 5 Ohm to pass)', () => {
  it('passes at 4.99 Ohm', () => {
    const result = evaluateGroundingGate({ groundingResistanceOhm: 4.99, allHosesDisconnected: false });
    expect(result.canStartPressurizedTransfer).toBe(true);
  });

  it('fails at exactly 5.0 Ohm', () => {
    const result = evaluateGroundingGate({ groundingResistanceOhm: 5.0, allHosesDisconnected: false });
    expect(result.canStartPressurizedTransfer).toBe(false);
  });

  it('fails at 5.01 Ohm', () => {
    const result = evaluateGroundingGate({ groundingResistanceOhm: 5.01, allHosesDisconnected: false });
    expect(result.canStartPressurizedTransfer).toBe(false);
  });
});

describe('evaluateDepressurizationGate — general ISO Tank separation (target <= 0.4 MPa)', () => {
  it('approves at exactly 0.4 MPa', () => {
    const result = evaluateDepressurizationGate({
      depressurizationTagId: 'ISO-TANK-GENERAL',
      currentPressureMPa: 0.4,
      isFlexibleHoseOrQccDisconnection: false,
      icingPresent: false,
    });
    expect(result.isDisconnectionApproved).toBe(true);
    expect(result.targetPressureMPa).toBe(0.4);
  });

  it('rejects at 0.41 MPa', () => {
    const result = evaluateDepressurizationGate({
      depressurizationTagId: 'ISO-TANK-GENERAL',
      currentPressureMPa: 0.41,
      isFlexibleHoseOrQccDisconnection: false,
      icingPresent: false,
    });
    expect(result.isDisconnectionApproved).toBe(false);
  });
});

describe('evaluateDepressurizationGate — T-203 dedicated target (<= 0.1 MPa)', () => {
  it('approves at exactly 0.1 MPa', () => {
    const result = evaluateDepressurizationGate({
      depressurizationTagId: 'T-203',
      currentPressureMPa: 0.1,
      isFlexibleHoseOrQccDisconnection: false,
      icingPresent: false,
    });
    expect(result.isDisconnectionApproved).toBe(true);
    expect(result.targetPressureMPa).toBe(0.1);
  });

  it('rejects at 0.11 MPa', () => {
    const result = evaluateDepressurizationGate({
      depressurizationTagId: 'T-203',
      currentPressureMPa: 0.11,
      isFlexibleHoseOrQccDisconnection: false,
      icingPresent: false,
    });
    expect(result.isDisconnectionApproved).toBe(false);
  });
});

describe('evaluateDepressurizationGate — cryogenic hose/QCC disconnection (0.0 MPa convergence AND no icing)', () => {
  it('approves at 0.0 MPa with no icing', () => {
    const result = evaluateDepressurizationGate({
      depressurizationTagId: 'HOSE-1',
      currentPressureMPa: 0.0,
      isFlexibleHoseOrQccDisconnection: true,
      icingPresent: false,
    });
    expect(result.isDisconnectionApproved).toBe(true);
  });

  it('rejects at 0.01 MPa', () => {
    const result = evaluateDepressurizationGate({
      depressurizationTagId: 'HOSE-1',
      currentPressureMPa: 0.01,
      isFlexibleHoseOrQccDisconnection: true,
      icingPresent: false,
    });
    expect(result.isDisconnectionApproved).toBe(false);
  });

  it('rejects at 0.0 MPa when icing is present', () => {
    const result = evaluateDepressurizationGate({
      depressurizationTagId: 'HOSE-1',
      currentPressureMPa: 0.0,
      isFlexibleHoseOrQccDisconnection: true,
      icingPresent: true,
    });
    expect(result.isDisconnectionApproved).toBe(false);
  });
});

describe('validateBarricadeRadius — UNLOADING (min 25m)', () => {
  it('is valid at exactly 25m', () => {
    expect(validateBarricadeRadius('UNLOADING', 25).isValid).toBe(true);
  });

  it('is invalid at 24.99m', () => {
    expect(validateBarricadeRadius('UNLOADING', 24.99).isValid).toBe(false);
  });
});

describe('validateBarricadeRadius — LIFTING (min 50m)', () => {
  it('is valid at exactly 50m', () => {
    expect(validateBarricadeRadius('LIFTING', 50).isValid).toBe(true);
  });

  it('is invalid at 49.99m', () => {
    expect(validateBarricadeRadius('LIFTING', 49.99).isValid).toBe(false);
  });

  it('is valid at exactly 100m', () => {
    expect(validateBarricadeRadius('LIFTING', 100).isValid).toBe(true);
  });

  // NOTE: the current implementation only compares against
  // BARRICADE_RADIUS_LIFTING_MIN_M — BARRICADE_RADIUS_LIFTING_MAX_M (100m) is
  // defined as a constant but never checked in validateBarricadeRadius, so
  // radii above 100m are NOT rejected today. Per task instructions, the
  // "upper bound" boundary case (100.01m -> invalid) is skipped rather than
  // asserting behavior the implementation doesn't have. Reported separately
  // as a possible gap, not fixed here.
  it('is (currently) also valid above 100m, since no upper bound is enforced', () => {
    expect(validateBarricadeRadius('LIFTING', 100.01).isValid).toBe(true);
  });
});

describe('evaluateMandatorySafetyControls', () => {
  it('is satisfied when all required items are true', () => {
    const result = evaluateMandatorySafetyControls('UNLOADING', {
      fireWatchAssigned: true,
      barricadeRadiusM: 25,
      ertStandbyReady: true,
    });
    expect(result.allSatisfied).toBe(true);
    expect(result.missingItems).toEqual([]);
  });

  it('is not satisfied when a single required item is false', () => {
    const result = evaluateMandatorySafetyControls('UNLOADING', {
      fireWatchAssigned: false,
      barricadeRadiusM: 25,
      ertStandbyReady: true,
    });
    expect(result.allSatisfied).toBe(false);
    expect(result.missingItems.length).toBeGreaterThan(0);
  });
});

describe('evaluateCompetencyGate (LIFTING/COMBINED require crane operator + rigger certs)', () => {
  it('is eligible when both certifications are held', () => {
    const result = evaluateCompetencyGate('LIFTING', {
      craneOperatorSioClassIIOrAbove: true,
      riggerCertificateHeld: true,
    });
    expect(result.isEligible).toBe(true);
    expect(result.blockReasons).toEqual([]);
  });

  it('is not eligible when a single certification is missing', () => {
    const result = evaluateCompetencyGate('LIFTING', {
      craneOperatorSioClassIIOrAbove: false,
      riggerCertificateHeld: true,
    });
    expect(result.isEligible).toBe(false);
    expect(result.blockReasons.length).toBeGreaterThan(0);
  });
});

describe('canPrepareCargoHandlingPermit (DRAFT -> PREPARED)', () => {
  it('can transition when competency gate is fully satisfied', () => {
    const result = canPrepareCargoHandlingPermit({
      activityType: 'LIFTING',
      craneOperatorSioClassIIOrAbove: true,
      riggerCertificateHeld: true,
    });
    expect(result.canTransition).toBe(true);
  });

  it('cannot transition when a competency requirement is false', () => {
    const result = canPrepareCargoHandlingPermit({
      activityType: 'LIFTING',
      craneOperatorSioClassIIOrAbove: true,
      riggerCertificateHeld: false,
    });
    expect(result.canTransition).toBe(false);
  });
});

describe('canApproveCargoHandlingPermit (PREPARED -> APPROVED)', () => {
  it('can transition on the fully-satisfied happy path', () => {
    const result = canApproveCargoHandlingPermit({
      isCriticalHighRisk: false,
      siteManagerAvailable: true,
      delegationMemoAttached: false,
      esdvThreeStageIsolationConfirmed: false,
    });
    expect(result.canTransition).toBe(true);
  });

  it('blocks Critical High Risk + missing delegation memo (Site Manager absent -> acting approver)', () => {
    const result = canApproveCargoHandlingPermit({
      isCriticalHighRisk: true,
      siteManagerAvailable: false,
      delegationMemoAttached: false,
      esdvThreeStageIsolationConfirmed: true,
    });
    expect(result.canTransition).toBe(false);
    expect(result.requiredApproverRole).toBe('SR_OM_LEADER_ACTING');
    expect(result.blockReasons.some((r) => r.includes('delegation memo'))).toBe(true);
  });

  it('blocks Critical High Risk + unconfirmed ESDV 3-stage isolation', () => {
    const result = canApproveCargoHandlingPermit({
      isCriticalHighRisk: true,
      siteManagerAvailable: true,
      delegationMemoAttached: true,
      esdvThreeStageIsolationConfirmed: false,
    });
    expect(result.canTransition).toBe(false);
    expect(result.blockReasons.some((r) => r.includes('ESDV'))).toBe(true);
  });
});

describe('canActivateCargoHandlingPermit (APPROVED -> ACTIVE)', () => {
  it('can transition when all safety controls are satisfied', () => {
    const result = canActivateCargoHandlingPermit({
      activityType: 'UNLOADING',
      fireWatchAssigned: true,
      barricadeRadiusM: 25,
      ertStandbyReady: true,
    });
    expect(result.canTransition).toBe(true);
  });

  it('cannot transition when a safety control is false', () => {
    const result = canActivateCargoHandlingPermit({
      activityType: 'UNLOADING',
      fireWatchAssigned: true,
      barricadeRadiusM: 25,
      ertStandbyReady: false,
    });
    expect(result.canTransition).toBe(false);
  });
});

describe('canCloseCargoHandlingPermit (ACTIVE -> CLOSED)', () => {
  const allSatisfied = {
    workLeaderSignedOff: true,
    hseOfficerSignedOff: true,
    siteManagerSignedOff: true,
    allLotoLocksRemoved: true,
    leakTestPassed: true,
  };

  it('can transition when all closure items are satisfied', () => {
    const result = canCloseCargoHandlingPermit(allSatisfied);
    expect(result.canTransition).toBe(true);
    expect(result.incompleteItems).toEqual([]);
  });

  it('cannot transition when only workLeaderSignedOff is false', () => {
    const result = canCloseCargoHandlingPermit({ ...allSatisfied, workLeaderSignedOff: false });
    expect(result.canTransition).toBe(false);
  });

  it('cannot transition when only hseOfficerSignedOff is false', () => {
    const result = canCloseCargoHandlingPermit({ ...allSatisfied, hseOfficerSignedOff: false });
    expect(result.canTransition).toBe(false);
  });

  it('cannot transition when only siteManagerSignedOff is false', () => {
    const result = canCloseCargoHandlingPermit({ ...allSatisfied, siteManagerSignedOff: false });
    expect(result.canTransition).toBe(false);
  });

  it('cannot transition when allLotoLocksRemoved is false', () => {
    const result = canCloseCargoHandlingPermit({ ...allSatisfied, allLotoLocksRemoved: false });
    expect(result.canTransition).toBe(false);
  });

  it('cannot transition when leakTestPassed is false', () => {
    const result = canCloseCargoHandlingPermit({ ...allSatisfied, leakTestPassed: false });
    expect(result.canTransition).toBe(false);
  });
});
