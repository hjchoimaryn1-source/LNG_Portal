-- ============================================================================
-- Phase 10 — Stage 1A: Additive MRO/PM Schema Migration
-- SSOT: CMMS_Architecture.md §1.4 / §4.4 (PostgreSQL 원본)을 SQLite 방언으로 이식.
-- 근거: docs/phase10-stage0-investigation-report.md Task 1/3/4/5/6.
--
-- 원칙 (Strangler Fig + Adapter Pattern):
--   1) 이 파일은 ADDITIVE ONLY다. 기존 테이블(mro_parts, mro_stock_transactions,
--      mro_purchase_requisitions, work_orders, asset_parts_impa, impa_catalog 등)에
--      대한 DROP은 단 한 줄도 포함하지 않는다.
--   2) 모든 CREATE TABLE/VIEW/INDEX는 IF NOT EXISTS로 재실행 안전(idempotent)해야 한다.
--   3) work_orders에 대한 컬럼 추가(ALTER TABLE ADD COLUMN)는 이 파일에 없다 —
--      SQLite(3.53, node:sqlite 번들)는 PostgreSQL의 `ADD COLUMN IF NOT EXISTS`
--      문법을 지원하지 않는다(실측 확인: "near \"EXISTS\": syntax error"). 재실행
--      가능한 형태로 만들려면 PRAGMA table_info로 기존 컬럼 존재 여부를 먼저
--      확인해야 하므로, 순수 SQL 파일이 아닌 별도 러너
--      (phase10Stage1ARunner.ts)에서 프로그래밍적으로 처리한다.
--   4) SQLite는 PostgreSQL의 BIGINT/VARCHAR/NUMERIC/BOOLEAN/ENUM/
--      TIMESTAMP WITH TIME ZONE 타입이 없으므로 기존 schema/cmms_schema.sqlite.sql
--      관례를 그대로 따른다: INTEGER PRIMARY KEY AUTOINCREMENT / TEXT / REAL /
--      INTEGER 0·1 CHECK / TEXT ISO8601(STRFTIME 기본값) / TEXT CHECK(...) IN (...).
--   5) SQLite에는 COMMENT ON COLUMN이 없다 — 컬럼 단위 설명은 이 파일 내
--      SQL 주석으로만 남긴다(DB 메타데이터에는 반영되지 않음).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. impa_catalog / asset_parts_impa — 이미 라이브 DB에 존재 (schema/
--    cmms_schema.sqlite.sql 기준, 0 rows, Stage 0 Task 1/2 확인). 여기서는
--    DROP 없이 동일 정의로 IF NOT EXISTS 재선언만 한다(재실행 안전성 확보 목적,
--    실질적으로는 no-op).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS impa_catalog (
    impa_code           TEXT PRIMARY KEY,
    part_name             TEXT NOT NULL,
    specification           TEXT,
    unit                       TEXT NOT NULL DEFAULT 'PCS',
    unit_price_usd               REAL NOT NULL DEFAULT 0.00,
    created_at                     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- DEPRECATED (Stage 0 Task 1/2): current_stock/reorder_level는 재고 SSOT가
-- 아니다. 실 재고는 inventory_items.current_stock(§2 아래)을 SSOT로 하고,
-- 조회는 v_asset_parts_stock 뷰(§3)를 사용할 것. 이 두 컬럼은 하위호환을 위해
-- 컬럼 자체는 유지하되, 신규 삽입 시 항상 0/기본값으로 고정하고(Stage 1B
-- crosswalkBuilder.ts 참고) 별도 갱신 로직을 연결하지 않는다.
CREATE TABLE IF NOT EXISTS asset_parts_impa (
    part_mapping_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_tag         TEXT NOT NULL,
    impa_code               TEXT NOT NULL,
    current_stock             INTEGER NOT NULL DEFAULT 0,   -- DEPRECATED: 재고 SSOT 아님 (see inventory_items)
    reorder_level               INTEGER NOT NULL DEFAULT 5,   -- DEPRECATED: 재고 SSOT 아님 (see inventory_items)
    min_order_qty                 INTEGER NOT NULL DEFAULT 1,
    storage_location                 TEXT,
    created_at                         TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                           TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_parts_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE CASCADE,
    CONSTRAINT fk_parts_impa FOREIGN KEY (impa_code) REFERENCES impa_catalog(impa_code) ON DELETE RESTRICT,
    CONSTRAINT uq_asset_part UNIQUE (equipment_tag, impa_code)
);
CREATE INDEX IF NOT EXISTS idx_parts_stock_reorder ON asset_parts_impa(equipment_tag) WHERE current_stock <= reorder_level;

-- ----------------------------------------------------------------------------
-- 2. inventory_items / inventory_ledgers — CMMS_Architecture.md §4.4 신규 이식.
--    이 두 테이블이 재고 수량의 SSOT다 (asset_parts_impa.current_stock이 아님).
--    mro_parts/mro_stock_transactions(기존, 무수정)과는 별개의 병렬 스키마다 —
--    Stage 1B는 매핑만 만들고, 실 수량 이관은 이 스테이지 범위 밖(HJ 승인 후).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inventory_items (
    impa_code           TEXT PRIMARY KEY,
    item_name_en          TEXT NOT NULL,
    specification           TEXT,
    unit_of_measure           TEXT NOT NULL DEFAULT 'PCS',
    min_stock_level             INTEGER NOT NULL DEFAULT 0,
    reorder_point                 INTEGER NOT NULL DEFAULT 5,
    safety_stock                    INTEGER NOT NULL DEFAULT 2,
    current_stock                     INTEGER NOT NULL DEFAULT 0,
    reserved_stock                      INTEGER NOT NULL DEFAULT 0,
    unit_price_usd                       REAL NOT NULL DEFAULT 0.00,
    storage_location                       TEXT NOT NULL,
    is_active                                INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at                                 TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                                   TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS inventory_ledgers (
    ledger_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    impa_code             TEXT NOT NULL,
    transaction_type        TEXT NOT NULL CHECK (transaction_type IN ('ISSUE','RECEIPT','ADJUSTMENT','RETURN')),
    quantity                   INTEGER NOT NULL,
    balance_after                 INTEGER NOT NULL,
    reference_wo_number             TEXT,
    unit_price_usd                    REAL NOT NULL,
    total_price_usd                     REAL GENERATED ALWAYS AS (quantity * unit_price_usd) STORED,
    performed_by                          TEXT NOT NULL,
    remarks                                 TEXT,
    created_at                                TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_ledger_item FOREIGN KEY (impa_code) REFERENCES inventory_items(impa_code) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_ledger_impa_created ON inventory_ledgers(impa_code, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. v_asset_parts_stock — equipment_tag 기준 재고 조회 뷰. asset_parts_impa
--    (설비<->IMPA 매핑, FK: impa_catalog)와 inventory_items(수량 SSOT)를
--    impa_code로 조인한다. 주의: 두 테이블의 impa_code는 현재 DB 레벨 FK로
--    서로 묶여있지 않다(impa_catalog와 inventory_items는 독립적으로 채워지는
--    별개 카탈로그) — Stage 1B/이후 스테이지에서 정합성 정책이 필요하다.
-- ----------------------------------------------------------------------------

CREATE VIEW IF NOT EXISTS v_asset_parts_stock AS
SELECT ap.equipment_tag, ap.impa_code, ii.current_stock, ii.reorder_point
FROM asset_parts_impa ap
JOIN inventory_items ii ON ap.impa_code = ii.impa_code;

-- ----------------------------------------------------------------------------
-- 4. external_overhauls — CMMS_Architecture.md §4.4 신규 이식. 독립 상태머신.
--    Stage 0 Task 6 확인: NP-06 Ch.6은 벤더/계약 관리 절차이며 이 디스패치/
--    수리/반납 사이클과 무관하다 — 이 테이블은 스펙의 CHECK 제약만 사용하고
--    NP-06 Ch.6 텍스트에서 상태 전이 근거를 끌어오지 않는다(Stage 0 보고서
--    Task 6 참고).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS external_overhauls (
    overhaul_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    overhaul_ref_no       TEXT NOT NULL UNIQUE,
    equipment_tag           TEXT NOT NULL,
    impa_code                 TEXT,
    vendor_name                 TEXT NOT NULL,
    status                        TEXT NOT NULL DEFAULT 'DISPATCH_PENDING'
        CHECK (status IN ('DISPATCH_PENDING','IN_TRANSIT_OUT','UNDER_REPAIR','TESTING_INSPECTION','IN_TRANSIT_IN','RETURNED_INSTALLED','CANCELLED')),
    dispatched_date                 TEXT NOT NULL,
    expected_return_date              TEXT NOT NULL,
    actual_return_date                  TEXT,
    repair_cost_usd                       REAL DEFAULT 0.00,
    transport_cost_usd                      REAL DEFAULT 0.00,
    scope_of_work                              TEXT NOT NULL,
    created_at                                    TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_overhaul_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 5. pm_schedules — CMMS_Architecture.md §4.4 신규 이식. Stage 0 Task 1/5
--    확인: 기존 런타임 스키마는 이 테이블 없이 work_orders.pm_cycle_days로
--    축약되어 있었다. 이 스테이지는 테이블만 추가하고 row는 삽입하지 않는다
--    (INSERT는 Stage 1D 산출물에 대한 HJ 승인 이후 별도 스테이지 범위).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pm_schedules (
    pm_id               INTEGER PRIMARY KEY AUTOINCREMENT,
    pm_code               TEXT NOT NULL UNIQUE,
    equipment_tag           TEXT NOT NULL,
    title                     TEXT NOT NULL,
    interval_type               TEXT NOT NULL CHECK (interval_type IN ('RUNNING_HOURS','CALENDAR')),
    interval_value                 INTEGER NOT NULL,
    last_performed_hours              REAL DEFAULT 0.00,
    last_performed_date                  TEXT,
    next_due_date                           TEXT,
    is_active                                  INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    auto_generate_wo                             INTEGER NOT NULL DEFAULT 1 CHECK (auto_generate_wo IN (0,1)),
    created_at                                      TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_pm_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_pm_next_due ON pm_schedules(next_due_date) WHERE is_active = 1;

-- ----------------------------------------------------------------------------
-- 6. work_orders 컬럼 추가는 이 파일에 없음 — phase10Stage1ARunner.ts가
--    PRAGMA table_info(work_orders)로 존재 여부를 확인한 뒤 아래 4개 컬럼을
--    필요한 것만 개별 ALTER TABLE ADD COLUMN으로 추가한다:
--      wo_type          TEXT CHECK (wo_type IN ('PM','CM','CBM'))
--      priority         TEXT CHECK (priority IN ('EMERGENCY','HIGH','MEDIUM','LOW'))
--      is_ptw_required  INTEGER NOT NULL DEFAULT 0 CHECK (is_ptw_required IN (0,1))
--      permit_id        INTEGER
--    기존 25개 row는 wo_type/priority가 NULL로 남는다(백필은 이 스테이지
--    범위 밖). permit_id는 permits 테이블이 아직 없으므로(Phase 3 범위,
--    schema/cmms_schema.sqlite.sql:183 주석 참고) FK를 걸지 않는다 —
--    permit_lock_state/permit_gas_tests와 동일한 기존 타협.
-- ----------------------------------------------------------------------------
