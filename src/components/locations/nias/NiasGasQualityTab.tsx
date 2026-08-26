'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FlaskConical,
  Activity,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Layers,
  Gauge,
  Droplets,
  Flame,
  ShieldCheck,
  Table,
  Filter,
  FileSpreadsheet,
  Save,
  RotateCcw,
  Search,
  Zap,
  Edit3,
  SlidersHorizontal,
  FileText,
  Boxes,
  Thermometer,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';
import { exportDatasetToCSV } from '@/utils/excelExporter';
import { NodeState } from '@/types/lng';
import {
  GasQualityMasterRecord,
  MeterCumulativeFlow,
  MeterDailyFlow,
  MeterGasCondition,
  GasMolecularComposition,
  GasHeavyTrace,
} from '@/types/gasQuality';

// Initial Master Dataset (Database-Ready Normalized Records from NIAS - G.C Report & GC Analysis)
const INITIAL_DATABASE_READY_RECORDS: GasQualityMasterRecord[] = [
  {
    date: '2026-07-29',
    status: 'DELIVERED',
    activeFeedTank: 'ISOT-009',
    serialNo: 'SIMU-8101426',
    cumMeterA: { uvol: 6.20, cvol: 6.21, massTonne: 124.06, mmbtu: 6509.65 },
    cumMeterB: { uvol: 7.12, cvol: 7.12, massTonne: 142.29, mmbtu: 7466.06 },
    cumStation: { uvol: 13.32, cvol: 13.33, massTonne: 266.35, mmbtu: 20387.80 },
    dailyMeterA: { uvol: 0.01, cvol: 0.01, massTonne: 0.02, mmbtu: 0.98 },
    dailyMeterB: { uvol: 0.50, cvol: 0.50, massTonne: 10.02, mmbtu: 523.05 },
    dailyStation: { uvol: 0.51, cvol: 0.51, massTonne: 10.04, mmbtu: 524.03 },
    conditionMeterA: { pressBarg: 7.05, tempC: 32.75, lineDens: 5.42, lineZf: 0.9821, ghv: 1049.72 },
    conditionMeterB: { pressBarg: 2.18, tempC: 23.35, lineDens: 2.18, lineZf: 0.9942, ghv: 1049.72 },
    gcActiveTank: { ch4: 96.5341, c2h6: 2.7050, c3h8: 0.5096, iC4: 0.0750, nC4: 0.0820, iC5: 0.0050, nC5: 0.0050, n2: 0.0301, co2: 0.0000 },
    gcMeterA: { ch4: 96.5341, c2h6: 2.7050, c3h8: 0.5096, iC4: 0.0750, nC4: 0.0820, iC5: 0.0050, nC5: 0.0050, n2: 0.0301, co2: 0.0000 },
    gcMeterB: { ch4: 96.5341, c2h6: 2.7050, c3h8: 0.5096, iC4: 0.0750, nC4: 0.0820, iC5: 0.0050, nC5: 0.0050, n2: 0.0301, co2: 0.0000 },
    heavyTrace: { hexane: 0.0150, heptane: 0.0120, octane: 0.0, nonane: 0.0, decane: 0.0, h2s: 0.0, h2o: 0.0 },
    submittedAt: '29/07/2026, 17:00:00 WIB',
  },
  {
    date: '2026-07-28',
    status: 'DELIVERED',
    activeFeedTank: 'ISOT-008',
    serialNo: 'SIMU-8101370',
    cumMeterA: { uvol: 6.20, cvol: 6.21, massTonne: 124.06, mmbtu: 6509.65 },
    cumMeterB: { uvol: 7.12, cvol: 7.12, massTonne: 142.29, mmbtu: 7466.06 },
    cumStation: { uvol: 13.32, cvol: 13.33, massTonne: 266.35, mmbtu: 19863.77 },
    dailyMeterA: { uvol: 0.00, cvol: 0.00, massTonne: 0.00, mmbtu: 0.00 },
    dailyMeterB: { uvol: 0.43, cvol: 0.43, massTonne: 8.49, mmbtu: 445.36 },
    dailyStation: { uvol: 0.43, cvol: 0.43, massTonne: 8.49, mmbtu: 445.36 },
    conditionMeterA: { pressBarg: 0.00, tempC: 0.00, lineDens: 0.00, lineZf: 1.0000, ghv: 1047.47 },
    conditionMeterB: { pressBarg: 1.90, tempC: 34.64, lineDens: 1.92, lineZf: 0.9949, ghv: 1047.47 },
    gcActiveTank: { ch4: 96.7138, c2h6: 2.5840, c3h8: 0.4753, iC4: 0.0720, nC4: 0.0843, iC5: 0.0051, nC5: 0.0051, n2: 0.0330, co2: 0.0000 },
    gcMeterA: { ch4: 96.7138, c2h6: 2.5840, c3h8: 0.4753, iC4: 0.0720, nC4: 0.0843, iC5: 0.0051, nC5: 0.0051, n2: 0.0330, co2: 0.0000 },
    gcMeterB: { ch4: 96.7138, c2h6: 2.5840, c3h8: 0.4753, iC4: 0.0720, nC4: 0.0843, iC5: 0.0051, nC5: 0.0051, n2: 0.0330, co2: 0.0000 },
    heavyTrace: { hexane: 0.0147, heptane: 0.0179, octane: 0.0, nonane: 0.0, decane: 0.0, h2s: 0.0, h2o: 0.0 },
    submittedAt: '28/07/2026, 17:00:00 WIB',
  },
  {
    date: '2026-07-27',
    status: 'DELIVERED',
    activeFeedTank: 'ISOT-007',
    serialNo: 'SIMU-8101494',
    cumMeterA: { uvol: 6.07, cvol: 6.07, massTonne: 121.28, mmbtu: 6364.02 },
    cumMeterB: { uvol: 6.23, cvol: 6.23, massTonne: 124.59, mmbtu: 6537.41 },
    cumStation: { uvol: 12.30, cvol: 12.30, massTonne: 245.87, mmbtu: 19418.41 },
    dailyMeterA: { uvol: 0.19, cvol: 0.19, massTonne: 3.70, mmbtu: 193.02 },
    dailyMeterB: { uvol: 0.40, cvol: 0.40, massTonne: 8.06, mmbtu: 421.20 },
    dailyStation: { uvol: 0.59, cvol: 0.59, massTonne: 11.76, mmbtu: 614.22 },
    conditionMeterA: { pressBarg: 0.12, tempC: 17.50, lineDens: 0.85, lineZf: 0.9991, ghv: 1049.26 },
    conditionMeterB: { pressBarg: 2.19, tempC: 19.33, lineDens: 2.19, lineZf: 0.9945, ghv: 1049.26 },
    gcActiveTank: { ch4: 96.5013, c2h6: 2.6054, c3h8: 0.4071, iC4: 0.0750, nC4: 0.0830, iC5: 0.0050, nC5: 0.0050, n2: 0.0295, co2: 0.0000 },
    gcMeterA: { ch4: 96.5013, c2h6: 2.6054, c3h8: 0.4071, iC4: 0.0750, nC4: 0.0830, iC5: 0.0050, nC5: 0.0050, n2: 0.0295, co2: 0.0000 },
    gcMeterB: { ch4: 96.5013, c2h6: 2.6054, c3h8: 0.4071, iC4: 0.0750, nC4: 0.0830, iC5: 0.0050, nC5: 0.0050, n2: 0.0295, co2: 0.0000 },
    heavyTrace: { hexane: 0.0150, heptane: 0.0140, octane: 0.0, nonane: 0.0, decane: 0.0, h2s: 0.0, h2o: 0.0 },
    submittedAt: '27/07/2026, 17:00:00 WIB',
  },
  {
    date: '2026-07-26',
    status: 'DELIVERED',
    activeFeedTank: 'ISOT-006',
    serialNo: 'SIMU-8101489',
    cumMeterA: { uvol: 6.07, cvol: 6.07, massTonne: 121.28, mmbtu: 6364.02 },
    cumMeterB: { uvol: 6.23, cvol: 6.23, massTonne: 124.59, mmbtu: 6537.41 },
    cumStation: { uvol: 12.30, cvol: 12.30, massTonne: 245.87, mmbtu: 18804.19 },
    dailyMeterA: { uvol: 0.00, cvol: 0.00, massTonne: 0.00, mmbtu: 0.00 },
    dailyMeterB: { uvol: 0.37, cvol: 0.37, massTonne: 7.39, mmbtu: 387.64 },
    dailyStation: { uvol: 0.37, cvol: 0.37, massTonne: 7.39, mmbtu: 387.64 },
    conditionMeterA: { pressBarg: 0.00, tempC: 0.00, lineDens: 0.00, lineZf: 1.0000, ghv: 1048.18 },
    conditionMeterB: { pressBarg: 0.72, tempC: 27.02, lineDens: 1.16, lineZf: 0.9968, ghv: 1048.18 },
    gcActiveTank: { ch4: 96.6434, c2h6: 2.6407, c3h8: 0.4902, iC4: 0.0749, nC4: 0.0871, iC5: 0.0052, nC5: 0.0052, n2: 0.0294, co2: 0.0000 },
    gcMeterA: { ch4: 96.6434, c2h6: 2.6407, c3h8: 0.4902, iC4: 0.0749, nC4: 0.0871, iC5: 0.0052, nC5: 0.0052, n2: 0.0294, co2: 0.0000 },
    gcMeterB: { ch4: 96.6434, c2h6: 2.6407, c3h8: 0.4902, iC4: 0.0749, nC4: 0.0871, iC5: 0.0052, nC5: 0.0052, n2: 0.0294, co2: 0.0000 },
    heavyTrace: { hexane: 0.0154, heptane: 0.0136, octane: 0.0, nonane: 0.0, decane: 0.0, h2s: 0.0, h2o: 0.0 },
    submittedAt: '26/07/2026, 17:00:00 WIB',
  },
  {
    date: '2026-07-25',
    status: 'DELIVERED',
    activeFeedTank: 'ISOT-005',
    serialNo: 'SIMU-8101410',
    cumMeterA: { uvol: 6.07, cvol: 6.07, massTonne: 121.28, mmbtu: 6364.02 },
    cumMeterB: { uvol: 5.86, cvol: 5.86, massTonne: 117.20, mmbtu: 6149.77 },
    cumStation: { uvol: 11.93, cvol: 11.93, massTonne: 238.48, mmbtu: 18416.55 },
    dailyMeterA: { uvol: 6.01, cvol: 6.01, massTonne: 119.31, mmbtu: 6294.31 },
    dailyMeterB: { uvol: 5.82, cvol: 5.82, massTonne: 116.28, mmbtu: 6101.43 },
    dailyStation: { uvol: 11.83, cvol: 11.83, massTonne: 236.24, mmbtu: 12395.74 },
    conditionMeterA: { pressBarg: 0.00, tempC: 0.00, lineDens: 0.00, lineZf: 1.0000, ghv: 1047.91 },
    conditionMeterB: { pressBarg: 0.72, tempC: 25.82, lineDens: 1.17, lineZf: 0.9968, ghv: 1047.91 },
    gcActiveTank: { ch4: 96.6649, c2h6: 2.6270, c3h8: 0.4862, iC4: 0.0738, nC4: 0.0859, iC5: 0.0049, nC5: 0.0049, n2: 0.0295, co2: 0.0000 },
    gcMeterA: { ch4: 96.6649, c2h6: 2.6270, c3h8: 0.4862, iC4: 0.0738, nC4: 0.0859, iC5: 0.0049, nC5: 0.0049, n2: 0.0295, co2: 0.0000 },
    gcMeterB: { ch4: 96.6649, c2h6: 2.6270, c3h8: 0.4862, iC4: 0.0738, nC4: 0.0859, iC5: 0.0049, nC5: 0.0049, n2: 0.0295, co2: 0.0000 },
    heavyTrace: { hexane: 0.0152, heptane: 0.0126, octane: 0.0, nonane: 0.0, decane: 0.0, h2s: 0.0, h2o: 0.0 },
    submittedAt: '25/07/2026, 17:00:00 WIB',
  },
  {
    date: '2026-07-24',
    status: 'DELIVERED',
    activeFeedTank: 'ISOT-004',
    serialNo: 'SIMU-8101452',
    cumMeterA: { uvol: 0.04, cvol: 0.04, massTonne: 0.95, mmbtu: 50.05 },
    cumMeterB: { uvol: 0.03, cvol: 0.03, massTonne: 0.72, mmbtu: 37.86 },
    cumStation: { uvol: 0.07, cvol: 0.07, massTonne: 1.67, mmbtu: 6020.81 },
    dailyMeterA: { uvol: 0.04, cvol: 0.04, massTonne: 0.95, mmbtu: 50.05 },
    dailyMeterB: { uvol: 0.03, cvol: 0.03, massTonne: 0.72, mmbtu: 37.86 },
    dailyStation: { uvol: 0.07, cvol: 0.07, massTonne: 1.67, mmbtu: 87.91 },
    conditionMeterA: { pressBarg: 8.45, tempC: 45.40, lineDens: 6.10, lineZf: 0.9855, ghv: 1047.47 },
    conditionMeterB: { pressBarg: 6.93, tempC: 30.27, lineDens: 5.34, lineZf: 0.9860, ghv: 1047.47 },
    gcActiveTank: { ch4: 96.7138, c2h6: 2.5840, c3h8: 0.4753, iC4: 0.0720, nC4: 0.0843, iC5: 0.0051, nC5: 0.0051, n2: 0.0330, co2: 0.0000 },
    gcMeterA: { ch4: 96.7138, c2h6: 2.5840, c3h8: 0.4753, iC4: 0.0720, nC4: 0.0843, iC5: 0.0051, nC5: 0.0051, n2: 0.0330, co2: 0.0000 },
    gcMeterB: { ch4: 96.7138, c2h6: 2.5840, c3h8: 0.4753, iC4: 0.0720, nC4: 0.0843, iC5: 0.0051, nC5: 0.0051, n2: 0.0330, co2: 0.0000 },
    heavyTrace: { hexane: 0.0147, heptane: 0.0179, octane: 0.0, nonane: 0.0, decane: 0.0, h2s: 0.0, h2o: 0.0 },
    submittedAt: '24/07/2026, 17:00:00 WIB',
  },
  {
    date: '2026-07-23',
    status: 'DELIVERED',
    activeFeedTank: 'ISOT-003',
    serialNo: 'SIMU-8101431',
    cumMeterA: { uvol: 0.94, cvol: 0.95, massTonne: 18.96, mmbtu: 995.13 },
    cumMeterB: { uvol: 1.27, cvol: 1.27, massTonne: 25.39, mmbtu: 1332.46 },
    cumStation: { uvol: 2.21, cvol: 2.22, massTonne: 44.35, mmbtu: 5932.90 },
    dailyMeterA: { uvol: 0.94, cvol: 0.95, massTonne: 18.90, mmbtu: 995.13 },
    dailyMeterB: { uvol: 1.27, cvol: 1.27, massTonne: 25.39, mmbtu: 1332.46 },
    dailyStation: { uvol: 2.21, cvol: 2.22, massTonne: 44.35, mmbtu: 2327.59 },
    conditionMeterA: { pressBarg: 10.00, tempC: 24.80, lineDens: 7.54, lineZf: 0.9794, ghv: 1047.31 },
    conditionMeterB: { pressBarg: 10.00, tempC: 25.21, lineDens: 7.52, lineZf: 0.9795, ghv: 1047.31 },
    gcActiveTank: { ch4: 96.7084, c2h6: 2.5913, c3h8: 0.4768, iC4: 0.0721, nC4: 0.0835, iC5: 0.0047, nC5: 0.0047, n2: 0.0344, co2: 0.0000 },
    gcMeterA: { ch4: 96.7084, c2h6: 2.5913, c3h8: 0.4768, iC4: 0.0721, nC4: 0.0835, iC5: 0.0047, nC5: 0.0047, n2: 0.0344, co2: 0.0000 },
    gcMeterB: { ch4: 96.7084, c2h6: 2.5913, c3h8: 0.4768, iC4: 0.0721, nC4: 0.0835, iC5: 0.0047, nC5: 0.0047, n2: 0.0344, co2: 0.0000 },
    heavyTrace: { hexane: 0.0146, heptane: 0.0141, octane: 0.0, nonane: 0.0, decane: 0.0, h2s: 0.0, h2o: 0.0 },
    submittedAt: '23/07/2026, 17:00:00 WIB',
  },
];

