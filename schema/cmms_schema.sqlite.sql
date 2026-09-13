-- ============================================================================
-- NIAS CMMS Phase 1 — SQLite DDL
-- SSOT: CMMS_Architecture.md §1.4 (PostgreSQL 원본)을 SQLite 방언으로 이식.
-- Refactoring Plan §1.3 (staging_legacy_assets)을 실제 구현.
--
-- 원칙:
--   1) 기존 포털 데이터(Legacy)는 원본 그대로 staging_legacy_assets에 적재한다.
--   2) IMPA/KKS 매핑이 비어있는 레코드도 NOT NULL 제약으로 인해 적재가 막히지
--      않도록, staging 계층에서는 매핑 컬럼을 전부 nullable로 둔다.
--      (공백/미완료 데이터 수용이 staging 테이블의 핵심 목적)
--   3) 정규 테이블(assets 등)은 SSOT 그대로 엄격한 제약을 유지한다.
--      staging -> 정규 테이블 승격(promote)은 mapping_status='PROMOTED' 시점에만
--      허용되며, 애플리케이션 레이어(assetAdapter.ts)가 이 경계를 강제한다.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 0. STAGING LAYER — 매핑 공백/미완료 데이터 수용
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS staging_legacy_assets;
CREATE TABLE staging_legacy_assets (
    staging_id              INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 레거시 원본 (필수: 최소한 tag/name은 있어야 적재 가능)
    legacy_tag               TEXT NOT NULL,               -- 기존 a.tag (예: "AAV-104")
    legacy_name               TEXT NOT NULL,               -- 기존 a.name
    legacy_location_raw       TEXT,                        -- 기존 a.loc 자유텍스트
    legacy_maker               TEXT,                        -- 기존 a.maker
    legacy_criticality_raw     TEXT,                        -- 기존 a.crit (대소문자/표기 혼재)
    legacy_status_raw           TEXT,                        -- 기존 a.status
    legacy_type_filter           TEXT CHECK (legacy_type_filter IN ('PLANT', 'INSTRUMENTS') OR legacy_type_filter IS NULL),
    legacy_impa_code_raw          TEXT,                        -- MRO 화면 비정형 IMPA 라벨 (공백 허용)

    -- 변환 산출값 — 매핑 미완료 시 전부 NULL 허용 (핵심: 공백 데이터 수용)
    proposed_equipment_tag        TEXT,                        -- Tag Normalization Service 산출값
    proposed_system_code           TEXT,
    proposed_kks_code               TEXT,
    proposed_iso14224_class          TEXT,
    proposed_criticality               TEXT CHECK (
        proposed_criticality IN ('CRITICAL','HIGH','MEDIUM','LOW') OR proposed_criticality IS NULL
    ),
    proposed_impa_code               TEXT,

    -- 승격 파이프라인 상태
    mapping_status                    TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
        CHECK (mapping_status IN ('PENDING_REVIEW','AUTO_MAPPED','MANUAL_OVERRIDE','PROMOTED','REJECTED')),
    needs_review                       INTEGER NOT NULL DEFAULT 1 CHECK (needs_review IN (0,1)),
    reviewer_id                         TEXT,
    reviewed_at                          TEXT,               -- ISO8601

    source_file_key                      TEXT,               -- 원본 추적용 (CSV 파일명 / mock data key 등)
    created_at                            TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                            TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_staging_mapping_status ON staging_legacy_assets(mapping_status);
CREATE INDEX idx_staging_legacy_tag ON staging_legacy_assets(legacy_tag);
CREATE INDEX idx_staging_needs_review ON staging_legacy_assets(needs_review) WHERE needs_review = 1;

-- 레거시 태그 <-> 신규 equipment_tag 영구 별칭 매핑
-- (마이그레이션 후에도 과거 WO/PTW 문서 참조 무결성 보존을 위해 유지)
DROP TABLE IF EXISTS asset_tag_alias;
CREATE TABLE asset_tag_alias (
    alias_id            INTEGER PRIMARY KEY AUTOINCREMENT,
    legacy_tag           TEXT NOT NULL UNIQUE,
    equipment_tag         TEXT NOT NULL,
    staging_id             INTEGER,                       -- 어느 staging 레코드에서 승격되었는지 추적
    created_at               TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_alias_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE CASCADE,
    CONSTRAINT fk_alias_staging FOREIGN KEY (staging_id) REFERENCES staging_legacy_assets(staging_id) ON DELETE SET NULL
);
CREATE INDEX idx_alias_equipment_tag ON asset_tag_alias(equipment_tag);

-- ----------------------------------------------------------------------------
-- 1. CMMS 정규 테이블 — ISO 14224 / KKS 5-Level 자산 계층 (SSOT §1.4 이식)
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS assets;
CREATE TABLE assets (
    equipment_tag         TEXT PRIMARY KEY,
    asset_name             TEXT NOT NULL,
    iso_14224_class          TEXT NOT NULL,
    kks_code                  TEXT NOT NULL UNIQUE,
    criticality                 TEXT NOT NULL CHECK (criticality IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    location_area                 TEXT NOT NULL,
    status                          TEXT NOT NULL DEFAULT 'OPERATIONAL'
        CHECK (status IN ('OPERATIONAL','MAINTENANCE','STANDBY','OUT_OF_SERVICE')),
    parent_tag                       TEXT,
    manufacturer                       TEXT,
    model_no                             TEXT,
    serial_no                             TEXT,
    design_pressure_bar                     REAL,
    design_temp_celsius                       REAL,
    installation_date                           TEXT,       -- ISO8601 date
    created_at                                     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                                       TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_assets_parent FOREIGN KEY (parent_tag) REFERENCES assets(equipment_tag) ON DELETE SET NULL
);
CREATE INDEX idx_assets_parent_tag ON assets(parent_tag);
CREATE INDEX idx_assets_location_area ON assets(location_area);
CREATE INDEX idx_assets_class_status ON assets(iso_14224_class, status);
CREATE INDEX idx_assets_criticality ON assets(criticality);

-- 한국선급(KR CMS) 연동 테이블
-- 주의: SQLite GENERATED ALWAYS AS 컬럼은 비결정적 함수(예: julianday('now'))를
-- 허용하지 않는다 (PostgreSQL STORED 컬럼과의 방언 차이). 따라서 d_day_status는
-- 저장 컬럼이 아닌, 아래 kr_cms_items_with_dday VIEW에서 조회 시점에 산출한다.
DROP TABLE IF EXISTS kr_cms_items;
CREATE TABLE kr_cms_items (
    cms_code            TEXT PRIMARY KEY,
    item_name             TEXT NOT NULL,
    survey_category         TEXT NOT NULL,
    survey_interval_m         INTEGER NOT NULL DEFAULT 60,
    last_survey_date            TEXT NOT NULL,
    next_survey_date              TEXT NOT NULL,
    created_at                        TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                          TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_kr_cms_next_date ON kr_cms_items(next_survey_date);

DROP VIEW IF EXISTS kr_cms_items_with_dday;
CREATE VIEW kr_cms_items_with_dday AS
SELECT
    cms_code,
    item_name,
    survey_category,
    survey_interval_m,
    last_survey_date,
    next_survey_date,
    CASE
        WHEN JULIANDAY(next_survey_date) - JULIANDAY('now') < 0 THEN 'OVERDUE'
        WHEN JULIANDAY(next_survey_date) - JULIANDAY('now') <= 60 THEN 'DUE_SOON'
        ELSE 'NORMAL'
    END AS d_day_status,
    created_at,
    updated_at
FROM kr_cms_items;

DROP TABLE IF EXISTS asset_kr_cms_mapping;
CREATE TABLE asset_kr_cms_mapping (
    mapping_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_tag         TEXT NOT NULL,
    cms_code                TEXT NOT NULL,
    remarks                   TEXT,
    created_at                  TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_cms_map_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE CASCADE,
    CONSTRAINT fk_cms_map_item FOREIGN KEY (cms_code) REFERENCES kr_cms_items(cms_code) ON DELETE CASCADE,
    CONSTRAINT uq_asset_cms UNIQUE (equipment_tag, cms_code)
);

-- IMPA 자재 카탈로그 및 설비-자재 매핑
DROP TABLE IF EXISTS impa_catalog;
CREATE TABLE impa_catalog (
    impa_code           TEXT PRIMARY KEY,
    part_name             TEXT NOT NULL,
    specification           TEXT,
    unit                       TEXT NOT NULL DEFAULT 'PCS',
    unit_price_usd               REAL NOT NULL DEFAULT 0.00,
    created_at                     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);

DROP TABLE IF EXISTS asset_parts_impa;
CREATE TABLE asset_parts_impa (
    part_mapping_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_tag         TEXT NOT NULL,
    impa_code               TEXT NOT NULL,
    current_stock             INTEGER NOT NULL DEFAULT 0,
    reorder_level               INTEGER NOT NULL DEFAULT 5,
    min_order_qty                 INTEGER NOT NULL DEFAULT 1,
    storage_location                 TEXT,
    created_at                         TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                           TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_parts_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE CASCADE,
    CONSTRAINT fk_parts_impa FOREIGN KEY (impa_code) REFERENCES impa_catalog(impa_code) ON DELETE RESTRICT,
    CONSTRAINT uq_asset_part UNIQUE (equipment_tag, impa_code)
);
CREATE INDEX idx_parts_stock_reorder ON asset_parts_impa(equipment_tag) WHERE current_stock <= reorder_level;

-- ----------------------------------------------------------------------------
-- 2. PTW Optimistic Locking 지원 컬럼 (State Mapper 검증용, SSOT §5.5 부분 이식)
--    permits 테이블 전체는 Phase 3 범위이므로, 여기서는 Phase 1 State Mapper가
--    참조하는 최소 컬럼(payload_hash)만 가진 경량 뷰용 테이블을 둔다.
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS permit_lock_state;
CREATE TABLE permit_lock_state (
    permit_ref_no        TEXT PRIMARY KEY,     -- 레거시 PTWPermit.id (예: "PTW-2026-0901-01")
    stage_code             TEXT NOT NULL,
    status                    TEXT NOT NULL,
    payload_hash                TEXT NOT NULL,   -- computePayloadHash() 결과 (SHA-256 hex)
    updated_at                    TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 오프라인 우선 동기화 충돌 로그 (SSOT §5.5 processOfflineOptimisticSync 이식)
-- — src/db/schema/cmms_schema.sql과 동일 정의(2b절 참고).
DROP TABLE IF EXISTS permit_sync_conflicts;
CREATE TABLE permit_sync_conflicts (
    conflict_id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_ref_no               TEXT NOT NULL,
    server_payload_hash         TEXT NOT NULL,
    client_base_payload_hash    TEXT NOT NULL,
    conflict_payload            TEXT NOT NULL,
    status                      TEXT NOT NULL DEFAULT 'REQUIRES_SITE_MANAGER_REVIEW'
                                 CHECK (status IN ('REQUIRES_SITE_MANAGER_REVIEW', 'RESOLVED')),
    created_at                  TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    resolved_at                 TEXT
);
CREATE INDEX idx_permit_sync_conflicts_open ON permit_sync_conflicts(status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. AGT 가스 측정 기록 (CMMS_Architecture.md §2.4 SSOT를 SQLite로 이식)
--    permit_id는 Postgres 원본의 BIGINT FK(permits.permit_id) 대신 레거시
--    PTWPermit.id 문자열(permit_ref_no)을 그대로 쓴다 — permits 정규 테이블은
--    아직 Phase 3 범위라 이 런타임 스키마에 존재하지 않으므로 FK 제약을 두지
--    않는다(permit_lock_state와 동일한 타협).
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS permit_gas_tests;
CREATE TABLE permit_gas_tests (
    gas_test_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_id       TEXT NOT NULL,             -- 레거시 PTWPermit.id (예: "PTW-2026-0901-01"), FK 없음
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
CREATE INDEX idx_gastest_permit_time ON permit_gas_tests(permit_id, tested_at DESC);

-- ----------------------------------------------------------------------------
-- 4. Work Order / PM 스케줄러 (CMMS_Architecture.md §4.4 축약형)
--    원본 설계는 work_orders(PM/CM/CBM 공용)와 pm_schedules(재사용 가능한
--    주기 정의)를 분리하지만, 이 런타임 스키마는 PM 주기(pm_cycle_days)를
--    work_orders 행에 직접 두는 단일 테이블로 축약한다. status는 아직
--    미구현인 원본의 확장 상태 머신 대신, 실제 프론트엔드(types/lng.ts
--    WorkOrderStatus)가 쓰는 값 그대로 맞춘다.
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS work_orders;
CREATE TABLE work_orders (
    work_order_id       TEXT PRIMARY KEY,          -- 예: "WO-2026-0001"
    asset_tag           TEXT NOT NULL,
    title                TEXT NOT NULL,
    pm_cycle_days         INTEGER,                  -- NULL 허용: PM 주기가 없는 1회성/CM 성격 WO
    last_performed_at       TEXT,                   -- ISO8601, NULL 허용(수행 이력 없음)
    next_due_date              TEXT,                -- YYYY-MM-DD, pmScheduleCalculator 산출값
    status                       TEXT NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED','IN_PROGRESS','PARTS_PENDING','COMPLETED')),
    created_at                     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_wo_asset FOREIGN KEY (asset_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
);
CREATE INDEX idx_wo_asset_status ON work_orders(asset_tag, status);
CREATE INDEX idx_wo_next_due ON work_orders(next_due_date) WHERE next_due_date IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. user_accounts / user_sessions (CMMS_Architecture.md §3.5.2 Postgres 원본을
--    SQLite 방언으로 이식). Phase 1 Quick-Login(클릭-투-로그인, LoginGateway.tsx)
--    대응을 위해 password_hash만 NOT NULL에서 nullable로 완화한다 — 그 외 컬럼/
--    제약은 §3.5.2 설계를 그대로 따른다.
--    DEV-ONLY: 비밀번호 검증 로직은 이번 단계에서 구현하지 않는다. 프로덕션 반영
--    전 password_hash를 다시 NOT NULL로 되돌리고 실제 해시 검증을 추가해야 한다.
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_accounts;
CREATE TABLE user_accounts (
    user_id               TEXT PRIMARY KEY,
    email                 TEXT NOT NULL UNIQUE,
    password_hash         TEXT,                    -- DEV-ONLY: nullable, see comment above
    role_code             TEXT NOT NULL
        CHECK (role_code IN (
            'SYSTEM_ADMIN','SITE_MANAGER','ACTING_SITE_MANAGER','OPERATION_TEAM_LEADER',
            'HSSE_OFFICER','WORK_LEADER_TECH','HQ_SUPERVISOR_AUDITOR'
        )),
    home_location         TEXT NOT NULL CHECK (home_location IN ('HQ', 'SITE')),
    mfa_enabled           INTEGER NOT NULL DEFAULT 0,
    failed_attempt_count  INTEGER NOT NULL DEFAULT 0,
    locked_until          TEXT,
    is_active             INTEGER NOT NULL DEFAULT 1,
    last_login_at         TEXT,
    created_at            TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE user_sessions (
    session_id            TEXT PRIMARY KEY,
    user_id               TEXT NOT NULL,
    issued_at             TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    expires_at            TEXT NOT NULL,
    device_device_id      TEXT,
    is_offline_reauth     INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- ============================================================================
-- 시딩 예시 (수동 검증용, 운영 배치에는 미포함)
-- ============================================================================
-- INSERT INTO staging_legacy_assets (legacy_tag, legacy_name, legacy_location_raw, legacy_maker, legacy_criticality_raw, legacy_status_raw, legacy_type_filter)
-- VALUES ('AAV-104', 'Ambient Air Vaporizer Skid 104', 'Vaporizer Area', 'Chart Industries', 'High', 'RUNNING', 'PLANT');
