// src/components/locations/NiasTerminalView.tsx
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { saveIsoTankDailyReading } from './nias/monthlyReport/hooks/useMonthlyReportData';
import { mapDailyMasterRecordToIsoTankReading } from '../../cmms-monthly-report/dao/isoTankDailyReadingsMapper';
import { useFleetTankFacade } from '../../hooks/portalDataFacade/useFleetTankFacade';
import { useDailyMasterFacade } from '../../hooks/portalDataFacade/useDailyMasterFacade';
import { useSettlementFacade } from '../../hooks/portalDataFacade/useSettlementFacade';
import { useTheme } from '../../context/ThemeContext';
import SettlementAuditView from '../SettlementAuditView';
import NiasOperationalOverviewTab from './nias/NiasOperationalOverviewTab';
import { useNiasBackhaulInspection } from './nias/hooks/useNiasBackhaulInspection';
import { useNiasLd2VentModal } from './nias/hooks/useNiasLd2VentModal';
import { useNiasCalendar } from './nias/hooks/useNiasCalendar';
import { useNiasTankInventoryInit } from './nias/hooks/useNiasTankInventoryInit';
import { useNiasZoneTankViews } from './nias/hooks/useNiasZoneTankViews';
import { useNiasTankModalTriggers } from './nias/hooks/useNiasTankModalTriggers';
import { useNiasRelocationModal } from './nias/hooks/useNiasRelocationModal';
import { useNiasTankTrendModal } from './nias/hooks/useNiasTankTrendModal';
import { useNiasTankDragDrop } from '../../hooks/useNiasTankDragDrop';
import { useNiasInspectionForm } from '../../hooks/useNiasInspectionForm';
import NiasDomainHeaderPanel from './nias/panels/NiasDomainHeaderPanel';
import NiasSubTabsNavPanel from './nias/panels/NiasSubTabsNavPanel';
import NiasModalsPanel from './nias/panels/NiasModalsPanel';
import NiasDomainContentRouter from './nias/panels/NiasDomainContentRouter';
import { resolveNiasInitialView } from './nias/utils/resolveNiasInitialView';
import { INSPECTION_DATES } from './nias/constants/niasInspectionDates';
import { NIAS_EVENT_STREAM_SEED, NiasEventStreamEntry } from './nias/constants/niasEventStreamSeed';
import { NIAS_RACK_TAG_BY_BAY_INDEX } from './nias/constants/niasRackTags';
import { exportShippingReportToCsv } from './nias/utils/niasCsvExportUtils';
import { exportDailyInspectionToExcel } from '../../utils/exportDailyInspectionExcel';
import {
  calcVolumeFromMmH2O,
  calcMassTonFromVolume,
  calcPctFromMmH2O,
} from '../../utils/tankPhysicsCalculations';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ReferenceLine,
} from 'recharts';
import {
  Flame,
  Scale,
  Play,
  Square,
  Activity,
  Thermometer,
  Droplet,
  ArrowRightCircle,
  PlusCircle,
  XCircle,
  Search,
  CheckCircle2,
  ArrowRight,
  Wrench,
  Download,
  Gauge,
  Calculator,
  Zap,
  Battery,
  BatteryCharging,
  Layers,
  Calendar,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Check,
  CornerDownRight,
  Radio,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Power,
  Table,
  GripVertical,
  Maximize2,
  Minimize2,
  RefreshCw,
  Edit3,
  Edit,
  Plus,
  Trash2,
  Wind,
  Repeat,
  ArrowLeftRight,
  Box,
  Tag,
} from 'lucide-react';

export type NiasZone = 'LAYDOWN_1' | 'BAY_01' | 'BAY_02' | 'BAY_03' | 'BAY_04' | 'LAYDOWN_2';

export interface NiasTankAsset {
  id: string;
  serialNo: string;
  shipment: string;
  currentZone: NiasZone;
  slotIndex: number;
  levelPercent: number;
  levelM3: number;
  levelMmH2O: number;
  pressureMpa: number;
  tempC: number;
  batteryPercent: number;
}

export type NiasDomain = 'TERMINAL_OVERVIEW' | 'ISO_TANK_MGMT' | 'REGAS_SYSTEM';

export type NiasTankSubTab =
  | 'TANK_OVERVIEW'
  | 'ACTIVE_BAY_TANKS'
  | 'LAYDOWN_3_HEEL';

