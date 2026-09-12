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

// PTW permit lifecycle(status/closedAt/safetyChecklist) 스냅샷 — permit당 1행.
// safetyChecklist는 PTWSafetyChecklist.tsx가 생성 시점 이후 토글 UI를 제공하지
// 않으므로(읽기 전용 표시) JSON blob이 아닌 컬럼으로 시딩 시 1회 기록한다.
const PTW_PERMITS_DDL = `
  CREATE TABLE IF NOT EXISTS ptw_permits (
      permit_id                TEXT PRIMARY KEY,
      status                   TEXT NOT NULL CHECK (status IN ('DRAFT','PREPARED','APPROVED','ACTIVE','CLOSED')),
      fire_watch_assigned      INTEGER NOT NULL DEFAULT 0,
      gas_detector_continuous  INTEGER NOT NULL DEFAULT 0,
      loto_applied             INTEGER NOT NULL DEFAULT 0,
      forced_ventilation       INTEGER NOT NULL DEFAULT 0,
      ppe_verified             INTEGER NOT NULL DEFAULT 0,
      barricade_set            INTEGER NOT NULL DEFAULT 0,
      working_at_height        INTEGER,
      closed_at                TEXT,
      updated_at               TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
`;

// 전자 서명 로그(SSHQE §4.2 PART C/D/E) — append-only, permit_gas_tests와 동일한
// "이벤트 1건당 1행" 컨벤션. UNIQUE(permit_id, role)로 "역할당 1회 서명"을
// usePTWPermits.addSignature()의 클라이언트 측 규칙과 동일하게 DB 레벨에서도 보장한다.
const PTW_SIGNATURES_DDL = `
  CREATE TABLE IF NOT EXISTS ptw_signatures (
      signature_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_id     TEXT NOT NULL,
      role          TEXT NOT NULL,
      staff_id      TEXT NOT NULL,
      staff_name    TEXT NOT NULL,
      signed_at     TEXT NOT NULL,
      UNIQUE(permit_id, role)
  );
  CREATE INDEX IF NOT EXISTS idx_ptwsig_permit ON ptw_signatures(permit_id);
`;

// MRO Depot 부품 재고 마스터 — current_stock_qty는 mro_stock_transactions
// 적재분을 반영해 어댑터(mroInventoryDbAdapter.ts)가 트랜잭션 단위로 갱신하는
// 비정규화 컬럼이다(매 조회마다 SUM 재계산하지 않기 위함, work_orders.next_due_date와 동일한 설계).
const MRO_PARTS_DDL = `
  CREATE TABLE IF NOT EXISTS mro_parts (
      part_no             TEXT PRIMARY KEY,
      part_name           TEXT NOT NULL,
      uom                 TEXT NOT NULL,
      storage_location    TEXT,
      min_stock_qty       REAL NOT NULL DEFAULT 0,
      current_stock_qty   REAL NOT NULL DEFAULT 0,
      unit_cost           REAL,
      updated_at          TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
`;

// 입출고/조정 이력 — append-only. resulting_stock_qty는 기록 시점의 재고
// 스냅샷(감사 추적용)이며, mro_parts.current_stock_qty(SSOT)는 별도로 갱신된다.
const MRO_STOCK_TRANSACTIONS_DDL = `
  CREATE TABLE IF NOT EXISTS mro_stock_transactions (
      transaction_id      INTEGER PRIMARY KEY AUTOINCREMENT,
      part_no             TEXT NOT NULL,
      tx_type             TEXT NOT NULL CHECK (tx_type IN ('RECEIPT','ISSUE','ADJUSTMENT','RETURN')),
      quantity_delta      REAL NOT NULL,
      resulting_stock_qty REAL NOT NULL,
      work_order_id       TEXT,
      reason              TEXT,
      performed_by        TEXT NOT NULL,
      performed_at        TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
      CONSTRAINT fk_stocktx_part FOREIGN KEY (part_no) REFERENCES mro_parts(part_no) ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_stocktx_part_time ON mro_stock_transactions(part_no, performed_at DESC);
`;

// 저재고 자동 구매요청(PR) — mro_parts.current_stock_qty가 min_stock_qty
// 미만이 될 때 mroInventoryDbAdapter.adjustStock()이 자동으로 1건 발행한다.
// 부품당 OPEN 상태 PR은 항상 최대 1건만 존재하도록 어댑터 레벨에서 보장한다
// (재고가 계속 저재고인 동안 중복 발행 방지).
const MRO_PURCHASE_REQUISITIONS_DDL = `
  CREATE TABLE IF NOT EXISTS mro_purchase_requisitions (
      pr_id           INTEGER PRIMARY KEY AUTOINCREMENT,
      part_no         TEXT NOT NULL,
      suggested_qty   REAL NOT NULL,
      status          TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ORDERED','RECEIVED','CANCELLED')),
      trigger_reason  TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
      resolved_at     TEXT,
      CONSTRAINT fk_pr_part FOREIGN KEY (part_no) REFERENCES mro_parts(part_no) ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_pr_part_status ON mro_purchase_requisitions(part_no, status);
`;

