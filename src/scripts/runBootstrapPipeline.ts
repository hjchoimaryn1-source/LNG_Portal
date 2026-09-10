// src/scripts/runBootstrapPipeline.ts
//
// ⚠ 개발/시연 단계 전용 (플랜트 미운영 상태 한정). bootstrapAutoApproveAndPromote.ts
//   상단 경고 참조 — 운영 전환 시 이 스크립트 대신 Phase 0 → (사람 검토) →
//   promoteStagingAssetsToAssets 3단계로 되돌려야 한다.
//
// PURPOSE
//   "질문 없이, mock/fallback을 적극 활용해 인프라와 UI가 동작하는 상태"를
//   한 번의 호출로 만든다:
//     1) Phase 0 Shadow Write (ISO Tank 실 CSV + 고정설비 Mock/실CSV 합성)
//     2) 사람 검토 생략 — PENDING_REVIEW 전부 자동 승인 후 즉시 승격
//     3) assets 테이블을 public/data/cmms_asset_snapshot.json으로 export
//        (React 프론트엔드가 fetch()로 바로 소비)
//
// CLI 사용 (기존과 동일)
//   $ npx tsx src/scripts/runBootstrapPipeline.ts
//   (환경변수는 scripts/run-cmms-bootstrap.ps1 참조)
//
// 라이브러리로 재사용 (신규 — API route에서 호출하기 위함)
//   import { runBootstrap } from './runBootstrapPipeline';
//   const result = await runBootstrap({ resetDb: true });
//
//   resetDb: true를 주면 기존 DB 파일을 실행 전에 삭제한다 — "[DB Reset & Re-sync]"
//   관리자 버튼이 이 옵션으로 호출한다. CLI 실행 시에는 기존처럼 DB가 있으면
//   재사용하는 게 기본값이다(의도치 않은 데이터 삭제 방지).

import { existsSync, unlinkSync } from 'node:fs';
import { createNodeSqliteExecutor, loadSchema } from '../adapters/db/nodeSqliteExecutor';
import { runShadowWriteBatch } from './shadowWriteBatch';
import { resolveConfiguredDataSource } from '../data/legacyDataSource';
import { bootstrapAutoApproveAndPromote } from './bootstrapAutoApproveAndPromote';
import { exportCmmsAssetSnapshot } from './exportCmmsAssetSnapshot';

export interface BootstrapOptions {
  dbPath?: string;
  schemaPath?: string;
  snapshotOutputPath?: string;
  autoSchema?: boolean;
  /** true면 실행 전 기존 DB 파일을 삭제하고 완전히 새로 만든다. 기본값 false. */
  resetDb?: boolean;
}

export interface BootstrapSummary {
  dbPath: string;
  wasReset: boolean;
  assetsProcessed: number;
  assetsInserted: number;
  assetsUpdated: number;
  assetsNeedsReview: number;
  assetErrors: { legacyTag: string; message: string }[];
  autoApprovedCount: number;
  promotedCount: number;
  promoteFailedCount: number;
  promoteErrors: { legacyTag: string; message: string }[];
  snapshotTotalCount: number;
  snapshotMockCount: number;
  snapshotOutputPath: string;
  completedAt: string;
}

/**
 * 부트스트랩 파이프라인 본체. CLI(main())와 Next.js API route
 * (src/app/api/v1/cmms/bootstrap/route.ts) 양쪽에서 이 함수를 호출한다.
 */
