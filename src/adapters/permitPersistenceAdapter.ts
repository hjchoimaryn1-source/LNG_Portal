// src/adapters/permitPersistenceAdapter.ts
//
// PURPOSE
//   PTW permit lifecycle(status/closedAt/safetyChecklist) + 전자 서명 로그의
//   저장/조회 전담 어댑터. gasSafetyAdapter.ts와 동일한 얇은 래퍼 — 실제 SQL은
//   src/adapters/db/ptwPermitDao.ts / ptwSignatureDao.ts에 위임한다.
//
// GUARANTEES
//   - 상태 전이/서명 완결성 게이트(evaluateSignatureGate, O2/LEL 체크 등)의
//     SSOT는 여전히 client-side usePTWPermits.ts다. 이 어댑터는 이미 통과된
//     결과만 저장하며 재검증하지 않는다.

import { getCmmsDb } from './db/cmmsDbSingleton';
import {
  insertPermitLifecycleIfAbsent,
  updatePermitStatus,
  selectAllPermitLifecycle,
  type PTWPermitLifecycleDraft,
} from './db/ptwPermitDao';
import { insertSignature, selectSignaturesByPermit, selectAllSignaturesByPermit } from './db/ptwSignatureDao';
import type { PTWSignatureEntry } from '../types/lng';

/** DB가 비어있을 때만 시딩 — 이미 존재하는 permit_id는 건드리지 않는다(work_orders와 동일 컨벤션). */
export function seedPermitLifecycleIfAbsent(draft: PTWPermitLifecycleDraft): void {
  insertPermitLifecycleIfAbsent(getCmmsDb(), draft);
}

/** transitionStatus() 결과 반영. 대상 permit_id가 DB에 아직 없으면 undefined(호출부가 무시). */
export function persistPermitStatus(permitId: string, status: PTWPermitLifecycleDraft['status'], closedAt: string | null): PTWPermitLifecycleDraft | undefined {
  return updatePermitStatus(getCmmsDb(), permitId, status, closedAt);
}

/** addSignature() 결과 반영 — 동일 role 재서명은 DAO의 UNIQUE 제약으로 조용히 무시된다. */
export function persistPermitSignature(permitId: string, entry: PTWSignatureEntry): void {
  insertSignature(getCmmsDb(), permitId, entry);
}

/** 특정 permit의 서명 목록만 조회 (PATCH 이후 최신 목록 응답 등에 사용). */
export function getPermitSignatures(permitId: string): PTWSignatureEntry[] {
  return selectSignaturesByPermit(getCmmsDb(), permitId);
}

/** 전체 permit lifecycle + 서명 로그 조회 — usePTWPermitSync의 초기 병합용. */
export function getAllPermitLifecycleWithSignatures(): { lifecycle: PTWPermitLifecycleDraft[]; signaturesByPermit: Map<string, PTWSignatureEntry[]> } {
  const db = getCmmsDb();
  return {
    lifecycle: selectAllPermitLifecycle(db),
    signaturesByPermit: selectAllSignaturesByPermit(db),
  };
}
