// src/batch/fixedEquipmentLegacyDataSource.ts
//
// PURPOSE
//   고정 설비(Vaporizer, Generator, Pump, Pressure Regulator 등)의 마스터
//   데이터는 아직 정식 CSV/DB로 존재하지 않는다 (사용자 확인). 이 파일은
//   해당 데이터가 나중에 채워질 자리를 CMMS 인터페이스에 맞춰 미리 만들어둔
//   플레이스홀더 구현체다.
//
//   templates/fixed_equipment_master_template.csv 양식(헤더 고정)에 맞춰
//   실제 자산 목록을 채워 넣기만 하면, 이 클래스가 즉시 IsoTankLegacyDataSource와
//   동일한 방식으로 Phase 0/1 배치 파이프라인에 편입된다 — 코드 변경 불필요.
//
//   템플릿 컬럼:
//     legacy_tag, legacy_name, legacy_location_raw, legacy_maker,
//     legacy_criticality_raw, legacy_status_raw, legacy_type_filter(PLANT|INSTRUMENTS)
//
//   criticality/maker가 비어있는 행도 허용된다 — assetAdapter의 기존 fallback
//   정책(criticality 없으면 MEDIUM, maker 없으면 표시 PENDING)이 그대로 적용된다.

import { readFileSync, existsSync } from 'node:fs';
import { parseCsv } from '../utils/CsvUtils';
import { normalizeTagFormat } from '../adapters/tagNormalizationService';
import type { LegacyAssetSourceRow, LegacyPermitSourceRow, LegacyDataSource } from './legacyDataSource';

function isBlank(v: string | undefined): boolean {
  return !v || v.trim().length === 0;
}

export class FixedEquipmentLegacyDataSource implements LegacyDataSource {
  constructor(private readonly csvPath: string) {}

  fetchAssets(): LegacyAssetSourceRow[] {
    if (!existsSync(this.csvPath)) {
      // 템플릿이 아직 채워지지 않은 초기 상태 — 조용히 0건 반환.
      // (UnconnectedLegacyDataSource와 동일한 "명시적 미연결" 철학)
      console.warn(
        `[FixedEquipmentLegacyDataSource] CSV 파일 없음: ${this.csvPath}. ` +
          `templates/fixed_equipment_master_template.csv 양식을 참고해 실제 데이터를 채워주세요.`
      );
      return [];
    }

    const text = readFileSync(this.csvPath, 'utf8');
    const rows = parseCsv(text);

    return rows
      .filter((r) => !isBlank(r['legacy_tag']) && !isBlank(r['legacy_name']))
      .map((r) => {
        const typeFilterRaw = (r['legacy_type_filter'] ?? '').trim().toUpperCase();
        const legacyTypeFilter: 'PLANT' | 'INSTRUMENTS' | null =
          typeFilterRaw === 'PLANT' || typeFilterRaw === 'INSTRUMENTS' ? (typeFilterRaw as 'PLANT' | 'INSTRUMENTS') : null;

        const row: LegacyAssetSourceRow = {
          legacyTag: normalizeTagFormat(r['legacy_tag']),
          legacyName: r['legacy_name'].trim(),
          legacyLocationRaw: isBlank(r['legacy_location_raw']) ? null : r['legacy_location_raw'].trim(),
          legacyMaker: isBlank(r['legacy_maker']) ? null : r['legacy_maker'].trim(),
          legacyCriticalityRaw: isBlank(r['legacy_criticality_raw']) ? null : r['legacy_criticality_raw'].trim(),
          legacyStatusRaw: isBlank(r['legacy_status_raw']) ? null : r['legacy_status_raw'].trim(),
          legacyTypeFilter,
          legacyImpaCodeRaw: null,
          sourceFileKey: 'fixed_equipment_master_csv',
        };
        return row;
      });
  }

  fetchPermits(): LegacyPermitSourceRow[] {
    return [];
  }
}
