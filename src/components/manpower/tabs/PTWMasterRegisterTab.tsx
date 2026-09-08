// src/components/manpower/tabs/PTWMasterRegisterTab.tsx
"use client";

import React, { useMemo, useState } from 'react';
import { PTWWorkflowStatus, StaffPersonnel } from '../../../types/lng';
import { usePTWPermits } from '../hooks/usePTWPermits';
import CargoHandlingPermitForm from '../cargoHandling/CargoHandlingPermitForm';
import NewPTWPermitModal from '../modals/NewPTWPermitModal';
import PTWSummaryBar from './ptw/PTWSummaryBar';
import PTWTypeFilterStrip, { PTWCategoryFilter } from './ptw/PTWTypeFilterStrip';
import PTWPermitListPanel from './ptw/PTWPermitListPanel';
import PTWPermitDetailPanel from './ptw/PTWPermitDetailPanel';

export interface PTWMasterRegisterTabProps {
  personnelList: StaffPersonnel[];
  isERTMet: boolean;
  onNavigateToMatrix?: (empId: string) => void;
}

export default function PTWMasterRegisterTab({ personnelList, isERTMet, onNavigateToMatrix }: PTWMasterRegisterTabProps) {
  const { permits, addPermit, updateGasReadings, transitionStatus, stats } = usePTWPermits();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<PTWCategoryFilter>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<PTWWorkflowStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPermitId, setSelectedPermitId] = useState<string>(permits[0]?.id || '');

  const [isNewPermitModalOpen, setIsNewPermitModalOpen] = useState<boolean>(false);
  const [isCargoHandlingModalOpen, setIsCargoHandlingModalOpen] = useState<boolean>(false);

  const activePermit = useMemo(
    () => permits.find((p) => p.id === selectedPermitId) || permits[0] || null,
    [permits, selectedPermitId]
  );

  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      const matchType =
        selectedTypeFilter === 'ALL' ||
        (selectedTypeFilter === 'LIFTING'
          ? p.type === 'CARGO_HANDLING' && p.cargoHandling?.activityType === 'LIFTING'
          : p.type === selectedTypeFilter);
      const matchStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.formNumber.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.workLeaderName.toLowerCase().includes(q);
      return matchType && matchStatus && matchQuery;
    });
  }, [permits, selectedTypeFilter, selectedStatusFilter, searchQuery]);

  return (
    <div className="space-y-3 font-sans">
      <div className="bg-[#d4d0c8] border border-t-white border-l-white border-b-neutral-500 border-r-neutral-500 shadow-sm p-2 space-y-2 rounded-none">
        <PTWSummaryBar
          totalPermits={stats.total}
          activeCount={stats.activeCount}
          isERTMet={isERTMet}
          onOpenNewPermitModal={() => setIsNewPermitModalOpen(true)}
          onOpenCargoHandlingModal={() => setIsCargoHandlingModalOpen(true)}
        />

        <PTWTypeFilterStrip permits={permits} selectedTypeFilter={selectedTypeFilter} onSelectTypeFilter={setSelectedTypeFilter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <PTWPermitListPanel
          permits={filteredPermits}
          selectedPermitId={selectedPermitId}
          searchQuery={searchQuery}
          selectedStatusFilter={selectedStatusFilter}
          onSearchQueryChange={setSearchQuery}
          onStatusFilterChange={setSelectedStatusFilter}
          onSelectPermit={setSelectedPermitId}
        />

        <PTWPermitDetailPanel
          activePermit={activePermit}
          personnelList={personnelList}
          isERTMet={isERTMet}
          onNavigateToMatrix={onNavigateToMatrix}
          onUpdateGasReadings={updateGasReadings}
          onTransitionStatus={(permitId, nextStatus) => transitionStatus(permitId, nextStatus, isERTMet)}
        />
      </div>

      <NewPTWPermitModal
        isOpen={isNewPermitModalOpen}
        onClose={() => setIsNewPermitModalOpen(false)}
        personnelList={personnelList}
        sequenceNumber={permits.length + 1}
        onSubmitSuccess={(newPermit) => {
          addPermit(newPermit);
          setSelectedPermitId(newPermit.id);
        }}
      />

      <CargoHandlingPermitForm
        isOpen={isCargoHandlingModalOpen}
        onClose={() => setIsCargoHandlingModalOpen(false)}
        sequenceNumber={permits.length + 1}
        onSubmitSuccess={(newPermit) => {
          addPermit(newPermit);
          setSelectedPermitId(newPermit.id);
          setIsCargoHandlingModalOpen(false);
        }}
      />
    </div>
  );
}
