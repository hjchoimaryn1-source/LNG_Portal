// src/utils/workOrderRecordMapper.ts
//
// PURPOSE
//   WOItem(프론트엔드, mockWorkOrderGenerator.ts 산출물)과 WorkOrderRecord
//   (src/adapters/db/workOrderDao.ts, SQLite work_orders 테이블 DTO) 간의
//   변환을 전담하는 순수 함수 계층. React 바인딩 없음.
//
// SCOPE
//   work_orders 테이블에는 category/type/priority/tech/permitRefNo 컬럼이
//   없다(schema/cmms_schema.sqlite.sql §work_orders). 이 필드들은 여전히
//   mockWorkOrderGenerator.ts가 자산 criticality로부터 결정론적으로 파생하며,
//   이 매퍼는 DB가 SSOT인 status/next_due_date만 WOItem에 덮어쓴다.

import type { NewWorkOrderInput, WorkOrderRecord } from '../adapters/db/workOrderDao';
import type { WOItem } from '../types/lng';

/** 장식적 WOItem(파생 필드 포함)을 최초 시딩용 NewWorkOrderInput으로 축약한다. */
export function toNewWorkOrderInput(item: WOItem): NewWorkOrderInput {
  return {
    workOrderId: item.wo,
    assetTag: item.tag,
    title: item.desc,
    pmCycleDays: null,
    lastPerformedAt: null,
    status: item.status,
  };
}

/**
 * DB 레코드(status/nextDueDate = SSOT)를 장식적 WOItem에 덮어쓴다.
 * workOrderId가 일치하지 않으면(아직 시딩되지 않은 항목) 원본 item을 그대로 반환한다.
 */
export function applyRecordToItem(item: WOItem, record: WorkOrderRecord | undefined): WOItem {
  if (!record || record.workOrderId !== item.wo) return item;
  return {
    ...item,
    status: record.status,
    due: record.nextDueDate ?? item.due,
  };
}
