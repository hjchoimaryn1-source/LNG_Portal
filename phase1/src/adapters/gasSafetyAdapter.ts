// src/adapters/gasSafetyAdapter.ts
//
// PURPOSE
//   Refactoring Plan §2.2 구현체 + TODO(cmms-permit-gas-tests) 해소.
//   기존 PTWPermit.gasReadings(단일 임베디드 객체) / cargoHandling.gasReadingPoints[]를
//   CMMS 정규 테이블 permit_gas_tests 이력 레코드로 변환하고 실제로 적재한다.
//
//   기존 mapCargoHandlingFormToPermit.ts, useNewPTWPermitForm.ts,
//   GasRetestEntryModal.tsx는 이 파일이 수정하지 않는다 (무수정 원칙).
//
// 이번 변경의 핵심
//   - 기존 구현이 console.info로만 로깅하던 지점을 실제 DB INSERT로 교체.
//   - 전용 서명 캡처 UI가 없어 TESTER NAME/ID를 서명으로 재사용하는 경우,
//     agtSignature에 LEGACY_SIGNATURE_REUSE_PREFIX를 붙이고
//     is_signature_legacy_reused=1로 표시한다 (설계 결정 로그 #7 반영).

import type { SqlExecutor } from './db/sqlExecutor';

// ----------------------------------------------------------------------------
// 1. 타입 정의 (기존/SSOT 타입 로컬 미러링 — 실제 프로젝트에서는
//    ../../types/lng, ../../types/ptw 에서 import)
// ----------------------------------------------------------------------------

export type GasTestType = 'INITIAL' | 'RETEST' | 'CONTINUOUS';
export type GasTestResultStatus = 'PASS' | 'FAIL';

export interface GasTestRecord {
  permitRefNo: string;
  testType: GasTestType;
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm?: number;
  resultStatus: GasTestResultStatus;
  testedByAgt: string;
  agtSignature: string;
  isSignatureLegacyReused: boolean;
  testedAt: string; // ISO8601
}

/** 기존 types/lng.ts PTWPermit.gasReadings 형태 (무수정, 로컬 미러) */
export interface LegacyGasReadings {
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm?: number;
  testedAt: string;
  isSafeForWork: boolean;
}

/** 기존 types/lng.ts CargoHandlingGasPoint (무수정, 로컬 미러) */
export interface LegacyCargoHandlingGasPoint {
  tagId: string;
  lelPercent: number;
  o2Percent: number;
  testedAt: string;
}

// ----------------------------------------------------------------------------
// 2. 서명 재사용 플래그 처리 (설계 결정 로그 반영)
// ----------------------------------------------------------------------------

/**
 * GasRetestEntryModal.tsx에 전용 서명 캡처 필드가 없어 기존 TESTER NAME/ID
 * 값을 서명으로 재사용할 때 사용하는 접두사. 이 접두사가 붙은 레코드만
 * 골라서 정식 전자서명 UI 도입 후 재서명 요청(needsResignature 배치)을 보낼 수 있다.
 */
export const LEGACY_SIGNATURE_REUSE_PREFIX = 'LEGACY_TESTER_ID_REUSED:';

export interface ResolvedSignature {
  agtSignature: string;
  isSignatureLegacyReused: boolean;
}

/**
 * 서명 값을 안전하게 확정한다.
 *   - dedicatedSignature가 있으면 그대로 사용 (정식 서명 UI 도입 이후 경로).
 *   - 없으면 testerIdentifier(기존 TESTER NAME/ID)를 접두사와 함께 재사용하고
 *     플래그를 true로 세팅한다.
 *   - 둘 다 없으면 에러 — DB의 agt_signature NOT NULL 제약을 애플리케이션
 *     레이어에서 먼저 걸러내기 위함이다.
 */
