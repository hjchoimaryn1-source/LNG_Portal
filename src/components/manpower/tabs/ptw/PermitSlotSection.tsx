// src/components/manpower/tabs/ptw/PermitSlotSection.tsx
"use client";

import React, { useState } from 'react';
import { PTWPermit } from '../../../../types/lng';
import PermitRow from './PermitRow';
import type { PermitSuspensionRow } from '../../../../adapters/db/permitSuspensionDao';

export interface PermitSlotSectionProps {
  title: string;
  permits: PTWPermit[]; // already top-level filtered (type/status/search) by the parent
  predicate: (permit: PTWPermit) => boolean;
  selectedPermitId: string;
  onSelectPermit: (permitId: string) => void;
  defaultCollapsed?: boolean;
  // CMMS_Architecture.md §5.3 suspension state, keyed by permitId. Optional —
  // omitted renders exactly as before (no badges).
  suspendedByPermit?: Map<string, PermitSuspensionRow>;
}

export default function PermitSlotSection({
  title,
  permits,
  predicate,
  selectedPermitId,
  onSelectPermit,
  defaultCollapsed = false,
  suspendedByPermit,
}: PermitSlotSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const slotPermits = permits.filter(predicate);

  return (
    <div className="border border-slate-300 rounded-none">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full h-7 px-2 font-mono text-xs font-bold tracking-wider text-white bg-[#2A3B4C] flex items-center justify-between text-center cursor-pointer border border-[#2A3B4C]"
      >
        <span className="w-6" />
        <span className="flex-1 text-center font-bold tracking-wider">
          {title} ({slotPermits.length})
        </span>
        <span className="w-6 text-right text-slate-300">{isExpanded ? '[-]' : '[+]'}</span>
      </button>

      {isExpanded && (
        <table className="table-fixed w-full overflow-x-hidden border-collapse font-mono text-xs">
          <thead className="bg-[#8A9EA7] text-slate-900 font-bold text-xs uppercase tracking-wider border-b-2 border-white">
            <tr>
              <th className="w-14 text-center py-1 px-1 border border-white">TYPE</th>
              <th className="w-24 text-center py-1 px-1 border border-white">TAG NO</th>
              <th className="w-12 text-center py-1 px-1 border border-white">SAFE</th>
              <th className="text-center py-1 px-1.5 border border-white">TASK</th>
              <th className="w-24 text-center py-1 px-1 border border-white">LEADER</th>
            </tr>
          </thead>
          <tbody>
            {slotPermits.map((permit, index) => (
              <PermitRow
                key={permit.id}
                permit={permit}
                isSelected={selectedPermitId === permit.id}
                rowIndex={index}
                onSelect={onSelectPermit}
                suspension={suspendedByPermit?.get(permit.id)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
