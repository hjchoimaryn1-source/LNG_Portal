// src/hooks/useCMMSPTWForm.ts
//
// PURPOSE
//   Refactoring Plan §2.1 구현체.
//   기존 useNewPTWPermitForm(레거시 단일축 상태 폼)을 무수정으로 감싸,
//   permit 생성 시점에 CMMS 이원축 상태(stageCode/status)와
//   permit_lock_state 베이스라인용 payloadHash를 함께 산출하는 래퍼 훅.
//
// NON-GOALS
//   - useNewPTWPermitForm.ts 자체는 수정하지 않는다.
//   - DB 쓰기(permit_lock_state INSERT 등)는 이 훅의 책임이 아니다 — 호출자가
//     onSubmitSuccess로 전달받은 cmmsMeta를 사용해 저장한다.

import { useState } from 'react';
import { PTWPermit, StaffPersonnel } from '../types/lng';
import { useNewPTWPermitForm } from '../components/manpower/modals/ptw/useNewPTWPermitForm';
import { CmmsStageStatus, computePayloadHash, legacyStatusToCmmsStage } from '../adapters/ptwStatusMapper';

/** permit 생성 직후의 CMMS 이원축 상태 + payloadHash 베이스라인 */
export interface CmmsPermitMeta extends CmmsStageStatus {
  /** permit_lock_state.payload_hash 초기값 — 다음 전이(safeTransition)의 expectedHash로 사용 */
  payloadHash: string;
}

export interface UseCMMSPTWFormArgs {
  personnelList: StaffPersonnel[];
  sequenceNumber: number;
  /** SIMOPS 공간 간섭 판정 대상 — 발급 시점의 활성 permit 목록 (usePTWPermits().permits). */
  activePermits: PTWPermit[];
  /** 레거시 PTWPermit과 함께, 이번 생성 건의 CMMS stage/status/payloadHash를 받는다. */
  onSubmitSuccess: (newPermit: PTWPermit, cmmsMeta: CmmsPermitMeta) => void;
  onClose: () => void;
}

/**
 * useNewPTWPermitForm을 감싸는 CMMS 통합 래퍼.
 * 반환값은 원본 훅의 모든 필드를 그대로 노출하며(스프레드), 여기에
 * `lastCmmsMeta`(가장 최근 생성된 permit의 CMMS 메타)를 추가로 제공한다.
 */
export function useCMMSPTWForm(args: UseCMMSPTWFormArgs) {
  const [lastCmmsMeta, setLastCmmsMeta] = useState<CmmsPermitMeta | null>(null);

  const form = useNewPTWPermitForm({
    personnelList: args.personnelList,
    sequenceNumber: args.sequenceNumber,
    activePermits: args.activePermits,
    onClose: args.onClose,
    onSubmitSuccess: (newPermit) => {
      // 생성 직후 permit.status는 항상 'DRAFT' (useNewPTWPermitForm 고정값) —
      // legacyStatusToCmmsStage가 화이트리스트 위반 시 스스로 예외를 던지므로
      // 여기서 별도 검증은 반복하지 않는다.
      const { stageCode, status } = legacyStatusToCmmsStage(newPermit.status);
      const payloadHash = computePayloadHash(newPermit);
      const cmmsMeta: CmmsPermitMeta = { stageCode, status, payloadHash };

      setLastCmmsMeta(cmmsMeta);
      args.onSubmitSuccess(newPermit, cmmsMeta);
    },
  });

  return {
    ...form,
    lastCmmsMeta,
  };
}