export function resolveAgtSignature(
  dedicatedSignature: string | null | undefined,
  testerIdentifier: string | null | undefined
): ResolvedSignature {
  if (dedicatedSignature && dedicatedSignature.trim().length > 0) {
    return { agtSignature: dedicatedSignature.trim(), isSignatureLegacyReused: false };
  }
  if (testerIdentifier && testerIdentifier.trim().length > 0) {
    return {
      agtSignature: `${LEGACY_SIGNATURE_REUSE_PREFIX}${testerIdentifier.trim()}`,
      isSignatureLegacyReused: true,
    };
  }
  throw new Error(
    'resolveAgtSignature: neither a dedicated signature nor a tester identifier was provided. ' +
      'permit_gas_tests.agt_signature is NOT NULL — cannot persist without one of these.'
  );
}

// ----------------------------------------------------------------------------
// 3. 레거시 → CMMS 레코드 변환 (순수 함수, side-effect 없음)
// ----------------------------------------------------------------------------

/**
 * PTWPermit.gasReadings(단일 시점) -> permit_gas_tests 1건.
 * dedicatedSignature가 없으면 testerIdentifier(TESTER NAME/ID)를 재사용하고
 * 플래그를 세운다 (GasRetestEntryModal.tsx 현재 구현과 정합).
 */
export function legacyGasReadingToCmmsRecord(
  permitRefNo: string,
  reading: LegacyGasReadings,
  testerIdentifier: string,
  testType: GasTestType = 'RETEST',
  dedicatedSignature?: string | null
): GasTestRecord {
  const { agtSignature, isSignatureLegacyReused } = resolveAgtSignature(dedicatedSignature, testerIdentifier);
  return {
    permitRefNo,
    testType,
    lelPercent: reading.lelPercent,
    o2Percent: reading.o2Percent,
    h2sPpm: reading.h2sPpm,
    coPpm: reading.coPpm,
    resultStatus: reading.isSafeForWork ? 'PASS' : 'FAIL',
    testedByAgt: testerIdentifier,
    agtSignature,
    isSignatureLegacyReused,
    testedAt: reading.testedAt,
  };
}

/**
 * Cargo Handling의 다중 포인트(gasReadingPoints[], T-201~T-204)를
 * 포인트별 permit_gas_tests 레코드로 1:1 변환한다. 첫 포인트는 INITIAL,
 * 이후는 RETEST로 분류한다 (Refactoring Plan §2.2 원안 유지).
 */
export function cargoHandlingPointsToCmmsRecords(
  permitRefNo: string,
  points: LegacyCargoHandlingGasPoint[],
  testerIdentifier: string,
  dedicatedSignature?: string | null
): GasTestRecord[] {
  const { agtSignature, isSignatureLegacyReused } = resolveAgtSignature(dedicatedSignature, testerIdentifier);
  return points.map((p, idx) => ({
    permitRefNo,
    testType: idx === 0 ? 'INITIAL' : 'RETEST',
    lelPercent: p.lelPercent,
    o2Percent: p.o2Percent,
    h2sPpm: 0,
    resultStatus: p.lelPercent === 0 ? 'PASS' : 'FAIL', // 실제 PASS 기준은 PTW 유형별 gasRestrictions 참조 필요 (Phase 1에서는 Hot Work류 0% 기준 임시 적용)
    testedByAgt: testerIdentifier,
    agtSignature,
    isSignatureLegacyReused,
    testedAt: p.testedAt,
  }));
}

// ----------------------------------------------------------------------------
// 4. 실제 영속화 (TODO(cmms-permit-gas-tests) 해소 지점)
// ----------------------------------------------------------------------------

const INSERT_GAS_TEST_SQL = `
  INSERT INTO permit_gas_tests
    (permit_ref_no, test_type, lel_percent, o2_percent, h2s_ppm, co_ppm,
     result_status, tested_by_agt, agt_signature, is_signature_legacy_reused, tested_at)
  VALUES
    (@permitRefNo, @testType, @lelPercent, @o2Percent, @h2sPpm, @coPpm,
     @resultStatus, @testedByAgt, @agtSignature, @isSignatureLegacyReused, @testedAt)
`;

