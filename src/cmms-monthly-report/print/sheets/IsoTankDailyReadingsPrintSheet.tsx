// src/cmms-monthly-report/print/sheets/IsoTankDailyReadingsPrintSheet.tsx
//
// PURPOSE
//   Print page for Monthly Report ISO Tank — one day-column block per tank,
//   matching the source sheet's per-tank wide-block layout (unlike the UI's
//   single-tank selector, print needs every tank).

import { useMemo } from 'react';
import type { IsoTankDailyReadingRow } from '../../dao/isoTankDailyReadingsDao';
import { WideTableRenderer } from '../renderers/WideTableRenderer';
import { ISO_TANK_DAILY_READINGS_COLUMNS } from '../configs/isoTankDailyReadingsColumnSpec';

export interface IsoTankDailyReadingsPrintSheetProps {
  records: IsoTankDailyReadingRow[];
}

export function IsoTankDailyReadingsPrintSheet({ records }: IsoTankDailyReadingsPrintSheetProps) {
  const tanks = useMemo(() => [...new Set(records.map((r) => r.isoTankNo))].sort(), [records]);

  return (
    <div className="print-page landscape">
      <div className="print-section-header">MONTHLY REPORT ISO TANK</div>
      {tanks.map((tank) => (
        <WideTableRenderer
          key={tank}
          title={tank}
          columns={ISO_TANK_DAILY_READINGS_COLUMNS}
          rows={records.filter((r) => r.isoTankNo === tank)}
          rowKey={(r) => r.reportDate}
        />
      ))}
    </div>
  );
}
