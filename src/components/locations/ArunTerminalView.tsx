// src/components/locations/ArunTerminalView.tsx
"use client";

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import HeaderNavigation, { ArunSubTab } from '../HeaderNavigation';
import KpiSummaryStrip from '../KpiSummaryStrip';
import ArunFieldTable from '../ArunFieldTable';
import AuditModal from '../AuditModal';
import ArunLoadingCoqTab from './arun/ArunLoadingCoqTab';
import ArunLabSpecTab from './arun/ArunLabSpecTab';
import ArunMasterHistoryTab from './arun/ArunMasterHistoryTab';
import { useArunLogistics } from '../../hooks/useArunLogistics';

interface ArunTerminalViewProps {
  initialSubTab?: ArunSubTab | 'LOADING_COQ' | 'STAGING_YARD';
}

export default function ArunTerminalView({
  initialSubTab = 'OPERATIONS_YARD',
}: ArunTerminalViewProps) {
  const normalizedInitialTab: ArunSubTab =
    initialSubTab === 'LOADING_COQ'
      ? 'LOADING_COQ_ENTRY'
      : initialSubTab === 'STAGING_YARD'
      ? 'OPERATIONS_YARD'
      : initialSubTab;

  const {
    fleetTanks = [],
    certificateRecords = [],
    activeBatchRecords = [],
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
    addDeliveredMeasurement,
    stagedForLoadingTankNos,
    activeCandidateTankNo,
    selectedHeelAuditTankNo,
    setSelectedHeelAuditTankNo,
    toastMessage,
    triggerToast,
    tab1ReactiveKPIs,
  } = useArunLogistics(normalizedInitialTab);

  return (
    <div className="flex flex-col gap-4 w-full text-slate-900 font-bold pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#0a2558] border border-blue-400 text-white font-bold rounded-none shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono">{toastMessage}</span>
        </div>
      )}

      {/* Main Header & 4 Sub-Tabs Navigation */}
      <HeaderNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        certificateCount={certificateRecords?.length || 0}
      />

      {/* ==================================================================== */}
      {/* TAB 1: FIELD & HEEL (M/V Saviour Offload & Field Heel Staging Hub)    */}
      {/* ==================================================================== */}
      {activeTab === 'OPERATIONS_YARD' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top 4 SCADA KPI Cards (Deep Blue Header Strip & Soft Blue/White Text) - 100% Reactive */}
          <KpiSummaryStrip kpis={tab1ReactiveKPIs} />

          {/* Arun ISO Tank Condition Fleet Table */}
          <ArunFieldTable
            logisticsMode={logisticsMode}
            setLogisticsMode={setLogisticsMode}
            yardSearch={yardSearch}
            setYardSearch={setYardSearch}
            saviourCandidateTanks={saviourCandidateTanks || []}
            arunYardTanks={arunYardTanks || []}
            filteredYardTanks={filteredYardTanks || []}
            filteredSaviourTanks={filteredSaviourTanks || []}
            selectedYardTanks={selectedYardTanks || new Set()}
            selectedSaviourTanks={selectedSaviourTanks || new Set()}
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
      {/* TAB 2: LOADING & COQ CONSOLE (FULL-PAGE INTEGRATED CONSOLE)          */}
      {/* ==================================================================== */}
      {activeTab === 'LOADING_COQ_ENTRY' && (
        <ArunLoadingCoqTab
          onSuccessToast={triggerToast}
          activeBatchRecords={activeBatchRecords || []}
          addDeliveredMeasurement={addDeliveredMeasurement}
          activeCandidateTankNo={activeCandidateTankNo}
          stagedForLoadingTankNos={stagedForLoadingTankNos}
        />
      )}

      {/* ==================================================================== */}
      {/* TAB 3: LAB GAS SPECIFICATION (Quality & Molecular Archive)           */}
      {/* ==================================================================== */}
      {activeTab === 'LAB_COQ_SPEC' && <ArunLabSpecTab />}

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
