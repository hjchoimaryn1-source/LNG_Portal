// src/cmms-monthly-report/print/sheets/MonthlyReportOpsPrintSheet.tsx
//
// PURPOSE
//   Print page for Monthly Report Ops. dashboard — Metering A/B day-column
//   table + Totalizer/Higest/Lowest/Average summary boxes. The sheet's
//   "Unloading LNG Iso tank" / On-Site-On-Ship logistics sub-block is
//   deferred (see opsDashboardDao.ts header) — shown as a gap notice
//   instead of fabricated numbers.

import type { OpsMeteringDayRow, OpsMeteringSummary } from '../../dao/opsDashboardDao';
import { WideTableRenderer } from '../renderers/WideTableRenderer';
import { FieldSummaryRenderer } from '../renderers/FieldSummaryRenderer';
import {
  OPS_DAY_COLUMNS,
  OPS_DAY_GROUP_HEADERS,
  OPS_METERING_A_SUMMARY_FIELDS,
  OPS_METERING_B_SUMMARY_FIELDS,
} from '../configs/monthlyReportOpsSpec';

export interface MonthlyReportOpsPrintSheetProps {
  days: OpsMeteringDayRow[];
  summary: { meterA: OpsMeteringSummary; meterB: OpsMeteringSummary } | null;
}

export function MonthlyReportOpsPrintSheet({ days, summary }: MonthlyReportOpsPrintSheetProps) {
  return (
    <div className="print-page landscape">
      <div className="print-section-header">MONTHLY REPORT OPS.</div>
      <FieldSummaryRenderer
        title="Metering A — Record Monthly"
        fields={OPS_METERING_A_SUMMARY_FIELDS}
        values={summary?.meterA as unknown as Record<string, unknown> | undefined}
      />
      <FieldSummaryRenderer
        title="Metering B — Record Monthly"
        fields={OPS_METERING_B_SUMMARY_FIELDS}
        values={summary?.meterB as unknown as Record<string, unknown> | undefined}
      />
      <WideTableRenderer
        title="Process Regasification — Daily"
        columns={OPS_DAY_COLUMNS}
        groupHeaders={OPS_DAY_GROUP_HEADERS}
        rows={days}
        rowKey={(r) => r.reportDate}
      />
      <div className="print-gap-notice">
        데이터 없음 — Unloading LNG Iso tank / On-Site-On-Ship 로지스틱스 블록은 원본 소스 매핑
        미확정으로 이번 스테이지에서 보류(추후 스테이지에서 확인 후 구현).
      </div>
    </div>
  );
}