export type NiasRegasSubTab =
  | 'GAS_PROCESS_TELEMETRY'
  | 'PATROL_LOG'
  | 'GAS_METERING_DAILY'
  | 'LAYDOWN_1_2_LOG'
  | 'TANK_MASS_BALANCE'
  | 'CUSTODY_HEAT_SETTLEMENT';

export type NiasSubTab = NiasTankSubTab | NiasRegasSubTab | string;

interface NiasTerminalViewProps {
  initialDomain?: NiasDomain;
  initialSubTab?: string;
  onNavigateSubTab?: (targetTab: string, domain?: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM') => void;
  // Nias sub-tab flattening (2026-09-16) — see NiasDomainHeaderPanelProps /
  // NiasSubTabsNavPanelProps for the rationale. Both default to legacy
  // (visible switcher, full 5-item regas row) so existing callers/tests are
  // unaffected.
  hideDomainSwitcher?: boolean;
  regasScope?: 'GAS_PROCESS' | 'POWER';
}

type LaydownZone = 'ALL' | 'LAYDOWN_1' | 'SKID' | 'LAYDOWN_2' | 'LAYDOWN_3' | 'FOUR_BAY_REGAS';

const getRackTag = (bayId: string): string => {
  if (bayId.includes('1') || bayId.toLowerCase().includes('01')) return NIAS_RACK_TAG_BY_BAY_INDEX['1'];
  if (bayId.includes('2') || bayId.toLowerCase().includes('02')) return NIAS_RACK_TAG_BY_BAY_INDEX['2'];
  if (bayId.includes('3') || bayId.toLowerCase().includes('03')) return NIAS_RACK_TAG_BY_BAY_INDEX['3'];
  if (bayId.includes('4') || bayId.toLowerCase().includes('04')) return NIAS_RACK_TAG_BY_BAY_INDEX['4'];
  return bayId;
};

export default function NiasTerminalView({
  initialDomain = 'TERMINAL_OVERVIEW',
  initialSubTab = 'TERMINAL_OVERVIEW',
  onNavigateSubTab,
  hideDomainSwitcher = false,
  regasScope,
}: NiasTerminalViewProps) {
  const { theme, isDark } = useTheme();
  const {
    fleetTanks,
    activeBays,
    updateTankLog,
    moveTankLocation,
    batchTransitionTanks,
    mountTankToBay,
    unmountBay,
    toggleBayRunning,
    markTankForMaintenance,
    recordPostRegasOffload,
    authorizeBackhaulClearance,
  } = useFleetTankFacade();
  const {
    dailyMasterRecords,
    saveDailyInspectionRecord,
    batchUpdateDailyMasterRecords,
    addDepressurizationLog,
  } = useDailyMasterFacade();
  const { settlementRecords } = useSettlementFacade();

  // ISO Tank & Mass Balance relocation stage: "ISO TK - LOG"'s Save action
  // must additionally persist to SQLite (iso_tank_daily_readings) going
  // forward. saveDailyInspectionRecord (PortalDataContext) is left exactly
  // as-is — Daily Report Section D's print bridge still reads
  // dailyMasterRecords from it — this adds a parallel SQLite write, not a
  // replacement.
  const saveDailyInspectionRecordAndSqlite = useCallback(
    (record: Parameters<typeof saveDailyInspectionRecord>[0]) => {
      saveDailyInspectionRecord(record);
      saveIsoTankDailyReading(mapDailyMasterRecordToIsoTankReading(record)).catch(() => {});
    },
    [saveDailyInspectionRecord]
  );

  // Determine initial active domain / tank sub-tab / regas sub-tab —
  // extracted to resolveNiasInitialView.ts (pure, unit-tested).
  // Active 2-Domain state
  const [activeDomain, setActiveDomain] = useState<NiasDomain>(
    resolveNiasInitialView({ initialDomain, initialSubTab }).domain
  );
  const [tankSubTab, setTankSubTab] = useState<NiasTankSubTab>(
    resolveNiasInitialView({ initialDomain, initialSubTab }).tankSubTab
  );
  const [regasSubTab, setRegasSubTab] = useState<NiasRegasSubTab>(
    resolveNiasInitialView({ initialDomain, initialSubTab }).regasSubTab
  );

  // Synchronize when prop changes
  React.useEffect(() => {
    const resolved = resolveNiasInitialView({ initialDomain, initialSubTab });
    setActiveDomain(resolved.domain);
    setTankSubTab(resolved.tankSubTab);
    setRegasSubTab(resolved.regasSubTab);
  }, [initialDomain, initialSubTab]);

  // Unified Tank Inventory State
  const [tankInventory, setTankInventory] = useState<NiasTankAsset[]>([]);

  // Initialize tank inventory from global state on mount or when fleetTanks changes — encapsulated in hook
  useNiasTankInventoryInit({
    fleetTanks,
    dailyMasterRecords,
    tankInventory,
    setTankInventory,
  });

  // General Filter & Selection States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTanks, setSelectedTanks] = useState<Set<string>>(new Set());
  const [selectedBackhaulTanks, setSelectedBackhaulTanks] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal / drawer trigger state group (incl. MRO defect form + submit) — encapsulated in hook
  const {
    mountModalBayId,
    setMountModalBayId,
    quickMountTankNo,
    setQuickMountTankNo,
    activeDrawerBayId,
    setActiveDrawerBayId,
    activeDrawerType,
    setActiveDrawerType,
    mroModalTankNo,
    setMroModalTankNo,
    selectedDetailTank,
    setSelectedDetailTank,
    openMountDropdownTankId,
    setOpenMountDropdownTankId,
    defectCat,
    setDefectCat,
    defectDesc,
    setDefectDesc,
    handleMroSubmit,
  } = useNiasTankModalTriggers({ markTankForMaintenance, setToastMessage });

  // LD-2 (ORU LD-2) BOG Vent & Status Modal — state & handlers encapsulated in hook
  const {
    ld2VentModalTank,
    setLd2VentModalTank,
    closeLd2Modal,
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
    handleOpenLd2VentModal,
    handleSaveLd2VentLog,
  } = useNiasLd2VentModal({
    setTankInventory,
    saveDailyInspectionRecord,
    setToastMessage,
  });

  // Daily Operations & BOG Event Stream Ticker State (Top Placement)
  const [eventStream, setEventStream] = useState<NiasEventStreamEntry[]>(NIAS_EVENT_STREAM_SEED);
  const [isEventStreamExpanded, setIsEventStreamExpanded] = useState<boolean>(false);

  // Stage 2: Pre-Backhaul Inspection — state & handler encapsulated in hook
  const {
    isBackhaulModalOpen,
    setIsBackhaulModalOpen,
    stage2Date,
    stage2MassKg,
    stage2PressureMPa,
    stage2TempC,
    stage2ManifestNo,
    stage2VesselName,
    stage2ValvesSealed,
    stage2PressureWithinLimit,
    stage2VacuumIntact,
    stage2Remarks,
    setStage2Date,
    setStage2MassKg,
    setStage2PressureMPa,
    setStage2TempC,
    setStage2ManifestNo,
    setStage2VesselName,
    setStage2ValvesSealed,
    setStage2PressureWithinLimit,
    setStage2VacuumIntact,
    setStage2Remarks,
    handleAuthorizeBackhaul,
    handleBackhaulModalSubmit,
  } = useNiasBackhaulInspection({
    selectedBackhaulTanks,
    authorizeBackhaulClearance,
    setTankInventory,
    setSelectedBackhaulTanks,
    setToastMessage,
  });

  // ====================================================================
  // DATE NAVIGATION & 7-COLUMN MONTHLY CALENDAR POPOVER STATE
  // ====================================================================
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-13');
  const [zoneFilter, setZoneFilter] = useState<LaydownZone>('ALL');

  const {
    isCalendarOpen,
    setIsCalendarOpen,
    calendarViewDate,
    setCalendarViewDate,
    monthNames,
    weekdayNames,
    calendarDays,
    handlePrevMonth,
    handleNextMonth,
  } = useNiasCalendar({ selectedDate, inspectionDates: INSPECTION_DATES });

  // Date Query Mode for Sub-Tab 2: ALL_DATA | DAILY | PERIOD_RANGE
  const [dateQueryMode, setDateQueryMode] = useState<'ALL_DATA' | 'DAILY' | 'PERIOD_RANGE'>('DAILY');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-13');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');
  // Batch Normalization Helper (N1 == N-1 == n1 == n-1)
  const normalizeBatch = (raw?: string): string => {
    if (!raw) return '';
    const match = raw.match(/n-?(\d+)/i);
    if (match) return `N${match[1]}`;
    return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  // Inspection form & modal handlers encapsulated in hook
  const {
    isQuickEntryOpen,
    setIsQuickEntryOpen,
    deletedRecordIds,
    setDeletedRecordIds,
    recordToDelete,
    setRecordToDelete,
    isWorkstationCollapsed,
    setIsWorkstationCollapsed,
    wsReportDate,
    setWsReportDate,
    wsTankNo,
    setWsTankNo,
    wsSerialNo,
    setWsSerialNo,
    wsShipment,
    setWsShipment,
    wsSelectedZone,
    setWsSelectedZone,
    wsSelectedZoneFilter,
    setWsSelectedZoneFilter,
    wsLevelPct,
    setWsLevelPct,
    wsLevelM3,
    setWsLevelM3,
    wsLevelMmH2O,
    setWsLevelMmH2O,
    wsBattery,
    setWsBattery,
    wsPressureMPa,
    setWsPressureMPa,
    wsTempC,
    setWsTempC,
    wsBogVentedKg,
    setWsBogVentedKg,
    wsPressBefore,
    setWsPressBefore,
    wsPressAfter,
    setWsPressAfter,
    wsEnableDepress,
    setWsEnableDepress,
    wsRemarks,
    setWsRemarks,
    wsSmtLevel,
    setWsSmtLevel,
    wsSmtPress,
    setWsSmtPress,
    wsSmtTemp,
    setWsSmtTemp,
    wsSmtBattery,
    setWsSmtBattery,
    wsVentStartTime,
    setWsVentStartTime,
    wsVentEndTime,
    setWsVentEndTime,
    handleMmH2OChange,
    handleLevelPctChange,
    handleLevelM3Change,
    wsActiveTank,
    wsActiveSettlement,
    wsTankDensity,
    quickEntryAvailableTanks,
    handleSelectTankForQuickEntry,
    handleSaveQuickEntry,
    handleEditRow,
    handleDeleteRow,
    handleConfirmDeleteRecord,
    wsDeltaP,
    wsCalculatedLossKg,
    wsInitialLoadedMass,
    wsCalculatedLossPct,
    handleSelectTankForWorkstation,
    handleSaveDailyInspection,
    handleResetWorkstation,
    handleQuickDepress,
  } = useNiasInspectionForm({
    selectedDate,
    dailyMasterRecords,
    fleetTanks,
    tankInventory,
    settlementRecords,
    setTankInventory,
    saveDailyInspectionRecord: saveDailyInspectionRecordAndSqlite,
    setToastMessage,
    setSelectedTanks,
  });

  // Available Batches for Filtering (Normalized)
  const availableBatches = useMemo(() => {
    const s = new Set<string>();
    dailyMasterRecords.forEach((r) => {
      if (r.shipment) s.add(normalizeBatch(r.shipment));
    });
    fleetTanks.forEach((t) => {
      if (t.shipment) s.add(normalizeBatch(t.shipment));
    });
    settlementRecords.forEach((rec) => {
      if (rec.shipment) s.add(normalizeBatch(rec.shipment));
    });
    if (s.size === 0) {
      return ['N1', 'N2', 'N3'];
    }
    return Array.from(s).filter(Boolean).sort();
  }, [dailyMasterRecords, fleetTanks, settlementRecords]);

  // Large Screen SCADA Console: Historical Telemetry Trend Modal — encapsulated in hook
  const { trendModalTankNo, setTrendModalTankNo, handleOpenTankTrendModal } = useNiasTankTrendModal({
    handleSelectTankForWorkstation,
  });

  // Nias zone/tank derived views (categorization, workstation filter, zone aggregations, search) — encapsulated in hook
  const {
    niasTerminalTanks,
    filteredWorkstationTanks,
    allLaydownTanks,
    emptyReturnTanks,
    zoneStats,
    filteredLaydownTanks,
  } = useNiasZoneTankViews({
    fleetTanks,
    tankInventory,
    activeBays,
    wsSelectedZoneFilter,
    searchQuery,
  });

  const disputeCount = settlementRecords.filter((s) => s.disputeStatus === 'DISPUTE_ALERT').length;

  // Drag & Drop Handlers encapsulated in hook
  const {
    draggingTankNo,
    draggedTankNo,
    setDraggingTankNo,
    setDraggedTankNo,
    dragOverTarget,
    setDragOverTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropToZone,
    handleDropToYard,
    handleDropToBay,
  } = useNiasTankDragDrop({
    activeBays,
    tankInventory,
    setTankInventory,
    moveTankLocation,
    mountTankToBay,
    unmountBay,
    setEventStream,
    setToastMessage,
    getRackTag,
  });

  // Interactive Tank Relocation Modal (Method A) — state & handler encapsulated in hook
  const { relocateModalTank, setRelocateModalTank, handleConfirmRelocation } = useNiasRelocationModal({
    setTankInventory,
    moveTankLocation,
    setEventStream,
    setToastMessage,
  });

  // Export Backhaul Shipping Report to CSV / Excel
  const handleExportShippingReport = () => {
    exportShippingReportToCsv(zoneStats.yard2.tanks, selectedBackhaulTanks);
    setToastMessage(`📊 Exported Backhaul Shipping Report (${zoneStats.yard2.tanks.length} Tanks)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full text-slate-950 font-bold font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-200 text-white font-bold rounded-none shadow-none backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-slate-950 font-bold" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Operational Domain Navigation (PAGT Arun Matching Industrial Style) */}
      <NiasDomainHeaderPanel
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        zoneStats={zoneStats}
        activeBays={activeBays}
        hideSwitcher={hideDomainSwitcher}
      />

      {/* Sub-Tabs Bar (Contextual to Selected Domain) */}
      <NiasSubTabsNavPanel
        activeDomain={activeDomain}
        tankSubTab={tankSubTab}
        setTankSubTab={setTankSubTab}
        regasSubTab={regasSubTab}
        setRegasSubTab={setRegasSubTab}
        disputeCount={disputeCount}
        regasScope={regasScope}
      />

      {/* Domain 1 (ISO_TANK_MGMT) & Domain 2 (REGAS_SYSTEM) sub-tab content router */}
      <NiasDomainContentRouter
        activeDomain={activeDomain}
        tankSubTab={tankSubTab}
        regasSubTab={regasSubTab}
        zoneStats={zoneStats}
        activeBays={activeBays}
        tankInventory={tankInventory}
        fleetTanks={fleetTanks}
        draggingTankNo={draggingTankNo}
        dragOverTarget={dragOverTarget}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        setSelectedDetailTank={setSelectedDetailTank}
        getRackTag={getRackTag}
        dailyMasterRecords={dailyMasterRecords}
        deletedRecordIds={deletedRecordIds}
        dateQueryMode={dateQueryMode}
        setDateQueryMode={setDateQueryMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        batchFilter={batchFilter}
        setBatchFilter={setBatchFilter}
        availableBatches={availableBatches}
        normalizeBatch={normalizeBatch}
        zoneFilter={zoneFilter}
        setZoneFilter={setZoneFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setToastMessage={setToastMessage}
        calcVolumeFromMmH2O={calcVolumeFromMmH2O}
        calcMassTonFromVolume={calcMassTonFromVolume}
        isQuickEntryOpen={isQuickEntryOpen}
        setIsQuickEntryOpen={setIsQuickEntryOpen}
        handleSaveQuickEntry={handleSaveQuickEntry}
        wsReportDate={wsReportDate}
        setWsReportDate={setWsReportDate}
        wsTankNo={wsTankNo}
        handleSelectTankForQuickEntry={handleSelectTankForQuickEntry}
        wsShipment={wsShipment}
        wsSelectedZone={wsSelectedZone}
        wsPressureMPa={wsPressureMPa}
        setWsPressureMPa={setWsPressureMPa}
        wsLevelMmH2O={wsLevelMmH2O}
        handleMmH2OChange={handleMmH2OChange}
        wsLevelM3={wsLevelM3}
        wsSmtPress={wsSmtPress}
        setWsSmtPress={setWsSmtPress}
        wsSmtLevel={wsSmtLevel}
        setWsSmtLevel={setWsSmtLevel}
        wsSmtTemp={wsSmtTemp}
        setWsSmtTemp={setWsSmtTemp}
        wsSmtBattery={wsSmtBattery}
        setWsSmtBattery={setWsSmtBattery}
        wsPressBefore={wsPressBefore}
        setWsPressBefore={setWsPressBefore}
        wsPressAfter={wsPressAfter}
        setWsPressAfter={setWsPressAfter}
        setWsBogVentedKg={setWsBogVentedKg}
        handleOpenTankTrendModal={handleOpenTankTrendModal}
        handleEditRow={handleEditRow}
        setRecordToDelete={setRecordToDelete}
        setTankInventory={setTankInventory}
        setMountModalBayId={setMountModalBayId}
        selectedBackhaulTanks={selectedBackhaulTanks}
        setSelectedBackhaulTanks={setSelectedBackhaulTanks}
        handleAuthorizeBackhaul={handleAuthorizeBackhaul}
        handleExportShippingReport={handleExportShippingReport}
        handleOpenLd2VentModal={handleOpenLd2VentModal}
        setDraggingTankNo={setDraggingTankNo}
        setDragOverTarget={setDragOverTarget}
      />

      {/* Always-mounted modal / drawer wiring (Quick Mount, Bay Mount, MRO, LD-2 BOG Vent, Pre-Backhaul, Relocation, Tank Detail, Delete Confirm, Tank Trend) */}
      <NiasModalsPanel
        activeBays={activeBays}
        mountTankToBay={mountTankToBay}
        unmountBay={unmountBay}
        moveTankLocation={moveTankLocation}
        setToastMessage={setToastMessage}
        quickMountTankNo={quickMountTankNo}
        setQuickMountTankNo={setQuickMountTankNo}
        mountModalBayId={mountModalBayId}
        setMountModalBayId={setMountModalBayId}
        allLaydownTanks={allLaydownTanks}
        mroModalTankNo={mroModalTankNo}
        setMroModalTankNo={setMroModalTankNo}
        defectCat={defectCat}
        setDefectCat={setDefectCat}
        defectDesc={defectDesc}
        setDefectDesc={setDefectDesc}
        handleMroSubmit={handleMroSubmit}
        ld2VentModalTank={ld2VentModalTank}
        setLd2VentModalTank={setLd2VentModalTank}
        handleSaveLd2VentLog={handleSaveLd2VentLog}
        ld2ModalPress={ld2ModalPress}
        ld2ModalTemp={ld2ModalTemp}
        ld2ModalLevelMm={ld2ModalLevelMm}
        ld2ModalIsVenting={ld2ModalIsVenting}
        ld2ModalPreVentPress={ld2ModalPreVentPress}
        ld2ModalPostVentPress={ld2ModalPostVentPress}
        ld2ModalVentKg={ld2ModalVentKg}
        ld2ModalRemarks={ld2ModalRemarks}
        ld2ModalOperator={ld2ModalOperator}
        setLd2ModalPress={setLd2ModalPress}
        setLd2ModalTemp={setLd2ModalTemp}
        setLd2ModalLevelMm={setLd2ModalLevelMm}
        setLd2ModalIsVenting={setLd2ModalIsVenting}
        setLd2ModalPreVentPress={setLd2ModalPreVentPress}
        setLd2ModalPostVentPress={setLd2ModalPostVentPress}
        setLd2ModalVentKg={setLd2ModalVentKg}
        setLd2ModalRemarks={setLd2ModalRemarks}
        setLd2ModalOperator={setLd2ModalOperator}
        isBackhaulModalOpen={isBackhaulModalOpen}
        setIsBackhaulModalOpen={setIsBackhaulModalOpen}
        handleBackhaulModalSubmit={handleBackhaulModalSubmit}
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
        setStage2ManifestNo={setStage2ManifestNo}
        setStage2VesselName={setStage2VesselName}
        setStage2Date={setStage2Date}
        setStage2MassKg={setStage2MassKg}
        setStage2PressureMPa={setStage2PressureMPa}
        setStage2TempC={setStage2TempC}
        setStage2ValvesSealed={setStage2ValvesSealed}
        setStage2PressureWithinLimit={setStage2PressureWithinLimit}
        setStage2VacuumIntact={setStage2VacuumIntact}
        setStage2Remarks={setStage2Remarks}
        relocateModalTank={relocateModalTank}
        setRelocateModalTank={setRelocateModalTank}
        handleConfirmRelocation={handleConfirmRelocation}
        selectedDetailTank={selectedDetailTank}
        setSelectedDetailTank={setSelectedDetailTank}
        getRackTag={getRackTag}
        tankInventory={tankInventory}
        setTankInventory={setTankInventory}
        setTankSubTab={setTankSubTab}
        recordToDelete={recordToDelete}
        setRecordToDelete={setRecordToDelete}
        handleConfirmDeleteRecord={handleConfirmDeleteRecord}
        trendModalTankNo={trendModalTankNo}
        setTrendModalTankNo={setTrendModalTankNo}
        dailyMasterRecords={dailyMasterRecords}
      />
    </div>
  );
}
