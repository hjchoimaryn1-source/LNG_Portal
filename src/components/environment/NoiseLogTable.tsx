// src/components/environment/NoiseLogTable.tsx
//
// Phase 11b Stage 2-C — pure display component for env_noise_logs.
// Props-in only; no DAO/context calls. status is rendered verbatim as stored.

'use client';

import type { NoiseLog } from '../../cmms-environment/types/environment';

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

interface NoiseLogTableProps {
  records: NoiseLog[];
}

export default function NoiseLogTable({ records }: NoiseLogTableProps) {
  return (
    <div className="win-sunken overflow-y-auto max-h-72">
      <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300">Date</th>
            <th className="p-1.5 border-r border-slate-300">Location</th>
            <th className="p-1.5 border-r border-slate-300 text-right">Reading (dBA)</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Status</th>
            <th className="p-1.5">Recorded By</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={5} className="p-2 text-center text-slate-400">
                No noise logs recorded.
              </td>
            </tr>
          )}
          {records.map((r, i) => (
            <tr key={r.id} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="p-1.5 font-bold border-r border-slate-300">{r.logDate}</td>
              <td className="p-1.5 border-r border-slate-300">{r.location}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{r.readingDba}</td>
              <td className="p-1.5 border-r border-slate-300 text-center">
                <StatusBadge status={r.status} />
              </td>
              <td className="p-1.5">{r.recordedBy ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
