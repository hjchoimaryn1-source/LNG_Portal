// src/components/locations/NiasTerminalView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../../context/PortalDataContext';
import { useTheme } from '../../context/ThemeContext';
import { DailyMasterRecord, DefectCategory, FleetTankItem, NodeState } from '../../types/lng';
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
import NiasDeleteConfirmModal from './nias/modals/NiasDeleteConfirmModal';
import NiasBackhaulInspectionModal from './nias/modals/NiasBackhaulInspectionModal';
import NiasBayMountModal from './nias/modals/NiasBayMountModal';
import NiasMroModal from './nias/modals/NiasMroModal';
import NiasTankTrendModal from './nias/modals/NiasTankTrendModal';
import NiasTankDetailModal from './nias/modals/NiasTankDetailModal';
import NiasQuickMountModal from './nias/modals/NiasQuickMountModal';
import { useNiasBackhaulInspection } from './nias/hooks/useNiasBackhaulInspection';
import NiasLd2StatusModal from './nias/modals/NiasLd2StatusModal';
import { useNiasLd2VentModal } from './nias/hooks/useNiasLd2VentModal';
import { useNiasCalendar } from './nias/hooks/useNiasCalendar';
import { useNiasTankDragDrop } from '../../hooks/useNiasTankDragDrop';
import { useNiasInspectionForm } from '../../hooks/useNiasInspectionForm';
import { NiasTankRelocationDrawer } from './nias/drawers/NiasTankRelocationDrawer';
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

// Available inspection dates in operational dataset
const INSPECTION_DATES = [
  '2026-08-01',
  '2026-08-02',
  '2026-08-03',
  '2026-08-04',
  '2026-08-05',
  '2026-08-06',
  '2026-08-07',
  '2026-08-08',
  '2026-08-09',
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
];

