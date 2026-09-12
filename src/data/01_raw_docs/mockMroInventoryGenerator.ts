// src/data/mockMroInventoryGenerator.ts
//
// PURPOSE
//   mro_parts 테이블이 비어있을 때(최초 실행) 1회 시딩할 초기 부품 목록.
//   Nias LNG 재기화 기지 극저온/고압 설비(PRSS, BOG 압축기, Cryogenic Bay)
//   정비에서 통상 재고로 보유하는 소모품/예비품 샘플.

import type { NewMroPartInput } from '../../adapters/db/mroInventoryDao';

export function buildMockMroParts(): NewMroPartInput[] {
  return [
    { partNo: 'MRO-GSK-001', partName: 'Cryogenic Spiral Wound Gasket (150A)', uom: 'EA', storageLocation: 'RACK-A1', minStockQty: 10, currentStockQty: 24, unitCost: 85 },
    { partNo: 'MRO-GSK-002', partName: 'Cryogenic Spiral Wound Gasket (300A)', uom: 'EA', storageLocation: 'RACK-A1', minStockQty: 8, currentStockQty: 6, unitCost: 120 },
    { partNo: 'MRO-SEAL-010', partName: 'BOG Compressor Mechanical Seal Kit', uom: 'SET', storageLocation: 'RACK-B2', minStockQty: 4, currentStockQty: 5, unitCost: 3200 },
    { partNo: 'MRO-FLT-020', partName: 'PRSS Vaporizer Inline Strainer Element', uom: 'EA', storageLocation: 'RACK-B3', minStockQty: 12, currentStockQty: 30, unitCost: 45 },
    { partNo: 'MRO-VLV-030', partName: 'Cryogenic Ball Valve Seat Ring Set', uom: 'SET', storageLocation: 'RACK-C1', minStockQty: 6, currentStockQty: 3, unitCost: 610 },
    { partNo: 'MRO-VLV-031', partName: 'Flare Header Relief Valve Repair Kit', uom: 'SET', storageLocation: 'RACK-C1', minStockQty: 4, currentStockQty: 4, unitCost: 890 },
    { partNo: 'MRO-BRG-040', partName: 'BOG Compressor Thrust Bearing', uom: 'EA', storageLocation: 'RACK-B2', minStockQty: 2, currentStockQty: 2, unitCost: 4500 },
    { partNo: 'MRO-INS-050', partName: 'Perlite Cryogenic Insulation Bag', uom: 'BAG', storageLocation: 'YARD-D1', minStockQty: 50, currentStockQty: 120, unitCost: 18 },
    { partNo: 'MRO-INST-060', partName: 'LEL/O2 Gas Detector Sensor Cartridge', uom: 'EA', storageLocation: 'RACK-E1', minStockQty: 15, currentStockQty: 9, unitCost: 210 },
    { partNo: 'MRO-LUBE-070', partName: 'Synthetic Compressor Lubricant (20L Drum)', uom: 'DRUM', storageLocation: 'YARD-D2', minStockQty: 6, currentStockQty: 11, unitCost: 340 },
  ];
}
