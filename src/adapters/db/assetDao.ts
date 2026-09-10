// src/adapters/db/assetDao.ts
//
// PURPOSE
//   assets 테이블에 대한 순수 DAO. SqlExecutor에만 의존하며 React/Next
//   바인딩이 없다 (workOrderDao.ts와 동일 패턴). 출력 shape는
//   src/scripts/exportCmmsAssetSnapshot.ts의 CmmsAssetSnapshotRow 계약을
//   그대로 재사용한다 — 정적 JSON 배치와 실시간 API가 프론트엔드에 대해
//   동일한 스키마를 노출해야 CmmsAwarePortalProvider.tsx가 무수정으로
//   전환될 수 있기 때문 (중복 정의 금지).
//
// SCOPE
//   읽기 전용. assets 테이블 쓰기(승격/갱신)는 promoteStagingAssetToAssets.ts
//   소관이며 이 파일은 관여하지 않는다.

import type { SqlExecutor } from './sqlExecutor';
import type { CmmsAssetSnapshotRow } from '../../scripts/exportCmmsAssetSnapshot';

interface AssetRow {
  equipment_tag: string;
  asset_name: string;
  iso_14224_class: string;
  kks_code: string;
  criticality: string;
  location_area: string;
  status: string;
  manufacturer: string | null;
  parent_tag: string | null;
}

const SELECT_ALL_SQL = `
  SELECT equipment_tag, asset_name, iso_14224_class, kks_code, criticality,
         location_area, status, manufacturer, parent_tag
  FROM assets ORDER BY equipment_tag
`;

const SELECT_BY_TAG_SQL = `
  SELECT equipment_tag, asset_name, iso_14224_class, kks_code, criticality,
         location_area, status, manufacturer, parent_tag
  FROM assets WHERE equipment_tag = @equipmentTag
`;

function rowToRecord(row: AssetRow): CmmsAssetSnapshotRow {
  return {
    equipmentTag: row.equipment_tag,
    assetName: row.asset_name,
    isoClass: row.iso_14224_class,
    kksCode: row.kks_code,
    criticality: row.criticality as CmmsAssetSnapshotRow['criticality'],
    locationArea: row.location_area,
    status: row.status as CmmsAssetSnapshotRow['status'],
    manufacturer: row.manufacturer,
    parentTag: row.parent_tag,
    isMockData: row.asset_name.startsWith('[MOCK]'),
  };
}

/** 전체 자산 조회 (equipment_tag 오름차순). */
export function selectAllAssets(db: SqlExecutor): CmmsAssetSnapshotRow[] {
  return db.all<AssetRow>(SELECT_ALL_SQL).map(rowToRecord);
}

/** 단일 자산 조회. */
export function selectAssetByTag(db: SqlExecutor, equipmentTag: string): CmmsAssetSnapshotRow | undefined {
  const row = db.get<AssetRow>(SELECT_BY_TAG_SQL, { equipmentTag });
  return row ? rowToRecord(row) : undefined;
}
