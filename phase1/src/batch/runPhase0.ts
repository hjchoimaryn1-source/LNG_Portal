// src/batch/runPhase0.ts
//
// PURPOSE
//   Phase 0 Shadow Write 배치의 실행 진입점. cron 또는 수동으로:
//     $ node dist/batch/runPhase0.js
//   형태로 매일 1회 실행하는 것을 전제로 한다.
//
//   레거시 데이터 소스가 아직 미정(UnconnectedLegacyDataSource)이므로,
//   현재는 항상 "0건 처리"로 안전하게 끝난다. 실 연동이 결정되면
//   LEGACY_DATA_SOURCE 분기만 교체하면 되고, shadowWriteBatch/diffReport는
//   무수정으로 그대로 재사용된다.
//
// USAGE (실 연동 전, 로컬 검증용)
//   $ LEGACY_ASSETS_JSON=./fixtures/assets.json \
//     LEGACY_PERMITS_JSON=./fixtures/permits.json \
//     node dist/batch/runPhase0.js

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createNodeSqliteExecutor, loadSchema } from '../adapters/db/nodeSqliteExecutor';
import { runShadowWriteBatch } from './shadowWriteBatch';
import { generateDailyDiffReport } from './diffReport';
import { JsonFileLegacyDataSource, UnconnectedLegacyDataSource, type LegacyDataSource } from './legacyDataSource';

function resolveDataSource(): LegacyDataSource {
  const assetsJson = process.env.LEGACY_ASSETS_JSON;
  const permitsJson = process.env.LEGACY_PERMITS_JSON;
  if (assetsJson && permitsJson) {
    return new JsonFileLegacyDataSource(assetsJson, permitsJson);
  }
  // 실 연동 미정 상태의 명시적 기본값. 조용히 다른 값으로 대체하지 않고
  // 항상 "연결 안 됨"임을 드러내는 편이, 배치가 매번 0건 처리되는 이유를
  // 로그에서 바로 알 수 있게 해준다.
  console.warn(
    '[runPhase0] LEGACY_ASSETS_JSON/LEGACY_PERMITS_JSON 미설정 — UnconnectedLegacyDataSource로 실행 (0건 처리 예상).'
  );
  return new UnconnectedLegacyDataSource();
}

async function main() {
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const schemaPath = process.env.CMMS_SCHEMA_PATH ?? './schema/cmms_schema.sqlite.sql';
  const reportOutPath = process.env.PHASE0_REPORT_PATH ?? `./reports/phase0-${new Date().toISOString().slice(0, 10)}.md`;

  const dbFileExisted = existsSync(dbPath);
  const db = createNodeSqliteExecutor(dbPath);

  // ⚠ 스키마는 DB 파일이 "이번에 새로 생성된 경우"에만 적용한다.
  // schema.sql은 각 CREATE TABLE 앞에 DROP TABLE IF EXISTS를 포함하고 있어
  // (로컬 반복 개발 편의 목적), 이미 존재하는 DB에 매번 재적용하면 그동안
  // 쌓인 staging_legacy_assets/permit_lock_state/permit_gas_tests 데이터가
  // 전부 삭제된다 — Phase 0가 "매일 누적되는" 배치라는 목적과 정면으로 배치되므로
  // 반드시 최초 1회(파일 부재 시)에만 로드한다.
  //
  // 운영 환경에서는 이 자동 스키마 적용 자체를 끄고(마이그레이션 도구로 별도 관리),
  // CMMS_AUTO_SCHEMA=false로 명시적으로 비활성화할 것을 권장한다.
  const isFreshDb = !dbFileExisted;
  const autoSchemaEnabled = process.env.CMMS_AUTO_SCHEMA !== 'false';
  if (isFreshDb && autoSchemaEnabled) {
    const { readFileSync } = await import('node:fs');
    loadSchema(db.raw, readFileSync(schemaPath, 'utf8'));
    console.log(`[runPhase0] 신규 DB 파일 감지 — 스키마 최초 적용: ${dbPath}`);
  } else if (!autoSchemaEnabled) {
    console.log(`[runPhase0] CMMS_AUTO_SCHEMA=false — 스키마 자동 적용 생략 (마이그레이션 도구로 관리 중인 것으로 가정).`);
  } else {
    console.log(`[runPhase0] 기존 DB 파일 재사용 — 스키마 재적용 생략(데이터 보존): ${dbPath}`);
  }

  const source = resolveDataSource();
  const result = await runShadowWriteBatch(db, source);
  const report = generateDailyDiffReport(db, result);

  mkdirSync(dirname(reportOutPath), { recursive: true });
  writeFileSync(reportOutPath, report, 'utf8');
  console.log(`[runPhase0] 완료. 리포트 저장 위치: ${reportOutPath}`);
  console.log(
    `[runPhase0] 자산 처리=${result.assets.processed}(신규 ${result.assets.inserted}/갱신 ${result.assets.updated}/검토필요 ${result.assets.needsReview}), ` +
      `허가서 처리=${result.permits.processed}(신규 ${result.permits.newlyInitialized})`
  );

  db.close();
}

main().catch((err) => {
  console.error('[runPhase0] 배치 실행 실패:', err);
  process.exitCode = 1;
});
