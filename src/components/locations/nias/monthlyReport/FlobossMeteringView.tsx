// src/components/locations/nias/monthlyReport/FlobossMeteringView.tsx
//
// PURPOSE
//   Floboss P1-P4 read-only daily view (Meter A/B volume+energy, station
//   totals, GHV, net sales) — sourced from gas_metering_ledger_daily
//   (GC_REPORT). Report/summary view, not a patrol-entry form — this data
//   is historical/ingested, not live-entered (Monthly Report Step 0 finding).

'use client';

import { SUNKEN_PANEL, TITLE_BAR } from '../../../cmms/scadaStyles';
import { useFlobossLedger } from './hooks/useMonthlyReportData';
import { fmtNum } from './utils/monthlyReportFormat';

export interface FlobossMeteringViewProps {
  reportMonth: string;
}

export default function FlobossMeteringView({ reportMonth }: FlobossMeteringViewProps) {
  const { records, isLoading, error } = useFlobossLedger(reportMonth);

  return (
    <div className="space-y-2">
      <div className={TITLE_BAR}>
        FLOBOSS METERING (P1-P4) — Meter A (FQI-01) / Meter B (FQI-02) / Station Total
      </div>

      {error && (
        <div className="p-2 text-[11px] text-red-700 font-bold">Failed to load Floboss ledger: {error}</div>
      )}

      <div className={`${SUNKEN_PANEL} overflow-x-auto`}>
        <table className="w-full text-[11px] font-mono">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="p-2 text-left" rowSpan={2}>Date</th>
              <th className="p-2 text-center border-l border-slate-300" colSpan={2}>Meter A</th>
              <th className="p-2 text-center border-l border-slate-300" colSpan={2}>Meter B</th>
              <th className="p-2 text-center border-l border-slate-300" colSpan={2}>Station Total</th>
              <th className="p-2 text-center border-l border-slate-300" colSpan={2}>GHV (BTU/SCF)</th>
              <th className="p-2 text-center border-l border-slate-300" colSpan={2}>Net Sales</th>
            </tr>
            <tr className="text-[10px]">
              <th className="p-1 text-right border-l border-slate-300">Vol (MMCF)</th>
              <th className="p-1 text-right">Energy (MMBTU)</th>
              <th className="p-1 text-right border-l border-slate-300">Vol (MMCF)</th>
              <th className="p-1 text-right">Energy (MMBTU)</th>
              <th className="p-1 text-right border-l border-slate-300">Vol (MMCF)</th>
              <th className="p-1 text-right">Energy (MMBTU)</th>
              <th className="p-1 text-right border-l border-slate-300">Station</th>
              <th className="p-1 text-right">Manual Sample</th>
              <th className="p-1 text-right border-l border-slate-300">Vol (MMSCF)</th>
              <th className="p-1 text-right">Energy (MMBTU)</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.reportDate} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-1.5">{r.reportDate}</td>
                <td className="p-1.5 text-right border-l border-slate-200">{fmtNum(r.dailyCvolMmcfA)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.dailyMmbtuA)}</td>
                <td className="p-1.5 text-right border-l border-slate-200">{fmtNum(r.dailyCvolMmcfB)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.dailyMmbtuB)}</td>
                <td className="p-1.5 text-right border-l border-slate-200">{fmtNum(r.dailyCvolMmcfStation)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.dailyMmbtuStation)}</td>
                <td className="p-1.5 text-right border-l border-slate-200">{fmtNum(r.ghvStation)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.ghvManualSample)}</td>
                <td className="p-1.5 text-right border-l border-slate-200">{fmtNum(r.netSalesVolMmscf)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.netSalesEnergyMmbtu)}</td>
              </tr>
            ))}
            {!isLoading && records.length === 0 && (
              <tr>
                <td colSpan={11} className="p-4 text-center text-slate-500">
                  No Floboss ledger rows found for {reportMonth}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
