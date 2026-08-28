// src/components/locations/ArunTerminalView.tsx
"use client";

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import HeaderNavigation, { ArunSubTab } from '../HeaderNavigation';
import KpiSummaryStrip from '../KpiSummaryStrip';
import ArunFieldTable from '../ArunFieldTable';
import AuditModal from '../AuditModal';
import ArunCustodyCoqTab from './arun/ArunCustodyCoqTab';
import ArunLoadingTab from './arun/ArunLoadingTab';
import ArunMasterHistoryTab from './arun/ArunMasterHistoryTab';
import { useArunLogistics } from '../../hooks/useArunLogistics';

interface ArunTerminalViewProps {
  initialSubTab?: ArunSubTab | 'LOADING_COQ' | 'STAGING_YARD';
  onNavigateToSaviourModule?: () => void;
}

export default function ArunTerminalView({
  initialSubTab = 'OPERATIONS_YARD',
  onNavigateToSaviourModule,
}: ArunTerminalViewProps) {
  const normalizedInitialTab: ArunSubTab =
    initialSubTab === 'LOADING_COQ'
      ? 'CUSTODY_COQ'
      : initialSubTab === 'STAGING_YARD'
      ? 'OPERATIONS_YARD'
      : initialSubTab;

  const {
    fleetTanks = [],
    certificateRecords = [],
    activeBatchRecords = [],
    setActiveBatchRecords,
    tab3LoadingRecords = [],
    setTab3LoadingRecords,
    handleTransferTab2ToTab3,
    activeTab,
    setActiveTab,
    logisticsMode,
    setLogisticsMode,
    yardSearch,
    setYardSearch,
    saviourCandidateTanks = [],
    arunYardTanks = [],
    filteredYardTanks = [],
    filteredSaviourTanks = [],
    selectedYardTanks = new Set(),
    selectedSaviourTanks = new Set(),
    toggleSelectYardTank,
    toggleSelectSaviourTank,
    selectAllYard,
    selectAllSaviour,
    handleDischargeToArunYard,
    handleProceedToLoad,
    selectedHeelAuditTankNo,
    setSelectedHeelAuditTankNo,
    triggerToast,
    stagedForLoadingTankNos,
    activeCandidateTankNo,
    addDeliveredMeasurement,
    tab1ReactiveKPIs,
  } = useArunLogistics(normalizedInitialTab);

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 w-full text-slate-900 font-bold overflow-hidden select-none">
      {/* Sub-Tab Navigation Strip */}
      <HeaderNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        certificateCount={certificateRecords.length + activeBatchRecords.length}
      />

      {/* KPI Summary Strip: field-only heel metrics */}
      {activeTab === 'OPERATIONS_YARD' && <KpiSummaryStrip kpis={tab1ReactiveKPIs} />}

      {/* ==================================================================== */}
      {/* TAB 1: FIELD & HEEL YARD MANAGEMENT                                  */}
      {/* ==================================================================== */}
      {activeTab === 'OPERATIONS_YARD' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ArunFieldTable
            logisticsMode={logisticsMode}
            setLogisticsMode={setLogisticsMode}
            yardSearch={yardSearch}
            setYardSearch={setYardSearch}
            saviourCandidateTanks={saviourCandidateTanks}
            arunYardTanks={arunYardTanks}
            filteredYardTanks={filteredYardTanks}
            filteredSaviourTanks={filteredSaviourTanks}
            selectedYardTanks={selectedYardTanks}
            selectedSaviourTanks={selectedSaviourTanks}
            toggleSelectYardTank={toggleSelectYardTank}
            toggleSelectSaviourTank={toggleSelectSaviourTank}
            selectAllYard={selectAllYard}
            selectAllSaviour={selectAllSaviour}
            handleDischargeToArunYard={handleDischargeToArunYard}
            onProceedToLoad={handleProceedToLoad}
            setSelectedHeelAuditTankNo={setSelectedHeelAuditTankNo}
            activeBatchRecords={activeBatchRecords || []}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CUSTODY & COQ CONSOLE (WEIGHBRIDGE & LAB GC CERTIFICATION)    */}
      {/* ==================================================================== */}
      {(activeTab === 'CUSTODY_COQ' || activeTab === 'LOADING_COQ_ENTRY') && (
        <ArunCustodyCoqTab
          onSuccessToast={triggerToast}
          activeBatchRecords={activeBatchRecords || []}
          setActiveBatchRecords={setActiveBatchRecords}
          addDeliveredMeasurement={addDeliveredMeasurement}
          activeCandidateTankNo={activeCandidateTankNo}
          stagedForLoadingTankNos={stagedForLoadingTankNos}
          onProceedToLoading={handleTransferTab2ToTab3}
          onProceedToVesselStowage={handleTransferTab2ToTab3}
        />
      )}

      {/* ==================================================================== */}
      {/* TAB 3: LOADING (MV. SAVIOUR VESSEL DECK LOADING & MANIFEST CONSOLE)  */}
      {/* ==================================================================== */}
      {(activeTab === 'VESSEL_LOADING' ||
        activeTab === 'SAVIOR_STOWAGE' ||
        activeTab === 'ARUN_DISPATCH' ||
        activeTab === 'LAB_COQ_SPEC') && (
        <ArunLoadingTab
          activeBatchRecords={tab3LoadingRecords || []}
          setActiveBatchRecords={setTab3LoadingRecords}
          onSuccessToast={triggerToast}
          onNavigateToLedger={() => {
            setActiveTab('MASTER_HISTORY_SHEET');
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* TAB 4: MASTER CUSTODY LEDGER (Dual-Mode: Custody Energy / Calib)      */}
      {/* ==================================================================== */}
      {activeTab === 'MASTER_HISTORY_SHEET' && <ArunMasterHistoryTab />}

      {/* ========================================================================= */}
      {/* HEEL PRESERVATION & TRANSIT AUDIT MODAL (LARGE SCADA INSPECTION CONSOLE)  */}
      {/* ========================================================================= */}
      <AuditModal
        tankNo={selectedHeelAuditTankNo}
        onClose={() => setSelectedHeelAuditTankNo(null)}
        fleetTanks={fleetTanks || []}
      />
    </div>
  );
}
