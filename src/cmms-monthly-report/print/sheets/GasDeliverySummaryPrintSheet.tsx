// src/cmms-monthly-report/print/sheets/GasDeliverySummaryPrintSheet.tsx
//
// PURPOSE
//   Print page for Summary Gas Delivery (P5) — daily manual-entry grid +
//   end-of-month cumulative block, mirrors GasDeliverySummaryForm.tsx.

import type { GasDeliveryDailyManualRow, GasDeliveryMonthlyManualRow } from '../../dao/gasDeliveryManualDao';
import { WideTableRenderer } from '../renderers/WideTableRenderer';
import { FieldSummaryRenderer } from '../renderers/FieldSummaryRenderer';
import { GAS_DELIVERY_DAILY_COLUMNS, GAS_DELIVERY_MONTHLY_FIELDS } from '../configs/gasDeliverySummaryColumnSpec';

export interface GasDeliverySummaryPrintSheetProps {
  daily: GasDeliveryDailyManualRow[];
  monthly: GasDeliveryMonthlyManualRow | null;
}

export function GasDeliverySummaryPrintSheet({ daily, monthly }: GasDeliverySummaryPrintSheetProps) {
  return (
    <div className="print-page landscape">
      <div className="print-section-header">SUMMARY GAS DELIVERY (P5)</div>
      <WideTableRenderer
        title="Daily Fields"
        columns={GAS_DELIVERY_DAILY_COLUMNS}
        rows={daily}
        rowKey={(r) => r.reportDate}
      />
      <FieldSummaryRenderer
        title="Monthly Cumulative Block"
        fields={GAS_DELIVERY_MONTHLY_FIELDS}
        values={monthly as unknown as Record<string, unknown> | null}
      />
    </div>
  );
}
