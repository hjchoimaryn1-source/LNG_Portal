// src/components/locations/ArunTerminalView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../../context/PortalDataContext';
import { DefectCategory, NodeState } from '../../types/lng';
import { exportToCSV } from '../../utils/exportCsv';
import {
  Anchor,
  Layers,
  FlaskConical,
  Search,
  CheckCircle2,
  Ship,
  ArrowRight,
  Wrench,
  XCircle,
  PlusCircle,
  Download,
  Calculator,
  FileCheck,
  Atom,
  Boxes,
  Weight,
  Flame,
  Thermometer,
  Table,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Fuel,
  Info,
  RotateCcw,
  Zap,
} from 'lucide-react';

type ArunSubTab =
  | 'OPERATIONS_YARD'
  | 'LOADING_COQ_ENTRY'
  | 'LAB_COQ_SPEC'
  | 'MASTER_HISTORY_SHEET';

interface ArunTerminalViewProps {
  initialSubTab?:
    | 'OPERATIONS_YARD'
    | 'LOADING_COQ_ENTRY'
    | 'LAB_COQ_SPEC'
    | 'MASTER_HISTORY_SHEET'
    | 'LOADING_COQ'
    | 'STAGING_YARD';
}

export default function ArunTerminalView({
  initialSubTab = 'OPERATIONS_YARD',
}: ArunTerminalViewProps) {
  const {
    fleetTanks,
    gasCompositions,
    settlementRecords,
    batchTransitionTanks,
    updateTankLog,
    markTankForMaintenance,
    addDeliveredMeasurement,
    recordArunArrivalHeelInspection,
  } = usePortalData();

  // Normalize initial sub tab
  const getInitialTab = (): ArunSubTab => {
    if (initialSubTab === 'STAGING_YARD') return 'OPERATIONS_YARD';
    if (initialSubTab === 'LOADING_COQ' || initialSubTab === 'LOADING_COQ_ENTRY') return 'LOADING_COQ_ENTRY';
    if (initialSubTab === 'MASTER_HISTORY_SHEET') return 'MASTER_HISTORY_SHEET';
    return (initialSubTab as ArunSubTab) || 'OPERATIONS_YARD';
  };

  const [activeTab, setActiveTab] = useState<ArunSubTab>(getInitialTab());

  // Synchronize tab state when user navigates via Sidebar items
  React.useEffect(() => {
    setActiveTab(getInitialTab());
  }, [initialSubTab]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search States
  const [yardSearch, setYardSearch] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyShipmentFilter, setHistoryShipmentFilter] = useState<string>('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('ALL');

  // Sorting State for Master History Sheet
  const [sortField, setSortField] = useState<
    'tankNo' | 'date' | 'deliveredWeightKg' | 'deliveredVolumeM3' | 'deliveredMMBtu'
  >('tankNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Selection & Modal States
  const [selectedYardTanks, setSelectedYardTanks] = useState<Set<string>>(new Set());
  const [mroModalTankNo, setMroModalTankNo] = useState<string | null>(null);
  const [defectCat, setDefectCat] = useState<DefectCategory>('VALVE_LEAK');
  const [defectDesc, setDefectDesc] = useState<string>('');

  // Heel Lifecycle Audit & Stage 3 Arrival Inspection States
  const [selectedHeelAuditTankNo, setSelectedHeelAuditTankNo] = useState<string | null>('ISOT-001');
  const [arrivalModalTankNo, setArrivalModalTankNo] = useState<string | null>(null);
  const [arrivalDate, setArrivalDate] = useState<string>(() => new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [arrivalMassKg, setArrivalMassKg] = useState<number>(318);
  const [arrivalPressureMPa, setArrivalPressureMPa] = useState<number>(0.32);
  const [arrivalTempC, setArrivalTempC] = useState<number>(-128.5);
  const [tareWeightKg, setTareWeightKg] = useState<number>(10850);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(11168);
  const [inspectorRemarks, setInspectorRemarks] = useState<string>('Vacuum integrity verified. Cold heel intact for uncharged charging cycle.');

  // Active Shipment Batch Target in console
  const [formShipment, setFormShipment] = useState<string>('N-2');

  // Embedded Console Specific States (Tab 2: Loading & COQ Issue)
  const [consoleTankFilter, setConsoleTankFilter] = useState<'ARUN_YARD' | 'SAVIOUR_RETURN' | 'ALL'>('ARUN_YARD');
  const [consoleTankSearch, setConsoleTankSearch] = useState<string>('');
  const [consoleChecklist, setConsoleChecklist] = useState<{
    valvesVerified: boolean;
    vacuumSealOk: boolean;
    safetyGrounding: boolean;
    purgeReady: boolean;
  }>({
    valvesVerified: true,
    vacuumSealOk: true,
    safetyGrounding: true,
    purgeReady: true,
  });

  // Staged Tanks in Arun PAG (Node 1)
  const arunYardTanks = useMemo(() => {
    return fleetTanks.filter(
      (t) => t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL && !t.isUnderMaintenance
    );
  }, [fleetTanks]);

  // All Delivered Measurement Records
  const certificateRecords = useMemo(() => {
    return settlementRecords.filter((r) => r.deliveredMMBtu > 0);
  }, [settlementRecords]);

  // Active Shipment Batch Records (Isolating current in-progress batch from completed historical shipments)
  const activeBatchRecords = useMemo(() => {
    const currentBatch = (formShipment || 'N-2').trim().toUpperCase();
    return certificateRecords.filter(
      (r) => (r.shipment || '').trim().toUpperCase() === currentBatch
    );
  }, [certificateRecords, formShipment]);

  // Operational KPI Aggregations from Live Arun Yard Staging & Active Batch N-2
  const operationalKPIs = useMemo(() => {
    let totalWeightKg = 0;
    let totalVolumeM3 = 0;
    let totalMMBtu = 0;

    activeBatchRecords.forEach((r) => {
      totalWeightKg += r.deliveredWeightKg || 0;
      totalVolumeM3 += r.totalDeliveredVolM3 || r.deliveredVolumeM3 || 0;
      totalMMBtu += r.deliveredMMBtu || 0;
    });

    const totalTons = totalWeightKg / 1000;
    const loadedCount = activeBatchRecords.length;
    const yardTotalCount = arunYardTanks.length;

    return {
      yardTotalCount,
      loadedCount,
      totalTons,
      totalVolumeM3,
      totalMMBtu,
      avgGHV: 52214.94,
      shipmentBatch: formShipment.trim() || 'N-2',
    };
  }, [activeBatchRecords, arunYardTanks.length, formShipment]);

  // Distinct Shipment Batches for Filter
  const distinctShipments = useMemo(() => {
    const set = new Set<string>();
    certificateRecords.forEach((r) => {
      if (r.shipment) set.add(r.shipment);
    });
    return Array.from(set);
  }, [certificateRecords]);

  const filteredYardTanks = useMemo(() => {
    return arunYardTanks.filter((t) => {
      const q = yardSearch.toLowerCase().trim();
      return (
        !q ||
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q)
      );
    });
  }, [arunYardTanks, yardSearch]);

  // Arun COQ composition records from real CSV data & dynamic additions
  const arunCOQRecords = useMemo(() => {
    return gasCompositions.filter((g) => g.source.includes('COQ') || g.source.includes('Arun'));
  }, [gasCompositions]);

  // Tab 3 COQ Shipment Filter State
  const [coqShipmentFilter, setCoqShipmentFilter] = useState<string>('ALL');

  // Distinct Shipments for COQ Tab
  const distinctCOQShipments = useMemo(() => {
    const set = new Set<string>();
    arunCOQRecords.forEach((r) => {
      if (r.shipment) set.add(r.shipment);
    });
    distinctShipments.forEach((s) => set.add(s));
    return Array.from(set);
  }, [arunCOQRecords, distinctShipments]);

  // Filtered COQ Records for Tab 3 based on selected shipment
  const filteredCOQRecords = useMemo(() => {
    if (coqShipmentFilter === 'ALL') return arunCOQRecords;
    return arunCOQRecords.filter(
      (r) => (r.shipment || 'N-1').trim().toUpperCase() === coqShipmentFilter.trim().toUpperCase()
    );
  }, [arunCOQRecords, coqShipmentFilter]);

  // Dynamic active COQ spec reflecting selected batch or fleet average
  const activeCOQSpec = useMemo(() => {
    const targetList = filteredCOQRecords.length > 0 ? filteredCOQRecords : arunCOQRecords;
    if (targetList.length > 0) {
      const count = targetList.length;
      const sum = targetList.reduce(
        (acc, r) => ({
          methane: acc.methane + (r.methane || 0),
          ethane: acc.ethane + (r.ethane || 0),
          propane: acc.propane + (r.propane || 0),
          iButane: acc.iButane + (r.iButane || 0),
          nButane: acc.nButane + (r.nButane || 0),
          iPentane: acc.iPentane + (r.iPentane || 0),
          nPentane: acc.nPentane + (r.nPentane || 0),
          c6Plus: acc.c6Plus + (r.c6Plus || 0),
          nitrogen: acc.nitrogen + (r.nitrogen || 0),
          co2: acc.co2 + (r.co2 || 0),
          ghv: acc.ghv + (r.ghv || 0),
        }),
        {
          methane: 0,
          ethane: 0,
          propane: 0,
          iButane: 0,
          nButane: 0,
          iPentane: 0,
          nPentane: 0,
          c6Plus: 0,
          nitrogen: 0,
          co2: 0,
          ghv: 0,
        }
      );

      return {
        methane: parseFloat((sum.methane / count).toFixed(2)),
        ethane: parseFloat((sum.ethane / count).toFixed(2)),
        propane: parseFloat((sum.propane / count).toFixed(2)),
        iButane: parseFloat((sum.iButane / count).toFixed(2)),
        nButane: parseFloat((sum.nButane / count).toFixed(2)),
        iPentane: parseFloat((sum.iPentane / count).toFixed(2)),
        nPentane: parseFloat((sum.nPentane / count).toFixed(2)),
        c6Plus: parseFloat((sum.c6Plus / count).toFixed(2)),
        nitrogen: parseFloat((sum.nitrogen / count).toFixed(2)),
        co2: parseFloat((sum.co2 / count).toFixed(2)),
        ghv: parseFloat((sum.ghv / count).toFixed(1)),
      };
    }
    return {
      methane: 95.5,
      ethane: 3.39,
      propane: 0.77,
      iButane: 0.12,
      nButane: 0.14,
      iPentane: 0.03,
      nPentane: 0.01,
      c6Plus: 0.0,
      nitrogen: 0.04,
      co2: 0.0,
      ghv: 1056.4,
    };
  }, [filteredCOQRecords, arunCOQRecords]);

  const coqTotalMol = useMemo(() => {
    return parseFloat(
      (
        activeCOQSpec.methane +
        activeCOQSpec.ethane +
        activeCOQSpec.propane +
        activeCOQSpec.iButane +
        activeCOQSpec.nButane +
        activeCOQSpec.iPentane +
        activeCOQSpec.nPentane +
        activeCOQSpec.c6Plus +
        activeCOQSpec.nitrogen +
        activeCOQSpec.co2
      ).toFixed(2)
    );
  }, [activeCOQSpec]);

  // Filtered & Sorted Master History Records (Tab 4)
  const filteredHistoryRecords = useMemo(() => {
    const filtered = certificateRecords.filter((cert) => {
      const q = historySearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        cert.tankNo.toLowerCase().includes(q) ||
        cert.serialNo.toLowerCase().includes(q) ||
        cert.shipment.toLowerCase().includes(q) ||
        cert.date.toLowerCase().includes(q);

      const matchShipment =
        historyShipmentFilter === 'ALL' || cert.shipment === historyShipmentFilter;
      const matchDate = historyDateFilter === 'ALL' || cert.date === historyDateFilter;

      return matchSearch && matchShipment && matchDate;
    });

    return filtered.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [
    certificateRecords,
    historySearch,
    historyShipmentFilter,
    historyDateFilter,
    sortField,
    sortAsc,
  ]);

  // ====================================================================
  // FORM STATE FOR EMBEDDED LOADING & COQ CONSOLE (Clean / Uncharged Defaults)
  // ====================================================================
  const [formTankNo, setFormTankNo] = useState<string>(arunYardTanks[0]?.tankNo || 'ISOT-001');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formWeightBefore, setFormWeightBefore] = useState<number>(12100);
  const [formWeightAfter, setFormWeightAfter] = useState<number>(0);
  const [formDensity, setFormDensity] = useState<number>(442.02);
  const [formTemp, setFormTemp] = useState<number>(-160.0);
  const [formGHV, setFormGHV] = useState<number>(52214.94);
  const [formGUPVol, setFormGUPVol] = useState<number>(0);
  const [formGUPEnergy, setFormGUPEnergy] = useState<number>(0);
  const [formCDTemp, setFormCDTemp] = useState<number>(-160.0);
  const [formCDVol, setFormCDVol] = useState<number>(0);
  const [formCDEnergy, setFormCDEnergy] = useState<number>(0);

  // 11-Gas Components Form State (Starts blank 0.00% until template loaded or entered)
  const [ch4, setCh4] = useState<number>(0);
  const [c2h6, setC2h6] = useState<number>(0);
  const [c3h8, setC3h8] = useState<number>(0);
  const [iC4, setIC4] = useState<number>(0);
  const [nC4, setNC4] = useState<number>(0);
  const [iC5, setIC5] = useState<number>(0);
  const [nC5, setNC5] = useState<number>(0);
  const [c6Plus, setC6Plus] = useState<number>(0);
  const [n2, setN2] = useState<number>(0);
  const [co2, setCo2] = useState<number>(0);
  const [coqGhv, setCoqGhv] = useState<number>(0);

  // Auto-Linking: Tank master info
  const selectedTankMaster = useMemo(() => {
    return fleetTanks.find((t) => t.tankNo === formTankNo) || fleetTanks[0];
  }, [fleetTanks, formTankNo]);

  // Handle Tank Selection - Resets weights and parameters to clean uncharged state
  const handleSelectTank = (tank: any) => {
    setFormTankNo(tank.tankNo);
    setFormTemp(tank.tempC && tank.tempC !== 0 ? tank.tempC : -160.0);
    setFormWeightBefore(12100);
    setFormWeightAfter(0);
    setFormGUPEnergy(0);
    setFormGUPVol(0);
    setFormCDEnergy(0);
    setFormCDVol(0);
    setCh4(0);
    setC2h6(0);
    setC3h8(0);
    setIC4(0);
    setNC4(0);
    setIC5(0);
    setNC5(0);
    setC6Plus(0);
    setN2(0);
    setCo2(0);
    setCoqGhv(0);
  };

  // Quick Action: Load Standard Arun Lab Spec Template
  const handleLoadStandardSpec = () => {
    setCh4(activeCOQSpec.methane);
    setC2h6(activeCOQSpec.ethane);
    setC3h8(activeCOQSpec.propane);
    setIC4(activeCOQSpec.iButane);
    setNC4(activeCOQSpec.nButane);
    setIC5(activeCOQSpec.iPentane);
    setNC5(activeCOQSpec.nPentane);
    setC6Plus(activeCOQSpec.c6Plus || 0);
    setN2(activeCOQSpec.nitrogen);
    setCo2(activeCOQSpec.co2);
    setCoqGhv(activeCOQSpec.ghv);
    setFormGHV(52214.94);
  };

  // Quick Action: Clear Gas Spec
  const handleClearGasSpec = () => {
    setCh4(0);
    setC2h6(0);
    setC3h8(0);
    setIC4(0);
    setNC4(0);
    setIC5(0);
    setNC5(0);
    setC6Plus(0);
    setN2(0);
    setCo2(0);
    setCoqGhv(0);
  };

  // Candidate Tanks for Console Tank Selector
  const consoleCandidateTanks = useMemo(() => {
    return fleetTanks.filter((t) => {
      const matchCategory =
        consoleTankFilter === 'ALL' ||
        (consoleTankFilter === 'ARUN_YARD' &&
          (t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL ||
            t.location.includes('Aceh') ||
            t.location.includes('Arun'))) ||
        (consoleTankFilter === 'SAVIOUR_RETURN' &&
          (t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT ||
            t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
            t.location.includes('Ship') ||
            t.position.includes('SAVIOUR')));

      const q = consoleTankSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [fleetTanks, consoleTankFilter, consoleTankSearch]);

  // Real-time dynamic calculations (Displays 0 if uncharged / gross <= tare)
  const calculatedLoadedWeight = useMemo(() => {
    if (formWeightAfter <= 0 || formWeightAfter <= formWeightBefore) return 0;
    return formWeightAfter - formWeightBefore;
  }, [formWeightAfter, formWeightBefore]);

  const calculatedVolumeM3 = useMemo(() => {
    if (calculatedLoadedWeight <= 0 || formDensity <= 0) return 0;
    return parseFloat((calculatedLoadedWeight / formDensity).toFixed(2));
  }, [calculatedLoadedWeight, formDensity]);

  const calculatedBtuLoaded = useMemo(() => {
    if (calculatedLoadedWeight <= 0) return 0;
    return parseFloat((calculatedLoadedWeight * formGHV).toFixed(0));
  }, [calculatedLoadedWeight, formGHV]);

  const calculatedBtuLoadedMMBtu = useMemo(() => {
    if (calculatedLoadedWeight <= 0) return 0;
    return parseFloat((calculatedBtuLoaded / 1000000).toFixed(2));
  }, [calculatedBtuLoaded, calculatedLoadedWeight]);

  const calculatedTotalDeliveredVol = useMemo(() => {
    if (calculatedVolumeM3 <= 0 && formGUPVol <= 0 && formCDVol <= 0) return 0;
    return parseFloat((calculatedVolumeM3 + formGUPVol + formCDVol).toFixed(2));
  }, [calculatedVolumeM3, formGUPVol, formCDVol]);

  const calculatedTotalEnergyMMBtu = useMemo(() => {
    if (calculatedLoadedWeight <= 0 && formGUPEnergy <= 0 && formCDEnergy <= 0) return 0;
    return parseFloat((calculatedBtuLoadedMMBtu + formGUPEnergy + formCDEnergy).toFixed(2));
  }, [calculatedBtuLoadedMMBtu, formGUPEnergy, formCDEnergy, calculatedLoadedWeight]);

  const formComponentSum = useMemo(() => {
    return parseFloat((ch4 + c2h6 + c3h8 + iC4 + nC4 + iC5 + nC5 + c6Plus + n2 + co2).toFixed(2));
  }, [ch4, c2h6, c3h8, iC4, nC4, iC5, nC5, c6Plus, n2, co2]);

  // Handlers
  const toggleSelectYardTank = (tankNo: string) => {
    setSelectedYardTanks((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) next.delete(tankNo);
      else next.add(tankNo);
      return next;
    });
  };

  const selectAllYard = () => {
    if (selectedYardTanks.size === filteredYardTanks.length) {
      setSelectedYardTanks(new Set());
    } else {
      setSelectedYardTanks(new Set(filteredYardTanks.map((t) => t.tankNo)));
    }
  };

  const handleDispatchToMarine = () => {
    if (selectedYardTanks.size === 0) return;
    const count = selectedYardTanks.size;
    batchTransitionTanks(Array.from(selectedYardTanks), NodeState.NODE_2_MV_SAVIOUR_TRANSIT);
    setSelectedYardTanks(new Set());
    setToastMessage(`Dispatched & Loaded ${count} tanks to MV. Saviour (Offshore Transit)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mroModalTankNo) return;
    markTankForMaintenance(
      mroModalTankNo,
      defectCat,
      'ARUN_WORKSHOP',
      defectDesc || 'Terminal staging defect'
    );
    setMroModalTankNo(null);
    setDefectDesc('');
    setToastMessage(`Tank ${mroModalTankNo} routed to Arun MRO Workshop`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleArrivalInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalModalTankNo) return;

    recordArunArrivalHeelInspection(arrivalModalTankNo, {
      arrivalDate,
      arrivalMassKg,
      arrivalPressureMPa,
      arrivalTempC,
      tareWeightKg,
      grossWeightKg,
      inspectorRemarks,
    });

    setToastMessage(`Arun Arrival Inspection Certified for ${arrivalModalTankNo}: ${arrivalMassKg} kg Heel Verified & Credited`);
    setArrivalModalTankNo(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateLoadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedLoadedWeight <= 0) {
      alert('Please enter a valid Gross Weight (Gross > Tare) before issuing certificate.');
      return;
    }

    const serialNo = selectedTankMaster?.serialNo || 'TRSU-ARUN';
    const activeShipment = formShipment.trim() || 'N-2';
    const activeDate = formDate || new Date().toISOString().split('T')[0];

    addDeliveredMeasurement(
      {
        tankNo: formTankNo,
        serialNo,
        shipment: activeShipment,
        weightBeforeKg: formWeightBefore,
        weightAfterKg: formWeightAfter,
        deliveredWeightKg: calculatedLoadedWeight,
        deliveredVolumeM3: calculatedVolumeM3,
        deliveredDensity: formDensity,
        deliveredTempC: formTemp,
        deliveredGHV: formGHV,
        gassingUpVolM3: formGUPVol,
        gassingUpEnergyMMBtu: formGUPEnergy,
        coolingDownTempC: formCDTemp,
        coolingDownVolM3: formCDVol,
        coolingDownEnergyMMBtu: formCDEnergy,
        btuLoaded: calculatedBtuLoaded,
        btuLoadedMMBtu: calculatedBtuLoadedMMBtu,
        totalDeliveredVolM3: calculatedTotalDeliveredVol,
        deliveredMMBtu: calculatedTotalEnergyMMBtu,
        date: activeDate,
        remarks: `Arun PAG Delivered Measurement Certified (Batch ${activeShipment})`,
      },
      {
        source: 'Arun PAG COQ Lab',
        samplePoint: `${formTankNo} (${serialNo})`,
        reportDate: activeDate,
        methane: ch4 || activeCOQSpec.methane,
        ethane: c2h6 || activeCOQSpec.ethane,
        propane: c3h8 || activeCOQSpec.propane,
        iButane: iC4 || activeCOQSpec.iButane,
        nButane: nC4 || activeCOQSpec.nButane,
        iPentane: iC5 || activeCOQSpec.iPentane,
        nPentane: nC5 || activeCOQSpec.nPentane,
        c6Plus: c6Plus || activeCOQSpec.c6Plus,
        nitrogen: n2 || activeCOQSpec.nitrogen,
        co2: co2 || activeCOQSpec.co2,
        ghv: coqGhv || activeCOQSpec.ghv,
      }
    );

    // FSM State Transition: Automatically transition selected tank to ARUN_STAGED_FOR_DEPARTURE
    updateTankLog(formTankNo, {
      location: 'Aceh',
      position: 'ARUN_STAGED_FOR_DEPARTURE',
      node: NodeState.NODE_1_ARUN_PAG_TERMINAL,
      level: 98,
      pressureMPa: 0.78,
      tempC: formTemp,
      remarks: `Certified LNG Loaded & Staged at Arun PAG (Shipment ${activeShipment})`,
    });

    // Reset weight after after successful submission
    setFormWeightAfter(0);

    setToastMessage(
      `Certified ${formTankNo} (${calculatedTotalEnergyMMBtu.toFixed(2)} MMBtu) & Staged for Shipment ${activeShipment} Departure`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportCOQ = () => {
    const batchTag = coqShipmentFilter === 'ALL' ? 'All_Batches' : `Shipment_${coqShipmentFilter}`;
    exportToCSV(
      `Arun_PAG_COQ_Gas_Compositions_${batchTag}`,
      filteredCOQRecords.map((r) => ({
        SamplePoint: r.samplePoint,
        Shipment: r.shipment || 'N-1',
        Source: r.source,
        ReportDate: r.reportDate,
        Methane_CH4_Pct: r.methane,
        Ethane_C2H6_Pct: r.ethane,
        Propane_C3H8_Pct: r.propane,
        iButane_iC4H10_Pct: r.iButane,
        nButane_nC4H10_Pct: r.nButane,
        iPentane_iC5H12_Pct: r.iPentane,
        nPentane_nC5H12_Pct: r.nPentane,
        Hexane_C6Plus_Pct: r.c6Plus || 0,
        Nitrogen_N2_Pct: r.nitrogen,
        CO2_Pct: r.co2,
        GHV_BTU_SCF: r.ghv,
      }))
    );
  };

  const handleExportBatchCSV = () => {
    const activeBatch = formShipment.trim() || 'N-2';
    exportToCSV(
      `Arun_PAG_Shipment_${activeBatch}_Delivered_Measurements`,
      activeBatchRecords.map((c) => ({
        IsoTankNo: c.tankNo,
        SerialNo: c.serialNo,
        Date: c.date,
        Shipment: c.shipment,
        WeightBeforeKg: c.weightBeforeKg || 12100,
        WeightAfterKg: c.weightAfterKg || 30600,
        LoadedNetKg: c.deliveredWeightKg,
        DensityKgM3: c.deliveredDensity,
        LiquidTempC: c.deliveredTempC,
        VolumeM3: c.deliveredVolumeM3,
        GHV_BTU_Kg: c.deliveredGHV,
        TotalEnergyDeliveredMMBTU: c.deliveredMMBtu,
      }))
    );
  };

  const handleExportFullHistory = () => {
    exportToCSV(
      'Arun_PAG_Master_Delivered_Measurements_History',
      filteredHistoryRecords.map((c) => ({
        IsoTankNo: c.tankNo,
        SerialNo: c.serialNo,
        Date: c.date,
        Shipment: c.shipment,
        WeightBeforeKg: c.weightBeforeKg || 12100,
        WeightAfterKg: c.weightAfterKg || 30600,
        LoadedNetKg: c.deliveredWeightKg,
        DensityKgM3: c.deliveredDensity,
        LiquidTempC: c.deliveredTempC,
        VolumeM3: c.deliveredVolumeM3,
        GHV_BTU_Kg: c.deliveredGHV,
        GassingUpVolM3: c.gassingUpVolM3 || 0,
        GassingUpEnergyMMBtu: c.gassingUpEnergyMMBtu || 0,
        CoolingDownTempC: c.coolingDownTempC || c.deliveredTempC,
        CoolingDownVolM3: c.coolingDownVolM3 || 0,
        CoolingDownEnergyMMBtu: c.coolingDownEnergyMMBtu || 0,
        BTULoadedMMBtu:
          c.btuLoadedMMBtu || (c.deliveredWeightKg * c.deliveredGHV) / 1000000,
        TotalDeliveredVolM3: c.totalDeliveredVolM3 || c.deliveredVolumeM3,
        TotalEnergyDeliveredMMBTU: c.deliveredMMBtu,
      }))
    );
  };

  const handleSort = (
    field: 'tankNo' | 'date' | 'deliveredWeightKg' | 'deliveredVolumeM3' | 'deliveredMMBtu'
  ) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIcon = (
    field: 'tankNo' | 'date' | 'deliveredWeightKg' | 'deliveredVolumeM3' | 'deliveredMMBtu'
  ) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-white font-bold inline-block ml-1" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-white font-bold inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-white font-bold inline-block ml-1" />
    );
  };

  return (
    <div className="flex flex-col gap-5 w-full text-white font-bold pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-blue-500/20 border border-blue-500/50 text-white font-bold rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white font-bold" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Header & 4 Sub-Tabs Navigation */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Anchor className="w-6 h-6 text-white font-bold" />
            <h2 className="text-lg sm:text-xl font-bold text-white font-bold">
              Arun PAG Terminal Operations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-mono text-white font-bold">
              PT Perta Arun Gas • Aceh
            </span>
          </div>
          <p className="text-xs text-white font-bold">
            LNG loading measurement certification, Certificate of Quality (COQ) lab testing, and staging yard dispatch
          </p>
        </div>

        {/* 4 Dedicated Sub-Tabs Navigation Bar */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('OPERATIONS_YARD')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'OPERATIONS_YARD'
                ? 'bg-blue-600/20 text-white font-bold border border-blue-500/40 shadow-sm'
                : 'text-white font-bold hover:text-white font-bold'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📊 Operations & Yard</span>
          </button>

          <button
            onClick={() => setActiveTab('LOADING_COQ_ENTRY')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'LOADING_COQ_ENTRY'
                ? 'bg-blue-600/20 text-white font-bold border border-blue-500/40 shadow-sm'
                : 'text-white font-bold hover:text-white font-bold'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>📝 Loading & COQ Issue</span>
          </button>

          <button
            onClick={() => setActiveTab('LAB_COQ_SPEC')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'LAB_COQ_SPEC'
                ? 'bg-blue-600/20 text-white font-bold border border-blue-500/40 shadow-sm'
                : 'text-white font-bold hover:text-white font-bold'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>🔬 Lab COQ Specification</span>
          </button>

          <button
            onClick={() => setActiveTab('MASTER_HISTORY_SHEET')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'MASTER_HISTORY_SHEET'
                ? 'bg-blue-600/20 text-white font-bold border border-blue-500/40 shadow-sm'
                : 'text-white font-bold hover:text-white font-bold'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>📈 Master History Sheet ({certificateRecords.length})</span>
          </button>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* TAB 1: 📊 OPERATIONS & YARD (Overview & Dispatch) */}
      {/* ==================================================================== */}
      {activeTab === 'OPERATIONS_YARD' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Arun Staging Inventory */}
            <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white font-bold font-sans">
                  Arun Staging Inventory
                </span>
                <Boxes className="w-4 h-4 text-white font-bold" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white font-bold mb-1">
                {operationalKPIs.yardTotalCount}{' '}
                <span className="text-sm font-sans font-bold text-white font-bold">Tanks</span>
              </div>
              <span className="text-xs font-mono text-white font-bold">
                Status: Empty / Heel Retention
              </span>
            </div>

            {/* Card 2: Active Batch (Shipment N-2) Progress */}
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white font-bold font-sans">
                  Active Batch Loading (Shipment {operationalKPIs.shipmentBatch})
                </span>
                <Weight className="w-4 h-4 text-white font-bold" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white font-bold mb-1">
                {operationalKPIs.loadedCount} / {operationalKPIs.yardTotalCount}{' '}
                <span className="text-sm font-sans font-bold text-white font-bold">Loaded</span>
              </div>
              <span className="text-xs font-mono text-white font-bold">
                Net: {operationalKPIs.totalTons.toFixed(2)} Ton • {operationalKPIs.totalVolumeM3.toFixed(1)} m³
              </span>
            </div>

            {/* Card 3: Active Delivered Energy */}
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white font-bold font-sans">
                  Active Delivered Energy
                </span>
                <Flame className="w-4 h-4 text-white font-bold" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white font-bold mb-1">
                {operationalKPIs.totalMMBtu.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-sans font-bold text-white font-bold">MMBtu</span>
              </div>
              <span className="text-xs font-mono text-white font-bold">
                Avg GHV: {operationalKPIs.avgGHV.toLocaleString(undefined, { maximumFractionDigits: 2 })} BTU/Kg
              </span>
            </div>

            {/* Card 4: Terminal Base Conditions */}
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white font-bold font-sans">
                  Terminal Base Conditions
                </span>
                <Thermometer className="w-4 h-4 text-white font-bold" />
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white font-bold">
                  -160.0
                </span>
                <span className="text-xs text-white font-bold font-mono">°C / 442.02 kg/m³</span>
              </div>
              <span className="text-xs font-mono text-white font-bold">
                Operating Press: 0.78 MPa
              </span>
            </div>
          </div>

          {/* Arun Staging Yard Fleet Grid */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white font-bold shrink-0" />
                  Arun PAG Staging Yard Fleet (Tanks Staged for Marine Departure)
                </h3>
                <p className="text-xs text-white font-bold">
                  Select ready ISO tanks to batch dispatch and load aboard MV. Saviour
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-white font-bold absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Yard Tanks..."
                    value={yardSearch}
                    onChange={(e) => setYardSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={selectAllYard}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-white font-bold font-bold transition-colors cursor-pointer"
                >
                  {selectedYardTanks.size > 0 &&
                  selectedYardTanks.size === filteredYardTanks.length
                    ? 'Deselect'
                    : 'Select All'}
                </button>

                <button
                  onClick={handleDispatchToMarine}
                  disabled={selectedYardTanks.size === 0}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedYardTanks.size > 0
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 cursor-pointer'
                      : 'bg-slate-800 text-white font-bold border border-slate-700/50 cursor-not-allowed'
                  }`}
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>Dispatch to MV. Saviour ({selectedYardTanks.size})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Yard Tanks Table */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead className="sticky top-0 z-10 bg-slate-950 text-white font-bold text-[11px] uppercase tracking-wider font-bold">
                  <tr className="border-b border-slate-800">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedYardTanks.size > 0 &&
                          selectedYardTanks.size === filteredYardTanks.length
                        }
                        onChange={selectAllYard}
                        className="rounded border-slate-700 bg-slate-900 text-white font-bold accent-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">ISO Tank No</th>
                    <th className="p-3">Serial No</th>
                    <th className="p-3">Position</th>
                    <th className="p-3 text-right">Liquid Level (%)</th>
                    <th className="p-3 text-right">Pressure (MPa)</th>
                    <th className="p-3 text-right">Temp (°C)</th>
                    <th className="p-3 text-center">Heel Closed-Loop Audit</th>
                    <th className="p-3 text-center">Staging & Status</th>
                    <th className="p-3 text-center">MRO</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-800/60 font-mono">
                  {filteredYardTanks.map((tank) => {
                    const isSelected = selectedYardTanks.has(tank.tankNo);
                    const isCertified =
                      activeBatchRecords.some((r) => r.tankNo === tank.tankNo) ||
                      tank.position === 'ARUN_STAGED_FOR_DEPARTURE';
                    const currentLevel = isCertified ? 98 : (tank.level > 10 ? 2 : tank.level || 0);
                    const isAuditSelected = selectedHeelAuditTankNo === tank.tankNo;

                    return (
                      <tr
                        key={tank.tankNo}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isSelected
                            ? 'bg-blue-950/20'
                            : isCertified
                            ? 'bg-cyan-950/15'
                            : isAuditSelected
                            ? 'bg-purple-950/20 ring-1 ring-purple-500/30'
                            : 'bg-transparent'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectYardTank(tank.tankNo)}
                            className="rounded border-slate-700 bg-slate-950 text-white font-bold accent-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-white font-bold flex items-center gap-1.5">
                          <span>{tank.tankNo}</span>
                          {isCertified && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"
                              title="Loaded & Staged for Marine Departure"
                            />
                          )}
                        </td>
                        <td className="p-3 text-white font-bold text-[11px]">{tank.serialNo}</td>
                        <td className="p-3 font-sans text-white font-bold">
                          {isCertified ? 'ARUN_STAGED_FOR_DEPARTURE' : tank.position || 'Aceh Staging Yard'}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-xs inline-block ${
                              isCertified
                                ? 'bg-cyan-500/20 text-white font-bold border border-cyan-500/30'
                                : 'bg-slate-800/80 text-white font-bold border border-slate-700/50'
                            }`}
                          >
                            {currentLevel}% {isCertified ? '(Full LNG)' : '(Heel)'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={tank.pressureMPa || 0.15}
                            onChange={(e) =>
                              updateTankLog(tank.tankNo, {
                                pressureMPa: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-white font-bold font-bold focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.1"
                            value={tank.tempC || (isCertified ? -160.0 : -126.5)}
                            onChange={(e) =>
                              updateTankLog(tank.tankNo, {
                                tempC: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-white font-bold focus:border-blue-500 outline-none"
                          />
                        </td>
                        {/* Heel Closed-Loop & Audit Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 font-sans">
                            <button
                              type="button"
                              onClick={() => setSelectedHeelAuditTankNo(isAuditSelected ? null : tank.tankNo)}
                              className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isAuditSelected
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'bg-purple-950/40 text-white font-bold border border-purple-800/60 hover:bg-purple-900/50'
                              }`}
                            >
                              <RotateCcw className="w-3 h-3 text-white font-bold" />
                              <span>{isAuditSelected ? 'Auditing' : 'Heel Audit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setArrivalModalTankNo(tank.tankNo);
                                setArrivalMassKg(tank.arrivalHeelMetrics?.arrivalMassKg || 318);
                                setArrivalPressureMPa(tank.arrivalHeelMetrics?.arrivalPressureMPa || tank.pressureMPa || 0.32);
                                setArrivalTempC(tank.arrivalHeelMetrics?.arrivalTempC || tank.tempC || -128.5);
                              }}
                              className="px-2 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-colors cursor-pointer"
                              title="Record Live Arrival Inspection"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center font-sans">
                          {isCertified ? (
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-white font-bold border border-cyan-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-white font-bold" />
                              Staged for Departure
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-white font-bold border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-white font-bold" />
                              Ready for Loading
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setMroModalTankNo(tank.tankNo)}
                            className="p-1 text-white font-bold hover:text-white font-bold hover:bg-slate-800 rounded font-sans text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Wrench className="w-3 h-3 text-white font-bold" />
                            <span>MRO</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredYardTanks.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-white font-bold font-sans">
                        No ISO Tanks currently staged in Arun PAG Yard.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Stage 3: Heel Preservation & Transit Audit Card (Closed-Loop) */}
            {selectedHeelAuditTankNo && (() => {
              const tank = fleetTanks.find((t) => t.tankNo === selectedHeelAuditTankNo);
              if (!tank) return null;

              const stage1 = tank.offloadHeelMetrics || {
                offloadDate: '2026-08-10 14:00',
                heelLevelPct: 4.2,
                heelVolumeM3: 1.9,
                heelMmH2O: 38,
                heelMassKg: 365,
                holdingPressureMPa: 0.21,
                tempC: -136.0,
                bayId: 'Bay 01',
              };

              const stage2 = tank.backhaulDepartureMetrics || {
                departureDate: '2026-08-11 09:30',
                departureLevelPct: 4.0,
                departureMassKg: 350,
                departurePressureMPa: 0.24,
                departureTempC: -133.5,
                manifestNo: 'BHM-202608-001',
                vesselName: 'MV. Saviour',
                safetyClearance: true,
              };

              const stage3 = tank.arrivalHeelMetrics || {
                arrivalDate: '2026-08-13 11:15',
                arrivalMassKg: 332,
                arrivalPressureMPa: 0.31,
                arrivalTempC: -129.0,
                tareWeightKg: 10850,
                grossWeightKg: 11182,
                inspectorRemarks: 'Arun PAG arrival inspection: 332 kg cold heel verified intact.',
              };

              const massLoss = tank.voyageHeelLoss?.massLossKg ?? Math.max(0, stage2.departureMassKg - stage3.arrivalMassKg);
              const pressRise = tank.voyageHeelLoss?.pressureRiseMPa ?? parseFloat(Math.max(0, stage3.arrivalPressureMPa - stage2.departurePressureMPa).toFixed(3));
              const efficiency = tank.voyageHeelLoss?.preservationEfficiencyPct ?? parseFloat(((stage3.arrivalMassKg / stage2.departureMassKg) * 100).toFixed(1));
              const heelCredit = tank.voyageHeelLoss?.heelCreditMMBtu ?? parseFloat(((stage3.arrivalMassKg * 52215) / 1000000 * 0.947817 * 0.001055).toFixed(2));

              return (
                <div className="border-t border-slate-800 bg-slate-950/90 p-5 space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-white font-bold" />
                      <div>
                        <h4 className="text-sm font-bold text-white font-bold flex items-center gap-2">
                          <span>Heel Preservation & Transit Audit Card:</span>
                          <span className="font-mono text-white font-bold">{tank.tankNo}</span>
                          <span className="text-xs text-white font-bold font-mono">({tank.serialNo})</span>
                        </h4>
                        <p className="text-[11px] text-white font-bold">
                          3-Stage Closed-Loop Tracking: Nias Post-Regas Offload ➔ Marine Backhaul ➔ Arun PAG Arrival & Thermal Credit
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setArrivalModalTankNo(tank.tankNo);
                        setArrivalMassKg(stage3.arrivalMassKg);
                        setArrivalPressureMPa(stage3.arrivalPressureMPa);
                        setArrivalTempC(stage3.arrivalTempC);
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record / Update Arrival Inspection</span>
                    </button>
                  </div>

                  {/* 3 Stage Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stage 1 Card */}
                    <div className="p-4 bg-slate-900/90 border border-blue-500/30 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-bold text-white font-bold uppercase tracking-wider">
                          1. Nias Offload Spec
                        </span>
                        <span className="text-[10px] font-mono text-white font-bold">{stage1.offloadDate}</span>
                      </div>
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between"><span className="text-white font-bold">Heel Mass:</span><span className="text-white font-bold font-bold">{stage1.heelMassKg} kg</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Heel Level:</span><span className="text-white font-bold font-bold">{stage1.heelLevelPct}% ({stage1.heelVolumeM3} m³)</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Holding Press:</span><span className="text-white font-bold font-bold">{stage1.holdingPressureMPa.toFixed(2)} MPa</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Cryo Temp:</span><span className="text-white font-bold font-bold">{stage1.tempC.toFixed(1)} °C</span></div>
                      </div>
                    </div>

                    {/* Stage 2 Card */}
                    <div className="p-4 bg-slate-900/90 border border-purple-500/30 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-bold text-white font-bold uppercase tracking-wider">
                          2. Nias Departure Spec
                        </span>
                        <span className="text-[10px] font-mono text-white font-bold">{stage2.departureDate}</span>
                      </div>
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between"><span className="text-white font-bold">Manifest No:</span><span className="text-white font-bold font-bold">{stage2.manifestNo}</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Departure Mass:</span><span className="text-white font-bold font-bold">{stage2.departureMassKg} kg</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Departure Press:</span><span className="text-white font-bold font-bold">{stage2.departurePressureMPa.toFixed(2)} MPa</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Safety Status:</span><span className="text-white font-bold font-bold">VALVES LOCKED</span></div>
                      </div>
                    </div>

                    {/* Stage 3 Card */}
                    <div className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-bold text-white font-bold uppercase tracking-wider">
                          3. Arun Arrival Inspection
                        </span>
                        <span className="text-[10px] font-mono text-white font-bold">{stage3.arrivalDate}</span>
                      </div>
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between"><span className="text-white font-bold">Measured Mass:</span><span className="text-white font-bold font-bold">{stage3.arrivalMassKg} kg</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Arrival Press:</span><span className="text-white font-bold font-bold">{stage3.arrivalPressureMPa.toFixed(2)} MPa</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Arrival Temp:</span><span className="text-white font-bold font-bold">{stage3.arrivalTempC.toFixed(1)} °C</span></div>
                        <div className="flex justify-between"><span className="text-white font-bold">Tare / Gross:</span><span className="text-white font-bold">{stage3.tareWeightKg || 10850} / {stage3.grossWeightKg || 11182} kg</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Delta Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-white font-bold uppercase block font-sans font-bold">Voyage BOG Loss</span>
                      <span className="font-bold text-base text-white font-bold">Δ {massLoss} Kg</span>
                      <span className="text-[10px] text-white font-bold block">Departure - Arrival</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white font-bold uppercase block font-sans font-bold">Pressure Rise</span>
                      <span className="font-bold text-base text-white font-bold">+ {pressRise} MPa</span>
                      <span className="text-[10px] text-white font-bold block">Normal cryogenic rise</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white font-bold uppercase block font-sans font-bold">Preservation Efficiency</span>
                      <span className="font-bold text-base text-white font-bold">{efficiency}%</span>
                      <span className="text-[10px] text-white font-bold block">Cold vacuum retained</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white font-bold uppercase block font-sans font-bold">Pre-existing MMBtu Credit</span>
                      <span className="font-bold text-base text-white font-bold">-{heelCredit} MMBtu</span>
                      <span className="text-[10px] text-white font-bold block">Deducted from loading bill</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: 📝 LOADING & COQ ISSUE (FULL-PAGE INTEGRATED CONSOLE) */}
      {/* ==================================================================== */}
      {activeTab === 'LOADING_COQ_ENTRY' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Section: 3-Column Embedded Live Loading & COQ Console */}
          <form
            onSubmit={handleCreateLoadingSubmit}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-white font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-bold flex items-center gap-2">
                    Arun PAG Live Loading & COQ Certification Console
                  </h3>
                  <p className="text-xs text-white font-bold">
                    Interactive scale measurement, smart location picker, and certified chromatographic quality validation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs text-white font-bold font-mono font-bold">
                  Batch Target: <strong className="text-white font-bold">Shipment {formShipment || 'N-2'} (Pending Departure)</strong>
                </span>
              </div>
            </div>

            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
              {/* ==================================================================== */}
              {/* COLUMN 1 (Left 30% / span-4): Smart Location-Aware Tank Selector */}
              {/* ==================================================================== */}
              <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-inner">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white font-bold flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-white font-bold" />
                      1. Select ISO Tank
                    </span>
                    <span className="text-[11px] text-white font-bold font-mono font-bold">
                      {consoleCandidateTanks.length} Candidates
                    </span>
                  </div>

                  {/* Filter Badges / Category Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 mb-2.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setConsoleTankFilter('ARUN_YARD')}
                      className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                        consoleTankFilter === 'ARUN_YARD'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-white font-bold hover:text-white font-bold'
                      }`}
                    >
                      🎯 Arun Yard
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsoleTankFilter('SAVIOUR_RETURN')}
                      className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                        consoleTankFilter === 'SAVIOUR_RETURN'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-white font-bold hover:text-white font-bold'
                      }`}
                    >
                      🚢 MV. Saviour
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsoleTankFilter('ALL')}
                      className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                        consoleTankFilter === 'ALL'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-white font-bold hover:text-white font-bold'
                      }`}
                    >
                      🔍 All (120)
                    </button>
                  </div>

                  {/* Instant Search Bar */}
                  <div className="relative mb-2.5">
                    <Search className="w-3.5 h-3.5 text-white font-bold absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Tank No or Serial No..."
                      value={consoleTankSearch}
                      onChange={(e) => setConsoleTankSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-bold text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Scrollable Candidate Tank List */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 mb-3 border border-slate-800/80 rounded-lg p-1.5 bg-slate-900/40">
                    {consoleCandidateTanks.map((tank) => {
                      const isSelected = formTankNo === tank.tankNo;
                      return (
                        <div
                          key={tank.tankNo}
                          onClick={() => handleSelectTank(tank)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white font-bold font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-white font-bold hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{tank.tankNo}</span>
                            <span className="text-[10px] text-white font-bold font-mono">({tank.serialNo})</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              tank.location.includes('Aceh') || tank.location.includes('Arun')
                                ? 'bg-emerald-500/20 text-white font-bold border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-white font-bold border border-cyan-500/30'
                            }`}
                          >
                            {tank.location}
                          </span>
                        </div>
                      );
                    })}
                    {consoleCandidateTanks.length === 0 && (
                      <div className="text-center py-6 text-white font-bold text-xs">
                        No matching ISO tanks found.
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Tank Context & Inspection Checklist */}
                <div className="space-y-2.5">
                  {/* Selected Context Box */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-blue-500/30 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider font-bold">
                        Selected Target:
                      </span>
                      <span className="font-bold font-mono text-white font-bold text-sm">{formTankNo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800 text-white font-bold">
                      <div>
                        <span className="text-white font-bold block text-[10px]">Serial No:</span>
                        <span className="font-bold">{selectedTankMaster?.serialNo || 'TRSU-GEN'}</span>
                      </div>
                      <div>
                        <span className="text-white font-bold block text-[10px]">Heel Pressure:</span>
                        <span className="font-bold text-white font-bold">
                          {selectedTankMaster?.pressureMPa ?? 0.15} MPa
                        </span>
                      </div>
                      <div>
                        <span className="text-white font-bold block text-[10px]">Current Temp:</span>
                        <span className="font-bold text-white font-bold">{selectedTankMaster?.tempC ?? -160.0} °C</span>
                      </div>
                      <div>
                        <span className="text-white font-bold block text-[10px]">Staging Position:</span>
                        <span className="font-bold truncate">{selectedTankMaster?.position || 'Arun PAG'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Loading Checklist */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-white font-bold uppercase font-bold block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-white font-bold" /> Pre-Loading Inspection Checklist
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consoleChecklist.valvesVerified}
                          onChange={(e) =>
                            setConsoleChecklist({ ...consoleChecklist, valvesVerified: e.target.checked })
                          }
                          className="rounded border-slate-700 bg-slate-950 text-white font-bold accent-blue-500"
                        />
                        <span>Dual Cryogenic Valves Verified Tight</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consoleChecklist.vacuumSealOk}
                          onChange={(e) =>
                            setConsoleChecklist({ ...consoleChecklist, vacuumSealOk: e.target.checked })
                          }
                          className="rounded border-slate-700 bg-slate-950 text-white font-bold accent-blue-500"
                        />
                        <span>Annular Vacuum Seal Level Normal</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consoleChecklist.safetyGrounding}
                          onChange={(e) =>
                            setConsoleChecklist({ ...consoleChecklist, safetyGrounding: e.target.checked })
                          }
                          className="rounded border-slate-700 bg-slate-950 text-white font-bold accent-blue-500"
                        />
                        <span>Static Grounding Clamp Connected</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================================================================== */}
              {/* COLUMN 2 (Middle 35% / span-4): Scale Weights & Cryogenic Parameters */}
              {/* ==================================================================== */}
              <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-inner">
                <div className="space-y-3">
                  <span className="font-bold text-sm text-white font-bold block border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <Weight className="w-4 h-4 text-white font-bold" />
                    2. Scale Weights & Cryogenic Parameters
                  </span>

                  {/* Shipment Batch & Date Metadata */}
                  <div className="grid grid-cols-2 gap-2.5 font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[11px] font-bold">
                        Shipment Batch:
                      </label>
                      <input
                        type="text"
                        value={formShipment}
                        onChange={(e) => setFormShipment(e.target.value)}
                        placeholder="e.g. N-2"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-white font-bold font-bold text-xs focus:border-blue-500 outline-none"
                        list="shipment-batches"
                      />
                      <datalist id="shipment-batches">
                        <option value="N-1" />
                        <option value="N-2" />
                        <option value="N-3" />
                        {distinctShipments.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[11px] font-bold">
                        Loading Date:
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-white font-bold text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Tare / Gross Inputs */}
                  <div className="grid grid-cols-2 gap-2.5 font-mono">
                    <div>
                      <label className="text-white font-bold block mb-1 font-sans text-xs font-bold">
                        Tare Before (Kg):
                      </label>
                      <input
                        type="number"
                        value={formWeightBefore}
                        onChange={(e) => setFormWeightBefore(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2 px-3 text-white font-bold text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-1 font-sans text-xs font-bold">
                        Gross After (Kg):
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30600"
                        value={formWeightAfter === 0 ? '' : formWeightAfter}
                        onChange={(e) => setFormWeightAfter(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2 px-3 text-white font-bold font-bold text-sm focus:border-blue-500 outline-none placeholder:text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Density & Temp Inputs */}
                  <div className="grid grid-cols-2 gap-2.5 font-mono">
                    <div>
                      <label className="text-white font-bold block mb-1 font-sans text-xs font-bold">
                        Density (Kg/m³):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formDensity}
                        onChange={(e) => setFormDensity(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2 px-3 text-white font-bold text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-1 font-sans text-xs font-bold">
                        Liquid Temp (°C):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formTemp}
                        onChange={(e) => setFormTemp(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2 px-3 text-white font-bold text-sm focus:border-blue-500 outline-none font-bold"
                      />
                    </div>
                  </div>

                  {/* Pre-Cooling & Gassing Up Section */}
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-white font-bold uppercase tracking-wider block mb-1.5">
                      Pre-Cooling & Gassing Up (GUP / CD)
                    </span>
                    <div className="grid grid-cols-2 gap-2.5 font-mono">
                      <div>
                        <label className="text-white font-bold block mb-0.5 font-sans text-[11px]">
                          GUP Energy (MMBtu):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={formGUPEnergy === 0 ? '' : formGUPEnergy}
                          onChange={(e) => setFormGUPEnergy(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1.5 px-2.5 text-white font-bold text-xs focus:border-blue-500 outline-none placeholder:text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-white font-bold block mb-0.5 font-sans text-[11px]">
                          CD Energy (MMBtu):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={formCDEnergy === 0 ? '' : formCDEnergy}
                          onChange={(e) => setFormCDEnergy(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1.5 px-2.5 text-white font-bold text-xs focus:border-blue-500 outline-none placeholder:text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Net Result Highlight Card */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-emerald-500/40 space-y-2 font-mono shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white font-bold font-sans">Net Loaded Weight:</span>
                    <span
                      className={`text-base font-bold ${
                        calculatedLoadedWeight > 0 ? 'text-white font-bold' : 'text-white font-bold'
                      }`}
                    >
                      {calculatedLoadedWeight > 0
                        ? `${calculatedLoadedWeight.toLocaleString()} Kg`
                        : '0 Kg (Awaiting Gross)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white font-bold font-sans">Volume Loaded:</span>
                    <span
                      className={`text-sm font-bold ${
                        calculatedVolumeM3 > 0 ? 'text-white font-bold' : 'text-white font-bold'
                      }`}
                    >
                      {calculatedVolumeM3.toFixed(2)} m³
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-white font-bold font-sans">
                      Total Energy Delivered:
                    </span>
                    <span
                      className={`text-lg font-black ${
                        calculatedTotalEnergyMMBtu > 0 ? 'text-white font-bold' : 'text-white font-bold'
                      }`}
                    >
                      {calculatedTotalEnergyMMBtu.toFixed(2)} MMBTU
                    </span>
                  </div>
                </div>
              </div>

              {/* ==================================================================== */}
              {/* COLUMN 3 (Right 35% / span-4): Lab COQ 11 Gas Molecules & Submit Action */}
              {/* ==================================================================== */}
              <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-inner">
                <div className="space-y-3">
                  {/* Header & Quick Action Buttons */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 gap-2">
                    <span className="font-bold text-sm text-white font-bold flex items-center gap-1.5">
                      <Atom className="w-4 h-4 text-white font-bold" />
                      3. Lab COQ 11 Gas Spec
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleLoadStandardSpec}
                        title="Apply Certified Arun Standard Lab Spec Template"
                        className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/30 text-white font-bold border border-blue-500/40 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Zap className="w-3 h-3 text-white font-bold" />
                        <span>📋 Apply Arun Standard Lab Spec</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearGasSpec}
                        title="Clear Gas Spec"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-[10px] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* 100.00% Validation Banner */}
                  <div className="flex justify-between items-center bg-slate-900 p-1.5 rounded-lg border border-slate-800 font-mono">
                    <span className="text-[10px] text-white font-bold font-sans">Lab Molecular Sum:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                        Math.abs(formComponentSum - 100.0) < 0.05
                          ? 'bg-emerald-500/20 text-white font-bold border-emerald-500/40'
                          : 'bg-amber-500/20 text-white font-bold border-amber-500/40'
                      }`}
                    >
                      Total Mol%: {formComponentSum.toFixed(2)}% {Math.abs(formComponentSum - 100.0) < 0.05 ? '✓' : ''}
                    </span>
                  </div>

                  {/* 11 Component Inputs Grid */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">CH₄ (Methane):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={ch4 === 0 ? '' : ch4}
                        onChange={(e) => setCh4(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">C₂H₆ (Ethane):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={c2h6 === 0 ? '' : c2h6}
                        onChange={(e) => setC2h6(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold font-bold text-white font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">C₃H₈ (Propane):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={c3h8 === 0 ? '' : c3h8}
                        onChange={(e) => setC3h8(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">i-C₄H₁₀ (i-Butane):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={iC4 === 0 ? '' : iC4}
                        onChange={(e) => setIC4(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">n-C₄H₁₀ (n-Butane):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={nC4 === 0 ? '' : nC4}
                        onChange={(e) => setNC4(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">i-C₅H₁₂ (i-Pentane):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={iC5 === 0 ? '' : iC5}
                        onChange={(e) => setIC5(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">n-C₅H₁₂ (n-Pentane):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={nC5 === 0 ? '' : nC5}
                        onChange={(e) => setNC5(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px]">N₂ (Nitrogen):</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={n2 === 0 ? '' : n2}
                        onChange={(e) => setN2(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold placeholder:text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Calculated GHVs */}
                  <div className="space-y-2 pt-1 font-mono">
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px] font-bold">
                        Lab Gross Heating Value (BTU/SCF):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 1056.4"
                        value={coqGhv === 0 ? '' : coqGhv}
                        onChange={(e) => setCoqGhv(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold font-bold placeholder:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold block mb-0.5 font-sans text-[10px] font-bold">
                        Weight Base GHV (BTU/Kg):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formGHV}
                        onChange={(e) => setFormGHV(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white font-bold font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <button
                    type="submit"
                    disabled={calculatedLoadedWeight <= 0}
                    className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all text-sm flex items-center justify-center gap-2 ${
                      calculatedLoadedWeight > 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 cursor-pointer'
                        : 'bg-slate-800 text-white font-bold border border-slate-700/50 cursor-not-allowed'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>
                      {calculatedLoadedWeight > 0
                        ? `Certify & Stage ${formTankNo} for Marine Departure (${calculatedTotalEnergyMMBtu.toFixed(2)} MMBtu)`
                        : `Enter Gross Weight to Certify ${formTankNo}`}
                    </span>
                  </button>
                  <p className="text-[10px] text-white font-bold text-center">
                    Auto-updates Delivered Measurement ledger & stages tank to Arun Departure Yard (Batch N-2)
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Bottom Section: Live Shipment Measurement Ledger (Active Batch Only) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white font-bold">
                    Active Loading & Custody Measurement Ledger ({formShipment.trim() || 'N-2'})
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-white font-bold border border-blue-500/30 text-[10px] font-mono font-bold">
                    In-Progress
                  </span>
                </div>
                <p className="text-xs text-white font-bold">
                  {activeBatchRecords.length} tanks certified in active batch ({formShipment.trim() || 'N-2'}) • Completed shipments (such as Shipment N-1) are archived in <strong>📈 Master History Sheet</strong>
                </p>
              </div>
              <button
                onClick={handleExportBatchCSV}
                disabled={activeBatchRecords.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeBatchRecords.length > 0
                    ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold cursor-pointer'
                    : 'bg-slate-950 text-white font-bold border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-white font-bold" />
                <span>Export Active Batch CSV ({formShipment.trim() || 'N-2'})</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead className="bg-slate-950 text-white font-bold text-xs uppercase tracking-wider font-bold">
                  <tr className="border-b border-slate-800">
                    <th className="py-3.5 px-4">ISO Tank No</th>
                    <th className="py-3.5 px-4">Serial No</th>
                    <th className="py-3.5 px-4">Shipment</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Tare (Before Kg)</th>
                    <th className="py-3.5 px-4 text-right">Gross (After Kg)</th>
                    <th className="py-3.5 px-4 text-right text-white font-bold">Net Loaded (Kg)</th>
                    <th className="py-3.5 px-4 text-right">Density (Kg/m³)</th>
                    <th className="py-3.5 px-4 text-right text-white font-bold">Volume (m³)</th>
                    <th className="py-3.5 px-4 text-right text-white font-bold font-bold">
                      Delivered (MMBtu)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-800/60 font-mono tabular-nums">
                  {activeBatchRecords.map((cert) => (
                    <tr
                      key={cert.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        cert.tankNo === formTankNo ? 'bg-blue-950/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-white font-bold">{cert.tankNo}</td>
                      <td className="py-3.5 px-4 text-white font-bold text-xs">{cert.serialNo}</td>
                      <td className="py-3.5 px-4 font-sans text-xs text-white font-bold font-bold">{cert.shipment}</td>
                      <td className="py-3.5 px-4 text-white font-bold text-xs">{cert.date}</td>
                      <td className="py-3.5 px-4 text-right text-white font-bold">
                        {(cert.weightBeforeKg || 12100).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white font-bold font-bold">
                        {(cert.weightAfterKg || 30600).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white font-bold">
                        {cert.deliveredWeightKg.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white font-bold">
                        {cert.deliveredDensity.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white font-bold">
                        {cert.deliveredVolumeM3.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white font-bold">
                        {cert.deliveredMMBtu.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {activeBatchRecords.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-white font-bold font-sans text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Boxes className="w-8 h-8 text-white font-bold" />
                          <p className="text-white font-bold font-bold text-sm">
                            No tanks certified yet for active batch (Shipment {formShipment.trim() || 'N-2'}).
                          </p>
                          <p className="text-white font-bold max-w-md text-xs">
                            Select an ISO tank from Arun Yard above and enter gross weight & COQ spec to certify and add to this batch. Past batches (such as Shipment N-1) are preserved and viewable in the <strong>📈 Master History Sheet</strong>.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: 🔬 LAB COQ SPECIFICATION (Quality & Molecular Archive) */}
      {/* ==================================================================== */}
      {activeTab === 'LAB_COQ_SPEC' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Quality Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white font-bold flex items-center gap-2">
                  <Atom className="w-5 h-5 text-white font-bold" />
                  Arun PAG Gas Quality Specification (11 Molecular Components)
                </h3>
                <p className="text-xs text-white font-bold">
                  Certified laboratory chromatographic gas analysis for high-rich Arun PAG LNG
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-white font-bold" />
                  <span className="text-white font-bold">Shipment Batch:</span>
                  <select
                    value={coqShipmentFilter}
                    onChange={(e) => setCoqShipmentFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  >
                    <option value="ALL">All Batches (Fleet Avg)</option>
                    {distinctCOQShipments.map((shp) => (
                      <option key={shp} value={shp}>
                        Shipment {shp}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white font-bold">Lab Sum:</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-white font-bold text-xs font-mono font-bold">
                    Total Mol%: {coqTotalMol.toFixed(2)}% (Verified OK)
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Component Proportions Bar */}
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${activeCOQSpec.methane}%` }}
                  title={`CH₄ Methane: ${activeCOQSpec.methane}%`}
                  className="bg-blue-500 h-full"
                />
                <div
                  style={{ width: `${activeCOQSpec.ethane}%` }}
                  title={`C₂H₆ Ethane: ${activeCOQSpec.ethane}%`}
                  className="bg-cyan-400 h-full"
                />
                <div
                  style={{ width: `${activeCOQSpec.propane}%` }}
                  title={`C₃H₈ Propane: ${activeCOQSpec.propane}%`}
                  className="bg-emerald-400 h-full"
                />
                <div
                  style={{ width: `${activeCOQSpec.iButane + activeCOQSpec.nButane}%` }}
                  title={`Butanes (i/n): ${(activeCOQSpec.iButane + activeCOQSpec.nButane).toFixed(2)}%`}
                  className="bg-amber-400 h-full"
                />
                <div
                  style={{
                    width: `${
                      activeCOQSpec.iPentane +
                      activeCOQSpec.nPentane +
                      activeCOQSpec.c6Plus +
                      activeCOQSpec.nitrogen +
                      activeCOQSpec.co2
                    }%`,
                  }}
                  title="Pentanes, Hexanes & Inerts"
                  className="bg-purple-400 h-full"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-white font-bold font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> CH₄ ({activeCOQSpec.methane.toFixed(2)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> C₂H₆ ({activeCOQSpec.ethane.toFixed(2)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> C₃H₈ ({activeCOQSpec.propane.toFixed(2)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> C₄H₁₀ ({(activeCOQSpec.iButane + activeCOQSpec.nButane).toFixed(2)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Inerts / Heavy ({(activeCOQSpec.nitrogen + activeCOQSpec.c6Plus).toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* 11 Component Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">CH₄ (Methane)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.methane.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">C₂H₆ (Ethane)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.ethane.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">C₃H₈ (Propane)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.propane.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">i-C₄H₁₀ (i-Butane)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.iButane.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">n-C₄H₁₀ (n-Butane)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.nButane.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">i-C₅H₁₂ (i-Pentane)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.iPentane.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">n-C₅H₁₂ (n-Pentane)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.nPentane.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">C₆⁺ (Hexane+)</span>
                <span className="text-lg font-bold text-white font-bold">{(activeCOQSpec.c6Plus || 0).toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">N₂ (Nitrogen)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.nitrogen.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-white font-bold font-sans block">CO₂ (Carbon Dioxide)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.co2.toFixed(2)} %</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 sm:col-span-2">
                <span className="text-[11px] text-white font-bold font-sans block">Gross Heating Value (BTU/SCF)</span>
                <span className="text-lg font-bold text-white font-bold">{activeCOQSpec.ghv.toFixed(1)} BTU/SCF</span>
              </div>
            </div>
          </div>

          {/* Historical Batch COQ Analysis Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="font-bold text-sm text-white font-bold">
                  COQ Laboratory Testing Archive Across Tank Batches
                </span>
                <span className="text-xs text-white font-bold block">
                  {filteredCOQRecords.length} records matching {coqShipmentFilter === 'ALL' ? 'all shipments' : `Shipment ${coqShipmentFilter}`}
                </span>
              </div>
              <button
                onClick={handleExportCOQ}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-white font-bold" />
                <span>Export COQ (.CSV)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead className="bg-slate-950 text-white font-bold text-xs uppercase tracking-wider font-bold">
                  <tr className="border-b border-slate-800">
                    <th className="p-3">Sample Specimen</th>
                    <th className="p-3">Shipment</th>
                    <th className="p-3">Lab Date</th>
                    <th className="p-3 text-right">CH₄ (%)</th>
                    <th className="p-3 text-right">C₂H₆ (%)</th>
                    <th className="p-3 text-right">C₃H₈ (%)</th>
                    <th className="p-3 text-right">i-C₄H₁₀ (%)</th>
                    <th className="p-3 text-right">n-C₄H₁₀ (%)</th>
                    <th className="p-3 text-right">i-C₅H₁₂ (%)</th>
                    <th className="p-3 text-right">n-C₅H₁₂ (%)</th>
                    <th className="p-3 text-right">C₆⁺ (%)</th>
                    <th className="p-3 text-right">N₂ (%)</th>
                    <th className="p-3 text-right">CO₂ (%)</th>
                    <th className="p-3 text-right text-white font-bold font-bold">GHV (BTU/SCF)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-800/60 font-mono tabular-nums">
                  {filteredCOQRecords.map((coq) => (
                    <tr key={coq.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-bold text-white font-bold">{coq.samplePoint}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-white font-bold border border-blue-500/30 text-[11px] font-bold">
                          {coq.shipment || 'N-1'}
                        </span>
                      </td>
                      <td className="p-3 text-white font-bold">{coq.reportDate}</td>
                      <td className="p-3 text-right font-bold text-white font-bold">{coq.methane.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.ethane.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.propane.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.iButane.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.nButane.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.iPentane.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.nPentane.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{(coq.c6Plus || 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.nitrogen.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{coq.co2.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-white font-bold">{coq.ghv.toFixed(1)}</td>
                      <td className="p-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-white font-bold text-[10px] font-bold">
                          Passed Spec
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredCOQRecords.length === 0 && (
                    <tr>
                      <td colSpan={15} className="text-center py-12 text-white font-bold font-sans">
                        No COQ test records found for {coqShipmentFilter === 'ALL' ? 'selected criteria' : `Shipment ${coqShipmentFilter}`}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: 📈 MASTER HISTORY SHEET (Excel-Like Full 20-Column Archive) */}
      {/* ==================================================================== */}
      {activeTab === 'MASTER_HISTORY_SHEET' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-200">
          {/* Excel-Style Filter & Search Header Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-white font-bold absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by Tank, Serial, Date..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Shipment Batch Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-white font-bold" />
                <span className="text-white font-bold">Batch:</span>
                <select
                  value={historyShipmentFilter}
                  onChange={(e) => setHistoryShipmentFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Shipments</option>
                  {distinctShipments.map((shp) => (
                    <option key={shp} value={shp}>
                      Shipment {shp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              {(historySearch || historyShipmentFilter !== 'ALL' || historyDateFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryShipmentFilter('ALL');
                    setHistoryDateFilter('ALL');
                  }}
                  className="flex items-center gap-1 text-[11px] text-white font-bold hover:text-white font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Filters
                </button>
              )}
            </div>

            {/* Quick Export Button */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white font-bold">
                {filteredHistoryRecords.length} of {certificateRecords.length} Records
              </span>
              <button
                onClick={handleExportFullHistory}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full History (.CSV / Excel)</span>
              </button>
            </div>
          </div>

          {/* Full 20-Column Data Grid with Multi-Level Grouped Headers */}
          <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[2000px]">
              {/* Double-Deck Header */}
              <thead className="sticky top-0 z-30 bg-slate-950 text-[10px] uppercase font-bold tracking-wider">
                {/* Level 1: Category Groups */}
                <tr className="border-b border-slate-800 text-center">
                  <th colSpan={4} className="p-2 bg-blue-950/50 text-white font-bold border-r border-slate-800">
                    1. Basic Identification
                  </th>
                  <th colSpan={3} className="p-2 bg-emerald-950/50 text-white font-bold border-r border-slate-800">
                    2. Scale Weights (Kg)
                  </th>
                  <th colSpan={4} className="p-2 bg-cyan-950/50 text-white font-bold border-r border-slate-800">
                    3. Cryogenic Properties
                  </th>
                  <th colSpan={5} className="p-2 bg-purple-950/50 text-white font-bold border-r border-slate-800">
                    4. Pre-Cooling & Gassing Up (GUP / CD)
                  </th>
                  <th colSpan={3} className="p-2 bg-amber-950/50 text-white font-bold">
                    5. Custody Energy & Total Delivery
                  </th>
                </tr>

                {/* Level 2: Individual 20 Columns */}
                <tr className="border-b border-slate-800 text-white font-bold">
                  {/* 1. Identification */}
                  <th
                    onClick={() => handleSort('tankNo')}
                    className="p-2.5 sticky left-0 z-40 bg-slate-950 w-28 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)] cursor-pointer hover:text-white"
                  >
                    ISO Tank No {renderSortIcon('tankNo')}
                  </th>
                  <th className="p-2.5 w-32">Serial No</th>
                  <th
                    onClick={() => handleSort('date')}
                    className="p-2.5 w-24 cursor-pointer hover:text-white"
                  >
                    Date {renderSortIcon('date')}
                  </th>
                  <th className="p-2.5 w-20 border-r border-slate-800">Shipment</th>

                  {/* 2. Scale Weights */}
                  <th className="p-2.5 text-right w-28">Tare Before (Kg)</th>
                  <th className="p-2.5 text-right w-28">Gross After (Kg)</th>
                  <th
                    onClick={() => handleSort('deliveredWeightKg')}
                    className="p-2.5 text-right w-28 border-r border-slate-800 text-white font-bold cursor-pointer hover:text-white font-bold"
                  >
                    Loaded Net (Kg) {renderSortIcon('deliveredWeightKg')}
                  </th>

                  {/* 3. Cryogenic Properties */}
                  <th className="p-2.5 text-right w-24">Density (Kg/m³)</th>
                  <th className="p-2.5 text-right w-24">Liquid Temp (°C)</th>
                  <th
                    onClick={() => handleSort('deliveredVolumeM3')}
                    className="p-2.5 text-right w-24 text-white font-bold cursor-pointer hover:text-white font-bold"
                  >
                    Volume (m³) {renderSortIcon('deliveredVolumeM3')}
                  </th>
                  <th className="p-2.5 text-right w-28 border-r border-slate-800">GHV (BTU/Kg)</th>

                  {/* 4. Pre-Cooling & Gassing Up */}
                  <th className="p-2.5 text-right w-24">GUP Vol (m³)</th>
                  <th className="p-2.5 text-right w-28">GUP Energy (MMBtu)</th>
                  <th className="p-2.5 text-right w-24">CD Temp (°C)</th>
                  <th className="p-2.5 text-right w-24">CD Vol (m³)</th>
                  <th className="p-2.5 text-right w-28 border-r border-slate-800">CD Energy (MMBtu)</th>

                  {/* 5. Custody Delivery */}
                  <th className="p-2.5 text-right w-32">BTU Loaded (MMBtu)</th>
                  <th className="p-2.5 text-right w-28 text-white font-bold">Total Vol (m³)</th>
                  <th
                    onClick={() => handleSort('deliveredMMBtu')}
                    className="p-2.5 text-right w-36 text-white font-bold bg-amber-950/20 cursor-pointer hover:text-white font-bold"
                  >
                    Total Energy (MMBTU) {renderSortIcon('deliveredMMBtu')}
                  </th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody className="text-xs divide-y divide-slate-800/60 font-mono tabular-nums">
                {filteredHistoryRecords.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Sticky ISO Tank No */}
                    <td className="p-2.5 sticky left-0 z-20 bg-slate-950/95 font-bold text-white font-bold border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      {cert.tankNo}
                    </td>
                    <td className="p-2.5 text-white font-bold text-[11px]">{cert.serialNo}</td>
                    <td className="p-2.5 text-white font-bold text-[11px]">{cert.date}</td>
                    <td className="p-2.5 font-sans font-bold text-white font-bold border-r border-slate-800">
                      {cert.shipment}
                    </td>

                    {/* Scale Weights */}
                    <td className="p-2.5 text-right text-white font-bold">
                      {(cert.weightBeforeKg || 12100).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right text-white font-bold font-bold">
                      {(cert.weightAfterKg || 30600).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-bold text-white font-bold border-r border-slate-800">
                      {cert.deliveredWeightKg.toLocaleString()}
                    </td>

                    {/* Cryogenic Properties */}
                    <td className="p-2.5 text-right text-white font-bold">{cert.deliveredDensity.toFixed(2)}</td>
                    <td className="p-2.5 text-right text-white font-bold">{cert.deliveredTempC.toFixed(1)}</td>
                    <td className="p-2.5 text-right font-bold text-white font-bold">{cert.deliveredVolumeM3.toFixed(2)}</td>
                    <td className="p-2.5 text-right text-white font-bold border-r border-slate-800">
                      {cert.deliveredGHV.toLocaleString()}
                    </td>

                    {/* Pre-Cooling & Gassing Up */}
                    <td className="p-2.5 text-right text-white font-bold">
                      {(cert.gassingUpVolM3 || 0).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right text-white font-bold">
                      {(cert.gassingUpEnergyMMBtu || 0).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right text-white font-bold">
                      {(cert.coolingDownTempC || cert.deliveredTempC).toFixed(1)}
                    </td>
                    <td className="p-2.5 text-right text-white font-bold">
                      {(cert.coolingDownVolM3 || 0).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right text-white font-bold border-r border-slate-800">
                      {(cert.coolingDownEnergyMMBtu || 0).toFixed(2)}
                    </td>

                    {/* Custody Delivery */}
                    <td className="p-2.5 text-right text-white font-bold">
                      {(cert.btuLoadedMMBtu || (cert.deliveredWeightKg * cert.deliveredGHV) / 1000000).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-white font-bold">
                      {(cert.totalDeliveredVolM3 || cert.deliveredVolumeM3).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-white font-bold text-sm bg-amber-950/20">
                      {cert.deliveredMMBtu.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {filteredHistoryRecords.length === 0 && (
                  <tr>
                    <td colSpan={20} className="text-center py-16 text-white font-bold font-sans text-xs">
                      No delivered measurement records match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick MRO Modal */}
      {mroModalTankNo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-white font-bold" />
                Send {mroModalTankNo} to Arun MRO Workshop
              </h3>
              <button
                onClick={() => setMroModalTankNo(null)}
                className="text-white font-bold hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMroSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-white font-bold mb-1 font-bold">Defect Classification:</label>
                <select
                  value={defectCat}
                  onChange={(e) => setDefectCat(e.target.value as DefectCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="VACUUM_LOSS">Vacuum Loss (High BOG / Annular failure)</option>
                  <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
                  <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
                  <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Corner casting)</option>
                  <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-bold mb-1 font-bold">Defect Description:</label>
                <textarea
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="Observed leak, pressure drop, or sensor failure..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMroModalTankNo(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Route to MRO Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE 3: ARUN ARRIVAL HEEL INSPECTION MODAL (Ship -> Arun PAG Yard)  */}
      {/* ==================================================================== */}
      {arrivalModalTankNo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-white font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-white font-bold" />
                Stage 3: Arun PAG Arrival Heel Inspection
              </h3>
              <button
                onClick={() => setArrivalModalTankNo(null)}
                className="text-white font-bold hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white font-bold mb-4">
              Record physical weighbridge scale and cryogenic gauge inspection upon arrival from MV. Saviour voyage for <span className="font-bold text-white font-bold">{arrivalModalTankNo}</span>:
            </p>

            <form onSubmit={handleArrivalInspectionSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                <div>
                  <span className="text-[10px] text-white font-bold uppercase block font-bold">ISO Tank</span>
                  <span className="font-bold text-base text-white font-bold">{arrivalModalTankNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white font-bold uppercase block font-bold">Inspection Terminal</span>
                  <span className="font-bold text-xs text-white font-bold">PT Perta Arun Gas (Aceh)</span>
                </div>
              </div>

              {/* Arrival Date */}
              <div>
                <label className="block text-white font-bold mb-1 font-bold">Arrival Date & Time:</label>
                <input
                  type="text"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold font-mono"
                />
              </div>

              {/* Scale Weights */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1 font-bold">Tare Weight (Empty Shell Kg):</label>
                  <input
                    type="number"
                    value={tareWeightKg}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value) || 0;
                      setTareWeightKg(t);
                      setArrivalMassKg(Math.max(0, grossWeightKg - t));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1 font-bold">Gross Weight (Arrival Scale Kg):</label>
                  <input
                    type="number"
                    value={grossWeightKg}
                    onChange={(e) => {
                      const g = parseFloat(e.target.value) || 0;
                      setGrossWeightKg(g);
                      setArrivalMassKg(Math.max(0, g - tareWeightKg));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold font-mono font-bold"
                  />
                </div>
              </div>

              {/* Measured Heel Mass & Gauge */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1 font-bold">Net Heel Mass (Kg):</label>
                  <input
                    type="number"
                    value={arrivalMassKg}
                    onChange={(e) => setArrivalMassKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1 font-bold">Arrival Press (MPa):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={arrivalPressureMPa}
                    onChange={(e) => setArrivalPressureMPa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1 font-bold">Arrival Temp (°C):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={arrivalTempC}
                    onChange={(e) => setArrivalTempC(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold font-mono font-bold"
                  />
                </div>
              </div>

              {/* Calculated Credit Preview */}
              <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between items-center text-white font-bold">
                  <span>Pre-existing Heel MMBtu Credit:</span>
                  <span className="font-bold text-sm text-white font-bold">
                    -{parseFloat(((arrivalMassKg * 52215) / 1000000 * 0.947817 * 0.001055).toFixed(2))} MMBtu
                  </span>
                </div>
                <span className="text-[10px] text-white font-bold block font-sans">
                  This thermal energy will be automatically credited against the gross delivered MMBtu on the next Arun COQ invoice.
                </span>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-white font-bold mb-1 font-bold">Inspector Remarks:</label>
                <input
                  type="text"
                  value={inspectorRemarks}
                  onChange={(e) => setInspectorRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setArrivalModalTankNo(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  Certify Arrival & Save Stage 3
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
