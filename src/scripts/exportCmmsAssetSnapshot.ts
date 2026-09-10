// src/batch/exportCmmsAssetSnapshot.ts
//
// PURPOSE
//   assets 테이블(승격 완료된 CMMS 자산)을 정적 JSON 파일로 내보낸다.
//   PortalDataContext.tsx 같은 React 클라이언트가 fetch()로 바로 읽을 수 있는
//   형태 — DB 드라이버나 백엔드 API 없이도 프론트엔드가 CMMS 자산 데이터를
//   소비할 수 있게 해준다 (현재 포털이 정적 CSV/JSON을 public/data/에서
//   읽는 기존 관례와 동일한 패턴).
//
//   이 파일의 출력 스키마는 데이터 출처(ISO Tank 실 CSV든, 고정설비
//   Mock이든, 나중에 실 CSV로 교체되든)와 무관하게 항상 동일하다 —
//   그래서 "나중에 실 데이터로 교체해도 코드 수정 불필요"가 성립한다.
//   프론트엔드는 오직 이 JSON 스키마만 알면 된다.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { SqlExecutor } from '../adapters/db/sqlExecutor';

/** 프론트엔드가 소비하는 최종 스키마. assets 테이블 스키마가 바뀌어도
 *  이 인터페이스만 유지되면 프론트엔드 코드는 영향받지 않는다. */
export interface CmmsAssetSnapshotRow {
  equipmentTag: string;
  assetName: string;
  isoClass: string;
  kksCode: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  locationArea: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE';
  manufacturer: string | null;
  parentTag: string | null;
  /** 이 자산이 mock/placeholder 데이터인지 여부 — UI에서 "확정 전" 배지 표시용.
   *  legacy_tag가 '[MOCK]'으로 시작하는 asset_name을 가졌는지로 판별한다. */
  isMockData: boolean;
}

export interface CmmsAssetSnapshotFile {
  generatedAt: string;
  totalCount: number;
  assets: CmmsAssetSnapshotRow[];
}

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

export function buildCmmsAssetSnapshot(db: SqlExecutor): CmmsAssetSnapshotFile {
  const rows = db.all<AssetRow>(
    `SELECT equipment_tag, asset_name, iso_14224_class, kks_code, criticality,
            location_area, status, manufacturer, parent_tag
     FROM assets ORDER BY equipment_tag`
  );

  const assets: CmmsAssetSnapshotRow[] = rows.map((r) => ({
    equipmentTag: r.equipment_tag,
    assetName: r.asset_name,
    isoClass: r.iso_14224_class,
    kksCode: r.kks_code,
    criticality: r.criticality as CmmsAssetSnapshotRow['criticality'],
    locationArea: r.location_area,
    status: r.status as CmmsAssetSnapshotRow['status'],
    manufacturer: r.manufacturer,
    parentTag: r.parent_tag,
    isMockData: r.asset_name.startsWith('[MOCK]'),
  }));

  return {
    generatedAt: new Date().toISOString(),
    totalCount: assets.length,
    assets,
  };
}

export function exportCmmsAssetSnapshot(db: SqlExecutor, outputPath: string): CmmsAssetSnapshotFile {
  const snapshot = buildCmmsAssetSnapshot(db);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return snapshot;
}
