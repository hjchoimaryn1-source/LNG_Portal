// src/components/locations/nias/types/niasDomainContentRouter.types.ts
import type React from 'react';
import type { ActiveBayState, DailyMasterRecord, FleetTankItem } from '@/types/lng';
import type { NiasDomain, NiasTankAsset, NiasTankSubTab, NiasRegasSubTab } from '../../NiasTerminalView';
import type { NiasTankOverviewTabProps } from '../tabs/NiasTankOverviewTab';
import type { NiasLaydownLogTabProps } from '../tabs/NiasLaydownLogTab';

export interface NiasDomainContentRouterProps {
  activeDomain: NiasDomain;
  tankSubTab: NiasTankSubTab;
  regasSubTab: NiasRegasSubTab;

  // --- DOMAIN 1 / TANK_OVERVIEW ---
  zoneStats: NiasTankOverviewTabProps['zoneStats'] & { activeBaysCount: number };
  activeBays: ActiveBayState[];
  tankInventory: NiasTankAsset[];
  fleetTanks: FleetTankItem[];
  draggingTankNo: string | null;
  dragOverTarget: string | null;
  handleDragStart: NiasTankOverviewTabProps['handleDragStart'];
  handleDragEnd: () => void;
  handleDragOver: NiasTankOverviewTabProps['handleDragOver'];
  handleDragLeave: (targetId: string) => void;
  handleDrop: NiasTankOverviewTabProps['handleDrop'];
  setSelectedDetailTank: (tank: NiasTankAsset) => void;
  getRackTag: (bayId: string) => string;

  // --- DOMAIN 1 / LAYDOWN_1_2_LOG ---
  dailyMasterRecords: DailyMasterRecord[];
  deletedRecordIds: Set<string>;
  dateQueryMode: NiasLaydownLogTabProps['dateQueryMode'];
  setDateQueryMode: NiasLaydownLogTabProps['setDateQueryMode'];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  batchFilter: string;
  setBatchFilter: (batch: string) => void;
  availableBatches: string[];
  normalizeBatch: (raw?: string) => string;
  zoneFilter: string;
  setZoneFilter: NiasLaydownLogTabProps['setZoneFilter'];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setToastMessage: (msg: string | null) => void;
  calcVolumeFromMmH2O: (mm: number) => number;
  calcMassTonFromVolume: (volM3: number) => number;
  isQuickEntryOpen: boolean;
  setIsQuickEntryOpen: (open: boolean) => void;
  handleSaveQuickEntry: (e?: React.FormEvent) => void;
  wsReportDate: string;
  setWsReportDate: (date: string) => void;
  wsTankNo: string;
  handleSelectTankForQuickEntry: (tankNo: string) => void;
  wsShipment: string;
  wsSelectedZone: NiasLaydownLogTabProps['wsSelectedZone'];
  wsPressureMPa: number;
  setWsPressureMPa: (val: number) => void;
  wsLevelMmH2O: number;
  handleMmH2OChange: (mm: number) => void;
  wsLevelM3: number;
  wsSmtPress: number;
  setWsSmtPress: (val: number) => void;
  wsSmtLevel: number;
  setWsSmtLevel: (val: number) => void;
  wsSmtTemp: number;
  setWsSmtTemp: (val: number) => void;
  wsSmtBattery: number;
  setWsSmtBattery: (val: number) => void;
  wsPressBefore: number;
  setWsPressBefore: (val: number) => void;
  wsPressAfter: number;
  setWsPressAfter: (val: number) => void;
  setWsBogVentedKg: (val: number) => void;
  handleOpenTankTrendModal: (tankNo: string) => void;
  handleEditRow: (record: DailyMasterRecord) => void;
  setRecordToDelete: NiasLaydownLogTabProps['setRecordToDelete'];

  // --- DOMAIN 1 / ACTIVE_BAY_TANKS ---
  setTankInventory: (inventory: NiasTankAsset[]) => void;
  setMountModalBayId: (bayId: string | null) => void;

  // --- DOMAIN 1 / LAYDOWN_3_HEEL ---
  selectedBackhaulTanks: Set<string>;
  setSelectedBackhaulTanks: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleAuthorizeBackhaul: () => void;
  handleExportShippingReport: () => void;
  handleOpenLd2VentModal: (tank: any) => void;
  setDraggingTankNo: (val: string | null) => void;
  setDragOverTarget: (val: string | null) => void;
}
