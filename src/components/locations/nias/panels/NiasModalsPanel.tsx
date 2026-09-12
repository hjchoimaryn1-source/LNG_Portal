// src/components/locations/nias/panels/NiasModalsPanel.tsx
import React from 'react';
import { ActiveBayState, DailyMasterRecord, DefectCategory, FleetTankItem } from '../../../../types/lng';
import type { PortalDataContextType } from '../../../../context/PortalDataContext';
import { NiasTankAsset, NiasTankSubTab } from '../../NiasTerminalView';
import { NiasQuickMountModal } from '../modals/NiasQuickMountModal';
import { NiasBayMountModal } from '../modals/NiasBayMountModal';
import { NiasMroModal } from '../modals/NiasMroModal';
import NiasLd2StatusModal from '../modals/NiasLd2StatusModal';
import NiasBackhaulInspectionModal from '../modals/NiasBackhaulInspectionModal';
import { NiasTankRelocationDrawer } from '../drawers/NiasTankRelocationDrawer';
import { NiasTankDetailModal } from '../modals/NiasTankDetailModal';
import NiasDeleteConfirmModal, { DeleteRecord } from '../modals/NiasDeleteConfirmModal';
import { NiasTankTrendModal } from '../modals/NiasTankTrendModal';

export interface NiasModalsPanelProps {
  // Shared handlers from PortalDataContext
  activeBays: ActiveBayState[];
  mountTankToBay: PortalDataContextType['mountTankToBay'];
  unmountBay: PortalDataContextType['unmountBay'];
  moveTankLocation: PortalDataContextType['moveTankLocation'];
  setToastMessage: (msg: string | null) => void;

  // Quick Mount from Table Action Modal
  quickMountTankNo: string | null;
  setQuickMountTankNo: React.Dispatch<React.SetStateAction<string | null>>;

  // Mount Modal (From Bay card)
  mountModalBayId: string | null;
  setMountModalBayId: React.Dispatch<React.SetStateAction<string | null>>;
  allLaydownTanks: NiasTankAsset[];

  // Quick MRO Modal
  mroModalTankNo: string | null;
  setMroModalTankNo: React.Dispatch<React.SetStateAction<string | null>>;
  defectCat: DefectCategory;
  setDefectCat: React.Dispatch<React.SetStateAction<DefectCategory>>;
  defectDesc: string;
  setDefectDesc: React.Dispatch<React.SetStateAction<string>>;
  handleMroSubmit: (e: React.FormEvent) => void;

  // LD-2 Tank Status & BOG Vent Dialog Modal
  ld2VentModalTank: NiasTankAsset | null;
  setLd2VentModalTank: React.Dispatch<React.SetStateAction<NiasTankAsset | null>>;
  handleSaveLd2VentLog: (e: React.FormEvent) => void;
  ld2ModalPress: number;
  ld2ModalTemp: number;
  ld2ModalLevelMm: number;
  ld2ModalIsVenting: boolean;
  ld2ModalPreVentPress: number;
  ld2ModalPostVentPress: number;
  ld2ModalVentKg: number;
  ld2ModalRemarks: string;
  ld2ModalOperator: string;
  setLd2ModalPress: React.Dispatch<React.SetStateAction<number>>;
  setLd2ModalTemp: React.Dispatch<React.SetStateAction<number>>;
  setLd2ModalLevelMm: React.Dispatch<React.SetStateAction<number>>;
  setLd2ModalIsVenting: React.Dispatch<React.SetStateAction<boolean>>;
  setLd2ModalPreVentPress: React.Dispatch<React.SetStateAction<number>>;
  setLd2ModalPostVentPress: React.Dispatch<React.SetStateAction<number>>;
  setLd2ModalVentKg: React.Dispatch<React.SetStateAction<number>>;
  setLd2ModalRemarks: React.Dispatch<React.SetStateAction<string>>;
  setLd2ModalOperator: React.Dispatch<React.SetStateAction<string>>;

