// src/utils/ptwPermitRecordMapper.ts
//
// PURPOSE
//   PTWPermit(types/lng.ts) <-> PTWPermitLifecycleDraft(ptwPermitDao.ts) 간
//   순수 변환. React 바인딩 없음 — workOrderRecordMapper.ts와 동일 위치의
//   Logic/Data 레이어. usePTWPermitSync.ts가 시딩/병합에 사용한다.

import type { PTWPermit, PTWSignatureEntry } from '../types/lng';
import type { PTWPermitLifecycleDraft } from '../adapters/db/ptwPermitDao';

/** 신규 permit을 DB 시딩용 draft로 변환한다 — safetyChecklist는 생성 시점 스냅샷(이후 UI에서 토글 불가). */
export function toPermitLifecycleSeed(permit: PTWPermit): PTWPermitLifecycleDraft {
  return {
    permitId: permit.id,
    status: permit.status,
    fireWatchAssigned: permit.safetyChecklist.fireWatchAssigned,
    gasDetectorContinuous: permit.safetyChecklist.gasDetectorContinuous,
    lotoApplied: permit.safetyChecklist.lotoApplied,
    forcedVentilation: permit.safetyChecklist.forcedVentilation,
    ppeVerified: permit.safetyChecklist.ppeVerified,
    barricadeSet: permit.safetyChecklist.barricadeSet,
    workingAtHeight: permit.safetyChecklist.workingAtHeight ?? null,
    closedAt: permit.closedAt ?? null,
  };
}

/**
 * DB에서 읽은 lifecycle/서명 상태를 permit에 덮어써 병합한다. status/closedAt/
 * signatures만 DB 기준으로 갱신하고 나머지 필드(gasReadings, cargoHandling 등)는
 * 손대지 않는다 — DB는 이 세 필드에 대해서만 permit보다 최신일 수 있다
 * (usePTWPermits는 mount 시 항상 INITIAL_PTW_PERMITS로 리셋되므로).
 */
export function applyLifecycleToPermit(
  permit: PTWPermit,
  lifecycle: PTWPermitLifecycleDraft | undefined,
  signatures: PTWSignatureEntry[] | undefined
): PTWPermit {
  if (!lifecycle && !signatures) return permit;
  return {
    ...permit,
    status: lifecycle?.status ?? permit.status,
    closedAt: lifecycle?.closedAt ?? permit.closedAt,
    signatures: signatures && signatures.length > 0 ? signatures : permit.signatures,
  };
}
