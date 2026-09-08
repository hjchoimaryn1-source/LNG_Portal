// src/components/manpower/cargoHandling/hooks/useCargoHandlingPermitForm.ts
import { useMemo, useState, useCallback } from 'react';
import type { CargoHandlingActivityType, CargoHandlingGasPoint, CargoHandlingPermitDetails } from '../../../../types/lng';
import { CARGO_HANDLING_AGT_MANDATORY_POINTS } from '../../../../data/ptwCargoHandlingRules';
import {
  resolveCargoHandlingSopCodes,
  evaluateCriticalHighRiskEscalation,
  evaluateAgtGate,
  isGasRetestDue,
  evaluateGroundingGate,
  evaluateDepressurizationGate,
  evaluateMandatorySafetyControls,
  evaluateCompetencyGate,
} from '../../../../data/ptwCargoHandlingValidators';
import {
  canPrepareCargoHandlingPermit,
  canApproveCargoHandlingPermit,
  canActivateCargoHandlingPermit,
  canCloseCargoHandlingPermit,
} from '../../../../data/ptwCargoHandlingTransitions';

const createDefaultDetails = (): CargoHandlingPermitDetails => ({
  activityType: 'UNLOADING',
  loadedWeightTon: 0,
  isActiveCryogenicFlow: false,
  hoseDisconnectionInProgress: false,
  siteManagerAvailable: true,
  delegationMemoAttached: false,
  esdvThreeStageIsolationConfirmed: false,
  gasReadingPoints: CARGO_HANDLING_AGT_MANDATORY_POINTS.map<CargoHandlingGasPoint>((tagId) => ({
    tagId,
    lelPercent: 0,
    o2Percent: 20.9,
    testedAt: '',
  })),
  lastGasTestAt: undefined,
  atmosphereSafeCertifiedByHseOfficer: false,
  groundingResistanceOhm: 0,
  allHosesDisconnected: false,
  depressurizationTagId: 'T-203',
  currentPressureMPa: 0,
  isFlexibleHoseOrQccDisconnection: false,
  icingPresent: false,
  fireWatchAssigned: false,
  barricadeRadiusM: 0,
  ertStandbyReady: false,
  craneOperatorSioClassIIOrAbove: false,
  riggerCertificateHeld: false,
  workLeaderSignedOff: false,
  hseOfficerSignedOff: false,
  siteManagerSignedOff: false,
  allLotoLocksRemoved: false,
  leakTestPassed: false,
});

export interface CargoHandlingIdentity {
  title: string;
  location: string;
  workLeaderName: string;
}

export function useCargoHandlingPermitForm(initialDetails?: Partial<CargoHandlingPermitDetails>) {
  const [details, setDetails] = useState<CargoHandlingPermitDetails>({
    ...createDefaultDetails(),
    ...initialDetails,
  });
  const [identity, setIdentity] = useState<CargoHandlingIdentity>({
    title: '',
    location: '',
    workLeaderName: '',
  });

  const update = useCallback(<K extends keyof CargoHandlingPermitDetails>(key: K, value: CargoHandlingPermitDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateIdentity = useCallback(<K extends keyof CargoHandlingIdentity>(key: K, value: CargoHandlingIdentity[K]) => {
    setIdentity((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateGasPoint = useCallback((tagId: string, patch: Partial<CargoHandlingGasPoint>) => {
    setDetails((prev) => {
      const gasReadingPoints = prev.gasReadingPoints.map((p) => (p.tagId === tagId ? { ...p, ...patch } : p));
      const latestTestedAt = gasReadingPoints
        .map((p) => p.testedAt)
        .filter(Boolean)
        .sort()
        .pop();
      return { ...prev, gasReadingPoints, lastGasTestAt: latestTestedAt || prev.lastGasTestAt };
    });
  }, []);

  const setActivityType = useCallback((activityType: CargoHandlingActivityType) => update('activityType', activityType), [update]);

  const gates = useMemo(() => {
    const requiredSopCodes = resolveCargoHandlingSopCodes(details.activityType);
    const criticalRisk = evaluateCriticalHighRiskEscalation(details);
    const agt = evaluateAgtGate(details.activityType, details.gasReadingPoints);
    const isRetestDue = isGasRetestDue(details.lastGasTestAt, new Date().toISOString());
    const depressurization = evaluateDepressurizationGate(details);
    const grounding = evaluateGroundingGate(details);
    const safetyControls = evaluateMandatorySafetyControls(details.activityType, details);
    const competency = evaluateCompetencyGate(details.activityType, details);
    const prepare = canPrepareCargoHandlingPermit(details);
    const approve = canApproveCargoHandlingPermit({ isCriticalHighRisk: criticalRisk.isCriticalHighRisk, ...details });
    const activate = canActivateCargoHandlingPermit(details);
    const close = canCloseCargoHandlingPermit(details);

    return { requiredSopCodes, criticalRisk, agt, isRetestDue, depressurization, grounding, safetyControls, competency, prepare, approve, activate, close };
  }, [details]);

  return { details, identity, update, updateIdentity, updateGasPoint, setActivityType, gates };
}