  // Stage 2: Pre-Backhaul Departure Inspection Modal
  isBackhaulModalOpen: boolean;
  setIsBackhaulModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleBackhaulModalSubmit: (e: React.FormEvent) => void;
  selectedBackhaulTanks: Set<string>;
  stage2ManifestNo: string;
  stage2VesselName: string;
  stage2Date: string;
  stage2MassKg: number;
  stage2PressureMPa: number;
  stage2TempC: number;
  stage2ValvesSealed: boolean;
  stage2PressureWithinLimit: boolean;
  stage2VacuumIntact: boolean;
  stage2Remarks: string;
  setStage2ManifestNo: React.Dispatch<React.SetStateAction<string>>;
  setStage2VesselName: React.Dispatch<React.SetStateAction<string>>;
  setStage2Date: React.Dispatch<React.SetStateAction<string>>;
  setStage2MassKg: React.Dispatch<React.SetStateAction<number>>;
  setStage2PressureMPa: React.Dispatch<React.SetStateAction<number>>;
  setStage2TempC: React.Dispatch<React.SetStateAction<number>>;
  setStage2ValvesSealed: React.Dispatch<React.SetStateAction<boolean>>;
  setStage2PressureWithinLimit: React.Dispatch<React.SetStateAction<boolean>>;
  setStage2VacuumIntact: React.Dispatch<React.SetStateAction<boolean>>;
  setStage2Remarks: React.Dispatch<React.SetStateAction<string>>;

  // Method A: Interactive Tank Relocation Modal / Drawer
  relocateModalTank: FleetTankItem | null;
  setRelocateModalTank: React.Dispatch<React.SetStateAction<FleetTankItem | null>>;
  handleConfirmRelocation: (data: {
    tankNo: string;
    origin: string;
    targetZone: string;
    slotNumber: number;
    heelPct: number;
    heelPressMPa: number;
    heelTempC: number;
    heelWeightKg: number;
    remarks: string;
  }) => void;

  // Tank Detail & State SCADA Modal
  selectedDetailTank: NiasTankAsset | null;
  setSelectedDetailTank: React.Dispatch<React.SetStateAction<NiasTankAsset | null>>;
  getRackTag: (bayId: string) => string;
  tankInventory: NiasTankAsset[];
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
  setTankSubTab: React.Dispatch<React.SetStateAction<NiasTankSubTab>>;

  // Delete Confirmation Modal for Tab 2 Master Log
  recordToDelete: DeleteRecord | null;
  setRecordToDelete: React.Dispatch<React.SetStateAction<DeleteRecord | null>>;
  handleConfirmDeleteRecord: () => void;

  // Large Screen SCADA Console: Historical Telemetry Trend Analytics Modal
  trendModalTankNo: string | null;
  setTrendModalTankNo: React.Dispatch<React.SetStateAction<string | null>>;
  dailyMasterRecords: DailyMasterRecord[];
}

/**
 * Always-mounted modal / drawer wiring for the Nias Terminal domain (Quick
 * Mount, Bay Mount, MRO, LD-2 BOG Vent, Pre-Backhaul Inspection, Tank
 * Relocation, Tank Detail, Delete Confirmation, Tank Trend).
 * Pure presentational panel — extracted verbatim from NiasTerminalView
 * (lines 1227-1366).
 */
