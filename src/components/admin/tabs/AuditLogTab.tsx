// src/components/admin/tabs/AuditLogTab.tsx
'use client';

import { SUNKEN_PANEL } from '../../cmms/scadaStyles';
import { useAuditLog } from '../hooks/useAuditLog';

export default function AuditLogTab() {
  const { records, loading } = useAuditLog();

  return (
    <div className="space-y-2">
      {loading && <div className="text-[11px] text-slate-500">Loading...</div>}
      <div className={`${SUNKEN_PANEL} overflow-x-auto max-h-[60vh] overflow-y-auto`}>
        <table className="w-full text-[11px]">
          <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
            <tr>
              <td className="p-1.5">Time</td>
              <td className="p-1.5">Event</td>
              <td className="p-1.5">Employee</td>
              <td className="p-1.5">Account</td>
              <td className="p-1.5">Actor</td>
              <td className="p-1.5">Detail</td>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="p-1.5 font-mono whitespace-nowrap">{r.createdAt}</td>
                <td className="p-1.5 font-bold">{r.eventType}</td>
                <td className="p-1.5 font-mono">{r.employeeId ?? '-'}</td>
                <td className="p-1.5 font-mono">{r.accountId ?? '-'}</td>
                <td className="p-1.5 font-mono">{r.actorAccountId ?? '-'}</td>
                <td className="p-1.5">{r.detail ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
