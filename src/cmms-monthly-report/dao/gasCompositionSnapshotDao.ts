// src/cmms-monthly-report/dao/gasCompositionSnapshotDao.ts
//
// PURPOSE
//   Read/write DAO for gas_composition_monthly_snapshot ("Gas Analysis P8"
//   sheet — confirmed single-snapshot grain via direct cell/formula
//   inspection, no per-day dimension). One row per report_month.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface GasCompositionSnapshotRow {
  reportMonth: string;
  asOfDate: string | null;
  method: string | null;
  molMethane: number | null;
  molEthane: number | null;
  molPropane: number | null;
  molIbutane: number | null;
  molNbutane: number | null;
  molIpentane: number | null;
  molNpentane: number | null;
  molHexanePlus: number | null;
  molNitrogen: number | null;
  molCo2: number | null;
  ghvBtuScf: number | null;
  specificGravity: number | null;
}

interface GasCompositionSnapshotSqlRow {
  report_month: string;
  as_of_date: string | null;
  method: string | null;
  mol_methane: number | null;
  mol_ethane: number | null;
  mol_propane: number | null;
  mol_ibutane: number | null;
  mol_nbutane: number | null;
  mol_ipentane: number | null;
  mol_npentane: number | null;
  mol_hexane_plus: number | null;
  mol_nitrogen: number | null;
  mol_co2: number | null;
  ghv_btu_scf: number | null;
  specific_gravity: number | null;
}

function rowFromSql(row: GasCompositionSnapshotSqlRow): GasCompositionSnapshotRow {
  return {
    reportMonth: row.report_month,
    asOfDate: row.as_of_date,
    method: row.method,
    molMethane: row.mol_methane,
    molEthane: row.mol_ethane,
    molPropane: row.mol_propane,
    molIbutane: row.mol_ibutane,
    molNbutane: row.mol_nbutane,
    molIpentane: row.mol_ipentane,
    molNpentane: row.mol_npentane,
    molHexanePlus: row.mol_hexane_plus,
    molNitrogen: row.mol_nitrogen,
    molCo2: row.mol_co2,
    ghvBtuScf: row.ghv_btu_scf,
    specificGravity: row.specific_gravity,
  };
}

export function upsertGasCompositionSnapshot(db: SqlExecutor, row: GasCompositionSnapshotRow): void {
  db.run(
    `INSERT INTO gas_composition_monthly_snapshot (
       report_month, as_of_date, method, mol_methane, mol_ethane, mol_propane,
       mol_ibutane, mol_nbutane, mol_ipentane, mol_npentane, mol_hexane_plus,
       mol_nitrogen, mol_co2, ghv_btu_scf, specific_gravity
     ) VALUES (
       @reportMonth, @asOfDate, @method, @molMethane, @molEthane, @molPropane,
       @molIbutane, @molNbutane, @molIpentane, @molNpentane, @molHexanePlus,
       @molNitrogen, @molCo2, @ghvBtuScf, @specificGravity
     )
     ON CONFLICT(report_month) DO UPDATE SET
       as_of_date = excluded.as_of_date, method = excluded.method,
       mol_methane = excluded.mol_methane, mol_ethane = excluded.mol_ethane,
       mol_propane = excluded.mol_propane, mol_ibutane = excluded.mol_ibutane,
       mol_nbutane = excluded.mol_nbutane, mol_ipentane = excluded.mol_ipentane,
       mol_npentane = excluded.mol_npentane, mol_hexane_plus = excluded.mol_hexane_plus,
       mol_nitrogen = excluded.mol_nitrogen, mol_co2 = excluded.mol_co2,
       ghv_btu_scf = excluded.ghv_btu_scf, specific_gravity = excluded.specific_gravity`,
    { ...row }
  );
}

export function getGasCompositionSnapshot(db: SqlExecutor, reportMonth: string): GasCompositionSnapshotRow | undefined {
  const row = db.get<GasCompositionSnapshotSqlRow>(
    `SELECT * FROM gas_composition_monthly_snapshot WHERE report_month = @reportMonth`,
    { reportMonth }
  );
  return row ? rowFromSql(row) : undefined;
}
