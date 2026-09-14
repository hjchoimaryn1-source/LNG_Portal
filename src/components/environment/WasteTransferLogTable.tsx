// src/components/environment/WasteTransferLogTable.tsx
//
// Phase 11b Stage 2-D — pure display component for env_waste_transfer_logs.
// Props-in only; no DAO/context calls.

'use client';

import type { WasteTransferLog } from '../../cmms-environment/types/environment';

const CATEGORY_BADGE: Record<string, string> = {
  HAZARDOUS: 'text-red-800 bg-red-50 border-red-700',
  NON_HAZARDOUS: 'text-slate-700 bg-slate-50 border-slate-400',
};

interface WasteTransferLogTableProps {
  records: WasteTransferLog[];
}

export default function WasteTransferLogTable({ records }: WasteTransferLogTableProps) {
  return (
    <div className="win-sunken overflow-y-auto max-h-72">
      <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300">Date</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Category</th>
            <th className="p-1.5 border-r border-slate-300">Waste Type</th>
            <th className="p-1.5 border-r border-slate-300">Source Dept.</th>
            <th className="p-1.5 border-r border-slate-300 text-right">Qty (kg)</th>
            <th className="p-1.5 border-r border-slate-300">Disposal Method</th>
            <th className="p-1.5 border-r border-slate-300">Transported To</th>
            <th className="p-1.5">PIC Signature</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={8} className="p-2 text-center text-slate-400">
                No waste transfer logs recorded.
              </td>
            </tr>
          )}
          {records.map((r, i) => (
            <tr key={r.id} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="p-1.5 font-bold border-r border-slate-300">{r.transferDate}</td>
              <td className="p-1.5 border-r border-slate-300 text-center">
                <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${CATEGORY_BADGE[r.wasteCategory]}`}>
                  {r.wasteCategory}
                </span>
              </td>
              <td className="p-1.5 border-r border-slate-300">{r.wasteType}</td>
              <td className="p-1.5 border-r border-slate-300">{r.sourceDepartment}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{r.quantityKg}</td>
              <td className="p-1.5 border-r border-slate-300">{r.disposalMethod}</td>
              <td className="p-1.5 border-r border-slate-300">{r.transportedTo ?? '—'}</td>
              <td className="p-1.5">{r.picSignature ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
