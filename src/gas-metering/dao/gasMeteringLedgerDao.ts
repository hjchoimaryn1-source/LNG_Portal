// src/gas-metering/dao/gasMeteringLedgerDao.ts
//
// PURPOSE
//   Read-only DAO for gas_metering_ledger_daily. Domain-agnostic (SqlExecutor
//   only, no React/Next), same pattern as dailyOpsPatrolDao.ts. HJ decision
//   (2026-09-16): no recurring PDF-parsing workflow — DAILY_REPORT_PDF rows
//   are historical reference only, so these queries intentionally read
//   GC_REPORT/GC_COMPOSITION only and treat every numeric field as nullable
//   (future FORM-NP-08-33-N/CSV revisions may omit columns).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface GasMeteringLedgerDailyRow {
  reportDate: string;
  dailyMmbtuStation: number | null;
  dailyCvolMmcfStation: number | null;
  cumMmbtuStation: number | null;
  ghvA: number | null;
  ghvB: number | null;
  pressBargA: number | null;
  tempCA: number | null;
  pressBargB: number | null;
  tempCB: number | null;
  molMethaneA: number | null;
  molEthaneA: number | null;
  molPropaneA: number | null;
  molNitrogenA: number | null;
  molMethaneB: number | null;
  molEthaneB: number | null;
  molPropaneB: number | null;
  molNitrogenB: number | null;
}

interface LedgerJoinRow {
  report_date: string;
  daily_mmbtu_station: number | null;
  daily_cvol_mmcf_station: number | null;
  cum_mmbtu_station: number | null;
  ghv_a: number | null;
  ghv_b: number | null;
  press_barg_a: number | null;
  temp_c_a: number | null;
  press_barg_b: number | null;
  temp_c_b: number | null;
  mol_methane_a: number | null;
  mol_ethane_a: number | null;
  mol_propane_a: number | null;
  mol_nitrogen_a: number | null;
  mol_methane_b: number | null;
  mol_ethane_b: number | null;
  mol_propane_b: number | null;
  mol_nitrogen_b: number | null;
}

const SELECT_RECENT_LEDGER_SQL = `
  SELECT
    r.report_date AS report_date,
    r.daily_mmbtu_station, r.daily_cvol_mmcf_station, r.cum_mmbtu_station,
    r.ghv_a, r.ghv_b, r.press_barg_a, r.temp_c_a, r.press_barg_b, r.temp_c_b,
    c.mol_methane_a, c.mol_ethane_a, c.mol_propane_a, c.mol_nitrogen_a,
    c.mol_methane_b, c.mol_ethane_b, c.mol_propane_b, c.mol_nitrogen_b
  FROM gas_metering_ledger_daily r
  LEFT JOIN gas_metering_ledger_daily c
    ON c.report_date = r.report_date AND c.meter_source = 'GC_COMPOSITION'
  WHERE r.meter_source = 'GC_REPORT'
  ORDER BY r.report_date DESC
  LIMIT @limit
`;

function rowToLedger(row: LedgerJoinRow): GasMeteringLedgerDailyRow {
  return {
    reportDate: row.report_date,
    dailyMmbtuStation: row.daily_mmbtu_station ?? null,
    dailyCvolMmcfStation: row.daily_cvol_mmcf_station ?? null,
    cumMmbtuStation: row.cum_mmbtu_station ?? null,
    ghvA: row.ghv_a ?? null,
    ghvB: row.ghv_b ?? null,
    pressBargA: row.press_barg_a ?? null,
    tempCA: row.temp_c_a ?? null,
    pressBargB: row.press_barg_b ?? null,
    tempCB: row.temp_c_b ?? null,
    molMethaneA: row.mol_methane_a ?? null,
    molEthaneA: row.mol_ethane_a ?? null,
    molPropaneA: row.mol_propane_a ?? null,
    molNitrogenA: row.mol_nitrogen_a ?? null,
    molMethaneB: row.mol_methane_b ?? null,
    molEthaneB: row.mol_ethane_b ?? null,
    molPropaneB: row.mol_propane_b ?? null,
    molNitrogenB: row.mol_nitrogen_b ?? null,
  };
}

/** Most recent `limit` report dates (GC_REPORT joined with same-date GC_COMPOSITION), newest first. */
export function getRecentGasMeteringLedger(db: SqlExecutor, limit = 60): GasMeteringLedgerDailyRow[] {
  const rows = db.all<LedgerJoinRow>(SELECT_RECENT_LEDGER_SQL, { limit });
  return rows.map(rowToLedger);
}

export interface GasMeteringSnapshot {
  composition: {
    reportDate: string;
    methane: number | null;
    ethane: number | null;
    propane: number | null;
    nitrogen: number | null;
  } | null;
  meterStream: {
    reportDate: string;
    ghv: number | null;
  } | null;
}

