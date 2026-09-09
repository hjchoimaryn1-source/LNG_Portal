// src/adapters/assetMasterToLegacyView.ts
//
// PURPOSE
//   Refactoring Plan §1.5에서 스케치했던 flattenAssetTree()의 실제 구현체.
//   CMMS AssetMasterNode[](assets 테이블 기반 ISO14224/KKS 5-Level 트리)를
//   기존 EquipmentRegistryView.tsx가 소비하는 flat row shape로 변환한다.
//
//   순수 함수, side-effect 없음. assetAdapter.ts와 동일한 "읽기 전용" 계약.

export interface AssetSpecifications {
  manufacturer?: string;
  modelNo?: string;
  serialNo?: string;
  designPressureBar?: number;
  designTempCelsius?: number;
  installationDate?: string;
}

export interface AssetMasterNode {
  equipmentTag: string;
  assetName: string;
  iso14224Class: string;
  kksCode: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  locationArea: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE';
  parentTag: string | null;
  hasChildren: boolean;
  children?: AssetMasterNode[];
  specifications?: AssetSpecifications;
}

/** 기존 EquipmentRegistryView.tsx가 기대하는 flat row shape (무수정, 로컬 미러) */
export interface LegacyAssetRow {
  tag: string;
  name: string;
  loc: string;
  maker: string;
  crit: string;
  lastMaint: string;
  status: string;
  type: 'PLANT' | 'INSTRUMENTS';
}

/**
 * Level 4(Tag No.) 이상 — 즉 자식이 없는 leaf 노드만 UI 행으로 노출한다.
 * Level 1~3(Plant/System/Equipment Skid)은 그룹핑 헤더로만 쓰이고 개별 행으로
 * 렌더링되지 않는 기존 EquipmentRegistryView 관례를 그대로 따른다.
 */
export function flattenAssetTree(nodes: AssetMasterNode[]): LegacyAssetRow[] {
  const rows: LegacyAssetRow[] = [];
  const walk = (node: AssetMasterNode) => {
    if (node.equipmentTag && !node.hasChildren) {
      rows.push({
        tag: node.equipmentTag,
        name: node.assetName,
        loc: node.locationArea,
        maker: node.specifications?.manufacturer ?? 'N/A',
        crit: node.criticality,
        lastMaint: node.specifications?.installationDate ?? 'N/A', // WO 이력 연동 전 임시값 (Phase 2+ 에서 work_orders.completed_at 최신값으로 교체 예정)
        status: node.status,
        type: node.iso14224Class === 'Instrument' ? 'INSTRUMENTS' : 'PLANT',
      });
    }
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return rows;
}
