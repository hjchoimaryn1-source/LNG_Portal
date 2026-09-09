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

-- ----------------------------------------------------------------------------
-- 3. permit_gas_tests — AGT 가스측정 이력 (SSOT §2.4 GasTestRecord 이식)
--    TODO(cmms-permit-gas-tests) 해소용 테이블.
--
--    주의: permits 마스터 테이블 전체는 Phase 3 범위이므로, 여기서는 아직
--    permits(permit_id) 대신 permit_lock_state(permit_ref_no)를 참조 FK로 사용한다.
--    Phase 3에서 permits 테이블이 도입되면 permit_ref_no -> permit_id 마이그레이션
--    후 FK를 permits(permit_id)로 교체한다 (asset_tag_alias와 동일한 과도기 패턴).
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS permit_gas_tests;
CREATE TABLE permit_gas_tests (
    gas_test_id                INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_ref_no                TEXT NOT NULL,          -- 레거시 PTWPermit.id / permit_lock_state.permit_ref_no
    test_type                      TEXT NOT NULL CHECK (test_type IN ('INITIAL','RETEST','CONTINUOUS')),
    lel_percent                       REAL NOT NULL,
    o2_percent                          REAL NOT NULL,
    h2s_ppm                                REAL NOT NULL DEFAULT 0,
    co_ppm                                    REAL,
    result_status                                TEXT NOT NULL CHECK (result_status IN ('PASS','FAIL')),
    tested_by_agt                                  TEXT NOT NULL,   -- AGT 담당자 ID
    agt_signature                                    TEXT NOT NULL,  -- 전자서명 원본 또는 레거시 재사용 값

    -- 설계 결정(§4 Decision Log): 전용 서명 캡처 UI가 없어 기존 TESTER NAME/ID 값을
    -- 서명으로 재사용하는 경우, agt_signature에는 LEGACY_SIGNATURE_REUSE_PREFIX
    -- 접두사가 붙고 아래 플래그가 1로 설정된다. 실제 전자서명 UI 도입 후
    -- 이 플래그가 1인 레코드만 골라 재서명 요청을 발송한다.
    is_signature_legacy_reused                          INTEGER NOT NULL DEFAULT 0 CHECK (is_signature_legacy_reused IN (0,1)),

    tested_at                                              TEXT NOT NULL,     -- ISO8601
    created_at                                               TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),

    CONSTRAINT fk_gastest_permit FOREIGN KEY (permit_ref_no) REFERENCES permit_lock_state(permit_ref_no) ON DELETE CASCADE
);
CREATE INDEX idx_gastest_permit_time ON permit_gas_tests(permit_ref_no, tested_at DESC);
CREATE INDEX idx_gastest_needs_resign ON permit_gas_tests(is_signature_legacy_reused) WHERE is_signature_legacy_reused = 1;

-- ----------------------------------------------------------------------------
-- 4. asset_dual_read_diffs — Phase 1 Dual Read 불일치 로그
--    (Refactoring Plan §3.2 Phase 1: "화면에는 레거시만 노출하되 콘솔/로그로 diff
--    비교". 이미 PROMOTED된 자산은 staging_legacy_assets.mapping_status를 절대
--    되돌리지 않는다는 Phase 0 불변성을 지키기 위해, 승격 후 발생한 drift는
--    별도의 이 테이블에만 기록한다 — staging 테이블을 직접 건드리지 않는다.
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS asset_dual_read_diffs;
CREATE TABLE asset_dual_read_diffs (
    diff_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    legacy_tag          TEXT NOT NULL,
    equipment_tag          TEXT NOT NULL,
    field_name                TEXT NOT NULL,        -- LegacyAssetRow의 키 (name/loc/maker/crit/status/type)
    legacy_value                 TEXT,
    cmms_value                     TEXT,
    detected_at                       TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    resolved                            INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0,1)),
    CONSTRAINT fk_diff_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE CASCADE
);
CREATE INDEX idx_diff_unresolved ON asset_dual_read_diffs(legacy_tag, field_name, resolved) WHERE resolved = 0;

-- ============================================================================
-- 시딩 예시 (수동 검증용, 운영 배치에는 미포함)
-- ============================================================================
-- INSERT INTO staging_legacy_assets (legacy_tag, legacy_name, legacy_location_raw, legacy_maker, legacy_criticality_raw, legacy_status_raw, legacy_type_filter)
-- VALUES ('AAV-104', 'Ambient Air Vaporizer Skid 104', 'Vaporizer Area', 'Chart Industries', 'High', 'RUNNING', 'PLANT');