/** Latest GC_COMPOSITION (meter A) + latest GC_REPORT GHV — feeds SettlementAuditView's 3-way weathering table. */
export function getLatestGasMeteringSnapshot(db: SqlExecutor): GasMeteringSnapshot {
  const compositionRow = db.get<{
    report_date: string;
    mol_methane_a: number | null;
    mol_ethane_a: number | null;
    mol_propane_a: number | null;
    mol_nitrogen_a: number | null;
  }>(
    `SELECT report_date, mol_methane_a, mol_ethane_a, mol_propane_a, mol_nitrogen_a
     FROM gas_metering_ledger_daily
     WHERE meter_source = 'GC_COMPOSITION' AND mol_methane_a IS NOT NULL
     ORDER BY report_date DESC LIMIT 1`
  );

  const reportRow = db.get<{ report_date: string; ghv_a: number | null; ghv_b: number | null }>(
    `SELECT report_date, ghv_a, ghv_b
     FROM gas_metering_ledger_daily
     WHERE meter_source = 'GC_REPORT' AND (ghv_a > 0 OR ghv_b > 0)
     ORDER BY report_date DESC LIMIT 1`
  );

  return {
    composition: compositionRow
      ? {
          reportDate: compositionRow.report_date,
          methane: compositionRow.mol_methane_a ?? null,
          ethane: compositionRow.mol_ethane_a ?? null,
          propane: compositionRow.mol_propane_a ?? null,
          nitrogen: compositionRow.mol_nitrogen_a ?? null,
        }
      : null,
    meterStream: reportRow
      ? {
          reportDate: reportRow.report_date,
          ghv: (reportRow.ghv_a && reportRow.ghv_a > 0 ? reportRow.ghv_a : reportRow.ghv_b) ?? null,
        }
      : null,
  };
}

// Monthly Report (PLN EPI) Stage 3 — Floboss P1-P4 daily view.
export interface FlobossDailyRow {
  reportDate: string;
  dailyUvolMmcfA: number | null; dailyCvolMmcfA: number | null; dailyMmbtuA: number | null;
  dailyUvolMmcfB: number | null; dailyCvolMmcfB: number | null; dailyMmbtuB: number | null;
  dailyUvolMmcfStation: number | null; dailyCvolMmcfStation: number | null; dailyMmbtuStation: number | null;
  ghvA: number | null; ghvB: number | null; ghvStation: number | null; ghvManualSample: number | null;
  netSalesVolMmscf: number | null; netSalesEnergyMmbtu: number | null;
}

const SELECT_FLOBOSS_MONTH_SQL = `
  SELECT
    report_date,
    daily_uvol_mmcf_a, daily_cvol_mmcf_a, daily_mmbtu_a,
    daily_uvol_mmcf_b, daily_cvol_mmcf_b, daily_mmbtu_b,
    daily_uvol_mmcf_station, daily_cvol_mmcf_station, daily_mmbtu_station,
    ghv_a, ghv_b, ghv_station, ghv_manual_sample,
    net_sales_vol_mmscf, net_sales_energy_mmbtu
  FROM gas_metering_ledger_daily
  WHERE meter_source = 'GC_REPORT' AND report_date LIKE @monthPrefix
  ORDER BY report_date
`;

/** Floboss P1-P4 daily rows (GC_REPORT source) for a given report month ('YYYY-MM'). */
export function getFlobossLedgerForMonth(db: SqlExecutor, reportMonth: string): FlobossDailyRow[] {
  const rows = db.all<Record<string, number | string | null>>(SELECT_FLOBOSS_MONTH_SQL, { monthPrefix: `${reportMonth}%` });
  return rows.map((r) => ({
    reportDate: r.report_date as string,
    dailyUvolMmcfA: r.daily_uvol_mmcf_a as number | null, dailyCvolMmcfA: r.daily_cvol_mmcf_a as number | null, dailyMmbtuA: r.daily_mmbtu_a as number | null,
    dailyUvolMmcfB: r.daily_uvol_mmcf_b as number | null, dailyCvolMmcfB: r.daily_cvol_mmcf_b as number | null, dailyMmbtuB: r.daily_mmbtu_b as number | null,
    dailyUvolMmcfStation: r.daily_uvol_mmcf_station as number | null, dailyCvolMmcfStation: r.daily_cvol_mmcf_station as number | null, dailyMmbtuStation: r.daily_mmbtu_station as number | null,
    ghvA: r.ghv_a as number | null, ghvB: r.ghv_b as number | null, ghvStation: r.ghv_station as number | null, ghvManualSample: r.ghv_manual_sample as number | null,
    netSalesVolMmscf: r.net_sales_vol_mmscf as number | null, netSalesEnergyMmbtu: r.net_sales_energy_mmbtu as number | null,
  }));
}
