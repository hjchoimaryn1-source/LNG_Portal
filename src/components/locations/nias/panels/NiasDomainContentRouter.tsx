// src/components/locations/nias/panels/NiasDomainContentRouter.tsx
"use client";

import React from 'react';
import NiasTankOverviewTab from '../tabs/NiasTankOverviewTab';
import NiasLaydownLogTab from '../tabs/NiasLaydownLogTab';
import { NiasActiveBayWorkspace } from '../NiasActiveBayWorkspace';
import { NiasLd2BackhaulTab } from '../tabs/NiasLd2BackhaulTab';
import NiasTankMassBalanceTab from '../NiasTankMassBalanceTab';
import NiasProcessPIDDiagram from '../NiasProcessPIDDiagram';
import NiasPatrolLogTab from '../NiasPatrolLogTab';
import GasMeteringDailyTab from '../GasMeteringDailyTab';
import NiasMonthlyReportPlnEpiTab from '../monthlyReport/NiasMonthlyReportPlnEpiTab';
import { ElectricalSystemView } from '../../../../cmms-daily-ops/views/ElectricalSystemView';
import { DailyOpsOverviewView } from '../../../../cmms-daily-ops/views/DailyOpsOverviewView';
import type { NiasDomainContentRouterProps } from '../types/niasDomainContentRouter.types';

