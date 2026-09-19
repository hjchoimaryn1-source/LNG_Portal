// src/gas-metering/db/gasMeteringLedgerSchema.ts
//
// PURPOSE
//   Runtime idempotent DDL for gas_metering_ledger_daily, same convention as
//   dailyOpsPatrolSchema.ts (inline template string, no fs read at request
//   time). Column-for-column identical to
//   src/db/migrations/phase12_stage_gas_metering_ledger_daily_schema.sql
//   (Stage 1's one-shot ingestion runner) — duplicated intentionally so API
//   routes don't depend on reading a migrations-directory file at runtime.

import type { DatabaseSync } from 'node:sqlite';

// Monthly Report (PLN EPI) Stage 2 — 6 nullable columns added to cover P3
// (Net Sales), P4 (manual-sample GHV), P8 (station composition/specific
// gravity) fields with no existing home in this table. ALTER-ADD only, no
// rebuild (CLAUDE.md §5). All 6 stay NULL until a future seed/form actually
// supplies values — no source data exists for them yet (verified July 2026
// P3/P4/P8 source files, Monthly Report Stage 1/2 investigation).
const GAS_METERING_LEDGER_ADDITIVE_COLUMNS: Array<[string, string]> = [
  ['net_sales_vol_mmscf', 'ALTER TABLE gas_metering_ledger_daily ADD COLUMN net_sales_vol_mmscf REAL'],
  ['net_sales_energy_mmbtu', 'ALTER TABLE gas_metering_ledger_daily ADD COLUMN net_sales_energy_mmbtu REAL'],
  // Reserved for a future form revision — no P8 source field maps to these yet;
  // stays NULL until PLN EPI confirms the station GHV/CO2/specific-gravity layout.
  ['ghv_station', 'ALTER TABLE gas_metering_ledger_daily ADD COLUMN ghv_station REAL'],
  ['mol_co2_station', 'ALTER TABLE gas_metering_ledger_daily ADD COLUMN mol_co2_station REAL'],
  ['specific_gravity_station', 'ALTER TABLE gas_metering_ledger_daily ADD COLUMN specific_gravity_station REAL'],
  ['ghv_manual_sample', 'ALTER TABLE gas_metering_ledger_daily ADD COLUMN ghv_manual_sample REAL'],
];

// SQLite has no `ADD COLUMN IF NOT EXISTS` — guard via PRAGMA table_info(),
// same convention as dailyReportSchema.ts's ensureColumn().
function ensureColumn(raw: DatabaseSync, table: string, columnName: string, addColumnSql: string): void {
  const columns = raw.prepare(`PRAGMA table_info(${table})`).all();
  const hasColumn = columns.some((c) => (c as { name: string }).name === columnName);
  if (!hasColumn) {
    raw.exec(addColumnSql);
  }
}

export const GAS_METERING_LEDGER_DAILY_DDL = `
  CREATE TABLE IF NOT EXISTS gas_metering_ledger_daily (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date                 TEXT NOT NULL,
      meter_source                TEXT NOT NULL CHECK (meter_source IN ('GC_REPORT', 'GC_COMPOSITION', 'DAILY_REPORT_PDF')),
      source_document              TEXT,
      created_at                  TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),

      cum_uvol_mmcf_a              REAL, cum_cvol_mmcf_a REAL, cum_mass_tonne_a REAL, cum_mmbtu_a REAL,
      cum_uvol_mmcf_b              REAL, cum_cvol_mmcf_b REAL, cum_mass_tonne_b REAL, cum_mmbtu_b REAL,
      cum_uvol_mmcf_station        REAL, cum_cvol_mmcf_station REAL, cum_mass_tonne_station REAL, cum_mmbtu_station REAL,

      daily_uvol_mmcf_a            REAL, daily_cvol_mmcf_a REAL, daily_mass_tonne_a REAL, daily_mmbtu_a REAL,
      daily_uvol_mmcf_b            REAL, daily_cvol_mmcf_b REAL, daily_mass_tonne_b REAL, daily_mmbtu_b REAL,
      daily_uvol_mmcf_station      REAL, daily_cvol_mmcf_station REAL, daily_mass_tonne_station REAL, daily_mmbtu_station REAL,

      press_barg_a                 REAL, temp_c_a REAL, line_dens_kg_m3_a REAL, line_compress_zf_a REAL, ghv_a REAL,
      press_barg_b                 REAL, temp_c_b REAL, line_dens_kg_m3_b REAL, line_compress_zf_b REAL, ghv_b REAL,

      mol_nitrogen_a               REAL, mol_nitrogen_b REAL,
      mol_co2_a                    REAL, mol_co2_b REAL,
      mol_h2s_a                    REAL, mol_h2s_b REAL,
      mol_h2o_a                    REAL, mol_h2o_b REAL,
      mol_methane_a                REAL, mol_methane_b REAL,
      mol_ethane_a                 REAL, mol_ethane_b REAL,
      mol_propane_a                REAL, mol_propane_b REAL,
      mol_nbutane_a                REAL, mol_nbutane_b REAL,
      mol_ibutane_a                REAL, mol_ibutane_b REAL,
      mol_npentane_a                REAL, mol_npentane_b REAL,
      mol_ipentane_a                REAL, mol_ipentane_b REAL,
      mol_hexane_a                 REAL, mol_hexane_b REAL,
      mol_heptane_a                REAL, mol_heptane_b REAL,
      mol_octane_a                 REAL, mol_octane_b REAL,
      mol_nonane_a                 REAL, mol_nonane_b REAL,
      mol_decane_a                 REAL, mol_decane_b REAL,

      mol_methane_station          REAL, mol_ethane_station REAL, mol_propane_station REAL,
      mol_ibutane_station          REAL, mol_nbutane_station REAL,
      mol_ipentane_station         REAL, mol_npentane_station REAL,
      mol_hexane_station           REAL, mol_nitrogen_station REAL,
      mol_h2o_ppm_station          REAL, mol_h2s_ppm_station REAL, mol_total_pct_station REAL,

      ng_buffer_tank_pressure_bar  REAL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_gas_metering_ledger_daily_unique
      ON gas_metering_ledger_daily(report_date, meter_source);
  CREATE INDEX IF NOT EXISTS idx_gas_metering_ledger_daily_date
      ON gas_metering_ledger_daily(report_date DESC);
`;

export function ensureGasMeteringLedgerSchema(raw: DatabaseSync): void {
  raw.exec(GAS_METERING_LEDGER_DAILY_DDL);
  for (const [columnName, addColumnSql] of GAS_METERING_LEDGER_ADDITIVE_COLUMNS) {
    ensureColumn(raw, 'gas_metering_ledger_daily', columnName, addColumnSql);
  }
}
