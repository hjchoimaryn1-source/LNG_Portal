// src/adapters/db/permitShiftAckDao.ts
//
// PURPOSE
//   permit_shift_ack 테이블(permit별 "마지막으로 시프트 인수인계를 확인한
//   시각")에 대한 순수 DAO. permit_suspension_state와 고의로 분리되어 있다 —
//   자세한 이유는 cmmsDbSingleton.ts의 PERMIT_SHIFT_ACK_DDL 주석 참고.

import type { SqlExecutor } from './sqlExecutor';

const UPSERT_SQL = `
  INSERT INTO permit_shift_ack (permit_ref_no, acknowledged_at)
  VALUES (@permitRefNo, @acknowledgedAt)
  ON CONFLICT(permit_ref_no) DO UPDATE SET acknowledged_at = excluded.acknowledged_at
`;

const SELECT_ALL_SQL = `SELECT permit_ref_no, acknowledged_at FROM permit_shift_ack`;

/** 인수인계 확인 시각을 기록(갱신)한다. */
export function upsertShiftAck(db: SqlExecutor, permitRefNo: string, acknowledgedAt: string): void {
  db.run(UPSERT_SQL, { permitRefNo, acknowledgedAt });
}

/** permit_ref_no -> 마지막 확인 시각 전체 맵 — 정지 재평가 시 한 번에 조회. */
export function selectAllShiftAcks(db: SqlExecutor): Map<string, string> {
  const rows = db.all<{ permit_ref_no: string; acknowledged_at: string }>(SELECT_ALL_SQL);
  return new Map(rows.map((r) => [r.permit_ref_no, r.acknowledged_at]));
}
