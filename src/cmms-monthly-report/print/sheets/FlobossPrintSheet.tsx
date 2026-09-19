// src/cmms-monthly-report/print/sheets/FlobossPrintSheet.tsx
//
// PURPOSE
//   Print page for Floboss Metering (P1-P4) — Meter A/B, Station Total,
//   GHV, Net Sales, combined per the existing Stage 3 UI's grouping
//   (FlobossMeteringView.tsx).

import type { FlobossDailyRow } from '../../../gas-metering/dao/gasMeteringLedgerDao';
import { WideTableRenderer } from '../renderers/WideTableRenderer';
import { FLOBOSS_COLUMNS, FLOBOSS_GROUP_HEADERS } from '../configs/flobossColumnSpec';

export interface FlobossPrintSheetProps {
  records: FlobossDailyRow[];
}

export function FlobossPrintSheet({ records }: FlobossPrintSheetProps) {
  return (
    <div className="print-page landscape">
      <div className="print-section-header">FLOBOSS METERING (P1-P4)</div>
      <WideTableRenderer
        title="Meter A (FQI-01) / Meter B (FQI-02) / Station Total"
        columns={FLOBOSS_COLUMNS}
        groupHeaders={FLOBOSS_GROUP_HEADERS}
        rows={records}
        rowKey={(r) => r.reportDate}
      />
    </div>
  );
}
