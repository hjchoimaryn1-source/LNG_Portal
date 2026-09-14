// src/components/environment/WastewaterLogTable.tsx
//
// Phase 11b Stage 2-C — pure display component for env_wastewater_logs.
// Props-in only; no DAO/context calls. standardRef is shown as a reference
// string only — no PASS/FAIL is computed against it in this layer.

'use client';

import type { WastewaterLog } from '../../cmms-environment/types/environment';

const STATUS_BADGE: Record<string, string> = {
  PASS: 'text-green-800 bg-green-50 border-green-700',
  FAIL: 'text-red-800 bg-red-50 border-red-700',
  PENDING_REVIEW: 'text-amber-800 bg-amber-50 border-amber-700',
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${STATUS_BADGE[status] ?? 'text-slate-700 bg-slate-50 border-slate-400'}`}>
      {status}
    </span>
  );
}

interface WastewaterLogTableProps {
  records: WastewaterLog[];
}

export default function WastewaterLogTable({ records }: WastewaterLogTableProps) {
  return (
    <div className="win-sunken overflow-y-auto max-h-72">
      <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300">Date</th>
            <th className="p-1.5 border-r border-slate-300">Sample Point</th>
            <th className="p-1.5 border-r border-slate-300">Parameter</th>
            <th className="p-1.5 border-r border-slate-300 text-right">Result</th>
            <th className="p-1.5 border-r border-slate-300">Unit</th>
            <th className="p-1.5 border-r border-slate-300">Standard Ref (display only)</th>
            <th className="p-1.5 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={7} className="p-2 text-center text-slate-400">
                No wastewater logs recorded.
              </td>
            </tr>
          )}
          {records.map((r, i) => (
            <tr key={r.id} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="p-1.5 font-bold border-r border-slate-300">{r.logDate}</td>
              <td className="p-1.5 border-r border-slate-300">{r.samplePoint}</td>
              <td className="p-1.5 border-r border-slate-300">{r.parameter}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{r.measuredResult}</td>
              <td className="p-1.5 border-r border-slate-300">{r.unit}</td>
              <td className="p-1.5 border-r border-slate-300 text-slate-500">{r.standardRef ?? '—'}</td>
              <td className="p-1.5 text-center">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
