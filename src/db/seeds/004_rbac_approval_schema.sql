-- Schema migration: role_permissions / approval_documents / approval_line_histories /
-- approval_delegations — DB materialization only (no business logic/service/UI wiring).
--
-- SOURCE NOTES:
--   * approval_documents / approval_line_histories / approval_delegations:
--     ported verbatim (column names, types, defaults, CHECK/FK constraints) from
--     CMMS_Architecture.md §3.3, Postgres -> SQLite dialect only (BIGSERIAL ->
--     INTEGER PRIMARY KEY AUTOINCREMENT, VARCHAR(n) -> TEXT, BIGINT -> INTEGER,
--     BOOLEAN -> INTEGER CHECK(col IN (0,1)), TIMESTAMP WITH TIME ZONE DEFAULT
--     CURRENT_TIMESTAMP -> TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))),
--     matching the dialect-port convention already used for user_accounts/work_orders/
--     permit_gas_tests in src/db/schema/cmms_schema.sql. Nullability of every column
--     is preserved exactly as specified in §3.3 (no NOT NULL added or removed).
--   * role_permissions: NO CREATE TABLE DDL exists anywhere in CMMS_Architecture.md —
--     only prose (§3.3.4) and the column list implied by this project's own
--     src/db/seeds/001_role_permissions.sql INSERT statement. This table's shape
--     below is therefore an INTERPRETIVE reconstruction, not a verbatim source
--     extraction (same caveat 001_role_permissions.sql already carries for its data).
--     Columns/order/UNIQUE(role_code, module_code) constraint match 001's INSERT
--     column list and src/lib/rbac/rolePermissionService.ts's static mirror exactly.
--     Recommend project-owner review before treating this DDL as final.
--
-- CREATE TABLE IF NOT EXISTS is used (rather than DROP+CREATE as in
-- src/db/schema/cmms_schema.sql) so this migration can be applied to the existing
-- live nias_cmms.db without destroying data already in it, consistent with the
-- incremental-patch pattern in src/adapters/db/cmmsDbSingleton.ts.

CREATE TABLE IF NOT EXISTS role_permissions (
    role_permission_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    role_code            TEXT NOT NULL CHECK (role_code IN (
        'SYSTEM_ADMIN','SITE_MANAGER','ACTING_SITE_MANAGER','OPERATION_TEAM_LEADER',
        'HSSE_OFFICER','WORK_LEADER_TECH','HQ_SUPERVISOR_AUDITOR'
    )),
    module_code           TEXT NOT NULL CHECK (module_code IN (
        'HQ_OVERVIEW','LNG_PROCESS_OVERVIEW','EQUIPMENT_ASSET_REGISTRY','WORK_ORDER_DIRECTORY',
        'MAINTENANCE_MRO_HUB','MANPOWER_DAILY_SHIFT','MANPOWER_ROTATION_TRACKER','PTW_PERMITS',
        'SAFETY_GAS_TESTING','SAFETY_ERT_READINESS','SAFETY_OVERVIEW'
    )),
    can_read               INTEGER NOT NULL DEFAULT 0 CHECK (can_read IN (0,1)),
    can_create              INTEGER NOT NULL DEFAULT 0 CHECK (can_create IN (0,1)),
    can_update               INTEGER NOT NULL DEFAULT 0 CHECK (can_update IN (0,1)),
    can_delete                INTEGER NOT NULL DEFAULT 0 CHECK (can_delete IN (0,1)),
    can_approve                INTEGER NOT NULL DEFAULT 0 CHECK (can_approve IN (0,1)),
    is_read_only_forced          INTEGER NOT NULL DEFAULT 0 CHECK (is_read_only_forced IN (0,1)),
    CONSTRAINT uq_role_module UNIQUE (role_code, module_code)
);

CREATE TABLE IF NOT EXISTS approval_documents (
    approval_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type       TEXT NOT NULL CHECK (document_type IN ('PTW', 'WORK_ORDER', 'SHIFT_OVERRIDE', 'MRO_REQ')),
    reference_id        TEXT NOT NULL,
    current_step        INTEGER NOT NULL DEFAULT 1,
    total_steps         INTEGER NOT NULL DEFAULT 3,
    overall_status      TEXT NOT NULL DEFAULT 'PENDING' CHECK (overall_status IN ('PENDING', 'APPROVED', 'REJECTED', 'DELEGATED', 'CANCELLED')),
    requester_id        TEXT NOT NULL,
    title               TEXT NOT NULL,
    urgency_level       TEXT NOT NULL DEFAULT 'NORMAL' CHECK (urgency_level IN ('NORMAL', 'HIGH', 'CRITICAL_TIME_SENSITIVE')),
    created_at          TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS approval_line_histories (
    history_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    approval_id            INTEGER NOT NULL,
    step_number            INTEGER NOT NULL,
    approver_role          TEXT NOT NULL CHECK (approver_role IN ('ORIGINATOR', 'HSSE_OFFICER', 'SITE_MANAGER', 'DELEGATED_APPROVER')),
    approver_person_id     TEXT NOT NULL,
    action_type            TEXT NOT NULL CHECK (action_type IN ('APPROVE', 'REJECT', 'DELEGATE', 'OVERRIDE')),
    digital_signature_hash TEXT NOT NULL,
    ip_address             TEXT,
    comments               TEXT,
    action_timestamp       TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_hist_approval FOREIGN KEY (approval_id) REFERENCES approval_documents(approval_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS approval_delegations (
    delegation_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    original_approver_id TEXT NOT NULL,
    delegate_approver_id TEXT NOT NULL,
    start_date           TEXT NOT NULL,
    end_date             TEXT NOT NULL,
    is_active            INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    reason               TEXT NOT NULL,
    created_at            TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT chk_delegation_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_app_docs_type_status ON approval_documents(document_type, overall_status);
CREATE INDEX IF NOT EXISTS idx_app_hist_app_id ON approval_line_histories(approval_id);
