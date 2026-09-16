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
}
