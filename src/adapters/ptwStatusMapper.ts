// src/adapters/ptwStatusMapper.ts
//
// PURPOSE
//   Refactoring Plan §2.1 구현체.
//   기존 포털의 단일 축 상태(PTWWorkflowStatus: DRAFT/PREPARED/APPROVED/ACTIVE/CLOSED)와
//   CMMS SSOT의 이원화 축(PTWStageEnum × PTWStatusEnum)을 안전하게 양방향 변환한다.
//
//   기존 컴포넌트/타입(types/lng.ts 등)은 이 파일이 절대 수정하지 않는다.
//   이 파일은 순수 함수(pure function)로만 구성되며, DB/네트워크 side-effect가 없다.
//
// NON-GOALS
//   - 이 파일은 상태 "전이(transition)" 허용 여부를 판단하지 않는다.
//     (전이 게이트는 evaluateSafetyGateRules 등 기존/SIMOPS 로직의 몫)
//   - DB에 쓰는 것은 이 파일의 책임이 아니다. 호출자가 반환값을 사용해 쓴다.

import { createHash } from 'crypto';
import type { PTWWorkflowStatus } from '../types/lng';

// ----------------------------------------------------------------------------
// 1. 타입 정의
//    PTWWorkflowStatus는 기존 포털 types/lng.ts 원본을 그대로 import한다 (무수정).
//    PTWStageEnum/PTWStatusEnum은 CMMS SSOT(CMMS_Architecture.md §2.5) 축으로,
//    대응하는 types/ptw.ts가 아직 프로젝트에 존재하지 않으므로 여기서 로컬 정의한다.
//    향후 types/ptw.ts가 추가되면 그쪽 import로 교체한다.
// ----------------------------------------------------------------------------

export type { PTWWorkflowStatus };

/** CMMS SSOT types/ptw.ts의 PTWStageEnum */
export type PTWStageEnum =
  | 'STAGE_1_DRAFT'
  | 'STAGE_2_HSSE_VERIFY'
  | 'STAGE_3_APPROVAL'
  | 'STAGE_4_EXECUTION'
  | 'STAGE_5_CLOSEOUT'
  | 'CLOSED'
  | 'CANCELLED';

/** CMMS SSOT types/ptw.ts의 PTWStatusEnum */
export type PTWStatusEnum =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'APPROVED_ISSUED'
  | 'IN_PROGRESS'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED';

export interface CmmsStageStatus {
  stageCode: PTWStageEnum;
  status: PTWStatusEnum;
}

/** stageCode → status 허용 조합 화이트리스트 (SSOT §2.5 PermitMaster 정합성 기준) */
const ALLOWED_STAGE_STATUS_PAIRS: Record<PTWStageEnum, PTWStatusEnum[]> = {
  STAGE_1_DRAFT: ['DRAFT'],
  STAGE_2_HSSE_VERIFY: ['PENDING_VERIFICATION', 'REJECTED'],
  STAGE_3_APPROVAL: ['APPROVED_ISSUED', 'REJECTED'],
  STAGE_4_EXECUTION: ['IN_PROGRESS', 'SUSPENDED'],
  STAGE_5_CLOSEOUT: ['CLOSED'],
  CLOSED: ['CLOSED'],
  CANCELLED: ['CANCELLED'],
};

export class InvalidStageStatusError extends Error {
  constructor(stageCode: string, status: string) {
    super(`Invalid stage/status combination: stageCode="${stageCode}", status="${status}" is not an allowed pairing.`);
    this.name = 'InvalidStageStatusError';
  }
}

export class UnmappedLegacyStatusError extends Error {
  constructor(legacy: string) {
    super(`No CMMS mapping defined for legacy PTWWorkflowStatus="${legacy}".`);
    this.name = 'UnmappedLegacyStatusError';
  }
}

export class ConcurrentModificationError extends Error {
  constructor(expected: string, actual: string) {
    super(
      `Optimistic lock failure: payloadHash mismatch. expected="${expected}" actual="${actual}". ` +
        `The permit was modified by another process since this payload was read — reload before retrying.`
    );
    this.name = 'ConcurrentModificationError';
  }
}

