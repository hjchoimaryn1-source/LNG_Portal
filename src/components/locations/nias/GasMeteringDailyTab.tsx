// src/components/locations/nias/GasMeteringDailyTab.tsx
//
// PURPOSE
//   "GAS METERING (DAILY)" — Phase 12 Stage 2. Replaces NiasGasQualityTab.tsx
//   (manual entry form) + NiasGasQualityLedgerTab.tsx (localStorage ledger)
//   with a single read-only ledger backed by gas_metering_ledger_daily
//   (GC_REPORT + GC_COMPOSITION, ingested via the CSV pipeline — HJ decision
//   2026-09-16: no manual entry / no recurring PDF workflow going forward).
//   Every field is rendered defensively (station/meter values may be null —
//   future CSV/report revisions are not guaranteed to populate every column).

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_PANEL, TITLE_BAR, BEVEL_BUTTON, SUNKEN_INPUT } from '../../cmms/scadaStyles';
import { exportToCSV } from '../../../utils/exportCsv';
import { useGasMeteringLedger } from '../../../gas-metering/hooks/useGasMeteringLedger';
import type { GasMeteringLedgerDailyRow } from '../../../gas-metering/dao/gasMeteringLedgerDao';

function fmt(value: number | null, digits = 2): string {
  return value === null || value === undefined ? '—' : value.toFixed(digits);
}

export default function GasMeteringDailyTab() {
  const { records, isLoading, error } = useGasMeteringLedger(90);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? records.filter((r) => r.reportDate.includes(searchQuery.trim()))
    : records;

  function handleExport() {
    exportToCSV(
      'gas-metering-daily-ledger',
      filtered as unknown as Record<string, unknown>[],
      [
        { key: 'reportDate', label: 'Report Date' },
        { key: 'dailyMmbtuStation', label: 'Daily Energy Station (MMBTU)' },
        { key: 'dailyCvolMmcfStation', label: 'Daily Volume Station (MMCF)' },
        { key: 'ghvA', label: 'GHV M-101A (BTU/SCF)' },
        { key: 'ghvB', label: 'GHV M-101B (BTU/SCF)' },
        { key: 'molMethaneA', label: 'Methane M-101A (%Mol)' },
        { key: 'molMethaneB', label: 'Methane M-101B (%Mol)' },
      ]
    );
  }

  return (
    <div className="space-y-3">
      <div className={TITLE_BAR}>GAS METERING (DAILY) — gas_metering_ledger_daily</div>

      <div className={`${RAISED_PANEL} p-2 flex flex-wrap items-center gap-2`}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search report date (YYYY-MM-DD)"
          className={`${SUNKEN_INPUT} w-64`}
        />
        <button type="button" onClick={handleExport} className={BEVEL_BUTTON}>
          Export CSV
        </button>
        <span className="text-[11px] text-slate-600 ml-auto">
          {isLoading ? 'Loading…' : `${filtered.length} of ${records.length} days`}
        </span>
      </div>

      {error && (
        <div className={`${RAISED_PANEL} p-2 text-[11px] text-red-700 font-bold`}>
          Failed to load ledger: {error}
        </div>
      )}

      <div className={`${SUNKEN_PANEL} overflow-x-auto`}>
        <table className="w-full text-[11px] font-mono">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">Daily Energy Station (MMBTU)</th>
              <th className="p-2 text-right">Daily Volume Station (MMCF)</th>
              <th className="p-2 text-right">GHV A</th>
              <th className="p-2 text-right">GHV B</th>
              <th className="p-2 text-right">Press A (Barg)</th>
              <th className="p-2 text-right">Temp A (°C)</th>
              <th className="p-2 text-right">Methane A (%)</th>
              <th className="p-2 text-right">Methane B (%)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: GasMeteringLedgerDailyRow) => (
              <tr key={r.reportDate} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2">{r.reportDate}</td>
                <td className="p-2 text-right">{fmt(r.dailyMmbtuStation)}</td>
                <td className="p-2 text-right">{fmt(r.dailyCvolMmcfStation)}</td>
                <td className="p-2 text-right">{fmt(r.ghvA)}</td>
                <td className="p-2 text-right">{fmt(r.ghvB)}</td>
                <td className="p-2 text-right">{fmt(r.pressBargA)}</td>
                <td className="p-2 text-right">{fmt(r.tempCA)}</td>
                <td className="p-2 text-right">{fmt(r.molMethaneA)}</td>
                <td className="p-2 text-right">{fmt(r.molMethaneB)}</td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-slate-500">
                  No gas metering ledger rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
