// src/cmms-monthly-report/dao/gasDeliveryContractReferenceDao.ts
//
// PURPOSE
//   Read/write DAO for gas_delivery_contract_reference — P5's DCQ/Nom./
//   Prod. Plan auto-populate source, monthly grain (see
//   monthlyReportSchema.ts for the grain-assumption rationale). Table
//   starts empty; upsert exists for a future admin input path, not wired
//   to any UI this stage.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

export interface GasDeliveryContractReferenceRow {
  reportMonth: string;
  dcqMmscfd: number | null;
  nomMmscfd: number | null;
  prodPlanMmscfd: number | null;
}

interface ContractReferenceSqlRow {
  report_month: string;
  dcq_mmscfd: number | null;
  nom_mmscfd: number | null;
  prod_plan_mmscfd: number | null;
}

export function getGasDeliveryContractReference(
  db: SqlExecutor,
  reportMonth: string
): GasDeliveryContractReferenceRow | undefined {
  const row = db.get<ContractReferenceSqlRow>(
    `SELECT * FROM gas_delivery_contract_reference WHERE report_month = @reportMonth`,
    { reportMonth }
  );
  return row
    ? {
        reportMonth: row.report_month,
        dcqMmscfd: row.dcq_mmscfd,
        nomMmscfd: row.nom_mmscfd,
        prodPlanMmscfd: row.prod_plan_mmscfd,
      }
    : undefined;
}

export function upsertGasDeliveryContractReference(db: SqlExecutor, row: GasDeliveryContractReferenceRow): void {
  db.run(
    `INSERT INTO gas_delivery_contract_reference (report_month, dcq_mmscfd, nom_mmscfd, prod_plan_mmscfd)
     VALUES (@reportMonth, @dcqMmscfd, @nomMmscfd, @prodPlanMmscfd)
     ON CONFLICT(report_month) DO UPDATE SET
       dcq_mmscfd = excluded.dcq_mmscfd, nom_mmscfd = excluded.nom_mmscfd, prod_plan_mmscfd = excluded.prod_plan_mmscfd`,
    { ...row }
  );
}
