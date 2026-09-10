// src/adapters/db/mroInventoryDao.ts
//
// PURPOSE
//   mro_parts / mro_stock_transactions 테이블에 대한 순수 DAO. SqlExecutor에만
//   의존하며 React/Next 바인딩이 없다 (workOrderDao.ts와 동일 패턴).
//
// SCOPE
//   재고 조정의 유일한 쓰기 경로는 adjustPartStock()이다 — mro_parts.current_stock_qty
//   갱신과 mro_stock_transactions 기록이 항상 함께 일어나도록 보장하기 위해
//   두 테이블에 대한 개별 UPDATE/INSERT를 이 파일 밖에 노출하지 않는다.

import type { SqlExecutor } from './sqlExecutor';

export type StockTxType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'RETURN';

export interface MroPartRecord {
  partNo: string;
  partName: string;
  uom: string;
  storageLocation: string | null;
  minStockQty: number;
  currentStockQty: number;
  unitCost: number | null;
  updatedAt: string;
}

export interface NewMroPartInput {
  partNo: string;
  partName: string;
  uom: string;
  storageLocation?: string | null;
  minStockQty?: number;
  currentStockQty?: number;
  unitCost?: number | null;
}

export interface StockTransactionRecord {
  transactionId: number;
  partNo: string;
  txType: StockTxType;
  quantityDelta: number;
  resultingStockQty: number;
  workOrderId: string | null;
  reason: string | null;
  performedBy: string;
  performedAt: string;
}

export interface StockAdjustmentInput {
  partNo: string;
  txType: StockTxType;
  quantity: number;
  workOrderId?: string | null;
  reason?: string | null;
  performedBy: string;
}

interface MroPartRow {
  part_no: string;
  part_name: string;
  uom: string;
  storage_location: string | null;
  min_stock_qty: number;
  current_stock_qty: number;
  unit_cost: number | null;
  updated_at: string;
}

interface StockTransactionRow {
  transaction_id: number;
  part_no: string;
  tx_type: string;
  quantity_delta: number;
  resulting_stock_qty: number;
  work_order_id: string | null;
  reason: string | null;
  performed_by: string;
  performed_at: string;
}

const INSERT_PART_SQL = `
  INSERT INTO mro_parts (part_no, part_name, uom, storage_location, min_stock_qty, current_stock_qty, unit_cost)
  VALUES (@partNo, @partName, @uom, @storageLocation, @minStockQty, @currentStockQty, @unitCost)
`;

const SELECT_PART_BY_NO_SQL = `SELECT * FROM mro_parts WHERE part_no = @partNo`;
const SELECT_ALL_PARTS_SQL = `SELECT * FROM mro_parts ORDER BY part_no`;

const UPDATE_PART_STOCK_SQL = `
  UPDATE mro_parts SET
    current_stock_qty = @currentStockQty,
    updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE part_no = @partNo
`;

const INSERT_TRANSACTION_SQL = `
  INSERT INTO mro_stock_transactions (
    part_no, tx_type, quantity_delta, resulting_stock_qty, work_order_id, reason, performed_by
  ) VALUES (
    @partNo, @txType, @quantityDelta, @resultingStockQty, @workOrderId, @reason, @performedBy
  )
`;

const SELECT_TRANSACTIONS_BY_PART_SQL = `
  SELECT * FROM mro_stock_transactions WHERE part_no = @partNo ORDER BY performed_at DESC
`;
const SELECT_ALL_TRANSACTIONS_SQL = `SELECT * FROM mro_stock_transactions ORDER BY performed_at DESC`;

function rowToPart(row: MroPartRow): MroPartRecord {
  return {
    partNo: row.part_no,
    partName: row.part_name,
    uom: row.uom,
    storageLocation: row.storage_location,
    minStockQty: row.min_stock_qty,
    currentStockQty: row.current_stock_qty,
    unitCost: row.unit_cost,
    updatedAt: row.updated_at,
  };
}

function rowToTransaction(row: StockTransactionRow): StockTransactionRecord {
  return {
    transactionId: row.transaction_id,
    partNo: row.part_no,
    txType: row.tx_type as StockTxType,
    quantityDelta: row.quantity_delta,
    resultingStockQty: row.resulting_stock_qty,
    workOrderId: row.work_order_id,
    reason: row.reason,
    performedBy: row.performed_by,
    performedAt: row.performed_at,
  };
}

/** 부품 마스터를 INSERT한다 (시딩 전용). */
export function insertPart(db: SqlExecutor, input: NewMroPartInput): void {
  db.run(INSERT_PART_SQL, {
    partNo: input.partNo,
    partName: input.partName,
    uom: input.uom,
    storageLocation: input.storageLocation ?? null,
    minStockQty: input.minStockQty ?? 0,
    currentStockQty: input.currentStockQty ?? 0,
    unitCost: input.unitCost ?? null,
  });
}

export function selectPartByNo(db: SqlExecutor, partNo: string): MroPartRecord | undefined {
  const row = db.get<MroPartRow>(SELECT_PART_BY_NO_SQL, { partNo });
  return row ? rowToPart(row) : undefined;
}

export function selectAllParts(db: SqlExecutor): MroPartRecord[] {
  return db.all<MroPartRow>(SELECT_ALL_PARTS_SQL).map(rowToPart);
}

export function selectTransactionsByPart(db: SqlExecutor, partNo: string): StockTransactionRecord[] {
  return db.all<StockTransactionRow>(SELECT_TRANSACTIONS_BY_PART_SQL, { partNo }).map(rowToTransaction);
}

export function selectAllTransactions(db: SqlExecutor): StockTransactionRecord[] {
  return db.all<StockTransactionRow>(SELECT_ALL_TRANSACTIONS_SQL).map(rowToTransaction);
}

/**
 * 재고 조정의 유일한 쓰기 경로. RECEIPT/RETURN은 양수, ISSUE는 음수로 재고를
 * 이동시키며, ADJUSTMENT는 입력된 quantity의 부호를 그대로 델타로 사용한다.
 * 조정 후 재고가 음수가 되면 거부한다 (호출부는 반환값 undefined로 판단).
 */
export function adjustPartStock(db: SqlExecutor, input: StockAdjustmentInput): {
  part: MroPartRecord;
  transaction: StockTransactionRecord;
} | undefined {
  const existing = db.get<MroPartRow>(SELECT_PART_BY_NO_SQL, { partNo: input.partNo });
  if (!existing) return undefined;

  const quantityDelta = input.txType === 'ISSUE' ? -Math.abs(input.quantity) : input.quantity;
  const resultingStockQty = existing.current_stock_qty + quantityDelta;
  if (resultingStockQty < 0) return undefined;

  db.run(UPDATE_PART_STOCK_SQL, { partNo: input.partNo, currentStockQty: resultingStockQty });
  db.run(INSERT_TRANSACTION_SQL, {
    partNo: input.partNo,
    txType: input.txType,
    quantityDelta,
    resultingStockQty,
    workOrderId: input.workOrderId ?? null,
    reason: input.reason ?? null,
    performedBy: input.performedBy,
  });

  const txRow = db.get<StockTransactionRow>(
    `SELECT * FROM mro_stock_transactions WHERE part_no = @partNo ORDER BY transaction_id DESC LIMIT 1`,
    { partNo: input.partNo }
  );
  const partRow = db.get<MroPartRow>(SELECT_PART_BY_NO_SQL, { partNo: input.partNo })!;

  return { part: rowToPart(partRow), transaction: rowToTransaction(txRow!) };
}
