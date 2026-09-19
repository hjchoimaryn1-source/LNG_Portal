// src/cmms-daily-ops/components/patrol/patrolFormTypes.ts
//
// PURPOSE
//   B1 폼 6종(MeteringPatrolForm/AavPatrolForm/N2SkidPatrolForm/GcPatrolForm/
//   ElectricalPatrolForm + AavUnitBlock)이 공유하는 저장 콜백 시그니처와
//   초기값 헬퍼. 각 폼 파일을 250줄 캡 이내로 유지하기 위해 분리했다
//   (원 지시에는 없던 파일 — 명시된 6개 폼이 동일한 저장 시그니처를 반복
//   정의하는 걸 피하기 위한 최소 범위의 추가, deviation note 참고).

import type { PatrolFieldSpec } from '../../dao/patrolFieldMaps';
import type { PatrolValues } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';

export interface PatrolSaveInput {
  equipmentTag: string;
  shiftTimeSlot: ShiftTimeSlot;
  values: PatrolValues;
  readingStatus: ReadingStatus;
  remarkText: string | null;
}

/** B1 폼은 실제 저장(API/DAO) 방법을 모른다 — 부모가 주입하는 순수 콜백만 호출한다. */
export type PatrolSaveHandler = (input: PatrolSaveInput) => void;

/** 지정된 필드 명세의 모든 컬럼을 null로 초기화한 values 객체를 만든다. */
export function emptyPatrolValues(specs: PatrolFieldSpec[]): PatrolValues {
  const values: PatrolValues = {};
  for (const spec of specs) values[spec.columnName] = null;
  return values;
}