export default function NiasDomainContentRouter(props: NiasDomainContentRouterProps) {
  const { activeDomain, tankSubTab, regasSubTab } = props;

  return (
    <>
      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 1: 🌐 PURE 3-COLUMN VISUAL YARD MAP (DRAG & DROP)  */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'TANK_OVERVIEW' && (
        <NiasTankOverviewTab
          zoneStats={props.zoneStats}
          activeBays={props.activeBays}
          tankInventory={props.tankInventory}
          fleetTanks={props.fleetTanks}
          draggingTankNo={props.draggingTankNo}
          dragOverTarget={props.dragOverTarget}
          handleDragStart={props.handleDragStart}
          handleDragEnd={props.handleDragEnd}
          handleDragOver={props.handleDragOver}
          handleDragLeave={props.handleDragLeave}
          handleDrop={props.handleDrop}
          setSelectedDetailTank={props.setSelectedDetailTank}
          getRackTag={props.getRackTag}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB: 📥 DAILY INSPECTION & BOG LOG (WORKSHEET) —      */}
      {/* relocated from ISO_TANK_MGMT to REGAS_SYSTEM ("ISO TK - LOG",       */}
      {/* ISO Tank & Mass Balance relocation, 2026-09-18).                    */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'LAYDOWN_1_2_LOG' && (
        <NiasLaydownLogTab
          tankInventory={props.tankInventory}
          dailyMasterRecords={props.dailyMasterRecords}
          deletedRecordIds={props.deletedRecordIds}
          dateQueryMode={props.dateQueryMode}
          setDateQueryMode={props.setDateQueryMode}
          selectedDate={props.selectedDate}
          setSelectedDate={props.setSelectedDate}
          startDate={props.startDate}
          setStartDate={props.setStartDate}
          endDate={props.endDate}
          setEndDate={props.setEndDate}
          batchFilter={props.batchFilter}
          setBatchFilter={props.setBatchFilter}
          availableBatches={props.availableBatches}
          normalizeBatch={props.normalizeBatch}
          zoneFilter={props.zoneFilter}
          setZoneFilter={props.setZoneFilter}
          searchQuery={props.searchQuery}
          setSearchQuery={props.setSearchQuery}
          setToastMessage={props.setToastMessage}
          calcVolumeFromMmH2O={props.calcVolumeFromMmH2O}
          calcMassTonFromVolume={props.calcMassTonFromVolume}
          isQuickEntryOpen={props.isQuickEntryOpen}
          setIsQuickEntryOpen={props.setIsQuickEntryOpen}
          handleSaveQuickEntry={props.handleSaveQuickEntry}
          wsReportDate={props.wsReportDate}
          setWsReportDate={props.setWsReportDate}
          wsTankNo={props.wsTankNo}
          handleSelectTankForQuickEntry={props.handleSelectTankForQuickEntry}
          wsShipment={props.wsShipment}
          wsSelectedZone={props.wsSelectedZone}
          wsPressureMPa={props.wsPressureMPa}
          setWsPressureMPa={props.setWsPressureMPa}
          wsLevelMmH2O={props.wsLevelMmH2O}
          handleMmH2OChange={props.handleMmH2OChange}
          wsLevelM3={props.wsLevelM3}
          wsSmtPress={props.wsSmtPress}
          setWsSmtPress={props.setWsSmtPress}
          wsSmtLevel={props.wsSmtLevel}
          setWsSmtLevel={props.setWsSmtLevel}
          wsSmtTemp={props.wsSmtTemp}
          setWsSmtTemp={props.setWsSmtTemp}
          wsSmtBattery={props.wsSmtBattery}
          setWsSmtBattery={props.setWsSmtBattery}
          wsPressBefore={props.wsPressBefore}
          setWsPressBefore={props.setWsPressBefore}
          wsPressAfter={props.wsPressAfter}
          setWsPressAfter={props.setWsPressAfter}
          setWsBogVentedKg={props.setWsBogVentedKg}
          handleOpenTankTrendModal={props.handleOpenTankTrendModal}
          handleEditRow={props.handleEditRow}
          setRecordToDelete={props.setRecordToDelete}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 3: 🏷️ ACTIVE BAY MOUNTED TANKS                    */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'ACTIVE_BAY_TANKS' && (
        <NiasActiveBayWorkspace
          tankInventory={props.tankInventory}
          setTankInventory={props.setTankInventory}
          setMountModalBayId={props.setMountModalBayId}
          zoneStats={props.zoneStats}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 4: ORU ( LD - 2 ) - DUAL PANEL STAGING & BACKHAUL */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'LAYDOWN_3_HEEL' && (
        <NiasLd2BackhaulTab
          zoneStats={props.zoneStats}
          selectedBackhaulTanks={props.selectedBackhaulTanks}
          setSelectedBackhaulTanks={props.setSelectedBackhaulTanks}
          handleAuthorizeBackhaul={props.handleAuthorizeBackhaul}
          handleExportShippingReport={props.handleExportShippingReport}
          handleOpenLd2VentModal={props.handleOpenLd2VentModal}
          draggingTankNo={props.draggingTankNo}
          setDraggingTankNo={props.setDraggingTankNo}
          dragOverTarget={props.dragOverTarget}
          setDragOverTarget={props.setDragOverTarget}
          setToastMessage={props.setToastMessage}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 1: 1. PROCESS TELEMETRY                            */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'GAS_PROCESS_TELEMETRY' && (
        <div className="animate-in fade-in duration-200">
          <NiasProcessPIDDiagram />
        </div>
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 2: 🕓 4-HR PATROL LOG                              */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'PATROL_LOG' && (
        <NiasPatrolLogTab />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 3: 📊 GAS METERING (DAILY)                        */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'GAS_METERING_DAILY' && (
        <GasMeteringDailyTab />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB: ⚖️ ISO TANK MASS BALANCE — relocated from        */}
      {/* ISO_TANK_MGMT (ISO Tank & Mass Balance relocation, 2026-09-18).      */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'TANK_MASS_BALANCE' && (
        <NiasTankMassBalanceTab />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 4: ⚖️ MONTHLY REPORT (PLN EPI)                    */}
      {/* Legacy mock (NiasCustodySettlementTab.tsx) removed — rebuilt from    */}
      {/* the real 13-sheet workbook (Floboss P1-P8 + ISO Tank monthly).      */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'CUSTODY_HEAT_SETTLEMENT' && (
        <NiasMonthlyReportPlnEpiTab />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 5: ⚡ ELECTRICAL SYSTEM — relocated from top-level */}
      {/* tab bar into Regas & Gas Process (2026-09-18 correction).            */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'ELECTRICAL_SYSTEM' && (
        <ElectricalSystemView />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 6: 📋 DAILY OPS OVERVIEW — relocated from         */}
      {/* top-level tab bar into Regas & Gas Process (2026-09-18 correction);  */}
      {/* sidebar dual-access entry is unaffected by this move.                */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'DAILY_OPS_OVERVIEW' && (
        <DailyOpsOverviewView />
      )}
    </>
  );
}