/**
 * 단일 GasTestRecord를 permit_gas_tests에 적재한다.
 *
 * 이전 구현(console.info(...))을 대체하는 함수. permit_ref_no가
 * permit_lock_state에 먼저 존재해야 한다 (FK 제약) — 즉 STAGE_1 이상으로
 * 진입한 permit에 대해서만 가스측정 이력을 남길 수 있다.
 */
export function persistGasTestRecord(db: SqlExecutor, record: GasTestRecord): void {
  db.run(INSERT_GAS_TEST_SQL, {
    permitRefNo: record.permitRefNo,
    testType: record.testType,
    lelPercent: record.lelPercent,
    o2Percent: record.o2Percent,
    h2sPpm: record.h2sPpm,
    coPpm: record.coPpm ?? null,
    resultStatus: record.resultStatus,
    testedByAgt: record.testedByAgt,
    agtSignature: record.agtSignature,
    isSignatureLegacyReused: record.isSignatureLegacyReused ? 1 : 0,
    testedAt: record.testedAt,
  });
}

export function persistGasTestRecords(db: SqlExecutor, records: GasTestRecord[]): void {
  for (const r of records) persistGasTestRecord(db, r);
}

// ----------------------------------------------------------------------------
// 5. 통합 오케스트레이터 — GasRetestEntryModal.tsx 호출부 교체 대상
// ----------------------------------------------------------------------------

/**
 * GasRetestEntryModal.tsx의 제출 핸들러가 호출해야 하는 단일 진입점.
 * 기존에 console.info로 로깅하던 자리를 이 함수 호출로 교체하면 된다
 * (모달 컴포넌트 자체의 마크업/상태관리 로직은 무수정).
 *
 *   [교체 전] console.info('[TODO cmms-permit-gas-tests]', reading);
 *   [교체 후] recordLegacyGasReading(db, permit.id, reading, testerIdentifier);
 */
export function recordLegacyGasReading(
  db: SqlExecutor,
  permitRefNo: string,
  reading: LegacyGasReadings,
  testerIdentifier: string,
  testType: GasTestType = 'RETEST',
  dedicatedSignature?: string | null
): GasTestRecord {
  const record = legacyGasReadingToCmmsRecord(permitRefNo, reading, testerIdentifier, testType, dedicatedSignature);
  persistGasTestRecord(db, record);
  return record;
}

/** Cargo Handling 다중 포인트 버전 진입점 (CargoHandlingPermitForm.tsx 제출 핸들러용) */
export function recordCargoHandlingGasPoints(
  db: SqlExecutor,
  permitRefNo: string,
  points: LegacyCargoHandlingGasPoint[],
  testerIdentifier: string,
  dedicatedSignature?: string | null
): GasTestRecord[] {
  const records = cargoHandlingPointsToCmmsRecords(permitRefNo, points, testerIdentifier, dedicatedSignature);
  persistGasTestRecords(db, records);
  return records;
}

// ----------------------------------------------------------------------------
// 6. 재서명 요청 대상 조회 헬퍼 (정식 서명 UI 도입 시 사용)
// ----------------------------------------------------------------------------

export interface NeedsResignatureRow {
  gas_test_id: number;
  permit_ref_no: string;
  tested_by_agt: string;
  agt_signature: string;
  tested_at: string;
}

/** is_signature_legacy_reused=1인 레코드만 조회 — 재서명 요청 배치의 소스 쿼리 */
export function findRecordsNeedingResignature(db: SqlExecutor): NeedsResignatureRow[] {
  return db.all<NeedsResignatureRow>(
    `SELECT gas_test_id, permit_ref_no, tested_by_agt, agt_signature, tested_at
     FROM permit_gas_tests
     WHERE is_signature_legacy_reused = 1
     ORDER BY tested_at DESC`
  );
}
