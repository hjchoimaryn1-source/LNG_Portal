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
  updatePermitLifecycle,
  selectPermitLifecycle,
  selectAllPermitLifecycle,
  type PTWPermitLifecycleDraft,
} from './db/ptwPermitDao';
import { insertSignature, selectSignaturesByPermit, selectAllSignaturesByPermit } from './db/ptwSignatureDao';
import { selectPermitLockState, upsertPermitLockState } from './db/permitLockStateDao';
import { insertPermitSyncConflict, selectOpenPermitSyncConflicts, type PermitSyncConflictRow } from './db/permitSyncConflictDao';
import { computePayloadHash, legacyStatusToCmmsStage } from './ptwStatusMapper';
import { insertPermitMetadataIfAbsent } from './db/permitMetadataDao';
import { evaluateAndSyncSuspensions } from './permitSuspensionAdapter';
import type { PermitSuspensionRow } from './db/permitSuspensionDao';
import type { PTWSignatureEntry } from '../types/lng';

/** DB가 비어있을 때만 시딩 — 이미 존재하는 permit_id는 건드리지 않는다(work_orders와 동일 컨벤션). */
export function seedPermitLifecycleIfAbsent(draft: PTWPermitLifecycleDraft): void {
  insertPermitLifecycleIfAbsent(getCmmsDb(), draft);
}

/**
 * permit 생성 시점의 type/work_area/equipment_tag 스냅샷 시딩 — §5.2 SIMOPS
 * DB 판정(simopsDbAdapter.ts)의 후보 집합 소스. 이미 존재하는 permit_ref_no는
 * 건드리지 않는다(위 seedPermitLifecycleIfAbsent와 동일 컨벤션).
 */
export function seedPermitMetadataIfAbsent(permitId: string, ptwType: string, workArea: string, equipmentTag: string): void {
  insertPermitMetadataIfAbsent(getCmmsDb(), { permitRefNo: permitId, ptwType, workArea, equipmentTag });
}

/**
 * §5.3 AGT 4시간 타임아웃 / 시프트 교대 정지 상태를 호출 시점 기준으로
 * 재평가하고 현재 활성 정지 집합을 반환한다. 읽기(GET /ptw-permits)와
 * 쓰기(applyPermitUpdateWithConflictCheck) 양쪽 경로에서 호출된다.
 */
