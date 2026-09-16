-- Phase 12 Stage 1 — gas_metering_ledger_daily
--
-- Source docs (HJ-confirmed 2026-09-16, per stage0 investigation):
--   'GC_REPORT'       <- public/data/NIAS - G.C Report .csv        (per-meter M-101A/B + STATION, cum + daily flow/energy + condition)
--   'GC_COMPOSITION'  <- public/data/NIAS - GC composion.csv       (per-meter M-101A/B molecular composition)
--   'DAILY_REPORT_PDF'<- FORM-NP-08-33-N Daily Report (ground truth, station-wide GC panel — not split per meter)
--
-- One row per (report_date, meter_source) — sources are NOT merged into a single
-- row (same rationale as the original Floboss-vs-GC-analyzer design: store each
-- source document as-is, do not auto-reconcile; reconciliation is future scope).
CREATE TABLE IF NOT EXISTS gas_metering_ledger_daily (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date                 TEXT NOT NULL,
    meter_source                TEXT NOT NULL CHECK (meter_source IN ('GC_REPORT', 'GC_COMPOSITION', 'DAILY_REPORT_PDF')),
    source_document              TEXT,
    created_at                  TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),

    -- Cumulative flow/energy (GC_REPORT)
    cum_uvol_mmcf_a              REAL,
    cum_cvol_mmcf_a              REAL,
    cum_mass_tonne_a             REAL,
    cum_mmbtu_a                  REAL,
    cum_uvol_mmcf_b              REAL,
    cum_cvol_mmcf_b              REAL,
    cum_mass_tonne_b             REAL,
    cum_mmbtu_b                  REAL,
    cum_uvol_mmcf_station        REAL,
    cum_cvol_mmcf_station        REAL,
    cum_mass_tonne_station       REAL,
    cum_mmbtu_station            REAL,

    -- Daily flow/energy (GC_REPORT, DAILY_REPORT_PDF)
    daily_uvol_mmcf_a            REAL,
    daily_cvol_mmcf_a            REAL,
    daily_mass_tonne_a           REAL,
    daily_mmbtu_a                REAL,
    daily_uvol_mmcf_b            REAL,
    daily_cvol_mmcf_b            REAL,
    daily_mass_tonne_b           REAL,
    daily_mmbtu_b                REAL,
    daily_uvol_mmcf_station      REAL,
    daily_cvol_mmcf_station      REAL,
    daily_mass_tonne_station     REAL,
    daily_mmbtu_station          REAL,

    -- Condition (GC_REPORT) — per-meter daily GC/flow-computer condition snapshot.
    -- NOTE: distinct from daily_ops_patrol_entries.metering_train_a/b's 4-hr gauge/
    -- transmitter readings (different sampling semantics, see stage0 field map).
    press_barg_a                 REAL,
    temp_c_a                     REAL,
    line_dens_kg_m3_a            REAL,
    line_compress_zf_a           REAL,
    ghv_a                        REAL,
    press_barg_b                 REAL,
    temp_c_b                     REAL,
    line_dens_kg_m3_b            REAL,
    line_compress_zf_b           REAL,
    ghv_b                        REAL,

    -- Molecular composition per meter (GC_COMPOSITION)
    mol_nitrogen_a               REAL,
    mol_nitrogen_b               REAL,
    mol_co2_a                    REAL,
    mol_co2_b                    REAL,
    mol_h2s_a                    REAL,
    mol_h2s_b                    REAL,
    mol_h2o_a                    REAL,
    mol_h2o_b                    REAL,
    mol_methane_a                REAL,
    mol_methane_b                REAL,
    mol_ethane_a                 REAL,
    mol_ethane_b                 REAL,
    mol_propane_a                REAL,
    mol_propane_b                REAL,
    mol_nbutane_a                REAL,
    mol_nbutane_b                REAL,
    mol_ibutane_a                REAL,
    mol_ibutane_b                REAL,
    mol_npentane_a                REAL,
    mol_npentane_b               REAL,
    mol_ipentane_a               REAL,
    mol_ipentane_b               REAL,
    mol_hexane_a                 REAL,
    mol_hexane_b                 REAL,
    mol_heptane_a                REAL,
    mol_heptane_b                REAL,
    mol_octane_a                 REAL,
    mol_octane_b                 REAL,
    mol_nonane_a                 REAL,
    mol_nonane_b                 REAL,
    mol_decane_a                 REAL,
    mol_decane_b                 REAL,

    -- Station-wide molecular composition (DAILY_REPORT_PDF — one shared GC panel,
    -- not split per meter in the source document; do not duplicate into *_a/*_b).
    mol_methane_station          REAL,
    mol_ethane_station           REAL,
    mol_propane_station          REAL,
    mol_ibutane_station          REAL,
    mol_nbutane_station          REAL,
    mol_ipentane_station         REAL,
    mol_npentane_station         REAL,
    mol_hexane_station           REAL,
    mol_nitrogen_station         REAL,
    mol_h2o_ppm_station          REAL,
    mol_h2s_ppm_station          REAL,
    mol_total_pct_station        REAL,

    -- NG Buffer Tank pressure (DAILY_REPORT_PDF only — HJ 2026-09-16 scope note,
    -- PDF section A "NG Buffer Tank" block; not present in GC_REPORT/GC_COMPOSITION).
    ng_buffer_tank_pressure_bar  REAL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gas_metering_ledger_daily_unique
    ON gas_metering_ledger_daily(report_date, meter_source);

CREATE INDEX IF NOT EXISTS idx_gas_metering_ledger_daily_date
    ON gas_metering_ledger_daily(report_date DESC);
