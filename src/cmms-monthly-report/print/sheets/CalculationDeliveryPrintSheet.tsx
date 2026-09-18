// src/cmms-monthly-report/print/sheets/CalculationDeliveryPrintSheet.tsx
//
// PURPOSE
//   Print page for Calculation Delivery Gas (P6) — monthly meter reading /
//   correction / delivered-quantity label:value grid.

import type { CalculationDeliveryRow } from '../../dao/calculationDeliveryDao';
import { FieldSummaryRenderer } from '../renderers/FieldSummaryRenderer';
import { CALCULATION_DELIVERY_FIELDS } from '../configs/calculationDeliveryFieldSpec';

export interface CalculationDeliveryPrintSheetProps {
  record: CalculationDeliveryRow | null;
}

export function CalculationDeliveryPrintSheet({ record }: CalculationDeliveryPrintSheetProps) {
  return (
    <div className="print-page">
      <div className="print-section-header">CALCULATION DELIVERY GAS (P6)</div>
      <FieldSummaryRenderer
        title="Monthly Calculation"
        fields={CALCULATION_DELIVERY_FIELDS}
        values={record as unknown as Record<string, unknown> | null}
      />
    </div>
  );
}
