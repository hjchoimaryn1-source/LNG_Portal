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

// ISO Tank & Mass Balance relocation stage — 3 nullable columns added to
// iso_tank_daily_readings to cover NiasLaydownLogTab.tsx's ("ISO TK - LOG")
// [ISO TANK CONDITION LOG]/[BOG VENTING] fields that had no home in the
// Monthly Report schema: Yard Position, BOG Loss (kg/%). ALTER-ADD only,
// no rebuild (CLAUDE.md §5). ΔP/venting status are NOT stored — always
// re-derivable from press_before_mpa/press_after_mpa (same
// compute-don't-persist precedent as this session's P5/P6/Floboss stages).
const ISO_TANK_DAILY_READINGS_ADDITIVE_COLUMNS: Array<[string, string]> = [
  ['position', 'ALTER TABLE iso_tank_daily_readings ADD COLUMN position TEXT'],
  ['losses_kg', 'ALTER TABLE iso_tank_daily_readings ADD COLUMN losses_kg REAL'],
  ['losses_pct', 'ALTER TABLE iso_tank_daily_readings ADD COLUMN losses_pct REAL'],
];

// SQLite has no `ADD COLUMN IF NOT EXISTS` — guard via PRAGMA table_info(),
// same convention as gasMeteringLedgerSchema.ts's ensureColumn().
function ensureColumn(raw: DatabaseSync, table: string, columnName: string, addColumnSql: string): void {
  const columns = raw.prepare(`PRAGMA table_info(${table})`).all();
  const hasColumn = columns.some((c) => (c as { name: string }).name === columnName);
  if (!hasColumn) {
    raw.exec(addColumnSql);
  }
}

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

// gas_delivery_contract_reference: P5 Stage 2 — DCQ/Nom./Prod. Plan auto-
// populate source, monthly grain (no documentation settled the granularity —
// NIAS_Portal_Full_Context.md and the NP-01~12 SOPs have zero DCQ/nomination
// mentions — monthly chosen as the safest minimal assumption, correctable
// later if HJ confirms a different grain). Starts empty; no admin input UI
// this stage (DB-only via upsertGasDeliveryContractReference, follow-up).
export const GAS_DELIVERY_CONTRACT_REFERENCE_DDL = `
  CREATE TABLE IF NOT EXISTS gas_delivery_contract_reference (
      report_month      TEXT PRIMARY KEY,
      dcq_mmscfd        REAL,
      nom_mmscfd        REAL,
      prod_plan_mmscfd  REAL
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
  for (const [columnName, addColumnSql] of ISO_TANK_DAILY_READINGS_ADDITIVE_COLUMNS) {
    ensureColumn(raw, 'iso_tank_daily_readings', columnName, addColumnSql);
  }
  raw.exec(ISO_TANK_CONSUMPTION_MONTHLY_DDL);
  raw.exec(GAS_DELIVERY_DAILY_MANUAL_DDL);
  raw.exec(GAS_DELIVERY_MONTHLY_MANUAL_DDL);
  raw.exec(GAS_DELIVERY_CONTRACT_REFERENCE_DDL);
  raw.exec(GAS_COMPOSITION_MONTHLY_SNAPSHOT_DDL);
}
