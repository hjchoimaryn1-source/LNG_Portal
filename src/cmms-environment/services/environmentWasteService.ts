// src/cmms-environment/services/environmentWasteService.ts
//
// PURPOSE
//   Chapter 2(폐기물 관리) 순수 계산 함수 모음. DB/React 바인딩 없음
//   (src/cmms-mro-bridge/rop/calculateReorderPoint.ts와 동일한 순수함수
//   격리 패턴). THWS 처리기한 로직은 environmentMonitoringService.ts의
//   getThwsDaysRemaining과 개념적으로 연결되지만, 두 서비스 파일은 서로
//   import하지 않고 각자 독립적으로 날짜 차이를 계산한다(Ch1/Ch2 서비스
//   경계를 넘는 결합을 피하기 위함 — sign-off 문서에 편차로 기록).

/**
 * THWS 처리기한 대비 오늘 날짜로 상태를 판정한다. DISPOSED는 이 함수의
 * 책임이 아니다(사람이 명시적으로 처리 완료 처리한 경우에만 DAO에서 별도
 * updateThwsStatus로 반영) — 여기서는 기한 경과 여부만 IN_STORAGE/OVERDUE로
 * 구분한다.
 */
export function computeThwsStatus(disposalDueDate: string, today: string): 'IN_STORAGE' | 'OVERDUE' {
  const due = new Date(disposalDueDate).getTime();
  const now = new Date(today).getTime();
  return now > due ? 'OVERDUE' : 'IN_STORAGE';
}

export interface WasteCategoryLog {
  wasteCategory: 'HAZARDOUS' | 'NON_HAZARDOUS';
  quantityKg: number;
}

export interface WasteCategoryAggregate {
  hazardousKg: number;
  nonHazardousKg: number;
}

/** 폐기물 이송 로그 배열을 유해/비유해로 합산한다. 빈 배열이면 0/0을 반환한다. */
export function aggregateWasteByCategory(logs: WasteCategoryLog[]): WasteCategoryAggregate {
  return logs.reduce<WasteCategoryAggregate>(
    (acc, log) => {
      if (log.wasteCategory === 'HAZARDOUS') {
        acc.hazardousKg += log.quantityKg;
      } else {
        acc.nonHazardousKg += log.quantityKg;
      }
      return acc;
    },
    { hazardousKg: 0, nonHazardousKg: 0 }
  );
}
