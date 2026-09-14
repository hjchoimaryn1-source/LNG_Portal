// src/components/environment/SeawaterLogTable.tsx
//
// Phase 11b Stage 2-C — pure display component for env_seawater_logs.
// Props-in only; no DAO/context calls. This table has no status field
// (Stage 1 schema does not define PASS/FAIL for seawater monitoring).

'use client';

import type { SeawaterLog } from '../../cmms-environment/types/environment';

interface SeawaterLogTableProps {
  records: SeawaterLog[];
}

export default function SeawaterLogTable({ records }: SeawaterLogTableProps) {
  return (
    <div className="win-sunken overflow-y-auto max-h-72">
      <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300">Date</th>
            <th className="p-1.5 border-r border-slate-300">Location</th>
            <th className="p-1.5 border-r border-slate-300 text-right">DO (mg/L)</th>
            <th className="p-1.5 border-r border-slate-300 text-right">Salinity (ppt)</th>
            <th className="p-1.5 border-r border-slate-300 text-right">Turbidity (NTU)</th>
            <th className="p-1.5">Recorded By</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={6} className="p-2 text-center text-slate-400">
                No seawater logs recorded.
              </td>
            </tr>
          )}
          {records.map((r, i) => (
            <tr key={r.id} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="p-1.5 font-bold border-r border-slate-300">{r.logDate}</td>
              <td className="p-1.5 border-r border-slate-300">{r.location}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{r.doMgl ?? '—'}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{r.salinityPpt ?? '—'}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{r.turbidityNtu ?? '—'}</td>
              <td className="p-1.5">{r.recordedBy ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
