// src/adapters/assetDbAdapter.ts
//
// PURPOSE
//   assets 테이블 조회 전담 어댑터. workOrderDbAdapter.ts와 동일 패턴 —
//   src/adapters/db/assetDao.ts(순수 DAO) + cmmsDbSingleton(node:sqlite 연결)을
//   재사용한다.

import { getCmmsDb } from './db/cmmsDbSingleton';
import { selectAllAssets, selectAssetByTag } from './db/assetDao';
import type { CmmsAssetSnapshotRow } from '../scripts/exportCmmsAssetSnapshot';

/** 전체 자산 레코드 조회 (equipment_tag 오름차순). */
export function getAllAssetRecords(): CmmsAssetSnapshotRow[] {
  return selectAllAssets(getCmmsDb());
}

/** 단일 자산 레코드 조회. */
export function getAssetRecordByTag(equipmentTag: string): CmmsAssetSnapshotRow | undefined {
  return selectAssetByTag(getCmmsDb(), equipmentTag);
}
