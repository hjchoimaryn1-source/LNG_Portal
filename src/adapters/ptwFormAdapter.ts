// src/adapters/ptwFormAdapter.ts
//
// PURPOSE
//   레거시 AGT(Authorized Gas Tester) 현장 서명(agtSignature) 및 가스 수치
//   입력을 CMMS SSOT(CMMS_Architecture.md §2.4/§2.5) GasTestRecord DTO 형태로
//   변환하는 어댑터.
//
//   agtSignature는 이 프로젝트의 기존 타입(GasTestLogEntry 등)에 아직
//   존재하지 않는 필드다 — Phase 1의 staging_legacy_assets와 동일하게,
//   레거시 외부 입력(현장 서명 캡처 등)으로 간주해 이 파일의 입력 DTO에서만
//   정의한다. 기존 types/lng.ts는 수정하지 않는다.
//
// GUARANTEES
//   - 합격/불합격(resultStatus) 판정은 별도로 재구현하지 않고 기존 SSOT 게이트
//     함수인 validatePTWGasSafety()를 그대로 재사용한다.
//   - agtSignature가 비어있으면 (서명 없는 가스 측정 기록은 감사 추적성이
//     없어 안전상 무효이므로) 예외를 던진다 — 이 어댑터는 쓰기 경로용이며
//     assetAdapter.ts와 달리 Graceful Fallback 대상이 아니다.

import type { PTWType } from '../types/lng';
import { validatePTWGasSafety } from '../data/ptwMasterData';

export class MissingAgtSignatureError extends Error {
  constructor(permitRefNo: string) {
    super(`AGT signature is required to record a gas test for permit "${permitRefNo}".`);
    this.name = 'MissingAgtSignatureError';
  }
}

/** SSOT types/ptw.ts GasTestRecord.testType */
export type GasTestRecordType = 'INITIAL' | 'RETEST' | 'CONTINUOUS';

/** 레거시 현장 입력 — 이 프로젝트의 기존 GasTestLogEntryInput에 agtSignature를 더한 형태 */
export interface LegacyAgtTestInput {
  testType: GasTestRecordType;
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm?: number;
  testedByAgt: string;
  /** 현장 AGT의 전자 서명(base64 이미지 또는 서명 캡처 해시) — 필수 */
  agtSignature: string;
  testedAt: string;
}

/**
 * SSOT `GasTestRecord`(§2.5)에서 DB 생성 컬럼(gasTestId, 숫자 permitId)만
 * 제외한 draft 형태. 이 프로젝트에는 아직 실제 DB가 없으므로 가짜 숫자 ID를
 * 만들어내지 않고, 대신 이미 어디서나 쓰이는 legacy 문자열 ref(permitRefNo)로
 * permit을 식별한다.
 */
export interface GasTestRecordDraft {
  permitRefNo: string;
  testType: GasTestRecordType;
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm: number;
  resultStatus: 'PASS' | 'FAIL';
  blockReason: string | null;
  testedByAgt: string;
  agtSignature: string;
  testedAt: string;
}

/** null/undefined/공백 문자열을 "서명 없음"으로 간주 */
function isBlankSignature(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0;
}

/**
 * 레거시 AGT 입력을 CMMS GasTestRecord draft로 변환한다.
 * resultStatus는 기존 SSOT 게이트(validatePTWGasSafety)를 그대로 통과시켜
 * 산출하므로, Hot Work LEL 0% 규칙 / Confined Space O2 19.5~23.5% 규칙 등이
 * 이 어댑터에서 중복 정의되지 않는다.
 */
export function toGasTestRecordDraft(
  permitRefNo: string,
  ptwType: PTWType,
  legacyInput: LegacyAgtTestInput
): GasTestRecordDraft {
  if (isBlankSignature(legacyInput.agtSignature)) {
    throw new MissingAgtSignatureError(permitRefNo);
  }

  const coPpm = legacyInput.coPpm ?? 0;

  const { isSafe, blockReason } = validatePTWGasSafety(ptwType, {
    lelPercent: legacyInput.lelPercent,
    o2Percent: legacyInput.o2Percent,
    h2sPpm: legacyInput.h2sPpm,
    coPpm,
    testedAt: legacyInput.testedAt,
    isSafeForWork: false, // 최종 판정은 아래 resultStatus/blockReason으로 산출한다
  });

  return {
    permitRefNo,
    testType: legacyInput.testType,
    lelPercent: legacyInput.lelPercent,
    o2Percent: legacyInput.o2Percent,
    h2sPpm: legacyInput.h2sPpm,
    coPpm,
    resultStatus: isSafe ? 'PASS' : 'FAIL',
    blockReason,
    testedByAgt: legacyInput.testedByAgt,
    agtSignature: legacyInput.agtSignature.trim(),
    testedAt: legacyInput.testedAt,
  };
}

/** 여러 건 일괄 변환 (Cargo Handling 다중 포인트 AGT 등 배치 입력용) */
export function toGasTestRecordDraftList(
  permitRefNo: string,
  ptwType: PTWType,
  legacyInputs: LegacyAgtTestInput[]
): GasTestRecordDraft[] {
  return legacyInputs.map((input) => toGasTestRecordDraft(permitRefNo, ptwType, input));
}
