// src/batch/legacyDataSource.ts
//
// PURPOSE
//   Phase 0 Shadow Write 배치가 "레거시 데이터를 어디서 읽어오는지"를 추상화한다.
//   현재 시점(2026-09)에는 실제 연동 소스가 미정이므로, 인터페이스만 확정하고
//   검증/로컬 개발용 참조 구현체(JsonFileLegacyDataSource) 하나만 제공한다.
//
//   실 연동 시 아래 셋 중 하나로 교체하면 되며, shadowWriteBatch.ts 등 이 인터페이스를
//   소비하는 코드는 한 줄도 바뀌지 않는다:
//     - PortalDataContext를 서버(API route)에서 조회하는 구현체
//     - 레거시 DB에 직접 연결하는 구현체
//     - 레거시 CSV를 파싱하는 구현체
//
//   이 파일 자체는 DB에 쓰지 않는다 (읽기 전용 소스 추상화).

import { readFileSync, existsSync } from 'node:fs';
import type { StagingAssetRowInput } from '../adapters/assetAdapter';

// 허가서(PTW) 관련 가스측정 타입은 지금 단계에서 사용하지 않는다(모든
// LegacyDataSource 구현체가 fetchPermits()에서 빈 배열만 반환). 원래는
// '../adapters/gasSafetyAdapter'의 LegacyGasReadings를 재사용했으나,
// 그 파일을 아직 이 프로젝트에 들이지 않았으므로 최소 형태로 로컬 정의해
// 불필요한 의존성을 없앤다. e-PTW/가스측정 연동을 시작할 때
// gasSafetyAdapter.ts를 들여오면서 이 로컬 타입을 그걸로 바꿔치기하면 된다.
interface LegacyGasReadings {
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm?: number;
  testedAt: string;
  isSafeForWork: boolean;
}

// ----------------------------------------------------------------------------
// 1. 인터페이스 (실 연동 시 이 형태만 만족시키면 됨)
// ----------------------------------------------------------------------------

/** 레거시 자산 1건 — assetStagingWriter.upsertStagingAssetRow()의 입력과 호환 */
export interface LegacyAssetSourceRow extends StagingAssetRowInput {
  legacyTag: string; // staging PK 대용 자연키이므로 필수
  sourceFileKey?: string; // 이 행이 어느 원본 파일/소스에서 왔는지 추적용 (선택)
}

/** 레거시 PTW permit 1건 — Shadow Write 대상 최소 정보 */
export interface LegacyPermitSourceRow {
  /** 레거시 PTWPermit.id (예: "PTW-2026-0901-01") */
  permitRefNo: string;
  /** payloadHash 계산에 사용할 permit 전체 payload (해시 안정성을 위해 매 실행 동일 shape 유지 필요) */
  payload: unknown;
  /** 이번 배치 시점에 함께 적재할 최신 가스측정값 (없으면 생략) */
  latestGasReading?: LegacyGasReadings;
  /** 가스측정 담당자 식별자 (latestGasReading이 있을 때 필수) */
  testerIdentifier?: string;
}

export interface LegacyDataSource {
  fetchAssets(): Promise<LegacyAssetSourceRow[]> | LegacyAssetSourceRow[];
  fetchPermits(): Promise<LegacyPermitSourceRow[]> | LegacyPermitSourceRow[];
}

// ----------------------------------------------------------------------------
// 2. 참조 구현체 — JSON 파일 기반 (로컬 검증 / 실 연동 전 임시 대체용)
// ----------------------------------------------------------------------------

/**
 * assets.json / permits.json 두 파일을 읽어 LegacyDataSource를 구현한다.
 * 실 연동 전까지 배치 파이프라인 자체(적재 로직, 리포트 생성)를 검증하는 용도.
 *
 * 기대 파일 형식:
 *   assets.json  : LegacyAssetSourceRow[]
 *   permits.json : LegacyPermitSourceRow[]
 */
export class JsonFileLegacyDataSource implements LegacyDataSource {
  constructor(private readonly assetsJsonPath: string, private readonly permitsJsonPath: string) {}

  fetchAssets(): LegacyAssetSourceRow[] {
    if (!existsSync(this.assetsJsonPath)) return [];
    const raw = readFileSync(this.assetsJsonPath, 'utf8');
    return JSON.parse(raw) as LegacyAssetSourceRow[];
  }

  fetchPermits(): LegacyPermitSourceRow[] {
    if (!existsSync(this.permitsJsonPath)) return [];
    const raw = readFileSync(this.permitsJsonPath, 'utf8');
    return JSON.parse(raw) as LegacyPermitSourceRow[];
  }
}

/**
 * 아직 아무 소스도 연결되지 않았음을 명시적으로 드러내는 Null Object.
 * shadowWriteBatch를 소스 없이도 "0건 처리"로 안전하게 돌려볼 수 있게 해준다.
 * 실 연동 전까지 기본값으로 사용 가능.
 */
export class UnconnectedLegacyDataSource implements LegacyDataSource {
  fetchAssets(): LegacyAssetSourceRow[] {
    return [];
  }
  fetchPermits(): LegacyPermitSourceRow[] {
    return [];
  }
}

