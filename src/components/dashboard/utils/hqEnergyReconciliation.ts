// src/components/dashboard/utils/hqEnergyReconciliation.ts
//
// PURPOSE
//   JakartaHQDashboard의 Energy Reconciliation / Settlement Dispute 패널이 쓰는
//   순수 집계 함수. SettlementAuditView.tsx의 `metrics` useMemo와 동일한 공식을
//   사용하지만, Strangler Fig 원칙에 따라 기존 파일을 건드리지 않고 새 파일에
//   격리했다 (Adapter Pattern — 기존 SettlementLedgerEntry 타입만 재사용).

import type { SettlementLedgerEntry } from '../../../types/lng';

export interface EnergyReconciliationSummary {
  totalDeliveredMMBtu: number;
  totalConsumedMMBtu: number;
  netVarianceMMBtu: number;
  avgLossPercentage: number;
  totalLossesKg: number;
  disputeRecords: SettlementLedgerEntry[];
}

export function computeEnergyReconciliation(
  records: SettlementLedgerEntry[]
): EnergyReconciliationSummary {
  let totalDeliveredMMBtu = 0;
  let totalConsumedMMBtu = 0;
  let totalLossesKg = 0;
  const disputeRecords: SettlementLedgerEntry[] = [];

  for (const r of records) {
    totalDeliveredMMBtu += r.deliveredMMBtu;
    totalConsumedMMBtu += r.consumedMMBtu;
    totalLossesKg += r.lossesKg;
    if (r.disputeStatus === 'DISPUTE_ALERT') disputeRecords.push(r);
  }

  const netVarianceMMBtu = totalDeliveredMMBtu - totalConsumedMMBtu;
  const avgLossPercentage =
    totalDeliveredMMBtu > 0 ? (netVarianceMMBtu / totalDeliveredMMBtu) * 100 : 0;

  return {
    totalDeliveredMMBtu,
    totalConsumedMMBtu,
    netVarianceMMBtu,
    avgLossPercentage,
    totalLossesKg,
    disputeRecords,
  };
}
