// src/adapters/purchaseRequisitionDbAdapter.ts
//
// PURPOSE
//   mro_purchase_requisitions 영속화 전담 어댑터. mroInventoryDbAdapter.ts와
//   동일 패턴 — src/adapters/db/purchaseRequisitionDao.ts(순수 DAO) +
//   cmmsDbSingleton(node:sqlite 연결)을 재사용한다.
//
// SCOPE
//   저재고 자동 발행 로직(부품당 OPEN 1건 제한, 발행 여부 판단)은
//   mroInventoryDbAdapter.adjustStock()이 이 어댑터를 호출해 수행한다.

import { getCmmsDb } from './db/cmmsDbSingleton';
import {
  insertRequisition,
  selectAllRequisitions,
  selectOpenRequisitionByPart,
  type NewPurchaseRequisitionInput,
  type PurchaseRequisitionRecord,
} from './db/purchaseRequisitionDao';

/** 전체 구매요청 목록 (최신순). */
export function getAllRequisitions(): PurchaseRequisitionRecord[] {
  return selectAllRequisitions(getCmmsDb());
}

/**
 * 해당 부품에 OPEN 상태 PR이 이미 있으면 그대로 반환하고(중복 발행 방지),
 * 없으면 새로 발행한다.
 */
export function ensureOpenRequisition(input: NewPurchaseRequisitionInput): PurchaseRequisitionRecord {
  const db = getCmmsDb();
  const existing = selectOpenRequisitionByPart(db, input.partNo);
  if (existing) return existing;
  return insertRequisition(db, input);
}
