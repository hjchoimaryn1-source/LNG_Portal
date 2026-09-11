// src/adapters/overviewSummaryAdapter.ts
//
// PURPOSE
//   Overview 대시보드 요약 API 전담 어댑터. src/adapters/workOrderDbAdapter.ts와
//   동일 패턴 — src/adapters/db/overviewSummaryDao.ts(순수 집계 DAO) + 각 도메인의
//   기존 select-all DAO(assetDao/workOrderDao/ptwPermitDao/ptwSignatureDao/
//   gasTestDao/mroInventoryDao) + cmmsDbSingleton(node:sqlite 연결)을 재사용한다.
//   이 어댑터는 그 결과들을 패널/카드용 응답 객체 하나로 조립하는 책임만 진다 —
//   새 테이블이나 새 DAO를 만들지 않는다.
//
// SCOPE
//   Pending Approvals 목록은 evaluateSignatureGate(PTWPermit 전용, ptwSignatureGate.ts)를
//   재구현하지 않고, 같은 SSOT인 PTW_TRANSITION_REQUIRED_ROLES(data/ptwSignatureRoles.ts)를
//   직접 참조해 "현재 status -> 다음 status 전이에 필요한 서명 중 미서명" 목록만 파생한다.
//   각 패널은 화면 밀도를 위해 최대 PANEL_ROW_LIMIT행으로 자른다.

import { getCmmsDb } from './db/cmmsDbSingleton';
import {
  selectWorkOrderStatusCounts,
  selectPtwPermitStatusCounts,
  selectRecentGasTestAlertCount,
  selectLowStockPartCount,
  type WorkOrderStatusCounts,
  type PtwPermitStatusCounts,
} from './db/overviewSummaryDao';
import { selectAllAssets } from './db/assetDao';
import { selectAllWorkOrders, type WorkOrderRecord } from './db/workOrderDao';
import { selectAllPermitLifecycle, type PTWPermitLifecycleDraft } from './db/ptwPermitDao';
import { selectAllSignaturesByPermit } from './db/ptwSignatureDao';
import { selectRecentGasTestRecords } from './db/gasTestDao';
import { selectAllParts, type MroPartRecord } from './db/mroInventoryDao';
import type { GasTestRecordDraft } from './ptwFormAdapter';
import { PTW_TRANSITION_REQUIRED_ROLES } from '../data/ptwSignatureRoles';
import type { PTWSignatureRole, PTWWorkflowStatus } from '../types/lng';
import type { SqlExecutor } from './db/sqlExecutor';

export interface AssetStatusCounts {
  total: number;
  operational: number;
  maintenance: number;
  standby: number;
  outOfService: number;
}

export interface PendingApprovalItem {
  permitId: string;
  currentStatus: PTWWorkflowStatus;
  targetStatus: PTWWorkflowStatus;
  missingRoles: PTWSignatureRole[];
}

export interface OverviewSummary {
  assets: AssetStatusCounts;
  workOrders: WorkOrderStatusCounts;
  ptwPermits: PtwPermitStatusCounts;
  gasTestAlerts: { count: number; windowHours: number };
  mroLowStock: { count: number };
  pendingApprovals: PendingApprovalItem[];
  recentGasAlerts: GasTestRecordDraft[];
  activeWorkOrders: WorkOrderRecord[];
  activePermits: PTWPermitLifecycleDraft[];
  lowStockParts: MroPartRecord[];
}

const GAS_ALERT_WINDOW_HOURS = 24;
const PANEL_ROW_LIMIT = 15;

/** 5단계 lifecycle의 다음 전이 목표 status. CLOSED는 종단이라 다음 단계가 없다. */
const NEXT_PTW_STATUS: Record<PTWWorkflowStatus, PTWWorkflowStatus | null> = {
  DRAFT: 'PREPARED',
  PREPARED: 'APPROVED',
  APPROVED: 'ACTIVE',
  ACTIVE: 'CLOSED',
  CLOSED: null,
};

function computeAssetStatusCounts(db: SqlExecutor): AssetStatusCounts {
  const assets = selectAllAssets(db);
  const counts: AssetStatusCounts = { total: assets.length, operational: 0, maintenance: 0, standby: 0, outOfService: 0 };
  for (const asset of assets) {
    if (asset.status === 'OPERATIONAL') counts.operational += 1;
    else if (asset.status === 'MAINTENANCE') counts.maintenance += 1;
    else if (asset.status === 'STANDBY') counts.standby += 1;
    else if (asset.status === 'OUT_OF_SERVICE') counts.outOfService += 1;
  }
  return counts;
}

/** PART A/B(서명 불필요)는 PTW_TRANSITION_REQUIRED_ROLES에 없으므로 자동 제외된다. */
function computePendingApprovals(db: SqlExecutor): PendingApprovalItem[] {
  const permits = selectAllPermitLifecycle(db);
  const signaturesByPermit = selectAllSignaturesByPermit(db);
  const items: PendingApprovalItem[] = [];
  for (const permit of permits) {
    const targetStatus = NEXT_PTW_STATUS[permit.status];
    if (!targetStatus) continue;
    const requiredRoles = PTW_TRANSITION_REQUIRED_ROLES[targetStatus];
    if (!requiredRoles || requiredRoles.length === 0) continue;
    const signedRoles = new Set((signaturesByPermit.get(permit.permitId) ?? []).map((s) => s.role));
    const missingRoles = requiredRoles.filter((role) => !signedRoles.has(role));
    if (missingRoles.length > 0) {
      items.push({ permitId: permit.permitId, currentStatus: permit.status, targetStatus, missingRoles });
    }
  }
  return items.slice(0, PANEL_ROW_LIMIT);
}

/** 최근 GAS_ALERT_WINDOW_HOURS 내 전체 기록(PASS/FAIL 모두) — 패널의 "Last 24H"/
 *  "Critical Non-Conformances Only" 토글이 클라이언트에서 걸러 쓴다. */
function computeRecentGasAlerts(db: SqlExecutor): GasTestRecordDraft[] {
  return selectRecentGasTestRecords(db, GAS_ALERT_WINDOW_HOURS).slice(0, PANEL_ROW_LIMIT);
}

/** Overview 대시보드 요약 카드 + 4개 패널용 스냅샷을 조립한다. */
export function getOverviewSummary(): OverviewSummary {
  const db = getCmmsDb();

  const activeWorkOrders = selectAllWorkOrders(db)
    .filter((wo) => wo.status !== 'COMPLETED')
    .slice(0, PANEL_ROW_LIMIT);
  const activePermits = selectAllPermitLifecycle(db).filter((p) => p.status === 'ACTIVE');
  const lowStockParts = selectAllParts(db)
    .filter((p) => p.currentStockQty <= p.minStockQty)
    .sort((a, b) => a.currentStockQty - b.currentStockQty)
    .slice(0, PANEL_ROW_LIMIT);

  return {
    assets: computeAssetStatusCounts(db),
    workOrders: selectWorkOrderStatusCounts(db),
    ptwPermits: selectPtwPermitStatusCounts(db),
    gasTestAlerts: {
      count: selectRecentGasTestAlertCount(db, GAS_ALERT_WINDOW_HOURS),
      windowHours: GAS_ALERT_WINDOW_HOURS,
    },
    mroLowStock: { count: selectLowStockPartCount(db) },
    pendingApprovals: computePendingApprovals(db),
    recentGasAlerts: computeRecentGasAlerts(db),
    activeWorkOrders,
    activePermits,
    lowStockParts,
  };
}
