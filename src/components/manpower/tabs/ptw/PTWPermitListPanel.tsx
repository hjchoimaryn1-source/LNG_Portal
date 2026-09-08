// src/components/manpower/tabs/ptw/PTWPermitListPanel.tsx
"use client";

import React from 'react';
import { PTWPermit, PTWWorkflowStatus } from '../../../../types/lng';
import PermitTicketCard from './PermitTicketCard';

export interface PTWPermitListPanelProps {
  permits: PTWPermit[];
  selectedPermitId: string;
  searchQuery?: string;
  selectedStatusFilter?: PTWWorkflowStatus | 'ALL';
  onSearchQueryChange?: (query: string) => void;
  onStatusFilterChange?: (status: PTWWorkflowStatus | 'ALL') => void;
  onSelectPermit: (permitId: string) => void;
}

export default function PTWPermitListPanel({
  permits,
  selectedPermitId,
  onSelectPermit,
}: PTWPermitListPanelProps) {
  return (
    <div className="lg:col-span-5">
      {/* Permit List Cards */}
      <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
        {permits.map((permit) => (
          <PermitTicketCard
            key={permit.id}
            permit={permit}
            isSelected={selectedPermitId === permit.id}
            onSelect={onSelectPermit}
          />
        ))}
      </div>
    </div>
  );
}
