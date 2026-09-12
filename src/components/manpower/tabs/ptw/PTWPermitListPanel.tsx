// src/components/manpower/tabs/ptw/PTWPermitListPanel.tsx
"use client";

import React from 'react';
import { PTWPermit, PTWWorkflowStatus } from '../../../../types/lng';
import PermitSlotSection from './PermitSlotSection';
import type { PermitSuspensionRow } from '../../../../adapters/db/permitSuspensionDao';

export interface PTWPermitListPanelProps {
  permits: PTWPermit[];
  selectedPermitId: string;
  searchQuery?: string;
  selectedStatusFilter?: PTWWorkflowStatus | 'ALL';
  onSearchQueryChange?: (query: string) => void;
  onStatusFilterChange?: (status: PTWWorkflowStatus | 'ALL') => void;
  onSelectPermit: (permitId: string) => void;
  // CMMS_Architecture.md §5.3 suspension state, keyed by permitId. Optional —
  // omitted renders exactly as before (no badges).
  suspendedByPermit?: Map<string, PermitSuspensionRow>;
}

export default function PTWPermitListPanel({
  permits,
  selectedPermitId,
  onSelectPermit,
  suspendedByPermit,
}: PTWPermitListPanelProps) {
  return (
    <div className="lg:col-span-5 bg-neutral-200/60 border border-neutral-400 p-2 space-y-2 rounded-none font-mono">
      <div className="space-y-1.5 max-h-[640px] overflow-y-auto overflow-x-hidden">
        {/* 1. DRAFT / SUBMISSION */}
        <PermitSlotSection
          title="DRAFT / SUBMISSION"
          permits={permits}
          predicate={(p) => p.status === 'DRAFT'}
          selectedPermitId={selectedPermitId}
          onSelectPermit={onSelectPermit}
          suspendedByPermit={suspendedByPermit}
        />

        {/* 2. PREPARED */}
        <PermitSlotSection
          title="PREPARED"
          permits={permits}
          predicate={(p) => p.status === 'PREPARED'}
          selectedPermitId={selectedPermitId}
          onSelectPermit={onSelectPermit}
          suspendedByPermit={suspendedByPermit}
        />

        {/* 3. APPROVED */}
        <PermitSlotSection
          title="APPROVED"
          permits={permits}
          predicate={(p) => p.status === 'APPROVED'}
          selectedPermitId={selectedPermitId}
          onSelectPermit={onSelectPermit}
          suspendedByPermit={suspendedByPermit}
        />

        {/* 4. ACTIVE PERMITS */}
        <PermitSlotSection
          title="ACTIVE PERMITS"
          permits={permits}
          predicate={(p) => p.status === 'ACTIVE'}
          selectedPermitId={selectedPermitId}
          onSelectPermit={onSelectPermit}
          suspendedByPermit={suspendedByPermit}
        />

        {/* 5. CLOSED / ARCHIVED */}
        <PermitSlotSection
          title="CLOSED / ARCHIVED"
          permits={permits}
          predicate={(p) => p.status === 'CLOSED'}
          selectedPermitId={selectedPermitId}
          onSelectPermit={onSelectPermit}
          suspendedByPermit={suspendedByPermit}
          defaultCollapsed
        />
      </div>
    </div>
  );
}