// ----------------------------------------------------------------------------
// 2. 정합성 검증
// ----------------------------------------------------------------------------

/** stageCode/status 조합이 SSOT 화이트리스트에 있는지 검증한다. */
export function validateStageStatusPair(stageCode: PTWStageEnum, status: PTWStatusEnum): boolean {
  return ALLOWED_STAGE_STATUS_PAIRS[stageCode]?.includes(status) ?? false;
}

/** 검증 실패 시 예외를 던지는 assert 버전. 쓰기 경로에서는 항상 이 함수를 통과시킨다. */
export function assertValidStageStatusPair(stageCode: PTWStageEnum, status: PTWStatusEnum): void {
  if (!validateStageStatusPair(stageCode, status)) {
    throw new InvalidStageStatusError(stageCode, status);
  }
}

// ----------------------------------------------------------------------------
// 3. 양방향 상태 변환
// ----------------------------------------------------------------------------

/**
 * 레거시 단일축 상태 → CMMS 이원축 상태.
 *
 * 주의(Refactoring Plan §2.1): 레거시 PREPARED는 STAGE_2_HSSE_VERIFY로 매핑되지만,
 * 완전한 1:1 등가가 아니다 — 레거시는 이 시점에 인원배정을 이미 허용하지만 SSOT는
 * STAGE_1에서 인원배정란을 전면 배제한다. 이 함수는 상태값만 변환하며, 인원배정
 * 필드 자체의 취급(제출 시점 필터링)은 폼 어댑터(§2.1 useNewPTWPermitForm 연결부)의
 * 책임이다.
 */
export function legacyStatusToCmmsStage(legacy: PTWWorkflowStatus): CmmsStageStatus {
  let result: CmmsStageStatus;
  switch (legacy) {
    case 'DRAFT':
      result = { stageCode: 'STAGE_1_DRAFT', status: 'DRAFT' };
      break;
    case 'PREPARED':
      result = { stageCode: 'STAGE_2_HSSE_VERIFY', status: 'PENDING_VERIFICATION' };
      break;
    case 'APPROVED':
      result = { stageCode: 'STAGE_3_APPROVAL', status: 'APPROVED_ISSUED' };
      break;
    case 'ACTIVE':
      result = { stageCode: 'STAGE_4_EXECUTION', status: 'IN_PROGRESS' };
      break;
    case 'CLOSED':
      result = { stageCode: 'STAGE_5_CLOSEOUT', status: 'CLOSED' };
      break;
    default:
      throw new UnmappedLegacyStatusError(String(legacy));
  }
  // 매핑 결과 자체가 화이트리스트를 위반하면 매퍼 정의 버그이므로 즉시 실패시킨다.
  assertValidStageStatusPair(result.stageCode, result.status);
  return result;
}

/**
 * CMMS 이원축 상태 → 레거시 단일축 상태 (레거시 화면 무수정 서빙용 축약).
 *
 * SUSPENDED(4시간 AGT 타임아웃/시프트 교대 자동 정지, SSOT §5.3)는 레거시 5값에
 * 대응 항목이 없으므로 'ACTIVE'로 축약하되, 호출자가 원본 status를 함께 표시해
 * "일시정지" 배너를 별도로 얹을 수 있도록 반환 객체에 원본 status를 포함한다.
 */
export function cmmsStageToLegacyStatus(
  stageCode: PTWStageEnum,
  status: PTWStatusEnum
): { legacyStatus: PTWWorkflowStatus; rawCmmsStatus: PTWStatusEnum; isSuspended: boolean } {
  assertValidStageStatusPair(stageCode, status);

  let legacyStatus: PTWWorkflowStatus;
  switch (stageCode) {
    case 'STAGE_1_DRAFT':
      legacyStatus = 'DRAFT';
      break;
    case 'STAGE_2_HSSE_VERIFY':
      legacyStatus = 'PREPARED';
      break;
    case 'STAGE_3_APPROVAL':
      legacyStatus = 'APPROVED';
      break;
    case 'STAGE_4_EXECUTION':
      legacyStatus = 'ACTIVE';
      break;
    case 'STAGE_5_CLOSEOUT':
    case 'CLOSED':
      legacyStatus = 'CLOSED';
      break;
    case 'CANCELLED':
      // 레거시엔 CANCELLED가 없다 — 안전한 기본값으로 CLOSED 취급 + 별도 플래그로 구분 필요 시
      // 호출자가 rawCmmsStatus를 확인하도록 유도한다.
      legacyStatus = 'CLOSED';
      break;
    default:
      throw new UnmappedLegacyStatusError(`(reverse) stageCode=${stageCode}`);
  }

  return { legacyStatus, rawCmmsStatus: status, isSuspended: status === 'SUSPENDED' };
}

