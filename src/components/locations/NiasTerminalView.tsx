// src/components/locations/NiasTerminalView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../../context/PortalDataContext';
import { useTheme } from '../../context/ThemeContext';
import { DailyMasterRecord, DefectCategory, FleetTankItem, NodeState } from '../../types/lng';
import SettlementAuditView from '../SettlementAuditView';
import { NiasActiveBayWorkspace } from './nias/NiasActiveBayWorkspace';
import NiasTankMassBalanceTab from './nias/NiasTankMassBalanceTab';
import NiasProcessPIDDiagram from './nias/NiasProcessPIDDiagram';
import NiasOperationalOverviewTab from './nias/NiasOperationalOverviewTab';
import NiasGasQualityTab from './nias/NiasGasQualityTab';
import NiasPowerThermalTab from './nias/NiasPowerThermalTab';
import NiasCustodySettlementTab from './nias/NiasCustodySettlementTab';
import { exportToCSV } from '../../utils/exportCsv';
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
  | 'PLTMG_POWER_OUTPUT'
  | 'CUSTODY_HEAT_SETTLEMENT';

export type NiasSubTab = NiasTankSubTab | NiasRegasSubTab | string;

interface NiasTerminalViewProps {
  initialDomain?: NiasDomain;
  initialSubTab?: string;
  onNavigateSubTab?: (targetTab: string, domain?: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM') => void;
}

type LaydownZone = 'ALL' | 'LAYDOWN_1' | 'LAYDOWN_2' | 'LAYDOWN_3' | 'FOUR_BAY_REGAS';

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
    if (initialSubTab === 'GC_GAS_QUALITY') return 'GC_GAS_QUALITY';
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
      const initialInventory: NiasTankAsset[] = niasTanks.map((t, idx) => {
        let zone: NiasZone = 'LAYDOWN_1';
        if (
          t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
          t.position?.toLowerCase().includes('laydown 2') ||
          t.position?.toLowerCase().includes('yard 2') ||
          t.position?.toLowerCase().includes('laydown 3') ||
          t.remarks?.toLowerCase().includes('empty') ||
          t.tankNo === 'ISOT-064'
        ) {
          zone = 'LAYDOWN_2';
        } else if (t.position === 'REGAS Bay 01' || t.position?.startsWith('BAY_01')) {
          zone = 'BAY_01';
        } else if (t.position === 'REGAS Bay 02' || t.position?.startsWith('BAY_02')) {
          zone = 'BAY_02';
        } else if (t.position === 'REGAS Bay 03' || t.position?.startsWith('BAY_03')) {
          zone = 'BAY_03';
        } else if (t.position === 'REGAS Bay 04' || t.position?.startsWith('BAY_04')) {
          zone = 'BAY_04';
        } else if (t.position?.toLowerCase().includes('laydown 1') || t.position?.toLowerCase().includes('yard 1')) {
          zone = 'LAYDOWN_1';
        }

        const existingRecord = dailyMasterRecords.find(r => r.tankNo === t.tankNo);

        return {
          id: t.tankNo,
          serialNo: t.serialNo,
          shipment: existingRecord?.shipment || 'N1',
          currentZone: zone,
          slotIndex:
            zone === 'LAYDOWN_2'
              ? t.position?.includes('Slot')
                ? parseInt(t.position.match(/Slot\s*(\d+)/i)?.[1] || '1', 10)
                : 1
              : 0,
          levelPercent:
            existingRecord?.level !== undefined && existingRecord?.level !== null && existingRecord.level > 0
              ? existingRecord.level
              : (t.level && t.level > 0)
              ? t.level
              : (zone === 'LAYDOWN_2' ? 4.0 : 50),
          levelM3: existingRecord?.levelM3 || t.levelM3 || (zone === 'LAYDOWN_2' ? 1.8 : 23.0),
          levelMmH2O: existingRecord?.levelMmH2O || t.levelMmH2O || (zone === 'LAYDOWN_2' ? 36 : 465),
          pressureMpa:
            existingRecord?.pressureMPa ||
            t.pressureMPa ||
            (zone === 'LAYDOWN_2' ? 0.22 : 0.5),
          tempC: existingRecord?.tempC || t.tempC || (zone === 'LAYDOWN_2' ? -135.0 : -130),
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
  const [defectCat, setDefectCat] = useState<DefectCategory>('VALVE_LEAK');
  const [defectDesc, setDefectDesc] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Daily Operations & BOG Event Stream Ticker State (Top Placement)
  const [eventStream, setEventStream] = useState<
    Array<{ id: string; time: string; text: string; tag: string; tagColor: string }>
  >([
    {
      id: 'ev-1',
      time: '11:45',
      text: '[ISOT-017] Standby hookup verified on Bay 03 (0.78 MPa holding pressure)',
      tag: 'STANDBY',
      tagColor: 'text-cyan-400',
    },
    {
      id: 'ev-2',
      time: '09:30',
      text: '[ISOT-009] Controlled BOG depressurization completed (0.80 ➔ 0.73 MPa, loss: 426 kg)',
      tag: 'DEPRESS',
      tagColor: 'text-emerald-400',
    },
    {
      id: 'ev-3',
      time: '08:15',
      text: '[ISOT-086] Reallocated from Laydown 1 Buffer to Laydown 2 for venting',
      tag: 'TRANSFER',
      tagColor: 'text-blue-400',
    },
    {
      id: 'ev-4',
      time: '07:40',
      text: '[ISOT-064] Depleted heel tank staged for Empty Return cycle (4% residual)',
      tag: 'HEEL',
      tagColor: 'text-purple-400',
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

  // Date Filter Mode for Sub-Tab 2: Filter by Selected Date or Show All Master DB Logs
  const [dateFilterMode, setDateFilterMode] = useState<'SELECTED_DATE' | 'ALL_DATES'>('SELECTED_DATE');

  // Workstation Drawer / Collapse State in Tab 2
  const [isWorkstationCollapsed, setIsWorkstationCollapsed] = useState<boolean>(false);

  // Full 14-Column Master DB Workstation Direct State
  const [wsReportDate, setWsReportDate] = useState<string>('2026-08-13');
  const [wsTankNo, setWsTankNo] = useState<string>('ISOT-014');
  const [wsSerialNo, setWsSerialNo] = useState<string>('SIMU-8101513');
  const [wsShipment, setWsShipment] = useState<string>('N1');
  const [wsSelectedZoneFilter, setWsSelectedZoneFilter] = useState<'LAYDOWN_1' | 'LAYDOWN_2'>('LAYDOWN_1');
  const [wsLevelPct, setWsLevelPct] = useState<number>(51);
  const [wsLevelM3, setWsLevelM3] = useState<number>(23.0);
  const [wsLevelMmH2O, setWsLevelMmH2O] = useState<number>(465);
  const [wsBattery, setWsBattery] = useState<number>(72);
  const [wsPressureMPa, setWsPressureMPa] = useState<number>(0.76);
  const [wsTempC, setWsTempC] = useState<number>(-126.7);
  const [wsPressBefore, setWsPressBefore] = useState<number>(0.80);
  const [wsPressAfter, setWsPressAfter] = useState<number>(0.73);
  const [wsEnableDepress, setWsEnableDepress] = useState<boolean>(false);
  const [wsRemarks, setWsRemarks] = useState<string>('Normal daily inspection');

  // Manual SMT Device Inputs
  const [wsSmtLevel, setWsSmtLevel] = useState<number>(51.5);
  const [wsSmtPress, setWsSmtPress] = useState<number>(0.76);
  const [wsSmtTemp, setWsSmtTemp] = useState<number>(-126.5);
  const [wsSmtBattery, setWsSmtBattery] = useState<number>(85);

  // Synchronize Workstation Report Date with selectedDate
  React.useEffect(() => {
    setWsReportDate(selectedDate);
  }, [selectedDate]);

  // Conversion Helpers between mmH2O, Level %, and Level m³
  const handleMmH2OChange = (mm: number) => {
    setWsLevelMmH2O(mm);
    const pct = Math.min(100, Math.max(0, Math.round(mm / 10)));
    const m3 = parseFloat(((mm / 1000) * 45).toFixed(1));
    setWsLevelPct(pct);
    setWsLevelM3(m3);
  };

  const handleLevelPctChange = (pct: number) => {
    setWsLevelPct(pct);
    const mm = Math.round(pct * 10);
    const m3 = parseFloat(((pct / 100) * 45).toFixed(1));
    setWsLevelMmH2O(mm);
    setWsLevelM3(m3);
  };

  const handleLevelM3Change = (m3: number) => {
    setWsLevelM3(m3);
    const pct = Math.min(100, Math.max(0, Math.round((m3 / 45) * 100)));
    const mm = Math.round((m3 / 45) * 1000);
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
      (t) => !activeBayTanksSet.has(t.id) && !yard2TankIds.has(t.id)
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
        tagColor: 'text-blue-400',
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
    setRelocateHeelPct(4.0);
    setRelocateHeelPressMPa(0.22);
    setRelocateHeelTempC(-135.0);
    setRelocateHeelWeightKg(350);
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
        tagColor: 'text-emerald-400',
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
        setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: bayId as NiasZone } : t));
        mountTankToBay(bayId, tankNo);
        setToastMessage(`🔥 Mounted ${tankNo} to ${bayId} for Regasification`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      if (targetZone === 'LAYDOWN_1') {
        setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: 'LAYDOWN_1', slotIndex: slotNumber || t.slotIndex } : t));
        moveTankLocation(tankNo, 'Laydown 1', slotNumber);
        setToastMessage(`✅ ${tankNo} relocated to Laydown Yard 1${slotNumber ? ` (Slot ${slotNumber})` : ''} (Receiving & BOG Buffer)`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      if (targetZone === 'LAYDOWN_2' || targetZone === 'LAYDOWN_3') {
        setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: 'LAYDOWN_2', slotIndex: slotNumber || t.slotIndex } : t));
        moveTankLocation(tankNo, 'Laydown 2', slotNumber, {
          heelLevelPct: 4.0,
          heelPressureMPa: 0.22,
          heelTempC: -135.0,
          heelWeightKg: 350,
          remarks: `Staged in Laydown Yard 2 for MV. Saviour backhaul (Preserved 4.0% cold heel)`
        });
        setToastMessage(`🔄 ${tankNo} relocated to Laydown Yard 2 (Empty Heel 4% Staging)`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    } catch (err) {
      console.error('Failed to parse drag payload:', err);
    }
  };

  // Computed Master Inspection List for Grid matching 14-Column Master DB schema
  const masterInspectionList: DailyMasterRecord[] = useMemo(() => {
    let records = dailyMasterRecords;
    if (dateFilterMode === 'SELECTED_DATE') {
      records = dailyMasterRecords.filter((r) => r.reportDate === selectedDate);
    }

    if (records.length === 0) {
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

    // Zone filter
    if (zoneFilter !== 'ALL') {
      records = records.filter((r) => {
        const t = tankInventory.find(tank => tank.id === r.tankNo);
        if (!t) return false;
        if (zoneFilter === 'LAYDOWN_1') return t.currentZone === 'LAYDOWN_1';
        if (zoneFilter === 'LAYDOWN_2') return t.currentZone === 'LAYDOWN_2';
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
  }, [dailyMasterRecords, selectedDate, dateFilterMode, zoneFilter, searchQuery, fleetTanks]);

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
    <div className="flex flex-col gap-6 w-full text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & 2-Domain Switcher Navigation */}
      <section className="bg-slate-900/90 border border-slate-600 rounded-lg p-4 sm:p-5 shadow-lg flex flex-col gap-3.5 transition-colors duration-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-black text-white">
                Nias Regasification Terminal (ORU Nias, Gunungsitoli)
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Clean 2-domain architecture separating physical ISO Tank Lifecycle from the Gas-to-Power Process.
            </p>
          </div>

          {/* Core 3-Level Switcher (Integrated Overview + 2 Major Operational Domains) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-600 gap-1 flex-wrap">
            <button
              onClick={() => setActiveDomain('TERMINAL_OVERVIEW')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                activeDomain === 'TERMINAL_OVERVIEW'
                  ? 'bg-emerald-600 text-white border border-emerald-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-300" />
              <span>🌐 Terminal Integrated Overview</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-200 ml-1 border border-emerald-500/40">
                PFD
              </span>
            </button>

            <button
              onClick={() => setActiveDomain('ISO_TANK_MGMT')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                activeDomain === 'ISO_TANK_MGMT'
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Box className="w-4 h-4 text-blue-300" />
              <span>📦 Domain 1: ISO Tank Management</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-200 ml-1 border border-blue-500/40">
                {fleetTanks.length} Tanks
              </span>
            </button>

            <button
              onClick={() => setActiveDomain('REGAS_SYSTEM')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                activeDomain === 'REGAS_SYSTEM'
                  ? 'bg-amber-600 text-white border border-amber-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Domain 2: Regas System & Power</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-200 ml-1 border border-amber-500/40">
                17.64 MW
              </span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar (Contextual to the Selected Domain) */}
        <div className={`flex items-center justify-between border-t pt-3 overflow-x-auto ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          {activeDomain === 'TERMINAL_OVERVIEW' ? (
            <div className={`flex items-center p-1.5 px-3 rounded-xl border text-xs font-semibold flex-wrap gap-2 ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-700'
            }`}>
              <span className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <Activity className="w-4 h-4" />
                Virtual Pipeline 5-Node Process Flow Diagram & Daily Confirmed Operational KPI Suite
              </span>
              <span className="text-slate-400">|</span>
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Arun Loading ➔ Sea Transit ➔ Nias Decanting ➔ Vaporizer/PRSS ➔ PLTMG Hall
              </span>
            </div>
          ) : activeDomain === 'ISO_TANK_MGMT' ? (
            <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold whitespace-nowrap gap-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setTankSubTab('TANK_OVERVIEW')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  tankSubTab === 'TANK_OVERVIEW'
                    ? isDark
                      ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'bg-white text-blue-800 font-bold border border-blue-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>🌐 1. Overview & Visual Yard Map</span>
              </button>

              <button
                onClick={() => setTankSubTab('LAYDOWN_1_2_LOG')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  tankSubTab === 'LAYDOWN_1_2_LOG'
                    ? isDark
                      ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'bg-white text-blue-800 font-bold border border-blue-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>📥 2. Laydown 1 Condition & BOG Log ({masterInspectionList.length})</span>
              </button>

              <button
                onClick={() => setTankSubTab('ACTIVE_BAY_TANKS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  tankSubTab === 'ACTIVE_BAY_TANKS'
                    ? isDark
                      ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'bg-white text-blue-800 font-bold border border-blue-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>🏷️ 3. Active Bay Mounted Tanks ({zoneStats.activeBaysCount}/4)</span>
              </button>

              <button
                onClick={() => setTankSubTab('LAYDOWN_3_HEEL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  tankSubTab === 'LAYDOWN_3_HEEL'
                    ? isDark
                      ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'bg-white text-purple-800 font-bold border border-purple-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
                <span>🔄 4. Laydown 2 (Heel 4% Staging) ({zoneStats.yard2.count})</span>
              </button>

              <button
                onClick={() => setTankSubTab('TANK_MASS_BALANCE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  tankSubTab === 'TANK_MASS_BALANCE'
                    ? isDark
                      ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'bg-white text-blue-800 font-bold border border-blue-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-cyan-500" />
                <span>⚖️ 5. ISO Tank Mass Balance & Depressurization Log</span>
              </button>
            </div>
          ) : (
            <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold whitespace-nowrap gap-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setRegasSubTab('GAS_PROCESS_TELEMETRY')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  regasSubTab === 'GAS_PROCESS_TELEMETRY'
                    ? isDark
                      ? 'bg-amber-600/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-white text-amber-800 font-bold border border-amber-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>📊 1. Gas Process & State Telemetry</span>
              </button>

              <button
                onClick={() => setRegasSubTab('GC_GAS_QUALITY')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  regasSubTab === 'GC_GAS_QUALITY'
                    ? isDark
                      ? 'bg-amber-600/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-white text-amber-800 font-bold border border-amber-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-cyan-500" />
                <span>🔬 2. GC & Gas Quality Stream</span>
              </button>

              <button
                onClick={() => setRegasSubTab('PLTMG_POWER_OUTPUT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  regasSubTab === 'PLTMG_POWER_OUTPUT'
                    ? isDark
                      ? 'bg-amber-600/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-white text-amber-800 font-bold border border-amber-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>⚡ 3. PLTMG Power & Thermal Output</span>
              </button>

              <button
                onClick={() => setRegasSubTab('CUSTODY_HEAT_SETTLEMENT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
                  regasSubTab === 'CUSTODY_HEAT_SETTLEMENT'
                    ? isDark
                      ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'bg-white text-indigo-800 font-bold border border-indigo-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>⚖️ 4. Custody Heat Settlement</span>
                {disputeCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-500 text-[9px] font-bold">
                    {disputeCount} Alert
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Quick Domain Tag Indicator */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Active View:</span>
            <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border ${
              activeDomain === 'TERMINAL_OVERVIEW'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : activeDomain === 'ISO_TANK_MGMT'
                ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                : 'bg-amber-950 text-amber-300 border-amber-500/40'
            }`}>
              {activeDomain === 'TERMINAL_OVERVIEW' ? 'Integrated PFD' : activeDomain === 'ISO_TANK_MGMT' ? 'ISO Tank Mgmt' : 'Regas & Power'}
            </span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* TERMINAL OVERVIEW - PROMOTED 5-NODE PFD DASHBOARD                    */}
      {/* ==================================================================== */}
      {activeDomain === 'TERMINAL_OVERVIEW' && (
        <NiasOperationalOverviewTab
          onNavigateSubTab={(targetTab, domain) => {
            if (domain) setActiveDomain(domain);
            if (domain === 'ISO_TANK_MGMT') {
              setTankSubTab(targetTab as NiasTankSubTab);
            } else if (domain === 'REGAS_SYSTEM') {
              setRegasSubTab(targetTab as NiasRegasSubTab);
            }
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 1: 🌐 PURE 3-COLUMN VISUAL YARD MAP (DRAG & DROP)  */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'TANK_OVERVIEW' && (() => {
        const yard1TanksList = zoneStats.yard1.tanks;
        const yard2TanksList = zoneStats.yard2.tanks;

        // Helper to match tank by slot index (1-indexed slot number)
        const getTankAtSlot = (list: typeof yard1TanksList, slotIdx: number): typeof yard1TanksList[0] | undefined => {
          const slotNum = slotIdx + 1;
          const exact = list.find((t) => t.slotIndex === slotNum);
          if (exact) return exact;
          
          const unassigned = list.filter((t) => !t.slotIndex || t.slotIndex === 0);
          let unassignedIdx = 0;
          for (let i = 0; i < slotIdx; i++) {
            const hasExact = list.some((t) => t.slotIndex === i + 1);
            if (!hasExact) unassignedIdx++;
          }
          return unassigned[unassignedIdx];
        };

        const totalActiveFlow = activeBays.reduce((acc, b) => acc + (b.flowRate || 0), 0);
        const mountedCount = activeBays.filter((b) => b.tankNo).length;
        const yard1AvgPress = yard1TanksList.length
          ? yard1TanksList.reduce((acc, t) => acc + (t.pressureMpa || 0), 0) / yard1TanksList.length
          : 0.78;
        const yard1HighPressCount = yard1TanksList.filter((t) => (t.pressureMpa || 0) >= 0.74).length;

        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 1. Top 3 Zone Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Laydown Yard 1 (Receiving & BOG) */}
              <div className="bg-slate-900/90 border border-blue-500/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    📍 Laydown Yard 1
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Receiving & BOG
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold font-mono text-blue-400">{yard1TanksList.length}</span>
                  <span className="text-xs font-mono text-slate-400">/ 12 Slots</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Avg: {yard1AvgPress.toFixed(2)} MPa</span>
                  <span className={yard1HighPressCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {yard1HighPressCount} Overpress / Vent
                  </span>
                </div>
              </div>

              {/* Card 2: 4-Bay Vaporizer Station */}
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    🔥 4-Bay Vaporizer Station
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Sendout
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{mountedCount} / 4</span>
                  <span className="text-xs font-mono text-slate-400">Bays Online</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Sendout: {totalActiveFlow.toFixed(0)} Nm³/h</span>
                  <span className="text-cyan-400">0.35 MPa Header</span>
                </div>
              </div>

              {/* Card 3: Laydown Yard 2 (Empty Heel 4% Staging) */}
              <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    🔄 Laydown Yard 2
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Empty Heel 4%
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold font-mono text-purple-400">{yard2TanksList.length}</span>
                  <span className="text-xs font-mono text-slate-400">/ 12 Slots</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>4.0% Heel (~350 kg)</span>
                  <span className="text-purple-300">Ready for MV. Saviour</span>
                </div>
              </div>
            </div>

            {/* Drag & Drop Guidance Banner */}
            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">
                  Interactive 3-Zone Physical Drag & Drop Terminal
                </span>
                <span className="hidden sm:inline text-slate-500">—</span>
                <span className="hidden sm:inline text-slate-400">
                  Drag ISO Tanks: <strong>Laydown 1 (Receiving)</strong> ➔ <strong>4-Bay (Vaporize)</strong> ➔ <strong>Laydown 2 (4% Heel Staging)</strong>
                </span>
              </div>
              {draggingTankNo && (
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60 animate-pulse">
                  <span>Moving: {draggingTankNo}</span>
                </div>
              )}
            </div>

            {/* 2. Main 3-Column Visual Yard Map (Full Screen Width) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
              {/* ================================================================= */}
              {/* COLUMN 1: LAYDOWN YARD 1 (RECEIVING & BOG BUFFER - 12 SLOTS)      */}
              {/* ================================================================= */}
              <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400 text-xs">
                      Y1
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">Laydown Yard 1</h4>
                      <p className="text-[10px] text-slate-400">Receiving & BOG Venting Station</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {yard1TanksList.length} / 12
                  </span>
                </div>

                {/* 12 Slots in 2 Columns */}
                <div className="grid grid-cols-2 gap-2.5">
                  {Array.from({ length: 12 }).map((_, slotIdx) => {
                    const slotNum = slotIdx + 1;
                    const tank = getTankAtSlot(yard1TanksList, slotIdx);
                    const slotTargetId = `LAYDOWN_1-slot-${slotNum}`;
                    const isDragOver = dragOverTarget === slotTargetId;

                    if (tank) {
                      const isDragging = draggingTankNo === tank.id;
                      const isHighPress = (tank.pressureMpa || 0) >= 0.74;

                      return (
                        <div
                          key={tank.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, tank.id, 'LAYDOWN_1')}
                          onDragEnd={handleDragEnd}
                          className={`p-2.5 rounded-xl border bg-slate-950/90 transition-all duration-200 cursor-grab active:cursor-grabbing relative flex flex-col justify-between gap-1.5 shadow-md ${
                            isDragging
                              ? 'opacity-40 scale-95 ring-2 ring-blue-400 border-blue-400'
                              : isHighPress
                              ? 'border-amber-500/50 hover:border-amber-400 shadow-amber-500/10'
                              : 'border-blue-500/30 hover:border-blue-400/70 hover:shadow-blue-500/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1">
                              <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                              <span className="font-bold font-mono text-blue-400 text-xs">{tank.id}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 py-0.2 rounded">
                              #{slotNum < 10 ? `0${slotNum}` : slotNum}
                            </span>
                          </div>

                          {/* Level Progress */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Level:</span>
                              <span className="font-bold text-slate-200">{tank.levelPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(100, tank.levelPercent || 50)}%` }}
                              />
                            </div>
                          </div>

                          {/* Pressure & Depress */}
                          <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-slate-900">
                            <span className={isHighPress ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
                              {(tank.pressureMpa || 0).toFixed(2)} MPa
                            </span>
                            {isHighPress ? (
                              <button
                                type="button"
                                onClick={() => handleQuickDepress(tank.id)}
                                className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded border border-amber-500/30 cursor-pointer"
                              >
                                Vent
                              </button>
                            ) : (
                              <span className="text-cyan-400">{tank.tempC?.toFixed(1)} °C</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`empty-y1-${slotNum}`}
                        onDragOver={(e) => handleDragOver(e, slotTargetId)}
                        onDragLeave={() => handleDragLeave(slotTargetId)}
                        onDrop={(e) => handleDrop(e, 'LAYDOWN_1', slotNum)}
                        className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 text-center p-2 cursor-pointer ${
                          isDragOver
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-400 scale-[1.02]'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          #{slotNum < 10 ? `0${slotNum}` : slotNum}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {isDragOver ? '📥 Drop Arrived Tank' : '+ Slot Empty'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================================================================= */}
              {/* COLUMN 2: 4-BAY VAPORIZER STATION (PLTMG ACTIVE SENDOUT - 4 BAYS) */}
              {/* ================================================================= */}
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs">
                      <Flame className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">4-Bay Vaporizer</h4>
                      <p className="text-[10px] text-slate-400">PLTMG Active Sendout Racks</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {totalActiveFlow.toFixed(0)} Nm³/h
                  </span>
                </div>

                {/* 4 Large Bay Cards */}
                <div className="space-y-3">
                  {activeBays.map((bay) => {
                    const isDragOver = dragOverTarget === bay.bayId;
                    const tank = fleetTanks.find((t) => t.tankNo === bay.tankNo);
                    const isRunning = bay.status === 'RUNNING';

                    if (bay.tankNo) {
                      return (
                        <div
                          key={bay.bayId}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, bay.tankNo!, bay.bayId)}
                          onDragEnd={handleDragEnd}
                          className="bg-slate-950/95 border border-emerald-500/40 rounded-xl p-3 space-y-2.5 shadow-lg relative group cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-bold text-xs text-slate-100 font-mono">{bay.bayId}</span>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                                isRunning
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              {isRunning ? `RUNNING (${bay.flowRate || 400} Nm³/h)` : 'STANDBY'}
                            </span>
                          </div>

                          {/* Mounted Tank Specs */}
                          <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center text-xs font-mono">
                            <div>
                              <span className="font-bold text-emerald-400 text-sm block">{bay.tankNo}</span>
                              <span className="text-[10px] text-slate-400">{tank?.serialNo || 'SIMU-ACTIVE'}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-200">{bay.level || tank?.level || 45}% Level</span>
                              <span className="text-[10px] text-cyan-400 block">{bay.pressure || 0.35} MPa • {bay.temp || -132}°C</span>
                            </div>
                          </div>

                          {/* Bay Controls */}
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => toggleBayRunning(bay.bayId)}
                              className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                isRunning
                                  ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                              }`}
                            >
                              {isRunning ? '⏸ Pause' : '▶ Start'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDrawerBayId(bay.bayId === activeDrawerBayId && activeDrawerType === 'DISCONNECT' ? null : bay.bayId);
                                setActiveDrawerType('DISCONNECT');
                                // Note: we need to scroll to it, or it will just open below the Bay Cards section.
                                const el = document.getElementById('nias-4bay-section');
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }}
                              className="py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              title="Finish Regasification & preserve 4% heel into Laydown 2"
                            >
                              ⏹️ Heel 4%
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const bayTankNo = bay.tankNo;
                                if (bayTankNo) {
                                  setTankInventory((prev) =>
                                    prev.map((t) =>
                                      t.id === bayTankNo
                                        ? { ...t, currentZone: 'LAYDOWN_2', levelPercent: 4.0, pressureMpa: 0.22, tempC: -135.0 }
                                        : t
                                    )
                                  );
                                }
                                unmountBay(bay.bayId);
                              }}
                              className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              ⏏️ Unmount
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={bay.bayId}
                        onDragOver={(e) => handleDragOver(e, bay.bayId)}
                        onDragLeave={() => handleDragLeave(bay.bayId)}
                        onDrop={(e) => handleDrop(e, 'FOUR_BAY_REGAS', undefined, bay.bayId)}
                        className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all duration-200 text-center cursor-pointer min-h-[110px] ${
                          isDragOver
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-400 scale-[1.02]'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                          <Flame className="w-3.5 h-3.5 text-slate-500" />
                          <span>{bay.bayId} (Standby Rack)</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {isDragOver ? '🔥 Drop Tank to Mount & Vaporize' : '+ Drop ISO Tank Here to Mount'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================================================================= */}
              {/* COLUMN 3: LAYDOWN YARD 2 (EMPTY HEEL 4% STAGING - 12 SLOTS)       */}
              {/* ================================================================= */}
              <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-purple-400 text-xs">
                      Y2
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">Laydown Yard 2</h4>
                      <p className="text-[10px] text-slate-400">Empty Heel 4% Staging Buffer</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAuthorizeBackhaul}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    Backhaul ({selectedBackhaulTanks.size})
                  </button>
                </div>

                {/* 12 Slots in 2 Columns */}
                <div className="grid grid-cols-2 gap-2.5">
                  {Array.from({ length: 12 }).map((_, slotIdx) => {
                    const slotNum = slotIdx + 1;
                    const tank = getTankAtSlot(yard2TanksList, slotIdx);
                    const slotTargetId = `LAYDOWN_2-slot-${slotNum}`;
                    const isDragOver = dragOverTarget === slotTargetId;

                    if (tank) {
                      const isDragging = draggingTankNo === tank.id;
                      const isSelectedForBackhaul = selectedBackhaulTanks.has(tank.id);

                      return (
                        <div
                          key={tank.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, tank.id, 'LAYDOWN_2')}
                          onDragEnd={handleDragEnd}
                          className={`p-2.5 rounded-xl border bg-slate-950/90 transition-all duration-200 cursor-grab active:cursor-grabbing relative flex flex-col justify-between gap-1.5 shadow-md ${
                            isDragging
                              ? 'opacity-40 scale-95 ring-2 ring-purple-400 border-purple-400'
                              : isSelectedForBackhaul
                              ? 'border-purple-500 bg-purple-950/30 ring-1 ring-purple-400/50'
                              : 'border-purple-500/30 hover:border-purple-400/70 hover:shadow-purple-500/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={isSelectedForBackhaul}
                                onChange={() => toggleSelectBackhaulTank(tank.id)}
                                className="rounded border-slate-700 bg-slate-950 text-purple-500 accent-purple-500 cursor-pointer"
                              />
                              <span className="font-bold font-mono text-purple-300 text-xs">{tank.id}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 py-0.2 rounded">
                              #{slotNum < 10 ? `0${slotNum}` : slotNum}
                            </span>
                          </div>

                          {/* Preserved Heel Specs */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span className="text-purple-300 font-semibold">4.0% Heel:</span>
                              <span className="font-bold text-slate-200">~350 kg</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: '4%' }} />
                            </div>
                          </div>

                          {/* Holding Pressure & Temp */}
                          <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-slate-900">
                            <span className="text-emerald-400 font-bold">{(tank.pressureMpa || 0.22).toFixed(2)} MPa</span>
                            <span className="text-cyan-400">{(tank.tempC || -135.0).toFixed(1)} °C</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`empty-y2-heel-${slotNum}`}
                        onDragOver={(e) => handleDragOver(e, slotTargetId)}
                        onDragLeave={() => handleDragLeave(slotTargetId)}
                        onDrop={(e) => handleDrop(e, 'LAYDOWN_2', slotNum)}
                        className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 text-center p-2 cursor-pointer ${
                          isDragOver
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-400 scale-[1.02]'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          #{slotNum < 10 ? `0${slotNum}` : slotNum}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {isDragOver ? '📥 Drop Heel Tank' : '+ Slot Empty'}
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
      {/* DOMAIN 1 - SUB-TAB 2: 📥 LAYDOWN 1 & 2 CONDITION & BOG LOG          */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'LAYDOWN_1_2_LOG' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Date & Operations Toolbar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            {/* Left: Date Controls & Search */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {/* Date Filter Mode Toggle */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDateFilterMode('SELECTED_DATE')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dateFilterMode === 'SELECTED_DATE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Specific Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterMode('ALL_DATES')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dateFilterMode === 'ALL_DATES'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Master Logs ({dailyMasterRecords.length})
                </button>
              </div>

              {/* Date Picker (enabled in SELECTED_DATE mode) */}
              {dateFilterMode === 'SELECTED_DATE' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400 font-semibold">Report Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-slate-100 font-mono text-xs focus:outline-none cursor-pointer"
                  />
                </div>
              )}

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Tank / Serial / Remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right: Quick Actions & CSV Export */}
            <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
              {selectedTanks.size > 0 && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold px-2">
                    Move ({selectedTanks.size}) to:
                  </span>
                  <button
                    onClick={() => handleBatchAllocateZone('Laydown 1')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 cursor-pointer"
                  >
                    Laydown 1
                  </button>
                  <button
                    onClick={() => handleBatchAllocateZone('Laydown 2')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-pointer"
                  >
                    Laydown 2
                  </button>
                  <button
                    onClick={() => handleBatchAllocateZone('Laydown 3')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-blue-500/40 cursor-pointer"
                  >
                    Laydown 3
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsWorkstationCollapsed(!isWorkstationCollapsed)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>{isWorkstationCollapsed ? 'Expand Workstation' : 'Collapse Workstation'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportDailyMasterCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>📥 Export Daily CSV (14-Col)</span>
              </button>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* FULL-PAGE INTEGRATED 3-COLUMN DAILY INSPECTION WORKSTATION            */}
          {/* ==================================================================== */}
          {!isWorkstationCollapsed && (
            <div
              id="daily-log-workstation-panel"
              className="bg-slate-900/95 border border-blue-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-top-3 duration-200 space-y-5"
            >
              {/* Workstation Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100">
                        Nias Daily Inspection & BOG Depressurization Workstation
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        14-Column Master DB Direct Entry
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Edit telemetry parameters, convert cryogenic volume/mmH₂O, simulate BOG losses, and commit to Master DB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetWorkstation}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWorkstationCollapsed(true)}
                    className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
                    title="Minimize Workstation"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2-Column Workstation Form */}
              <form onSubmit={handleSaveDailyInspection} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* ============================================================ */}
                  {/* COLUMN 1: TANK & ASSET IDENTITY                             */}
                  {/* ============================================================ */}
                  <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                          <span>1. Tank & Asset Identity</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Col 1~5
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Row 1: Report Date & Zone Selector */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                              1. Report Date:
                            </label>
                            <input
                              type="date"
                              value={wsReportDate}
                              onChange={(e) => setWsReportDate(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:border-blue-500 outline-none cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                              Location / Zone Filter:
                            </label>
                            <select
                              value={wsSelectedZoneFilter}
                              onChange={(e) => {
                                const newZone = e.target.value as any;
                                setWsSelectedZoneFilter(newZone);
                                const firstTank = tankInventory.find(t => isTankInSelectedZone(t, newZone));
                                if (firstTank) {
                                  handleSelectTankForWorkstation(firstTank.id);
                                }
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:border-blue-500 outline-none cursor-pointer"
                            >
                              <option value="LAYDOWN_1">Laydown Yard 1</option>
                              <option value="LAYDOWN_2">Laydown Yard 2</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Compact ISO Tank Selector */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            2. Select ISO Tank:
                          </label>
                          <select
                            value={wsTankNo}
                            onChange={(e) => handleSelectTankForWorkstation(e.target.value)}
                            className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-xs font-mono font-bold text-blue-400 focus:border-blue-400 outline-none cursor-pointer"
                          >
                            {filteredWorkstationTanks.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.id} - {t.serialNo}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Serial No. & Shipment Dual Chips */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                              3. Serial No.:
                            </label>
                            <input
                              type="text"
                              value={wsSerialNo}
                              readOnly
                              disabled
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-400 outline-none opacity-70 cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                              4. Shipment:
                            </label>
                            <input
                              type="text"
                              value={wsShipment}
                              readOnly
                              disabled
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-400 outline-none opacity-70 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* 5. Dwell & Storage Status Card */}
                        <div className="flex-1 min-h-[70px] bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex flex-col justify-center relative overflow-hidden mt-1">
                          {(() => {
                            const arrDate = wsActiveTank?.arrivalHeelMetrics?.arrivalDate || '2026-08-10';
                            const dwellDays = Math.max(0, Math.floor((new Date(wsReportDate).getTime() - new Date(arrDate).getTime()) / 86400000));
                            const arrivalPress = wsActiveTank?.arrivalHeelMetrics?.arrivalPressureMPa || wsActiveTank?.pressBeforeMPa || 0.74;
                            const isHighPress = wsPressureMPa > 0.75;
                            
                            return (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-[11px] text-slate-400 font-semibold">
                                    5. Dwell & Storage Status:
                                  </label>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
                                    LNG Density: {wsTankDensity.toFixed(2)} kg/m³
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between font-mono text-xs">
                                    <span className="text-slate-400 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                                      Time in Yard
                                    </span>
                                    <span className="text-slate-100 font-bold">⏱️ {dwellDays}-Day Dwell</span>
                                  </div>
                                  <div className="flex items-center justify-between font-mono text-xs">
                                    <span className="text-slate-400 flex items-center gap-1.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                                      Pressure Drift
                                    </span>
                                    {isHighPress ? (
                                      <span className="text-red-400 font-bold animate-pulse flex items-center gap-1" title="BOG Venting Warning">
                                        📈 {arrivalPress.toFixed(2)} ➔ {wsPressureMPa.toFixed(2)} MPa <Flame className="w-3 h-3" />
                                      </span>
                                    ) : (
                                      <span className="text-emerald-400 font-bold">
                                        📈 {arrivalPress.toFixed(2)} ➔ {wsPressureMPa.toFixed(2)} MPa
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* COLUMN 2: TELEMETRY, CALIBRATION & BOG WORKBENCH             */}
                  {/* ============================================================ */}
                  <div className="lg:col-span-8 bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <span>2. Telemetry, Calibration & BOG Workbench</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Col 6~14
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* A. Telemetry Cross-Validation Matrix */}
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-3">
                          <h4 className="text-[10px] uppercase text-slate-400 font-bold flex items-center justify-between gap-1.5">
                            <span className="flex items-center gap-1.5">
                              <span className="bg-slate-800 px-1.5 rounded text-slate-300">A</span> 
                              Dual-Track Direct Comparison (Analog vs. SMT Digital)
                            </span>
                          </h4>
                          
                          <div className="w-full text-left border-collapse border border-slate-800/60 rounded overflow-x-auto">
                            <div className="min-w-[700px]">
                              {/* Header Row */}
                              <div className="grid grid-cols-8 bg-slate-800/40 text-[9px] uppercase font-bold text-slate-300 border-b border-slate-700 text-center items-center leading-tight">
                                <div className="p-2 border-r border-slate-700 text-left">Data Source</div>
                                <div className="p-2 border-r border-slate-700">Level <br /><span className="text-[9px] text-slate-500 font-normal normal-case">(mmH₂O)</span></div>
                                <div className="p-2 border-r border-slate-700">Pressure <br /><span className="text-[9px] text-slate-500 font-normal normal-case">(MPa)</span></div>
                                <div className="p-2 border-r border-slate-700">Level <br /><span className="text-[9px] text-slate-500 font-normal normal-case">(%)</span></div>
                                <div className="p-2 border-r border-slate-700">Volume <br /><span className="text-[9px] text-slate-500 font-normal normal-case">(m³)</span></div>
                                <div className="p-2 border-r border-slate-700">Mass <br /><span className="text-[9px] text-slate-500 font-normal normal-case">(kg)</span></div>
                                <div className="p-2 border-r border-slate-700">Battery <br /><span className="text-[9px] text-slate-500 font-normal normal-case">(%)</span></div>
                                <div className="p-2">Temperature <br /><span className="text-[9px] text-slate-500 font-normal normal-case">(°C)</span></div>
                              </div>
                              
                              {/* Row 1: Analog */}
                              <div className="grid grid-cols-8 border-b border-slate-800 text-center items-stretch bg-emerald-950/10">
                                <div className="p-2 border-r border-slate-800 text-[10px] font-bold text-emerald-500 flex items-center justify-start">
                                  🅰️ Analog Dial
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center">
                                  <input
                                    type="number" min="0" max="1000"
                                    value={wsLevelMmH2O}
                                    onChange={(e) => handleMmH2OChange(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-emerald-500/60 rounded px-1.5 py-1 text-xs font-mono font-bold text-emerald-400 outline-none text-center"
                                  />
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center">
                                  <input
                                    type="number" step="0.01"
                                    value={wsPressureMPa}
                                    onChange={(e) => setWsPressureMPa(parseFloat(e.target.value) || 0)}
                                    className={`w-full bg-slate-950 border rounded px-1.5 py-1 text-xs font-mono font-bold outline-none text-center ${wsPressureMPa >= 0.76 ? 'border-red-500/60 text-red-400' : 'border-emerald-500/40 text-emerald-400'}`}
                                  />
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 bg-slate-950/30">
                                  {wsLevelPct.toFixed(1)}
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 bg-slate-950/30">
                                  {wsLevelM3.toFixed(2)}
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 bg-slate-950/30">
                                  {!isNaN(wsLevelM3) && wsLevelM3 > 0 ? (wsLevelM3 * wsTankDensity).toFixed(0) : '0'}
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center text-[10px] text-slate-600 italic bg-slate-900/40">
                                  N/A
                                </div>
                                <div className="p-2 flex items-center justify-center text-[10px] text-slate-600 italic bg-slate-900/40">
                                  N/A
                                </div>
                              </div>
                              
                              {/* Row 2: SMT */}
                              <div className="grid grid-cols-8 border-b border-slate-800 text-center items-stretch bg-blue-950/10">
                                <div className="p-2 border-r border-slate-800 text-[10px] font-bold text-blue-400 flex items-center justify-start">
                                  🅱️ SMT Digital
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center text-[10px] text-slate-600 italic bg-slate-900/40">
                                  N/A
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center">
                                  <input
                                    type="number" step="0.01"
                                    value={wsSmtPress}
                                    onChange={(e) => setWsSmtPress(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-blue-500/40 rounded px-1.5 py-1 text-xs font-mono font-bold text-blue-300 outline-none text-center"
                                  />
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center">
                                  <input
                                    type="number" step="0.1"
                                    value={wsSmtLevel}
                                    onChange={(e) => setWsSmtLevel(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-blue-500/60 rounded px-1.5 py-1 text-xs font-mono font-bold text-blue-400 outline-none text-center"
                                  />
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 bg-slate-950/30">
                                  {((wsSmtLevel / 100) * 45).toFixed(2)}
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 bg-slate-950/30">
                                  {(((wsSmtLevel / 100) * 45) * wsTankDensity).toFixed(0)}
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center">
                                  <input
                                    type="number"
                                    value={wsSmtBattery}
                                    onChange={(e) => setWsSmtBattery(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-blue-500/40 rounded px-1.5 py-1 text-xs font-mono font-bold text-blue-300 outline-none text-center"
                                  />
                                </div>
                                <div className="p-2 flex items-center justify-center">
                                  <input
                                    type="number" step="0.1"
                                    value={wsSmtTemp}
                                    onChange={(e) => setWsSmtTemp(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-blue-500/40 rounded px-1.5 py-1 text-xs font-mono font-bold text-blue-300 outline-none text-center"
                                  />
                                </div>
                              </div>
                              
                              {/* Row 3: Discrepancy Checks */}
                              <div className="grid grid-cols-8 text-center items-stretch bg-slate-900/40">
                                <div className="p-2 border-r border-slate-800 text-[9px] uppercase font-bold text-slate-400 flex items-center justify-start">
                                  Integrity Delta
                                </div>
                                <div className="p-2 border-r border-slate-800"></div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center">
                                  {(() => {
                                    const deltaP = Math.abs(wsPressureMPa - wsSmtPress);
                                    return deltaP <= 0.05 ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold whitespace-nowrap">✅ ±{deltaP.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/40 font-bold whitespace-nowrap animate-pulse">⚠️ {deltaP.toFixed(2)} MPa Diff</span>
                                    );
                                  })()}
                                </div>
                                <div className="p-2 border-r border-slate-800 flex items-center justify-center">
                                  {(() => {
                                    const delta = Math.abs(wsSmtLevel - wsLevelPct);
                                    return delta <= 2 ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold whitespace-nowrap">✅ Verified Match</span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/40 font-bold whitespace-nowrap animate-pulse">⚠️ Discrepancy Alert</span>
                                    );
                                  })()}
                                </div>
                                <div className="col-span-4 p-2"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* B. Integrated BOG Venting & Loss Card */}
                        <div className={`p-3 rounded-lg border transition-all ${wsEnableDepress ? 'bg-slate-900/60 border-amber-500/30' : 'bg-slate-900/30 border-slate-700/30 opacity-80'} space-y-3`}>
                          <h4 className="text-[10px] uppercase font-bold flex items-center justify-between gap-1.5">
                            <div className={`flex items-center gap-1.5 ${wsEnableDepress ? 'text-amber-400' : 'text-slate-400'}`}>
                              <span className={`${wsEnableDepress ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'} px-1.5 rounded`}>B</span> BOG Venting & Loss Card
                            </div>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                              <input 
                                type="checkbox"
                                checked={wsEnableDepress}
                                onChange={(e) => setWsEnableDepress(e.target.checked)}
                                className="accent-amber-500 cursor-pointer"
                              />
                              <span className="normal-case">Execute BOG Depressurization (Optional)</span>
                            </label>
                          </h4>
                          <div className={`grid grid-cols-12 gap-3 items-center transition-opacity ${wsEnableDepress ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="col-span-3">
                              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                                Press Before:
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={wsPressBefore}
                                onChange={(e) => setWsPressBefore(parseFloat(e.target.value) || 0)}
                                disabled={!wsEnableDepress}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-500"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                                Press After:
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={wsPressAfter}
                                onChange={(e) => setWsPressAfter(parseFloat(e.target.value) || 0)}
                                disabled={!wsEnableDepress}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-500"
                              />
                            </div>
                            <div className="col-span-6 flex flex-col gap-1">
                              <div className="p-2 bg-amber-950/30 border border-amber-500/40 rounded h-full flex items-center justify-between">
                                <div className="text-[12px] text-amber-300 font-bold">ΔP = {wsDeltaP.toFixed(2)} MPa</div>
                                <div className="text-right">
                                  <div className="text-sm font-bold font-mono text-amber-400">{wsCalculatedLossKg.toLocaleString()} Kg</div>
                                  <div className="text-[10px] text-amber-500">{wsCalculatedLossPct.toFixed(2)}% Net Loss</div>
                                </div>
                              </div>
                              <div className="text-[9px] text-slate-500/80 italic text-right px-1">
                                * BOG Loss calculation derived using inherited ρ = {wsTankDensity.toFixed(2)} kg/m³
                                <br />
                                * Loss rate based on Arun Initial Loaded Mass ({wsInitialLoadedMass.toLocaleString()} kg)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
                      {/* Remarks Input */}
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          value={wsRemarks}
                          onChange={(e) => setWsRemarks(e.target.value)}
                          placeholder="Remarks / Observations..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
                        />
                      </div>

                      {/* Commit & Reset Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetWorkstation}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>💾 Save & Commit Log</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ==================================================================== */}
          {/* COMPREHENSIVE MASTER INSPECTION TABLE (FULL MASTER DB GRID)          */}
          {/* ==================================================================== */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Table Header Bar with Zone Filters */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                  Nias Laydown Yard Telemetry & Inspection Master Grid (14-Column Master DB)
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({masterInspectionList.length} Records for {dateFilterMode === 'SELECTED_DATE' ? selectedDate : 'All Dates'})
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Direct data entry matching operational schema with inline editing, quick depressurization, and instant CSV export
                </p>
              </div>

              {/* Zone Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'ALL', label: 'All Zones' },
                    { id: 'LAYDOWN_1', label: 'Laydown 1' },
                    { id: 'LAYDOWN_2', label: 'Laydown 2' },
                  ] as const
                ).map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setZoneFilter(z.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      zoneFilter === z.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Master Table */}
            <div className="overflow-x-auto max-h-[650px] overflow-y-auto border border-slate-600 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[1450px]">
                <thead className="sticky top-0 z-10 bg-slate-800 border-b border-slate-600 text-slate-200 text-[11px] uppercase tracking-wider font-bold">
                  <tr className="border-b border-slate-600">
                    <th className="p-3">Report Date</th>
                    <th className="p-3">ISO Tank No.</th>
                    <th className="p-3">Serial No.</th>
                    <th className="p-3 text-center">Shipment</th>
                    <th className="p-3">Yard Position</th>
                    <th className="p-3 text-right">
                      Level<br /><span className="text-[9px] text-slate-500 font-normal">(%)</span>
                    </th>
                    <th className="p-3 text-right">
                      Level<br /><span className="text-[9px] text-slate-500 font-normal">(mmH₂O)</span>
                    </th>
                    <th className="p-3 text-right">
                      Volume<br /><span className="text-[9px] text-slate-500 font-normal">(m³)</span>
                    </th>
                    <th className="p-3 text-right">
                      Mass<br /><span className="text-[9px] text-slate-500 font-normal">(Ton)</span>
                    </th>
                    <th className="p-3 text-center">
                      Battery<br /><span className="text-[9px] text-slate-500 font-normal">(%)</span>
                    </th>
                    <th className="p-3 text-right">
                      Pressure<br /><span className="text-[9px] text-slate-500 font-normal">(MPa)</span>
                    </th>
                    <th className="p-3 text-right">
                      Temperature<br /><span className="text-[9px] text-slate-500 font-normal">(°C)</span>
                    </th>
                    <th className="p-3 text-center">
                      Depress Status<br /><span className="text-[9px] text-slate-500 font-normal">(ΔP / Loss)</span>
                    </th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-800/60 font-mono">
                  {masterInspectionList.map((rec) => {
                    const isSelected = selectedTanks.has(rec.tankNo);
                    const isHighPress = (rec.pressureMPa || 0) >= 0.76;
                    const isElevatedPress = (rec.pressureMPa || 0) >= 0.50 && (rec.pressureMPa || 0) < 0.76;
                    const isNormalPress = (rec.pressureMPa || 0) < 0.50;

                    const liveTank = tankInventory.find(t => t.id === rec.tankNo);
                    const positionLabel = liveTank?.currentZone === 'LAYDOWN_1' ? 'Laydown 1' 
                                        : liveTank?.currentZone === 'LAYDOWN_2' ? 'Laydown 2'
                                        : liveTank?.currentZone === 'BAY_01' ? 'Bay 01'
                                        : liveTank?.currentZone === 'BAY_02' ? 'Bay 02'
                                        : liveTank?.currentZone === 'BAY_03' ? 'Bay 03'
                                        : liveTank?.currentZone === 'BAY_04' ? 'Bay 04'
                                        : rec.position || 'Laydown 1';

                    return (
                      <tr
                        key={rec.id || `${rec.reportDate}-${rec.tankNo}`}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-emerald-950/20' : 'bg-transparent'
                        }`}
                      >
                        {/* 1. Report Date */}
                        <td className="p-3 text-slate-300 font-sans whitespace-nowrap">
                          {rec.reportDate}
                        </td>

                        {/* 2. ISO Tk No. */}
                        <td className="p-3 font-bold text-blue-400">
                          {rec.tankNo}
                        </td>

                        {/* 3. Serial No. */}
                        <td className="p-3 text-slate-300">
                          {rec.serialNo}
                        </td>

                        {/* 4. Shipment */}
                        <td className="p-3 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                            {rec.shipment}
                          </span>
                        </td>

                        {/* 5. Yard Position (Read-only) */}
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                            {positionLabel}
                          </span>
                        </td>

                        {/* 6. Level (%) */}
                        <td className="p-3 text-right font-bold text-emerald-400">
                          {rec.level}%
                        </td>

                        {/* 7. Level (mmH2O) */}
                        <td className="p-3 text-right text-slate-300">
                          {rec.levelMmH2O}
                        </td>

                        {/* 8. Volume (m³) */}
                        <td className="p-3 text-right text-slate-200">
                          {rec.levelM3.toFixed(1)}
                        </td>

                        {/* 9. Mass (Ton) */}
                        <td className="p-3 text-right text-slate-200">
                          {((rec.levelM3 || 0) * 0.426).toFixed(2)}
                        </td>

                        {/* 9. Battery (%) */}
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              (rec.battery || 75) > 50
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : (rec.battery || 75) > 20
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            <Battery className="w-3 h-3" />
                            {rec.battery}%
                          </span>
                        </td>

                        {/* 10. Pressure (MPa) with Safety Badges */}
                        <td className="p-3 text-right">
                          <span className="font-bold text-slate-100 block">
                            {(rec.pressureMPa || 0).toFixed(2)} MPa
                          </span>
                          {isHighPress && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold inline-block animate-pulse">
                              High (Vent Req)
                            </span>
                          )}
                          {isElevatedPress && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold inline-block">
                              Elevated
                            </span>
                          )}
                          {isNormalPress && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold inline-block">
                              Normal
                            </span>
                          )}
                        </td>

                        {/* 11. Temp (°C) */}
                        <td className="p-3 text-right text-cyan-400 font-semibold">
                          {(rec.tempC || -126.5).toFixed(1)} °C
                        </td>

                        {/* 13. Depress Status */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {(rec.depress || '').toLowerCase().includes('depress') ? (
                              <>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  {rec.depress || 'Depressurized'}
                                </span>
                                <div className="flex flex-col items-center">
                                  <div className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                    <span>{(rec.pressBeforeMPa || 0).toFixed(2)}</span>
                                    <span className="text-slate-600 text-[8px]">➔</span>
                                    <span className="text-emerald-400">{(rec.pressAfterMPa || 0).toFixed(2)}</span>
                                  </div>
                                  <span className="text-[9px] text-amber-400 font-bold">{rec.lossesKg || 0} kg</span>
                                </div>
                              </>
                            ) : (rec.depress || '').toLowerCase().includes('pending') ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                Pending
                              </span>
                            ) : (
                              <span className="text-slate-600 font-bold">-</span>
                            )}
                          </div>
                        </td>

                        {/* 14. Remarks */}
                        <td className="p-3 font-sans text-slate-300 max-w-[180px] truncate" title={rec.remarks}>
                          {rec.remarks || '-'}
                        </td>


                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
      {/* DOMAIN 1 - SUB-TAB 4: 🔄 LAYDOWN 2 (Heel 4% Staging & Return)         */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'LAYDOWN_3_HEEL' && (() => {
        const yard2TanksList = zoneStats.yard2.tanks;
        const avgHeelPct = yard2TanksList.length > 0
          ? (yard2TanksList.reduce((acc, t) => acc + (t.levelPercent || 4.0), 0) / yard2TanksList.length).toFixed(1)
          : '4.0';

        return (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                Laydown Yard 2: Heel 4% Staging & MV. Saviour Backhaul Clearance
              </h3>
              <p className="text-xs text-slate-400">
                Exclusively collects depleted tanks from bays retaining ~350 kg cold heel (0.22 MPa, -135°C) for Arun return voyage
              </p>
            </div>

            <button
              type="button"
              onClick={handleAuthorizeBackhaul}
              disabled={selectedBackhaulTanks.size === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedBackhaulTanks.size > 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Ship className="w-4 h-4" />
              <span>Authorize MV. Saviour Backhaul ({selectedBackhaulTanks.size} Tanks)</span>
            </button>
          </div>

          {/* Staging Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-xs font-semibold block mb-1">Empty Heel Tanks Staged</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-purple-400">{yard2TanksList.length}</span>
                <span className="text-xs text-slate-500">Tanks</span>
              </div>
              <span className="text-[10px] text-slate-500">Depleted & Ready for Return</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-xs font-semibold block mb-1">Avg Residual Heel Level</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-slate-200">{avgHeelPct}%</span>
                <span className="text-xs text-slate-500">(~350 kg)</span>
              </div>
              <span className="text-[10px] text-slate-500">Cold heel preserved</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-xs font-semibold block mb-1">Avg Heel Holding Pressure</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-emerald-400">{zoneStats.yard2.avgPress.toFixed(2)}</span>
                <span className="text-xs text-slate-500">MPa</span>
              </div>
              <span className="text-[10px] text-slate-500">Safe marine transit margin</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-purple-500/40 bg-purple-950/20 rounded-xl">
              <span className="text-purple-300 text-xs font-semibold block mb-1">Selected for Backhaul</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-purple-300">{selectedBackhaulTanks.size}</span>
                <span className="text-xs text-slate-400">of {yard2TanksList.length}</span>
              </div>
              <span className="text-[10px] text-purple-400/80">Target: MV. Saviour (Voyage 02)</span>
            </div>
          </div>

          {/* 12-Slot Visual Return Staging Buffer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                Laydown Yard 2: 12-Slot Return Buffer
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBackhaulTanks.size === yard2TanksList.length && yard2TanksList.length > 0) {
                      setSelectedBackhaulTanks(new Set());
                    } else {
                      setSelectedBackhaulTanks(new Set(yard2TanksList.map((t) => t.id)));
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {selectedBackhaulTanks.size === yard2TanksList.length && yard2TanksList.length > 0 ? 'Deselect All' : 'Select All for Backhaul'}
                </button>
              </div>
            </div>

            {yard2TanksList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No empty tanks currently staged in Laydown Yard 2. Tanks will auto-cycle here as regas vaporization depletes them to ≤ 4%.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {yard2TanksList.map((tank) => {
                  const isSelected = selectedBackhaulTanks.has(tank.id);

                  return (
                    <div
                      key={tank.id}
                      onClick={() => toggleSelectBackhaulTank(tank.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-purple-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="font-mono font-bold text-sm text-purple-300">{tank.id}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            HEEL 4% READY
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 block mb-2">{tank.serialNo}</span>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Pressure</span>
                            <span className="text-emerald-400 font-bold">{(tank.pressureMpa || 0).toFixed(2)} MPa</span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Preserved Heel</span>
                            <span className="text-slate-200 font-bold">{tank.levelPercent}% (~350kg)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 flex justify-between items-center pt-2 border-t border-slate-800/80">
                        <span>Voyage: Backhaul Return</span>
                        <span className="text-purple-400 font-semibold">{isSelected ? 'Selected' : 'Click to Select'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* DOMAIN 1 - SUB-TAB 5: ⚖️ ISO TANK MASS BALANCE & DEPRESSURIZATION LOG   */}
      {/* ==================================================================== */}
      {activeDomain === 'ISO_TANK_MGMT' && tankSubTab === 'TANK_MASS_BALANCE' && (
        <NiasTankMassBalanceTab />
      )}

      {/* ==================================================================== */}
      {/* 🌐 PROMOTED TOP LEVEL: TERMINAL INTEGRATED OVERVIEW & PFD DASHBOARD   */}
      {/* ==================================================================== */}
      {activeDomain === 'TERMINAL_OVERVIEW' && (
        <NiasOperationalOverviewTab
          onNavigateSubTab={(targetTab, domain) => {
            if (domain) setActiveDomain(domain);
            if (domain === 'ISO_TANK_MGMT') {
              setTankSubTab(targetTab as any);
            } else {
              setRegasSubTab(targetTab as any);
            }
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 1: 📊 GAS PROCESS & STATE TELEMETRY (ROLLBACK)    */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'GAS_PROCESS_TELEMETRY' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                End-to-End Gas Process & Cryogenic State Transformation Telemetry
              </h3>
              <p className="text-xs text-slate-400">
                Continuous physical state tracking: HP Cryo Liquid (-126°C, 0.81 MPa) ➔ Ambient Phase Change ➔ Regulated Header (28°C, 0.35 MPa) ➔ PLTMG Turbines
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Continuous Vaporization Active
              </span>
            </div>
          </div>

          {/* Interactive SCADA P&ID Process Diagram */}
          <NiasProcessPIDDiagram />

          {/* Detailed Sendout Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">Total Daily Sendout</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-amber-400">108,000</span>
                <span className="text-xs text-slate-500">Nm³/day</span>
              </div>
              <span className="text-[10px] text-slate-500">Mass: 54.0 Tons LNG</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">Sendout Header Pressure</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-emerald-400">0.35</span>
                <span className="text-xs text-slate-500">MPa (50.8 PSI)</span>
              </div>
              <span className="text-[10px] text-slate-500">Target Turbine Regulator</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">Sendout Gas Temperature</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-slate-100">+28.4</span>
                <span className="text-xs text-slate-500">°C</span>
              </div>
              <span className="text-[10px] text-slate-500">Ambient Superheat Margin</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">Pressure Drop Across Skid</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-cyan-400">0.44</span>
                <span className="text-xs text-slate-500">MPa ΔP</span>
              </div>
              <span className="text-[10px] text-slate-500">From 0.79 MPa Bay Inlet</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DOMAIN 2 - SUB-TAB 2: 🔬 GC & GAS QUALITY STREAM                     */}
      {/* ==================================================================== */}
      {activeDomain === 'REGAS_SYSTEM' && regasSubTab === 'GC_GAS_QUALITY' && (
        <NiasGasQualityTab />
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Mount {quickMountTankNo} to Vaporizer Bay
              </h3>
              <button onClick={() => setQuickMountTankNo(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
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
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-100 block">{bay.bayId}</span>
                    <span className="text-[10px] text-slate-400">
                      {bay.tankNo ? `Current: ${bay.tankNo} (${bay.status})` : 'Available (Empty)'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      bay.status === 'RUNNING'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {bay.status === 'RUNNING' ? 'In Use' : 'Ready'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setQuickMountTankNo(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mount Modal (From Bay card) */}
      {mountModalBayId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                Mount ISO Tank to {mountModalBayId}
              </h3>
              <button
                onClick={() => setMountModalBayId(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
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
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-blue-400">{tank.id}</span>
                    <span className="text-xs text-slate-400 font-mono ml-2">({tank.serialNo})</span>
                    <span className="text-[10px] text-slate-500 block">{tank.currentZone}</span>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-emerald-400 font-bold block">{tank.levelPercent}% Level</span>
                    <span className="text-slate-400">{(tank.pressureMpa || 0).toFixed(2)} MPa</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setMountModalBayId(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Log Bay Consumption Modal */}
      {isConsumptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Log PLTMG Vaporization Consumption (Arun COQ Inherited)
              </h3>
              <button onClick={() => setIsConsumptionModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConsumptionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Active Regas Bay:</label>
                  <select
                    value={conBayId}
                    onChange={(e) => setConBayId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-bold cursor-pointer"
                  >
                    <option value="Bay 01">Bay 01</option>
                    <option value="Bay 02">Bay 02</option>
                    <option value="Bay 03">Bay 03</option>
                    <option value="Bay 04">Bay 04</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ISO Tank No (Mounted):</label>
                  <select
                    value={conTankNo}
                    onChange={(e) => setConTankNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold cursor-pointer"
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
              <div className="p-3.5 bg-slate-950 rounded-xl border border-blue-500/40 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <FlaskConical className="w-4 h-4" />
                    <span>Inherited Arun Lab Baseline ({conTankNo})</span>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                    Shipment: {linkedArunBaseline.shipment}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Arun Lab GHV:</span>
                    <span className="font-bold text-emerald-400">{linkedArunBaseline.ghvBtuKg.toLocaleString()} BTU/Kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Methane (CH₄):</span>
                    <span className="font-bold text-slate-200">{linkedArunBaseline.methaneMolPct}% Mol</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Delivered MMBtu:</span>
                    <span className="font-bold text-blue-400">{linkedArunBaseline.deliveredMMBtu.toFixed(2)} MMBtu</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Delivered Weight:</span>
                    <span className="font-bold text-slate-200">{linkedArunBaseline.deliveredWeightKg.toLocaleString()} Kg</span>
                  </div>
                </div>
              </div>

              {/* Physical Consumption Measurements */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Consumed Weight (Kg):</label>
                  <input
                    type="number"
                    value={conWeightKg}
                    onChange={(e) => setConWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Consumed Volume (m³):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={conVolumeM3}
                    onChange={(e) => setConVolumeM3(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Density (Kg/m³):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={conDensity}
                    onChange={(e) => setConDensity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">BOG Losses (Kg):</label>
                  <input
                    type="number"
                    value={conLossKg}
                    onChange={(e) => setConLossKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">BOG Loss Rate (%):</label>
                  <input
                    type="number"
                    disabled
                    value={calculatedLossPct}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded px-2.5 py-1.5 text-amber-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Calculated Consumed:</label>
                  <div className="px-2.5 py-1.5 bg-slate-900 border border-amber-500/50 rounded font-mono font-bold text-amber-400 text-sm">
                    {calculatedConsumedMMBtu} MMBtu
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Formula: (Consumed Kg × Arun GHV) / 1,000,000</span>
                <span className="text-amber-400 font-bold">
                  ({conWeightKg.toLocaleString()} × {linkedArunBaseline.ghvBtuKg.toLocaleString()}) / 10⁶ = {calculatedConsumedMMBtu} MMBtu
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConsumptionModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shadow-md shadow-amber-500/20"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Send {mroModalTankNo} to Nias MRO Bay
              </h3>
              <button
                onClick={() => setMroModalTankNo(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMroSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Defect Classification:</label>
                <select
                  value={defectCat}
                  onChange={(e) => setDefectCat(e.target.value as DefectCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
                  <option value="VACUUM_LOSS">Vacuum Loss (High BOG / Annular failure)</option>
                  <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
                  <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Corner casting)</option>
                  <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Defect Description:</label>
                <textarea
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="Observed leak, pressure rise, or sensor failure..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMroModalTankNo(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Allocate Tank to {slotMoveModal.targetYard} (Slot {slotMoveModal.slotIndex})
              </h3>
              <button onClick={() => setSlotMoveModal(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
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
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-emerald-400">{t.id}</span>
                    <span className="text-xs text-slate-400 font-mono ml-2">({t.serialNo})</span>
                    <span className="text-[10px] text-slate-500 block">Current: {t.currentZone}</span>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-slate-200 font-semibold block">{(t.pressureMpa || 0).toFixed(2)} MPa</span>
                    <span className="text-slate-400">{t.levelPercent}% Level</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSlotMoveModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1 MODAL REMOVED - NOW INTEGRATED AS DRAWER */}

      {/* ==================================================================== */}
      {/* STAGE 2: PRE-BACKHAUL DEPARTURE INSPECTION MODAL (Laydown 3 -> Ship) */}
      {/* ==================================================================== */}
      {isBackhaulModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Ship className="w-5 h-5 text-purple-400" />
                Stage 2: Pre-Backhaul Inspection & Marine Manifest
              </h3>
              <button
                onClick={() => setIsBackhaulModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Pre-departure inspection for <span className="font-bold text-purple-300">{selectedBackhaulTanks.size} selected heel tanks</span> before loading aboard <span className="font-bold text-blue-400">{stage2VesselName}</span>:
            </p>

            <form onSubmit={handleBackhaulModalSubmit} className="space-y-4 text-xs">
              {/* Selected Tanks Pill List */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold mb-1.5">
                  Selected Tanks for Backhaul ({selectedBackhaulTanks.size})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedBackhaulTanks).map((tNo) => (
                    <span
                      key={tNo}
                      className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-mono text-[11px] font-bold"
                    >
                      {tNo}
                    </span>
                  ))}
                </div>
              </div>

              {/* Manifest Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Backhaul Manifest No:</label>
                  <input
                    type="text"
                    value={stage2ManifestNo}
                    onChange={(e) => setStage2ManifestNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-purple-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Vessel Assignment:</label>
                  <input
                    type="text"
                    value={stage2VesselName}
                    onChange={(e) => setStage2VesselName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-blue-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Departure Inspection Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Departure Date & Time:</label>
                  <input
                    type="text"
                    value={stage2Date}
                    onChange={(e) => setStage2Date(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Departure Heel Mass (Kg):</label>
                  <input
                    type="number"
                    value={stage2MassKg}
                    onChange={(e) => setStage2MassKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Departure Pressure (MPa):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stage2PressureMPa}
                    onChange={(e) => setStage2PressureMPa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Departure Temperature (°C):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={stage2TempC}
                    onChange={(e) => setStage2TempC(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Safety Clearance Checklist */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Marine Safety Clearance Checklist (IMDG 2.1)
                </span>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage2ValvesSealed}
                    onChange={(e) => setStage2ValvesSealed(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span>Primary liquid & vapor valves closed, capped, and blind flanges tightened</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage2PressureWithinLimit}
                    onChange={(e) => setStage2PressureWithinLimit(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span>Holding pressure &lt; 0.40 MPa (adequate voyage safety holding margin)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage2VacuumIntact}
                    onChange={(e) => setStage2VacuumIntact(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span>Outer jacket vacuum insulation intact (no shell condensation / frost observed)</span>
                </label>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Clearance Remarks:</label>
                <input
                  type="text"
                  value={stage2Remarks}
                  onChange={(e) => setStage2Remarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBackhaulModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!stage2ValvesSealed || !stage2PressureWithinLimit || !stage2VacuumIntact}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                    stage2ValvesSealed && stage2PressureWithinLimit && stage2VacuumIntact
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-blue-400" />
                <span>Relocate ISO Tank {relocateModalTank.tankNo}</span>
              </h3>
              <button
                onClick={() => setRelocateModalTank(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Seamlessly reassign vessel <span className="font-bold text-blue-400 font-mono">{relocateModalTank.tankNo}</span> ({relocateModalTank.serialNo}) across physical terminal lifecycle zones:
            </p>

            <form onSubmit={handleConfirmRelocation} className="space-y-4 text-xs">
              {/* Origin vs Target Preview */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Current Origin</span>
                  <span className="font-bold text-slate-200 text-xs truncate block">
                    {relocateModalTank.position || 'Nias Yard'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Target Destination</span>
                  <span className="font-bold text-emerald-400 text-xs truncate block">
                    {relocateTargetZone} {relocateTargetZone.startsWith('Laydown') ? `(Slot ${relocateSlotNumber})` : ''}
                  </span>
                </div>
              </div>

              {/* Target Destination Selector */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Destination Zone / Rack:</label>
                <select
                  value={relocateTargetZone}
                  onChange={(e) => setRelocateTargetZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-100 font-bold cursor-pointer"
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
                  <label className="block text-slate-400 mb-1 font-semibold">Assign Slot Position (1 ~ 12):</label>
                  <select
                    value={relocateSlotNumber}
                    onChange={(e) => setRelocateSlotNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold cursor-pointer"
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
                <div className="p-3.5 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold border-b border-purple-800/60 pb-1.5">
                    <RotateCcw className="w-4 h-4 text-purple-400" />
                    <span>Cold Heel 4% Preservation Parameters</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Preserved Heel Level (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={relocateHeelPct}
                        onChange={(e) => setRelocateHeelPct(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Residual Pressure (MPa):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={relocateHeelPressMPa}
                        onChange={(e) => setRelocateHeelPressMPa(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-emerald-400 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Cryo Temp (°C):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={relocateHeelTempC}
                        onChange={(e) => setRelocateHeelTempC(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-cyan-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Heel Mass (Kg):</label>
                      <input
                        type="number"
                        value={relocateHeelWeightKg}
                        onChange={(e) => setRelocateHeelWeightKg(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks Input */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Relocation Remarks / Reason:</label>
                <input
                  type="text"
                  placeholder="e.g. Staged for peak evening load / Venting boil-off gas"
                  value={relocateRemarks}
                  onChange={(e) => setRelocateRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-sans"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRelocateModalTank(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Relocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
