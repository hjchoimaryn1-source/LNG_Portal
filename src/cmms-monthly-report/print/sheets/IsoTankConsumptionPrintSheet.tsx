// src/cmms-monthly-report/print/sheets/IsoTankConsumptionPrintSheet.tsx
//
// PURPOSE
//   Print page for Consumption ISOTank — per-tank monthly snapshot table.

import type { IsoTankConsumptionRow } from '../../dao/isoTankConsumptionDao';
import { WideTableRenderer } from '../renderers/WideTableRenderer';
import { ISO_TANK_CONSUMPTION_COLUMNS } from '../configs/isoTankConsumptionColumnSpec';

export interface IsoTankConsumptionPrintSheetProps {
  records: IsoTankConsumptionRow[];
}

export function IsoTankConsumptionPrintSheet({ records }: IsoTankConsumptionPrintSheetProps) {
  return (
    <div className="print-page landscape">
      <div className="print-section-header">CONSUMPTION ISOTANK</div>
      <WideTableRenderer
        title="Monthly Snapshot"
        columns={ISO_TANK_CONSUMPTION_COLUMNS}
        rows={records}
        rowKey={(r) => r.isoTankNo}
      />
    </div>
  );
}
