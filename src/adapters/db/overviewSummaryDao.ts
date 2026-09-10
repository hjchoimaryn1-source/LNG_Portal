// src/adapters/db/overviewSummaryDao.ts
//
// PURPOSE
//   Overview 대시보드 요약 카드용 순수 DAO. SqlExecutor에만 의존하며 React/Next
//   바인딩이 없다. work_orders/ptw_permits/permit_gas_tests/mro_parts 4개
//   테이블에 대한 읽기 전용 집계만 담당하고, 각 테이블의 쓰기 경로는 이미
//   존재하는 workOrderDao/ptwPermitDao/gasTestDao/mroInventoryDao 소관이다
//   (여기서 재구현하지 않는다).
//
// SCOPE
//   work_orders.status에는 'OVERDUE'가 없다(CHECK 제약: SCHEDULED/IN_PROGRESS/
//   PARTS_PENDING/COMPLETED) — next_due_date < now AND status != 'COMPLETED'로
//   파생한다. ptw_permits.status는 실제 5단계(DRAFT/PREPARED/APPROVED/ACTIVE/
//   CLOSED)를 그대로 집계한다(ISSUED/COMPLETED는 존재하지 않는 값이라 만들지 않음).

import type { SqlExecutor } from './sqlExecutor';
import type { WorkOrderStatus } from './workOrderDao';
import type { PTWWorkflowStatus } from '../../types/lng';

export type WorkOrderStatusCounts = Record<WorkOrderStatus, number> & { OVERDUE: number };
export type PtwPermitStatusCounts = Record<PTWWorkflowStatus, number>;

interface StatusCountRow {
  status: string;
  cnt: number;
}

const WO_STATUS_COUNTS_SQL = `
  SELECT status, COUNT(*) AS cnt FROM work_orders GROUP BY status
`;

const WO_OVERDUE_COUNT_SQL = `
  SELECT COUNT(*) AS cnt FROM work_orders
  WHERE status != 'COMPLETED' AND next_due_date IS NOT NULL
    AND next_due_date < STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
`;

const PTW_STATUS_COUNTS_SQL = `
  SELECT status, COUNT(*) AS cnt FROM ptw_permits GROUP BY status
`;

const GAS_TEST_ALERT_COUNT_SQL = `
  SELECT COUNT(*) AS cnt FROM permit_gas_tests
  WHERE result_status = 'FAIL'
    AND tested_at >= STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now', @windowClause)
`;

const MRO_LOW_STOCK_COUNT_SQL = `
  SELECT COUNT(*) AS cnt FROM mro_parts WHERE current_stock_qty <= min_stock_qty
`;

const WO_STATUSES: WorkOrderStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'PARTS_PENDING', 'COMPLETED'];
const PTW_STATUSES: PTWWorkflowStatus[] = ['DRAFT', 'PREPARED', 'APPROVED', 'ACTIVE', 'CLOSED'];

/** work_orders를 status별로 집계하고, next_due_date 기준 OVERDUE를 별도 파생한다. */
export function selectWorkOrderStatusCounts(db: SqlExecutor): WorkOrderStatusCounts {
  const rows = db.all<StatusCountRow>(WO_STATUS_COUNTS_SQL);
  const counts = Object.fromEntries(WO_STATUSES.map((s) => [s, 0])) as WorkOrderStatusCounts;
  for (const row of rows) {
    if (WO_STATUSES.includes(row.status as WorkOrderStatus)) {
      counts[row.status as WorkOrderStatus] = row.cnt;
    }
  }
  const overdue = db.get<StatusCountRow>(WO_OVERDUE_COUNT_SQL);
  counts.OVERDUE = overdue?.cnt ?? 0;
  return counts;
}

/** ptw_permits를 실제 5단계 lifecycle status별로 집계한다. */
export function selectPtwPermitStatusCounts(db: SqlExecutor): PtwPermitStatusCounts {
  const rows = db.all<StatusCountRow>(PTW_STATUS_COUNTS_SQL);
  const counts = Object.fromEntries(PTW_STATUSES.map((s) => [s, 0])) as PtwPermitStatusCounts;
  for (const row of rows) {
    if (PTW_STATUSES.includes(row.status as PTWWorkflowStatus)) {
      counts[row.status as PTWWorkflowStatus] = row.cnt;
    }
  }
  return counts;
}

/** 최근 windowHours 시간 내 FAIL 판정된 가스 측정 건수. */
export function selectRecentGasTestAlertCount(db: SqlExecutor, windowHours = 24): number {
  const row = db.get<StatusCountRow>(GAS_TEST_ALERT_COUNT_SQL, { windowClause: `-${windowHours} hours` });
  return row?.cnt ?? 0;
}

/** current_stock_qty가 min_stock_qty 이하인 부품 수. */
export function selectLowStockPartCount(db: SqlExecutor): number {
  const row = db.get<StatusCountRow>(MRO_LOW_STOCK_COUNT_SQL);
  return row?.cnt ?? 0;
}
