// src/cmms-monthly-report/dao/gasDeliveryManualDao.ts
//
// PURPOSE
//   Read/write DAO for the "Summary Gas Delivery P5" manual-entry fields —
//   split across two grains (HJ-confirmed): gas_delivery_daily_manual
//   (per report_date) and gas_delivery_monthly_manual (per report_month,
//   the sheet's 4-value end-of-month cumulative block). No CSV source —
//   these are contract/operational values entered by hand, persisted here.
//   Column-tuple-array mapping, same convention as
//   gasMeteringLedgerDailyRunner.types.ts's GAS_METERING_LEDGER_COLUMNS.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface GasDeliveryDailyManualRow {
  reportDate: string;
  dcqMmscfd: number | null;
  nomMmscfd: number | null;
  prodPlanMmscfd: number | null;
  deliveryVolMmscf: number | null;
  deliveryEnergyMmbtu: number | null;
  offSpecVolMmscf: number | null;
  offSpecEnergyMmbtu: number | null;
  shortfallVolMmscf: number | null;
  shortfallEnergyMmbtu: number | null;
  forceMajeureVolMmscf: number | null;
  forceMajeureEnergyMmbtu: number | null;
  maintenanceDayVolMmscf: number | null;
  maintenanceDayEnergyMmbtu: number | null;
  underTakeVolMmscf: number | null;
  underTakeEnergyMmbtu: number | null;
  excessVolMmscf: number | null;
  excessEnergyMmbtu: number | null;
  avgTempC: number | null;
  avgPressPsig: number | null;
}

export interface GasDeliveryMonthlyManualRow {
  reportMonth: string;
  shortfallBeginMonthMmscf: number | null;
  shortfallBeginMonthMmbtu: number | null;
  shortfallThisMonthMmscf: number | null;
  shortfallThisMonthMmbtu: number | null;
  undertakeThisMonthMmscf: number | null;
  undertakeThisMonthMmbtu: number | null;
  excessThisMonthMmscf: number | null;
  excessThisMonthMmbtu: number | null;
  shortfallEndMonthMmscf: number | null;
  shortfallEndMonthMmbtu: number | null;
}

const DAILY_COLUMNS: Array<[keyof GasDeliveryDailyManualRow, string]> = [
  ['reportDate', 'report_date'],
  ['dcqMmscfd', 'dcq_mmscfd'], ['nomMmscfd', 'nom_mmscfd'], ['prodPlanMmscfd', 'prod_plan_mmscfd'],
  ['deliveryVolMmscf', 'delivery_vol_mmscf'], ['deliveryEnergyMmbtu', 'delivery_energy_mmbtu'],
  ['offSpecVolMmscf', 'off_spec_vol_mmscf'], ['offSpecEnergyMmbtu', 'off_spec_energy_mmbtu'],
  ['shortfallVolMmscf', 'shortfall_vol_mmscf'], ['shortfallEnergyMmbtu', 'shortfall_energy_mmbtu'],
  ['forceMajeureVolMmscf', 'force_majeure_vol_mmscf'], ['forceMajeureEnergyMmbtu', 'force_majeure_energy_mmbtu'],
  ['maintenanceDayVolMmscf', 'maintenance_day_vol_mmscf'], ['maintenanceDayEnergyMmbtu', 'maintenance_day_energy_mmbtu'],
  ['underTakeVolMmscf', 'under_take_vol_mmscf'], ['underTakeEnergyMmbtu', 'under_take_energy_mmbtu'],
  ['excessVolMmscf', 'excess_vol_mmscf'], ['excessEnergyMmbtu', 'excess_energy_mmbtu'],
  ['avgTempC', 'avg_temp_c'], ['avgPressPsig', 'avg_press_psig'],
];

const MONTHLY_COLUMNS: Array<[keyof GasDeliveryMonthlyManualRow, string]> = [
  ['reportMonth', 'report_month'],
  ['shortfallBeginMonthMmscf', 'shortfall_begin_month_mmscf'], ['shortfallBeginMonthMmbtu', 'shortfall_begin_month_mmbtu'],
  ['shortfallThisMonthMmscf', 'shortfall_this_month_mmscf'], ['shortfallThisMonthMmbtu', 'shortfall_this_month_mmbtu'],
  ['undertakeThisMonthMmscf', 'undertake_this_month_mmscf'], ['undertakeThisMonthMmbtu', 'undertake_this_month_mmbtu'],
  ['excessThisMonthMmscf', 'excess_this_month_mmscf'], ['excessThisMonthMmbtu', 'excess_this_month_mmbtu'],
  ['shortfallEndMonthMmscf', 'shortfall_end_month_mmscf'], ['shortfallEndMonthMmbtu', 'shortfall_end_month_mmbtu'],
];

function upsert<T>(
  db: SqlExecutor,
  table: string,
  pkColumn: string,
  columns: Array<[keyof T, string]>,
  row: T
): void {
  const rowAsRecord = row as Record<string, unknown>;
  const colNames = columns.map(([, col]) => col);
  const updateSet = columns
    .filter(([, col]) => col !== pkColumn)
    .map(([, col]) => `${col} = excluded.${col}`)
    .join(', ');
  const params: Record<string, unknown> = {};
  for (const [field, col] of columns) params[col] = rowAsRecord[String(field)] ?? null;
  db.run(
    `INSERT INTO ${table} (${colNames.join(', ')}) VALUES (${colNames.map((c) => `@${c}`).join(', ')})
     ON CONFLICT(${pkColumn}) DO UPDATE SET ${updateSet}`,
    params
  );
}

function fromSqlRow<T>(sqlRow: Record<string, unknown>, columns: Array<[keyof T, string]>): T {
  const out: Record<string, unknown> = {};
  for (const [field, col] of columns) out[String(field)] = sqlRow[col] ?? null;
  return out as T;
}

export function upsertGasDeliveryDailyManual(db: SqlExecutor, row: GasDeliveryDailyManualRow): void {
  upsert(db, 'gas_delivery_daily_manual', 'report_date', DAILY_COLUMNS, row);
}

/** Manual daily-grid rows for a given report month ('YYYY-MM'). */
export function getGasDeliveryDailyManualForMonth(db: SqlExecutor, reportMonth: string): GasDeliveryDailyManualRow[] {
  const rows = db.all<Record<string, unknown>>(
    `SELECT * FROM gas_delivery_daily_manual WHERE report_date LIKE @monthPrefix ORDER BY report_date`,
    { monthPrefix: `${reportMonth}%` }
  );
  return rows.map((r) => fromSqlRow<GasDeliveryDailyManualRow>(r, DAILY_COLUMNS));
}

export function upsertGasDeliveryMonthlyManual(db: SqlExecutor, row: GasDeliveryMonthlyManualRow): void {
  upsert(db, 'gas_delivery_monthly_manual', 'report_month', MONTHLY_COLUMNS, row);
}

export function getGasDeliveryMonthlyManual(db: SqlExecutor, reportMonth: string): GasDeliveryMonthlyManualRow | undefined {
  const row = db.get<Record<string, unknown>>(
    `SELECT * FROM gas_delivery_monthly_manual WHERE report_month = @reportMonth`,
    { reportMonth }
  );
  return row ? fromSqlRow<GasDeliveryMonthlyManualRow>(row, MONTHLY_COLUMNS) : undefined;
}
