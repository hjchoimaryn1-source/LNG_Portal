-- src/cmms-mro-bridge/crosswalkSchema.sql
--
-- Phase 10 Stage 1B — additive only. New table, no existing table touched.
-- legacy_part_id is a read-only reference to mro_parts.part_no (mro_parts
-- itself is never modified by this migration or by crosswalkDb.ts).

CREATE TABLE IF NOT EXISTS mro_legacy_impa_crosswalk (
    crosswalk_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    legacy_part_id        TEXT NOT NULL UNIQUE,
    impa_code_candidate     TEXT,
    match_confidence          REAL NOT NULL DEFAULT 0,
    status                      TEXT NOT NULL DEFAULT 'UNMATCHED'
        CHECK (status IN ('AUTO_MATCHED','NEEDS_REVIEW','UNMATCHED')),
    matched_reason                TEXT,
    generated_at                     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT fk_crosswalk_part FOREIGN KEY (legacy_part_id) REFERENCES mro_parts(part_no) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_crosswalk_status ON mro_legacy_impa_crosswalk(status);
