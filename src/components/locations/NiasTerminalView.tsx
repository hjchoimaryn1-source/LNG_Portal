// src/components/locations/NiasTerminalView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../../context/PortalDataContext';
import { useTheme } from '../../context/ThemeContext';
import { DailyMasterRecord, DefectCategory, FleetTankItem } from '../../types/lng';
import SettlementAuditView from '../SettlementAuditView';
import { NiasActiveBayWorkspace } from './nias/NiasActiveBayWorkspace';
import NiasTankMassBalanceTab from './nias/NiasTankMassBalanceTab';
import NiasTankOverviewTab from './nias/tabs/NiasTankOverviewTab';
import NiasLaydownLogTab from './nias/tabs/NiasLaydownLogTab';
import NiasLaydownHeelTab from './nias/tabs/NiasLaydownHeelTab';
import NiasLd2BackhaulTab from './nias/tabs/NiasLd2BackhaulTab';
import NiasProcessPIDDiagram from './nias/NiasProcessPIDDiagram';
import NiasOperationalOverviewTab from './nias/NiasOperationalOverviewTab';
import NiasGasQualityTab from './nias/NiasGasQualityTab';
import NiasGasQualityLedgerTab from './nias/NiasGasQualityLedgerTab';
import NiasPowerThermalTab from './nias/NiasPowerThermalTab';
import NiasCustodySettlementTab from './nias/NiasCustodySettlementTab';
import { useNiasBackhaulInspection } from './nias/hooks/useNiasBackhaulInspection';
import { useNiasLd2VentModal } from './nias/hooks/useNiasLd2VentModal';
import { useNiasCalendar } from './nias/hooks/useNiasCalendar';
import { useNiasTankInventoryInit } from './nias/hooks/useNiasTankInventoryInit';
import { useNiasZoneTankViews } from './nias/hooks/useNiasZoneTankViews';
import { useNiasTankModalTriggers } from './nias/hooks/useNiasTankModalTriggers';
import { useNiasTankDragDrop } from '../../hooks/useNiasTankDragDrop';
import { useNiasInspectionForm } from '../../hooks/useNiasInspectionForm';
import NiasDomainHeaderPanel from './nias/panels/NiasDomainHeaderPanel';
import NiasSubTabsNavPanel from './nias/panels/NiasSubTabsNavPanel';
import NiasModalsPanel from './nias/panels/NiasModalsPanel';
import { INSPECTION_DATES } from './nias/constants/niasInspectionDates';
import { NIAS_EVENT_STREAM_SEED, NiasEventStreamEntry } from './nias/constants/niasEventStreamSeed';
import { NIAS_RACK_TAG_BY_BAY_INDEX } from './nias/constants/niasRackTags';
import { exportDailyMasterToCsv, exportShippingReportToCsv } from './nias/utils/niasCsvExportUtils';
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
  | 'LAYDOWN_1_2_LOG'
  | 'ACTIVE_BAY_TANKS'
  | 'LAYDOWN_3_HEEL'
  | 'TANK_MASS_BALANCE';

export type NiasRegasSubTab =
  | 'GAS_PROCESS_TELEMETRY'
  | 'GC_GAS_QUALITY'
  | 'GAS_METERING_LEDGER'
  | 'PLTMG_POWER_OUTPUT'
  | 'CUSTODY_HEAT_SETTLEMENT';

export type NiasSubTab = NiasTankSubTab | NiasRegasSubTab | string;