// ----------------------------------------------------------------------------
// 4. payloadHash 기반 Optimistic Locking 검증 (SSOT §5.5 이식)
// ----------------------------------------------------------------------------

/**
 * 임의의 payload 객체에 대한 결정론적(canonical) SHA-256 해시를 계산한다.
 * 키 순서에 무관하게 동일한 값이 나오도록 재귀적으로 키를 정렬한 뒤 직렬화한다.
 */
export function computePayloadHash(payload: unknown): string {
  const canonical = canonicalize(payload);
  return createHash('sha256').update(canonical).digest('hex');
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`);
  return `{${entries.join(',')}}`;
}

/**
 * 저장된 payloadHash(예: permit_lock_state.payload_hash)와 현재 payload로부터
 * 재계산한 해시를 비교한다. 일치 여부만 반환하며 예외를 던지지 않는다.
 */
export function verifyPayloadHash(
  currentPayload: unknown,
  expectedHash: string
): { valid: boolean; computedHash: string } {
  const computedHash = computePayloadHash(currentPayload);
  return { valid: computedHash === expectedHash, computedHash };
}

/**
 * 쓰기 경로용 assert 버전 — 불일치 시 ConcurrentModificationError를 던진다.
 * PTW 상태 전이(예: STAGE_2 -> STAGE_3 제출) 직전에 반드시 호출한다.
 */
export function assertPayloadHashMatches(currentPayload: unknown, expectedHash: string): void {
  const { valid, computedHash } = verifyPayloadHash(currentPayload, expectedHash);
  if (!valid) {
    throw new ConcurrentModificationError(expectedHash, computedHash);
  }
}

// ----------------------------------------------------------------------------
// 5. 통합 헬퍼 — Lock 검증 + 상태 변환을 한 번에 (쓰기 파이프라인 진입점)
// ----------------------------------------------------------------------------

export interface SafeTransitionInput {
  /** 클라이언트가 마지막으로 읽은 permit의 전체 payload (해시 재계산용) */
  currentPayload: unknown;
  /** 클라이언트가 마지막으로 읽은 시점의 payloadHash (permit_lock_state.payload_hash) */
  expectedHash: string;
  /** 이번 전이가 도달해야 할 레거시 목표 상태 */
  targetLegacyStatus: PTWWorkflowStatus;
}

export interface SafeTransitionResult extends CmmsStageStatus {
  /** 전이 확정 후 즉시 저장해야 할 새 해시 (다음 전이의 expectedHash가 됨) */
  nextPayloadHash: string;
}

/**
 * 상태 전이 요청 1건을 안전하게 처리한다:
 *   1) Optimistic Lock 검증 (동시 수정 감지)
 *   2) 레거시 목표 상태 -> CMMS stage/status 변환 + 화이트리스트 검증
 *   3) 새 payload 기준 다음 해시 산출
 *
 * DB 쓰기는 하지 않는다 — 반환값을 호출자가 트랜잭션 내에서 저장한다.
 */
export function safeTransition(input: SafeTransitionInput): SafeTransitionResult {
  assertPayloadHashMatches(input.currentPayload, input.expectedHash);
  const { stageCode, status } = legacyStatusToCmmsStage(input.targetLegacyStatus);
  const nextPayloadHash = computePayloadHash({
    ...(typeof input.currentPayload === 'object' && input.currentPayload !== null ? input.currentPayload : {}),
    stageCode,
    status,
  });
  return { stageCode, status, nextPayloadHash };
}
