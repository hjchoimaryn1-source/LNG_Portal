// src/components/locations/nias/NiasTankMassBalanceTab.tsx
//
// PURPOSE
//   "Mass Balance" — rebuilt on live iso_tank_daily_readings data (ISO Tank
//   & Mass Balance relocation stage), replacing the old
//   DEFAULT_MASS_BALANCE_DATA mock array + settlementRecords overlay (852
//   lines, confirmed mock, no real aggregation — prior session
//   investigation). View only; fetch in useMassBalanceData.ts, aggregation
//   in massBalanceCalculations.ts (AGENTS.md §3 separation).

'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useMassBalanceData } from './hooks/useMassBalanceData';
import { aggregateMassBalanceRows, computeMassBalanceMetrics } from './utils/massBalanceCalculations';
import { MassBalanceKpiCards } from './MassBalanceKpiCards';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function NiasTankMassBalanceTab() {
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [searchQuery, setSearchQuery] = useState('');
  const { readings, consumption, certificates, isLoading, error } = useMassBalanceData(reportMonth);

  const rows = useMemo(() => aggregateMassBalanceRows(readings), [readings]);
  const metrics = useMemo(
    () => computeMassBalanceMetrics(rows, consumption, certificates),
    [rows, consumption, certificates]
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.isoTankNo.toLowerCase().includes(q) ||
        (r.serialNo ?? '').toLowerCase().includes(q) ||
        (r.shipment ?? '').toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  return (
    <div className="space-y-3 animate-in fade-in duration-200 font-mono">
      <div className="bg-[#0a2540] text-white p-3 rounded-t-xs border-b-2 border-[#071a2e] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 select-none">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-mono">
          ISO TANK MASS BALANCE — {reportMonth}
        </h3>
        <input
          type="month"
          value={reportMonth}
          onChange={(e) => setReportMonth(e.target.value)}
          className="text-xs font-mono px-2 py-1 rounded-xs border border-slate-400"
        />
      </div>

      {error && <div className="p-2 text-[11px] text-red-300 bg-red-950 font-bold">{error}</div>}

      <MassBalanceKpiCards metrics={metrics} />

      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xs border-2 border-[#8a8579] shadow-inner max-w-[420px]">
        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ISO Tank No, Serial, Shipment..."
          className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="bg-white border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-md">
        <div className="max-h-[480px] overflow-y-auto overflow-x-auto custom-scada-scrollbar">
          <table className="w-full text-xs text-center border-collapse font-mono">
            <thead className="sticky top-0 z-20 shadow-xs bg-[#5f6f82] text-[#f8fafc] font-bold text-[10px]">
              <tr>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">TANK ID</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">SERIAL NO</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">BATCH</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">POSITION</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">LEVEL (%)</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">PRESSURE (MPa)</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">TEMP (°C)</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8] bg-[#2b78c5]">MONTHLY BOG LOSS (kg)</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8]">LATEST DATE</th>
                <th className="py-2 px-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd5e1] bg-white">
              {!isLoading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-bold">
                    {reportMonth}에 대한 ISO Tank daily reading이 없습니다.
                  </td>
                </tr>
              )}
              {filteredRows.map((r, idx) => (
                <tr key={r.isoTankNo} className={idx % 2 === 0 ? 'bg-[#faf9f6]' : 'bg-white'}>
                  <td className="py-2 px-2 border-r border-[#8b9aa8] font-black text-[#0055aa]">{r.isoTankNo}</td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8]">{r.serialNo ?? '—'}</td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8]">{r.shipment ?? '—'}</td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8]">{r.position ?? '—'}</td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8]">{r.levelPct?.toFixed(1) ?? '—'}</td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8]">{r.pressureMpa?.toFixed(2) ?? '—'}</td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8]">{r.tempC?.toFixed(1) ?? '—'}</td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8] font-black text-[#dc2626]" style={{ backgroundColor: '#f0f7ff' }}>
                    -{r.monthlyBogLossKg.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 border-r border-[#8b9aa8]">{r.latestReportDate}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-xs text-[10px] font-black border ${
                        r.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : r.operationalStatus === 'DEPRESSURIZED'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {r.operationalStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
