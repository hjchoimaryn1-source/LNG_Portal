// src/data/ptwCargoHandlingMapper.ts
// Pure mapper: Cargo Handling PTW form state -> PTWPermit register entry.
// No React bindings (AGENTS.md Logic/Data Layer). Consumed by
// CargoHandlingPermitForm on submit.

import type { CargoHandlingPermitDetails, PTWPermit } from '../types/lng';
import type { CargoHandlingIdentity } from '../components/manpower/cargoHandling/hooks/useCargoHandlingPermitForm';
import { evaluateAgtGate } from './ptwCargoHandlingValidators';

// Fixed simulation timestamp convention shared with PTWManagementView.handleCreatePermit
// (this portal runs against a fixed 2026-09-01 scenario date, not the real clock).
const SIM_TIMESTAMP = '2026-09-01 12:00';
const SIM_VALID_FROM = '2026-09-01 13:00';
const SIM_VALID_TO = '2026-09-01 18:00';

export function mapCargoHandlingFormToPermit(
  identity: CargoHandlingIdentity,
  details: CargoHandlingPermitDetails,
  requiredSopCodes: string[],
  sequenceNumber: number
): PTWPermit {
  const agt = evaluateAgtGate(details.activityType, details.gasReadingPoints);
  const worstLel = details.gasReadingPoints.reduce((max, p) => Math.max(max, p.lelPercent), 0);
  const worstO2 = details.gasReadingPoints.reduce(
    (min, p) => Math.min(min, p.o2Percent),
    details.gasReadingPoints[0]?.o2Percent ?? 20.9
  );

  return {
    id: `PTW-2026-0901-${String(sequenceNumber).padStart(2, '0')}`,
    formNumber: requiredSopCodes[0],
    type: 'CARGO_HANDLING',
    title: identity.title,
    location: identity.location,
    status: 'DRAFT',
    workLeaderId: '',
    workLeaderName: identity.workLeaderName,
    assignedWorkerIds: [],
    assignedWorkerNames: [],
    gasReadings: {
      lelPercent: worstLel,
      o2Percent: worstO2,
      h2sPpm: 0,
      coPpm: 0,
      testedAt: details.lastGasTestAt || SIM_TIMESTAMP,
      isSafeForWork: agt.isSafe,
    },
    safetyChecklist: {
      fireWatchAssigned: details.fireWatchAssigned,
      gasDetectorContinuous: true,
      lotoApplied: details.allLotoLocksRemoved,
      forcedVentilation: false,
      ppeVerified: true,
      barricadeSet: details.barricadeRadiusM > 0,
    },
    validFrom: SIM_VALID_FROM,
    validTo: SIM_VALID_TO,
    emergencyProtocol: 'Radio Channel 1 Emergency Channel Active',
    createdAt: SIM_TIMESTAMP,
    hazardDescription: `${details.activityType} cargo handling protocol active under SOP ${requiredSopCodes.join(', ')}.`,
    cargoHandling: details,
  };
}
