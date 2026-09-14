// src/cmms-daily-ops/dao/dailyReportSnapshotDao.ts
//
// PURPOSE
//   daily_report_snapshots 조회 전용 스텁 (Stage B0). B4 PIDOverlayView가
//   "오늘자 리포트가 이미 확정됐는가"를 확인할 read 함수만 먼저 제공한다.
//   INSERT/스냅샷 생성(daily_ops_patrol_entries 최신값 freeze) 로직은
//   Stage C에서 구현한다 — 이 파일 헤더의 스텁 범위를 벗어나지 않는다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface DailyReportSnapshot {
  id: number;
  reportDate: string;
  generatedAt: string;
  generatedBy: string;
  snapshotPayload: string;
  isFinalized: boolean;
}

interface DailyReportSnapshotRow {
  id: number;
  report_date: string;
  generated_at: string;
  generated_by: string;
  snapshot_payload: string;
  is_finalized: number;
}

const SELECT_BY_DATE_SQL = `SELECT * FROM daily_report_snapshots WHERE report_date = @reportDate`;
const SELECT_RECENT_SQL = `SELECT * FROM daily_report_snapshots ORDER BY report_date DESC LIMIT @limit`;

function rowToSnapshot(row: DailyReportSnapshotRow): DailyReportSnapshot {
  return {
    id: row.id,
    reportDate: row.report_date,
    generatedAt: row.generated_at,
    generatedBy: row.generated_by,
    snapshotPayload: row.snapshot_payload,
    isFinalized: row.is_finalized === 1,
  };
}

/** report_date 1건 조회 — 존재 여부로 "이미 확정된 리포트인지" 판단에 사용 */
export function getSnapshot(db: SqlExecutor, reportDate: string): DailyReportSnapshot | undefined {
  const row = db.get<DailyReportSnapshotRow>(SELECT_BY_DATE_SQL, { reportDate });
  return row ? rowToSnapshot(row) : undefined;
}

/** 최근 N건 조회 (기본 10건) */
export function listRecentSnapshots(db: SqlExecutor, limit = 10): DailyReportSnapshot[] {
  return db.all<DailyReportSnapshotRow>(SELECT_RECENT_SQL, { limit }).map(rowToSnapshot);
}