// permit_lock_state / permit_sync_conflicts (CMMS_Architecture.md §5.5 낙관적 잠금 +
// 동기화 충돌 로그) — schema/cmms_schema.sqlite.sql / src/db/schema/cmms_schema.sql과
// 동일 정의를 기존 DB에 무중단 보강하기 위한 사본. 두 스키마 파일을 고치면 이 DDL도
// 같이 갱신해야 한다.
const PERMIT_LOCK_STATE_DDL = `
  CREATE TABLE IF NOT EXISTS permit_lock_state (
      permit_ref_no  TEXT PRIMARY KEY,
      stage_code     TEXT NOT NULL,
      status         TEXT NOT NULL,
      payload_hash   TEXT NOT NULL,
      updated_at     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
`;

// permit_suspension_state (CMMS_Architecture.md §5.3 AGT 4h timeout / shift-change
// auto-suspend) — additive, on-demand derived table. Kept separate from
// ptw_permits.status (whose CHECK constraint has no SUSPENDED value) so no
// existing schema/constraint is touched; see src/adapters/permitSuspensionAdapter.ts.
const PERMIT_SUSPENSION_STATE_DDL = `
  CREATE TABLE IF NOT EXISTS permit_suspension_state (
      permit_ref_no  TEXT PRIMARY KEY,
      reason         TEXT NOT NULL CHECK (reason IN ('AGT_GAS_TIMEOUT', 'SHIFT_CHANGE')),
      suspended_at   TEXT NOT NULL,
      cleared_at     TEXT
  );
`;

// permit_shift_ack (CMMS_Architecture.md §5.3 시프트 교대 자동 정지) — permit별
// "마지막으로 시프트 인수인계를 확인한 시각"만 담는 독립 테이블. permit_suspension_state
// (AGT_GAS_TIMEOUT/SHIFT_CHANGE 활성 정지 축)와 별도로 둔 이유: 그 테이블은
// permit당 1행(reason/suspended_at/cleared_at)이라 두 사유를 같은 컬럼으로
// 덮어쓰면 "마지막 시프트 확인 시각"과 "마지막 AGT 정지 해제 시각"이 서로
// 뒤섞인다. 이 테이블은 그 문제를 피하려고 완전히 분리했다.
const PERMIT_SHIFT_ACK_DDL = `
  CREATE TABLE IF NOT EXISTS permit_shift_ack (
      permit_ref_no    TEXT PRIMARY KEY,
      acknowledged_at  TEXT NOT NULL
  );
`;

// permit_metadata (CMMS_Architecture.md §5.2 SIMOPS) — permit type/work-area/
// equipment-tag snapshot at creation time. ptw_permits has no such columns
// today, so this additive table lets evaluateSimopsInterferenceDb() query
// real persisted state instead of only a single browser's in-memory permits[].
const PERMIT_METADATA_DDL = `
  CREATE TABLE IF NOT EXISTS permit_metadata (
      permit_ref_no  TEXT PRIMARY KEY,
      ptw_type       TEXT NOT NULL,
      work_area      TEXT NOT NULL,
      equipment_tag  TEXT NOT NULL
  );
`;

const PERMIT_SYNC_CONFLICTS_DDL = `
  CREATE TABLE IF NOT EXISTS permit_sync_conflicts (
      conflict_id                INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_ref_no              TEXT NOT NULL,
      server_payload_hash        TEXT NOT NULL,
      client_base_payload_hash   TEXT NOT NULL,
      conflict_payload           TEXT NOT NULL,
      status                     TEXT NOT NULL DEFAULT 'REQUIRES_SITE_MANAGER_REVIEW'
          CHECK (status IN ('REQUIRES_SITE_MANAGER_REVIEW', 'RESOLVED')),
      created_at                 TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
      resolved_at                TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_permit_sync_conflicts_open ON permit_sync_conflicts(status, created_at DESC);
`;

let cachedDb: SqlExecutor | undefined;

/** CMMS API route 전용 SQLite 연결. 프로세스 수명 동안 하나만 생성된다. */
export function getCmmsDb(): SqlExecutor {
  if (!cachedDb) {
    const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';
    const executor = createNodeSqliteExecutor(dbPath);
    executor.raw.exec(PERMIT_GAS_TESTS_DDL);
    executor.raw.exec(WORK_ORDERS_DDL);
    executor.raw.exec(PTW_PERMITS_DDL);
    executor.raw.exec(PTW_SIGNATURES_DDL);
    executor.raw.exec(MRO_PARTS_DDL);
    executor.raw.exec(MRO_STOCK_TRANSACTIONS_DDL);
    executor.raw.exec(MRO_PURCHASE_REQUISITIONS_DDL);
    executor.raw.exec(PERMIT_LOCK_STATE_DDL);
    executor.raw.exec(PERMIT_SYNC_CONFLICTS_DDL);
    executor.raw.exec(PERMIT_SUSPENSION_STATE_DDL);
    executor.raw.exec(PERMIT_SHIFT_ACK_DDL);
    executor.raw.exec(PERMIT_METADATA_DDL);
    cachedDb = executor;
  }
  return cachedDb;
}
