// src/components/manpower/modals/ptw/useNewPTWPermitForm.ts
"use client";

import { useState } from 'react';
import { PTWPermit, PTWType, StaffPersonnel } from '../../../../types/lng';
import { PTW_SOP_FORMS, validatePTWWorkerEligibility } from '../../../../data/ptwMasterData';
import { getCargoHandlingSOPInfo } from '../../../../data/ptwCargoHandlingRules';
import {
  PLANT_WORK_LOCATIONS,
  PlantWorkLocation,
  LOCATION_TO_PPE_ZONES,
  PTW_WORK_AREAS,
  PTWWorkArea,
} from '../../../../data/ptwWorkAreas';

export interface UseNewPTWPermitFormArgs {
  personnelList: StaffPersonnel[];
  sequenceNumber: number;
  onSubmitSuccess: (newPermit: PTWPermit) => void;
  onClose: () => void;
}

// Cargo Handling has no single formNumber (1:N SOP set by activity type) —
// resolve its real NP08 codes here instead of reusing the CARGO_HANDLING
// placeholder entry in PTW_SOP_FORMS. COMBINED is used as this modal collects
// no activityType (that flow lives in CargoHandlingPermitForm.tsx).
export function resolveHeaderFormLabel(type: PTWType): string {
  if (type === 'CARGO_HANDLING') {
    return getCargoHandlingSOPInfo('COMBINED')
      .map((f) => f.formNumber)
      .join(' / ');
  }
  return PTW_SOP_FORMS[type].formNumber;
}

export function useNewPTWPermitForm({
  personnelList,
  sequenceNumber,
  onSubmitSuccess,
  onClose,
}: UseNewPTWPermitFormArgs) {
  // Read-only originator — represents the currently logged-in drafter.
  const originatorLabel = 'Choi Hong-joon (Engineering Dept)';

  const [newPermitType, setNewPermitType] = useState<PTWType>('HOT_WORK');
  const [newPermitTitle, setNewPermitTitle] = useState<string>('');
  const [newPermitLocation, setNewPermitLocation] = useState<string>(PLANT_WORK_LOCATIONS[0]);
  const [newWorkArea, setNewWorkArea] = useState<string>(
    LOCATION_TO_PPE_ZONES[PLANT_WORK_LOCATIONS[0]][0]
  );
  const [newWorkLeaderId, setNewWorkLeaderId] = useState<string>('EMP-005');
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<string[]>(['EMP-006']);
  const [newWorkingAtHeight, setNewWorkingAtHeight] = useState<boolean>(false);

  const toggleAssignedWorker = (id: string) => {
    setAssignedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLocationChange = (loc: string) => {
    setNewPermitLocation(loc);
    const validZones = LOCATION_TO_PPE_ZONES[loc as PlantWorkLocation];
    if (validZones && validZones.length > 0) {
      setNewWorkArea(validZones[0]);
    }
  };

  const availablePpeZones: readonly PTWWorkArea[] =
    LOCATION_TO_PPE_ZONES[newPermitLocation as PlantWorkLocation] || PTW_WORK_AREAS;

  const handleCreatePermit = () => {
    if (!newPermitTitle.trim()) {
      alert('Please enter a permit work description / title.');
      return;
    }

    const leader = personnelList.find((s) => s.id === newWorkLeaderId);
    const workers = personnelList.filter((s) => assignedWorkerIds.includes(s.id));
    if (!leader) {
      alert('Please designate a qualified Work Leader.');
      return;
    }
    if (workers.length === 0) {
      alert('Please assign at least one workforce member (PJSM participant).');
      return;
    }

    const leaderCheck = validatePTWWorkerEligibility(leader, newPermitType);
    if (!leaderCheck.isEligible) {
      alert(`Work Leader (${leader.name}) is ineligible: ${leaderCheck.reason}`);
      return;
    }

    for (const worker of workers) {
      const workerCheck = validatePTWWorkerEligibility(worker, newPermitType);
      if (!workerCheck.isEligible) {
        alert(`Assigned Workforce member (${worker.name}) is ineligible: ${workerCheck.reason}`);
        return;
      }
    }

    const formDef = PTW_SOP_FORMS[newPermitType];
    const newId = `PTW-2026-0901-${String(sequenceNumber).padStart(2, '0')}`;

    const newPermit: PTWPermit = {
      id: newId,
      formNumber: formDef.formNumber,
      type: newPermitType,
      title: newPermitTitle,
      location: newPermitLocation,
      workArea: newWorkArea,
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
        fireWatchAssigned: newPermitType === 'HOT_WORK',
        gasDetectorContinuous: true,
        lotoApplied: newPermitType === 'ELECTRICAL',
        forcedVentilation: newPermitType === 'CONFINED_SPACE',
        ppeVerified: true,
        barricadeSet: true,
        workingAtHeight: newWorkingAtHeight,
      },
      validFrom: '2026-09-01 13:00',
      validTo: '2026-09-01 18:00',
      emergencyProtocol: 'Radio Channel 1 Emergency Channel Active',
      createdAt: '2026-09-01 12:00',
      hazardDescription: `${formDef.category} protocol active under SOP ${formDef.formNumber}.`,
    };

    onSubmitSuccess(newPermit);
    setNewPermitTitle('');
    onClose();
  };

  return {
    originatorLabel,
    newPermitType,
    setNewPermitType,
    newPermitTitle,
    setNewPermitTitle,
    newPermitLocation,
    setNewPermitLocation: handleLocationChange,
    newWorkArea,
    setNewWorkArea,
    availablePpeZones,
    newWorkLeaderId,
    setNewWorkLeaderId,
    assignedWorkerIds,
    setAssignedWorkerIds,
    toggleAssignedWorker,
    newWorkingAtHeight,
    setNewWorkingAtHeight,
    handleCreatePermit,
    headerFormLabel: resolveHeaderFormLabel(newPermitType),
  };
}
