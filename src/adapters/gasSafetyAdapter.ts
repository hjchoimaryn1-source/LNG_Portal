// src/adapters/gasSafetyAdapter.ts
//
// PURPOSE
//   phase1/src/adapters/gasSafetyAdapter.ts(SqlExecutor 기반 permit_gas_tests
//   INSERT 어댑터)는 2026-09-10 리팩터링 커밋에서 phase1/ 전체와 함께
//   삭제되었고, 이 프로젝트에는 실행 중인 SQL DB 레이어가 없다
//   (src/adapters/db/sqlExecutor.ts 참고 — 인터페이스 + 테스트용 fake만 존재).
//   이 파일은 그 삭제된 어댑터를 "그대로" 복원하지 않고, 실제로 동작 가능한
//   인메모리 스냅샷 저장소로 재작성한다.
//
// NON-GOALS / 중복 방지
//   - 레거시 입력(GasRetestEntryModal의 LEL/O2/H2S)을 GasTestRecordDraft로
//     변환하는 로직은 이미 src/adapters/ptwFormAdapter.ts::toGasTestRecordDraft가
//     제공한다(SSOT 게이트 validatePTWGasSafety 재사용). 이 파일은 그 변환을
//     다시 구현하지 않고, draft를 "저장/조회"하는 책임만 진다.
//   - GasTestingLogTab.tsx(Zone AGT 레지스터, SOP NP08-15)와는 무관한
//     별도 도메인이다 — 이 어댑터는 PTW permit(permitRefNo) 단위 이력만 다룬다.

import type { GasTestRecordDraft } from './ptwFormAdapter';

// 페이지 새로고침 시 초기화되는 모듈 스코프 인메모리 스냅샷.
// usePTWPermits()의 permits 배열과 동일한 수명 주기(인메모리, 비영속)를 가지며,
// 실제 CMMS SQL 레이어가 연결되면 이 저장소를 SqlExecutor 기반 구현으로
// 교체하면 된다(이 파일을 소비하는 쪽의 시그니처는 바뀌지 않는다).
const gasTestRecordStore: GasTestRecordDraft[] = [];

/** GasRetestEntryModal 제출 → ptwFormAdapter.toGasTestRecordDraft() 변환 직후 호출되는 쓰기 진입점. */
export function recordGasTestDraft(draft: GasTestRecordDraft): void {
  gasTestRecordStore.push(draft);
}

/** 특정 permit(permitRefNo)에 기록된 CMMS shadow 레코드만 조회 (최신순). */
export function getGasTestRecordsForPermit(permitRefNo: string): GasTestRecordDraft[] {
  return gasTestRecordStore.filter((r) => r.permitRefNo === permitRefNo).reverse();
}

/** 전체 CMMS shadow 레코드 조회 — 향후 dual-read 정합성 검증/마이그레이션용. */
export function getAllGasTestRecords(): GasTestRecordDraft[] {
  return [...gasTestRecordStore];
}
