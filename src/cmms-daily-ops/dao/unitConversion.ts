// src/cmms-daily-ops/dao/unitConversion.ts
//
// PURPOSE
//   순수 단위 변환 함수. daily-ops 스키마 어디에도 mscf 컬럼을 두지 않고
//   기존 MMCF 저장값(GasQualityMasterRecord 컨벤션, lng-process-data-map.md
//   Answer A)에서 읽을 때마다 계산한다 — 저장 컬럼을 늘리면 두 값이 어긋날
//   위험이 생기므로 이를 피하기 위함(data map §5 항목 #5).

/** 1 MMCF = 1000 MSCF. */
export function mscfFromMmcf(mmcf: number): number {
  return mmcf * 1000;
}
