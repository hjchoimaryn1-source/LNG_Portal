// src/components/moc/CompletionReportTable.tsx
//
// Phase 11c Stage 2-C — pure display component for moc_completion_report (NP12-02).
// Props-in only; no DAO/context calls. Review pills reflect stored booleans
// verbatim — no PASS/FAIL inference happens here.

'use client';

import type { CompletionReport } from '../../cmms-moc/types/moc';

function YesNoPill({ value }: { value: boolean }) {
  return (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-bold border ${
        value ? 'text-green-800 bg-green-50 border-green-700' : 'text-red-800 bg-red-50 border-red-700'
      }`}
    >
      {value ? 'YES' : 'NO'}
    </span>
  );
}

interface CompletionReportTableProps {
  records: CompletionReport[];
}

export default function CompletionReportTable({ records }: CompletionReportTableProps) {
  return (
    <div className="win-sunken overflow-y-auto max-h-96">
      <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300">Doc No.</th>
            <th className="p-1.5 border-r border-slate-300">Plan Doc No.</th>
            <th className="p-1.5 border-r border-slate-300">Responsible Team</th>
            <th className="p-1.5 border-r border-slate-300">Completion Date</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Procedure Followed</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Objective Met</th>
            <th className="p-1.5 text-center">Process Effective</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={7} className="p-2 text-center text-slate-400">
                No completion reports recorded.
              </td>
            </tr>
          )}
          {records.map((r, i) => (
            <tr key={r.docNo} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="p-1.5 font-bold border-r border-slate-300">{r.docNo}</td>
              <td className="p-1.5 border-r border-slate-300">{r.planOfChangeDocNo}</td>
              <td className="p-1.5 border-r border-slate-300">{r.responsibleTeam}</td>
              <td className="p-1.5 border-r border-slate-300">{r.completionDate ?? '—'}</td>
              <td className="p-1.5 border-r border-slate-300 text-center">
                <YesNoPill value={r.reviewProcedureFollowed} />
              </td>
              <td className="p-1.5 border-r border-slate-300 text-center">
                <YesNoPill value={r.reviewObjectiveMet} />
              </td>
              <td className="p-1.5 text-center">
                <YesNoPill value={r.reviewProcessEffective} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
