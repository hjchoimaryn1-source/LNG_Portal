// src/adapters/db/workOrderDao.ts
//
// PURPOSE
//   work_orders 테이블에 대한 순수 DAO. SqlExecutor에만 의존하며 React/Next
//   바인딩이 없다. pm_cycle_days/last_performed_at으로부터 next_due_date를
//   재계산하는 책임은 src/utils/pmScheduleCalculator.ts에 위임한다(중복 금지).
//
// SCOPE
//   이 파일은 "work_orders" 테이블(CMMS_Architecture.md §4.4의 축약형 — PM
//   주기를 별도 pm_schedules 테이블로 분리하지 않고 work_orders 행에 직접
//   둔다)만 다룬다. 프론트엔드가 현재 쓰는 WOItem(types/lng.ts, mock 생성기
//   mockWorkOrderGenerator.ts 산출물)과는 필드명/개수가 다른 별도 DTO
//   (WorkOrderRecord)이며, 이 파일은 WOItem <-> WorkOrderRecord 변환이나
//   API route/UI 배선을 제공하지 않는다 — 별도 작업 범위.

import type { SqlExecutor } from './sqlExecutor';
import { computeNextDueDate } from '../../utils/pmScheduleCalculator';

export type WorkOrderStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PARTS_PENDING' | 'COMPLETED';

export interface WorkOrderRecord {
  workOrderId: string;
  assetTag: string;
  title: string;
  pmCycleDays: number | null;
  lastPerformedAt: string | null;
  nextDueDate: string | null;
  status: WorkOrderStatus;
  createdAt: string;
  /** Phase10 Stage1A 추가 컬럼. Stage1C evaluateSafetyGateRules() 판정 결과 — 생성 시점에만 세팅된다. */
  isPtwRequired: boolean;
}

export interface NewWorkOrderInput {
  workOrderId: string;
  assetTag: string;
  title: string;
  pmCycleDays?: number | null;
  lastPerformedAt?: string | null;
  status?: WorkOrderStatus;
  /** src/cmms-mro-bridge/safetyGate/evaluateSafetyGateRules.ts 판정 결과. 미지정 시 false. */
  isPtwRequired?: boolean;
}

export interface WorkOrderUpdateInput {
  assetTag: string;
  title: string;
  pmCycleDays: number | null;
  lastPerformedAt: string | null;
  status: WorkOrderStatus;
}

interface WorkOrderRow {
  work_order_id: string;
  asset_tag: string;
  title: string;
  pm_cycle_days: number | null;
  last_performed_at: string | null;
  next_due_date: string | null;
  status: string;
  created_at: string;
  is_ptw_required: number;
}

const INSERT_SQL = `
  INSERT INTO work_orders (
    work_order_id, asset_tag, title, pm_cycle_days, last_performed_at, next_due_date, status, is_ptw_required
  ) VALUES (
    @workOrderId, @assetTag, @title, @pmCycleDays, @lastPerformedAt, @nextDueDate, @status, @isPtwRequired
  )
`;

const UPDATE_SQL = `
  UPDATE work_orders SET
    asset_tag = @assetTag,
    title = @title,
    pm_cycle_days = @pmCycleDays,
    last_performed_at = @lastPerformedAt,
    next_due_date = @nextDueDate,
    status = @status
  WHERE work_order_id = @workOrderId
`;

const UPDATE_PERFORMANCE_SQL = `
  UPDATE work_orders SET
    last_performed_at = @lastPerformedAt,
    next_due_date = @nextDueDate,
    status = @status
  WHERE work_order_id = @workOrderId
`;

const DELETE_SQL = `DELETE FROM work_orders WHERE work_order_id = @workOrderId`;

const SELECT_BY_ID_SQL = `SELECT * FROM work_orders WHERE work_order_id = @workOrderId`;
const SELECT_BY_ASSET_SQL = `SELECT * FROM work_orders WHERE asset_tag = @assetTag ORDER BY created_at DESC`;
const SELECT_BY_STATUS_SQL = `SELECT * FROM work_orders WHERE status = @status ORDER BY next_due_date ASC`;
const SELECT_ALL_SQL = `SELECT * FROM work_orders ORDER BY created_at DESC`;

