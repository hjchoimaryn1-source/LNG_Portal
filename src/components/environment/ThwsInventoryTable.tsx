// src/components/environment/ThwsInventoryTable.tsx
//
// Phase 11b Stage 2-D — pure display component for env_thws_inventory.
// Props-in only; no DAO/context calls. Countdown uses getThwsDaysRemaining
// (Stage 1 pure function) purely for display — the `status` column always
// shows the stored value verbatim, never recomputed here.

'use client';

import type { ThwsInventoryItem } from '../../cmms-environment/types/environment';
import { getThwsDaysRemaining } from '../../cmms-environment/services/environmentMonitoringService';

const STATUS_BADGE: Record<string, string> = {
  IN_STORAGE: 'text-slate-700 bg-slate-50 border-slate-400',
  DISPOSED: 'text-green-800 bg-green-50 border-green-700',
  OVERDUE: 'text-red-800 bg-red-50 border-red-700',
};

interface ThwsInventoryTableProps {
  records: ThwsInventoryItem[];
}

export default function ThwsInventoryTable({ records }: ThwsInventoryTableProps) {
  return (
    <div className="win-sunken overflow-y-auto max-h-72">
      <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
        <thead>
          <tr className="bg-slate-200 border-b border-slate-400">
            <th className="p-1.5 border-r border-slate-300">Waste Code</th>
            <th className="p-1.5 border-r border-slate-300">Description</th>
            <th className="p-1.5 border-r border-slate-300 text-right">Qty (kg)</th>
            <th className="p-1.5 border-r border-slate-300">Storage-In</th>
            <th className="p-1.5 border-r border-slate-300">Disposal Due</th>
            <th className="p-1.5 border-r border-slate-300 text-right">Days Left</th>
            <th className="p-1.5 border-r border-slate-300 text-center">Status</th>
            <th className="p-1.5">Handler PIC</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={8} className="p-2 text-center text-slate-400">
                No THWS inventory recorded.
              </td>
            </tr>
          )}
          {records.map((r, i) => (
            <tr key={r.id} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="p-1.5 font-bold border-r border-slate-300">{r.wasteCode}</td>
              <td className="p-1.5 border-r border-slate-300">{r.wasteDescription}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{r.quantityKg}</td>
              <td className="p-1.5 border-r border-slate-300">{r.storageInDate}</td>
              <td className="p-1.5 border-r border-slate-300">{r.disposalDueDate}</td>
              <td className="p-1.5 border-r border-slate-300 text-right">{getThwsDaysRemaining(r.disposalDueDate)}</td>
              <td className="p-1.5 border-r border-slate-300 text-center">
                <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${STATUS_BADGE[r.status]}`}>{r.status}</span>
              </td>
              <td className="p-1.5">{r.handlerPic ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
