// src/batch/runPhase1DualRead.ts
//
// PURPOSE
//   Phase 1 Dual Read 배치 실행 진입점. runPhase0.ts와 동일한 관례
//   (cron/수동 실행, 환경변수로 소스/DB/리포트 경로 지정, 기존 DB 파일은
//   스키마 재적용 없이 재사용)를 따른다.
//
// USAGE
//   $ CMMS_DB_PATH=./nias_cmms.db \
//     LEGACY_ASSETS_JSON=./fixtures/assets.json \
//     LEGACY_PERMITS_JSON=./fixtures/permits.json \
//     node dist/batch/runPhase1DualRead.js
//
//   주의: runPhase0.js를 최소 1회 먼저 실행해 DB/스키마가 이미 존재해야 한다.
//   이 스크립트는 신규 DB를 생성하지 않는다(assets 테이블에 승격된 데이터가
//   있어야 의미 있는 diff가 나오므로, Phase 0/승격 파이프라인이 선행되어야 함).

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createNodeSqliteExecutor } from '../adapters/db/nodeSqliteExecutor';
import { runDualReadDiff } from './dualReadDiff';
import { generateDualReadReport } from './dualReadReport';
import { JsonFileLegacyDataSource, UnconnectedLegacyDataSource, type LegacyDataSource } from './legacyDataSource';

function resolveDataSource(): LegacyDataSource {
  const assetsJson = process.env.LEGACY_ASSETS_JSON;
  const permitsJson = process.env.LEGACY_PERMITS_JSON;
  if (assetsJson && permitsJson) return new JsonFileLegacyDataSource(assetsJson, permitsJson);
  console.warn('[runPhase1DualRead] LEGACY_ASSETS_JSON/LEGACY_PERMITS_JSON 미설정 — UnconnectedLegacyDataSource로 실행 (0건 처리 예상).');
  return new UnconnectedLegacyDataSource();
}

async function main() {
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const reportOutPath =
    process.env.PHASE1_REPORT_PATH ?? `./reports/phase1-dualread-${new Date().toISOString().slice(0, 10)}.md`;

  if (!existsSync(dbPath)) {
    console.error(
      `[runPhase1DualRead] DB 파일이 없습니다: ${dbPath}. Phase 0 배치(runPhase0.js)를 먼저 실행해 스키마와 초기 데이터를 생성하세요.`
    );
    process.exitCode = 1;
    return;
  }

  const db = createNodeSqliteExecutor(dbPath);
  const source = resolveDataSource();

  const result = await runDualReadDiff(db, source);
  const report = generateDualReadReport(db, result);

  mkdirSync(dirname(reportOutPath), { recursive: true });
  writeFileSync(reportOutPath, report, 'utf8');

  console.log(`[runPhase1DualRead] 완료. 리포트 저장 위치: ${reportOutPath}`);
  console.log(
    `[runPhase1DualRead] matched=${result.matchedCount}, drifted=${result.driftedCount}, ` +
      `unmapped(Phase0 큐 위임)=${result.unmappedCount}, orphanedAlias=${result.orphanedAliasCount}`
  );

  db.close();
}

main().catch((err) => {
  console.error('[runPhase1DualRead] 배치 실행 실패:', err);
  process.exitCode = 1;
});