function rowToRecord(row: WorkOrderRow): WorkOrderRecord {
  return {
    workOrderId: row.work_order_id,
    assetTag: row.asset_tag,
    title: row.title,
    pmCycleDays: row.pm_cycle_days,
    lastPerformedAt: row.last_performed_at,
    nextDueDate: row.next_due_date,
    status: row.status as WorkOrderStatus,
    createdAt: row.created_at,
    isPtwRequired: row.is_ptw_required === 1,
  };
}

/** 신규 WO를 INSERT한다. pm_cycle_days/last_performed_at이 모두 있으면 next_due_date를 즉시 계산해 저장한다. */
export function insertWorkOrder(db: SqlExecutor, input: NewWorkOrderInput): void {
  const pmCycleDays = input.pmCycleDays ?? null;
  const lastPerformedAt = input.lastPerformedAt ?? null;
  db.run(INSERT_SQL, {
    workOrderId: input.workOrderId,
    assetTag: input.assetTag,
    title: input.title,
    pmCycleDays,
    lastPerformedAt,
    nextDueDate: computeNextDueDate(lastPerformedAt, pmCycleDays),
    status: input.status ?? 'SCHEDULED',
    isPtwRequired: input.isPtwRequired ? 1 : 0,
  });
}

/** WO의 일반 필드를 갱신한다. pm_cycle_days/last_performed_at 변경 시 next_due_date를 재계산한다. */
export function updateWorkOrder(db: SqlExecutor, workOrderId: string, update: WorkOrderUpdateInput): void {
  db.run(UPDATE_SQL, {
    workOrderId,
    assetTag: update.assetTag,
    title: update.title,
    pmCycleDays: update.pmCycleDays,
    lastPerformedAt: update.lastPerformedAt,
    nextDueDate: computeNextDueDate(update.lastPerformedAt, update.pmCycleDays),
    status: update.status,
  });
}

/**
 * WO 수행 완료 기록 전용 단축 경로. lastPerformedAt만 갱신하고, 이미 저장된
 * pm_cycle_days를 읽어 next_due_date를 재계산한다(호출부가 매번 pmCycleDays를
 * 다시 넘길 필요 없음).
 */
export function updateWorkOrderPerformance(
  db: SqlExecutor,
  workOrderId: string,
  lastPerformedAt: string,
  status: WorkOrderStatus = 'COMPLETED'
): WorkOrderRecord | undefined {
  const existing = db.get<WorkOrderRow>(SELECT_BY_ID_SQL, { workOrderId });
  if (!existing) return undefined;

  const nextDueDate = computeNextDueDate(lastPerformedAt, existing.pm_cycle_days);
  db.run(UPDATE_PERFORMANCE_SQL, { workOrderId, lastPerformedAt, nextDueDate, status });

  return rowToRecord({ ...existing, last_performed_at: lastPerformedAt, next_due_date: nextDueDate, status });
}

export function deleteWorkOrder(db: SqlExecutor, workOrderId: string): void {
  db.run(DELETE_SQL, { workOrderId });
}

export function selectWorkOrderById(db: SqlExecutor, workOrderId: string): WorkOrderRecord | undefined {
  const row = db.get<WorkOrderRow>(SELECT_BY_ID_SQL, { workOrderId });
  return row ? rowToRecord(row) : undefined;
}

export function selectWorkOrdersByAsset(db: SqlExecutor, assetTag: string): WorkOrderRecord[] {
  return db.all<WorkOrderRow>(SELECT_BY_ASSET_SQL, { assetTag }).map(rowToRecord);
}

export function selectWorkOrdersByStatus(db: SqlExecutor, status: WorkOrderStatus): WorkOrderRecord[] {
  return db.all<WorkOrderRow>(SELECT_BY_STATUS_SQL, { status }).map(rowToRecord);
}

export function selectAllWorkOrders(db: SqlExecutor): WorkOrderRecord[] {
  return db.all<WorkOrderRow>(SELECT_ALL_SQL).map(rowToRecord);
}
