// src/adapters/overviewSummaryAdapter.ts
//
// PURPOSE
//   Overview 대시보드 요약 API 전담 어댑터. src/adapters/workOrderDbAdapter.ts와
//   동일 패턴 — src/adapters/db/overviewSummaryDao.ts(순수 DAO) + cmmsDbSingleton
//   (node:sqlite 연결)을 재사용한다. 이 어댑터는 4개 DAO 집계 결과를 하나의
//   응답 객체로 조립하는 책임만 진다.

import { getCmmsDb } from './db/cmmsDbSingleton';
import {
  selectWorkOrderStatusCounts,
  selectPtwPermitStatusCounts,
  selectRecentGasTestAlertCount,
  selectLowStockPartCount,
  type WorkOrderStatusCounts,
  type PtwPermitStatusCounts,
} from './db/overviewSummaryDao';

export interface OverviewSummary {
  workOrders: WorkOrderStatusCounts;
  ptwPermits: PtwPermitStatusCounts;
  gasTestAlerts: { count: number; windowHours: number };
  mroLowStock: { count: number };
}

const GAS_ALERT_WINDOW_HOURS = 24;

/** Overview 대시보드 요약 카드용 집계 스냅샷을 조립한다. */
export function getOverviewSummary(): OverviewSummary {
  const db = getCmmsDb();
  return {
    workOrders: selectWorkOrderStatusCounts(db),
    ptwPermits: selectPtwPermitStatusCounts(db),
    gasTestAlerts: {
      count: selectRecentGasTestAlertCount(db, GAS_ALERT_WINDOW_HOURS),
      windowHours: GAS_ALERT_WINDOW_HOURS,
    },
    mroLowStock: { count: selectLowStockPartCount(db) },
  };
}
