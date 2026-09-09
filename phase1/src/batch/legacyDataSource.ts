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
import type { LegacyGasReadings } from '../adapters/gasSafetyAdapter';

// ----------------------------------------------------------------------------
// 1. 인터페이스 (실 연동 시 이 형태만 만족시키면 됨)
// ----------------------------------------------------------------------------

/** 레거시 자산 1건 — assetStagingWriter.upsertStagingAssetRow()의 입력과 호환 */
export interface LegacyAssetSourceRow extends StagingAssetRowInput {
  legacyTag: string; // staging PK 대용 자연키이므로 필수
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
