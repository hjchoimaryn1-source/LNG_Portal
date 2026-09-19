// src/cmms-daily-ops/pid/pidTagAliasesDao.ts
//
// PURPOSE
//   pid_tag_aliases(Stage A, pidReconciliationSchema.ts) 순수 DAO. HMI-2-alias —
//   현장 일일보고서(bridging) 태그가 P&ID 정식 태그와 다를 때, HMI 표시 레이어만
//   정식 태그로 치환할 수 있게 canonical/alias 매핑을 제공한다. daily_ops_patrol_entries
//   저장값이나 폼 컴포넌트는 이 매핑과 무관하게 bridging 태그를 그대로 쓴다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface PidTagAlias {
  canonicalTagId: string;
  aliasTagId: string;
  sourceDocument: string;
}

interface PidTagAliasRow {
  canonical_tag_id: string;
  alias_tag_id: string;
  source_document: string;
}

function rowToAlias(row: PidTagAliasRow): PidTagAlias {
  return { canonicalTagId: row.canonical_tag_id, aliasTagId: row.alias_tag_id, sourceDocument: row.source_document };
}

const SELECT_ALL_SQL = `SELECT * FROM pid_tag_aliases`;

const SEED_INSERT_SQL = `
  INSERT OR IGNORE INTO pid_tag_aliases (canonical_tag_id, alias_tag_id, source_document)
  VALUES (@canonicalTagId, @aliasTagId, @sourceDocument)
`;

/** 전체 별칭 매핑 — HMI 표시 레이어 하이드레이션(DailyOpsDataContext)이 사용. */
export function listTagAliases(db: SqlExecutor): PidTagAlias[] {
  return db.all<PidTagAliasRow>(SELECT_ALL_SQL).map(rowToAlias);
}

/**
 * HMI-2-alias 확정 매핑 시딩 — 멱등(OR IGNORE, 복합 PK 충돌 시 무시).
 * VAP-104(정식 P&ID 태그) ↔ AAV-102(daily_report_bridging 상 표기).
 */
export function seedInitialTagAliases(db: SqlExecutor): void {
  db.run(SEED_INSERT_SQL, {
    canonicalTagId: 'VAP-104',
    aliasTagId: 'AAV-102',
    sourceDocument: 'daily_report_bridging',
  });
}
