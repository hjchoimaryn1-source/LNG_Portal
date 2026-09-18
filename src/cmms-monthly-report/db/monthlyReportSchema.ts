// src/cmms-monthly-report/db/monthlyReportSchema.ts
//
// PURPOSE
//   Runtime idempotent DDL for the 5 new tables backing Monthly Report (PLN
//   EPI) Stage 1 (Floboss P1-P8 + ISO Tank monthly sheets). All CREATE TABLE
//   IF NOT EXISTS — genuinely new tables, not a rebuild of an existing one,
//   so CLAUDE.md §5's ALTER-only policy does not apply here (same reasoning
//   as gas_metering_ledger_daily's own introduction). Same inline-template-
//   string convention as gasMeteringLedgerSchema.ts.
//
//   Grain notes (Monthly Report Step 0, this session):
//   - iso_tank_daily_readings: per (report_date, iso_tank_no) — source
//     `NIAS - ISO Tank Master DB.csv`, matches "Monthly Report ISO Tank" sheet.
//   - iso_tank_consumption_monthly: per (report_date, iso_tank_no) snapshot —
//     source `NIAS - ISO Tank Consumption.csv`, matches "Consumption ISOTank"
//     sheet. HJ-confirmed: NOT reconciled against iso_tank_daily_readings —
//     the two sheets' tank rosters differ by design (ISOT-064 present only
//     in the daily-readings source).
//   - gas_delivery_daily_manual / gas_delivery_monthly_manual: "Summary Gas
//     Delivery P5" contract/operational fields with no DB source — daily vs.
//     monthly grain split confirmed by HJ (P5 has both a per-day grid and a
//     4-value end-of-month cumulative block).
//   - gas_composition_monthly_snapshot: "Gas Analysis P8" sheet confirmed
//     single-snapshot grain via direct cell/formula inspection (no `cell.f`
//     formula on any value cell, no per-day dimension anywhere on the sheet —
//     every Mol Fraction/GHV/Specific Gravity value is a hardcoded literal).

import type { DatabaseSync } from 'node:sqlite';

export const ISO_TANK_DAILY_READINGS_DDL = `
  CREATE TABLE IF NOT EXISTS iso_tank_daily_readings (
      report_date       TEXT NOT NULL,
      iso_tank_no       TEXT NOT NULL,
      serial_no         TEXT,
      shipment          TEXT,
      level_pct         REAL,
      level_m3          REAL,
      level_mmh2o       REAL,
      battery_pct       REAL,
      pressure_mpa      REAL,
      temp_c            REAL,
      depress_flag      TEXT,
      press_before_mpa  REAL,
      press_after_mpa   REAL,
      remarks           TEXT,
      PRIMARY KEY (report_date, iso_tank_no)
  );
`;

export const ISO_TANK_CONSUMPTION_MONTHLY_DDL = `
  CREATE TABLE IF NOT EXISTS iso_tank_consumption_monthly (
      report_date          TEXT NOT NULL,
      iso_tank_no          TEXT NOT NULL,
      serial_no            TEXT,
      shipment              TEXT,
      weight_awal_kg        REAL,
      heating_value_btu_kg  REAL,
      stock_awal_m3         REAL,
      stock_awal_kg         REAL,
      stock_akhir_m3        REAL,
      stock_akhir_kg        REAL,
      net_consumed_m3       REAL,
      consumed_kg           REAL,
      consumed_mmbtu        REAL,
      density_kg_m3         REAL,
      losses_kg             REAL,
      losses_pct            REAL,
      remarks               TEXT,
      PRIMARY KEY (report_date, iso_tank_no)
  );
`;

export const GAS_DELIVERY_DAILY_MANUAL_DDL = `
  CREATE TABLE IF NOT EXISTS gas_delivery_daily_manual (
      report_date                TEXT PRIMARY KEY,
      dcq_mmscfd                 REAL,
      nom_mmscfd                 REAL,
      prod_plan_mmscfd           REAL,
      delivery_vol_mmscf         REAL,
      delivery_energy_mmbtu      REAL,
      off_spec_vol_mmscf         REAL,
      off_spec_energy_mmbtu      REAL,
      shortfall_vol_mmscf        REAL,
      shortfall_energy_mmbtu     REAL,
      force_majeure_vol_mmscf    REAL,
      force_majeure_energy_mmbtu REAL,
      maintenance_day_vol_mmscf  REAL,
      maintenance_day_energy_mmbtu REAL,
      under_take_vol_mmscf       REAL,
      under_take_energy_mmbtu    REAL,
      excess_vol_mmscf           REAL,
      excess_energy_mmbtu        REAL,
      avg_temp_c                 REAL,
      avg_press_psig             REAL
  );
`;

export const GAS_DELIVERY_MONTHLY_MANUAL_DDL = `
  CREATE TABLE IF NOT EXISTS gas_delivery_monthly_manual (
      report_month                 TEXT PRIMARY KEY,
      shortfall_begin_month_mmscf  REAL,
      shortfall_begin_month_mmbtu  REAL,
      shortfall_this_month_mmscf   REAL,
      shortfall_this_month_mmbtu   REAL,
      undertake_this_month_mmscf   REAL,
      undertake_this_month_mmbtu   REAL,
      excess_this_month_mmscf      REAL,
      excess_this_month_mmbtu      REAL,
      shortfall_end_month_mmscf    REAL,
      shortfall_end_month_mmbtu    REAL
  );
`;

export const GAS_COMPOSITION_MONTHLY_SNAPSHOT_DDL = `
  CREATE TABLE IF NOT EXISTS gas_composition_monthly_snapshot (
      report_month     TEXT PRIMARY KEY,
      as_of_date        TEXT,
      method            TEXT,
      mol_methane       REAL,
      mol_ethane        REAL,
      mol_propane       REAL,
      mol_ibutane       REAL,
      mol_nbutane       REAL,
      mol_ipentane      REAL,
      mol_npentane      REAL,
      mol_hexane_plus   REAL,
      mol_nitrogen      REAL,
      mol_co2           REAL,
      ghv_btu_scf       REAL,
      specific_gravity  REAL
  );
`;

export function ensureMonthlyReportSchema(raw: DatabaseSync): void {
  raw.exec(ISO_TANK_DAILY_READINGS_DDL);
  raw.exec(ISO_TANK_CONSUMPTION_MONTHLY_DDL);
  raw.exec(GAS_DELIVERY_DAILY_MANUAL_DDL);
  raw.exec(GAS_DELIVERY_MONTHLY_MANUAL_DDL);
  raw.exec(GAS_COMPOSITION_MONTHLY_SNAPSHOT_DDL);
}
