// src/adapters/db/purchaseRequisitionDao.ts
//
// PURPOSE
//   mro_purchase_requisitions 테이블에 대한 순수 DAO. SqlExecutor에만 의존하며
//   React/Next 바인딩이 없다 (mroInventoryDao.ts와 동일 패턴).
//
// SCOPE
//   자동 발행 여부 판단(저재고 감지, 부품당 OPEN 1건 제한)은 이 파일이 아닌
//   호출부(mroInventoryDbAdapter.ts)의 책임이다 — 이 DAO는 순수 CRUD만 수행한다.

import type { SqlExecutor } from './sqlExecutor';

export type PurchaseRequisitionStatus = 'OPEN' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseRequisitionRecord {
  prId: number;
  partNo: string;
  suggestedQty: number;
  status: PurchaseRequisitionStatus;
  triggerReason: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface NewPurchaseRequisitionInput {
  partNo: string;
  suggestedQty: number;
  triggerReason: string;
}

interface PurchaseRequisitionRow {
  pr_id: number;
  part_no: string;
  suggested_qty: number;
  status: string;
  trigger_reason: string;
  created_at: string;
  resolved_at: string | null;
}

const INSERT_PR_SQL = `
  INSERT INTO mro_purchase_requisitions (part_no, suggested_qty, trigger_reason)
  VALUES (@partNo, @suggestedQty, @triggerReason)
`;

const SELECT_OPEN_PR_BY_PART_SQL = `
  SELECT * FROM mro_purchase_requisitions WHERE part_no = @partNo AND status = 'OPEN' LIMIT 1
`;

const SELECT_ALL_PRS_SQL = `SELECT * FROM mro_purchase_requisitions ORDER BY created_at DESC`;

const SELECT_LAST_INSERTED_PR_SQL = `
  SELECT * FROM mro_purchase_requisitions WHERE part_no = @partNo ORDER BY pr_id DESC LIMIT 1
`;

function rowToPr(row: PurchaseRequisitionRow): PurchaseRequisitionRecord {
  return {
    prId: row.pr_id,
    partNo: row.part_no,
    suggestedQty: row.suggested_qty,
    status: row.status as PurchaseRequisitionStatus,
    triggerReason: row.trigger_reason,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

/** 저재고 부품당 OPEN 상태 PR이 이미 존재하는지 조회한다 (중복 발행 방지용). */
export function selectOpenRequisitionByPart(db: SqlExecutor, partNo: string): PurchaseRequisitionRecord | undefined {
  const row = db.get<PurchaseRequisitionRow>(SELECT_OPEN_PR_BY_PART_SQL, { partNo });
  return row ? rowToPr(row) : undefined;
}

export function selectAllRequisitions(db: SqlExecutor): PurchaseRequisitionRecord[] {
  return db.all<PurchaseRequisitionRow>(SELECT_ALL_PRS_SQL).map(rowToPr);
}

/** PR을 INSERT하고 방금 생성된 행을 반환한다. */
export function insertRequisition(db: SqlExecutor, input: NewPurchaseRequisitionInput): PurchaseRequisitionRecord {
  db.run(INSERT_PR_SQL, {
    partNo: input.partNo,
    suggestedQty: input.suggestedQty,
    triggerReason: input.triggerReason,
  });
  const row = db.get<PurchaseRequisitionRow>(SELECT_LAST_INSERTED_PR_SQL, { partNo: input.partNo })!;
  return rowToPr(row);
}