export async function runBootstrap(options: BootstrapOptions = {}): Promise<BootstrapSummary> {
  const dbPath = options.dbPath ?? process.env.CMMS_DB_PATH ?? './nias_cmms.db';
  const schemaPath = options.schemaPath ?? process.env.CMMS_SCHEMA_PATH ?? './schema/cmms_schema.sqlite.sql';
  const snapshotOutputPath =
    options.snapshotOutputPath ?? process.env.CMMS_SNAPSHOT_OUTPUT ?? './public/data/cmms_asset_snapshot.json';
  const autoSchemaEnabled = options.autoSchema ?? process.env.CMMS_AUTO_SCHEMA !== 'false';
  const resetDb = options.resetDb ?? false;

  let wasReset = false;
  if (resetDb && existsSync(dbPath)) {
    unlinkSync(dbPath);
    wasReset = true;
    console.log(`[bootstrap] resetDb=true — 기존 DB 삭제: ${dbPath}`);
  }

  const dbFileExisted = existsSync(dbPath);
  const db = createNodeSqliteExecutor(dbPath);

  if (!dbFileExisted && autoSchemaEnabled) {
    const { readFileSync } = await import('node:fs');
    loadSchema(db.raw, readFileSync(schemaPath, 'utf8'));
    console.log(`[bootstrap] 신규 DB 생성 및 스키마 적용: ${dbPath}`);
  } else {
    console.log(`[bootstrap] 기존 DB 재사용: ${dbPath}`);
  }

  console.log('\n=== 1) Phase 0 Shadow Write ===');
  const source = await resolveConfiguredDataSource();
  const shadowResult = await runShadowWriteBatch(db, source);
  console.log(
    `자산 처리=${shadowResult.assets.processed} (신규 ${shadowResult.assets.inserted}/갱신 ${shadowResult.assets.updated}/검토필요 ${shadowResult.assets.needsReview})`
  );
  if (shadowResult.assets.errors.length > 0) {
    console.warn(`⚠ 자산 처리 오류 ${shadowResult.assets.errors.length}건:`, shadowResult.assets.errors.slice(0, 5));
  }

  console.log('\n=== 2) 자동 승인 + 승격 (개발 단계 전용 — 사람 검토 생략) ===');
  const bootstrapResult = bootstrapAutoApproveAndPromote(db);
  console.log(
    `자동 승인 ${bootstrapResult.autoApprovedCount}건 → 승격 ${bootstrapResult.promoteResult.promotedCount}건 성공, ${bootstrapResult.promoteResult.failureCount}건 실패`
  );
  if (bootstrapResult.promoteResult.errors.length > 0) {
    console.warn('⚠ 승격 오류:', bootstrapResult.promoteResult.errors.slice(0, 5));
  }

  console.log('\n=== 3) JSON 스냅샷 Export ===');
  const snapshot = exportCmmsAssetSnapshot(db, snapshotOutputPath);
  console.log(`${snapshot.totalCount}건 export 완료 → ${snapshotOutputPath}`);
  console.log(`  (mock 데이터 ${snapshot.assets.filter((a) => a.isMockData).length}건 포함)`);

  db.close();
  console.log('\n[bootstrap] 파이프라인 완료.');

  return {
    dbPath,
    wasReset,
    assetsProcessed: shadowResult.assets.processed,
    assetsInserted: shadowResult.assets.inserted,
    assetsUpdated: shadowResult.assets.updated,
    assetsNeedsReview: shadowResult.assets.needsReview,
    assetErrors: shadowResult.assets.errors,
    autoApprovedCount: bootstrapResult.autoApprovedCount,
    promotedCount: bootstrapResult.promoteResult.promotedCount,
    promoteFailedCount: bootstrapResult.promoteResult.failureCount,
    promoteErrors: bootstrapResult.promoteResult.errors,
    snapshotTotalCount: snapshot.totalCount,
    snapshotMockCount: snapshot.assets.filter((a) => a.isMockData).length,
    snapshotOutputPath,
    completedAt: new Date().toISOString(),
  };
}

// CLI 진입점 — tsx로 이 파일을 직접 실행했을 때만 동작 (API route가 runBootstrap을
// import할 때는 이 블록이 실행되지 않는다).
if (require.main === module) {
  runBootstrap().catch((err) => {
    console.error('[bootstrap] 파이프라인 실패:', err);
    process.exitCode = 1;
  });
}