interface NiasTerminalViewProps {
  initialDomain?: NiasDomain;
  initialSubTab?: string;
  onNavigateSubTab?: (targetTab: string, domain?: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM') => void;
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
}: NiasTerminalViewProps) {
  const { theme, isDark } = useTheme();
  const {
    fleetTanks,
    dailyMasterRecords,
    activeBays,
    updateTankLog,
    moveTankLocation,
    saveDailyInspectionRecord,
    batchUpdateDailyMasterRecords,
    batchTransitionTanks,
    mountTankToBay,
    unmountBay,
    toggleBayRunning,
    markTankForMaintenance,
    settlementRecords,
    addDepressurizationLog,
    recordPostRegasOffload,
    authorizeBackhaulClearance,
  } = usePortalData();

  // Determine initial active domain
  const resolveInitialDomain = (): NiasDomain => {
    if (initialDomain) return initialDomain;
    if (
      initialSubTab === 'TERMINAL_OVERVIEW' ||
      initialSubTab === 'NIAS_TERMINAL_OVERVIEW' ||
      initialSubTab === 'OPERATIONAL_OVERVIEW'
    ) {
      return 'TERMINAL_OVERVIEW';
    }
    if (
      initialSubTab === 'GAS_PROCESS_TELEMETRY' ||
      initialSubTab === 'GC_GAS_QUALITY' ||
      initialSubTab === 'GAS_METERING_LEDGER' ||
      initialSubTab === 'NIAS_GAS_METERING_LEDGER' ||
      initialSubTab === 'PLTMG_POWER_OUTPUT' ||
      initialSubTab === 'CUSTODY_HEAT_SETTLEMENT' ||
      initialSubTab === 'FOUR_BAY_REGAS_GC' ||
      initialSubTab === 'ACTIVE_REGAS_TELEMETRY' ||
      initialSubTab === 'ACTIVE_REGAS' ||
      initialSubTab === 'HEAT_SETTLEMENT'
    ) {
      return 'REGAS_SYSTEM';
    }
    return 'ISO_TANK_MGMT';
  };

  // Determine initial tank sub-tab
  const resolveInitialTankTab = (): NiasTankSubTab => {
    if (
      initialSubTab === 'LAYDOWN_1_2_LOG' ||
      initialSubTab === 'DAILY_CONDITION_BOG' ||
      initialSubTab === 'DAILY_LOG_DEPRESS' ||
      initialSubTab === 'LAYDOWN_DEPRESS'
    ) {
      return 'LAYDOWN_1_2_LOG';
    }
    if (initialSubTab === 'ACTIVE_BAY_TANKS' || initialSubTab === 'BAY_MOUNTED_TANKS') {
      return 'ACTIVE_BAY_TANKS';
    }
    if (
      initialSubTab === 'LAYDOWN_3_HEEL' ||
      initialSubTab === 'EMPTY_RETURN_BACKHAUL' ||
      initialSubTab === 'EMPTY_RETURN'
    ) {
      return 'LAYDOWN_3_HEEL';
    }
    if (
      initialSubTab === 'TANK_MASS_BALANCE' ||
      initialSubTab === 'MASS_BALANCE_LOG' ||
      initialSubTab === 'MASS_BALANCE'
    ) {
      return 'TANK_MASS_BALANCE';
    }
    return 'TANK_OVERVIEW';
  };

  // Determine initial regas sub-tab
  const resolveInitialRegasTab = (): NiasRegasSubTab => {
    if (initialSubTab === 'GC_GAS_QUALITY' || initialSubTab === 'NIAS_GC_GAS_QUALITY') return 'GC_GAS_QUALITY';
    if (initialSubTab === 'GAS_METERING_LEDGER' || initialSubTab === 'NIAS_GAS_METERING_LEDGER') return 'GAS_METERING_LEDGER';
    if (initialSubTab === 'PLTMG_POWER_OUTPUT') return 'PLTMG_POWER_OUTPUT';
    if (initialSubTab === 'CUSTODY_HEAT_SETTLEMENT' || initialSubTab === 'HEAT_SETTLEMENT') {
      return 'CUSTODY_HEAT_SETTLEMENT';
    }
    return 'GAS_PROCESS_TELEMETRY';
  };

  // Active 2-Domain state
  const [activeDomain, setActiveDomain] = useState<NiasDomain>(resolveInitialDomain());
  const [tankSubTab, setTankSubTab] = useState<NiasTankSubTab>(resolveInitialTankTab());
  const [regasSubTab, setRegasSubTab] = useState<NiasRegasSubTab>(resolveInitialRegasTab());

  // Synchronize when prop changes
  React.useEffect(() => {
    setActiveDomain(resolveInitialDomain());
    setTankSubTab(resolveInitialTankTab());
    setRegasSubTab(resolveInitialRegasTab());
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
  // Modal / drawer trigger state group — encapsulated in hook
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
  } = useNiasTankModalTriggers();
  const [defectCat, setDefectCat] = useState<DefectCategory>('VALVE_LEAK');
  const [defectDesc, setDefectDesc] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);




  // Interactive Tank Relocation Modal State (Method A)
  const [relocateModalTank, setRelocateModalTank] = useState<FleetTankItem | null>(null);

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

  // Stage 1: Post-Regas Offload Condition Log Form State (Bay -> Laydown 2 with 4% Heel)
  const [stage1Date, setStage1Date] = useState<string>(() => new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [heelLevelPct, setHeelLevelPct] = useState<number>(4.0);
  const [heelPressureMPa, setHeelPressureMPa] = useState<number>(0.22);
  const [heelPreVentPressureMPa, setHeelPreVentPressureMPa] = useState<number>(0.72);
  const [heelTempC, setHeelTempC] = useState<number>(-135.0);
  const [heelWeightKg, setHeelWeightKg] = useState<number>(350);
  const [stage1Remarks, setStage1Remarks] = useState<string>('Normal post-regas offload to Laydown 2 (Heel Staging)');

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
    saveDailyInspectionRecord,
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




  // Large Screen SCADA Console: Historical Telemetry Trend Modal State
  const [trendModalTankNo, setTrendModalTankNo] = useState<string | null>(null);

  const handleOpenTankTrendModal = (tNo: string) => {
    handleSelectTankForWorkstation(tNo);
    setTrendModalTankNo(tNo);
  };

  // Helper: Normalize Tank Zone Position (Laydown 1, 2, 3)
  const getTankZone = (position: string): 'Laydown 1' | 'Laydown 2' | 'Laydown 3' => {
    const p = (position || '').toUpperCase();
    if (p.includes('2') || p.includes('YARD 2') || p.includes('LAYDOWN 2')) return 'Laydown 2';
    if (p.includes('3') || p.includes('YARD 3') || p.includes('LAYDOWN 3')) return 'Laydown 3';
    return 'Laydown 1';
  };

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

  // Date Navigation Handlers
  const handlePrevDate = () => {
    const idx = INSPECTION_DATES.indexOf(selectedDate);
    if (idx > 0) setSelectedDate(INSPECTION_DATES[idx - 1]);
  };

  const handleNextDate = () => {
    const idx = INSPECTION_DATES.indexOf(selectedDate);
    if (idx < INSPECTION_DATES.length - 1) setSelectedDate(INSPECTION_DATES[idx + 1]);
  };

  // Helper: Retrieve Consumption BOG Losses from Settlement
  const getTankLossData = (tankNo: string) => {
    const s = settlementRecords.find((rec) => rec.tankNo === tankNo);
    return {
      lossKg: s?.lossesKg || 426,
      lossPct: s?.lossesPercent || 4.17,
      shipment: s?.shipment || 'N-1',
    };
  };

  // Selection handlers
  const toggleSelectTank = (tankNo: string) => {
    setSelectedTanks((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) next.delete(tankNo);
      else next.add(tankNo);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTanks.size === filteredLaydownTanks.length) {
      setSelectedTanks(new Set());
    } else {
      setSelectedTanks(new Set(filteredLaydownTanks.map((t) => t.id)));
    }
  };

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

  // Open Interactive Relocate Modal (Method A)
  const openRelocateModal = (tank: FleetTankItem) => {
    setRelocateModalTank(tank);
  };

  const handleConfirmRelocation = (data: {
    tankNo: string;
    origin: string;
    targetZone: string;
    slotNumber: number;
    heelPct: number;
    heelPressMPa: number;
    heelTempC: number;
    heelWeightKg: number;
    remarks: string;
  }) => {
    const { tankNo, origin, targetZone, slotNumber, heelPct, heelPressMPa, heelTempC, heelWeightKg, remarks } = data;
    const targetZoneEnum = targetZone === 'Laydown 2' || targetZone === 'Laydown 3' ? 'LAYDOWN_2' : 'LAYDOWN_1';
    setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: targetZoneEnum, slotIndex: slotNumber } : t));

    moveTankLocation(tankNo, targetZone, slotNumber, {
      heelLevelPct: heelPct,
      heelPressureMPa: heelPressMPa,
      heelTempC: heelTempC,
      heelWeightKg: heelWeightKg,
      remarks: remarks || `Relocated from ${origin} to ${targetZone}`,
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEventStream((prev) => [
      {
        id: `ev-${Date.now()}`,
        time: nowTime,
        text: `[${tankNo}] Relocated from ${origin} ➔ ${targetZone} (Slot ${slotNumber})`,
        tag: 'RELOCATED',
        tagColor: 'text-slate-950 font-bold',
      },
      ...prev,
    ]);

    setToastMessage(`✅ ${tankNo} relocated to ${targetZone} (Slot ${slotNumber})`);
    setRelocateModalTank(null);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Batch Position Allocation
  const handleBatchAllocateZone = (targetZone: 'Laydown 1' | 'Laydown 2' | 'Laydown 3') => {
    if (selectedTanks.size === 0) return;
    const count = selectedTanks.size;
    const targetZoneEnum = targetZone === 'Laydown 2' || targetZone === 'Laydown 3' ? 'LAYDOWN_2' : 'LAYDOWN_1';
    setTankInventory((prev) =>
      prev.map((t) => (selectedTanks.has(t.id) ? { ...t, currentZone: targetZoneEnum } : t))
    );
    selectedTanks.forEach((tNo) => {
      updateTankLog(tNo, { position: targetZone });
    });
    setSelectedTanks(new Set());
    setToastMessage(`Reallocated ${count} tanks to ${targetZone}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Single Tank Interactive Position Dropdown Change
  const handleSingleTankPositionChange = (tankNo: string, newPosition: string) => {
    const targetZoneEnum = newPosition.toLowerCase().includes('laydown 2') || newPosition.toLowerCase().includes('laydown 3') || newPosition === 'LAYDOWN_2' ? 'LAYDOWN_2' : 'LAYDOWN_1';
    setTankInventory((prev) =>
      prev.map((t) => (t.id === tankNo ? { ...t, currentZone: targetZoneEnum } : t))
    );
    updateTankLog(tankNo, { position: newPosition });
    setToastMessage(`Tank ${tankNo} relocated to ${newPosition}`);
    setTimeout(() => setToastMessage(null), 2500);
  };



  // Computed Master Inspection List for Grid matching 14-Column Master DB schema
  const masterInspectionList: DailyMasterRecord[] = useMemo(() => {
    let records = dailyMasterRecords.filter((r) => r.id ? !deletedRecordIds.has(r.id) : true);

    // Date Mode Filter
    if (dateQueryMode === 'DAILY') {
      if (selectedDate) {
        records = records.filter((r) => r.reportDate === selectedDate);
      }
    } else if (dateQueryMode === 'PERIOD_RANGE') {
      if (startDate && endDate) {
        records = records.filter((r) => (r.reportDate || '') >= startDate && (r.reportDate || '') <= endDate);
      } else if (startDate) {
        records = records.filter((r) => (r.reportDate || '') >= startDate);
      } else if (endDate) {
        records = records.filter((r) => (r.reportDate || '') <= endDate);
      }
    }
    // When dateQueryMode === 'ALL_DATA', no date filtering is applied

    if (records.length === 0 && dateQueryMode === 'DAILY') {
      records = fleetTanks
        .filter((t) => !t.isUnderMaintenance)
        .map((t, idx) => {
          const loss = getTankLossData(t.tankNo);
          const delta = Math.max(0, (t.pressBeforeMPa || 0.80) - (t.pressAfterMPa || 0.73));
          return {
            id: `DM-${selectedDate}-${t.tankNo}-${idx}`,
            reportDate: selectedDate,
            serialNo: t.serialNo,
            tankNo: t.tankNo,
            shipment: loss.shipment || 'N1',
            position: t.position || 'Laydown 1',
            level: t.level || 51,
            levelM3: t.levelM3 || 23.0,
            levelMmH2O: t.levelMmH2O || 465,
            battery: t.battery || 72,
            pressureMPa: t.pressureMPa || 0.76,
            tempC: t.tempC || -126.7,
            depress: t.depress || (t.pressureMPa < 0.74 ? 'Depressurized' : 'None'),
            pressBeforeMPa: t.pressBeforeMPa || 0.80,
            pressAfterMPa: t.pressAfterMPa || 0.73,
            remarks: t.remarks || 'Normal inspection',
            lossesKg: loss.lossKg || Math.round(delta * 5500),
            lossesPercent: loss.lossPct || (delta > 0 ? parseFloat(((delta * 5500 / 18500) * 100).toFixed(2)) : 0),
          };
        });
    }

    // Batch filter (Normalized: N1 == N-1 == n1 == n-1)
    if (batchFilter !== 'ALL') {
      const targetBatch = normalizeBatch(batchFilter);
      records = records.filter((r) => normalizeBatch(r.shipment) === targetBatch);
    }

    // Zone filter
    if (zoneFilter !== 'ALL') {
      records = records.filter((r) => {
        const t = tankInventory.find((tank) => tank.id === r.tankNo);
        const pos = (r.position || '').toLowerCase();
        if (zoneFilter === 'LAYDOWN_1') {
          return t ? t.currentZone === 'LAYDOWN_1' : pos.includes('1') || pos.includes('ld-1') || pos.includes('yard 1');
        }
        if (zoneFilter === 'LAYDOWN_2') {
          return t ? t.currentZone === 'LAYDOWN_2' : pos.includes('2') || pos.includes('ld-2') || pos.includes('yard 2');
        }
        if (zoneFilter === 'SKID') {
          return t ? t.currentZone.startsWith('BAY') : pos.includes('bay') || pos.includes('skid') || pos.includes('rack');
        }
        return true;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.tankNo.toLowerCase().includes(q) ||
          r.serialNo.toLowerCase().includes(q) ||
          r.shipment.toLowerCase().includes(q) ||
          r.position.toLowerCase().includes(q) ||
          r.remarks.toLowerCase().includes(q) ||
          r.reportDate.toLowerCase().includes(q)
      );
    }

    return records;
  }, [dailyMasterRecords, selectedDate, startDate, endDate, dateQueryMode, batchFilter, zoneFilter, searchQuery, fleetTanks, tankInventory, deletedRecordIds]);

  // Open inspection workstation for a tank across any sub-tab
  const handleOpenInspectionWorkstationForTank = (tank: { tankNo: string }) => {
    handleSelectTankForWorkstation(tank.tankNo);
    setIsWorkstationCollapsed(false);
    setActiveDomain('ISO_TANK_MGMT');
    setTankSubTab('LAYDOWN_1_2_LOG');
    const el = document.getElementById('daily-log-workstation-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Pre-fill and load Row into Workstation
  const handleLoadRowIntoWorkstation = (record: DailyMasterRecord) => {
    setWsReportDate(record.reportDate || selectedDate);
    setWsTankNo(record.tankNo);
    setWsSerialNo(record.serialNo);
    setWsShipment(record.shipment || 'N1');
    setWsLevelPct(record.level);
    setWsLevelM3(record.levelM3);
    setWsLevelMmH2O(record.levelMmH2O);
    setWsBattery(record.battery);
    setWsPressureMPa(record.pressureMPa);
    setWsTempC(record.tempC);
    setWsTempC(record.tempC);
    setWsPressBefore(record.pressBeforeMPa || 0.80);
    setWsPressAfter(record.pressAfterMPa || 0.73);
    setWsRemarks(record.remarks || 'Daily inspection');
    setIsWorkstationCollapsed(false);
    setActiveDomain('ISO_TANK_MGMT');
    setTankSubTab('LAYDOWN_1_2_LOG');

    const el = document.getElementById('daily-log-workstation-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  // Toggle selection for backhaul manifest
  const toggleSelectBackhaulTank = (tankNo: string) => {
    const next = new Set(selectedBackhaulTanks);
    if (next.has(tankNo)) next.delete(tankNo);
    else next.add(tankNo);
    setSelectedBackhaulTanks(next);
  };

  // Stage 2: Open Pre-Backhaul Inspection Dialog
  const handleAuthorizeBackhaul = () => {
    if (selectedBackhaulTanks.size === 0) {
      setToastMessage('Please select at least 1 empty heel tank for backhaul clearance');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    setIsBackhaulModalOpen(true);
  };

  // Export Backhaul Shipping Report to CSV / Excel
  const handleExportShippingReport = () => {
    exportShippingReportToCsv(zoneStats.yard2.tanks, selectedBackhaulTanks);
    setToastMessage(`📊 Exported Backhaul Shipping Report (${zoneStats.yard2.tanks.length} Tanks)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mroModalTankNo) return;
    markTankForMaintenance(mroModalTankNo, defectCat, 'NIAS_MRO_BAY', defectDesc || 'Field reported defect');
    setMroModalTankNo(null);
    setDefectDesc('');
    setToastMessage(`Tank ${mroModalTankNo} sent to Nias MRO Bay`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Full 14-Column Master DB CSV Export
  const handleExportDailyMasterCSV = () => {
    exportDailyMasterToCsv(masterInspectionList);
  };

  const handleExportDailyReportCSV = handleExportDailyMasterCSV;

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
      />

      {/* Sub-Tabs Bar (Contextual to Selected Domain) */}
      <NiasSubTabsNavPanel
        activeDomain={activeDomain}
        tankSubTab={tankSubTab}
        setTankSubTab={setTankSubTab}
        regasSubTab={regasSubTab}
        setRegasSubTab={setRegasSubTab}
        disputeCount={disputeCount}
      />

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 1: 🌐 PURE 3-COLUMN VISUAL YARD MAP (DRAG & DROP)  */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'TANK_OVERVIEW' && (
        <NiasTankOverviewTab
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
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 2: 📥 DAILY INSPECTION & BOG LOG (WORKSHEET)      */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'LAYDOWN_1_2_LOG' && (
        <NiasLaydownLogTab
          tankInventory={tankInventory}
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
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 3: 🏷️ ACTIVE BAY MOUNTED TANKS                    */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'ACTIVE_BAY_TANKS' && (
        <NiasActiveBayWorkspace
          tankInventory={tankInventory}
          setTankInventory={setTankInventory}
          setMountModalBayId={setMountModalBayId}
          zoneStats={zoneStats}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 4: ORU ( LD - 2 ) - DUAL PANEL STAGING & BACKHAUL */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'LAYDOWN_3_HEEL' && (
        <NiasLd2BackhaulTab
          zoneStats={zoneStats}
          selectedBackhaulTanks={selectedBackhaulTanks}
          setSelectedBackhaulTanks={setSelectedBackhaulTanks}
          handleAuthorizeBackhaul={handleAuthorizeBackhaul}
          handleExportShippingReport={handleExportShippingReport}
          handleOpenLd2VentModal={handleOpenLd2VentModal}
          draggingTankNo={draggingTankNo}
          setDraggingTankNo={setDraggingTankNo}
          dragOverTarget={dragOverTarget}
          setDragOverTarget={setDragOverTarget}
          setToastMessage={setToastMessage}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 5: ISO TANK MASS BALANCE & DEPRESSURIZATION LOG   */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'TANK_MASS_BALANCE' && (
        <NiasTankMassBalanceTab />
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
      {/* DOMAIN 2 - SUB-TAB 2: ✍️ GAS METERING (ENTRY)                        */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'GC_GAS_QUALITY' && (
        <NiasGasQualityTab />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 3: 📊 GAS METERING (LEDGER)                       */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'GAS_METERING_LEDGER' && (
        <NiasGasQualityLedgerTab />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 3: ⚡ PLTMG POWER & THERMAL OUTPUT                 */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'PLTMG_POWER_OUTPUT' && (
        <NiasPowerThermalTab />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 4: ⚖️ CUSTODY HEAT SETTLEMENT                    */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'CUSTODY_HEAT_SETTLEMENT' && (
        <NiasCustodySettlementTab />
      )}

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