export default function NiasModalsPanel({
  activeBays,
  mountTankToBay,
  unmountBay,
  moveTankLocation,
  setToastMessage,
  quickMountTankNo,
  setQuickMountTankNo,
  mountModalBayId,
  setMountModalBayId,
  allLaydownTanks,
  mroModalTankNo,
  setMroModalTankNo,
  defectCat,
  setDefectCat,
  defectDesc,
  setDefectDesc,
  handleMroSubmit,
  ld2VentModalTank,
  setLd2VentModalTank,
  handleSaveLd2VentLog,
  ld2ModalPress,
  ld2ModalTemp,
  ld2ModalLevelMm,
  ld2ModalIsVenting,
  ld2ModalPreVentPress,
  ld2ModalPostVentPress,
  ld2ModalVentKg,
  ld2ModalRemarks,
  ld2ModalOperator,
  setLd2ModalPress,
  setLd2ModalTemp,
  setLd2ModalLevelMm,
  setLd2ModalIsVenting,
  setLd2ModalPreVentPress,
  setLd2ModalPostVentPress,
  setLd2ModalVentKg,
  setLd2ModalRemarks,
  setLd2ModalOperator,
  isBackhaulModalOpen,
  setIsBackhaulModalOpen,
  handleBackhaulModalSubmit,
  selectedBackhaulTanks,
  stage2ManifestNo,
  stage2VesselName,
  stage2Date,
  stage2MassKg,
  stage2PressureMPa,
  stage2TempC,
  stage2ValvesSealed,
  stage2PressureWithinLimit,
  stage2VacuumIntact,
  stage2Remarks,
  setStage2ManifestNo,
  setStage2VesselName,
  setStage2Date,
  setStage2MassKg,
  setStage2PressureMPa,
  setStage2TempC,
  setStage2ValvesSealed,
  setStage2PressureWithinLimit,
  setStage2VacuumIntact,
  setStage2Remarks,
  relocateModalTank,
  setRelocateModalTank,
  handleConfirmRelocation,
  selectedDetailTank,
  setSelectedDetailTank,
  getRackTag,
  tankInventory,
  setTankInventory,
  setTankSubTab,
  recordToDelete,
  setRecordToDelete,
  handleConfirmDeleteRecord,
  trendModalTankNo,
  setTrendModalTankNo,
  dailyMasterRecords,
}: NiasModalsPanelProps) {
  return (
    <>
      {/* Quick Mount from Table Action Modal */}
      <NiasQuickMountModal
        tankNo={quickMountTankNo}
        activeBays={activeBays}
        onMount={(bayId, tankNo) => {
          mountTankToBay(bayId, tankNo);
          setQuickMountTankNo(null);
          setToastMessage(`Mounted ${tankNo} to ${bayId}`);
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onClose={() => setQuickMountTankNo(null)}
      />

      {/* Mount Modal (From Bay card) */}
      <NiasBayMountModal
        isOpen={Boolean(mountModalBayId)}
        bayId={mountModalBayId}
        availableTanks={allLaydownTanks}
        onMount={(bayId, tankId) => mountTankToBay(bayId, tankId)}
        onClose={() => setMountModalBayId(null)}
      />

      {/* Quick MRO Modal */}
      <NiasMroModal
        isOpen={Boolean(mroModalTankNo)}
        tankNo={mroModalTankNo}
        defectCat={defectCat}
        setDefectCat={setDefectCat}
        defectDesc={defectDesc}
        setDefectDesc={setDefectDesc}
        onSubmit={handleMroSubmit}
        onClose={() => setMroModalTankNo(null)}
      />

      {/* ==================================================================== */}
      {/* LD-2 TANK STATUS & BOG VENT DIALOG MODAL (WIDTH: 800px)              */}
      {/* ==================================================================== */}
      {ld2VentModalTank && (
        <NiasLd2StatusModal
          tank={ld2VentModalTank}
          onClose={() => setLd2VentModalTank(null)}
          onSubmit={handleSaveLd2VentLog}
          ld2ModalPress={ld2ModalPress}
          ld2ModalTemp={ld2ModalTemp}
          ld2ModalLevelMm={ld2ModalLevelMm}
          ld2ModalIsVenting={ld2ModalIsVenting}
          ld2ModalPreVentPress={ld2ModalPreVentPress}
          ld2ModalPostVentPress={ld2ModalPostVentPress}
          ld2ModalVentKg={ld2ModalVentKg}
          ld2ModalRemarks={ld2ModalRemarks}
          ld2ModalOperator={ld2ModalOperator}
          onPressChange={setLd2ModalPress}
          onTempChange={setLd2ModalTemp}
          onLevelMmChange={setLd2ModalLevelMm}
          onIsVentingChange={setLd2ModalIsVenting}
          onPreVentPressChange={setLd2ModalPreVentPress}
          onPostVentPressChange={setLd2ModalPostVentPress}
          onVentKgChange={setLd2ModalVentKg}
          onRemarksChange={setLd2ModalRemarks}
          onOperatorChange={setLd2ModalOperator}
        />
      )}

      {/* STAGE 1 MODAL REMOVED - NOW INTEGRATED AS DRAWER */}

      {/* ==================================================================== */}
      {/* STAGE 2: PRE-BACKHAUL DEPARTURE INSPECTION MODAL (Laydown 3 -> Ship) */}
      {/* ==================================================================== */}
      <NiasBackhaulInspectionModal
        isOpen={isBackhaulModalOpen}
        onClose={() => setIsBackhaulModalOpen(false)}
        onSubmit={handleBackhaulModalSubmit}
        selectedBackhaulTanks={selectedBackhaulTanks}
        stage2ManifestNo={stage2ManifestNo}
        stage2VesselName={stage2VesselName}
        stage2Date={stage2Date}
        stage2MassKg={stage2MassKg}
        stage2PressureMPa={stage2PressureMPa}
        stage2TempC={stage2TempC}
        stage2ValvesSealed={stage2ValvesSealed}
        stage2PressureWithinLimit={stage2PressureWithinLimit}
        stage2VacuumIntact={stage2VacuumIntact}
        stage2Remarks={stage2Remarks}
        onManifestNoChange={setStage2ManifestNo}
        onVesselNameChange={setStage2VesselName}
        onDateChange={setStage2Date}
        onMassKgChange={setStage2MassKg}
        onPressureMPaChange={setStage2PressureMPa}
        onTempCChange={setStage2TempC}
        onValvesSealedChange={setStage2ValvesSealed}
        onPressureWithinLimitChange={setStage2PressureWithinLimit}
        onVacuumIntactChange={setStage2VacuumIntact}
        onRemarksChange={setStage2Remarks}
      />

      {/* ==================================================================== */}
      {/* METHOD A: INTERACTIVE TANK RELOCATION MODAL / DRAWER (Move Tank)     */}
      {/* ==================================================================== */}
      <NiasTankRelocationDrawer
        tank={relocateModalTank}
        onClose={() => setRelocateModalTank(null)}
        onConfirm={handleConfirmRelocation}
      />

      {/* ========================================================================= */}
      {/* TANK DETAIL & STATE SCADA MODAL (PAGT/NIAS SCADA NAVY/BEIGE WINDOW THEME)  */}
      {/* ========================================================================= */}
      <NiasTankDetailModal
        tank={selectedDetailTank}
        onClose={() => setSelectedDetailTank(null)}
        activeBays={activeBays}
        getRackTag={getRackTag}
        tankInventory={tankInventory}
        setTankInventory={setTankInventory}
        unmountBay={unmountBay}
        mountTankToBay={mountTankToBay}
        moveTankLocation={moveTankLocation}
        setToastMessage={setToastMessage}
        onNavigateToSkid={() => setTankSubTab('ACTIVE_BAY_TANKS')}
        setSelectedDetailTank={setSelectedDetailTank}
      />

      {/* Delete Confirmation Modal for Tab 2 Master Log */}
      {recordToDelete && (
        <NiasDeleteConfirmModal
          recordToDelete={recordToDelete}
          onClose={() => setRecordToDelete(null)}
          onConfirm={handleConfirmDeleteRecord}
        />
      )}

      {/* ==================================================================== */}
      {/* LARGE SCREEN SCADA CONSOLE: HISTORICAL TELEMETRY TREND ANALYTICS MODAL */}
      {/* ==================================================================== */}
      <NiasTankTrendModal
        tankNo={trendModalTankNo}
        onClose={() => setTrendModalTankNo(null)}
        dailyMasterRecords={dailyMasterRecords}
        tankInventory={tankInventory}
      />
    </>
  );
}
