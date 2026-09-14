-- src/cmms-moc/db/schema.sql
--
-- NP-12 Management of Change (MOC) — Phase 11c Stage 1-A. Additive-only,
-- two new tables. Loading convention mirrors src/cmms-mro-bridge/crosswalkSchema.sql
-- (read file + split by ';' + run each statement via mocDbSingleton.ts) — the
-- shared cmmsDbSingleton.ts is never touched (same hard-boundary rule as
-- src/cmms-environment / src/cmms-trucking).
--
-- doc_no is the natural document number and primary key (moc_completion_report
-- references it via FK). Risk ratings (1-5) are stored as plain INTEGER with a
-- range CHECK; ACCEPTABLE/REVIEW_NEEDED/NOT_ACCEPTABLE classification is
-- derived at read time by mocRiskService.ts, never stored (NP-12 §2.1 is
-- informational, not a blocking gate — approval authority is the Site
-- Manager's, not the system's).

CREATE TABLE IF NOT EXISTS moc_plan_of_change (
    doc_no                     TEXT PRIMARY KEY,
    responsible_team           TEXT NOT NULL,
    object_of_change           TEXT NOT NULL,
    purpose_reason             TEXT NOT NULL,
    change_type                TEXT NOT NULL CHECK (change_type IN ('PERMANENT', 'TEMPORARY')),
    proposed_time_scale        TEXT,
    related_procedures_forms   TEXT,
    mitigation_summary         TEXT,
    initial_risk_date          TEXT,
    initial_risk_doc_no        TEXT,
    initial_risk_assessed_by   TEXT,
    initial_risk_rating        INTEGER CHECK (initial_risk_rating BETWEEN 1 AND 5),
    improvement_summary        TEXT,
    reassessment_date          TEXT,
    reassessment_risk_rating   INTEGER CHECK (reassessment_risk_rating BETWEEN 1 AND 5),
    manuals_to_update          TEXT,
    teams_affected             TEXT,
    training_object            TEXT,
    training_implementation    TEXT,
    estimated_cost             REAL,
    estimated_commence_date    TEXT,
    targeted_completion_date   TEXT,
    status                     TEXT NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PENDING_SM_APPROVAL', 'APPROVED', 'REJECTED')),
    drawn_up_by                TEXT,
    reviewed_by                TEXT,
    approved_by                TEXT,
    approved_at                TEXT,
    created_at                 TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_moc_plan_status ON moc_plan_of_change(status);

CREATE TABLE IF NOT EXISTS moc_completion_report (
    doc_no                             TEXT PRIMARY KEY,
    plan_of_change_doc_no              TEXT NOT NULL,
    responsible_team                   TEXT NOT NULL,
    permanent_or_temporary             TEXT NOT NULL CHECK (permanent_or_temporary IN ('PERMANENT', 'TEMPORARY')),
    additional_mitigation              TEXT,
    final_risk_assessment_result       TEXT,
    training_completed                 INTEGER NOT NULL DEFAULT 0 CHECK (training_completed IN (0,1)),
    process_summary                    TEXT,
    communication_details              TEXT,
    manuals_updated                    INTEGER NOT NULL DEFAULT 0 CHECK (manuals_updated IN (0,1)),
    commence_date                      TEXT,
    completion_date                    TEXT,
    extension_type                     TEXT,
    extension_planned_date             TEXT,
    extension_targeted_date            TEXT,
    review_procedure_followed          INTEGER NOT NULL DEFAULT 0 CHECK (review_procedure_followed IN (0,1)),
    review_completed_within_timescale  INTEGER NOT NULL DEFAULT 0 CHECK (review_completed_within_timescale IN (0,1)),
    review_risk_measures_taken         INTEGER NOT NULL DEFAULT 0 CHECK (review_risk_measures_taken IN (0,1)),
    review_manuals_updated             INTEGER NOT NULL DEFAULT 0 CHECK (review_manuals_updated IN (0,1)),
    review_objective_met               INTEGER NOT NULL DEFAULT 0 CHECK (review_objective_met IN (0,1)),
    review_process_effective           INTEGER NOT NULL DEFAULT 0 CHECK (review_process_effective IN (0,1)),
    review_notes                       TEXT,
    drawn_up_by                        TEXT,
    reviewed_by                        TEXT,
    approved_by                        TEXT,
    approved_at                        TEXT,
    created_at                         TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_moc_completion_plan FOREIGN KEY (plan_of_change_doc_no)
        REFERENCES moc_plan_of_change(doc_no) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_moc_completion_plan ON moc_completion_report(plan_of_change_doc_no);