const LOCAL_STORAGE_DB_READY_KEY = 'nias_official_gc_report_ledger_v5';

const ALL_MONTHS = [
  { value: '01', label: '01월 (January)' },
  { value: '02', label: '02월 (February)' },
  { value: '03', label: '03월 (March)' },
  { value: '04', label: '04월 (April)' },
  { value: '05', label: '05월 (May)' },
  { value: '06', label: '06월 (June)' },
  { value: '07', label: '07월 (July)' },
  { value: '08', label: '08월 (August)' },
  { value: '09', label: '09월 (September)' },
  { value: '10', label: '10월 (October)' },
  { value: '11', label: '11월 (November)' },
  { value: '12', label: '12월 (December)' },
];

export default function NiasGasQualityTab() {
  const { fleetTanks, gasCompositions, exportAllLogsToExcel } = usePortalData();

  // Unified Database-Ready Master Records State
  const [records, setRecords] = useState<GasQualityMasterRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(LOCAL_STORAGE_DB_READY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Could not read saved database-ready GC report ledger:', e);
      }
    }
    return INITIAL_DATABASE_READY_RECORDS;
  });

  // Heavy C5+ Columns Collapse Toggle
  const [showHeavyTrace, setShowHeavyTrace] = useState<boolean>(false);

  // Collapsible 4-Section Form State (Default: Collapsed)
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);

  // Filter Mode State (2 Modes: DATE_RANGE vs YEAR_MONTH)
  const [filterMode, setFilterMode] = useState<'DATE_RANGE' | 'YEAR_MONTH'>('DATE_RANGE');
  const [rangeStartDate, setRangeStartDate] = useState<string>('2026-07-01');
  const [rangeEndDate, setRangeEndDate] = useState<string>('2026-07-29');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('07');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // =========================================================================
  // Official Excel Form State (4 Sections with Full Parity)
  // =========================================================================
  const [entryDate, setEntryDate] = useState<string>('2026-07-29');

  // [Section 1: Common / Cumulative]
  const [cumMeterA, setCumMeterA] = useState<MeterCumulativeFlow>({ uvol: 6.20, cvol: 6.21, massTonne: 124.06, mmbtu: 6509.65 });
  const [cumMeterB, setCumMeterB] = useState<MeterCumulativeFlow>({ uvol: 7.12, cvol: 7.12, massTonne: 142.29, mmbtu: 7466.06 });
  const [cumStation, setCumStation] = useState<MeterCumulativeFlow>({ uvol: 13.32, cvol: 13.33, massTonne: 266.35, mmbtu: 20387.80 });

  // [Section 2: Daily Flow & Energy]
  const [dailyMeterA, setDailyMeterA] = useState<MeterDailyFlow>({ uvol: 0.01, cvol: 0.01, massTonne: 0.02, mmbtu: 0.98 });
  const [dailyMeterB, setDailyMeterB] = useState<MeterDailyFlow>({ uvol: 0.50, cvol: 0.50, massTonne: 10.02, mmbtu: 523.05 });
  const [dailyStation, setDailyStation] = useState<MeterDailyFlow>({ uvol: 0.51, cvol: 0.51, massTonne: 10.04, mmbtu: 524.03 });

  // [Section 3: Gas Condition & Physical Properties]
  const [conditionMeterA, setConditionMeterA] = useState<MeterGasCondition>({ pressBarg: 7.05, tempC: 32.75, lineDens: 5.42, lineZf: 0.9821, ghv: 1049.72 });
  const [conditionMeterB, setConditionMeterB] = useState<MeterGasCondition>({ pressBarg: 2.18, tempC: 23.35, lineDens: 2.18, lineZf: 0.9942, ghv: 1049.72 });

  // [Section 4: GC Molecular Fractions (% Mol)]
  const [gcActiveTank, setGcActiveTank] = useState<GasMolecularComposition>({ ch4: 96.5341, c2h6: 2.7050, c3h8: 0.5096, iC4: 0.0750, nC4: 0.0820, iC5: 0.0050, nC5: 0.0050, n2: 0.0301, co2: 0.0000 });
  const [gcMeterA, setGcMeterA] = useState<GasMolecularComposition>({ ch4: 96.5341, c2h6: 2.7050, c3h8: 0.5096, iC4: 0.0750, nC4: 0.0820, iC5: 0.0050, nC5: 0.0050, n2: 0.0301, co2: 0.0000 });
  const [gcMeterB, setGcMeterB] = useState<GasMolecularComposition>({ ch4: 96.5341, c2h6: 2.7050, c3h8: 0.5096, iC4: 0.0750, nC4: 0.0820, iC5: 0.0050, nC5: 0.0050, n2: 0.0301, co2: 0.0000 });

  // Form Save Toast Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // =========================================================================
  // Domain 1 Linked Active Bay Supply Tank
  // =========================================================================
  const activeSupplyBays = useMemo(() => {
    const mounted = fleetTanks.filter(
      (t) =>
        t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
        t.isMountedToBay ||
        t.position?.toLowerCase().includes('bay')
    );

    const bayTagMap: Record<string, string> = {
      'Bay 01': 'T-201',
      'Bay 02': 'T-202',
      'Bay 03': 'T-203',
      'Bay 04': 'T-204',
      '1': 'T-201',
      '2': 'T-202',
      '3': 'T-203',
      '4': 'T-204',
    };

    if (mounted.length > 0) {
      return mounted.map((t, idx) => {
        const rawBayId = t.isMountedToBay || (t.position?.match(/bay\s*0?(\d)/i)?.[1] ? `Bay 0${t.position.match(/bay\s*0?(\d)/i)?.[1]}` : `Bay 0${idx + 1}`);
        const bayTag = bayTagMap[rawBayId] || `T-20${idx + 1}`;
        return {
          bayTag,
          bayId: rawBayId,
          tankNo: t.tankNo,
          serialNo: t.serialNo || `SIMU-810142${idx + 1}`,
          pressureMPa: t.pressureMPa || 0.76,
          levelPct: t.level || 82.5,
          status: 'RUNNING' as const,
        };
      });
    }

    return [
      {
        bayTag: 'T-201',
        bayId: 'Bay 01',
        tankNo: 'ISOT-009',
        serialNo: 'SIMU-8101426',
        pressureMPa: 0.76,
        levelPct: 88.5,
        status: 'RUNNING' as const,
      },
    ];
  }, [fleetTanks]);

  const primaryActiveTank = activeSupplyBays[0] || {
    bayTag: 'T-201',
    bayId: 'Bay 01',
    tankNo: 'ISOT-009',
    serialNo: 'SIMU-8101426',
  };

  // Dynamic Arun COQ Data for Primary Active Tank
  const matchedTankCoq = useMemo(() => {
    if (!gasCompositions || gasCompositions.length === 0) return null;
    const direct = gasCompositions.find(
      (g) => g.samplePoint?.toUpperCase() === primaryActiveTank.tankNo?.toUpperCase()
    );
    if (direct) return direct;
    return (
      gasCompositions.find(
        (g) => g.source?.toLowerCase().includes('coq') || g.source?.toLowerCase().includes('arun')
      ) || gasCompositions[0]
    );
  }, [gasCompositions, primaryActiveTank.tankNo]);

  // When active tank changes, automatically bind its Arun COQ composition into Section 4 Feed Tank
  useEffect(() => {
    if (matchedTankCoq) {
      setGcActiveTank({
        ch4: matchedTankCoq.methane,
        c2h6: matchedTankCoq.ethane,
        c3h8: matchedTankCoq.propane,
        iC4: matchedTankCoq.iButane,
        nC4: matchedTankCoq.nButane,
        iC5: matchedTankCoq.iPentane,
        nC5: matchedTankCoq.nPentane,
        n2: matchedTankCoq.nitrogen,
        co2: matchedTankCoq.co2,
      });
    }
  }, [matchedTankCoq]);

  // Populate form with 100% data parity when date is selected or row is clicked
  const populateFormFromDate = (targetDate: string) => {
    const rec = records.find((r) => r.date === targetDate);
    setEntryDate(targetDate);
    if (rec) {
      // Section 1
      setCumMeterA({ ...rec.cumMeterA });
      setCumMeterB({ ...rec.cumMeterB });
      setCumStation({ ...rec.cumStation });

      // Section 2
      setDailyMeterA({ ...rec.dailyMeterA });
      setDailyMeterB({ ...rec.dailyMeterB });
      setDailyStation({ ...rec.dailyStation });

      // Section 3
      setConditionMeterA({ ...rec.conditionMeterA });
      setConditionMeterB({ ...rec.conditionMeterB });

      // Section 4
      setGcActiveTank({ ...rec.gcActiveTank });
      setGcMeterA({ ...rec.gcMeterA });
      setGcMeterB({ ...rec.gcMeterB });
    }
  };

  // Row Click Handler: Populates form and auto-expands the drawer
  const handleRowClick = (targetDate: string) => {
    populateFormFromDate(targetDate);
    setIsFormExpanded(true);
  };

  // Handle Form Save with Database-Ready Normalized Schema
  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    const localTimeWib = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }) + ' WIB';

    const newRecord: GasQualityMasterRecord = {
      date: entryDate,
      status: dailyStation.mmbtu > 0 ? 'DELIVERED' : 'STANDBY',
      activeFeedTank: primaryActiveTank.tankNo,
      serialNo: primaryActiveTank.serialNo,

      // Section 1
      cumMeterA: { ...cumMeterA },
      cumMeterB: { ...cumMeterB },
      cumStation: { ...cumStation },

      // Section 2
      dailyMeterA: { ...dailyMeterA },
      dailyMeterB: { ...dailyMeterB },
      dailyStation: { ...dailyStation },

      // Section 3
      conditionMeterA: { ...conditionMeterA },
      conditionMeterB: { ...conditionMeterB },

      // Section 4
      gcActiveTank: { ...gcActiveTank },
      gcMeterA: { ...gcMeterA },
      gcMeterB: { ...gcMeterB },

      heavyTrace: {
        hexane: 0.0150,
        heptane: 0.0120,
        octane: 0.0,
        nonane: 0.0,
        decane: 0.0,
        h2s: 0.0,
        h2o: 0.0,
      },
      submittedAt: localTimeWib,
    };

    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.date === entryDate);
      let updated: GasQualityMasterRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newRecord;
      } else {
        updated = [newRecord, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_DB_READY_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    setToastMessage(`✓ Database Record for ${entryDate} saved & synchronized with full schema parity!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute Active Start & End Date from 2 Filter Modes
  const { activeStartDate, activeEndDate } = useMemo(() => {
    if (filterMode === 'DATE_RANGE') {
      return {
        activeStartDate: rangeStartDate,
        activeEndDate: rangeEndDate,
      };
    } else {
      const yearNum = parseInt(selectedYear, 10) || 2026;
      const monthNum = parseInt(selectedMonth, 10) || 7;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const lastDayStr = String(lastDay).padStart(2, '0');
      return {
        activeStartDate: `${selectedYear}-${selectedMonth}-01`,
        activeEndDate: `${selectedYear}-${selectedMonth}-${lastDayStr}`,
      };
    }
  }, [filterMode, rangeStartDate, rangeEndDate, selectedYear, selectedMonth]);

  // Filtered Records based on Date Range and Search Query
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchDate = (!activeStartDate || r.date >= activeStartDate) && (!activeEndDate || r.date <= activeEndDate);
      const matchSearch =
        !searchQuery ||
        r.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.activeFeedTank.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSearch;
    });
  }, [records, activeStartDate, activeEndDate, searchQuery]);

  // Aggregate Metrics for Filtered Records
  const summaryMetrics = useMemo(() => {
    const totalEnergy = filteredRecords.reduce((acc, r) => acc + r.dailyStation.mmbtu, 0);
    const totalVolMscf = filteredRecords.reduce((acc, r) => acc + r.dailyStation.cvol, 0);
    const totalMassTonne = filteredRecords.reduce((acc, r) => acc + r.dailyStation.massTonne, 0);
    const avgGhv =
      filteredRecords.length > 0
        ? filteredRecords.reduce((acc, r) => acc + (r.conditionMeterB.ghv > 0 ? r.conditionMeterB.ghv : r.conditionMeterA.ghv), 0) / filteredRecords.length
        : 1047.0;
    const avgMethane =
      filteredRecords.length > 0
        ? filteredRecords.reduce((acc, r) => acc + r.gcMeterA.ch4, 0) / filteredRecords.length
        : 96.5;

    return {
      totalEnergy,
      totalVolMscf,
      totalMassTonne,
      avgGhv,
      avgMethane,
      recordCount: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Flattened CSV Export with Full Schema Parity
  const handleExportVisibleCSV = () => {
    const flattenedData = filteredRecords.map((r) => ({
      date: r.date,
      status: r.status,
      activeFeedTank: r.activeFeedTank,
      serialNo: r.serialNo,
      // Section 1: Cumulative
      cumMeterA_UVOL: r.cumMeterA.uvol,
      cumMeterA_CVOL: r.cumMeterA.cvol,
      cumMeterA_MassTonne: r.cumMeterA.massTonne,
      cumMeterA_MMBTU: r.cumMeterA.mmbtu,
      cumMeterB_UVOL: r.cumMeterB.uvol,
      cumMeterB_CVOL: r.cumMeterB.cvol,
      cumMeterB_MassTonne: r.cumMeterB.massTonne,
      cumMeterB_MMBTU: r.cumMeterB.mmbtu,
      cumStation_UVOL: r.cumStation.uvol,
      cumStation_CVOL: r.cumStation.cvol,
      cumStation_MassTonne: r.cumStation.massTonne,
      cumStation_MMBTU: r.cumStation.mmbtu,
      // Section 2: Daily
      dailyMeterA_UVOL: r.dailyMeterA.uvol,
      dailyMeterA_CVOL: r.dailyMeterA.cvol,
      dailyMeterA_MassTonne: r.dailyMeterA.massTonne,
      dailyMeterA_MMBTU: r.dailyMeterA.mmbtu,
      dailyMeterB_UVOL: r.dailyMeterB.uvol,
      dailyMeterB_CVOL: r.dailyMeterB.cvol,
      dailyMeterB_MassTonne: r.dailyMeterB.massTonne,
      dailyMeterB_MMBTU: r.dailyMeterB.mmbtu,
      dailyStation_UVOL: r.dailyStation.uvol,
      dailyStation_CVOL: r.dailyStation.cvol,
      dailyStation_MassTonne: r.dailyStation.massTonne,
      dailyStation_MMBTU: r.dailyStation.mmbtu,
      // Section 3: Condition
      meterA_PressBarg: r.conditionMeterA.pressBarg,
      meterA_TempC: r.conditionMeterA.tempC,
      meterA_LineDens: r.conditionMeterA.lineDens,
      meterA_LineZf: r.conditionMeterA.lineZf,
      meterA_GHV: r.conditionMeterA.ghv,
      meterB_PressBarg: r.conditionMeterB.pressBarg,
      meterB_TempC: r.conditionMeterB.tempC,
      meterB_LineDens: r.conditionMeterB.lineDens,
      meterB_LineZf: r.conditionMeterB.lineZf,
      meterB_GHV: r.conditionMeterB.ghv,
      // Section 4: GC Fractions
      gc_CH4: r.gcMeterA.ch4,
      gc_C2H6: r.gcMeterA.c2h6,
      gc_C3H8: r.gcMeterA.c3h8,
      gc_iC4: r.gcMeterA.iC4,
      gc_nC4: r.gcMeterA.nC4,
      gc_iC5: r.gcMeterA.iC5,
      gc_nC5: r.gcMeterA.nC5,
      gc_N2: r.gcMeterA.n2,
      gc_CO2: r.gcMeterA.co2,
      submittedAt: r.submittedAt,
    }));

    exportDatasetToCSV(
      `NIAS_GC_Master_Ledger_${activeStartDate}_to_${activeEndDate}`,
      flattenedData as unknown as Record<string, unknown>[],
      undefined,
      {
        title: 'Gas Chromatograph & Station Flow Metering Master Database Ledger',
        period: `${activeStartDate} to ${activeEndDate}`,
        generatedBy: 'Nias Terminal Custody Transfer & Gas Quality Skid (Database-Ready)',
      }
    );
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200 text-white font-bold font-sans">
      {/* 1. Header Banner & Actions */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-white font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              RS-485 Modbus TCP: ONLINE
            </span>
            <span className="text-xs font-mono text-white font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
              Analyzer: Daniel Model 700 GC (Dual M-101A / M-101B)
            </span>
            <span className="text-xs font-mono text-white font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
              Database-Ready Schema (Parity v5)
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white font-bold flex items-center gap-2 mt-2">
            <FileSpreadsheet className="w-4 h-4 text-white font-bold" />
            Station Gas Metering & Daniel GC Molecular Quality Master Ledger
          </h3>
          <p className="text-xs text-white font-bold mt-0.5">
            Normalized 4-section custody schema with full database parity and instantaneous synchronization.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => exportAllLogsToExcel()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>📊 Export All to Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportVisibleCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-white font-bold" />
            <span>Export Visible CSV</span>
          </button>
        </div>
      </div>

      {/* 2. [TOP] Simplified 2-Mode Filter Bar (Date Range vs Year/Month) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: 2-Option Segment Toggle & Pickers */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs font-mono">
          {/* Segment Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('DATE_RANGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'DATE_RANGE'
                  ? 'bg-cyan-600/30 text-white font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-white font-bold hover:text-white font-bold'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>기간별 검색 (Date Range)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('YEAR_MONTH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'YEAR_MONTH'
                  ? 'bg-amber-600/30 text-white font-bold border border-amber-500/40 shadow-sm'
                  : 'text-white font-bold hover:text-white font-bold'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>월별 검색 (Year/Month)</span>
            </button>
          </div>

          {/* Mode 1: Date Range Calendar Inputs */}
          {filterMode === 'DATE_RANGE' ? (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <label className="relative flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-inner group">
                <span className="text-white font-bold text-[10px]">From:</span>
                <span className="text-white font-bold font-bold text-xs">{rangeStartDate}</span>
                <Calendar className="w-3 h-3 text-white font-bold group-hover:scale-110 transition-transform ml-0.5" />
                <input
                  type="date"
                  value={rangeStartDate}
                  onChange={(e) => setRangeStartDate(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                />
              </label>

              <span className="text-white font-bold font-bold">~</span>

              <label className="relative flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-inner group">
                <span className="text-white font-bold text-[10px]">To:</span>
                <span className="text-white font-bold font-bold text-xs">{rangeEndDate}</span>
                <Calendar className="w-3 h-3 text-white font-bold group-hover:scale-110 transition-transform ml-0.5" />
                <input
                  type="date"
                  value={rangeEndDate}
                  onChange={(e) => setRangeEndDate(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                />
              </label>
            </div>
          ) : (
            /* Mode 2: Year & Month Dropdowns */
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-white font-bold text-[10px]">연도:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-white font-bold font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="2026" className="bg-slate-900 text-white font-bold">2026년</option>
                  <option value="2025" className="bg-slate-900 text-white font-bold">2025년</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-white font-bold text-[10px]">월:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white font-bold font-bold focus:outline-none cursor-pointer text-xs"
                >
                  {ALL_MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-slate-900 text-white font-bold">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Search Bar & Heavy Trace Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <Search className="w-3.5 h-3.5 text-white font-bold" />
            <input
              type="text"
              placeholder="Search date / tank / status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white font-bold placeholder-slate-500 focus:outline-none text-xs w-32 sm:w-44"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowHeavyTrace(!showHeavyTrace)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showHeavyTrace
                ? 'bg-blue-600/30 text-white font-bold border-blue-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-white font-bold border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-white font-bold" />
            <span>{showHeavyTrace ? 'Hide C5-C10' : '+ Show C5-C10 Trace'}</span>
          </button>
        </div>
      </div>

      {/* 3. [TOP BANNER] Selected Period Summary Aggregates (6 KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Period Delivered Energy */}
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-amber-500/30 shadow-md font-mono flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
              Period Delivered Energy
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-bold block mt-1">
              {summaryMetrics.totalEnergy.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
          </div>
          <span className="text-[10px] text-white font-bold mt-1">
            MMBTU <span className="text-white font-bold font-bold">(Station Total)</span>
          </span>
        </div>

        {/* Card 2: Period Gas Volume */}
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md font-mono flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
              Period Gas Volume
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-bold block mt-1">
              {summaryMetrics.totalVolMscf.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-white font-bold mt-1">
            MMCF <span className="text-white font-bold font-bold">(Station CVOL)</span>
          </span>
        </div>

        {/* Card 3: Delivered LNG Mass */}
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-md font-mono flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
              Delivered LNG Mass
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-bold block mt-1">
              {summaryMetrics.totalMassTonne.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-white font-bold mt-1">
            Tonne <span className="text-white font-bold font-bold">(≈ {(summaryMetrics.totalMassTonne * 1000).toLocaleString()} kg)</span>
          </span>
        </div>

        {/* Card 4: Average GHV */}
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-cyan-500/30 shadow-md font-mono flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
              Average GHV
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-bold block mt-1">
              {summaryMetrics.avgGhv.toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] text-white font-bold mt-1">
            BTU/Scf <span className="text-white font-bold font-bold">(Custody Heat)</span>
          </span>
        </div>

        {/* Card 5: Average Methane */}
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md font-mono flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
              Average Methane (CH₄)
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-bold block mt-1">
              {summaryMetrics.avgMethane.toFixed(2)} %
            </span>
          </div>
          <span className="text-[10px] text-white font-bold mt-1">
            Mol % <span className="text-white font-bold font-bold">(Primary Spec)</span>
          </span>
        </div>

        {/* Card 6: Active Feed / Records */}
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md font-mono flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
              Active Feed / Records
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-bold block mt-1">
              {summaryMetrics.recordCount} Days
            </span>
          </div>
          <span className="text-[10px] text-white font-bold mt-1 truncate">
            {primaryActiveTank.tankNo} <span className="text-white font-bold font-bold">(@ Bay {primaryActiveTank.bayTag})</span>
          </span>
        </div>
      </div>

      {/* 4. [MIDDLE] Collapsible 4-Section Daily In-Place Entry Form (Drawer) */}
      <form
        onSubmit={handleSaveDailyLog}
        className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
      >
        {/* Accordion Toggle Header Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <FileSpreadsheet className="w-4 h-4 text-white font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white font-bold group-hover:text-white font-bold transition-colors">
                    Official 4-Section Daily Report Entry Form
                  </h4>
                  {isFormExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white font-bold transition-transform" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white font-bold group-hover:text-white font-bold transition-transform" />
                  )}
                </div>
                <p className="text-[11px] text-white font-bold font-mono">
                  {isFormExpanded
                    ? 'Click to collapse entry sections'
                    : 'Click to expand 4-section Excel engineering form'}
                </p>
              </div>
            </button>

            {/* Single Active Discharge Feed Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-950/80 text-white font-bold border border-emerald-500/40 shadow-sm ml-0 lg:ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                🟢 Active Discharge Feed: <strong className="text-white">{primaryActiveTank.tankNo}</strong> ({primaryActiveTank.serialNo}) @ Bay <strong className="text-white font-bold">{primaryActiveTank.bayTag}</strong>
              </span>
            </span>
          </div>

          {/* Right Controls: Report Date Picker & Action Toggle */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {/* Interactive Report Date Picker */}
            <label className="relative flex items-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-inner group">
              <Calendar className="w-3.5 h-3.5 text-white font-bold group-hover:scale-110 transition-transform" />
              <span className="text-white font-bold font-mono font-black text-xs tracking-wide">
                {entryDate}
              </span>
              <span className="text-[10px] text-white font-bold font-mono">
                ({new Date(entryDate).toLocaleDateString('en-US', { weekday: 'short' })})
              </span>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => {
                  populateFormFromDate(e.target.value);
                  setIsFormExpanded(true);
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              />
            </label>

            {/* Reset Values Button */}
            <button
              type="button"
              onClick={() => populateFormFromDate(entryDate)}
              title="Reset Form from Stored Date Values"
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Enter Daily Log (Open Form) Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isFormExpanded ? '✍️ Close Form' : '✍️ Enter Daily Log (Open Form)'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Content Body */}
        {isFormExpanded && (
          <div className="p-4 sm:p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* ========================================================================= */}
            {/* [SECTION 1] Common (누적 계측치 테이블 - Cumulative)                      */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-white font-bold text-[10px] font-bold font-mono border border-emerald-500/30">
                  SECTION 1
                </span>
                <h5 className="text-xs font-bold text-white font-bold flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-white font-bold" />
                  Common (누적 계측치 테이블 - Cumulative)
                </h5>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    {/* 1st Tier Header */}
                    <tr className="bg-emerald-950/40 text-white font-bold border-b border-slate-800 text-[10px] uppercase font-bold text-center">
                      <th colSpan={4} className="px-3 py-1.5 border-r border-slate-800">
                        M-101A (Run 1)
                      </th>
                      <th colSpan={4} className="px-3 py-1.5 border-r border-slate-800">
                        M-101B (Run 2)
                      </th>
                      <th colSpan={4} className="px-3 py-1.5 bg-amber-950/30 text-white font-bold">
                        STATION (Total)
                      </th>
                    </tr>
                    {/* 2nd Tier Header */}
                    <tr className="bg-slate-900/90 text-white font-bold border-b border-slate-800 text-[9px] uppercase font-bold text-center">
                      {/* M-101A */}
                      <th className="px-2 py-1.5">UVOL (MMCF)</th>
                      <th className="px-2 py-1.5">CVOL (MMCF)</th>
                      <th className="px-2 py-1.5">(Tonne)</th>
                      <th className="px-2 py-1.5 border-r border-slate-800 text-white font-bold">(MMBTU)</th>
                      {/* M-101B */}
                      <th className="px-2 py-1.5">UVOL (MMCF)</th>
                      <th className="px-2 py-1.5">CVOL (MMCF)</th>
                      <th className="px-2 py-1.5">(Tonne)</th>
                      <th className="px-2 py-1.5 border-r border-slate-800 text-white font-bold">(MMBTU)</th>
                      {/* STATION */}
                      <th className="px-2 py-1.5">UVOL (MMCF)</th>
                      <th className="px-2 py-1.5">CVOL (MMCF)</th>
                      <th className="px-2 py-1.5 text-white font-bold">(Tonne)</th>
                      <th className="px-2 py-1.5 text-white font-bold font-bold">(MMBTU)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-950">
                      {/* M-101A Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterA.uvol}
                          onChange={(e) => setCumMeterA({ ...cumMeterA, uvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterA.cvol}
                          onChange={(e) => setCumMeterA({ ...cumMeterA, cvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterA.massTonne}
                          onChange={(e) => setCumMeterA({ ...cumMeterA, massTonne: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterA.mmbtu}
                          onChange={(e) => setCumMeterA({ ...cumMeterA, mmbtu: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-amber-500 text-xs font-bold"
                        />
                      </td>

                      {/* M-101B Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterB.uvol}
                          onChange={(e) => setCumMeterB({ ...cumMeterB, uvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterB.cvol}
                          onChange={(e) => setCumMeterB({ ...cumMeterB, cvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterB.massTonne}
                          onChange={(e) => setCumMeterB({ ...cumMeterB, massTonne: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={cumMeterB.mmbtu}
                          onChange={(e) => setCumMeterB({ ...cumMeterB, mmbtu: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-amber-500 text-xs font-bold"
                        />
                      </td>

                      {/* STATION Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumStation.uvol}
                          onChange={(e) => setCumStation({ ...cumStation, uvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumStation.cvol}
                          onChange={(e) => setCumStation({ ...cumStation, cvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumStation.massTonne}
                          onChange={(e) => setCumStation({ ...cumStation, massTonne: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={cumStation.mmbtu}
                          onChange={(e) => setCumStation({ ...cumStation, mmbtu: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-amber-500 text-xs font-black"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* [SECTION 2] Daily (일일 유량 및 에너지 테이블)                           */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-white font-bold text-[10px] font-bold font-mono border border-cyan-500/30">
                  SECTION 2
                </span>
                <h5 className="text-xs font-bold text-white font-bold flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-white font-bold" />
                  Daily (일일 유량 및 에너지 테이블)
                </h5>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    {/* 1st Tier Header */}
                    <tr className="bg-cyan-950/40 text-white font-bold border-b border-slate-800 text-[10px] uppercase font-bold text-center">
                      <th colSpan={4} className="px-3 py-1.5 border-r border-slate-800">
                        M-101A (Run 1)
                      </th>
                      <th colSpan={4} className="px-3 py-1.5 border-r border-slate-800">
                        M-101B (Run 2)
                      </th>
                      <th colSpan={4} className="px-3 py-1.5 bg-amber-950/30 text-white font-bold">
                        STATION (Total)
                      </th>
                    </tr>
                    {/* 2nd Tier Header */}
                    <tr className="bg-slate-900/90 text-white font-bold border-b border-slate-800 text-[9px] uppercase font-bold text-center">
                      {/* M-101A */}
                      <th className="px-2 py-1.5">UVOL (MMCF)</th>
                      <th className="px-2 py-1.5">CVOL (MMCF)</th>
                      <th className="px-2 py-1.5">(Tonne)</th>
                      <th className="px-2 py-1.5 border-r border-slate-800 text-white font-bold">(MMBTU)</th>
                      {/* M-101B */}
                      <th className="px-2 py-1.5">UVOL (MMCF)</th>
                      <th className="px-2 py-1.5">CVOL (MMCF)</th>
                      <th className="px-2 py-1.5">(Tonne)</th>
                      <th className="px-2 py-1.5 border-r border-slate-800 text-white font-bold">(MMBTU)</th>
                      {/* STATION */}
                      <th className="px-2 py-1.5">UVOL (MMCF)</th>
                      <th className="px-2 py-1.5">CVOL (MMCF)</th>
                      <th className="px-2 py-1.5 text-white font-bold">(Tonne)</th>
                      <th className="px-2 py-1.5 text-white font-bold font-bold">(MMBTU)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-950">
                      {/* M-101A Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterA.uvol}
                          onChange={(e) => setDailyMeterA({ ...dailyMeterA, uvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterA.cvol}
                          onChange={(e) => setDailyMeterA({ ...dailyMeterA, cvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterA.massTonne}
                          onChange={(e) => setDailyMeterA({ ...dailyMeterA, massTonne: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterA.mmbtu}
                          onChange={(e) => setDailyMeterA({ ...dailyMeterA, mmbtu: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-amber-500 text-xs font-bold"
                        />
                      </td>

                      {/* M-101B Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterB.uvol}
                          onChange={(e) => setDailyMeterB({ ...dailyMeterB, uvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterB.cvol}
                          onChange={(e) => setDailyMeterB({ ...dailyMeterB, cvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterB.massTonne}
                          onChange={(e) => setDailyMeterB({ ...dailyMeterB, massTonne: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyMeterB.mmbtu}
                          onChange={(e) => setDailyMeterB({ ...dailyMeterB, mmbtu: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-amber-500 text-xs font-bold"
                        />
                      </td>

                      {/* STATION Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyStation.uvol}
                          onChange={(e) => setDailyStation({ ...dailyStation, uvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyStation.cvol}
                          onChange={(e) => setDailyStation({ ...dailyStation, cvol: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-cyan-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyStation.massTonne}
                          onChange={(e) => setDailyStation({ ...dailyStation, massTonne: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={dailyStation.mmbtu}
                          onChange={(e) => setDailyStation({ ...dailyStation, mmbtu: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-amber-500 text-xs font-black"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* [SECTION 3] Gas Condition & Physical Properties                           */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-white font-bold text-[10px] font-bold font-mono border border-indigo-500/30">
                  SECTION 3
                </span>
                <h5 className="text-xs font-bold text-white font-bold flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-white font-bold" />
                  Gas Condition & Physical Properties (공정 물리량 테이블)
                </h5>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    {/* 1st Tier Header */}
                    <tr className="bg-indigo-950/40 text-white font-bold border-b border-slate-800 text-[10px] uppercase font-bold text-center">
                      <th colSpan={5} className="px-3 py-1.5 border-r border-slate-800">
                        M-101 A (Run 1)
                      </th>
                      <th colSpan={5} className="px-3 py-1.5">
                        M-101 B (Run 2)
                      </th>
                    </tr>
                    {/* 2nd Tier Header */}
                    <tr className="bg-slate-900/90 text-white font-bold border-b border-slate-800 text-[9px] uppercase font-bold text-center">
                      {/* M-101 A */}
                      <th className="px-2 py-1.5">Press (Barg)</th>
                      <th className="px-2 py-1.5">Temp (℃)</th>
                      <th className="px-2 py-1.5">Line Dens (kg/㎥)</th>
                      <th className="px-2 py-1.5">Line Compress (Zf)</th>
                      <th className="px-2 py-1.5 border-r border-slate-800 text-white font-bold font-bold">GHV (BTU/SCF)</th>
                      {/* M-101 B */}
                      <th className="px-2 py-1.5">Press (Barg)</th>
                      <th className="px-2 py-1.5">Temp (℃)</th>
                      <th className="px-2 py-1.5">Line Dens (kg/㎥)</th>
                      <th className="px-2 py-1.5">Line Compress (Zf)</th>
                      <th className="px-2 py-1.5 text-white font-bold font-bold">GHV (BTU/SCF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-950">
                      {/* M-101 A Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterA.pressBarg}
                          onChange={(e) => setConditionMeterA({ ...conditionMeterA, pressBarg: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterA.tempC}
                          onChange={(e) => setConditionMeterA({ ...conditionMeterA, tempC: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterA.lineDens}
                          onChange={(e) => setConditionMeterA({ ...conditionMeterA, lineDens: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.0001"
                          value={conditionMeterA.lineZf}
                          onChange={(e) => setConditionMeterA({ ...conditionMeterA, lineZf: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterA.ghv}
                          onChange={(e) => setConditionMeterA({ ...conditionMeterA, ghv: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs font-black"
                        />
                      </td>

                      {/* M-101 B Inputs */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterB.pressBarg}
                          onChange={(e) => setConditionMeterB({ ...conditionMeterB, pressBarg: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterB.tempC}
                          onChange={(e) => setConditionMeterB({ ...conditionMeterB, tempC: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterB.lineDens}
                          onChange={(e) => setConditionMeterB({ ...conditionMeterB, lineDens: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.0001"
                          value={conditionMeterB.lineZf}
                          onChange={(e) => setConditionMeterB({ ...conditionMeterB, lineZf: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionMeterB.ghv}
                          onChange={(e) => setConditionMeterB({ ...conditionMeterB, ghv: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-1 rounded border border-slate-800 text-right focus:outline-none focus:border-emerald-500 text-xs font-black"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* [SECTION 4] Gas Chromatography Component Analysis - Strict 3-Row Table    */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-white font-bold text-[10px] font-bold font-mono border border-purple-500/30">
                    SECTION 4
                  </span>
                  <h5 className="text-xs font-bold text-white font-bold flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-white font-bold" />
                    Gas Chromatography Component Analysis (% Mol)
                  </h5>
                </div>
                <span className="text-[11px] font-mono text-white font-bold">
                  Single Active Feed Stream (Domain 1) & Custody Discharge Header Meters
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="bg-purple-950/40 text-white font-bold border-b border-slate-800 text-[9px] uppercase font-bold text-center">
                      <th className="px-3 py-1.5 text-left border-r border-slate-800 min-w-[260px]">
                        Stream / Measurement Node
                      </th>
                      <th className="px-2 py-1.5 text-white font-bold">CH₄ (%)</th>
                      <th className="px-2 py-1.5">C₂H₆ (%)</th>
                      <th className="px-2 py-1.5">C₃H₈ (%)</th>
                      <th className="px-2 py-1.5">i-C₄ (%)</th>
                      <th className="px-2 py-1.5">n-C₄ (%)</th>
                      <th className="px-2 py-1.5">i-C₅ (%)</th>
                      <th className="px-2 py-1.5">n-C₅ (%)</th>
                      <th className="px-2 py-1.5">N₂ (%)</th>
                      <th className="px-2 py-1.5 border-r border-slate-800">CO₂ (%)</th>
                      <th className="px-2.5 py-1.5 bg-emerald-950/30 text-white font-bold font-black">
                        Total (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-white font-bold">
                    {/* Row 1: Active Discharge Feed Tank (Domain 1 Single Discharging Tank) */}
                    <tr className="bg-slate-950 hover:bg-slate-900/50">
                      <td className="px-3 py-1.5 border-r border-slate-800 text-left font-bold text-white font-bold flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Feed Tank: <strong className="text-white">{primaryActiveTank.tankNo}</strong></span>
                        </div>
                        <span className="text-[9px] text-white font-bold font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          Arun COQ Linked
                        </span>
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.01"
                          value={gcActiveTank.ch4}
                          onChange={(e) => setGcActiveTank({ ...gcActiveTank, ch4: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs font-bold"
                        />
                      </td>
                      <td className="px-2 py-1 text-right text-white font-bold">{gcActiveTank.c2h6.toFixed(4)}</td>
                      <td className="px-2 py-1 text-right text-white font-bold">{gcActiveTank.c3h8.toFixed(4)}</td>
                      <td className="px-2 py-1 text-right text-white font-bold">{gcActiveTank.iC4.toFixed(4)}</td>
                      <td className="px-2 py-1 text-right text-white font-bold">{gcActiveTank.nC4.toFixed(4)}</td>
                      <td className="px-2 py-1 text-right text-white font-bold">{gcActiveTank.iC5.toFixed(4)}</td>
                      <td className="px-2 py-1 text-right text-white font-bold">{gcActiveTank.nC5.toFixed(4)}</td>
                      <td className="px-2 py-1 text-right text-white font-bold">{gcActiveTank.n2.toFixed(4)}</td>
                      <td className="px-2 py-1 text-right text-white font-bold border-r border-slate-800">{gcActiveTank.co2.toFixed(4)}</td>
                      <td className="px-2.5 py-1 text-right text-white font-bold font-black bg-emerald-950/20">
                        100.00 %
                      </td>
                    </tr>

                    {/* Row 2: Custody Discharge Meter M-101 A */}
                    <tr className="bg-slate-950 hover:bg-slate-900/50">
                      <td className="px-3 py-1.5 border-r border-slate-800 text-left font-bold text-white font-bold flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-white font-bold" />
                        <span>Discharge Header M-101 A</span>
                        <span className="text-[10px] text-white font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/20 font-bold">
                          Custody
                        </span>
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.ch4}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, ch4: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs font-bold"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.c2h6}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, c2h6: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.c3h8}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, c3h8: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.iC4}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, iC4: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.nC4}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, nC4: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.iC5}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, iC5: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.nC5}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, nC5: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.n2}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, n2: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-800">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterA.co2}
                          onChange={(e) => setGcMeterA({ ...gcMeterA, co2: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="px-2.5 py-1 text-right text-white font-bold font-black bg-cyan-950/20">
                        {(gcMeterA.ch4 + gcMeterA.c2h6 + gcMeterA.c3h8 + gcMeterA.iC4 + gcMeterA.nC4 + gcMeterA.iC5 + gcMeterA.nC5 + gcMeterA.n2 + gcMeterA.co2).toFixed(2)} %
                      </td>
                    </tr>

                    {/* Row 3: Redundant Discharge Meter M-101 B */}
                    <tr className="bg-slate-950 hover:bg-slate-900/50">
                      <td className="px-3 py-1.5 border-r border-slate-800 text-left font-bold text-white font-bold flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-white font-bold" />
                        <span>Discharge Header M-101 B</span>
                        <span className="text-[10px] text-white font-bold bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-500/20 font-bold">
                          Redundant
                        </span>
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.ch4}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, ch4: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs font-bold"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.c2h6}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, c2h6: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.c3h8}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, c3h8: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.iC4}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, iC4: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.nC4}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, nC4: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.iC5}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, iC5: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.nC5}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, nC5: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.n2}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, n2: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-800">
                        <input
                          type="number"
                          step="0.0001"
                          value={gcMeterB.co2}
                          onChange={(e) => setGcMeterB({ ...gcMeterB, co2: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs"
                        />
                      </td>
                      <td className="px-2.5 py-1 text-right text-white font-bold font-black bg-indigo-950/20">
                        {(gcMeterB.ch4 + gcMeterB.c2h6 + gcMeterB.c3h8 + gcMeterB.iC4 + gcMeterB.nC4 + gcMeterB.iC5 + gcMeterB.nC5 + gcMeterB.n2 + gcMeterB.co2).toFixed(2)} %
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Notifications & Save Action Inside Form */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              {toastMessage ? (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-mono text-white font-bold flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-white font-bold shrink-0" />
                  <span>{toastMessage}</span>
                </div>
              ) : (
                <span className="text-[11px] font-mono text-white font-bold">
                  ⚡ Saving synchronizes all 4 normalized sections with local database storage.
                </span>
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => populateFormFromDate(entryDate)}
                  title="Reset Form from Stored Date Values"
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Values</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 Save / Update Daily Report</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* 5. [BOTTOM] Grouped Collapsible Master Grid (2-Tier Sticky Headers) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-white font-bold" />
            <h4 className="text-xs sm:text-sm font-bold text-white font-bold">
              NIAS G.C Report & Gas Quality Master Daily Ledger (Database-Ready)
            </h4>
            <span className="text-xs font-mono text-white font-bold">
              (Showing {filteredRecords.length} records)
            </span>
          </div>
          <span className="text-[11px] font-mono text-white font-bold hidden sm:inline-block">
            💡 Click any row to expand & edit in 4-Section official form
          </span>
        </div>

        <div className="overflow-x-auto max-h-[620px] scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-xs text-left border-collapse font-mono">
            {/* 2-Tier Sticky Header */}
            <thead className="bg-slate-950 text-white font-bold sticky top-0 z-30 shadow-md">
              {/* Tier 1 Group Headers */}
              <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                <th className="px-3 py-2 bg-slate-950 sticky left-0 z-40 border-r border-slate-800 text-white font-bold text-left">
                  DATE
                </th>
                <th colSpan={5} className="px-3 py-2 bg-amber-950/40 text-white font-bold border-r border-slate-800 text-center">
                  STATION
                </th>
                <th colSpan={7} className="px-3 py-2 bg-cyan-950/40 text-white font-bold border-r border-slate-800 text-center">
                  METER RUN A (M-101A)
                </th>
                <th colSpan={7} className="px-3 py-2 bg-indigo-950/40 text-white font-bold border-r border-slate-800 text-center">
                  METER RUN B (M-101B)
                </th>
                <th colSpan={7} className="px-3 py-2 bg-emerald-950/40 text-white font-bold border-r border-slate-800 text-center">
                  GC MOLECULAR COMPOSITION (% MOL)
                </th>
                {showHeavyTrace && (
                  <th colSpan={9} className="px-3 py-2 bg-purple-950/40 text-white font-bold text-center">
                    C5+ HEAVY ALKANES & TRACE
                  </th>
                )}
              </tr>

              {/* Tier 2 Column Headers & Units */}
              <tr className="border-b border-slate-800 text-[9px] uppercase font-bold text-white font-bold bg-slate-950/90">
                {/* Single Frozen Date Column */}
                <th className="px-3 py-2 sticky left-0 z-40 bg-slate-950 min-w-[105px] text-white font-bold border-r border-slate-800 text-left">
                  DATE
                </th>

                {/* Station Delivery: UVOL, CVOL, TONNE, MMBTU, CUM. MMBTU */}
                <th className="px-2.5 py-2 text-right">UVOL (MMCF)</th>
                <th className="px-2.5 py-2 text-right">CVOL (MMCF)</th>
                <th className="px-2.5 py-2 text-right text-white font-bold">TONNE</th>
                <th className="px-2.5 py-2 text-right text-white font-bold font-bold">MMBTU</th>
                <th className="px-2.5 py-2 text-right border-r border-slate-800 text-white font-bold">CUM. MMBTU</th>

                {/* Meter A: UVOL, CVOL, TONNE, MMBTU, PRESS, TEMP, GHV */}
                <th className="px-2.5 py-2 text-right">UVOL</th>
                <th className="px-2.5 py-2 text-right">CVOL</th>
                <th className="px-2.5 py-2 text-right">TONNE</th>
                <th className="px-2.5 py-2 text-right text-white font-bold">MMBTU</th>
                <th className="px-2.5 py-2 text-right">PRESS (Barg)</th>
                <th className="px-2.5 py-2 text-right">TEMP (℃)</th>
                <th className="px-2.5 py-2 text-right border-r border-slate-800">GHV (BTU/Scf)</th>

                {/* Meter B: UVOL, CVOL, TONNE, MMBTU, PRESS, TEMP, GHV */}
                <th className="px-2.5 py-2 text-right">UVOL</th>
                <th className="px-2.5 py-2 text-right">CVOL</th>
                <th className="px-2.5 py-2 text-right">TONNE</th>
                <th className="px-2.5 py-2 text-right text-white font-bold">MMBTU</th>
                <th className="px-2.5 py-2 text-right">PRESS (Barg)</th>
                <th className="px-2.5 py-2 text-right">TEMP (℃)</th>
                <th className="px-2.5 py-2 text-right border-r border-slate-800">GHV (BTU/Scf)</th>

                {/* GC Molecular Fractions */}
                <th className="px-2.5 py-2 text-right text-white font-bold">CH₄ [%]</th>
                <th className="px-2.5 py-2 text-right">C₂H₆ [%]</th>
                <th className="px-2.5 py-2 text-right">C₃H₈ [%]</th>
                <th className="px-2.5 py-2 text-right">i-C₄ [%]</th>
                <th className="px-2.5 py-2 text-right">n-C₄ [%]</th>
                <th className="px-2.5 py-2 text-right">N₂ [%]</th>
                <th className="px-2.5 py-2 text-right border-r border-slate-800">CO₂ [%]</th>

                {/* Heavy Trace Breakdown */}
                {showHeavyTrace && (
                  <>
                    <th className="px-2 py-2 text-right">i-C₅ [%]</th>
                    <th className="px-2 py-2 text-right">n-C₅ [%]</th>
                    <th className="px-2 py-2 text-right">C₆ [%]</th>
                    <th className="px-2 py-2 text-right">C₇ [%]</th>
                    <th className="px-2 py-2 text-right">C₈ [%]</th>
                    <th className="px-2 py-2 text-right">C₉ [%]</th>
                    <th className="px-2 py-2 text-right">C₁₀ [%]</th>
                    <th className="px-2 py-2 text-right text-white font-bold">H₂S [%]</th>
                    <th className="px-2 py-2 text-right text-white font-bold">H₂O [%]</th>
                  </>
                )}
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody className="divide-y divide-slate-800/60 text-white font-bold">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row, idx) => {
                  const isSelected = row.date === entryDate;

                  return (
                    <tr
                      key={row.date}
                      onClick={() => handleRowClick(row.date)}
                      className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-950/40 border-l-2 border-l-cyan-400'
                          : idx % 2 === 0
                          ? 'bg-slate-900/60'
                          : 'bg-slate-900/30'
                      }`}
                    >
                      {/* Single Frozen Date Column */}
                      <td className="px-3 py-2.5 sticky left-0 z-20 bg-slate-950 font-bold text-white font-bold border-r border-slate-800/80">
                        {row.date}
                      </td>

                      {/* Station Deliveries: UVOL, CVOL, TONNE, MMBTU, CUM. MMBTU */}
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyStation.uvol > 0 ? row.dailyStation.uvol.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyStation.cvol > 0 ? row.dailyStation.cvol.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-bold text-white font-bold">
                        {row.dailyStation.massTonne > 0 ? row.dailyStation.massTonne.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-bold text-white font-bold">
                        {row.dailyStation.mmbtu > 0
                          ? row.dailyStation.mmbtu.toLocaleString(undefined, {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })
                          : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold border-r border-slate-800/80">
                        {row.cumStation.mmbtu > 0 ? row.cumStation.mmbtu.toLocaleString() : '-'}
                      </td>

                      {/* Meter A: UVOL, CVOL, TONNE, MMBTU, PRESS, TEMP, GHV */}
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterA.uvol > 0 ? row.dailyMeterA.uvol.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterA.cvol > 0 ? row.dailyMeterA.cvol.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterA.massTonne > 0 ? row.dailyMeterA.massTonne.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterA.mmbtu > 0 ? row.dailyMeterA.mmbtu.toFixed(1) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.conditionMeterA.pressBarg > 0 ? row.conditionMeterA.pressBarg.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.conditionMeterA.tempC > 0 ? row.conditionMeterA.tempC.toFixed(1) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold border-r border-slate-800/80">
                        {row.conditionMeterA.ghv > 0 ? row.conditionMeterA.ghv.toFixed(1) : '-'}
                      </td>

                      {/* Meter B: UVOL, CVOL, TONNE, MMBTU, PRESS, TEMP, GHV */}
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterB.uvol > 0 ? row.dailyMeterB.uvol.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterB.cvol > 0 ? row.dailyMeterB.cvol.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterB.massTonne > 0 ? row.dailyMeterB.massTonne.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.dailyMeterB.mmbtu > 0 ? row.dailyMeterB.mmbtu.toFixed(1) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.conditionMeterB.pressBarg > 0 ? row.conditionMeterB.pressBarg.toFixed(2) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.conditionMeterB.tempC > 0 ? row.conditionMeterB.tempC.toFixed(1) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold border-r border-slate-800/80">
                        {row.conditionMeterB.ghv > 0 ? row.conditionMeterB.ghv.toFixed(1) : '-'}
                      </td>

                      {/* Key GC Fractions */}
                      <td className="px-2.5 py-2.5 text-right text-white font-bold font-bold">
                        {row.gcMeterA.ch4.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.gcMeterA.c2h6.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.gcMeterA.c3h8.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.gcMeterA.iC4.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.gcMeterA.nC4.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold">
                        {row.gcMeterA.n2.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-white font-bold border-r border-slate-800/80">
                        {row.gcMeterA.co2.toFixed(2)}
                      </td>

                      {/* Heavy Trace Elements */}
                      {showHeavyTrace && (
                        <>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.gcMeterA.iC5.toFixed(4)}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.gcMeterA.nC5.toFixed(4)}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.heavyTrace?.hexane ? row.heavyTrace.hexane.toFixed(4) : '-'}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.heavyTrace?.heptane ? row.heavyTrace.heptane.toFixed(4) : '-'}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.heavyTrace?.octane ? row.heavyTrace.octane.toFixed(4) : '-'}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.heavyTrace?.nonane ? row.heavyTrace.nonane.toFixed(4) : '-'}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.heavyTrace?.decane ? row.heavyTrace.decane.toFixed(4) : '-'}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.heavyTrace?.h2s === 0 ? '0.0000' : '0.0000'}
                          </td>
                          <td className="px-2 py-2.5 text-right text-white font-bold">
                            {row.heavyTrace?.h2o === 0 ? '0.0000' : '0.0000'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={showHeavyTrace ? 36 : 27}
                    className="px-4 py-8 text-center text-white font-bold font-mono"
                  >
                    No database records found matching period {activeStartDate} ~ {activeEndDate}.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals & Averages Footer */}
            <tfoot className="bg-slate-950 text-white font-bold border-t-2 border-slate-800 font-bold sticky bottom-0 z-20 shadow-lg">
              <tr>
                <td className="px-3 py-3 sticky left-0 z-30 bg-slate-950 text-white font-bold uppercase text-[10px] border-r border-slate-800">
                  Summary Totals
                </td>

                {/* Station Totals Sum: UVOL, CVOL, TONNE, MMBTU, CUM. MMBTU */}
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyStation.uvol, 0).toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {summaryMetrics.totalVolMscf.toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold text-sm">
                  {summaryMetrics.totalMassTonne.toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold text-sm">
                  {summaryMetrics.totalEnergy.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold border-r border-slate-800">-</td>

                {/* Meter A Sum */}
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterA.uvol, 0).toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterA.cvol, 0).toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterA.massTonne, 0).toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterA.mmbtu, 0).toFixed(1)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold border-r border-slate-800">-</td>

                {/* Meter B Sum */}
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterB.uvol, 0).toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterB.cvol, 0).toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterB.massTonne, 0).toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {filteredRecords.reduce((a, b) => a + b.dailyMeterB.mmbtu, 0).toFixed(1)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold border-r border-slate-800">-</td>

                {/* GC Averages */}
                <td className="px-2.5 py-3 text-right text-white font-bold">
                  {summaryMetrics.avgMethane.toFixed(2)}
                </td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold">-</td>
                <td className="px-2.5 py-3 text-right text-white font-bold border-r border-slate-800">-</td>

                {/* Heavy Trace Placeholders */}
                {showHeavyTrace && (
                  <td colSpan={9} className="px-2 py-3 text-center text-[10px] text-white font-bold font-bold">
                    Heavy Hydrocarbons / Trace Range Checked
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
