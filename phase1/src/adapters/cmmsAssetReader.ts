// src/adapters/cmmsAssetReader.ts
//
// PURPOSE
//   CMMS 정규 테이블 `assets`(flat, parent_tag self-FK)를 조회해
//   AssetMasterNode[] 트리로 재구성한다. flattenAssetTree()의 입력을 만드는
//   읽기 전용 리더 — DB에 쓰지 않는다.

import type { SqlExecutor } from './db/sqlExecutor';
import type { AssetMasterNode } from './assetMasterToLegacyView';

interface AssetRow {
  equipment_tag: string;
  asset_name: string;
  iso_14224_class: string;
  kks_code: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location_area: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE';
  parent_tag: string | null;
  manufacturer: string | null;
  model_no: string | null;
  serial_no: string | null;
  design_pressure_bar: number | null;
  design_temp_celsius: number | null;
  installation_date: string | null;
}

/**
 * assets 테이블 전체를 조회해 parent_tag 관계로 트리를 재구성한다.
 * 순환 참조(parent_tag가 자기 자신 체인을 이루는 데이터 오류)가 있어도 무한루프에
 * 빠지지 않도록, "이미 트리에 배치된 태그"를 방문 집합으로 추적한다.
 */
export function fetchAssetMasterTree(db: SqlExecutor): AssetMasterNode[] {
  const rows = db.all<AssetRow>(`SELECT * FROM assets`);

  const nodeMap = new Map<string, AssetMasterNode>();
  for (const r of rows) {
    nodeMap.set(r.equipment_tag, {
      equipmentTag: r.equipment_tag,
      assetName: r.asset_name,
      iso14224Class: r.iso_14224_class,
      kksCode: r.kks_code,
      criticality: r.criticality,
      locationArea: r.location_area,
      status: r.status,
      parentTag: r.parent_tag,
      hasChildren: false,
      children: [],
      specifications: {
        manufacturer: r.manufacturer ?? undefined,
        modelNo: r.model_no ?? undefined,
        serialNo: r.serial_no ?? undefined,
        designPressureBar: r.design_pressure_bar ?? undefined,
        designTempCelsius: r.design_temp_celsius ?? undefined,
        installationDate: r.installation_date ?? undefined,
      },
    });
  }

  const roots: AssetMasterNode[] = [];
  const placed = new Set<string>();

  for (const node of nodeMap.values()) {
    if (node.parentTag && nodeMap.has(node.parentTag) && node.parentTag !== node.equipmentTag) {
      const parent = nodeMap.get(node.parentTag)!;
      parent.children!.push(node);
      parent.hasChildren = true;
      placed.add(node.equipmentTag);
    }
  }
  for (const node of nodeMap.values()) {
    if (!placed.has(node.equipmentTag)) roots.push(node);
  }

  return roots;
}

/** legacy_tag -> equipment_tag 별칭 맵 조회 (dualReadDiff.ts에서 매칭 키로 사용) */
export function fetchAssetTagAliasMap(db: SqlExecutor): Map<string, string> {
  const rows = db.all<{ legacy_tag: string; equipment_tag: string }>(
    `SELECT legacy_tag, equipment_tag FROM asset_tag_alias`
  );
  return new Map(rows.map((r) => [r.legacy_tag, r.equipment_tag]));
}
