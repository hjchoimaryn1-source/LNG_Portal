// src/adapters/db/gasTestDao.ts
//
// PURPOSE
//   permit_gas_tests 테이블에 대한 순수 DAO. SqlExecutor에만 의존하며 React/Next
//   바인딩이 없다. GasTestRecordDraft(ptwFormAdapter.ts) <-> SQL row 매핑만
//   책임진다 — PASS/FAIL 판정 로직(validatePTWGasSafety)은 재구현하지 않는다.
//   컬럼 구조는 CMMS_Architecture.md §2.4 SSOT를 SQLite로 이식한 것이며(BIGINT
//   PK -> INTEGER AUTOINCREMENT, permit_id는 BIGINT FK 대신 TEXT permit_ref_no,
//   FK 제약 없음 — permits 정규 테이블은 아직 Phase 3 범위라 존재하지 않는다),
//   측정 이벤트 1건당 1행(레거시 GasRetestEntryModal의 LEL/O2/H2S/CO를 한 행에
//   같이 담는 기존 GasTestRecordDraft 모델)을 그대로 따른다.

import type { SqlExecutor } from './sqlExecutor';
import type { GasTestRecordDraft, GasTestRecordType } from '../ptwFormAdapter';

interface GasTestRow {
  gas_test_id: number;
  permit_id: string;
  test_type: string;
  lel_percent: number;
  o2_percent: number;
  h2s_ppm: number;
  co_ppm: number;
  result_status: string;
  block_reason: string | null;
  tested_by_agt: string;
  agt_signature: string;
  tested_at: string;
}

const INSERT_SQL = `
  INSERT INTO permit_gas_tests (
    permit_id, test_type, lel_percent, o2_percent, h2s_ppm, co_ppm,
    result_status, block_reason, tested_by_agt, agt_signature, tested_at
  ) VALUES (
    @permitId, @testType, @lelPercent, @o2Percent, @h2sPpm, @coPpm,
    @resultStatus, @blockReason, @testedByAgt, @agtSignature, @testedAt
  )
`;

const SELECT_BY_PERMIT_SQL = `
  SELECT * FROM permit_gas_tests
  WHERE permit_id = @permitId
  ORDER BY tested_at DESC, gas_test_id DESC
`;

const SELECT_ALL_SQL = `
  SELECT * FROM permit_gas_tests
  ORDER BY tested_at DESC, gas_test_id DESC
`;

const SELECT_RECENT_SQL = `
  SELECT * FROM permit_gas_tests
  WHERE tested_at >= STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now', @windowClause)
  ORDER BY tested_at DESC, gas_test_id DESC
`;

function rowToDraft(row: GasTestRow): GasTestRecordDraft {
  return {
    permitRefNo: row.permit_id,
    testType: row.test_type as GasTestRecordType,
    lelPercent: row.lel_percent,
    o2Percent: row.o2_percent,
    h2sPpm: row.h2s_ppm,
    coPpm: row.co_ppm,
    resultStatus: row.result_status as GasTestRecordDraft['resultStatus'],
    blockReason: row.block_reason,
    testedByAgt: row.tested_by_agt,
    agtSignature: row.agt_signature,
    testedAt: row.tested_at,
  };
}

/** 가스 측정 draft 1건을 permit_gas_tests에 INSERT한다. */
export function insertGasTestRecord(db: SqlExecutor, draft: GasTestRecordDraft): void {
  db.run(INSERT_SQL, {
    permitId: draft.permitRefNo,
    testType: draft.testType,
    lelPercent: draft.lelPercent,
    o2Percent: draft.o2Percent,
    h2sPpm: draft.h2sPpm,
    coPpm: draft.coPpm,
    resultStatus: draft.resultStatus,
    blockReason: draft.blockReason,
    testedByAgt: draft.testedByAgt,
    agtSignature: draft.agtSignature,
    testedAt: draft.testedAt,
  });
}

/** 특정 permit(permitRefNo)의 기록을 최신순으로 조회한다. */
export function selectGasTestRecordsByPermit(db: SqlExecutor, permitRefNo: string): GasTestRecordDraft[] {
  const rows = db.all<GasTestRow>(SELECT_BY_PERMIT_SQL, { permitId: permitRefNo });
  return rows.map(rowToDraft);
}

/** 전체 기록을 최신순으로 조회한다 (dual-read 정합성 검증/마이그레이션용). */
export function selectAllGasTestRecords(db: SqlExecutor): GasTestRecordDraft[] {
  return db.all<GasTestRow>(SELECT_ALL_SQL).map(rowToDraft);
}

/** 최근 windowHours 시간 내 기록(PASS/FAIL 모두)을 최신순으로 조회한다. */
export function selectRecentGasTestRecords(db: SqlExecutor, windowHours: number): GasTestRecordDraft[] {
  const rows = db.all<GasTestRow>(SELECT_RECENT_SQL, { windowClause: `-${windowHours} hours` });
  return rows.map(rowToDraft);
}