const getRackTag = (bayId: string): string => {
  if (bayId.includes('1') || bayId.toLowerCase().includes('01')) return 'T-201';
  if (bayId.includes('2') || bayId.toLowerCase().includes('02')) return 'T-202';
  if (bayId.includes('3') || bayId.toLowerCase().includes('03')) return 'T-203';
  if (bayId.includes('4') || bayId.toLowerCase().includes('04')) return 'T-204';
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

  // Initialize tank inventory from global state on mount or when fleetTanks changes
  React.useEffect(() => {
    if (fleetTanks.length > 0 && tankInventory.length === 0) {
      const niasTanks = fleetTanks.filter(
        (t) =>
          t.location === 'ORU NIAS' ||
          t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
          t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
          t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE
      );
      const NIAS_YARD1_ORDER: Record<string, number> = {
        'ISOT-014': 1,
        'ISOT-017': 2,
        'ISOT-026': 3,
        'ISOT-031': 4,
        'ISOT-036': 5,
        'ISOT-086': 6,
        'ISOT-088': 7,
        'ISOT-103': 8,
        'ISOT-120': 9,
      };

      const initialInventory: NiasTankAsset[] = niasTanks.map((t, idx) => {
        let zone: NiasZone = 'LAYDOWN_1';
        if (
          t.tankNo === 'ISOT-064' ||
          t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
          t.position?.toLowerCase().includes('laydown 2') ||
          t.position?.toLowerCase().includes('yard 2') ||
          t.position?.toLowerCase().includes('laydown 3') ||
          t.remarks?.toLowerCase().includes('empty')
        ) {
          zone = 'LAYDOWN_2';
        } else if (
          t.tankNo === 'ISOT-009' ||
          t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
          t.position?.toLowerCase().includes('bay 01') ||
          t.position?.toLowerCase().includes('bay_01') ||
          t.isMountedToBay === 'Bay 01'
        ) {
          zone = 'BAY_01';
        } else if (t.position?.toLowerCase().includes('bay 02') || t.position?.toLowerCase().includes('bay_02') || t.isMountedToBay === 'Bay 02') {
          zone = 'BAY_02';
        } else if (t.position?.toLowerCase().includes('bay 03') || t.position?.toLowerCase().includes('bay_03') || t.isMountedToBay === 'Bay 03') {
          zone = 'BAY_03';
        } else if (t.position?.toLowerCase().includes('bay 04') || t.position?.toLowerCase().includes('bay_04') || t.isMountedToBay === 'Bay 04') {
          zone = 'BAY_04';
        } else {
          zone = 'LAYDOWN_1';
        }

        const existingRecord =
          dailyMasterRecords.find(r => r.tankNo === t.tankNo && r.reportDate === '2026-08-13') ||
          dailyMasterRecords.find(r => r.tankNo === t.tankNo);

        const assignedSlot =
          zone === 'LAYDOWN_2'
            ? t.tankNo === 'ISOT-064' ? 1 : (t.position?.includes('Slot') ? parseInt(t.position.match(/Slot\s*(\d+)/i)?.[1] || '1', 10) : 1)
            : zone === 'LAYDOWN_1'
              ? NIAS_YARD1_ORDER[t.tankNo] || (t.position?.includes('Slot') ? parseInt(t.position.match(/Slot\s*(\d+)/i)?.[1] || '1', 10) : (idx % 12) + 1)
              : 0;

        const resolvedLevel = (t.level && t.level > 0)
          ? t.level
          : (existingRecord?.level && existingRecord.level > 0)
            ? existingRecord.level
            : (zone === 'LAYDOWN_2' ? 4.0 : 50);

        const resolvedLevelM3 = (t.levelM3 && t.levelM3 > 0)
          ? t.levelM3
          : (existingRecord?.levelM3 && existingRecord.levelM3 > 0)
            ? existingRecord.levelM3
            : parseFloat(((resolvedLevel / 100) * 45).toFixed(1));

        const resolvedLevelMm = (t.levelMmH2O && t.levelMmH2O > 0)
          ? t.levelMmH2O
          : (existingRecord?.levelMmH2O && existingRecord.levelMmH2O > 0)
            ? existingRecord.levelMmH2O
            : Math.round(resolvedLevel * 10);

        const resolvedPressure = (t.pressureMPa && t.pressureMPa > 0)
          ? t.pressureMPa
          : (existingRecord?.pressureMPa && existingRecord.pressureMPa > 0)
            ? existingRecord.pressureMPa
            : (zone === 'LAYDOWN_2' ? 0.22 : 0.76);

        const resolvedTemp = (t.tempC && t.tempC !== 0)
          ? t.tempC
          : (existingRecord?.tempC && existingRecord.tempC !== 0)
            ? existingRecord.tempC
            : (zone === 'LAYDOWN_2' ? -135.0 : -126.5);

        return {
          id: t.tankNo,
          serialNo: t.serialNo,
          shipment: existingRecord?.shipment || 'N1',
          currentZone: zone,
          slotIndex: assignedSlot,
          levelPercent: resolvedLevel,
          levelM3: resolvedLevelM3,
          levelMmH2O: resolvedLevelMm,
          pressureMpa: resolvedPressure,
          tempC: resolvedTemp,
          batteryPercent: existingRecord?.battery || t.battery || 80,
        };
      });
      setTankInventory(initialInventory);
    }
  }, [fleetTanks, dailyMasterRecords]);

  // General Filter & Selection States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTanks, setSelectedTanks] = useState<Set<string>>(new Set());
  const [selectedBackhaulTanks, setSelectedBackhaulTanks] = useState<Set<string>>(new Set());
  const [mountModalBayId, setMountModalBayId] = useState<string | null>(null);
  const [quickMountTankNo, setQuickMountTankNo] = useState<string | null>(null);

  // In-Line Drawer States for Sub-Tab 3
  const [activeDrawerBayId, setActiveDrawerBayId] = useState<string | null>(null);
  const [activeDrawerType, setActiveDrawerType] = useState<'PATROL' | 'DISCONNECT' | null>(null);

  const [mroModalTankNo, setMroModalTankNo] = useState<string | null>(null);
  const [selectedDetailTank, setSelectedDetailTank] = useState<NiasTankAsset | null>(null);
  const [openMountDropdownTankId, setOpenMountDropdownTankId] = useState<string | null>(null);
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
  const [eventStream, setEventStream] = useState<
    Array<{ id: string; time: string; text: string; tag: string; tagColor: string }>
  >([
    {
      id: 'ev-1',
      time: '11:45',
      text: '[ISOT-017] Standby hookup verified on Bay 03 (0.78 MPa holding pressure)',
      tag: 'STANDBY',
      tagColor: 'text-slate-950 font-bold',
    },
    {
      id: 'ev-2',
      time: '09:30',
      text: '[ISOT-009] Controlled BOG depressurization completed (0.80 ➔ 0.73 MPa, loss: 426 kg)',
      tag: 'DEPRESS',
      tagColor: 'text-slate-950 font-bold',
    },
    {
      id: 'ev-3',
      time: '08:15',
      text: '[ISOT-086] Reallocated from Laydown 1 Buffer to Laydown 2 for venting',
      tag: 'TRANSFER',
      tagColor: 'text-slate-950 font-bold',
    },
    {
      id: 'ev-4',
      time: '07:40',
      text: '[ISOT-064] Depleted heel tank staged for Empty Return cycle (4% residual)',
      tag: 'HEEL',
      tagColor: 'text-slate-950 font-bold',
    },
  ]);
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

  // Tanks categorized by Nias operations
  const niasTerminalTanks = useMemo(() => {
    return fleetTanks.filter(
      (t) =>
        (t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
          t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
          t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
          t.location.includes('NIAS') ||
          t.position.includes('Laydown') ||
          t.position.includes('ORU')) &&
        !t.isUnderMaintenance
    );
  }, [fleetTanks]);

  const isTankInSelectedZone = (tank: NiasTankAsset, selectedZone: string) => {
    if (!tank) return false;
    if (selectedZone === 'LAYDOWN_1') return tank.currentZone === 'LAYDOWN_1';
    if (selectedZone === 'LAYDOWN_2') return tank.currentZone === 'LAYDOWN_2';
    return true;
  };

  const filteredWorkstationTanks = useMemo(() => {
    const rawFiltered = tankInventory.filter(t => isTankInSelectedZone(t, wsSelectedZoneFilter));

    const uniqueTanks: typeof rawFiltered = [];
    const seen = new Set<string>();
    for (const t of rawFiltered) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        uniqueTanks.push(t);
      }
    }
    return uniqueTanks;
  }, [tankInventory, wsSelectedZoneFilter]);

  const allLaydownTanks = useMemo(() => {
    return tankInventory.filter(
      (t) => t.currentZone === 'LAYDOWN_1' || t.currentZone === 'LAYDOWN_2'
    );
  }, [tankInventory]);

  const emptyReturnTanks = useMemo(() => {
    return fleetTanks.filter(
      (t) => t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE && !t.isUnderMaintenance
    );
  }, [fleetTanks]);

  const disputeCount = settlementRecords.filter((s) => s.disputeStatus === 'DISPUTE_ALERT').length;

  // Multi-Zone Aggregations & Metrics
  const zoneStats = useMemo(() => {
    const activeBayTanksSet = new Set(activeBays.filter((b) => b.tankNo).map((b) => b.tankNo));

    // Laydown 2 is explicit
    const yard2 = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_2');
    const yard2TankIds = new Set(yard2.map((t) => t.id));

    // Laydown 1 should ONLY show tanks that are neither in Bay nor Laydown 2
    const yard1 = tankInventory.filter(
      (t) => !activeBayTanksSet.has(t.id) && !yard2TankIds.has(t.id) && !t.currentZone.startsWith('BAY')
    );

    const calcAvgPress = (tanks: NiasTankAsset[]) => {
      if (tanks.length === 0) return 0;
      const sum = tanks.reduce((acc, t) => acc + (t.pressureMpa || 0), 0);
      return parseFloat((sum / tanks.length).toFixed(2));
    };

    const depressCount = tankInventory.filter(
      (t) => t.pressureMpa >= 0.70 // Approximate logic for active depress / elevated pressure
    ).length;

    const runningBays = activeBays.filter((b) => b.status === 'RUNNING');
    const totalFlowRate = runningBays.reduce((acc, b) => acc + (b.flowRate || 0), 0);
    const totalFlowNm3h = totalFlowRate * 590; // approximate Nm3/h conversion

    return {
      totalNiasCount: tankInventory.length,
      totalCapacity: 40,
      laydownCount: yard1.length + yard2.length,
      overallAvgPress: calcAvgPress(yard1.concat(yard2)),
      depressCount,
      activeBaysCount: activeBays.filter((b) => !!b.tankNo).length,
      totalFlowRate,
      totalFlowNm3h,
      yard1: {
        tanks: yard1,
        count: yard1.length,
        capacity: 12,
        avgPress: calcAvgPress(yard1),
        normalCount: yard1.filter((t) => (t.pressureMpa || 0) < 0.70).length,
        highCount: yard1.filter((t) => (t.pressureMpa || 0) >= 0.70).length,
      },
      yard2: {
        tanks: yard2,
        count: yard2.length,
        capacity: 12,
        avgPress: calcAvgPress(yard2),
        activeDepressCount: yard2.filter((t) => (t.pressureMpa || 0) >= 0.50).length,
      },
      yard3: {
        tanks: [],
        count: 0,
        capacity: 12,
        avgPress: 0,
        mountReadyCount: 0,
      },
    };
  }, [tankInventory, activeBays]);

  // Filtered Laydown Tanks by Zone and Search
  const filteredLaydownTanks = useMemo(() => {
    return allLaydownTanks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.shipment.toLowerCase().includes(q) ||
        (t.currentZone || '').toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [allLaydownTanks, searchQuery]);

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
      <section className="shrink-0 win-panel px-3 py-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-blue-950 tracking-tight">
              NIAS Regas Unit Process
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-[#002b4d] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 border border-slate-700 shadow-sm">
              NIAS Inventory: {zoneStats.yard1.tanks.length + activeBays.filter((b) => b.tankNo).length + zoneStats.yard2.tanks.length} Tanks
            </span>
          </div>
        </div>

        {/* 2-Domain Switcher Navigation (PAGT Arun Style SCADA Tabs) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveDomain('ISO_TANK_MGMT')}
            className={`px-3 py-1 text-xs font-bold font-mono transition-all cursor-pointer ${activeDomain === 'ISO_TANK_MGMT'
              ? 'win-tab-active text-blue-900'
              : 'win-tab-inactive'
              }`}
          >
            ISO Tank Management
          </button>
          <button
            type="button"
            onClick={() => setActiveDomain('REGAS_SYSTEM')}
            className={`px-3 py-1 text-xs font-bold font-mono transition-all cursor-pointer ${activeDomain === 'REGAS_SYSTEM'
              ? 'win-tab-active text-blue-900'
              : 'win-tab-inactive'
              }`}
          >
            Regas &amp; Power
          </button>
        </div>
      </section>

      {/* Sub-Tabs Bar (Contextual to Selected Domain) */}
      <div className="shrink-0 win-panel px-2 py-1 flex items-center justify-between border-t-0 border-[#808080] overflow-x-auto">
        {activeDomain === 'ISO_TANK_MGMT' ? (
          <div className="flex items-center gap-1 text-xs font-bold overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setTankSubTab('TANK_OVERVIEW')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'TANK_OVERVIEW' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              ISO TK Position
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('LAYDOWN_1_2_LOG')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'LAYDOWN_1_2_LOG' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              ISO TK - LOG
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('ACTIVE_BAY_TANKS')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'ACTIVE_BAY_TANKS' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              ORU ( ISO TK - SKID )
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('LAYDOWN_3_HEEL')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'LAYDOWN_3_HEEL' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              ORU ( LD - 2 )
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('TANK_MASS_BALANCE')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'TANK_MASS_BALANCE' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              Mass Balance
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs font-bold overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setRegasSubTab('GAS_PROCESS_TELEMETRY')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'GAS_PROCESS_TELEMETRY' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              GAS PROCESS
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('GC_GAS_QUALITY')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'GC_GAS_QUALITY' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              GAS METERING - LOG
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('GAS_METERING_LEDGER')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'GAS_METERING_LEDGER' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              GAS METERING (LEDGER)
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('PLTMG_POWER_OUTPUT')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'PLTMG_POWER_OUTPUT' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              PLTMG POWER
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('CUSTODY_HEAT_SETTLEMENT')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'CUSTODY_HEAT_SETTLEMENT' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
                }`}
            >
              MONTHLY REPORT
              {disputeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white font-mono text-[9px] font-bold">
                  {disputeCount} Alert
                </span>
              )}
            </button>
          </div>
        )}
      </div>

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
    </div>
  );
}
