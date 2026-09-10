// src/batch/bootstrapAutoApproveAndPromote.ts
//
// ⚠ 개발/시연 단계 전용. 운영 데이터에는 사용하지 말 것.
//
// PURPOSE
//   플랜트가 아직 건설 마무리 단계라 사람이 자산 매핑을 검토할 실익이 없는
//   현재 시점에 한해, staging_legacy_assets의 PENDING_REVIEW 행을 사람 검토
//   없이 일괄 MANUAL_OVERRIDE로 전환한 뒤 즉시 승격까지 진행한다.
//
//   plant가 실제 가동에 들어가고 나면 이 함수 호출을 파이프라인에서 빼고,
//   원래 설계대로(§Phase 0 문서) 사람이 PENDING_REVIEW 큐를 직접 검토해
//   MANUAL_OVERRIDE로 전환하는 프로세스로 되돌려야 한다 — 이 파일 상단의
//   경고 주석이 그 전환 시점의 체크리스트 역할을 한다.
//
//   proposed_equipment_tag가 NULL인 행(Tag Normalization 자체가 실패한 경우,
//   예: Equipment Category를 못 찾은 완전히 낯선 prefix)은 이 함수도 승격
//   대상에서 제외한다 — 이것까지 자동 승인하면 "XX-0000" 같은 의미 없는
//   태그가 정식 assets 테이블에 들어가 버린다.

import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import { promoteStagingAssetsToAssets, type PromoteResult } from '../adapters/promoteStagingAssetToAssets';

const AUTO_APPROVE_SQL = `
  UPDATE staging_legacy_assets
  SET mapping_status = 'MANUAL_OVERRIDE',
      reviewer_id = 'BOOTSTRAP_AUTO_APPROVE',
      reviewed_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'),
      updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE mapping_status = 'PENDING_REVIEW'
    AND proposed_equipment_tag IS NOT NULL
`;

export interface BootstrapResult {
  autoApprovedCount: number;
  promoteResult: PromoteResult;
}

/**
 * reviewer_id='BOOTSTRAP_AUTO_APPROVE'로 표시해두는 이유: 나중에 실제 운영에
 * 들어가면 `SELECT * FROM staging_legacy_assets WHERE reviewer_id =
 * 'BOOTSTRAP_AUTO_APPROVE'`로 "사람이 실제로 본 적 없는" 자산을 걸러내
 * 재검토 대상으로 삼을 수 있다.
 */
export function bootstrapAutoApproveAndPromote(db: SqlExecutor): BootstrapResult {
  const before = db.get<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM staging_legacy_assets WHERE mapping_status = 'PENDING_REVIEW' AND proposed_equipment_tag IS NOT NULL`
  );
  db.run(AUTO_APPROVE_SQL);
  const autoApprovedCount = before?.cnt ?? 0;

  const promoteResult = promoteStagingAssetsToAssets(db);

  return { autoApprovedCount, promoteResult };
}
