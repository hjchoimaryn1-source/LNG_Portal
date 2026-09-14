// src/cmms-daily-ops/pid/pidCoordinatesDao.ts
//
// PURPOSE
//   pid_tag_coordinates(Stage A, pidReconciliationSchema.ts) 순수 DAO.
//   tag_id가 진짜 PRIMARY KEY라 ON CONFLICT upsert를 안전하게 쓸 수 있다
//   (dailyOpsPatrolDao.ts의 앱 레벨 upsert 우회와 다른 케이스 — 여기는
//   실제 UNIQUE 제약이 있어 ALTER-only 정책과 무관).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface PidTagCoordinate {
  tagId: string;
  x: number;
  y: number;
  calibrated: boolean;
  notes: string | null;
}

interface PidTagCoordinateRow {
  tag_id: string;
  x: number;
  y: number;
  calibrated: number;
  notes: string | null;
}

function rowToCoordinate(row: PidTagCoordinateRow): PidTagCoordinate {
  return { tagId: row.tag_id, x: row.x, y: row.y, calibrated: row.calibrated === 1, notes: row.notes };
}

const SELECT_ALL_SQL = `SELECT * FROM pid_tag_coordinates`;

const UPSERT_SQL = `
  INSERT INTO pid_tag_coordinates (tag_id, x, y, calibrated, notes)
  VALUES (@tagId, @x, @y, @calibrated, @notes)
  ON CONFLICT(tag_id) DO UPDATE SET x = @x, y = @y, calibrated = @calibrated, notes = @notes
`;

/** 좌표 upsert — 캘리브레이션 모드에서 태그 클릭 위치를 저장할 때 사용. */
export function upsertTagCoordinate(
  db: SqlExecutor,
  tagId: string,
  x: number,
  y: number,
  calibrated: boolean,
  notes: string | null = null
): void {
  db.run(UPSERT_SQL, { tagId, x, y, calibrated: calibrated ? 1 : 0, notes });
}

/** 전체 좌표(캘리브레이션 여부 무관) — PIDOverlayView 초기 로드가 사용. */
export function listCoordinates(db: SqlExecutor): PidTagCoordinate[] {
  return db.all<PidTagCoordinateRow>(SELECT_ALL_SQL).map(rowToCoordinate);
}

/** candidateTagIds 중 아직 calibrated=true 좌표가 없는 태그만 반환. */
export function listUncalibrated(db: SqlExecutor, candidateTagIds: string[]): string[] {
  const calibratedSet = new Set(listCoordinates(db).filter((c) => c.calibrated).map((c) => c.tagId));
  return candidateTagIds.filter((tagId) => !calibratedSet.has(tagId));
}
