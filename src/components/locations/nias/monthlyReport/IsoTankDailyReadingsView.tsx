// src/components/locations/nias/monthlyReport/IsoTankDailyReadingsView.tsx
//
// PURPOSE
//   "Monthly Report ISO Tank" read-only view — per-tank daily Level/
//   Battery/Pressure/Temp readings. Source sheet lays this out as one wide
//   block per tank (31 day-columns); rendered here as a tank selector +
//   narrow daily table instead, to stay scrollable/legible at this UI scale.

'use client';

import { useMemo, useState } from 'react';
import { SUNKEN_INPUT, SUNKEN_PANEL, TITLE_BAR } from '../../../cmms/scadaStyles';
import { useIsoTankDailyReadings } from './hooks/useMonthlyReportData';
import { fmtNum, fmtText } from './utils/monthlyReportFormat';

export interface IsoTankDailyReadingsViewProps {
  reportMonth: string;
}

export default function IsoTankDailyReadingsView({ reportMonth }: IsoTankDailyReadingsViewProps) {
  const { records, isLoading, error } = useIsoTankDailyReadings(reportMonth);
  const [selectedTank, setSelectedTank] = useState<string>('');

  const tankOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.isoTankNo));
    return [...set].sort();
  }, [records]);

  const activeTank = selectedTank || tankOptions[0] || '';
  const rowsForTank = records.filter((r) => r.isoTankNo === activeTank);

  return (
    <div className="space-y-2">
      <div className={TITLE_BAR}>
        MONTHLY REPORT ISO TANK — Daily Level/Battery/Pressure/Temp ({tankOptions.length} tanks)
      </div>

      {error && <div className="p-2 text-[11px] text-red-700 font-bold">Failed to load daily readings: {error}</div>}

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-slate-700">Tank:</span>
        <select
          value={activeTank}
          onChange={(e) => setSelectedTank(e.target.value)}
          className={`${SUNKEN_INPUT} w-48`}
        >
          {tankOptions.map((tank) => (
            <option key={tank} value={tank}>
              {tank}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-slate-500 ml-auto">
          {isLoading ? 'Loading…' : `${rowsForTank.length} days`}
        </span>
      </div>

      <div className={`${SUNKEN_PANEL} overflow-x-auto`}>
        <table className="w-full text-[11px] font-mono">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">Level (%)</th>
              <th className="p-2 text-right">Level (m³)</th>
              <th className="p-2 text-right">Level (mmH2O)</th>
              <th className="p-2 text-right">Battery (%)</th>
              <th className="p-2 text-right">Pressure (MPa)</th>
              <th className="p-2 text-right">Temp (°C)</th>
              <th className="p-2 text-left">Depress</th>
              <th className="p-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rowsForTank.map((r) => (
              <tr key={r.reportDate} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-1.5">{r.reportDate}</td>
                <td className="p-1.5 text-right">{fmtNum(r.levelPct, 0)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.levelM3, 0)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.levelMmh2o, 0)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.batteryPct, 0)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.pressureMpa)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.tempC, 1)}</td>
                <td className="p-1.5">{fmtText(r.depressFlag)}</td>
                <td className="p-1.5">{fmtText(r.remarks)}</td>
              </tr>
            ))}
            {!isLoading && rowsForTank.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-slate-500">
                  No daily readings found for {activeTank || reportMonth}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
