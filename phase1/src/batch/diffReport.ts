// src/batch/diffReport.ts
//
// PURPOSE
//   Refactoring Plan §3.2 Phase 0: "데이터 정합성 배치 검증 리포트 매일 생성".
//   runShadowWriteBatch()의 실행 결과 + staging_legacy_assets/permit_gas_tests
//   현재 스냅샷을 조합해 사람이 바로 검토할 수 있는 Markdown 리포트를 만든다.
//
//   이 파일도 UI/컴포넌트에 의존하지 않는다 — 순수 리포트 문자열 생성기.

import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import type { ShadowWriteBatchResult } from './shadowWriteBatch';

interface MappingStatusCount {
  mapping_status: string;
  cnt: number;
}

interface PendingReviewAssetRow {
  legacy_tag: string;
  legacy_name: string;
  mapping_status: string;
  created_at: string;
}

interface ResignatureCount {
  cnt: number;
}

interface StageDistributionRow {
  stage_code: string;
  cnt: number;
}

/**
 * staging_legacy_assets / permit_gas_tests / permit_lock_state를 조회해
 * 현재 스냅샷 통계를 계산한다. runShadowWriteBatch()가 방금 처리한 건수뿐
 * 아니라, 누적 상태(예: 아직도 PENDING_REVIEW로 남아있는 오래된 건)까지 보여줘야
 * "매일 생성되는" 리포트로서 의미가 있다.
 */
export function generateDailyDiffReport(
  db: SqlExecutor,
  batchResult: ShadowWriteBatchResult,
  options: { pendingReviewSampleLimit?: number } = {}
): string {
  const sampleLimit = options.pendingReviewSampleLimit ?? 20;

  const mappingStatusCounts = db.all<MappingStatusCount>(
    `SELECT mapping_status, COUNT(*) as cnt FROM staging_legacy_assets GROUP BY mapping_status`
  );

  const pendingReviewSample = db.all<PendingReviewAssetRow>(
    `SELECT legacy_tag, legacy_name, mapping_status, created_at
     FROM staging_legacy_assets
     WHERE mapping_status = 'PENDING_REVIEW'
     ORDER BY created_at DESC
     LIMIT @limit`,
    { limit: sampleLimit }
  );

  const resignatureCountRow = db.get<ResignatureCount>(
    `SELECT COUNT(*) as cnt FROM permit_gas_tests WHERE is_signature_legacy_reused = 1`
  );

  const stageDistribution = db.all<StageDistributionRow>(
    `SELECT stage_code, COUNT(*) as cnt FROM permit_lock_state GROUP BY stage_code`
  );

  const lines: string[] = [];
  lines.push(`# NIAS CMMS Phase 0 — Shadow Write Daily Diff Report`);
  lines.push('');
  lines.push(`> 실행 시각: ${batchResult.runAt}`);
  lines.push(`> 범위: staging_legacy_assets / permit_lock_state / permit_gas_tests (UI 미노출, 백엔드 전용)`);
  lines.push('');

  lines.push(`## 1. 금일 배치 실행 요약`);
  lines.push('');
  lines.push(`### 자산 (staging_legacy_assets)`);
  lines.push(`| 항목 | 건수 |`);
  lines.push(`|---|---|`);
  lines.push(`| 처리 대상 | ${batchResult.assets.processed} |`);
  lines.push(`| 신규 INSERT | ${batchResult.assets.inserted} |`);
  lines.push(`| 기존 UPDATE | ${batchResult.assets.updated} |`);
  lines.push(`| 승격완료(PROMOTED)라 스킵 | ${batchResult.assets.skippedAlreadyPromoted} |`);
  lines.push(`| 검토 필요(needsReview) | ${batchResult.assets.needsReview} |`);
  lines.push(`| 처리 실패(errors) | ${batchResult.assets.errors.length} |`);
  lines.push('');

  if (batchResult.assets.errors.length > 0) {
    lines.push(`**⚠ 자산 처리 실패 목록:**`);
    for (const e of batchResult.assets.errors) {
      lines.push(`- \`${e.legacyTag}\`: ${e.message}`);
    }
    lines.push('');
  }

  lines.push(`### 허가서(Permit) — permit_lock_state / permit_gas_tests`);
  lines.push(`| 항목 | 건수 |`);
  lines.push(`|---|---|`);
  lines.push(`| 처리 대상 | ${batchResult.permits.processed} |`);
  lines.push(`| 신규 초기화(STAGE_1_DRAFT) | ${batchResult.permits.newlyInitialized} |`);
  lines.push(`| 이미 존재(스킵) | ${batchResult.permits.alreadyExisted} |`);
  lines.push(`| 가스측정 이력 기록 | ${batchResult.permits.gasTestsRecorded} |`);
  lines.push(`| 처리 실패(errors) | ${batchResult.permits.errors.length} |`);
  lines.push('');

  if (batchResult.permits.errors.length > 0) {
    lines.push(`**⚠ 허가서 처리 실패 목록:**`);
    for (const e of batchResult.permits.errors) {
      lines.push(`- \`${e.permitRefNo}\`: ${e.message}`);
    }
    lines.push('');
  }

  lines.push(`## 2. 누적 스냅샷 (오늘 배치 이전 건 포함)`);
  lines.push('');
  lines.push(`### staging_legacy_assets — mapping_status 분포`);
  lines.push(`| mapping_status | 건수 |`);
  lines.push(`|---|---|`);
  for (const row of mappingStatusCounts) {
    lines.push(`| ${row.mapping_status} | ${row.cnt} |`);
  }
  if (mappingStatusCounts.length === 0) lines.push(`| (데이터 없음) | 0 |`);
  lines.push('');

  lines.push(`### permit_lock_state — stage_code 분포`);
  lines.push(`| stage_code | 건수 |`);
  lines.push(`|---|---|`);
  for (const row of stageDistribution) {
    lines.push(`| ${row.stage_code} | ${row.cnt} |`);
  }
  if (stageDistribution.length === 0) lines.push(`| (데이터 없음) | 0 |`);
  lines.push('');

  lines.push(`### permit_gas_tests — 재서명 필요(is_signature_legacy_reused=1) 누적`);
  lines.push(`- 총 ${resignatureCountRow?.cnt ?? 0}건. 정식 전자서명 UI 도입 시 \`findRecordsNeedingResignature()\`로 조회하여 일괄 재서명 요청 발송.`);
  lines.push('');

  lines.push(`## 3. 검토 필요(PENDING_REVIEW) 샘플 (최신 ${sampleLimit}건)`);
  lines.push('');
  if (pendingReviewSample.length === 0) {
    lines.push(`검토 대기 중인 자산이 없습니다.`);
  } else {
    lines.push(`| legacy_tag | legacy_name | 등록일 |`);
    lines.push(`|---|---|---|`);
    for (const row of pendingReviewSample) {
      lines.push(`| ${row.legacy_tag} | ${row.legacy_name} | ${row.created_at} |`);
    }
  }
  lines.push('');

  lines.push(`---`);
  lines.push(`_본 리포트는 Phase 0(Shadow Write) 배치 산출물이며, 레거시 포털 UI에는 어떠한 영향도 주지 않습니다._`);

  return lines.join('\n');
}
