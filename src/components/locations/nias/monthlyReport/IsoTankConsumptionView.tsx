// src/components/locations/nias/monthlyReport/IsoTankConsumptionView.tsx
//
// PURPOSE
//   "Consumption ISOTank" read-only view — per-tank monthly consumption
//   snapshot (Stock Awal/Akhir, Net Consumed, Losses). HJ-confirmed: this
//   source's tank roster is NOT reconciled against IsoTankDailyReadingsView's
//   (ISOT-064 present only in the daily-readings source, absent here by design).

'use client';

import { SUNKEN_PANEL, TITLE_BAR } from '../../../cmms/scadaStyles';
import { useIsoTankConsumption } from './hooks/useMonthlyReportData';
import { fmtNum, fmtText } from './utils/monthlyReportFormat';

export interface IsoTankConsumptionViewProps {
  reportMonth: string;
}

export default function IsoTankConsumptionView({ reportMonth }: IsoTankConsumptionViewProps) {
  const { records, isLoading, error } = useIsoTankConsumption(reportMonth);

  return (
    <div className="space-y-2">
      <div className={TITLE_BAR}>ISO TANK CONSUMPTION — Monthly Snapshot ({records.length} tanks)</div>

      {error && <div className="p-2 text-[11px] text-red-700 font-bold">Failed to load consumption data: {error}</div>}

      <div className={`${SUNKEN_PANEL} overflow-x-auto`}>
        <table className="w-full text-[11px] font-mono">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="p-2 text-left">Tank</th>
              <th className="p-2 text-left">Shipment</th>
              <th className="p-2 text-right">Weight Awal (Kg)</th>
              <th className="p-2 text-right">Stock Awal (m³)</th>
              <th className="p-2 text-right">Stock Akhir (m³)</th>
              <th className="p-2 text-right">Net Consumed (m³)</th>
              <th className="p-2 text-right">Consumed (MMBTU)</th>
              <th className="p-2 text-right">Density (Kg/m³)</th>
              <th className="p-2 text-right">Losses (Kg)</th>
              <th className="p-2 text-right">Losses (%)</th>
              <th className="p-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.isoTankNo} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-1.5 font-bold">{r.isoTankNo}</td>
                <td className="p-1.5">{fmtText(r.shipment)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.weightAwalKg, 0)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.stockAwalM3)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.stockAkhirM3)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.netConsumedM3)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.consumedMmbtu)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.densityKgM3, 0)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.lossesKg, 0)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.lossesPct)}</td>
                <td className="p-1.5">{fmtText(r.remarks)}</td>
              </tr>
            ))}
            {!isLoading && records.length === 0 && (
              <tr>
                <td colSpan={11} className="p-4 text-center text-slate-500">
                  No consumption rows found for {reportMonth}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
