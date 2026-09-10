// src/adapters/gasSafetyAdapter.ts
//
// PURPOSE
//   PTW 가스 재측정 기록(GasTestRecordDraft)의 저장/조회 전담 어댑터.
//   2026-09-10 이전에는 서버 프로세스 인메모리 배열이었으나(서버 재시작 시
//   소멸), 이번 작업부터 src/adapters/db/gasTestDao.ts를 통해 실제 SQLite
//   permit_gas_tests 테이블에 영속화한다(src/adapters/db/cmmsDbSingleton.ts —
//   node:sqlite 기반, src/adapters/db/sqlExecutor.ts 인터페이스 재사용).
//
// NON-GOALS / 중복 방지
//   - 레거시 입력(GasRetestEntryModal의 LEL/O2/H2S)을 GasTestRecordDraft로
//     변환하는 로직은 이미 src/adapters/ptwFormAdapter.ts::toGasTestRecordDraft가
//     제공한다(SSOT 게이트 validatePTWGasSafety 재사용). 이 파일은 그 변환을
//     다시 구현하지 않고, draft를 "저장/조회"하는 책임만 진다.
//   - GasTestingLogTab.tsx(Zone AGT 레지스터, SOP NP08-15)와는 무관한
//     별도 도메인이다 — 이 어댑터는 PTW permit(permitRefNo) 단위 이력만 다룬다.
//   - PTW PASS/FAIL 게이트 판정의 SSOT는 여전히 client-side validatePTWGasSafety다.
//     이 어댑터는 이미 계산된 resultStatus/blockReason을 그대로 저장할 뿐,
//     재검증하지 않는다(src/app/api/v1/cmms/gas-tests/route.ts 헤더 참고).

import { getCmmsDb } from './db/cmmsDbSingleton';
import { insertGasTestRecord, selectGasTestRecordsByPermit, selectAllGasTestRecords } from './db/gasTestDao';
import type { GasTestRecordDraft } from './ptwFormAdapter';

/** GasRetestEntryModal 제출 → ptwFormAdapter.toGasTestRecordDraft() 변환 직후 호출되는 쓰기 진입점. */
export function recordGasTestDraft(draft: GasTestRecordDraft): void {
  insertGasTestRecord(getCmmsDb(), draft);
}

/** 특정 permit(permitRefNo)에 기록된 CMMS 레코드만 조회 (최신순). */
export function getGasTestRecordsForPermit(permitRefNo: string): GasTestRecordDraft[] {
  return selectGasTestRecordsByPermit(getCmmsDb(), permitRefNo);
}

/** 전체 CMMS 레코드 조회 — 향후 dual-read 정합성 검증/마이그레이션용. */
export function getAllGasTestRecords(): GasTestRecordDraft[] {
  return selectAllGasTestRecords(getCmmsDb());
}
