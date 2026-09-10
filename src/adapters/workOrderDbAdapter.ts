// src/adapters/workOrderDbAdapter.ts
//
// PURPOSE
//   work_orders 테이블 영속화 전담 어댑터. src/adapters/gasSafetyAdapter.ts와
//   동일 패턴 — src/adapters/db/workOrderDao.ts(순수 DAO) + cmmsDbSingleton
//   (node:sqlite 연결)을 재사용하며, WOItem<->WorkOrderRecord 변환은 하지 않는다
//   (그 책임은 src/utils/workOrderRecordMapper.ts).
//
// NON-GOALS
//   - category/priority/tech/permitRefNo 파생은 여전히 mockWorkOrderGenerator.ts
//     소관이다. 이 어댑터는 work_orders 테이블 컬럼(status/next_due_date 등)만 다룬다.

import { getCmmsDb } from './db/cmmsDbSingleton';
import {
  insertWorkOrder,
  selectAllWorkOrders,
  updateWorkOrderPerformance,
  type NewWorkOrderInput,
  type WorkOrderRecord,
  type WorkOrderStatus,
} from './db/workOrderDao';

/** 전체 WO 레코드 조회 (최신 생성순). */
export function getAllWorkOrderRecords(): WorkOrderRecord[] {
  return selectAllWorkOrders(getCmmsDb());
}

/**
 * work_orders 테이블이 비어있을 때만 inputs를 시딩한다(이미 데이터가 있으면 no-op).
 * 시딩 여부와 무관하게 최종 상태의 전체 레코드를 반환한다.
 */
export function seedWorkOrdersIfEmpty(inputs: NewWorkOrderInput[]): WorkOrderRecord[] {
  const db = getCmmsDb();
  const existing = selectAllWorkOrders(db);
  if (existing.length > 0) return existing;

  for (const input of inputs) {
    insertWorkOrder(db, input);
  }
  return selectAllWorkOrders(db);
}

/** WO 수행 완료(또는 지정 상태로) 기록 — DAO의 next_due_date 재계산 단축 경로를 그대로 노출. */
export function markWorkOrderPerformed(
  workOrderId: string,
  lastPerformedAt: string,
  status: WorkOrderStatus = 'COMPLETED'
): WorkOrderRecord | undefined {
  return updateWorkOrderPerformance(getCmmsDb(), workOrderId, lastPerformedAt, status);
}
