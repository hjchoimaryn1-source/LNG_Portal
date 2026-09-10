// src/adapters/db/cmmsDbSingleton.ts
//
// PURPOSE
//   API route(src/app/api/v1/cmms/gas-tests/route.ts 등)가 재사용하는 지연
//   초기화 SqlExecutor 싱글턴. runBootstrapPipeline.ts처럼 실행마다 열고
//   닫는 대신, Next.js 서버 프로세스 수명 동안 node:sqlite 연결 하나를
//   유지한다 — 요청마다 파일을 여닫는 비용을 피하기 위함이다.
//
//   최초 호출 시 permit_gas_tests 테이블/인덱스를 CREATE ... IF NOT EXISTS로
//   보강한다. 이미 자산 데이터가 적재된 기존 nias_cmms.db(schema/
//   cmms_schema.sqlite.sql 기준 assets/staging_legacy_assets 등 포함)를
//   파괴적으로 재생성하지 않기 위함이며, 전체 스키마 재적용은 여전히
//   [DB Reset & Re-sync] 관리자 버튼(runBootstrapPipeline.ts, resetDb: true)
//   경로로만 일어난다.

import { createNodeSqliteExecutor } from './nodeSqliteExecutor';
import type { SqlExecutor } from './sqlExecutor';

const PERMIT_GAS_TESTS_DDL = `
  CREATE TABLE IF NOT EXISTS permit_gas_tests (
      gas_test_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_id       TEXT NOT NULL,
      test_type       TEXT NOT NULL CHECK (test_type IN ('INITIAL', 'RETEST', 'CONTINUOUS')),
      lel_percent     REAL NOT NULL,
      o2_percent      REAL NOT NULL,
      h2s_ppm         REAL NOT NULL,
      co_ppm          REAL NOT NULL DEFAULT 0.0,
      result_status   TEXT NOT NULL CHECK (result_status IN ('PASS', 'FAIL')),
      block_reason    TEXT,
      tested_by_agt   TEXT NOT NULL,
      agt_signature   TEXT NOT NULL,
      tested_at       TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_gastest_permit_time ON permit_gas_tests(permit_id, tested_at DESC);
`;

// work_orders / PM 스케줄러 (CMMS_Architecture.md §4.4 축약형) — schema/
// cmms_schema.sqlite.sql / src/db/schema/cmms_schema.sql과 동일 정의를
// 기존 DB에 무중단 보강하기 위한 사본. 두 스키마 파일을 고치면 이 DDL도
// 같이 갱신해야 한다.
const WORK_ORDERS_DDL = `
  CREATE TABLE IF NOT EXISTS work_orders (
      work_order_id     TEXT PRIMARY KEY,
      asset_tag         TEXT NOT NULL,
      title             TEXT NOT NULL,
      pm_cycle_days     INTEGER,
      last_performed_at TEXT,
      next_due_date     TEXT,
      status            TEXT NOT NULL DEFAULT 'SCHEDULED'
          CHECK (status IN ('SCHEDULED','IN_PROGRESS','PARTS_PENDING','COMPLETED')),
      created_at        TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
      CONSTRAINT fk_wo_asset FOREIGN KEY (asset_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_wo_asset_status ON work_orders(asset_tag, status);
  CREATE INDEX IF NOT EXISTS idx_wo_next_due ON work_orders(next_due_date) WHERE next_due_date IS NOT NULL;
`;

let cachedDb: SqlExecutor | undefined;

/** CMMS API route 전용 SQLite 연결. 프로세스 수명 동안 하나만 생성된다. */
export function getCmmsDb(): SqlExecutor {
  if (!cachedDb) {
    const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
    const executor = createNodeSqliteExecutor(dbPath);
    executor.raw.exec(PERMIT_GAS_TESTS_DDL);
    executor.raw.exec(WORK_ORDERS_DDL);
    cachedDb = executor;
  }
  return cachedDb;
}
