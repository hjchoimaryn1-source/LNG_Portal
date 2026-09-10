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
import { evaluateSimopsDryRun, SimopsCheckResult } from '../../../../hooks/useSIMOPSCheck';

export interface UseNewPTWPermitFormArgs {
  personnelList: StaffPersonnel[];
  sequenceNumber: number;
  // SIMOPS 공간 간섭 판정 대상 — 발급 시점의 활성 permit 목록 (usePTWPermits().permits).
  activePermits: PTWPermit[];
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
  activePermits,
  onSubmitSuccess,
  onClose,
}: UseNewPTWPermitFormArgs) {
  // Read-only originator — represents the currently logged-in drafter.
  const originatorLabel = 'Choi Hong-joon (Engineering Dept)';

  // CARGO_HANDLING is excluded — that type has its own required `cargoHandling`
  // detail block (PTWCargoHandlingPermit) and is only ever created through the
  // dedicated CargoHandlingPermitForm modal, never through this generic Stage 1
  // Draft form (see buildAndSubmitPermit below, which omits `cargoHandling`).
  const [newPermitType, setNewPermitType] = useState<Exclude<PTWType, 'CARGO_HANDLING'>>('HOT_WORK');
  const [newPermitTitle, setNewPermitTitle] = useState<string>('');
  const [newPermitLocation, setNewPermitLocation] = useState<string>(PLANT_WORK_LOCATIONS[0]);
  const [newWorkArea, setNewWorkArea] = useState<string>(
    LOCATION_TO_PPE_ZONES[PLANT_WORK_LOCATIONS[0]][0]
  );
  const [newWorkLeaderId, setNewWorkLeaderId] = useState<string>('EMP-005');
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<string[]>(['EMP-006']);
  const [newWorkingAtHeight, setNewWorkingAtHeight] = useState<boolean>(false);
  // SIMOPS 매칭 키(workArea/equipmentTag 중 하나라도 겹치면 후보) — 기존 폼에
  // 전용 입력이 없었으므로 이번 배선에서 신규 추가. Optional 자유 입력(예: PRSS-CMP-01).
  const [newEquipmentTag, setNewEquipmentTag] = useState<string>('');
  // HARD_BLOCK/SOFT_ESCALATE 판정 시 SimopsWarningModal을 띄우기 위한 게이트 상태.
  // null이면 게이트 없음(제출 진행 중이거나 대기 중이 아님).
  const [simopsGate, setSimopsGate] = useState<SimopsCheckResult | null>(null);

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

  // 기존 검증(제목/리더/인력/자격)을 통과한 뒤 실제 permit 객체를 생성해
  // onSubmitSuccess로 전달하는 최종 단계. SIMOPS PROCEED 경로와, SOFT_ESCALATE를
  // 사용자가 명시적으로 override-confirm한 경로 양쪽에서 재사용된다.
  const buildAndSubmitPermit = () => {
    const leader = personnelList.find((s) => s.id === newWorkLeaderId);
    const workers = personnelList.filter((s) => assignedWorkerIds.includes(s.id));
    if (!leader) return; // handleCreatePermit에서 이미 검증됨 — 방어적 가드

    const formDef = PTW_SOP_FORMS[newPermitType];
    const newId = `PTW-2026-0901-${String(sequenceNumber).padStart(2, '0')}`;

    const newPermit: PTWPermit = {
      id: newId,
      formNumber: formDef.formNumber,
      type: newPermitType,
      title: newPermitTitle,
      location: newPermitLocation,
      workArea: newWorkArea,
      equipmentTag: newEquipmentTag.trim() || undefined,
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
    setNewEquipmentTag('');
    setSimopsGate(null);
    onClose();
  };

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

    // SIMOPS 공간 간섭 판정 — permit 생성 직전 최종 게이트.
    // 판정 자체가 실패(예외)하면 fail-open이 아니라 fail-safe(HARD_BLOCK 취급)한다.
    let simopsResult: SimopsCheckResult;
    try {
      simopsResult = evaluateSimopsDryRun(newPermitType, newWorkArea, newEquipmentTag.trim(), activePermits);
    } catch (err) {
      console.error('[useNewPTWPermitForm] SIMOPS check threw — failing safe (blocking submission).', err);
      setSimopsGate({
        hasConflict: true,
        riskLevel: 'RED',
        actionRequired: 'HARD_BLOCK',
        message: 'SIMOPS 판정 중 오류가 발생하여 안전을 위해 제출을 차단합니다. 관리자에게 문의하십시오.',
        isDryRun: true,
      });
      return;
    }

    if (simopsResult.actionRequired === 'HARD_BLOCK') {
      setSimopsGate(simopsResult); // 제출 불가 — SimopsWarningModal은 Acknowledge만 제공
      return;
    }

    if (simopsResult.actionRequired === 'SOFT_ESCALATE') {
      setSimopsGate(simopsResult); // 명시적 override 확인(onSimopsConfirmOverride) 전까지 생성 보류
      return;
    }

    buildAndSubmitPermit();
  };

  // SIMOPS HARD_BLOCK 안내 닫기 — 제출은 여전히 막힌 상태로 폼에 남는다.
  const onSimopsAcknowledge = () => setSimopsGate(null);
  // SIMOPS SOFT_ESCALATE 취소 — 제출하지 않고 폼으로 복귀.
  const onSimopsCancel = () => setSimopsGate(null);
  // SIMOPS SOFT_ESCALATE를 사용자가 명시적으로 override-confirm한 경우에만 제출 재개.
  const onSimopsConfirmOverride = () => buildAndSubmitPermit();

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
    newEquipmentTag,
    setNewEquipmentTag,
    simopsGate,
    onSimopsAcknowledge,
    onSimopsCancel,
    onSimopsConfirmOverride,
    handleCreatePermit,
    headerFormLabel: resolveHeaderFormLabel(newPermitType),
  };
}