// ----------------------------------------------------------------------------
// 3. 다중 소스 합성 — ISO Tank(실 데이터) + 고정설비(플레이스홀더) 등 여러
//    LegacyDataSource를 하나로 묶어 Phase 0/1 배치에 단일 소스로 공급한다.
// ----------------------------------------------------------------------------

/**
 * 여러 LegacyDataSource를 순서대로 호출해 결과를 합친다.
 * 같은 legacy_tag가 둘 이상의 소스에 나타나면 (이론상 있어서는 안 되지만)
 * 뒤에 나열된 소스의 값으로 덮어써진다 — 우선순위가 필요하면 배열 순서로 조절.
 */
export class CompositeLegacyDataSource implements LegacyDataSource {
  constructor(private readonly sources: LegacyDataSource[]) {}

  async fetchAssets(): Promise<LegacyAssetSourceRow[]> {
    const byTag = new Map<string, LegacyAssetSourceRow>();
    for (const source of this.sources) {
      const rows = await source.fetchAssets();
      for (const row of rows) byTag.set(row.legacyTag, row);
    }
    return Array.from(byTag.values());
  }

  async fetchPermits(): Promise<LegacyPermitSourceRow[]> {
    const all: LegacyPermitSourceRow[] = [];
    for (const source of this.sources) {
      all.push(...(await source.fetchPermits()));
    }
    return all;
  }
}

// ----------------------------------------------------------------------------
// 4. 공통 소스 결정 로직 — runPhase0.ts와 runPhase1DualRead.ts가 반드시
//    이 함수 하나만 공유해서 써야 한다. 각 스크립트가 이 로직을 따로
//    베껴 쓰면(실제로 한 번 그렇게 했다가 서로 다른 결과가 나는 버그가 났었다)
//    두 배치가 서로 다른 데이터를 보는 채로 조용히 갈라질 수 있다.
//
//    동적 import로 IsoTankLegacyDataSource/FixedEquipmentLegacyDataSource를
//    불러온다 — legacyDataSource.ts 자체는 두 구현체를 몰라도 되게(순환
//    의존 방지) 하기 위함이다.
// ----------------------------------------------------------------------------

export async function resolveConfiguredDataSource(): Promise<LegacyDataSource> {
  // 1순위: 명시적 JSON override (테스트/특수 목적)
  const assetsJson = process.env.LEGACY_ASSETS_JSON;
  const permitsJson = process.env.LEGACY_PERMITS_JSON;
  if (assetsJson && permitsJson) {
    return new JsonFileLegacyDataSource(assetsJson, permitsJson);
  }

  // 2순위: 실 데이터 소스 합성
  //   - ISO Tank: 실 CSV 필수 (없으면 unconnected)
  //   - 고정설비: FIXED_EQUIPMENT_CSV가 있고 실제 파일이 존재하면 그걸 우선 사용.
  //     없으면(플랜트 건설 마무리 단계라 아직 확정 스펙이 없는 경우) 자동으로
  //     MockFixedEquipmentDataSource로 대체한다 — 사람에게 다시 묻지 않고,
  //     인프라/UI가 항상 동작하는 상태를 유지하는 것이 이 단계의 우선순위이기 때문.
  //     나중에 FIXED_EQUIPMENT_CSV를 실제 파일 경로로 지정하기만 하면 코드 변경
  //     없이 이 mock은 자동으로 실 데이터로 교체된다.
  const isoStatusCsv = process.env.ISO_TANK_STATUS_LOCATION_CSV;
  const isoMasterCsv = process.env.ISO_TANK_MASTER_DB_CSV; // optional
  const fixedEquipmentCsv = process.env.FIXED_EQUIPMENT_CSV; // optional

  if (isoStatusCsv) {
    const { IsoTankLegacyDataSource } = await import('./isoTankLegacyDataSource');
    const sources: LegacyDataSource[] = [new IsoTankLegacyDataSource(isoStatusCsv, isoMasterCsv)];

    if (fixedEquipmentCsv && existsSync(fixedEquipmentCsv)) {
      const { FixedEquipmentLegacyDataSource } = await import('./fixedEquipmentLegacyDataSource');
      sources.push(new FixedEquipmentLegacyDataSource(fixedEquipmentCsv));
      console.log(`[legacyDataSource] 고정설비 실 CSV 사용: ${fixedEquipmentCsv}`);
    } else {
      const { MockFixedEquipmentDataSource } = await import('./mockFixedEquipmentDataSource');
      sources.push(new MockFixedEquipmentDataSource());
      console.log('[legacyDataSource] 고정설비 실 CSV 없음 — MockFixedEquipmentDataSource로 자동 대체 (건설 완료 후 CSV 지정 시 자동 전환).');
    }
    return new CompositeLegacyDataSource(sources);
  }

  console.warn(
    '[legacyDataSource] 데이터 소스 환경변수 미설정(LEGACY_ASSETS_JSON 또는 ISO_TANK_STATUS_LOCATION_CSV) — ' +
      'UnconnectedLegacyDataSource로 실행 (0건 처리 예상).'
  );
  return new UnconnectedLegacyDataSource();
}
