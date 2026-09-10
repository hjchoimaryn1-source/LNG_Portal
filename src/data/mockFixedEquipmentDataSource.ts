// src/batch/mockFixedEquipmentDataSource.ts
//
// PURPOSE
//   플랜트가 아직 건설 마무리 단계라 고정설비(Vaporizer/Generator/Compressor 등)
//   마스터 데이터의 정확한 스펙이 확정되지 않은 상태에서도, CMMS 인프라와 UI가
//   동작할 수 있도록 가상 자산 데이터를 자동 생성한다.
//
//   FixedEquipmentLegacyDataSource(CSV 기반)와 완전히 동일한 LegacyDataSource
//   인터페이스를 구현하므로, 나중에 실제 CSV가 준비되면 legacyDataSource.ts의
//   resolveConfiguredDataSource() 우선순위 로직만으로 자동 교체된다 —
//   이 파일이나 호출부 코드를 손댈 필요가 없다.
//
//   여기 있는 태그/이름/위치는 P&ID(NIAS-PS-PI-0002) 시트 구성을 참고한
//   "있음직한" 대표 설비 목록이며, 실제 자산 목록이 아니다. mapping_status는
//   AUTO_MAPPED로 나가지 않고 항상 PENDING_REVIEW로 남도록 criticality를
//   비워둔다(=진짜 자산이 아니라는 표식을 유지) — 아래 참고.

import { normalizeTagFormat } from '../adapters/tagNormalizationService';
import type { LegacyAssetSourceRow, LegacyPermitSourceRow, LegacyDataSource } from './legacyDataSource';

interface MockEquipmentSpec {
  legacyTag: string;
  legacyName: string;
  legacyLocationRaw: string;
  legacyTypeFilter: 'PLANT' | 'INSTRUMENTS';
}

/**
 * P&ID 시트 구성(SHEET 2~8) 기준 대표 설비 1대씩 — 실제 자산 수/사양이 아니라
 * "이런 종류의 설비가 이런 위치에 있을 것"이라는 뼈대(스캐폴딩) 목적.
 * 건설 완료 후 실제 목록으로 교체될 때까지 UI 개발/시연용.
 */
const MOCK_EQUIPMENT_SPECS: MockEquipmentSpec[] = [
  { legacyTag: 'AAV-101', legacyName: '[MOCK] Ambient Air Vaporizer Skid 101', legacyLocationRaw: 'Vaporizer Area', legacyTypeFilter: 'PLANT' },
  { legacyTag: 'CP-201', legacyName: '[MOCK] BOG Compressor 201', legacyLocationRaw: 'BOG Compressor Area', legacyTypeFilter: 'PLANT' },
  { legacyTag: 'P-301', legacyName: '[MOCK] LNG Feed Pump 301', legacyLocationRaw: 'Vaporizer Area', legacyTypeFilter: 'PLANT' },
  { legacyTag: 'M-401', legacyName: '[MOCK] Gas Metering Skid 401', legacyLocationRaw: 'Gas Metering Area', legacyTypeFilter: 'INSTRUMENTS' },
  { legacyTag: 'VT-501', legacyName: '[MOCK] Vent Stack 501', legacyLocationRaw: 'Gas Metering Area', legacyTypeFilter: 'PLANT' },
  { legacyTag: 'GEN-601', legacyName: '[MOCK] Emergency Generator 601', legacyLocationRaw: 'Electrical MCC & Substation', legacyTypeFilter: 'PLANT' },
  { legacyTag: 'PRSS-701', legacyName: '[MOCK] Pressure Regulator Station 701', legacyLocationRaw: 'Gas Metering Area', legacyTypeFilter: 'INSTRUMENTS' },
];

export class MockFixedEquipmentDataSource implements LegacyDataSource {
  fetchAssets(): LegacyAssetSourceRow[] {
    return MOCK_EQUIPMENT_SPECS.map((spec) => ({
      legacyTag: normalizeTagFormat(spec.legacyTag),
      legacyName: spec.legacyName,
      legacyLocationRaw: spec.legacyLocationRaw,
      legacyMaker: null, // 미확정 — 건설 완료 후 실 데이터로 채워짐
      legacyCriticalityRaw: null, // 미확정 — 의도적으로 fallback(MEDIUM) 처리, PENDING_REVIEW 유지
      legacyStatusRaw: null, // 미운영 상태이므로 OUT_OF_SERVICE fallback이 오히려 정확함
      legacyTypeFilter: spec.legacyTypeFilter,
      legacyImpaCodeRaw: null,
      sourceFileKey: 'mock_fixed_equipment',
    }));
  }

  fetchPermits(): LegacyPermitSourceRow[] {
    return [];
  }
}
