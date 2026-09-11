// src/components/manpower/tabs/PTWMasterRegisterTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { PTWWorkflowStatus, StaffPersonnel } from '../../../types/lng';
import { usePTWPermitsContext } from '../../../context/PTWPermitsProvider';
import { useCargoHandlingLifecycle } from '../cargoHandling/hooks/useCargoHandlingLifecycle';
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
  focusId?: string;
}

export default function PTWMasterRegisterTab({ personnelList, isERTMet, onNavigateToMatrix, focusId }: PTWMasterRegisterTabProps) {
  const { permits, setPermits, addPermit, updateGasReadings, addGasTestLogEntry, addSignature, transitionStatus, persistStatusChange, stats } = usePTWPermitsContext();
  const { transitionCargoHandlingStatus } = useCargoHandlingLifecycle(permits, setPermits, persistStatusChange);

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<PTWCategoryFilter>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<PTWWorkflowStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPermitId, setSelectedPermitId] = useState<string>(permits[0]?.id || '');

  const [isNewPermitModalOpen, setIsNewPermitModalOpen] = useState<boolean>(false);
  const [isCargoHandlingModalOpen, setIsCargoHandlingModalOpen] = useState<boolean>(false);

  // Overview 대시보드 패널(PendingApprovalsPanel 등)에서 focusId로 딥링크한 경우,
  // 해당 permit을 자동 선택해 list 하이라이트 + detail panel을 함께 띄운다.
  useEffect(() => {
    if (!focusId) return;
    if (permits.some((p) => p.id === focusId)) {
      setSelectedPermitId(focusId);
    }
  }, [focusId, permits]);

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
          allPermits={permits}
          personnelList={personnelList}
          isERTMet={isERTMet}
          onNavigateToMatrix={onNavigateToMatrix}
          onUpdateGasReadings={updateGasReadings}
          onAddGasTestLogEntry={addGasTestLogEntry}
          onAddSignature={addSignature}
          onTransitionStatus={(permitId, nextStatus) => {
            const target = permits.find((p) => p.id === permitId);
            if (target?.type === 'CARGO_HANDLING') {
              transitionCargoHandlingStatus(permitId, nextStatus);
            } else {
              transitionStatus(permitId, nextStatus, isERTMet);
            }
          }}
        />
      </div>

      <NewPTWPermitModal
        isOpen={isNewPermitModalOpen}
        onClose={() => setIsNewPermitModalOpen(false)}
        personnelList={personnelList}
        sequenceNumber={permits.length + 1}
        activePermits={permits}
        onSubmitSuccess={(newPermit, cmmsMeta) => {
          addPermit(newPermit);
          setSelectedPermitId(newPermit.id);
          // TODO(cmms-permit-lock-state): persist cmmsMeta to permit_lock_state
          // once src/db has a real client (see src/db/schema/cmms_schema.sql).
          console.info(`[CMMS] permit_lock_state baseline for ${newPermit.id}:`, cmmsMeta);
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
