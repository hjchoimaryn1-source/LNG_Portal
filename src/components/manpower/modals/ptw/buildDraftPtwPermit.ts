// src/components/manpower/modals/ptw/buildDraftPtwPermit.ts
//
// Pure permit-construction logic extracted from useNewPTWPermitForm.ts (Boy
// Scout Rule extraction — see AGENTS.md §3 Logic/Data Layer). No React bindings.

import { PTWPermit, PTWType, StaffPersonnel } from '../../../../types/lng';
import { PTW_SOP_FORMS } from '../../../../data/ptwMasterData';

export interface BuildDraftPtwPermitArgs {
  sequenceNumber: number;
  type: Exclude<PTWType, 'CARGO_HANDLING'>;
  title: string;
  location: string;
  workArea: string;
  equipmentTag: string;
  workingAtHeight: boolean;
  leader: StaffPersonnel;
  workers: StaffPersonnel[];
  // Stage-1 PRAC ALARP outcome + Stage-2/3 JSA reference (CMMS_Architecture.md
  // §2.2). Optional — omitted callers get the previous (permissive) behavior.
  isAlarpYes?: boolean;
  jsaAttachmentRef?: string | null;
}

// CARGO_HANDLING is excluded — that type has its own required `cargoHandling`
// detail block (PTWCargoHandlingPermit) and is only ever created through the
// dedicated CargoHandlingPermitForm modal, never through this generic Stage 1
// Draft form.
export function buildDraftPtwPermit({
  sequenceNumber,
  type,
  title,
  location,
  workArea,
  equipmentTag,
  workingAtHeight,
  leader,
  workers,
  isAlarpYes,
  jsaAttachmentRef,
}: BuildDraftPtwPermitArgs): PTWPermit {
  const formDef = PTW_SOP_FORMS[type];
  const newId = `PTW-2026-0901-${String(sequenceNumber).padStart(2, '0')}`;

  return {
    id: newId,
    formNumber: formDef.formNumber,
    type,
    title,
    location,
    workArea,
    equipmentTag: equipmentTag.trim() || undefined,
    responsiblePerson: leader.name,
    status: 'DRAFT',
    workLeaderId: leader.id,
    workLeaderName: leader.name,
    assignedWorkerIds: workers.map((w) => w.id),
    assignedWorkerNames: workers.map((w) => w.name),
    agtStaffId: 'EMP-013',
    approverStaffId: 'EMP-001',
    gasReadings: {
      lelPercent: 0.0,
      o2Percent: 20.9,
      h2sPpm: 0.0,
      coPpm: 0.0,
      testedAt: 'Pending AGT Live Gas Test (Stage 4)',
      isSafeForWork: false,
    },
    safetyChecklist: {
      fireWatchAssigned: type === 'HOT_WORK',
      gasDetectorContinuous: true,
      lotoApplied: type === 'ELECTRICAL',
      forcedVentilation: type === 'CONFINED_SPACE',
      ppeVerified: true,
      barricadeSet: true,
      workingAtHeight,
    },
    validFrom: '2026-09-01 13:00',
    validTo: '2026-09-01 18:00',
    emergencyProtocol: 'Radio Channel 1 Emergency Channel Active',
    createdAt: '2026-09-01 12:00',
    hazardDescription: `${formDef.category} protocol active under SOP ${formDef.formNumber}.`,
    isAlarpYes,
    jsaAttachmentRef: jsaAttachmentRef?.trim() || null,
  };
}
