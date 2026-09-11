// src/utils/gasThresholdSeverity.ts
//
// PURPOSE
//   Gas Safety Alert Log 패널(표시 전용) 임계치 분류 순수 함수. permits 워크플로우의
//   PASS/FAIL 게이트(validatePTWGasSafety, data/ptwMasterData.ts)는 재구현하지 않는다 —
//   이 함수는 SCADA 경고 배지용 개별 컬럼 breach만 판정한다.

export interface GasReadingLike {
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm: number;
}

export interface GasThresholdBreach {
  o2Breach: boolean;
  lelBreach: boolean;
  h2sBreach: boolean;
  coBreach: boolean;
  isCritical: boolean;
}

const O2_MIN_PERCENT = 19.5;
const O2_MAX_PERCENT = 23.5;
const LEL_MAX_PERCENT = 10;
const H2S_MAX_PPM = 10;
const CO_MAX_PPM = 25;

/** O2<19.5%/>23.5%, LEL>10%, H2S>10ppm, CO>25ppm 임계치 breach를 컬럼별로 분류한다. */
export function classifyGasThresholdBreach(reading: GasReadingLike): GasThresholdBreach {
  const o2Breach = reading.o2Percent < O2_MIN_PERCENT || reading.o2Percent > O2_MAX_PERCENT;
  const lelBreach = reading.lelPercent > LEL_MAX_PERCENT;
  const h2sBreach = reading.h2sPpm > H2S_MAX_PPM;
  const coBreach = reading.coPpm > CO_MAX_PPM;

  return {
    o2Breach,
    lelBreach,
    h2sBreach,
    coBreach,
    isCritical: o2Breach || lelBreach || h2sBreach || coBreach,
  };
}
