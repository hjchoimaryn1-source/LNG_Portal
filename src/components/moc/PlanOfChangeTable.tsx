// src/components/moc/PlanOfChangeTable.tsx
//
// Phase 11c Stage 2-C — pure display component for moc_plan_of_change (NP12-01).
// Props-in only; no DAO/context calls. classifyRiskRating() badge is
// informational display only — never gates what rows render (Stage 2 has no
// submit/approve workflow yet regardless).

'use client';

import type { PlanOfChange } from '../../cmms-moc/types/moc';
import { classifyRiskRating, type RiskClassification } from '../../cmms-moc/services/mocRiskService';

const RISK_BADGE: Record<RiskClassification, string> = {
  ACCEPTABLE: 'text-green-800 bg-green-50 border-green-700',
  REVIEW_NEEDED: 'text-amber-800 bg-amber-50 border-amber-700',
  NOT_ACCEPTABLE: 'text-red-800 bg-red-50 border-red-700',
};

function RiskBadge({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-slate-400">—</span>;
  const classification = classifyRiskRating(rating);
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${RISK_BADGE[classification]}`}>
      {rating} / {classification}
    </span>
  );
}

interface PlanOfChangeTableProps {
  records: PlanOfChange[];
}

export default function PlanOfChangeTable({ records }: PlanOfChangeTableProps) {
  return (
    <div className="win-sunken overflow-y-auto max-h-96">
      <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300">Doc No.</th>
            <th className="p-1.5 border-r border-slate-300">Object of Change</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Type</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Status</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Initial Risk</th>
            <th className="p-1.5">Targeted Completion</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={6} className="p-2 text-center text-slate-400">
                No plans of change recorded.
              </td>
            </tr>
          )}
          {records.map((r, i) => (
            <tr key={r.docNo} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="p-1.5 font-bold border-r border-slate-300">{r.docNo}</td>
              <td className="p-1.5 border-r border-slate-300">{r.objectOfChange}</td>
              <td className="p-1.5 border-r border-slate-300 text-center">{r.changeType}</td>
              <td className="p-1.5 border-r border-slate-300 text-center">{r.status}</td>
              <td className="p-1.5 border-r border-slate-300 text-center">
                <RiskBadge rating={r.initialRiskRating} />
              </td>
              <td className="p-1.5">{r.targetedCompletionDate ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
