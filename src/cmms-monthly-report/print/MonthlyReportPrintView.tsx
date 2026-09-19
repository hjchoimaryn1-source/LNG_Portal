// src/cmms-monthly-report/print/MonthlyReportPrintView.tsx
//
// PURPOSE
//   Monthly Report (PLN EPI) print orchestrator — one reportMonth fetches
//   every already-built sheet's data via the existing Stage 3 hooks and
//   renders all 13 sheets in sequence (Floboss combines P1-P4, per the
//   existing UI's confirmed grouping). Browser print-to-PDF via
//   @media print CSS only — same mechanism as DailyReportPrintView.tsx,
//   no PDF library in this codebase (Step 0 finding).

'use client';

import { mergeGasDeliveryDailyRows } from '../dao/gasDeliveryMergedView';
import { MONTHLY_REPORT_PRINT_STYLES } from './printStyles';
import { FlobossPrintSheet } from './sheets/FlobossPrintSheet';
import { GasDeliverySummaryPrintSheet } from './sheets/GasDeliverySummaryPrintSheet';
import { CalculationDeliveryPrintSheet } from './sheets/CalculationDeliveryPrintSheet';
import { StatementOfDeliveryPrintSheet } from './sheets/StatementOfDeliveryPrintSheet';
import { BeritaAcaraValidasiPrintSheet } from './sheets/BeritaAcaraValidasiPrintSheet';
import { GasAnalysisPrintSheet } from './sheets/GasAnalysisPrintSheet';
import { GrafikPrintView } from './sheets/GrafikPrintView';
import { IsoTankConsumptionPrintSheet } from './sheets/IsoTankConsumptionPrintSheet';
import { IsoTankDailyReadingsPrintSheet } from './sheets/IsoTankDailyReadingsPrintSheet';
import { MonthlyReportOpsPrintSheet } from './sheets/MonthlyReportOpsPrintSheet';
import {
  useFlobossLedger,
  useGasCompositionSnapshot,
  useGasDeliveryManual,
  useIsoTankConsumption,
  useIsoTankDailyReadings,
  useCalculationDelivery,
  useOpsMeteringDashboard,
} from '../../components/locations/nias/monthlyReport/hooks/useMonthlyReportData';

export interface MonthlyReportPrintViewProps {
  reportMonth: string;
}

export function MonthlyReportPrintView({ reportMonth }: MonthlyReportPrintViewProps) {
  const floboss = useFlobossLedger(reportMonth);
  const gasDelivery = useGasDeliveryManual(reportMonth);
  const gasComposition = useGasCompositionSnapshot(reportMonth);
  const isoTankConsumption = useIsoTankConsumption(reportMonth);
  const isoTankDaily = useIsoTankDailyReadings(reportMonth);
  const calculationDelivery = useCalculationDelivery(reportMonth);
  const ops = useOpsMeteringDashboard(reportMonth);
  const gasDeliveryMerged = mergeGasDeliveryDailyRows(
    gasDelivery.daily,
    gasDelivery.computed,
    gasDelivery.contractReference
  );

  return (
    <div>
      <style>{MONTHLY_REPORT_PRINT_STYLES}</style>
      <FlobossPrintSheet records={floboss.records} />
      <GasDeliverySummaryPrintSheet daily={gasDeliveryMerged} monthly={gasDelivery.monthly} />
      <CalculationDeliveryPrintSheet record={calculationDelivery.record} />
      <StatementOfDeliveryPrintSheet record={calculationDelivery.record} />
      <BeritaAcaraValidasiPrintSheet />
      <GasAnalysisPrintSheet snapshot={gasComposition.snapshot} />
      <GrafikPrintView records={floboss.records} />
      <IsoTankConsumptionPrintSheet records={isoTankConsumption.records} />
      <IsoTankDailyReadingsPrintSheet records={isoTankDaily.records} />
      <MonthlyReportOpsPrintSheet days={ops.days} summary={ops.summary} />
    </div>
  );
}
