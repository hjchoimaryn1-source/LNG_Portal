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
import NiasProcessPIDDiagram from './nias/NiasProcessPIDDiagram';
import NiasOperationalOverviewTab from './nias/NiasOperationalOverviewTab';
import NiasGasQualityTab from './nias/NiasGasQualityTab';
import NiasGasQualityLedgerTab from './nias/NiasGasQualityLedgerTab';
import NiasPowerThermalTab from './nias/NiasPowerThermalTab';
import NiasCustodySettlementTab from './nias/NiasCustodySettlementTab';
import { exportToCSV } from '../../utils/exportCsv';
import { exportDailyInspectionToExcel } from '../../utils/exportDailyInspectionExcel';
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
  MapPin,
  Flame,
  RotateCcw,
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
  Ship,
  Wrench,
  Download,
  FileSpreadsheet,
  Gauge,
  Calculator,
  Zap,
  FlaskConical,
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
  ShieldCheck,
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
    gasCompositions,
    addConsumptionRecord,
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

  // Active Skid Sendout Modal Final Heel Direct Input States
  const [modalFinalPressMpa, setModalFinalPressMpa] = useState<string>('0.22');
  const [modalFinalLevelMmH2O, setModalFinalLevelMmH2O] = useState<string>('50');
  const [modalFinalHeelVolM3, setModalFinalHeelVolM3] = useState<string>('1.0');
  const [modalFinalHeelMassKg, setModalFinalHeelMassKg] = useState<string>('420');

  // HTML5 Native Drag and Drop State for Pure Visual Yard Map
  const [draggingTankNo, setDraggingTankNo] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Interactive Tank Relocation Modal State (Method A)
  const [relocateModalTank, setRelocateModalTank] = useState<FleetTankItem | null>(null);
  const [relocateTargetZone, setRelocateTargetZone] = useState<string>('Laydown 1');
  const [relocateSlotNumber, setRelocateSlotNumber] = useState<number>(1);
  const [relocateHeelPct, setRelocateHeelPct] = useState<number>(4.0);
  const [relocateHeelPressMPa, setRelocateHeelPressMPa] = useState<number>(0.22);
  const [relocateHeelTempC, setRelocateHeelTempC] = useState<number>(-135.0);
  const [relocateHeelWeightKg, setRelocateHeelWeightKg] = useState<number>(350);
  const [relocateRemarks, setRelocateRemarks] = useState<string>('');

  // LD-2 (ORU LD-2) BOG Vent & Status Modal State
  const [ld2VentModalTank, setLd2VentModalTank] = useState<NiasTankAsset | null>(null);
  const [ld2ModalPress, setLd2ModalPress] = useState<number>(0.22);
  const [ld2ModalTemp, setLd2ModalTemp] = useState<number>(-135.0);
  const [ld2ModalLevelMm, setLd2ModalLevelMm] = useState<number>(50);
  const [ld2ModalIsVenting, setLd2ModalIsVenting] = useState<boolean>(false);
  const [ld2ModalPreVentPress, setLd2ModalPreVentPress] = useState<number>(0.70);
  const [ld2ModalPostVentPress, setLd2ModalPostVentPress] = useState<number>(0.22);
  const [ld2ModalVentKg, setLd2ModalVentKg] = useState<number>(0);
  const [ld2ModalRemarks, setLd2ModalRemarks] = useState<string>('Normal heel holding in LD-2');
  const [ld2ModalOperator, setLd2ModalOperator] = useState<string>('FIELD OP-1');

  // Sub-Tab 4 (ORU LD-2) Sub-View: Staging Buffer vs Shipping Report
  const [ld2ViewMode, setLd2ViewMode] = useState<'STAGING_BUFFER' | 'SHIPPING_REPORT'>('STAGING_BUFFER');

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

  // Stage 2: Pre-Backhaul Inspection Form State (Laydown 3 -> MV. Saviour Departure)
  const [isBackhaulModalOpen, setIsBackhaulModalOpen] = useState<boolean>(false);
  const [stage2Date, setStage2Date] = useState<string>(() => new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [stage2LevelPct, setStage2LevelPct] = useState<number>(3.8);
  const [stage2MassKg, setStage2MassKg] = useState<number>(335);
  const [stage2PressureMPa, setStage2PressureMPa] = useState<number>(0.25);
  const [stage2TempC, setStage2TempC] = useState<number>(-132.5);
  const [stage2ManifestNo, setStage2ManifestNo] = useState<string>(() => `BHM-${new Date().toISOString().slice(0, 7).replace('-', '')}-003`);
  const [stage2VesselName, setStage2VesselName] = useState<string>('MV. Saviour');
  const [stage2ValvesSealed, setStage2ValvesSealed] = useState<boolean>(true);
  const [stage2PressureWithinLimit, setStage2PressureWithinLimit] = useState<boolean>(true);
  const [stage2VacuumIntact, setStage2VacuumIntact] = useState<boolean>(true);
  const [stage2Remarks, setStage2Remarks] = useState<string>('Valves locked and sealed. Ready for backhaul voyage to Arun PAG.');

  // ====================================================================
  // DATE NAVIGATION & 7-COLUMN MONTHLY CALENDAR POPOVER STATE
  // ====================================================================
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-13');
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date(2026, 7, 1)); // August 2026
  const [zoneFilter, setZoneFilter] = useState<LaydownZone>('ALL');

  const calYear = calendarViewDate.getFullYear();
  const calMonth = calendarViewDate.getMonth(); // 0-indexed (7 = August)

  const monthNames = [
    'January (1월)', 'February (2월)', 'March (3월)', 'April (4월)',
    'May (5월)', 'June (6월)', 'July (7월)', 'August (8월)',
    'September (9월)', 'October (10월)', 'November (11월)', 'December (12월)'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar month days calculation for 7-column grid
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      hasData: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = calMonth === 0 ? 12 : calMonth;
      const prevY = calMonth === 0 ? calYear - 1 : calYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        hasData: INSPECTION_DATES.includes(dateStr),
        isSelected: selectedDate === dateStr,
        isToday: dateStr === '2026-08-13',
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        hasData: INSPECTION_DATES.includes(dateStr),
        isSelected: selectedDate === dateStr,
        isToday: dateStr === '2026-08-13',
      });
    }

    // Next month padding to complete 7-day rows
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = calMonth === 11 ? 1 : calMonth + 2;
      const nextY = calMonth === 11 ? calYear + 1 : calYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        hasData: INSPECTION_DATES.includes(dateStr),
        isSelected: selectedDate === dateStr,
        isToday: dateStr === '2026-08-13',
      });
    }

    return days;
  }, [calYear, calMonth, selectedDate]);

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth + 1, 1));
  };

  // Date Query Mode for Sub-Tab 2: ALL_DATA | DAILY | PERIOD_RANGE
  const [dateQueryMode, setDateQueryMode] = useState<'ALL_DATA' | 'DAILY' | 'PERIOD_RANGE'>('DAILY');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-13');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState<boolean>(false);
  const [deletedRecordIds, setDeletedRecordIds] = useState<Set<string>>(new Set());
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; tankNo: string; serialNo: string; reportDate: string } | null>(null);

  // Batch Normalization Helper (N1 == N-1 == n1 == n-1)
  const normalizeBatch = (raw?: string): string => {
    if (!raw) return '';
    const match = raw.match(/n-?(\d+)/i);
    if (match) return `N${match[1]}`;
    return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  // Workstation Drawer / Collapse State in Tab 2
  const [isWorkstationCollapsed, setIsWorkstationCollapsed] = useState<boolean>(false);

  // Full 14-Column Master DB Workstation Direct State
  const [wsReportDate, setWsReportDate] = useState<string>('2026-08-13');
  const [wsTankNo, setWsTankNo] = useState<string>('ISOT-014');
  const [wsSerialNo, setWsSerialNo] = useState<string>('SIMU-8101513');
  const [wsShipment, setWsShipment] = useState<string>('N1');
  const [wsSelectedZone, setWsSelectedZone] = useState<'LAYDOWN_1' | 'SKID' | 'LAYDOWN_2'>('LAYDOWN_1');
  const [wsSelectedZoneFilter, setWsSelectedZoneFilter] = useState<'LAYDOWN_1' | 'LAYDOWN_2'>('LAYDOWN_1');
  const [wsLevelPct, setWsLevelPct] = useState<number>(51);
  const [wsLevelM3, setWsLevelM3] = useState<number>(23.0);
  const [wsLevelMmH2O, setWsLevelMmH2O] = useState<number>(465);
  const [wsBattery, setWsBattery] = useState<number>(72);
  const [wsPressureMPa, setWsPressureMPa] = useState<number>(0.76);
  const [wsTempC, setWsTempC] = useState<number>(-126.7);
  const [wsBogVentedKg, setWsBogVentedKg] = useState<number>(0);
  const [wsPressBefore, setWsPressBefore] = useState<number>(0.80);
  const [wsPressAfter, setWsPressAfter] = useState<number>(0.73);
  const [wsEnableDepress, setWsEnableDepress] = useState<boolean>(false);
  const [wsRemarks, setWsRemarks] = useState<string>('Normal daily inspection');

  // Manual SMT Device Inputs
  const [wsSmtLevel, setWsSmtLevel] = useState<number>(51.5);
  const [wsSmtPress, setWsSmtPress] = useState<number>(0.76);
  const [wsSmtTemp, setWsSmtTemp] = useState<number>(-126.5);
  const [wsSmtBattery, setWsSmtBattery] = useState<number>(85);
  const [wsVentStartTime, setWsVentStartTime] = useState<string>('10:00');
  const [wsVentEndTime, setWsVentEndTime] = useState<string>('10:30');

  // Synchronize Workstation Report Date with selectedDate
  React.useEffect(() => {
    setWsReportDate(selectedDate);
  }, [selectedDate]);

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

  // Conversion Helpers based on 950 mmH2O full-span & 44.0 m3 max volume & 441.0 kg/m3 density
  const calcVolumeFromMmH2O = (mm: number): number => {
    return parseFloat(((mm / 950) * 44.0).toFixed(1));
  };

  const calcMassTonFromVolume = (volM3: number): number => {
    return parseFloat(((volM3 * 441.0) / 1000).toFixed(2));
  };

  const calcPctFromMmH2O = (mm: number): number => {
    return parseFloat(((mm / 950) * 100).toFixed(1));
  };

  const handleMmH2OChange = (mm: number) => {
    setWsLevelMmH2O(mm);
    const vol = calcVolumeFromMmH2O(mm);
    const pct = calcPctFromMmH2O(mm);
    setWsLevelPct(pct);
    setWsLevelM3(vol);
  };

  const handleLevelPctChange = (pct: number) => {
    setWsLevelPct(pct);
    const mm = Math.round((pct / 100) * 950);
    const vol = parseFloat(((pct / 100) * 44.0).toFixed(1));
    setWsLevelMmH2O(mm);
    setWsLevelM3(vol);
  };

  const handleLevelM3Change = (m3: number) => {
    setWsLevelM3(m3);
    const pct = parseFloat(((m3 / 44.0) * 100).toFixed(1));
    const mm = Math.round((m3 / 44.0) * 950);
    setWsLevelPct(pct);
    setWsLevelMmH2O(mm);
  };

  const wsActiveTank = useMemo(() => {
    return fleetTanks.find((t) => t.tankNo === wsTankNo);
  }, [fleetTanks, wsTankNo]);

  const wsActiveSettlement = useMemo(() => {
    return settlementRecords.find(s => s.tankNo === wsTankNo);
  }, [settlementRecords, wsTankNo]);


  
  const wsTankDensity = wsActiveSettlement?.deliveredDensity || 426;

  // Quick Entry Available Tanks based on selected zone
  const quickEntryAvailableTanks = useMemo(() => {
    if (wsSelectedZone === 'LAYDOWN_1') {
      const yard1 = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_1');
      return yard1.length > 0 ? yard1 : tankInventory;
    }
    if (wsSelectedZone === 'LAYDOWN_2') {
      const yard2 = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_2');
      return yard2.length > 0 ? yard2 : tankInventory;
    }
    if (wsSelectedZone === 'SKID') {
      const bay = tankInventory.filter((t) => t.currentZone.startsWith('BAY'));
      return bay.length > 0 ? bay : tankInventory;
    }
    return tankInventory;
  }, [tankInventory, wsSelectedZone]);

  const handleSelectTankForQuickEntry = (tNo: string) => {
    const tank = tankInventory.find((t) => t.id === tNo);
    const existingLog = dailyMasterRecords.find((r) => r.tankNo === tNo && r.reportDate === wsReportDate);
    const loss = getTankLossData(tNo);

    setWsTankNo(tNo);
    setWsSerialNo(tank?.serialNo || 'SIMU-8101513');
    setWsShipment(tank?.shipment || loss.shipment || 'N1');

    if (tank?.currentZone === 'LAYDOWN_2') {
      setWsSelectedZone('LAYDOWN_2');
    } else if (tank?.currentZone?.startsWith('BAY')) {
      setWsSelectedZone('SKID');
    } else {
      setWsSelectedZone('LAYDOWN_1');
    }

    setWsLevelPct(existingLog?.level ?? tank?.levelPercent ?? 51);
    const resolvedMm = existingLog?.levelMmH2O ?? tank?.levelMmH2O ?? 465;
    setWsLevelMmH2O(resolvedMm);
    setWsLevelM3(calcVolumeFromMmH2O(resolvedMm));
    setWsPressureMPa(existingLog?.pressureMPa ?? tank?.pressureMpa ?? 0.76);
    setWsTempC(existingLog?.tempC ?? tank?.tempC ?? -126.7);
    setWsBogVentedKg(existingLog?.lossesKg ?? 0);
    setWsPressBefore(existingLog?.pressBeforeMPa ?? 0.80);
    setWsPressAfter(existingLog?.pressAfterMPa ?? (existingLog?.pressureMPa ?? tank?.pressureMpa ?? 0.73));

    // SMT Remote Sensor Telemetry
    setWsSmtPress(existingLog?.pressureMPa ?? tank?.pressureMpa ?? 0.76);
    setWsSmtLevel(existingLog?.level ?? tank?.levelPercent ?? 51.5);
    setWsSmtTemp(existingLog?.tempC ?? tank?.tempC ?? -126.5);
    setWsSmtBattery(existingLog?.battery ?? 85);

    setWsRemarks(existingLog?.remarks || 'Normal daily inspection');
  };

  const handleSaveQuickEntry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalPress = wsPressureMPa;
    const zoneLabel = wsSelectedZone === 'LAYDOWN_2' ? 'Laydown 2' : wsSelectedZone === 'SKID' ? 'Bay 01' : 'Laydown 1';
    const deltaP = Math.max(0, parseFloat((wsPressBefore - wsPressAfter).toFixed(3)));
    const calculatedLossKg = deltaP > 0 ? Math.round(deltaP * 100 * 25.5) : (wsBogVentedKg || 0);
    const isVentingDone = calculatedLossKg > 0;
    const ventTimeStr = isVentingDone && wsVentStartTime && wsVentEndTime ? ` [${wsVentStartTime}~${wsVentEndTime}]` : '';

    const newRecord: DailyMasterRecord = {
      id: `DM-${wsReportDate}-${wsTankNo}-${Date.now()}`,
      reportDate: wsReportDate,
      serialNo: wsSerialNo,
      tankNo: wsTankNo,
      shipment: wsShipment,
      position: zoneLabel,
      level: wsSmtLevel || wsLevelPct,
      levelM3: wsLevelM3,
      levelMmH2O: wsLevelMmH2O,
      battery: wsSmtBattery || wsBattery || 85,
      pressureMPa: wsPressureMPa || wsSmtPress || finalPress,
      tempC: wsSmtTemp || wsTempC,
      depress: isVentingDone ? 'Depressurized' : 'Normal',
      pressBeforeMPa: wsPressBefore || wsPressureMPa,
      pressAfterMPa: wsPressAfter || (isVentingDone ? parseFloat(Math.max(0.2, wsPressureMPa - (calculatedLossKg / 2550)).toFixed(2)) : wsPressureMPa),
      remarks: wsRemarks || (isVentingDone ? `BOG Vented ${calculatedLossKg} kg${ventTimeStr} (ΔP: ${deltaP.toFixed(2)} MPa, ${wsPressBefore} -> ${wsPressAfter} MPa)` : 'Daily Inspection Entry'),
      lossesKg: calculatedLossKg,
      lossesPercent: calculatedLossKg > 0 ? parseFloat(((calculatedLossKg / 18500) * 100).toFixed(2)) : 0,
    };

    saveDailyInspectionRecord(newRecord);

    setTankInventory((prev) =>
      prev.map((t) =>
        t.id === wsTankNo
          ? {
              ...t,
              pressureMpa: wsPressureMPa || wsSmtPress || newRecord.pressureMPa,
              levelPercent: wsSmtLevel || wsLevelPct,
              levelM3: wsLevelM3,
              levelMmH2O: wsLevelMmH2O,
              tempC: wsSmtTemp || wsTempC,
            }
          : t
      )
    );

    setToastMessage(`✅ Committed inspection & BOG log for ${wsTankNo} to Master DB`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEditRow = (record: DailyMasterRecord) => {
    setWsReportDate(record.reportDate || selectedDate);
    setWsTankNo(record.tankNo);
    setWsSerialNo(record.serialNo);
    setWsShipment(record.shipment || 'N1');
    const pos = (record.position || '').toLowerCase();
    if (pos.includes('2') || pos.includes('yard 2') || pos.includes('ld-2')) setWsSelectedZone('LAYDOWN_2');
    else if (pos.includes('bay') || pos.includes('skid')) setWsSelectedZone('SKID');
    else setWsSelectedZone('LAYDOWN_1');
    setWsLevelMmH2O(record.levelMmH2O || (record.level ? Math.round((record.level / 100) * 950) : 465));
    setWsLevelM3(record.levelM3 || calcVolumeFromMmH2O(record.levelMmH2O || 465));
    setWsLevelPct(record.level || 50);
    setWsPressureMPa(record.pressureMPa || 0.76);
    setWsSmtPress(record.pressureMPa || 0.76);
    setWsSmtLevel(record.level || 50);
    setWsSmtTemp(record.tempC || -126.5);
    setWsSmtBattery(record.battery || 85);
    setWsTempC(record.tempC || -126.7);
    setWsBogVentedKg(record.lossesKg || 0);
    setWsPressBefore(record.pressBeforeMPa || 0.80);
    setWsPressAfter(record.pressAfterMPa || 0.73);
    setWsRemarks(record.remarks || '');
    setIsQuickEntryOpen(true);
  };

  const handleDeleteRow = (recordId: string, tankNo: string) => {
    setDeletedRecordIds((prev) => new Set(prev).add(recordId));
    setToastMessage(`🗑️ Deleted record for ${tankNo}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleConfirmDeleteRecord = () => {
    if (!recordToDelete) return;
    setDeletedRecordIds((prev) => new Set(prev).add(recordToDelete.id));
    setToastMessage(`🗑️ Deleted record for ${recordToDelete.tankNo} (${recordToDelete.reportDate})`);
    setTimeout(() => setToastMessage(null), 2500);
    setRecordToDelete(null);
  };

  // Calculated Live BOG Loss in Workstation
  const wsDeltaP = useMemo(() => {
    if (wsEnableDepress && wsPressBefore > wsPressAfter && wsPressAfter > 0) {
      return parseFloat((wsPressBefore - wsPressAfter).toFixed(2));
    }
    return 0;
  }, [wsPressBefore, wsPressAfter, wsEnableDepress]);

  const wsCalculatedLossKg = useMemo(() => {
    if (wsDeltaP > 0) {
      return Math.round(wsDeltaP * (wsTankDensity / 426) * 6000);
    }
    return 0;
  }, [wsDeltaP, wsTankDensity]);

  const wsInitialLoadedMass = wsActiveSettlement?.deliveredWeightKg || 18500;

  const wsCalculatedLossPct = useMemo(() => {
    if (wsCalculatedLossKg > 0) {
      if (wsInitialLoadedMass > 0) {
        return parseFloat(((wsCalculatedLossKg / wsInitialLoadedMass) * 100).toFixed(2));
      }
    }
    return 0;
  }, [wsCalculatedLossKg, wsInitialLoadedMass]);

  const handleSelectTankForWorkstation = (tNo: string) => {
    const tank = tankInventory.find((t) => t.id === tNo);
    const existingLog =
      dailyMasterRecords.find((r) => r.tankNo === tNo && r.reportDate === wsReportDate) ||
      dailyMasterRecords.find((r) => r.tankNo === tNo);
    const loss = getTankLossData(tNo);

    setWsTankNo(tNo);
    setSelectedTanks(new Set([tNo]));
    
    if (tank) {
      if (tank.currentZone === 'LAYDOWN_1') setWsSelectedZoneFilter('LAYDOWN_1');
      else if (tank.currentZone === 'LAYDOWN_2') setWsSelectedZoneFilter('LAYDOWN_2');
    }
    
    setWsSerialNo(tank?.serialNo || 'SIMU-8101513');
    setWsShipment(tank?.shipment || loss.shipment || 'N1');
    setWsLevelPct(tank?.levelPercent ?? 51);
    setWsLevelM3(tank?.levelM3 ?? 23.0);
    setWsLevelMmH2O(tank?.levelMmH2O ?? 465);
    setWsBattery(tank?.batteryPercent ?? 72);
    setWsPressureMPa(tank?.pressureMpa ?? 0.76);
    setWsTempC(tank?.tempC ?? -126.7);
    
    // Auto-populate SMT with actual tank values for realism
    setWsSmtLevel(tank?.levelPercent || 0);
    setWsSmtPress(tank?.pressureMpa || 0);
    setWsSmtTemp(tank?.tempC || 0);
    setWsSmtBattery(tank?.batteryPercent || 0);

    setWsPressBefore(existingLog?.pressBeforeMPa ?? (tank?.pressureMpa || 0.80));
    setWsPressAfter(existingLog?.pressAfterMPa ?? 0.73);
    setWsRemarks(existingLog?.remarks || 'Normal daily inspection');
  };

  // Large Screen SCADA Console: Historical Telemetry Trend Modal State
  const [trendModalTankNo, setTrendModalTankNo] = useState<string | null>(null);
  const [trendTimeRange, setTrendTimeRange] = useState<'7D' | '14D' | '30D' | 'ALL'>('7D');
  const [trendSeriesVisible, setTrendSeriesVisible] = useState<{ vol: boolean; press: boolean; temp: boolean }>({
    vol: true,
    press: true,
    temp: true,
  });

  const handleOpenTankTrendModal = (tNo: string) => {
    handleSelectTankForWorkstation(tNo);
    setTrendModalTankNo(tNo);
  };

  // Compute Historical Telemetry Dataset for the selected Tank in the Trend Modal
  const trendModalData = useMemo(() => {
    if (!trendModalTankNo) return [];
    
    const tankRecords = dailyMasterRecords
      .filter((r) => r.tankNo === trendModalTankNo)
      .sort((a, b) => (a.reportDate > b.reportDate ? 1 : -1));

    const activeTank = tankInventory.find((t) => t.id === trendModalTankNo);
    const baseDate = new Date();
    const daysCount = trendTimeRange === '7D' ? 7 : trendTimeRange === '14D' ? 14 : trendTimeRange === '30D' ? 30 : 30;

    const points: Array<{
      date: string;
      fullDate: string;
      analogPress: number;
      smtPress: number;
      smtLevel: number;
      calcVol: number;
      calcMass: number;
      tempC: number;
      battery: number;
      signal: number;
      bogLossKg: number;
      zone: string;
      batch: string;
      status: string;
    }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const shortDate = dateStr.slice(5);

      const existing = tankRecords.find((r) => r.reportDate === dateStr);
      if (existing) {
        const rawMm = existing.levelMmH2O || (existing.level ? Math.round((existing.level / 100) * 950) : 465);
        const cVol = calcVolumeFromMmH2O(rawMm);
        const cMass = calcMassTonFromVolume(cVol);
        const isHighPress = (existing.pressureMPa || 0) >= 0.74;
        points.push({
          date: shortDate,
          fullDate: dateStr,
          analogPress: parseFloat((existing.pressureMPa || 0.76).toFixed(2)),
          smtPress: parseFloat(((existing.pressureMPa || 0.76) + (Math.sin(i) * 0.01)).toFixed(2)),
          smtLevel: parseFloat((existing.level ?? ((rawMm / 950) * 100)).toFixed(1)),
          calcVol: parseFloat(cVol.toFixed(1)),
          calcMass: parseFloat(cMass.toFixed(2)),
          tempC: parseFloat((existing.tempC !== undefined && existing.tempC !== null ? existing.tempC : -126.7).toFixed(1)),
          battery: existing.battery || Math.max(50, 95 - i),
          signal: Math.min(100, Math.max(80, 92 + Math.round(Math.cos(i) * 5))),
          bogLossKg: existing.depress ? (existing.pressBeforeMPa && existing.pressAfterMPa ? Math.round((existing.pressBeforeMPa - existing.pressAfterMPa) * 1000 * 6.1) : 426) : 0,
          zone: existing.position || (activeTank?.currentZone === 'LAYDOWN_2' ? 'LD-2' : activeTank?.currentZone?.startsWith('BAY') ? 'SKID' : 'LD-1'),
          batch: normalizeBatch(existing.shipment) || 'N1',
          status: isHighPress ? 'WARNING' : 'NORMAL',
        });
      } else {
        const currentLevel = activeTank?.levelPercent ?? 51.0;
        const currentPress = activeTank?.pressureMpa ?? 0.76;
        const currentTemp = activeTank?.tempC ?? -126.7;
        const progressFactor = (daysCount - 1 - i) / Math.max(1, daysCount - 1);
        
        const simPress = parseFloat((0.68 + (currentPress - 0.68) * progressFactor + Math.sin(i * 0.8) * 0.015).toFixed(2));
        const simSmtPress = parseFloat((simPress + 0.01).toFixed(2));
        const simLevel = parseFloat((Math.min(95, currentLevel + (daysCount - 1 - (daysCount - 1 - i)) * 0.15)).toFixed(1));
        const simMmH2O = Math.round((simLevel / 100) * 950);
        const simVol = calcVolumeFromMmH2O(simMmH2O);
        const simMass = calcMassTonFromVolume(simVol);
        const simTemp = parseFloat((currentTemp + Math.sin(i * 0.5) * 0.4).toFixed(1));
        const simBatt = Math.min(100, Math.max(60, 96 - Math.floor(i * 0.8)));
        const simSignal = Math.min(100, Math.max(82, 94 + Math.round(Math.cos(i) * 4)));
        const isDepressDay = i % 5 === 2;

        points.push({
          date: shortDate,
          fullDate: dateStr,
          analogPress: simPress,
          smtPress: simSmtPress,
          smtLevel: simLevel,
          calcVol: parseFloat(simVol.toFixed(1)),
          calcMass: parseFloat(simMass.toFixed(2)),
          tempC: simTemp,
          battery: simBatt,
          signal: simSignal,
          bogLossKg: isDepressDay ? 385 : 0,
          zone: activeTank?.currentZone === 'LAYDOWN_2' ? 'LD-2' : activeTank?.currentZone?.startsWith('BAY') ? 'SKID' : 'LD-1',
          batch: activeTank?.shipment ? normalizeBatch(activeTank.shipment) : 'N1',
          status: simPress >= 0.74 ? 'WARNING' : 'NORMAL',
        });
      }
    }

    return points;
  }, [trendModalTankNo, dailyMasterRecords, tankInventory, trendTimeRange]);

  // Consumption Modal Form State with Arun Lab Baseline Inheritance
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState<boolean>(false);
  const [conBayId, setConBayId] = useState<string>('Bay 01');
  const [conTankNo, setConTankNo] = useState<string>('ISOT-009');
  const [conWeightKg, setConWeightKg] = useState<number>(18200);
  const [conVolumeM3, setConVolumeM3] = useState<number>(41.2);
  const [conDensity, setConDensity] = useState<number>(441.8);
  const [conLossKg, setConLossKg] = useState<number>(300);

  // Quick Slot Relocation Modal State
  const [slotMoveModal, setSlotMoveModal] = useState<{
    targetYard: 'Laydown 1' | 'Laydown 2' | 'Laydown 3';
    slotIndex: number;
  } | null>(null);

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

  // Inherited Arun Baseline for Consumption modal
  const linkedArunBaseline = useMemo(() => {
    const deliveredRecord = settlementRecords.find((s) => s.tankNo === conTankNo);
    const coqRecord = gasCompositions.find((g) => g.samplePoint.includes(conTankNo) || g.source.includes('COQ'));

    return {
      ghvBtuKg: deliveredRecord?.deliveredGHV || 52214.94,
      deliveredMMBtu: deliveredRecord?.deliveredMMBtu || 965.98,
      deliveredWeightKg: deliveredRecord?.deliveredWeightKg || 18500,
      methaneMolPct: coqRecord?.methane || 90.24,
      coqGHV: coqRecord?.ghv || 1056.4,
      shipment: deliveredRecord?.shipment || 'N-1',
      certificateId: deliveredRecord?.id || 'PAG-CERT-STD',
    };
  }, [settlementRecords, gasCompositions, conTankNo]);

  // Auto-Calculate Consumed MMBtu using Arun Baseline GHV
  const calculatedConsumedMMBtu = useMemo(() => {
    const rawMMBtu = (conWeightKg * linkedArunBaseline.ghvBtuKg) / 1000000;
    return parseFloat(rawMMBtu.toFixed(2));
  }, [conWeightKg, linkedArunBaseline.ghvBtuKg]);

  const calculatedLossPct = useMemo(() => {
    if (linkedArunBaseline.deliveredWeightKg > 0) {
      return parseFloat(((conLossKg / linkedArunBaseline.deliveredWeightKg) * 100).toFixed(2));
    }
    return 1.62;
  }, [conLossKg, linkedArunBaseline.deliveredWeightKg]);

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

  // Drag & Drop Handlers (Method B)
  const handleDropToZone = (
    tankNo: string,
    targetZone: string,
    slotNumber?: number
  ) => {
    if (!tankNo) return;
    moveTankLocation(tankNo, targetZone, slotNumber);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEventStream((prev) => [
      {
        id: `ev-${Date.now()}`,
        time: nowTime,
        text: `[${tankNo}] Drag & drop relocated to ${targetZone}${slotNumber ? ` (Slot ${slotNumber})` : ''}`,
        tag: 'DND_MOVE',
        tagColor: 'text-slate-950 font-bold',
      },
      ...prev,
    ]);

    setToastMessage(`✅ ${tankNo} relocated to ${targetZone}${slotNumber ? ` (Slot ${slotNumber})` : ''}`);
    setDraggingTankNo(null);
    setDragOverTarget(null);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDropToYard = (tankNo: string, targetYard: 'Laydown 1' | 'Laydown 2' | 'Laydown 3', slotIdx?: number) => {
    handleDropToZone(tankNo, targetYard, slotIdx ? slotIdx + 1 : undefined);
  };

  const handleDropToBay = (tankNo: string, bayId: string) => {
    handleDropToZone(tankNo, bayId);
  };

  // Open Interactive Relocate Modal (Method A)
  const openRelocateModal = (tank: FleetTankItem) => {
    setRelocateModalTank(tank);
    const currentZone = getTankZone(tank.position);
    setRelocateTargetZone(currentZone === 'Laydown 1' ? 'Laydown 2' : 'Laydown 1');
    setRelocateSlotNumber(1);
    setRelocateHeelPct(tank.level || 50);
    setRelocateHeelPressMPa(tank.pressureMPa || 0.76);
    setRelocateHeelTempC(tank.tempC || -126.5);
    setRelocateHeelWeightKg(Math.round(((tank.level || 50) / 100) * 18200));
    setRelocateRemarks('');
  };

  // Confirm Relocation via Interactive Modal
  const handleConfirmRelocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relocateModalTank) return;

    const tankNo = relocateModalTank.tankNo;
    const origin = relocateModalTank.position || 'Nias Yard';

    const targetZoneEnum = relocateTargetZone === 'Laydown 2' || relocateTargetZone === 'Laydown 3' ? 'LAYDOWN_2' : 'LAYDOWN_1';
    setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: targetZoneEnum, slotIndex: relocateSlotNumber } : t));

    moveTankLocation(tankNo, relocateTargetZone, relocateSlotNumber, {
      heelLevelPct: relocateHeelPct,
      heelPressureMPa: relocateHeelPressMPa,
      heelTempC: relocateHeelTempC,
      heelWeightKg: relocateHeelWeightKg,
      remarks: relocateRemarks || `Relocated from ${origin} to ${relocateTargetZone}`,
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEventStream((prev) => [
      {
        id: `ev-${Date.now()}`,
        time: nowTime,
        text: `[${tankNo}] Relocated from ${origin} ➔ ${relocateTargetZone} (Slot ${relocateSlotNumber})`,
        tag: 'RELOCATED',
        tagColor: 'text-slate-950 font-bold',
      },
      ...prev,
    ]);

    setToastMessage(`✅ ${tankNo} relocated to ${relocateTargetZone} (Slot ${relocateSlotNumber})`);
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

  // HTML5 Native Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, tankNo: string, fromZone: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ tankNo, fromZone }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTankNo(tankNo);
  };

  const handleDragEnd = () => {
    setDraggingTankNo(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = (targetId: string) => {
    if (dragOverTarget === targetId) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    targetZone: 'LAYDOWN_1' | 'LAYDOWN_2' | 'FOUR_BAY_REGAS' | 'LAYDOWN_3',
    slotNumber?: number,
    bayId?: string
  ) => {
    e.preventDefault();
    setDragOverTarget(null);
    setDraggingTankNo(null);

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { tankNo } = JSON.parse(dataStr);
      if (!tankNo) return;

      if (targetZone === 'FOUR_BAY_REGAS' && bayId) {
        const bayZoneKey = (bayId.replace(' ', '_').toUpperCase()) as NiasZone;
        setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: bayZoneKey } : t));
        mountTankToBay(bayId, tankNo);
        setToastMessage(`Mounted ${tankNo} to ${getRackTag(bayId)} for Regasification`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      if (targetZone === 'LAYDOWN_1') {
        const occupiedBay = activeBays.find(b => b.tankNo === tankNo);
        if (occupiedBay) {
          unmountBay(occupiedBay.bayId);
        }
        setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: 'LAYDOWN_1', slotIndex: slotNumber || t.slotIndex } : t));
        moveTankLocation(tankNo, 'Laydown 1', slotNumber);
        setToastMessage(`Relocated ${tankNo} to ORU (LD-1)${slotNumber ? ` (Slot #${slotNumber})` : ''}`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      if (targetZone === 'LAYDOWN_2' || targetZone === 'LAYDOWN_3') {
        const occupiedBay = activeBays.find(b => b.tankNo === tankNo);
        if (occupiedBay) {
          unmountBay(occupiedBay.bayId);
        }
        setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: 'LAYDOWN_2', slotIndex: slotNumber || t.slotIndex } : t));
        moveTankLocation(tankNo, 'Laydown 2', slotNumber);
        setToastMessage(`Relocated ${tankNo} to ORU (LD-2)${slotNumber ? ` (Slot #${slotNumber})` : ''}`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    } catch (err) {
      console.error('Failed to parse drag payload:', err);
    }
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

  // Stage 2: Submit Pre-Backhaul Inspection Form
  const handleBackhaulModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tankNos = Array.from(selectedBackhaulTanks);
    if (tankNos.length === 0) return;

    authorizeBackhaulClearance(tankNos, {
      departureDate: stage2Date,
      departureLevelPct: stage2LevelPct,
      departureMassKg: stage2MassKg,
      departurePressureMPa: stage2PressureMPa,
      departureTempC: stage2TempC,
      manifestNo: stage2ManifestNo,
      vesselName: stage2VesselName,
      safetyClearance:
        stage2ValvesSealed && stage2PressureWithinLimit && stage2VacuumIntact,
      remarks: stage2Remarks,
    });

    setTankInventory((prev) => prev.filter((t) => !tankNos.includes(t.id)));
    setIsBackhaulModalOpen(false);
    setSelectedBackhaulTanks(new Set());
    setToastMessage(
      `Backhaul Manifest ${stage2ManifestNo} Certified: ${tankNos.length} tanks dispatched aboard ${stage2VesselName} -> Arun PAG`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // LD-2 Status & BOG Vent Modal Handlers
  const handleOpenLd2VentModal = (tank: NiasTankAsset) => {
    setLd2VentModalTank(tank);
    setLd2ModalPress(tank.pressureMpa || 0.22);
    setLd2ModalTemp(tank.tempC ?? -135.0);
    const mm = tank.levelMmH2O || (tank.levelPercent ? Math.round((tank.levelPercent / 100) * 950) : 50);
    setLd2ModalLevelMm(mm);
    setLd2ModalIsVenting(false);
    setLd2ModalPreVentPress(tank.pressureMpa || 0.70);
    setLd2ModalPostVentPress(0.22);
    setLd2ModalVentKg(0);
    setLd2ModalRemarks('Normal heel holding in LD-2');
    setLd2ModalOperator('FIELD OP-1');
  };

  const handleSaveLd2VentLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ld2VentModalTank) return;
    const tankId = ld2VentModalTank.id;
    const finalPress = ld2ModalIsVenting ? ld2ModalPostVentPress : ld2ModalPress;
    const calcVol = parseFloat(((ld2ModalLevelMm / 950) * 44.0).toFixed(1));
    const calcPct = parseFloat(((ld2ModalLevelMm / 950) * 100).toFixed(1));

    // Update local inventory
    setTankInventory((prev) =>
      prev.map((t) =>
        t.id === tankId
          ? {
              ...t,
              pressureMpa: finalPress,
              tempC: ld2ModalTemp,
              levelPercent: calcPct,
              levelM3: calcVol,
              levelMmH2O: ld2ModalLevelMm,
            }
          : t
      )
    );

    // Record into DailyMasterRecord
    const newRecord: DailyMasterRecord = {
      id: `LD2-VENT-${Date.now()}`,
      reportDate: new Date().toISOString().slice(0, 10),
      tankNo: tankId,
      serialNo: ld2VentModalTank.serialNo || 'UNKNOWN',
      shipment: ld2VentModalTank.shipment || 'N1',
      position: 'Laydown 2',
      level: calcPct,
      levelM3: calcVol,
      levelMmH2O: ld2ModalLevelMm,
      pressureMPa: finalPress,
      tempC: ld2ModalTemp,
      battery: ld2VentModalTank.batteryPercent || 100,
      remarks: `[LD-2 STAGING] ${ld2ModalRemarks} | Operator: ${ld2ModalOperator}${ld2ModalIsVenting ? ` | Venting: ${ld2ModalPreVentPress.toFixed(2)} ➔ ${ld2ModalPostVentPress.toFixed(2)} MPa (Loss: ${ld2ModalVentKg} kg)` : ''}`,
      depress: ld2ModalIsVenting ? 'Vented' : 'None',
      pressBeforeMPa: ld2ModalIsVenting ? ld2ModalPreVentPress : 0,
      pressAfterMPa: ld2ModalIsVenting ? ld2ModalPostVentPress : 0,
      lossesKg: ld2ModalIsVenting ? ld2ModalVentKg : 0,
      lossesPercent: ld2ModalIsVenting ? parseFloat(((ld2ModalVentKg / 18200) * 100).toFixed(2)) : 0,
    };

    saveDailyInspectionRecord(newRecord);
    setToastMessage(`💾 LD-2 Log & BOG Vent Saved for ${tankId}`);
    setLd2VentModalTank(null);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export Backhaul Shipping Report to CSV / Excel
  const handleExportShippingReport = () => {
    const yard2TanksList = zoneStats.yard2.tanks;
    const exportData = yard2TanksList.map((t, idx) => {
      const isSelected = selectedBackhaulTanks.has(t.id);
      const massKg = Math.round(((t.levelPercent || 4.0) / 100) * 18200);
      return {
        'NO': idx + 1,
        'TANK ID': t.id,
        'SERIAL NO': t.serialNo || `SIMU-82020${idx + 1}`,
        'VESSEL': 'M.V. SAVIOUR',
        'VOYAGE': 'VOY-2026-08 (ARUN RETURN)',
        'LOADING DATE': '2026-08-30',
        'SKID UNMOUNT DATE': '2026-08-28 14:30',
        'LD-2 DURATION (DAYS)': 2,
        'FINAL PRESS (MPa)': (t.pressureMpa || 0.22).toFixed(2),
        'TEMP (°C)': (t.tempC ?? -135.0).toFixed(1),
        'HEEL LEVEL (%)': (t.levelPercent || 4.0).toFixed(1),
        'CALC MASS (kg)': massKg,
        'BOG VENT DONE': 'Y (0.22 MPa)',
        'SAFETY SEAL NO': `SL-8842-N${String(idx + 1).padStart(2, '0')}`,
        'INSPECTOR SIGN': 'FIELD OP-1 / CHIEF',
        'STATUS': isSelected ? 'LOADED (SELECTED)' : 'STAGED FOR RETURN',
      };
    });

    if (exportData.length === 0) {
      setToastMessage('No staged tanks to export');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BACKHAUL_MANIFEST_MVSAVIOUR_20260830.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`📊 Exported Backhaul Shipping Report (${exportData.length} Tanks)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Submit Daily Inspection & Depress Workstation
  const handleSaveDailyInspection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalPress =
      (wsEnableDepress && wsPressBefore > wsPressAfter && wsPressAfter > 0) ? wsPressAfter : wsPressureMPa;

    const newRecord: DailyMasterRecord = {
      id: `DM-${wsReportDate}-${wsTankNo}-${Date.now()}`,
      reportDate: wsReportDate,
      serialNo: wsSerialNo,
      tankNo: wsTankNo,
      shipment: wsShipment,
      position: wsActiveTank?.position || 'Laydown 1',
      level: wsLevelPct,
      levelM3: wsLevelM3,
      levelMmH2O: wsLevelMmH2O,
      battery: wsBattery,
      pressureMPa: finalPress,
      tempC: wsTempC,
      depress: (wsEnableDepress && wsPressBefore > wsPressAfter && wsPressAfter > 0) ? 'Depressurized' : 'None',
      pressBeforeMPa: wsEnableDepress ? wsPressBefore : 0,
      pressAfterMPa: wsEnableDepress ? wsPressAfter : 0,
      remarks: wsRemarks,
      lossesKg: wsCalculatedLossKg,
      lossesPercent: wsCalculatedLossPct,
    };

    saveDailyInspectionRecord(newRecord);
    setToastMessage(`Saved & Committed 14-Column Daily Log for ${wsTankNo} (${wsReportDate})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset Workstation
  const handleResetWorkstation = () => {
    handleSelectTankForWorkstation(wsTankNo);
    setToastMessage('Workstation form reset to saved DB values');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Quick 1-Click Depress for any row or tank
  const handleQuickDepress = (recordOrTankNo: DailyMasterRecord | string) => {
    let record: DailyMasterRecord;
    if (typeof recordOrTankNo === 'string') {
      const tankNo = recordOrTankNo;
      const foundTank = fleetTanks.find((t) => t.tankNo === tankNo);
      const existing = masterInspectionList.find((r) => r.tankNo === tankNo);
      record = existing || {
        id: `DM-${selectedDate}-${tankNo}`,
        reportDate: selectedDate,
        serialNo: foundTank?.serialNo || 'ISOT-SIM',
        tankNo: tankNo,
        shipment: 'N1',
        position: foundTank?.position || 'Laydown 2',
        level: foundTank?.level || 90,
        levelM3: foundTank?.levelM3 || 40.5,
        levelMmH2O: foundTank?.levelMmH2O || 500,
        battery: foundTank?.battery || 95,
        pressureMPa: foundTank?.pressureMPa || 0.80,
        tempC: foundTank?.tempC || -126.7,
        depress: 'Depress Active',
        pressBeforeMPa: foundTank?.pressBeforeMPa || 0.80,
        pressAfterMPa: 0.73,
        remarks: 'Manual quick depress from Yard 2 map',
        lossesKg: 385,
        lossesPercent: 2.1,
      };
    } else {
      record = recordOrTankNo;
    }

    const pressBefore = record.pressureMPa > 0.74 ? record.pressureMPa : 0.80;
    const pressAfter = 0.73;
    const delta = parseFloat((pressBefore - pressAfter).toFixed(2));
    const lossKg = Math.round(delta * 5500);
    const lossPct = parseFloat(((lossKg / 18500) * 100).toFixed(2));

    const updated: DailyMasterRecord = {
      ...record,
      pressureMPa: pressAfter,
      depress: 'Depressurized',
      pressBeforeMPa: pressBefore,
      pressAfterMPa: pressAfter,
      lossesKg: lossKg,
      lossesPercent: lossPct,
      remarks: `Quick Depress: ${pressBefore} ➔ ${pressAfter} MPa (ΔP: ${delta} MPa)`,
    };

    saveDailyInspectionRecord(updated);
    setToastMessage(
      `Quick Depressurized ${record.tankNo}: ${pressBefore} ➔ ${pressAfter} MPa (${lossKg} kg BOG vented)`
    );
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

  const handleConsumptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addConsumptionRecord({
      bayId: conBayId,
      tankNo: conTankNo,
      consumedWeightKg: conWeightKg,
      consumedVolumeM3: conVolumeM3,
      consumedMMBtu: calculatedConsumedMMBtu,
      consumedDensity: conDensity,
      lossesKg: conLossKg,
      lossesPercent: calculatedLossPct,
      date: selectedDate || new Date().toISOString().split('T')[0],
    });
    setIsConsumptionModalOpen(false);
    setToastMessage(`Logged Regas Consumption for ${conTankNo} (${calculatedConsumedMMBtu} MMBtu) -> Cycled to Empty`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Full 14-Column Master DB CSV Export
  const handleExportDailyMasterCSV = () => {
    exportToCSV(
      `NIAS_ISO_Tank_Daily_Master_${selectedDate}`,
      masterInspectionList.map((r) => ({
        'Report Date': r.reportDate,
        'Serial No.': r.serialNo,
        'ISO Tk No.': r.tankNo,
        'Shipment': r.shipment,
        'Yard Position': r.position,
        'Level (%)': r.level,
        'Level (m³)': r.levelM3,
        'Level (mmH2O)': r.levelMmH2O,
        'Battery (%)': r.battery,
        'Pressure (MPa)': r.pressureMPa,
        'Temp (°C)': r.tempC,
        'Depress': r.depress,
        'Press_Before (MPa)': r.pressBeforeMPa,
        'Press_After (MPa)': r.pressAfterMPa,
        'Remarks': r.remarks,
      }))
    );
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
            className={`px-3 py-1 text-xs font-bold font-mono transition-all cursor-pointer ${
              activeDomain === 'ISO_TANK_MGMT'
                ? 'win-tab-active text-blue-900'
                : 'win-tab-inactive'
            }`}
          >
            ISO Tank Management
          </button>
          <button
            type="button"
            onClick={() => setActiveDomain('REGAS_SYSTEM')}
            className={`px-3 py-1 text-xs font-bold font-mono transition-all cursor-pointer ${
              activeDomain === 'REGAS_SYSTEM'
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
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                tankSubTab === 'TANK_OVERVIEW' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              ISO TK Position
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('LAYDOWN_1_2_LOG')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                tankSubTab === 'LAYDOWN_1_2_LOG' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              ISO TK - LOG
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('ACTIVE_BAY_TANKS')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                tankSubTab === 'ACTIVE_BAY_TANKS' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              ORU ( ISO TK - SKID )
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('LAYDOWN_3_HEEL')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                tankSubTab === 'LAYDOWN_3_HEEL' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              ORU ( LD - 2 )
            </button>

            <button
              type="button"
              onClick={() => setTankSubTab('TANK_MASS_BALANCE')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                tankSubTab === 'TANK_MASS_BALANCE' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
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
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                regasSubTab === 'GAS_PROCESS_TELEMETRY' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              GAS PROCESS
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('GC_GAS_QUALITY')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                regasSubTab === 'GC_GAS_QUALITY' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              GAS METERING - LOG
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('GAS_METERING_LEDGER')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                regasSubTab === 'GAS_METERING_LEDGER' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              GAS METERING (LEDGER)
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('PLTMG_POWER_OUTPUT')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                regasSubTab === 'PLTMG_POWER_OUTPUT' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
            >
              PLTMG POWER
            </button>

            <button
              type="button"
              onClick={() => setRegasSubTab('CUSTODY_HEAT_SETTLEMENT')}
              className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${
                regasSubTab === 'CUSTODY_HEAT_SETTLEMENT' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
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
          linkedArunBaseline={linkedArunBaseline}
          zoneStats={zoneStats}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 4: ORU ( LD - 2 ) - DUAL PANEL STAGING & BACKHAUL */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'LAYDOWN_3_HEEL' && (() => {
        const yard2TanksList = zoneStats.yard2.tanks;
        const avgHeelPct = yard2TanksList.length > 0
          ? (yard2TanksList.reduce((acc, t) => acc + (t.levelPercent || 4.0), 0) / yard2TanksList.length).toFixed(1)
          : '4.0';
        const loadedCount = selectedBackhaulTanks.size > 0 ? selectedBackhaulTanks.size : yard2TanksList.length;
        const totalHeelKg = yard2TanksList.reduce((acc, t) => acc + Math.round(((t.levelPercent || 4.0) / 100) * 18200), 0);
        const totalHeelTon = (totalHeelKg / 1000).toFixed(2);

        return (
          <div className="space-y-4 animate-in fade-in duration-200 font-mono">
            {/* Top Control & KPI Dashboard (SCADA Header Theme - Clean without Emojis) */}
            <div className="bg-[#0a2540] text-white p-3.5 rounded-t border-b border-[#071a2e] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>ORU ( LD - 2 ) : HEEL STAGING &amp; BACKHAUL CLEARANCE</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAuthorizeBackhaul}
                  disabled={selectedBackhaulTanks.size === 0}
                  className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xs border-t border-l border-b-2 border-r-2 shadow-xs select-none transition-all font-mono ${
                    selectedBackhaulTanks.size > 0
                      ? 'bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white border-purple-300 border-b-purple-950 border-r-purple-950 cursor-pointer'
                      : 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Ship className="w-4 h-4" />
                  <span>Authorize MV. Saviour Backhaul ({selectedBackhaulTanks.size} Tanks)</span>
                </button>
              </div>
            </div>

            {/* Inner Sub-Tab Switching Bar (Clean without Emojis) */}
            <div className="flex items-center gap-1 border-b-2 border-[#1e293b] pb-0 px-1 pt-1 bg-[#dfdbd1] rounded-xs select-none">
              <button
                type="button"
                onClick={() => setLd2ViewMode('STAGING_BUFFER')}
                className={`px-4 py-2 font-mono text-xs font-black tracking-wide border-t-2 border-l-2 border-r-2 rounded-t-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  ld2ViewMode === 'STAGING_BUFFER'
                    ? 'bg-[#ece9d8] text-[#002b4d] border-t-white border-l-white border-r-slate-600 shadow-xs -mb-[2px] pb-2.5 z-10'
                    : 'bg-[#d0cbbf] hover:bg-[#dedad0] text-slate-700 border-t-slate-300 border-l-slate-300 border-r-slate-500'
                }`}
              >
                <span>[1] STAGING BUFFER</span>
              </button>

              <button
                type="button"
                onClick={() => setLd2ViewMode('SHIPPING_REPORT')}
                className={`px-4 py-2 font-mono text-xs font-black tracking-wide border-t-2 border-l-2 border-r-2 rounded-t-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  ld2ViewMode === 'SHIPPING_REPORT'
                    ? 'bg-[#ece9d8] text-[#002b4d] border-t-white border-l-white border-r-slate-600 shadow-xs -mb-[2px] pb-2.5 z-10'
                    : 'bg-[#d0cbbf] hover:bg-[#dedad0] text-slate-700 border-t-slate-300 border-l-slate-300 border-r-slate-500'
                }`}
              >
                <span>[2] BACKHAUL MANIFEST &amp; SHIPPING REPORT</span>
              </button>
            </div>

            {/* ==================================================================== */}
            {/* VIEW MODE 1: 50% : 50% SPLIT (LD-2 STAGING BUFFER vs M.V. SAVIOUR)  */}
            {/* ==================================================================== */}
            {ld2ViewMode === 'STAGING_BUFFER' && (() => {
              const ld2BufferTanks = yard2TanksList.filter((t) => !selectedBackhaulTanks.has(t.id));
              const mvSaviourTanks = yard2TanksList.filter((t) => selectedBackhaulTanks.has(t.id));

              return (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {/* 4 SCADA KPI Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">TOTAL HEEL BUFFER</span>
                      <div className="flex items-baseline gap-1.5 my-0.5">
                        <span className="font-mono text-xl font-black text-slate-900">{yard2TanksList.length}</span>
                        <span className="text-xs font-bold text-slate-600">/ 16 SLOTS</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold truncate">Depleted &amp; Ready for Return</span>
                    </div>

                    <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">AVG RESIDUAL HEEL</span>
                      <div className="flex items-baseline gap-1.5 my-0.5">
                        <span className="font-mono text-xl font-black text-[#0055aa]">1.0 m³</span>
                        <span className="text-xs font-bold text-slate-600">(~445 kg / {avgHeelPct}%)</span>
                      </div>
                      <span className="text-[9px] text-emerald-700 font-bold truncate">Cold heel preserved</span>
                    </div>

                    <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">AVG HOLDING PRESSURE</span>
                      <div className="flex items-baseline gap-1.5 my-0.5">
                        <span className="font-mono text-xl font-black text-slate-900">{zoneStats.yard2.avgPress.toFixed(2)}</span>
                        <span className="text-xs font-bold text-slate-600">MPa</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold truncate">Safe marine transit margin</span>
                    </div>

                    <div className="bg-[#f3e8ff] border border-[#c084fc] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-tighter">LOADED ON M.V. SAVIOUR</span>
                      <div className="flex items-baseline gap-1.5 my-0.5">
                        <span className="font-mono text-xl font-black text-purple-950">{selectedBackhaulTanks.size}</span>
                        <span className="text-xs font-bold text-purple-700">of {yard2TanksList.length}</span>
                      </div>
                      <span className="text-[9px] text-purple-700 font-bold truncate">Voyage 02 (Arun Return)</span>
                    </div>
                  </div>

                  {/* 50% : 50% Dual Panel Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* [LEFT PANEL: LAYDOWN YARD 2 (STAGING BUFFER)] */}
                    <div
                      className={`bg-[#dfdbd1] border-2 rounded-xs p-3 shadow-inner flex flex-col justify-between transition-colors ${
                        dragOverTarget === 'LD2' ? 'border-amber-500 bg-[#ebd9c2]' : 'border-[#8a8579]'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTarget('LD2');
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget === 'LD2') setDragOverTarget(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const tankId = e.dataTransfer.getData('text/plain') || draggingTankNo;
                        if (tankId && selectedBackhaulTanks.has(tankId)) {
                          setSelectedBackhaulTanks((prev) => {
                            const next = new Set(prev);
                            next.delete(tankId);
                            return next;
                          });
                          setToastMessage(`📦 ${tankId} returned to LD-2 Staging Buffer`);
                          setTimeout(() => setToastMessage(null), 2500);
                        }
                        setDraggingTankNo(null);
                        setDragOverTarget(null);
                      }}
                    >
                      {/* Header */}
                      <div className="bg-[#4e5d6e] text-white p-2.5 -mx-3 -mt-3 mb-3 rounded-t-xs border-b-2 border-[#334155] flex flex-wrap justify-between items-center gap-2 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
                            ORU LAYDOWN YARD 2 (STAGING BUFFER)
                          </span>
                          <span className="bg-[#002b4d] text-cyan-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs border border-blue-900 shadow-xs">
                            OCCUPIED: {ld2BufferTanks.length} / 16
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBackhaulTanks(new Set(yard2TanksList.map((t) => t.id)));
                              setToastMessage('🚢 All tanks selected & loaded to M.V. SAVIOUR');
                              setTimeout(() => setToastMessage(null), 2500);
                            }}
                            className="px-2.5 py-1 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-[11px] rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono"
                          >
                            SELECT ALL (LOAD ALL)
                          </button>
                        </div>
                      </div>

                      {/* Grid for LD-2 Staged Tanks (2 Columns) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Array.from({ length: Math.max(16, yard2TanksList.length) }).map((_, slotIdx) => {
                          const slotNum = slotIdx + 1;
                          const tank = ld2BufferTanks[slotIdx];

                          if (tank) {
                            const massKg = Math.round(((tank.levelPercent || 4.0) / 100) * 18200);
                            const volM3 = (((tank.levelPercent || 4.0) / 100) * 44.0).toFixed(1);

                            return (
                              <div
                                key={tank.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', tank.id);
                                  setDraggingTankNo(tank.id);
                                }}
                                onDragEnd={() => {
                                  setDraggingTankNo(null);
                                  setDragOverTarget(null);
                                }}
                                className="relative p-2.5 pb-2 flex flex-col justify-between gap-1.5 rounded-xs border-2 border-[#64748b] bg-gradient-to-b from-[#e8edf2] to-[#dbe2ea] hover:border-[#0055aa] select-none shadow-md transition-all cursor-grab active:cursor-grabbing"
                                style={{
                                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px rgba(0,0,0,0.12)',
                                }}
                              >
                                {/* 4 Corner Bolt Casting Marks */}
                                <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-tl-xs pointer-events-none" />
                                <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-tr-xs pointer-events-none" />
                                <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-bl-xs pointer-events-none" />
                                <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-br-xs pointer-events-none" />

                                {/* Top Header Row */}
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-bold text-slate-600 truncate">
                                      {tank.serialNo || `SIMU-82020${slotNum}`}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded-xs text-[9px] font-black font-mono">
                                      HEEL 1.0m³
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-sm font-black font-mono text-[#0055aa] tracking-tight">
                                      {tank.id}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 rounded-xs text-[9px] font-bold font-mono">
                                      2026-08-28 | D+2
                                    </span>
                                  </div>
                                </div>

                                {/* 3D ISO Tank Graphic */}
                                <div className="relative w-full h-[64px] flex items-center justify-center bg-slate-200/70 rounded-xs border border-slate-300/90 p-1 shadow-inner my-0.5 pointer-events-none">
                                  <svg viewBox="0 0 420 86" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id={`tankVessel-ld2-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#f8fafc" />
                                        <stop offset="50%" stopColor="#cbd5e1" />
                                        <stop offset="100%" stopColor="#94a3b8" />
                                      </linearGradient>
                                      <linearGradient id={`gasVaporBg-ld2-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#f1f5f9" />
                                        <stop offset="60%" stopColor="#e2e8f0" />
                                        <stop offset="100%" stopColor="#cbd5e1" />
                                      </linearGradient>
                                      <linearGradient id={`liquidFill-ld2-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="50%" stopColor="#0284c7" />
                                        <stop offset="100%" stopColor="#0369a1" />
                                      </linearGradient>
                                      <pattern id={`gasPattern-ld2-buf-${tank.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                                        <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.75" strokeOpacity="0.3" />
                                      </pattern>
                                      <clipPath id={`innerWindowClip-ld2-buf-${tank.id}`}>
                                        <rect x="58" y="14" width="304" height="58" rx="8" />
                                      </clipPath>
                                    </defs>

                                    <line x1="28" y1="12" x2="392" y2="12" stroke="#475569" strokeWidth="2.5" />
                                    <line x1="28" y1="74" x2="392" y2="74" stroke="#475569" strokeWidth="3" />
                                    <rect x="24" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                                    <rect x="22" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <rect x="22" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <rect x="388" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                                    <rect x="386" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <rect x="386" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <path d="M 58 14 C 28 14, 28 72, 58 72 Z" fill={`url(#tankVessel-ld2-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                                    <path d="M 362 14 C 392 14, 392 72, 362 72 Z" fill={`url(#tankVessel-ld2-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                                    <rect x="56" y="12" width="308" height="62" fill={`url(#tankVessel-ld2-buf-${tank.id})`} stroke="#475569" strokeWidth="1.5" />

                                    <rect x="58" y="14" width="304" height="58" rx="8" fill="#f1f5f9" stroke="#0284c7" strokeWidth="1.5" />
                                    <g clipPath={`url(#innerWindowClip-ld2-buf-${tank.id})`}>
                                      <rect x="58" y="14" width="304" height="58" fill={`url(#gasVaporBg-ld2-buf-${tank.id})`} />
                                      <rect x="58" y="14" width="304" height="58" fill={`url(#gasPattern-ld2-buf-${tank.id})`} />
                                      <text x="70" y="25" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="0.8">GAS / VAPOR (BOG)</text>
                                      <text x="350" y="25" textAnchor="end" fill="#64748b" fontSize="7.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.5">HEADSPACE</text>

                                      {(() => {
                                        const fillHeight = Math.max(4, ((tank.levelPercent || 4) / 100) * 58);
                                        const fillY = 72 - fillHeight;
                                        return (
                                          <g>
                                            <rect x="58" y={fillY} width="304" height={fillHeight} fill={`url(#liquidFill-ld2-buf-${tank.id})`} />
                                            <path d={`M 58 ${fillY} Q 134 ${fillY - 2}, 210 ${fillY} T 362 ${fillY}`} fill="none" stroke="#bae6fd" strokeWidth="2" strokeOpacity="0.95" />
                                          </g>
                                        );
                                      })()}
                                    </g>

                                    <text
                                      x="210"
                                      y="49"
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      fill="#002b4d"
                                      fontSize="16"
                                      fontWeight="900"
                                      fontFamily="monospace"
                                      letterSpacing="0.5"
                                      style={{
                                        paintOrder: 'stroke fill',
                                        stroke: '#ffffff',
                                        strokeWidth: '1.5px',
                                        strokeLinejoin: 'round',
                                      }}
                                    >
                                      {(tank.levelPercent || 4.0).toFixed(1)}%
                                    </text>
                                  </svg>
                                </div>

                                {/* Bottom Telemetry Data Matrix */}
                                <div className="border border-slate-300 rounded-xs bg-white grid grid-cols-4 divide-x divide-slate-200 py-1 px-0.5 text-center shadow-2xs">
                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                                      {(tank.pressureMpa || 0.22).toFixed(2)}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">MPa</span>
                                  </div>

                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                                      {(tank.tempC ?? -135.0).toFixed(1)}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">°C</span>
                                  </div>

                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-[#0055aa] leading-tight">
                                      {volM3}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">m³</span>
                                  </div>

                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                                      {massKg}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">kg</span>
                                  </div>
                                </div>

                                {/* Action Footer */}
                                <div className="flex items-center gap-1.5 pt-1 border-t border-[#c8c2b5]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBackhaulTanks((prev) => new Set([...prev, tank.id]));
                                      setToastMessage(`🚢 ${tank.id} loaded to M.V. SAVIOUR deck`);
                                      setTimeout(() => setToastMessage(null), 2500);
                                    }}
                                    className="flex-1 py-1 bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white font-bold text-[10px] rounded-xs border-t border-l border-purple-300 border-b-2 border-r-2 border-purple-950 shadow-xs cursor-pointer select-none font-mono text-center flex items-center justify-center gap-1"
                                  >
                                    <span>→ LOAD TO VESSEL</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenLd2VentModal(tank)}
                                    className="px-2.5 py-1 bg-[#002b4d] hover:bg-[#003e70] active:bg-[#001f38] text-white font-bold text-[10px] rounded-xs border-t border-l border-blue-400 border-b-2 border-r-2 border-blue-950 shadow-xs cursor-pointer select-none font-mono whitespace-nowrap"
                                  >
                                    LOG / VENT
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // Empty Staging Buffer Slot
                          return (
                            <div
                              key={`empty-ld2-slot-${slotIdx}`}
                              className="min-h-[175px] p-3 flex flex-col items-center justify-center gap-1 text-center rounded-xs border-2 border-dashed border-[#b0aaa0] bg-[#e8e4dc]/60 text-slate-500 shadow-inner select-none"
                            >
                              <span className="text-xs font-mono font-bold text-slate-700">
                                SLOT-{String(slotNum).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Standby - Empty Buffer
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* [RIGHT PANEL: M.V. SAVIOUR (BACKHAUL VESSEL DECK)] */}
                    <div
                      className={`bg-[#d7dfdb] border-2 rounded-xs p-3 shadow-inner flex flex-col justify-between transition-colors ${
                        dragOverTarget === 'SAVIOUR' ? 'border-purple-600 bg-[#e6daf2]' : 'border-[#71887e]'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTarget('SAVIOUR');
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget === 'SAVIOUR') setDragOverTarget(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const tankId = e.dataTransfer.getData('text/plain') || draggingTankNo;
                        if (tankId && !selectedBackhaulTanks.has(tankId)) {
                          setSelectedBackhaulTanks((prev) => new Set([...prev, tankId]));
                          setToastMessage(`🚢 ${tankId} loaded onto M.V. SAVIOUR deck`);
                          setTimeout(() => setToastMessage(null), 2500);
                        }
                        setDraggingTankNo(null);
                        setDragOverTarget(null);
                      }}
                    >
                      {/* Header */}
                      <div className="bg-[#4e5d6e] text-white p-2.5 -mx-3 -mt-3 mb-3 rounded-t-xs border-b-2 border-[#334155] flex flex-wrap justify-between items-center gap-2 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
                            M.V. SAVIOUR (VOY-2026-08 DECK)
                          </span>
                          <span className="bg-[#064e3b] text-emerald-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs border border-emerald-900 shadow-xs">
                            LOADED: {mvSaviourTanks.length} / 16
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBackhaulTanks(new Set());
                              setToastMessage('📦 All tanks returned to LD-2 Staging Buffer');
                              setTimeout(() => setToastMessage(null), 2500);
                            }}
                            disabled={mvSaviourTanks.length === 0}
                            className={`px-2.5 py-1 font-bold text-[11px] rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs select-none font-mono ${
                              mvSaviourTanks.length > 0
                                ? 'bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white border-[#fc8181] border-b-[#742a2a] border-r-[#742a2a] cursor-pointer'
                                : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
                            }`}
                          >
                            RESET (UNLOAD ALL)
                          </button>
                        </div>
                      </div>

                      {/* Grid for M.V. Saviour Deck Slots (2 Columns) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Array.from({ length: Math.max(16, yard2TanksList.length) }).map((_, slotIdx) => {
                          const slotNum = slotIdx + 1;
                          const tank = mvSaviourTanks[slotIdx];

                          if (tank) {
                            const massKg = Math.round(((tank.levelPercent || 4.0) / 100) * 18200);
                            const volM3 = (((tank.levelPercent || 4.0) / 100) * 44.0).toFixed(1);

                            return (
                              <div
                                key={tank.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', tank.id);
                                  setDraggingTankNo(tank.id);
                                }}
                                onDragEnd={() => {
                                  setDraggingTankNo(null);
                                  setDragOverTarget(null);
                                }}
                                className="relative p-2.5 pb-2 flex flex-col justify-between gap-1.5 rounded-xs border-2 border-purple-600 bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] ring-2 ring-purple-500 select-none shadow-md transition-all cursor-grab active:cursor-grabbing"
                                style={{
                                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px rgba(0,0,0,0.12)',
                                }}
                              >
                                {/* 4 Corner Bolt Casting Marks */}
                                <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-tl-xs pointer-events-none" />
                                <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-tr-xs pointer-events-none" />
                                <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-bl-xs pointer-events-none" />
                                <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-br-xs pointer-events-none" />

                                {/* Top Header Row */}
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-bold text-slate-600 truncate">
                                      {tank.serialNo || `SIMU-82020${slotNum}`}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xs text-[9px] font-black font-mono">
                                      LOADED ON DECK
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-sm font-black font-mono text-purple-950 tracking-tight">
                                      {tank.id}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-purple-200 text-purple-900 border border-purple-300 rounded-xs text-[9px] font-bold font-mono">
                                      DECK SLOT-{String(slotNum).padStart(2, '0')}
                                    </span>
                                  </div>
                                </div>

                                {/* 3D ISO Tank Graphic with Marine Deck theme */}
                                <div className="relative w-full h-[64px] flex items-center justify-center bg-slate-200/70 rounded-xs border border-slate-300/90 p-1 shadow-inner my-0.5 pointer-events-none">
                                  <svg viewBox="0 0 420 86" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id={`tankVessel-sav-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#f8fafc" />
                                        <stop offset="50%" stopColor="#cbd5e1" />
                                        <stop offset="100%" stopColor="#94a3b8" />
                                      </linearGradient>
                                      <linearGradient id={`gasVaporBg-sav-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#f1f5f9" />
                                        <stop offset="60%" stopColor="#e2e8f0" />
                                        <stop offset="100%" stopColor="#cbd5e1" />
                                      </linearGradient>
                                      <linearGradient id={`liquidFill-sav-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="50%" stopColor="#0284c7" />
                                        <stop offset="100%" stopColor="#0369a1" />
                                      </linearGradient>
                                      <pattern id={`gasPattern-sav-buf-${tank.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                                        <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.75" strokeOpacity="0.3" />
                                      </pattern>
                                      <clipPath id={`innerWindowClip-sav-buf-${tank.id}`}>
                                        <rect x="58" y="14" width="304" height="58" rx="8" />
                                      </clipPath>
                                    </defs>

                                    <line x1="28" y1="12" x2="392" y2="12" stroke="#475569" strokeWidth="2.5" />
                                    <line x1="28" y1="74" x2="392" y2="74" stroke="#475569" strokeWidth="3" />
                                    <rect x="24" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                                    <rect x="22" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <rect x="22" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <rect x="388" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                                    <rect x="386" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <rect x="386" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                                    <path d="M 58 14 C 28 14, 28 72, 58 72 Z" fill={`url(#tankVessel-sav-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                                    <path d="M 362 14 C 392 14, 392 72, 362 72 Z" fill={`url(#tankVessel-sav-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                                    <rect x="56" y="12" width="308" height="62" fill={`url(#tankVessel-sav-buf-${tank.id})`} stroke="#475569" strokeWidth="1.5" />

                                    <rect x="58" y="14" width="304" height="58" rx="8" fill="#f1f5f9" stroke="#0284c7" strokeWidth="1.5" />
                                    <g clipPath={`url(#innerWindowClip-sav-buf-${tank.id})`}>
                                      <rect x="58" y="14" width="304" height="58" fill={`url(#gasVaporBg-sav-buf-${tank.id})`} />
                                      <rect x="58" y="14" width="304" height="58" fill={`url(#gasPattern-sav-buf-${tank.id})`} />
                                      <text x="70" y="25" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="0.8">GAS / VAPOR (BOG)</text>
                                      <text x="350" y="25" textAnchor="end" fill="#64748b" fontSize="7.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.5">HEADSPACE</text>

                                      {(() => {
                                        const fillHeight = Math.max(4, ((tank.levelPercent || 4) / 100) * 58);
                                        const fillY = 72 - fillHeight;
                                        return (
                                          <g>
                                            <rect x="58" y={fillY} width="304" height={fillHeight} fill={`url(#liquidFill-sav-buf-${tank.id})`} />
                                            <path d={`M 58 ${fillY} Q 134 ${fillY - 2}, 210 ${fillY} T 362 ${fillY}`} fill="none" stroke="#bae6fd" strokeWidth="2" strokeOpacity="0.95" />
                                          </g>
                                        );
                                      })()}
                                    </g>

                                    <text
                                      x="210"
                                      y="49"
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      fill="#002b4d"
                                      fontSize="16"
                                      fontWeight="900"
                                      fontFamily="monospace"
                                      letterSpacing="0.5"
                                      style={{
                                        paintOrder: 'stroke fill',
                                        stroke: '#ffffff',
                                        strokeWidth: '1.5px',
                                        strokeLinejoin: 'round',
                                      }}
                                    >
                                      {(tank.levelPercent || 4.0).toFixed(1)}%
                                    </text>
                                  </svg>
                                </div>

                                {/* Bottom Telemetry Data Matrix */}
                                <div className="border border-purple-300 rounded-xs bg-white grid grid-cols-4 divide-x divide-purple-200 py-1 px-0.5 text-center shadow-2xs">
                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                                      {(tank.pressureMpa || 0.22).toFixed(2)}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">MPa</span>
                                  </div>

                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                                      {(tank.tempC ?? -135.0).toFixed(1)}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">°C</span>
                                  </div>

                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-purple-900 leading-tight">
                                      {volM3}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">m³</span>
                                  </div>

                                  <div className="flex flex-col items-center justify-center px-0.5">
                                    <span className="font-mono text-[11px] font-bold text-purple-950 leading-tight">
                                      {massKg}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">kg</span>
                                  </div>
                                </div>

                                {/* Action Footer */}
                                <div className="flex items-center gap-1.5 pt-1 border-t border-purple-300">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBackhaulTanks((prev) => {
                                        const next = new Set(prev);
                                        next.delete(tank.id);
                                        return next;
                                      });
                                      setToastMessage(`📦 ${tank.id} returned to LD-2 Staging Buffer`);
                                      setTimeout(() => setToastMessage(null), 2500);
                                    }}
                                    className="flex-1 py-1 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-[10px] rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono text-center flex items-center justify-center gap-1"
                                  >
                                    <span>← UNLOAD TO LD-2</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenLd2VentModal(tank)}
                                    className="px-2.5 py-1 bg-[#002b4d] hover:bg-[#003e70] active:bg-[#001f38] text-white font-bold text-[10px] rounded-xs border-t border-l border-blue-400 border-b-2 border-r-2 border-blue-950 shadow-xs cursor-pointer select-none font-mono whitespace-nowrap"
                                  >
                                    LOG / VENT
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // Empty Deck Slot (Drop Target)
                          return (
                            <div
                              key={`empty-sav-slot-${slotIdx}`}
                              className="min-h-[175px] p-3 flex flex-col items-center justify-center gap-1 text-center rounded-xs border-2 border-dashed border-[#71887e] bg-[#d7dfdb]/60 text-slate-600 shadow-inner select-none hover:bg-emerald-50/60 transition-colors"
                            >
                              <span className="text-xs font-mono font-bold text-slate-700">
                                DECK SLOT-{String(slotNum).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Drop ISO Tank Here / Empty Deck Slot
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ==================================================================== */}
            {/* VIEW MODE 2: BACKHAUL MANIFEST & SHIPPING REPORT                     */}
            {/* ==================================================================== */}
            {ld2ViewMode === 'SHIPPING_REPORT' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* [상단 VOYAGE SUMMARY 패널] */}
                <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs p-3.5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#c8c2b5] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Ship className="w-5 h-5 text-[#0055aa]" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#002b4d] font-mono">
                        BACKHAUL MARINE VOYAGE MANIFEST SUMMARY
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportShippingReport}
                      className="px-4 py-1.5 bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white font-bold text-xs rounded-xs border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs cursor-pointer select-none font-mono flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>EXPORT MANIFEST (EXCEL / CSV)</span>
                    </button>
                  </div>

                  {/* 5 Summary KPI Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">VESSEL</span>
                      <span className="text-xs font-black text-slate-900 font-mono">M.V. SAVIOUR</span>
                    </div>

                    <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">VOYAGE</span>
                      <span className="text-xs font-black text-slate-900 font-mono truncate block">VOY-2026-08 (ARUN)</span>
                    </div>

                    <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">LOADING DATE</span>
                      <span className="text-xs font-black text-slate-900 font-mono">2026-08-30</span>
                    </div>

                    <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">TOTAL LOADED</span>
                      <span className="text-xs font-black text-purple-950 font-mono">
                        {loadedCount} / {yard2TanksList.length} Tanks
                      </span>
                    </div>

                    <div className="bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs p-2 shadow-inner text-center">
                      <span className="text-[10px] font-bold text-[#004a99] uppercase block">TOTAL HEEL MASS</span>
                      <span className="text-sm font-black text-[#004a99] font-mono">
                        {totalHeelTon} Ton ({totalHeelKg.toLocaleString()} kg)
                      </span>
                    </div>
                  </div>
                </div>

                {/* [선적 마스터 테이블 - 2단 슬레이트 SCADA 스타일] */}
                <div className="bg-white border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-md">
                  <div className="overflow-x-auto custom-scada-scrollbar">
                    <table className="w-full text-xs text-center border-collapse font-mono">
                      {/* 1행: 4대 그룹 헤더 */}
                      <thead>
                        <tr className="bg-[#4e5d6e] text-white font-extrabold uppercase text-[11px] tracking-wider border-b border-[#334155]">
                          <th colSpan={3} className="py-2 px-2 border-r border-[#64748b] bg-[#3e4d5e]">
                            [1] IDENTIFICATION
                          </th>
                          <th colSpan={2} className="py-2 px-2 border-r border-[#64748b] bg-[#475768]">
                            [2] STAGING HISTORY
                          </th>
                          <th colSpan={4} className="py-2 px-2 border-r border-[#64748b] bg-[#3a506b]">
                            [3] FINAL TELEMETRY (RESIDUAL HEEL)
                          </th>
                          <th colSpan={4} className="py-2 px-2 bg-[#3e4d5e]">
                            [4] CLEARANCE &amp; CERTIFICATION
                          </th>
                        </tr>

                        {/* 2행: 세부 컬럼 헤더 */}
                        <tr className="bg-[#5f6f82] text-[#f1f5f9] font-bold text-[10px] tracking-tight border-b-2 border-[#334155] select-none">
                          {/* Identification */}
                          <th className="py-2 px-2 border-r border-[#718096] w-10">NO</th>
                          <th className="py-2 px-2 border-r border-[#718096]">TANK ID</th>
                          <th className="py-2 px-2 border-r border-[#718096]">SERIAL NO</th>

                          {/* Staging History */}
                          <th className="py-2 px-2 border-r border-[#718096]">SKID UNMOUNT DATE</th>
                          <th className="py-2 px-2 border-r border-[#718096]">LD-2 DURATION</th>

                          {/* Final Telemetry */}
                          <th className="py-2 px-2 border-r border-[#718096]">FINAL PRESS (MPa)</th>
                          <th className="py-2 px-2 border-r border-[#718096]">TEMP (°C)</th>
                          <th className="py-2 px-2 border-r border-[#718096]">HEEL LEVEL (%)</th>
                          <th className="py-2 px-2 border-r border-[#718096] bg-[#355375] text-cyan-200">
                            CALC MASS (kg)
                          </th>

                          {/* Clearance */}
                          <th className="py-2 px-2 border-r border-[#718096]">BOG VENT DONE</th>
                          <th className="py-2 px-2 border-r border-[#718096]">SAFETY SEAL NO</th>
                          <th className="py-2 px-2 border-r border-[#718096]">INSPECTOR SIGN</th>
                          <th className="py-2 px-2">STATUS</th>
                        </tr>
                      </thead>

                      {/* 테이블 본문 */}
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {yard2TanksList.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="py-8 text-center text-slate-500 font-bold">
                              No empty heel tanks staged in Laydown Yard 2.
                            </td>
                          </tr>
                        ) : (
                          yard2TanksList.map((tank, idx) => {
                            const isSelected = selectedBackhaulTanks.has(tank.id);
                            const massKg = Math.round(((tank.levelPercent || 4.0) / 100) * 18200);
                            const isEven = idx % 2 === 0;

                            return (
                              <tr
                                key={tank.id}
                                className={`hover:bg-amber-50 transition-colors font-mono ${
                                  isEven ? 'bg-[#faf9f6]' : 'bg-white'
                                }`}
                              >
                                {/* Identification */}
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-2 border-r border-slate-200 font-black text-[#0055aa]">
                                  {tank.id}
                                </td>
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-700">
                                  {tank.serialNo || `SIMU-82020${idx + 1}`}
                                </td>

                                {/* Staging History */}
                                <td className="py-2.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                                  2026-08-28 14:30
                                </td>
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-800">
                                  2 Days (48h)
                                </td>

                                {/* Final Telemetry */}
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                                  {(tank.pressureMpa || 0.22).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                                  {(tank.tempC ?? -135.0).toFixed(1)}
                                </td>
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-[#0055aa]">
                                  {(tank.levelPercent || 4.0).toFixed(1)}%
                                </td>
                                <td
                                  className="py-2.5 px-2 border-r border-slate-200 font-black text-[#004a99]"
                                  style={{ backgroundColor: '#f0f7ff' }}
                                >
                                  {massKg.toLocaleString()} kg
                                </td>

                                {/* Clearance */}
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-emerald-700">
                                  Y (0.22 MPa)
                                </td>
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-600">
                                  SL-8842-N{String(idx + 1).padStart(2, '0')}
                                </td>
                                <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-700">
                                  FIELD OP-1 / CHIEF
                                </td>
                                <td className="py-2.5 px-2">
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-black rounded-xs text-[10px] shadow-2xs">
                                    LOADED
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
      {quickMountTankNo && (
        <div className="fixed inset-0 z-50 win-panel/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-md w-full p-6 shadow-none animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-slate-950 font-bold" />
                Mount {quickMountTankNo} to Vaporizer Bay
              </h3>
              <button onClick={() => setQuickMountTankNo(null)} className="text-slate-950 font-bold hover:text-slate-950">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-950 font-bold mb-4">
              Choose which vaporizer bay to hook up {quickMountTankNo}:
            </p>

            <div className="space-y-2 mb-6">
              {activeBays.map((bay) => (
                <div
                  key={bay.bayId}
                  onClick={() => {
                    mountTankToBay(bay.bayId, quickMountTankNo);
                    setQuickMountTankNo(null);
                    setToastMessage(`Mounted ${quickMountTankNo} to ${bay.bayId}`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="p-3 rounded-none win-panel border border-slate-200 hover:border-amber-500 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-950 font-bold block">{bay.bayId}</span>
                    <span className="text-[10px] text-slate-950 font-bold">
                      {bay.tankNo ? `Current: ${bay.tankNo} (${bay.status})` : 'Available (Empty)'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      bay.status === 'RUNNING'
                        ? 'bg-amber-500/20 text-white font-bold border-amber-200'
                        : 'bg-emerald-500/20 text-white font-bold border-emerald-200'
                    }`}
                  >
                    {bay.status === 'RUNNING' ? 'In Use' : 'Ready'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setQuickMountTankNo(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mount Modal (From Bay card) */}
      {mountModalBayId && (
        <div className="fixed inset-0 z-50 win-panel/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-lg w-full p-6 shadow-none animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-slate-950 font-bold" />
                Mount ISO Tank to {mountModalBayId}
              </h3>
              <button
                onClick={() => setMountModalBayId(null)}
                className="text-slate-950 font-bold hover:text-slate-950"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-950 font-bold mb-4">
              Select an available ISO Tank from Nias Laydown Yard (Ready for Mount) or Yard 1/2:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-6">
              {allLaydownTanks.map((tank) => (
                <div
                  key={tank.id}
                  onClick={() => {
                    mountTankToBay(mountModalBayId, tank.id);
                    setMountModalBayId(null);
                  }}
                  className="p-3 rounded-none win-panel border border-slate-200 hover:border-blue-500 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-950 font-bold">{tank.id}</span>
                    <span className="text-xs text-slate-950 font-bold font-mono ml-2">({tank.serialNo})</span>
                    <span className="text-[10px] text-slate-950 font-bold block">{tank.currentZone}</span>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-slate-950 font-bold font-bold block">{tank.levelPercent}% Level</span>
                    <span className="text-slate-950 font-bold">{(tank.pressureMpa || 0).toFixed(2)} MPa</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setMountModalBayId(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Log Bay Consumption Modal */}
      {isConsumptionModalOpen && (
        <div className="fixed inset-0 z-50 win-panel/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-2xl w-full p-6 shadow-none animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-slate-950 font-bold" />
                Log PLTMG Vaporization Consumption (Arun COQ Inherited)
              </h3>
              <button onClick={() => setIsConsumptionModalOpen(false)} className="text-slate-950 font-bold hover:text-slate-950">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConsumptionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Active Regas Bay:</label>
                  <select
                    value={conBayId}
                    onChange={(e) => setConBayId(e.target.value)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-bold cursor-pointer"
                  >
                    <option value="Bay 01">Bay 01</option>
                    <option value="Bay 02">Bay 02</option>
                    <option value="Bay 03">Bay 03</option>
                    <option value="Bay 04">Bay 04</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">ISO Tank No (Mounted):</label>
                  <select
                    value={conTankNo}
                    onChange={(e) => setConTankNo(e.target.value)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold cursor-pointer"
                  >
                    {fleetTanks.map((t) => (
                      <option key={t.tankNo} value={t.tankNo}>
                        {t.tankNo} ({t.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inherited Arun Lab Baseline Badge Card */}
              <div className="p-3.5 win-panel rounded-none border border-blue-500/40 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5 text-slate-950 font-bold font-bold">
                    <FlaskConical className="w-4 h-4" />
                    <span>Inherited Arun Lab Baseline ({conTankNo})</span>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-950 text-slate-950 font-bold px-2 py-0.5 rounded border border-blue-800">
                    Shipment: {linkedArunBaseline.shipment}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-950 font-bold text-[10px] block">Arun Lab GHV:</span>
                    <span className="font-bold text-slate-950 font-bold">{linkedArunBaseline.ghvBtuKg.toLocaleString()} BTU/Kg</span>
                  </div>
                  <div>
                    <span className="text-slate-950 font-bold text-[10px] block">Methane (CH₄):</span>
                    <span className="font-bold text-slate-950 font-bold">{linkedArunBaseline.methaneMolPct}% Mol</span>
                  </div>
                  <div>
                    <span className="text-slate-950 font-bold text-[10px] block">Delivered MMBtu:</span>
                    <span className="font-bold text-slate-950 font-bold">{linkedArunBaseline.deliveredMMBtu.toFixed(2)} MMBtu</span>
                  </div>
                  <div>
                    <span className="text-slate-950 font-bold text-[10px] block">Delivered Weight:</span>
                    <span className="font-bold text-slate-950 font-bold">{linkedArunBaseline.deliveredWeightKg.toLocaleString()} Kg</span>
                  </div>
                </div>
              </div>

              {/* Physical Consumption Measurements */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 win-panel rounded-none border border-slate-200">
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-sans">Consumed Weight (Kg):</label>
                  <input
                    type="number"
                    value={conWeightKg}
                    onChange={(e) => setConWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white shadow-none border border-slate-200 rounded px-2.5 py-1.5 text-slate-950 font-bold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-sans">Consumed Volume (m³):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={conVolumeM3}
                    onChange={(e) => setConVolumeM3(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white shadow-none border border-slate-200 rounded px-2.5 py-1.5 text-slate-950 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-sans">Density (Kg/m³):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={conDensity}
                    onChange={(e) => setConDensity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white shadow-none border border-slate-200 rounded px-2.5 py-1.5 text-slate-950 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-sans">BOG Losses (Kg):</label>
                  <input
                    type="number"
                    value={conLossKg}
                    onChange={(e) => setConLossKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white shadow-none border border-slate-200 rounded px-2.5 py-1.5 text-slate-950 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-sans">BOG Loss Rate (%):</label>
                  <input
                    type="number"
                    disabled
                    value={calculatedLossPct}
                    className="w-full bg-white shadow-none/50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-950 font-bold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-sans">Calculated Consumed:</label>
                  <div className="px-2.5 py-1.5 bg-white shadow-none border border-amber-200 rounded font-mono font-bold text-slate-950 font-bold text-sm">
                    {calculatedConsumedMMBtu} MMBtu
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white shadow-none rounded-none border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-950 font-bold">Formula: (Consumed Kg × Arun GHV) / 1,000,000</span>
                <span className="text-slate-950 font-bold font-bold">
                  ({conWeightKg.toLocaleString()} × {linkedArunBaseline.ghvBtuKg.toLocaleString()}) / 10⁶ = {calculatedConsumedMMBtu} MMBtu
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConsumptionModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-none font-bold shadow-none shadow-amber-500/20"
                >
                  Certify Regas & Auto-Register Settlement ({calculatedConsumedMMBtu} MMBtu)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick MRO Modal */}
      {mroModalTankNo && (
        <div className="fixed inset-0 z-50 win-panel/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-md w-full p-6 shadow-none animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-950 font-bold" />
                Send {mroModalTankNo} to Nias MRO Bay
              </h3>
              <button
                onClick={() => setMroModalTankNo(null)}
                className="text-slate-950 font-bold hover:text-slate-950"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMroSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-950 font-bold mb-1 font-bold">Defect Classification:</label>
                <select
                  value={defectCat}
                  onChange={(e) => setDefectCat(e.target.value as DefectCategory)}
                  className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
                  <option value="VACUUM_LOSS">Vacuum Loss (High BOG / Annular failure)</option>
                  <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
                  <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Corner casting)</option>
                  <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-950 font-bold mb-1 font-bold">Defect Description:</label>
                <textarea
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="Observed leak, pressure rise, or sensor failure..."
                  rows={3}
                  className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMroModalTankNo(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-none font-bold"
                >
                  Route to MRO Bay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Slot Move Pick Modal */}
      {slotMoveModal && (
        <div className="fixed inset-0 z-50 win-panel/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-md w-full p-6 shadow-none animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-950 font-bold" />
                Allocate Tank to {slotMoveModal.targetYard} (Slot {slotMoveModal.slotIndex})
              </h3>
              <button onClick={() => setSlotMoveModal(null)} className="text-slate-950 font-bold hover:text-slate-950">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-950 font-bold mb-4">
              Select an available tank from Nias fleet to move into this slot:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-5 pr-1">
              {allLaydownTanks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    updateTankLog(t.id, { position: slotMoveModal.targetYard });
                    setToastMessage(`Moved ${t.id} to ${slotMoveModal.targetYard}`);
                    setSlotMoveModal(null);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="p-3 rounded-none win-panel border border-slate-200 hover:border-emerald-500 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-950 font-bold">{t.id}</span>
                    <span className="text-xs text-slate-950 font-bold font-mono ml-2">({t.serialNo})</span>
                    <span className="text-[10px] text-slate-950 font-bold block">Current: {t.currentZone}</span>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-slate-950 font-bold font-bold block">{(t.pressureMpa || 0).toFixed(2)} MPa</span>
                    <span className="text-slate-950 font-bold">{t.levelPercent}% Level</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSlotMoveModal(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LD-2 TANK STATUS & BOG VENT DIALOG MODAL (WIDTH: 800px)              */}
      {/* ==================================================================== */}
      {ld2VentModalTank && (() => {
        const calcVol = parseFloat(((ld2ModalLevelMm / 950) * 44.0).toFixed(1));
        const calcMassKg = Math.round(calcVol * 441.0);
        const calcMassTon = parseFloat(((calcVol * 441.0) / 1000).toFixed(2));

        return (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150 font-mono"
            onClick={() => setLd2VentModalTank(null)}
          >
            <div
              className="w-[800px] max-w-[90vw] max-h-[92vh] flex flex-col bg-[#ece9d8] border-2 border-white border-b-2 border-r-2 border-slate-700 shadow-2xl rounded-xs overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#1e293b] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#334155] shadow-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
                    <span>💨</span>
                    <span>LD-2 TANK STATUS &amp; BOG VENT: {ld2VentModalTank.id}</span>
                    <span className="text-amber-300 ml-1 font-bold">(SERIAL: {ld2VentModalTank.serialNo || 'SIMU-820201'})</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setLd2VentModalTank(null)}
                  className="bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white font-bold text-xs px-3.5 py-1.5 rounded-xs border-t border-l border-[#fc8181] border-b-2 border-r-2 border-[#742a2a] shadow-xs cursor-pointer select-none flex items-center gap-1 font-mono"
                >
                  <span>✕ CLOSE</span>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveLd2VentLog} className="p-4 space-y-3.5 overflow-y-auto custom-scada-scrollbar bg-[#f0ede6]">
                {/* Status Info Strip */}
                <div className="bg-[#f4f1ea] border-2 border-[#b0aaa0] rounded-xs p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-inner text-xs">
                  <div>
                    <span className="font-bold text-slate-600 uppercase">ZONE: </span>
                    <span className="font-black text-[#002b4d]">LAYDOWN YARD 2 (ORU LD-2)</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 uppercase">STAGED: </span>
                    <span className="font-bold text-slate-900">2026-08-28 (D+2 Days)</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 uppercase">TARGET: </span>
                    <span className="font-bold text-purple-900">MV. Saviour Backhaul</span>
                  </div>
                </div>

                {/* Section 1: Real-time Gauge Telemetry */}
                <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-3 shadow-xs space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1 flex items-center gap-1.5">
                    <span>[1] PHYSICAL GAUGE MEASUREMENTS &amp; RESIDUAL HEEL</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                        PRESSURE (MPa)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={ld2ModalPress}
                        onChange={(e) => setLd2ModalPress(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                        TEMP (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={ld2ModalTemp}
                        onChange={(e) => setLd2ModalTemp(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                        LEVEL (mmH2O)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={ld2ModalLevelMm}
                        onChange={(e) => setLd2ModalLevelMm(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-[#004a99] uppercase mb-1 truncate text-center">
                        CALC VOL (m³)
                      </label>
                      <div className="h-[30px] bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs px-2 py-1 text-[#004a99] font-black font-mono text-center text-sm shadow-inner flex items-center justify-center">
                        {calcVol.toFixed(1)}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-[#004a99] uppercase mb-1 truncate text-center">
                        CALC MASS (kg)
                      </label>
                      <div className="h-[30px] bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs px-2 py-1 text-[#004a99] font-black font-mono text-center text-sm shadow-inner flex items-center justify-center">
                        {calcMassKg} kg ({calcMassTon} T)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: BOG Venting & Controlled Depressurization Action */}
                <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-3 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#c8c2b5] pb-1">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] flex items-center gap-1.5">
                      <span>[2] BOG VENTING &amp; CONTROLLED DEPRESSURIZATION</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={ld2ModalIsVenting}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setLd2ModalIsVenting(checked);
                          if (checked) {
                            setLd2ModalPreVentPress(ld2ModalPress || 0.70);
                            setLd2ModalPostVentPress(0.22);
                            const deltaP = Math.max(0, (ld2ModalPress || 0.70) - 0.22);
                            setLd2ModalVentKg(Math.round(deltaP * 450));
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 font-mono">Perform BOG Venting</span>
                    </label>
                  </div>

                  {ld2ModalIsVenting ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 animate-in fade-in duration-150">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                          PRE-VENT PRESS (MPa)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ld2ModalPreVentPress}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setLd2ModalPreVentPress(val);
                            const delta = Math.max(0, val - ld2ModalPostVentPress);
                            setLd2ModalVentKg(Math.round(delta * 450));
                          }}
                          className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                          POST-VENT PRESS (MPa)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ld2ModalPostVentPress}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setLd2ModalPostVentPress(val);
                            const delta = Math.max(0, ld2ModalPreVentPress - val);
                            setLd2ModalVentKg(Math.round(delta * 450));
                          }}
                          className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-purple-900 uppercase mb-1 truncate text-center">
                          VENTED BOG AMOUNT (kg)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={ld2ModalVentKg}
                          onChange={(e) => setLd2ModalVentKg(parseFloat(e.target.value) || 0)}
                          className="bg-purple-50 border border-purple-400 rounded-xs px-2 py-1 text-purple-950 font-black font-mono text-center text-sm shadow-inner focus:bg-purple-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#f4f1ea] border border-[#b0aaa0] rounded-xs text-center text-[11px] text-slate-600 font-bold">
                      Holding pressure is within normal safe storage range. Check the box above if controlled venting is required before vessel backhaul.
                    </div>
                  )}
                </div>

                {/* Section 3: Operator Remarks & Inspector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 flex flex-col">
                    <label className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                      OPERATOR REMARKS
                    </label>
                    <input
                      type="text"
                      value={ld2ModalRemarks}
                      onChange={(e) => setLd2ModalRemarks(e.target.value)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2.5 py-1.5 text-slate-950 font-semibold font-mono text-xs shadow-inner focus:bg-amber-50 focus:outline-none"
                      placeholder="Staging inspection notes..."
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                      INSPECTOR
                    </label>
                    <input
                      type="text"
                      value={ld2ModalOperator}
                      onChange={(e) => setLd2ModalOperator(e.target.value)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2.5 py-1.5 text-slate-950 font-semibold font-mono text-xs shadow-inner focus:bg-amber-50 focus:outline-none"
                      placeholder="Operator Name"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end items-center gap-2 pt-2 border-t border-[#c8c2b5]">
                  <button
                    type="button"
                    onClick={() => setLd2VentModalTank(null)}
                    className="h-8 px-4 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-6 bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white font-bold text-xs rounded-xs border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs cursor-pointer select-none font-mono flex items-center gap-1.5"
                  >
                    <span>💾 SAVE STATUS &amp; VENT LOG</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* STAGE 1 MODAL REMOVED - NOW INTEGRATED AS DRAWER */}

      {/* ==================================================================== */}
      {/* STAGE 2: PRE-BACKHAUL DEPARTURE INSPECTION MODAL (Laydown 3 -> Ship) */}
      {/* ==================================================================== */}
      {isBackhaulModalOpen && (
        <div className="fixed inset-0 z-50 win-panel/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-xl w-full p-6 shadow-none animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
                <Ship className="w-5 h-5 text-slate-950 font-bold" />
                Stage 2: Pre-Backhaul Inspection & Marine Manifest
              </h3>
              <button
                onClick={() => setIsBackhaulModalOpen(false)}
                className="text-slate-950 font-bold hover:text-slate-950"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-950 font-bold mb-4">
              Pre-departure inspection for <span className="font-bold text-slate-950 font-bold">{selectedBackhaulTanks.size} selected heel tanks</span> before loading aboard <span className="font-bold text-slate-950 font-bold">{stage2VesselName}</span>:
            </p>

            <form onSubmit={handleBackhaulModalSubmit} className="space-y-4 text-xs">
              {/* Selected Tanks Pill List */}
              <div className="p-3 win-panel rounded-none border border-slate-200">
                <span className="text-[10px] text-slate-950 font-bold uppercase block font-bold mb-1.5">
                  Selected Tanks for Backhaul ({selectedBackhaulTanks.size})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedBackhaulTanks).map((tNo) => (
                    <span
                      key={tNo}
                      className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-slate-950 font-bold font-mono text-[11px] font-bold"
                    >
                      {tNo}
                    </span>
                  ))}
                </div>
              </div>

              {/* Manifest Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Backhaul Manifest No:</label>
                  <input
                    type="text"
                    value={stage2ManifestNo}
                    onChange={(e) => setStage2ManifestNo(e.target.value)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Vessel Assignment:</label>
                  <input
                    type="text"
                    value={stage2VesselName}
                    onChange={(e) => setStage2VesselName(e.target.value)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
                  />
                </div>
              </div>

              {/* Departure Inspection Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Date & Time:</label>
                  <input
                    type="text"
                    value={stage2Date}
                    onChange={(e) => setStage2Date(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Heel Mass (Kg):</label>
                  <input
                    type="number"
                    value={stage2MassKg}
                    onChange={(e) => setStage2MassKg(parseFloat(e.target.value) || 0)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Pressure (MPa):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stage2PressureMPa}
                    onChange={(e) => setStage2PressureMPa(parseFloat(e.target.value) || 0)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Temperature (°C):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={stage2TempC}
                    onChange={(e) => setStage2TempC(parseFloat(e.target.value) || 0)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
                  />
                </div>
              </div>

              {/* Safety Clearance Checklist */}
              <div className="p-3.5 win-panel/80 rounded-none border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-950 font-bold uppercase font-bold block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-950 font-bold" /> Marine Safety Clearance Checklist (IMDG 2.1)
                </span>
                <label className="flex items-center gap-2 text-slate-950 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage2ValvesSealed}
                    onChange={(e) => setStage2ValvesSealed(e.target.checked)}
                    className="rounded bg-white shadow-none border-slate-200 text-slate-950 font-bold focus:ring-purple-500"
                  />
                  <span>Primary liquid & vapor valves closed, capped, and blind flanges tightened</span>
                </label>
                <label className="flex items-center gap-2 text-slate-950 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage2PressureWithinLimit}
                    onChange={(e) => setStage2PressureWithinLimit(e.target.checked)}
                    className="rounded bg-white shadow-none border-slate-200 text-slate-950 font-bold focus:ring-purple-500"
                  />
                  <span>Holding pressure &lt; 0.40 MPa (adequate voyage safety holding margin)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-950 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage2VacuumIntact}
                    onChange={(e) => setStage2VacuumIntact(e.target.checked)}
                    className="rounded bg-white shadow-none border-slate-200 text-slate-950 font-bold focus:ring-purple-500"
                  />
                  <span>Outer jacket vacuum insulation intact (no shell condensation / frost observed)</span>
                </label>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-950 font-bold mb-1 font-bold">Clearance Remarks:</label>
                <input
                  type="text"
                  value={stage2Remarks}
                  onChange={(e) => setStage2Remarks(e.target.value)}
                  className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBackhaulModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!stage2ValvesSealed || !stage2PressureWithinLimit || !stage2VacuumIntact}
                  className={`flex-1 py-2.5 rounded-none font-bold transition-all ${
                    stage2ValvesSealed && stage2PressureWithinLimit && stage2VacuumIntact
                      ? 'bg-purple-600 hover:bg-purple-500 text-slate-950 shadow-none shadow-purple-600/25 cursor-pointer'
                      : 'bg-slate-100 text-slate-950 font-bold cursor-not-allowed'
                  }`}
                >
                  Certify Manifest & Dispatch to Saviour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* METHOD A: INTERACTIVE TANK RELOCATION MODAL / DRAWER (Move Tank)     */}
      {/* ==================================================================== */}
      {relocateModalTank && (
        <div className="fixed inset-0 z-50 win-panel/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-lg w-full p-6 shadow-none animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
                <Repeat className="w-5 h-5 text-slate-950 font-bold" />
                <span>Relocate ISO Tank {relocateModalTank.tankNo}</span>
              </h3>
              <button
                onClick={() => setRelocateModalTank(null)}
                className="text-slate-950 font-bold hover:text-slate-950"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-950 font-bold mb-4">
              Seamlessly reassign vessel <span className="font-bold text-slate-950 font-bold font-mono">{relocateModalTank.tankNo}</span> ({relocateModalTank.serialNo}) across physical terminal lifecycle zones:
            </p>

            <form onSubmit={handleConfirmRelocation} className="space-y-4 text-xs">
              {/* Origin vs Target Preview */}
              <div className="p-3 win-panel rounded-none border border-slate-200 grid grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-[10px] text-slate-950 font-bold uppercase block font-bold">Current Origin</span>
                  <span className="font-bold text-slate-950 font-bold text-xs truncate block">
                    {relocateModalTank.position || 'Nias Yard'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-950 font-bold uppercase block font-bold">Target Destination</span>
                  <span className="font-bold text-slate-950 font-bold text-xs truncate block">
                    {relocateTargetZone} {relocateTargetZone.startsWith('Laydown') ? `(Slot ${relocateSlotNumber})` : ''}
                  </span>
                </div>
              </div>

              {/* Target Destination Selector */}
              <div>
                <label className="block text-slate-950 font-bold mb-1 font-bold">Select Destination Zone / Rack:</label>
                <select
                  value={relocateTargetZone}
                  onChange={(e) => setRelocateTargetZone(e.target.value)}
                  className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-bold cursor-pointer"
                >
                  <optgroup label="Laydown Yards (Terminal Buffer)">
                    <option value="Laydown 1">📥 Laydown Yard 1 (Receiving & BOG Buffer)</option>
                    <option value="Laydown 2">🔄 Laydown Yard 2 (Empty Heel 4% Staging Buffer)</option>
                  </optgroup>
                  <optgroup label="4-Bay Regasification Vaporizer Racks">
                    <option value="Bay 01">🔥 Bay 01 (Vaporizer Rack 1 - Direct PLTMG)</option>
                    <option value="Bay 02">🔥 Bay 02 (Vaporizer Rack 2 - Direct PLTMG)</option>
                    <option value="Bay 03">🔥 Bay 03 (Vaporizer Rack 3 - Direct PLTMG)</option>
                    <option value="Bay 04">🔥 Bay 04 (Vaporizer Rack 4 - Direct PLTMG)</option>
                  </optgroup>
                </select>
              </div>

              {/* Slot Selector (If target is a Yard) */}
              {relocateTargetZone.startsWith('Laydown') && (
                <div>
                  <label className="block text-slate-950 font-bold mb-1 font-bold">Assign Slot Position (1 ~ 12):</label>
                  <select
                    value={relocateSlotNumber}
                    onChange={(e) => setRelocateSlotNumber(parseInt(e.target.value) || 1)}
                    className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold cursor-pointer"
                  >
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        Slot {idx + 1} {idx === 0 ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Laydown Yard 2 Heel Preservation Parameters */}
              {(relocateTargetZone === 'Laydown 2' || relocateTargetZone === 'Laydown 3') && (
                <div className="p-3.5 bg-purple-950/30 border border-purple-500/40 rounded-none space-y-3">
                  <div className="flex items-center gap-2 text-slate-950 font-bold font-bold border-b border-purple-800/60 pb-1.5">
                    <RotateCcw className="w-4 h-4 text-slate-950 font-bold" />
                    <span>Cold Heel 4% Preservation Parameters</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-950 font-bold mb-1 font-bold">Preserved Heel Level (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={relocateHeelPct}
                        onChange={(e) => setRelocateHeelPct(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white shadow-none border border-slate-200 rounded-none px-3 py-1.5 text-slate-950 font-bold font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-950 font-bold mb-1 font-bold">Residual Pressure (MPa):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={relocateHeelPressMPa}
                        onChange={(e) => setRelocateHeelPressMPa(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white shadow-none border border-slate-200 rounded-none px-3 py-1.5 text-slate-950 font-bold font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-950 font-bold mb-1 font-bold">Cryo Temp (°C):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={relocateHeelTempC}
                        onChange={(e) => setRelocateHeelTempC(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white shadow-none border border-slate-200 rounded-none px-3 py-1.5 text-slate-950 font-bold font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-950 font-bold mb-1 font-bold">Heel Mass (Kg):</label>
                      <input
                        type="number"
                        value={relocateHeelWeightKg}
                        onChange={(e) => setRelocateHeelWeightKg(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white shadow-none border border-slate-200 rounded-none px-3 py-1.5 text-slate-950 font-bold font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks Input */}
              <div>
                <label className="block text-slate-950 font-bold mb-1 font-bold">Relocation Remarks / Reason:</label>
                <input
                  type="text"
                  placeholder="e.g. Staged for peak evening load / Venting boil-off gas"
                  value={relocateRemarks}
                  onChange={(e) => setRelocateRemarks(e.target.value)}
                  className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-sans"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRelocateModalTank(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-none font-bold shadow-none shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Relocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TANK DETAIL & STATE SCADA MODAL (PAGT/NIAS SCADA NAVY/BEIGE WINDOW THEME)  */}
      {/* ========================================================================= */}
      {selectedDetailTank && (() => {
        const isSkidTank =
          selectedDetailTank.currentZone.includes('BAY') ||
          activeBays.some((b) => b.tankNo === selectedDetailTank.id);
        const activeBayObj = activeBays.find((b) => b.tankNo === selectedDetailTank.id);
        const rackTag = activeBayObj ? getRackTag(activeBayObj.bayId) : getRackTag(selectedDetailTank.currentZone);

        const currentMassKg = Math.round((selectedDetailTank.levelPercent / 100) * 18200);
        const usableKg = Math.max(0, currentMassKg - 420);
        const remHours = usableKg / 900;
        const etaDate = new Date(Date.now() + remHours * 3600 * 1000);
        const etaTimeStr = `${String(etaDate.getHours()).padStart(2, '0')}:${String(etaDate.getMinutes()).padStart(2, '0')}`;

        const idNum = parseInt(selectedDetailTank.id.replace(/\D/g, ''), 10) || 1;
        const daysAgo = ((idNum * 3) % 7) + 1.3;
        const baseTime = new Date('2026-08-29T14:00:00+07:00').getTime();
        const stagedTime = new Date(baseTime - daysAgo * 24 * 3600 * 1000);
        const yyyy = stagedTime.getFullYear();
        const mm = String(stagedTime.getMonth() + 1).padStart(2, '0');
        const dd = String(stagedTime.getDate()).padStart(2, '0');
        const hh = String(stagedTime.getHours()).padStart(2, '0');
        const min = String(stagedTime.getMinutes()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        const daysStr = daysAgo.toFixed(1);

        const zoneLabel =
          selectedDetailTank.currentZone === 'LAYDOWN_1'
            ? `ORU (LD-1) Slot #${selectedDetailTank.slotIndex || 1}`
            : selectedDetailTank.currentZone === 'LAYDOWN_2'
            ? `ORU (LD-2) Slot #${selectedDetailTank.slotIndex || 1}`
            : `ORU (ISO TK-Skid) Rack ${rackTag}`;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setSelectedDetailTank(null)}
          >
            <div
              className="win-window border-2 border-slate-400 max-w-4xl w-full p-0 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden select-none bg-[#d4d0c8]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Titlebar */}
              <div className="bg-[#002b4d] text-white px-4 py-2 flex justify-between items-center select-none border-b border-blue-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-sm uppercase tracking-wider">
                    {isSkidTank
                      ? `Active Skid Sendout Monitor — ${selectedDetailTank.id} (${rackTag})`
                      : `ISO Tank Condition — ${selectedDetailTank.id}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailTank(null)}
                  className="text-slate-300 hover:text-white font-mono font-bold text-sm px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Sub-Header Banner (Dark Gray Background) */}
              <div className="bg-[#2d3748] text-slate-200 px-4 py-2.5 text-xs sm:text-sm font-mono flex flex-wrap justify-between items-center border-b border-slate-600 gap-2">
                <div className="flex flex-col gap-1">
                  {isSkidTank ? (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          <strong className="text-white">Rack:</strong> {rackTag} (Liquid Feed)
                        </span>
                        <span className="text-slate-400">|</span>
                        <span>
                          <strong className="text-white">PLTMG Load:</strong> 18.5 MW (74.0%)
                        </span>
                        <span className="text-slate-400">|</span>
                        <span>
                          <strong className="text-white">Sendout:</strong> 1,700 Nm³/h
                        </span>
                      </div>
                      <div className="text-xs text-amber-300 font-mono">
                        <strong className="text-white">Cutoff Target:</strong> Heel 1.0 m³ Cutoff Tracking Active (SOP Rev.0)
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          <strong className="text-white">ID:</strong> {selectedDetailTank.id}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span>
                          <strong className="text-white">Serial:</strong> {selectedDetailTank.serialNo || 'SIMU-820101'}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span>
                          <strong className="text-white">Zone:</strong> {zoneLabel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono">
                        <strong className="text-white">Staged Since:</strong> {formattedDate} (~{daysStr} Days Staged)
                      </div>
                    </>
                  )}
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold font-mono border self-center ${
                  selectedDetailTank.currentZone === 'LAYDOWN_1'
                    ? 'bg-slate-900 text-cyan-300 border-cyan-400/40'
                    : selectedDetailTank.currentZone === 'LAYDOWN_2'
                    ? 'bg-slate-900 text-purple-200 border-purple-400/40'
                    : 'bg-slate-900 text-emerald-300 border-emerald-400/40'
                }`}>
                  {selectedDetailTank.currentZone === 'LAYDOWN_1'
                    ? 'ORU (LD-1) CRYO STORAGE'
                    : selectedDetailTank.currentZone === 'LAYDOWN_2'
                    ? 'ORU (LD-2) HEEL BUFFER'
                    : `PLTMG SENDOUT RACK (${rackTag})`}
                </span>
              </div>

              {/* Modal Body: Scrollable */}
              <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs sm:text-sm">
                {isSkidTank ? (
                  /* ========================================================================= */
                  /* ACTIVE SKID SENDOUT & HEEL 1.0m³ TRACKING SECTIONS                        */
                  /* ========================================================================= */
                  <>
                    {/* Section 1: Heel Target */}
                    <div className="win-panel p-3 bg-white border border-slate-300 space-y-2.5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-slate-800">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                          Heel Target
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* Card 1: Current vs Target Volume */}
                        <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
                          <span className="text-xs font-semibold text-slate-600 font-sans">Current Volume</span>
                          <strong className="font-mono text-lg font-bold text-slate-800 my-0.5">
                            {(selectedDetailTank.levelPercent * 0.44).toFixed(1)} m³
                          </strong>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs text-slate-500 font-mono">
                              Target: 1.0 m³ Cutoff
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 font-mono">
                              ~{Math.max(0, (selectedDetailTank.levelPercent * 0.44) - 1.0).toFixed(1)} m³ Remaining
                            </span>
                          </div>
                        </div>

                        {/* Card 2: Liquid Level Gauge */}
                        <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
                          <span className="text-xs font-semibold text-slate-600 font-sans">Level Gauge (Field)</span>
                          <strong className="font-mono text-lg font-bold text-slate-800 my-0.5">
                            {selectedDetailTank.levelMmH2O || Math.round(selectedDetailTank.levelPercent * 10)} mmH2O
                          </strong>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs text-slate-500 font-mono">
                              {selectedDetailTank.levelPercent.toFixed(1)}% ({(selectedDetailTank.levelPercent * 0.44).toFixed(1)} m³)
                            </span>
                            <span className="text-xs font-semibold text-blue-600 font-mono">
                              Limit: 120 mmH2O
                            </span>
                          </div>
                        </div>

                        {/* Card 3: Active Tank Mass */}
                        <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
                          <span className="text-xs font-semibold text-slate-600 font-sans">Active Tank Mass</span>
                          <strong className="font-mono text-lg font-bold text-emerald-700 my-0.5">
                            {currentMassKg.toLocaleString()} kg
                          </strong>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs text-slate-500 font-mono">
                              Swap Limit: 13,222 kg
                            </span>
                            <span className={`text-[11px] font-bold font-mono ${
                              currentMassKg <= 13222 ? 'text-amber-600' : 'text-emerald-700'
                            }`}>
                              {currentMassKg <= 13222 ? '[SWAP REQ ACTIVE]' : '[FEEDING STABLE]'}
                            </span>
                          </div>
                        </div>

                        {/* Card 4: Heel 1.0m³ Cutoff ETA */}
                        <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
                          <span className="text-xs font-semibold text-slate-600 font-sans">1.0m³ Cutoff ETA</span>
                          <strong className="font-mono text-lg font-bold text-amber-600 my-0.5">
                            ~{remHours.toFixed(1)} Hours
                          </strong>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs font-semibold text-slate-700 font-mono">
                              Target Time: {etaTimeStr}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              PLTMG 18.5 MW Load
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Current Telemetry & Final Heel Input */}
                    <div className="win-panel p-3 bg-white border border-slate-300 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                          Current Telemetry &amp; Final Heel Input
                        </h4>
                      </div>
                      <div className="overflow-x-auto border border-slate-300 rounded-none">
                        <table className="w-full text-xs font-mono text-left border-collapse">
                          <thead className="bg-slate-800 text-slate-200">
                            <tr className="h-10">
                              <th className="px-4 text-left font-semibold border-r border-slate-700 w-1/4">Parameter</th>
                              <th className="px-3 text-center font-semibold border-r border-slate-700 w-1/4">SCADA Telemetry</th>
                              <th className="px-3 text-center font-semibold border-r border-slate-700 w-1/4 bg-amber-950/40 text-amber-200">
                                Final Field Input (Dial / Gauge)
                              </th>
                              <th className="px-3 text-center font-semibold w-1/4">Target Limit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                              <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Tank Pressure</td>
                              <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                                {(selectedDetailTank.pressureMpa || 0.758).toFixed(3)} MPa
                              </td>
                              <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="text"
                                    value={modalFinalPressMpa}
                                    onChange={(e) => setModalFinalPressMpa(e.target.value)}
                                    className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                                    placeholder="0.22"
                                  />
                                  <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">MPa</span>
                                </div>
                              </td>
                              <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                                0.400 MPa (Safe Vent)
                              </td>
                            </tr>
                            <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                              <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Liquid Level</td>
                              <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                                {selectedDetailTank.levelPercent.toFixed(1)}% ({(selectedDetailTank.levelPercent * 0.44).toFixed(1)} m³)
                              </td>
                              <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="text"
                                    value={modalFinalLevelMmH2O}
                                    onChange={(e) => setModalFinalLevelMmH2O(e.target.value)}
                                    className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                                    placeholder="50"
                                  />
                                  <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">mmH2O</span>
                                </div>
                              </td>
                              <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                                50 mmH2O (Target)
                              </td>
                            </tr>
                            <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                              <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Final Heel Volume</td>
                              <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                                {(selectedDetailTank.levelPercent * 0.44).toFixed(1)} m³
                              </td>
                              <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="text"
                                    value={modalFinalHeelVolM3}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setModalFinalHeelVolM3(val);
                                      const parsed = parseFloat(val);
                                      if (!isNaN(parsed)) {
                                        setModalFinalHeelMassKg(String(Math.round(parsed * 420)));
                                      }
                                    }}
                                    className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                                    placeholder="1.0"
                                  />
                                  <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">m³</span>
                                </div>
                              </td>
                              <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                                1.0 m³ (Cutoff)
                              </td>
                            </tr>
                            <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                              <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Final Heel Mass</td>
                              <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                                {currentMassKg.toLocaleString()} kg
                              </td>
                              <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="text"
                                    value={modalFinalHeelMassKg}
                                    onChange={(e) => setModalFinalHeelMassKg(e.target.value)}
                                    className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                                    placeholder="420"
                                  />
                                  <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">kg</span>
                                </div>
                              </td>
                              <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                                ~420 kg (Heel)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 3: Skid Operations */}
                    <div className="win-panel p-3 bg-[#e5e3dc] border border-slate-300 space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                        Skid Operations
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDetailTank(null);
                            setTankSubTab('ACTIVE_BAY_TANKS');
                          }}
                          className="win-btn bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-400 font-mono font-bold text-xs py-2 px-3 cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
                        >
                          To ORU ( ISO TK - SKID ) (Tab 3)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const occupiedSlots = new Set(
                              tankInventory.filter((t) => t.currentZone === 'LAYDOWN_2').map((t) => t.slotIndex)
                            );
                            let targetSlot = 1;
                            for (let s = 1; s <= 16; s++) {
                              if (!occupiedSlots.has(s)) {
                                targetSlot = s;
                                break;
                              }
                            }
                            const parsedVol = parseFloat(modalFinalHeelVolM3) || 1.0;
                            const parsedMass = parseFloat(modalFinalHeelMassKg) || 420;
                            const parsedMm = parseFloat(modalFinalLevelMmH2O) || 50;
                            const parsedPress = parseFloat(modalFinalPressMpa) || 0.22;
                            const heelPct = Math.round((parsedVol / 44.0) * 100 * 10) / 10; // ~2.3%

                            setTankInventory((prev) =>
                              prev.map((t) =>
                                t.id === selectedDetailTank.id
                                  ? {
                                      ...t,
                                      currentZone: 'LAYDOWN_2',
                                      slotIndex: targetSlot,
                                      levelPercent: heelPct,
                                      levelM3: parsedVol,
                                      levelMmH2O: parsedMm,
                                      pressureMpa: parsedPress,
                                      tempC: -135.0,
                                    }
                                  : t
                              )
                            );
                            const bayToUnmount = activeBayObj ? activeBayObj.bayId : selectedDetailTank.currentZone;
                            unmountBay(bayToUnmount);
                            moveTankLocation(selectedDetailTank.id, 'Laydown 2', targetSlot, {
                              heelLevelPct: heelPct,
                              heelPressureMPa: parsedPress,
                              heelTempC: -135.0,
                              heelWeightKg: parsedMass,
                              remarks: `Regas Complete: Final Heel ${parsedVol} m³ (${parsedMass} kg) moved to Laydown 2`,
                            });
                            setSelectedDetailTank(null);
                            setToastMessage(`⏹ ${selectedDetailTank.id} completed: Final Heel ${parsedVol} m³ (${parsedMass} kg) moved to ORU (LD-2) Slot #${targetSlot}`);
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="win-btn bg-[#002b4d] hover:bg-[#003d6d] text-white border border-[#001e36] font-mono font-bold text-xs py-2 px-3 cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
                        >
                          Complete &amp; To LD-2
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ========================================================================= */
                  /* YARD TANK CONDITION SECTIONS (LAYDOWN 1 & LAYDOWN 2)                      */
                  /* ========================================================================= */
                  <>
                    {/* Section 1: Current Telemetry */}
                    <div className="win-panel p-3 bg-white border border-slate-300 space-y-2.5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-slate-800">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                          Current Telemetry
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* Holding Pressure */}
                        <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">Holding Pressure</span>
                          <strong className={`font-mono text-base sm:text-lg font-bold block my-0.5 ${
                            (selectedDetailTank.pressureMpa || 0) >= 0.74 ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {(selectedDetailTank.pressureMpa || 0.76).toFixed(2)} MPa
                          </strong>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            {(selectedDetailTank.pressureMpa || 0) >= 0.74 ? 'Overpressure (≥0.74)' : 'Normal (<0.74)'}
                          </span>
                        </div>

                        {/* Liquid Level / Volume */}
                        <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">Liquid Level / Volume</span>
                          <strong className="font-mono text-base sm:text-lg font-bold text-blue-950 block my-0.5">
                            {(selectedDetailTank.levelPercent * 0.44).toFixed(1)} / 44.0 m³ ({selectedDetailTank.levelPercent}%)
                          </strong>
                          <div className="w-3/4 mx-auto bg-slate-200 h-1.5 mt-1 overflow-hidden rounded-full">
                            <div
                              className="h-full bg-[#0284c7]"
                              style={{ width: `${Math.min(100, Math.max(0, selectedDetailTank.levelPercent))}%` }}
                            />
                          </div>
                        </div>

                        {/* Cryogenic Temp */}
                        <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">Cryogenic Temp</span>
                          <strong className="font-mono text-base sm:text-lg font-bold text-slate-900 block my-0.5">
                            {(selectedDetailTank.tempC ?? -126.5).toFixed(1)} °C
                          </strong>
                          <span className="text-[10px] font-mono text-emerald-700 block">Cryo Intact</span>
                        </div>

                        {/* Calculated LNG Mass */}
                        <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">LNG Mass</span>
                          <strong className="font-mono text-base sm:text-lg font-bold text-emerald-800 block my-0.5">
                            {currentMassKg.toLocaleString()} kg
                          </strong>
                          <span className="text-[10px] font-mono text-slate-500 block">Density: 441 kg/m³</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Sensor Cross-Check (Excel-Style Table) */}
                    <div className="win-panel p-3 bg-white border border-slate-300 space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                        Sensor Cross-Check
                      </h4>
                      <div className="overflow-x-auto border border-slate-300 rounded-none">
                        <table className="w-full text-xs font-mono text-left border-collapse">
                          <thead className="bg-slate-800 text-slate-200">
                            <tr>
                              <th className="py-1.5 px-3 font-semibold border-r border-slate-700">Parameter</th>
                              <th className="py-1.5 px-3 font-semibold text-center border-r border-slate-700">Local Analog</th>
                              <th className="py-1.5 px-3 font-semibold text-center border-r border-slate-700">SCADA / SMT</th>
                              <th className="py-1.5 px-3 font-semibold text-center border-r border-slate-700">Delta</th>
                              <th className="py-1.5 px-3 font-semibold text-center">Integrity Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Pressure</td>
                              <td className="py-1.5 px-3 text-center text-slate-700 border-r border-slate-200">{(selectedDetailTank.pressureMpa || 0.76).toFixed(3)} MPa</td>
                              <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">{((selectedDetailTank.pressureMpa || 0.76) - 0.002).toFixed(3)} MPa</td>
                              <td className="py-1.5 px-3 text-center text-slate-700 border-r border-slate-200">+0.002 MPa</td>
                              <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">In-Spec (Calibrated)</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Vacuum Annulus</td>
                              <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                              <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">&lt; 1.0 Pa</td>
                              <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                              <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Hard Vacuum Sealed</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Telemetry Battery</td>
                              <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                              <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">{selectedDetailTank.batteryPercent || 75}%</td>
                              <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                              <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Solar Float OK</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">BOG Venting State</td>
                              <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                              <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">{(selectedDetailTank.pressureMpa || 0) >= 0.74 ? 'Required' : 'Normal'}</td>
                              <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                              <td className={`py-1.5 px-3 text-center font-bold ${(selectedDetailTank.pressureMpa || 0) >= 0.74 ? 'text-amber-600' : 'text-emerald-700'}`}>
                                {(selectedDetailTank.pressureMpa || 0) >= 0.74 ? 'Action Needed (≥0.74)' : 'Stable (<0.74)'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 3: Mount to (4-Column Grid) */}
                    <div className="win-panel p-3 bg-[#e5e3dc] border border-slate-300 space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                        Mount to
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Bay 01', 'Bay 02', 'Bay 03', 'Bay 04'].map((bayId) => {
                          const bayObj = activeBays.find((b) => b.bayId === bayId);
                          const isOccupied = !!bayObj?.tankNo;
                          const rackT = getRackTag(bayId);
                          return (
                            <button
                              key={bayId}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => {
                                const bayZoneKey = (bayId.replace(' ', '_').toUpperCase()) as NiasZone;
                                setTankInventory((prev) =>
                                  prev.map((t) =>
                                    t.id === selectedDetailTank.id
                                      ? { ...t, currentZone: bayZoneKey }
                                      : t
                                  )
                                );
                                mountTankToBay(bayId, selectedDetailTank.id);
                                setSelectedDetailTank((prev) =>
                                  prev ? { ...prev, currentZone: bayZoneKey } : null
                                );
                                setToastMessage(`Mounted ${selectedDetailTank.id} to ${rackT} for Regasification`);
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className={`win-btn py-1 px-2 font-mono text-center ${
                                isOccupied
                                  ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed opacity-75'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-600 cursor-pointer shadow-xs'
                              }`}
                            >
                              {isOccupied ? (
                                <div className="flex flex-col items-center justify-center py-1">
                                  <span className="font-bold text-xs text-slate-800">{rackT}</span>
                                  <span className="text-[11px] text-amber-700 font-medium">(Active: {bayObj?.tankNo})</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-1">
                                  <span className="font-bold text-xs text-slate-700">Mount {rackT}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">(Standby / Empty)</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Toolbar (Clean Single Close Button) */}
              <div className="bg-[#d4d0c8] p-3 px-4 flex justify-end items-center border-t border-slate-300">
                <button
                  type="button"
                  onClick={() => setSelectedDetailTank(null)}
                  className="win-btn bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold px-6 py-1.5 text-xs cursor-pointer border border-slate-400 shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal for Tab 2 Master Log */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#f0ede6] border-2 border-[#555] rounded-none shadow-2xl max-w-md w-full p-4 space-y-4 font-mono select-none">
            {/* Title Bar (Classic Windows Style) */}
            <div className="bg-[#002b4d] text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete Master Inspection Record</span>
              </div>
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="text-slate-300 hover:text-white font-bold px-1.5 py-0.5 hover:bg-red-700/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body Content */}
            <div className="space-y-3 bg-white p-3.5 border border-slate-300">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900 font-sans">
                    Are you sure you want to delete this inspection record?
                  </p>
                  <p className="text-[11px] text-slate-600">
                    This action will remove the record from the active daily yard telemetry master view.
                  </p>
                </div>
              </div>

              {/* Target Details Card */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-none text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Report Date:</span>
                  <span className="font-bold text-slate-900">{recordToDelete.reportDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Tank ID:</span>
                  <span className="font-bold text-blue-950">{recordToDelete.tankNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Serial No:</span>
                  <span className="text-slate-700">{recordToDelete.serialNo}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="win-btn bg-[#d4d0c8] hover:bg-[#dedad2] text-slate-800 border border-slate-400 font-mono font-bold text-xs px-3.5 py-1.5 cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRecord}
                className="win-btn bg-red-600 hover:bg-red-700 text-white border border-red-800 font-mono font-bold text-xs px-3.5 py-1.5 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LARGE SCREEN SCADA CONSOLE: HISTORICAL TELEMETRY TREND ANALYTICS MODAL */}
      {/* ==================================================================== */}
      {trendModalTankNo && (() => {
        const tankAsset = tankInventory.find((t) => t.id === trendModalTankNo);
        const serialNo = tankAsset?.serialNo || 'SIMU-8101426';
        const latestPoint = trendModalData.length > 0 ? trendModalData[trendModalData.length - 1] : null;
        const battVal = latestPoint?.battery ?? tankAsset?.batteryPercent ?? 95;
        const sigVal = latestPoint?.signal ?? 92;

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-150 font-mono">
            <div className="w-[96vw] max-w-[1480px] h-[90vh] flex flex-col bg-[#ece9d8] border-2 border-white border-b-2 border-r-2 border-slate-700 shadow-2xl rounded-xs overflow-hidden">
              
              {/* Top Header Bar */}
              <div className="bg-[#0a2540] text-white px-4 py-2 flex items-center justify-between border-b border-[#071a2e] shrink-0">
                {/* Left: Title & Serial */}
                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5 shrink-0">
                    <span>📈</span>
                    <span>HISTORICAL TELEMETRY TREND ANALYTICS:</span>
                    <span className="text-amber-300 ml-1">{trendModalTankNo}</span>
                    <span className="text-slate-300 font-normal text-xs">({serialNo})</span>
                  </span>
                </div>

                {/* Center: Time Range Selector 3D Buttons */}
                <div className="flex items-center gap-1 bg-[#061828] p-1 rounded-xs border border-blue-900/60 shadow-inner shrink-0">
                  {(['7D', '14D', '30D', 'ALL'] as const).map((range) => {
                    const label = range === '7D' ? '7 Days' : range === '14D' ? '14 Days' : range === '30D' ? '30 Days' : 'All History';
                    const isActive = trendTimeRange === range;
                    return (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setTrendTimeRange(range)}
                        className={`px-3 py-0.5 text-xs font-bold font-mono rounded-xs border-t border-l border-b-2 border-r-2 shadow-xs cursor-pointer select-none transition-all ${
                          isActive
                            ? 'bg-[#d4d0c8] text-slate-900 border-white border-b-slate-700 border-r-slate-700 shadow-inner font-black'
                            : 'bg-[#1b2b3a] hover:bg-[#25394d] text-slate-300 border-slate-600 border-b-slate-900 border-r-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Auxiliary Telemetry Badge [ BATT | SIG ] + Close Button */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Slate Inset Telemetry Badge */}
                  <div className="flex items-center gap-2.5 px-3 py-1 bg-[#07131f] text-slate-200 border border-slate-700/80 rounded-xs shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)] font-mono text-xs select-none">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${battVal > 50 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="text-slate-400 font-bold text-[11px]">BATT:</span>
                      <span className={`font-black ${battVal > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{battVal}%</span>
                    </div>
                    <span className="text-slate-600 font-bold">|</span>
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-cyan-400" />
                      <span className="text-slate-400 font-bold text-[11px]">SIG:</span>
                      <span className="text-cyan-300 font-black">{sigVal}%</span>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setTrendModalTankNo(null)}
                    className="bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white font-bold text-xs px-3.5 py-1 rounded-xs border-t border-l border-[#fc8181] border-b-2 border-r-2 border-[#742a2a] shadow-xs cursor-pointer select-none flex items-center gap-1 font-mono"
                  >
                    <span>✕ CLOSE</span>
                  </button>
                </div>
              </div>

              {/* Modal Body: 60% Single Large Multi-Axis Chart + 40% Data Sheet */}
              <div className="flex-1 min-h-0 flex flex-col p-3 gap-3 overflow-hidden bg-[#e8e4dc]">
                
                {/* TOP: Single Multi-Axis SCADA Telemetry Chart Canvas (60% height) */}
                <div className="flex-[6] min-h-0 flex flex-col bg-[#1e293b] border-2 border-[#475569] rounded-xs shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)] p-2.5 overflow-hidden">
                  
                  {/* Chart Container */}
                  <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendModalData} margin={{ top: 15, right: 70, left: 15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={true} horizontal={true} strokeOpacity={0.7} />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#475569' }}
                        />

                        {/* Axis 1 (Left Y1): Liquid Level / Residual Volume */}
                        <YAxis
                          yAxisId="vol"
                          orientation="left"
                          stroke="#00b4d8"
                          domain={[0, 25]}
                          tick={{ fontSize: 10, fill: '#00b4d8', fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#00b4d8' }}
                          label={{
                            value: 'Vol (m³)',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 0,
                            fill: '#00b4d8',
                            fontSize: 11,
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                          }}
                        />

                        {/* Axis 2 (Right Y2 - 1st Right Axis): Holding / SMT Pressure */}
                        <YAxis
                          yAxisId="press"
                          orientation="right"
                          stroke="#2ec4b6"
                          domain={[0.0, 1.0]}
                          tick={{ fontSize: 10, fill: '#2ec4b6', fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#2ec4b6' }}
                          label={{
                            value: 'Press (MPa)',
                            angle: -90,
                            position: 'insideRight',
                            offset: 0,
                            fill: '#2ec4b6',
                            fontSize: 11,
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                          }}
                        />

                        {/* Axis 3 (Right Y3 - 2nd Right Axis Offset): Cryogenic Temperature */}
                        <YAxis
                          yAxisId="temp"
                          orientation="right"
                          stroke="#ff6b6b"
                          domain={[-160, -100]}
                          dx={38}
                          tick={{ fontSize: 10, fill: '#ff6b6b', fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#ff6b6b' }}
                          label={{
                            value: 'Temp (°C)',
                            angle: -90,
                            position: 'insideRight',
                            offset: 38,
                            fill: '#ff6b6b',
                            fontSize: 11,
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                          }}
                        />

                        {/* Process Reference Lines with Soft Slate (#94a3b8) text */}
                        <ReferenceLine
                          yAxisId="press"
                          y={0.70}
                          stroke="#2ec4b6"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          label={{
                            value: 'Regas limit: 0.70 MPa',
                            position: 'insideTopRight',
                            fill: '#94a3b8',
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                          }}
                        />
                        <ReferenceLine
                          yAxisId="press"
                          y={0.30}
                          stroke="#2ec4b6"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          label={{
                            value: 'Disconnect target: 0.30 MPa',
                            position: 'insideBottomRight',
                            fill: '#94a3b8',
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                          }}
                        />
                        <ReferenceLine
                          yAxisId="vol"
                          y={1.0}
                          stroke="#00b4d8"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          label={{
                            value: 'Heel limit: 1.0 m³',
                            position: 'insideBottomLeft',
                            fill: '#94a3b8',
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                          }}
                        />

                        {/* SCADA HUD Tooltip */}
                        <RechartsTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0]?.payload;
                              return (
                                <div className="bg-[#0c141f]/95 border border-[#3b82f6]/60 p-2.5 rounded shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1.5 min-w-[220px]">
                                  <div className="border-b border-slate-700/80 pb-1 flex justify-between items-center">
                                    <span className="font-extrabold text-amber-300">📅 {d?.fullDate || label}</span>
                                    <span className="px-1.5 py-0.2 bg-blue-900/60 text-cyan-300 border border-cyan-500/30 rounded text-[10px]">
                                      {d?.zone} | {d?.batch}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-[11px]">
                                    <div className="flex justify-between items-center text-[#00b4d8]">
                                      <span>• Residual Volume:</span>
                                      <span className="font-bold">{d?.calcVol?.toFixed(1)} m³ ({d?.smtLevel?.toFixed(1)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#2ec4b6]">
                                      <span>• Holding Pressure:</span>
                                      <span className="font-bold">{d?.analogPress?.toFixed(2)} MPa</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#2ec4b6]/80">
                                      <span>• SMT Sensor Press:</span>
                                      <span className="font-bold">{d?.smtPress?.toFixed(2)} MPa</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#ff6b6b]">
                                      <span>• Cryo Temp:</span>
                                      <span className="font-bold">{d?.tempC?.toFixed(1)} °C</span>
                                    </div>
                                    {d?.bogLossKg > 0 && (
                                      <div className="flex justify-between items-center text-amber-400 border-t border-slate-800 pt-0.5">
                                        <span>• BOG Vented Loss:</span>
                                        <span className="font-bold">{d.bogLossKg} kg</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        {/* Series 1: Residual Volume (m³) */}
                        <Line
                          yAxisId="vol"
                          type="monotone"
                          dataKey="calcVol"
                          name="Residual Volume (m³)"
                          stroke="#00b4d8"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#00b4d8', stroke: '#1e293b', strokeWidth: 1 }}
                          activeDot={{ r: 5, fill: '#00b4d8', stroke: '#fff', strokeWidth: 2 }}
                          hide={!trendSeriesVisible.vol}
                        />

                        {/* Series 2: Pressure (MPa) */}
                        <Line
                          yAxisId="press"
                          type="monotone"
                          dataKey="analogPress"
                          name="Pressure (MPa)"
                          stroke="#2ec4b6"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#2ec4b6', stroke: '#1e293b', strokeWidth: 1 }}
                          activeDot={{ r: 5, fill: '#2ec4b6', stroke: '#fff', strokeWidth: 2 }}
                          hide={!trendSeriesVisible.press}
                        />

                        {/* Series 2b: SMT Pressure (MPa) - dashed telemetry comparison */}
                        <Line
                          yAxisId="press"
                          type="monotone"
                          dataKey="smtPress"
                          name="SMT Pressure (MPa)"
                          stroke="#2ec4b6"
                          strokeDasharray="4 2"
                          strokeWidth={1.5}
                          strokeOpacity={0.85}
                          dot={false}
                          activeDot={{ r: 4 }}
                          hide={!trendSeriesVisible.press}
                        />

                        {/* Series 3: Cryo Temp (°C) */}
                        <Line
                          yAxisId="temp"
                          type="monotone"
                          dataKey="tempC"
                          name="Cryo Temp (°C)"
                          stroke="#ff6b6b"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#ff6b6b', stroke: '#1e293b', strokeWidth: 1 }}
                          activeDot={{ r: 5, fill: '#ff6b6b', stroke: '#fff', strokeWidth: 2 }}
                          hide={!trendSeriesVisible.temp}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* SCADA Interactive Centralized Bottom Legend with Toggle Support */}
                  <div className="flex items-center justify-center gap-4 sm:gap-8 pt-1.5 border-t border-[#334155] bg-[#0f172a] py-1.5 px-3 rounded-xs font-mono text-xs select-none shrink-0 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, temp: !prev.temp }))}
                      className={`flex items-center gap-2 px-3 py-1 rounded-xs cursor-pointer transition-all border ${
                        trendSeriesVisible.temp
                          ? 'bg-[#ff6b6b]/15 border-[#ff6b6b]/60 text-[#ff6b6b] shadow-xs font-bold'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 line-through'
                      }`}
                      title="Toggle Cryo Temperature Series"
                    >
                      <span className={`w-3 h-1 rounded-full ${trendSeriesVisible.temp ? 'bg-[#ff6b6b]' : 'bg-slate-600'}`} />
                      <span className="font-bold text-[11px]">Cryo Temp (°C)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, press: !prev.press }))}
                      className={`flex items-center gap-2 px-3 py-1 rounded-xs cursor-pointer transition-all border ${
                        trendSeriesVisible.press
                          ? 'bg-[#2ec4b6]/15 border-[#2ec4b6]/60 text-[#2ec4b6] shadow-xs font-bold'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 line-through'
                      }`}
                      title="Toggle Pressure Series"
                    >
                      <span className={`w-3 h-1 rounded-full ${trendSeriesVisible.press ? 'bg-[#2ec4b6]' : 'bg-slate-600'}`} />
                      <span className="font-bold text-[11px]">Pressure (MPa)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, vol: !prev.vol }))}
                      className={`flex items-center gap-2 px-3 py-1 rounded-xs cursor-pointer transition-all border ${
                        trendSeriesVisible.vol
                          ? 'bg-[#00b4d8]/15 border-[#00b4d8]/60 text-[#00b4d8] shadow-xs font-bold'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 line-through'
                      }`}
                      title="Toggle Residual Volume Series"
                    >
                      <span className={`w-3 h-1 rounded-full ${trendSeriesVisible.vol ? 'bg-[#00b4d8]' : 'bg-slate-600'}`} />
                      <span className="font-bold text-[11px]">Residual Volume (m³)</span>
                    </button>
                  </div>
                </div>

                {/* BOTTOM: Data Sheet (40% height) */}
                <div className="flex-[4] min-h-0 flex flex-col bg-white border-2 border-[#8a8579] rounded-xs shadow-inner overflow-hidden">
                  <div className="bg-[#4e5d6e] text-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider flex items-center justify-between border-b border-[#8b9aa8] shrink-0 select-none">
                    <span>HISTORICAL INSPECTION &amp; TELEMETRY LOG DATA SHEET</span>
                    <span className="font-mono text-xs text-slate-200">{trendModalData.length} Records Loaded</span>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto custom-scada-scrollbar">
                    <table className="w-full text-xs font-mono border-collapse">
                      <thead className="sticky top-0 bg-[#5f6f82] text-white text-[11px] font-extrabold uppercase select-none shadow-xs z-10">
                        <tr>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">DATE</th>
                          <th className="py-1 px-1.5 text-center border-r border-b border-[#8b9aa8]">ZONE</th>
                          <th className="py-1 px-1.5 text-center border-r border-b border-[#8b9aa8]">BATCH</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">ANALOG PRESS</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">LEVEL (mmH2O)</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8] bg-[#2b78c5] text-white">CALC VOL</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8] bg-[#2b78c5] text-white">CALC MASS</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">SMT PRESS</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">SMT LEVEL</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">TEMP</th>
                          <th className="py-1 px-1.5 text-center border-r border-b border-[#8b9aa8]">BATT</th>
                          <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">BOG LOSS</th>
                          <th className="py-1 px-2 text-center border-b border-[#8b9aa8]">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8e4dc] text-[12px]">
                        {trendModalData.slice().reverse().map((row, idx) => (
                          <tr key={row.fullDate || idx} className="hover:bg-[#eaf2fb] transition-colors even:bg-[#faf8f5]">
                            <td className="py-1 px-2 text-center border-r border-[#e8e4dc] font-bold text-slate-800">{row.fullDate}</td>
                            <td className="py-1 px-1.5 text-center border-r border-[#e8e4dc]">
                              <span className="px-1 py-0.2 bg-sky-50 text-sky-800 border border-sky-300 rounded text-[10px] font-bold">{row.zone}</span>
                            </td>
                            <td className="py-1 px-1.5 text-center border-r border-[#e8e4dc]">
                              <span className="px-1 py-0.2 bg-white text-slate-800 border border-slate-300 rounded text-[10px] font-bold">{row.batch}</span>
                            </td>
                            <td className={`py-1 px-2 text-center border-r border-[#e8e4dc] font-bold ${row.analogPress >= 0.74 ? 'text-amber-600 font-black' : 'text-slate-900'}`}>
                              {row.analogPress.toFixed(2)} MPa
                            </td>
                            <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">
                              {Math.round((row.smtLevel / 100) * 950)}
                            </td>
                            <td className="py-1 px-2 text-center border-r border-[#d4e6f8] bg-[#f0f7ff] text-[#004a99] font-bold">
                              {row.calcVol.toFixed(1)} m³
                            </td>
                            <td className="py-1 px-2 text-center border-r border-[#d4e6f8] bg-[#f0f7ff] text-[#004a99] font-bold">
                              {row.calcMass.toFixed(2)} t
                            </td>
                            <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">{row.smtPress.toFixed(2)} MPa</td>
                            <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">{row.smtLevel.toFixed(1)}%</td>
                            <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">{row.tempC.toFixed(1)}°C</td>
                            <td className="py-1 px-1.5 text-center border-r border-[#e8e4dc] text-slate-700">{row.battery}%</td>
                            <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-700 font-semibold">{row.bogLossKg > 0 ? `${row.bogLossKg} kg` : '-'}</td>
                            <td className="py-1 px-2 text-center">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${row.status === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