export function getActiveSuspensionsSnapshot(): PermitSuspensionRow[] {
  return evaluateAndSyncSuspensions(getCmmsDb());
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

// ----------------------------------------------------------------------------
// 오프라인 우선 동기화 & 낙관적 잠금 (CMMS_Architecture.md §5.5 이식)
//
// 런타임 스키마엔 문서가 가정하는 permits.version(정수)이 없으므로, 대신
// permit_lock_state.payload_hash(SHA-256, ptwStatusMapper.computePayloadHash)를
// 낙관적 잠금 기준으로 쓴다. baseVersion을 보내지 않는 기존 호출부
// (usePTWPermitSync.persistStatusChange — "게이트 판정에 영향 없음"으로 이미
// 설계된 fire-and-forget 경로)는 하위호환을 위해 잠금 검증 없이 기존과
// 동일하게 적용된다.
// ----------------------------------------------------------------------------

/** LOTO/가스감지/승인단계(status) — 이 중 하나라도 이번 갱신에 포함되면 안전 필수 충돌로 취급한다. */
const SAFETY_CRITICAL_FIELDS = new Set(['lotoApplied', 'gasDetectorContinuous', 'status']);

function touchesSafetyCriticalField(changedKeys: Iterable<string>): boolean {
  for (const key of changedKeys) {
    if (SAFETY_CRITICAL_FIELDS.has(key)) return true;
  }
  return false;
}

export type PermitLifecycleLocalChanges = Partial<
  Pick<PTWPermitLifecycleDraft, 'lotoApplied' | 'gasDetectorContinuous' | 'ppeVerified' | 'barricadeSet' | 'forcedVentilation' | 'workingAtHeight'>
>;

export interface PermitSyncUpdateInput {
  permitId: string;
  status: PTWPermitLifecycleDraft['status'];
  closedAt: string | null;
  /** 클라이언트가 마지막으로 읽은 permit_lock_state.payload_hash. 생략하면 잠금 검증 없이 적용(하위호환). */
  baseVersion?: string;
  /** status/closedAt 외에 이번 요청이 함께 바꾸려는 안전 체크리스트 필드만 담는다. */
  localChanges?: PermitLifecycleLocalChanges;
}

export type PermitSyncUpdateResult =
  | { outcome: 'NOT_FOUND' }
  | { outcome: 'APPLIED_CLEAN' | 'AUTO_MERGED'; record: PTWPermitLifecycleDraft }
  | { outcome: 'REQUIRES_SITE_MANAGER_REVIEW'; conflict: PermitSyncConflictRow; message: string };

function refreshLockState(db: ReturnType<typeof getCmmsDb>, permitId: string, record: PTWPermitLifecycleDraft): void {
  const { stageCode, status } = legacyStatusToCmmsStage(record.status);
  upsertPermitLockState(db, {
    permitRefNo: permitId,
    stageCode,
    status,
    payloadHash: computePayloadHash(record),
  });
}

/**
 * PTW permit 갱신 1건을 낙관적 잠금과 함께 적용한다:
 *   1) baseVersion 생략 시 기존 동작대로 무조건 적용(하위호환) 후 잠금 베이스라인 갱신.
 *   2) baseVersion이 현재 permit_lock_state와 일치하면 정상 적용(APPLIED_CLEAN).
 *   3) 불일치 + 안전 필수 필드 변경 → 적용하지 않고 permit_sync_conflicts에 기록,
 *      REQUIRES_SITE_MANAGER_REVIEW로 반환(호출자가 Site Manager UI에 표시).
 *   4) 불일치 + 비-안전 필드만 변경 → 서버 최신값 위에 local 변경만 얹어 3-way
 *      auto-merge 후 적용(AUTO_MERGED).
 */
export function applyPermitUpdateWithConflictCheck(input: PermitSyncUpdateInput): PermitSyncUpdateResult {
  const db = getCmmsDb();
  // §5.3 정지 상태를 이번 쓰기가 반영되기 전에 최신화한다 — transitionStatus의
  // Gate 5(suspendedByPermit 조회)가 다음 sync 라운드에서 정확한 값을 보도록.
  evaluateAndSyncSuspensions(db);
  const existing = selectPermitLifecycle(db, input.permitId);
  if (!existing) return { outcome: 'NOT_FOUND' };

  const merged: Omit<PTWPermitLifecycleDraft, 'permitId'> = {
    ...existing,
    ...input.localChanges,
    status: input.status,
    closedAt: input.closedAt,
  };

  const lockState = input.baseVersion ? selectPermitLockState(db, input.permitId) : undefined;
  const isStale = Boolean(input.baseVersion && lockState && lockState.payloadHash !== input.baseVersion);

  if (isStale) {
    const changedKeys = [...Object.keys(input.localChanges ?? {}), 'status'];
    if (touchesSafetyCriticalField(changedKeys)) {
      const conflict = insertPermitSyncConflict(db, {
        permitRefNo: input.permitId,
        serverPayloadHash: lockState!.payloadHash,
        clientBasePayloadHash: input.baseVersion!,
        conflictPayload: JSON.stringify({
          server: existing,
          local: { status: input.status, closedAt: input.closedAt, ...input.localChanges },
        }),
      });
      return {
        outcome: 'REQUIRES_SITE_MANAGER_REVIEW',
        conflict,
        message: 'Safety-critical overlap detected. Escalated to Site Manager.',
      };
    }
  }

  const updated = updatePermitLifecycle(db, input.permitId, merged);
  if (!updated) return { outcome: 'NOT_FOUND' };
  refreshLockState(db, input.permitId, updated);
  return { outcome: isStale ? 'AUTO_MERGED' : 'APPLIED_CLEAN', record: updated };
}

/** Site Manager 검토 대기 중인 동기화 충돌 전체 조회 — 기존 permit 뷰의 배지/알림용. */
export function getOpenPermitSyncConflicts(): PermitSyncConflictRow[] {
  return selectOpenPermitSyncConflicts(getCmmsDb());
}
