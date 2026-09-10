// src/adapters/mroInventoryDbAdapter.ts
//
// PURPOSE
//   mro_parts / mro_stock_transactions 영속화 전담 어댑터. workOrderDbAdapter.ts와
//   동일 패턴 — src/adapters/db/mroInventoryDao.ts(순수 DAO) + cmmsDbSingleton
//   (node:sqlite 연결)을 재사용한다.

import { getCmmsDb } from './db/cmmsDbSingleton';
import {
  insertPart,
  selectAllParts,
  selectAllTransactions,
  selectTransactionsByPart,
  adjustPartStock,
  type MroPartRecord,
  type NewMroPartInput,
  type StockAdjustmentInput,
  type StockTransactionRecord,
} from './db/mroInventoryDao';

/** 전체 부품 재고 조회 (part_no 오름차순). */
export function getAllParts(): MroPartRecord[] {
  return selectAllParts(getCmmsDb());
}

/**
 * mro_parts 테이블이 비어있을 때만 inputs를 시딩한다(이미 데이터가 있으면 no-op).
 * 시딩 여부와 무관하게 최종 상태의 전체 목록을 반환한다.
 */
export function seedPartsIfEmpty(inputs: NewMroPartInput[]): MroPartRecord[] {
  const db = getCmmsDb();
  const existing = selectAllParts(db);
  if (existing.length > 0) return existing;

  for (const input of inputs) {
    insertPart(db, input);
  }
  return selectAllParts(db);
}

/** 입출고/조정 기록. 대상 부품이 없거나 재고가 음수가 되면 undefined. */
export function adjustStock(input: StockAdjustmentInput): { part: MroPartRecord; transaction: StockTransactionRecord } | undefined {
  return adjustPartStock(getCmmsDb(), input);
}

/** 특정 부품의 입출고 이력 (미지정 시 전체). */
export function getStockTransactions(partNo?: string): StockTransactionRecord[] {
  const db = getCmmsDb();
  return partNo ? selectTransactionsByPart(db, partNo) : selectAllTransactions(db);
}
