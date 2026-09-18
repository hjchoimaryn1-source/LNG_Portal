// src/cmms-monthly-report/print/sheets/StatementOfDeliveryPrintSheet.tsx
//
// PURPOSE
//   Print page for Statement of Delivery (P7) — narrative template +
//   signature-frame placeholder (near-approximate, source has no layout
//   signal for it — see SignatureFramePlaceholder.tsx).

import type { CalculationDeliveryRow } from '../../dao/calculationDeliveryDao';
import { NarrativeTemplateRenderer } from '../renderers/NarrativeTemplateRenderer';
import { STATEMENT_OF_DELIVERY_TEMPLATE } from '../configs/statementOfDeliveryTemplate';
import { SignatureFramePlaceholder } from '../SignatureFramePlaceholder';

export interface StatementOfDeliveryPrintSheetProps {
  record: CalculationDeliveryRow | null;
}

export function StatementOfDeliveryPrintSheet({ record }: StatementOfDeliveryPrintSheetProps) {
  return (
    <div className="print-page">
      <div className="print-section-header">STATEMENT OF DELIVERY (P7)</div>
      <NarrativeTemplateRenderer
        spec={STATEMENT_OF_DELIVERY_TEMPLATE}
        headerValues={record as unknown as Record<string, unknown> | null}
      />
      <SignatureFramePlaceholder />
    </div>
  );
}
