// src/hooks/useArunLogistics.ts
"use client";

import { useState, useMemo, useCallback } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { NodeState } from '../types/lng';
import { ArunSubTab } from '../components/HeaderNavigation';
import { FleetTankItem } from '../data/mockTankData';
import { computeTab1ReactiveKPIs, sortTanksNaturally } from '../utils/scadaCalculations';

export function useArunLogistics(initialSubTab: ArunSubTab = 'OPERATIONS_YARD') {
  const portalData = usePortalData() || {};
  const fleetTanks: FleetTankItem[] = sortTanksNaturally(portalData.fleetTanks || []);
  const batchTransitionTanks = portalData.batchTransitionTanks || (() => {});
  const certificateRecords = portalData.certificateRecords || [];
  // Active Batch Certified Records
  const [activeBatchRecords, setActiveBatchRecords] = useState<any[]>([]);

  const addDeliveredMeasurement = useCallback((record: any, coq?: any) => {
    setActiveBatchRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.tankNo === record.tankNo);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...record,
          ...coq,
          status: 'CERTIFIED / STAGED',
          timestamp: new Date().toISOString(),
        };
        return updated;
      }
      return [
        {
          ...record,
          ...coq,
          status: 'CERTIFIED / STAGED',
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  // Tab & View Modes
  const [activeTab, setActiveTab] = useState<ArunSubTab>(initialSubTab);
  const [logisticsMode, setLogisticsMode] = useState<'STAGED_ARUN' | 'SAVIOUR_CANDIDATES'>('STAGED_ARUN');

  // Search & Filter States
  const [yardSearch, setYardSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyShipmentFilter, setHistoryShipmentFilter] = useState('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState('ALL');
  const [sortField, setSortField] = useState<
    'tankNo' | 'date' | 'deliveredWeightKg' | 'deliveredVolumeM3' | 'deliveredMMBtu'
  >('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Selection Sets
  const [selectedYardTanks, setSelectedYardTanks] = useState<Set<string>>(new Set());
  const [selectedSaviourTanks, setSelectedSaviourTanks] = useState<Set<string>>(new Set());

  // Modals & Feedback
  const [selectedHeelAuditTankNo, setSelectedHeelAuditTankNo] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Staged for Loading Queue & Active Candidate Selection
  const [stagedForLoadingTankNos, setStagedForLoadingTankNos] = useState<Set<string>>(new Set());
  const [activeCandidateTankNo, setActiveCandidateTankNo] = useState<string | null>(null);

  // Filtered Tanks by Node with Fallbacks (Strict Natural Sort)
  const saviourCandidateTanks = useMemo<FleetTankItem[]>(() => {
    if (!Array.isArray(fleetTanks)) return [];
    const list = fleetTanks.filter(
      (t) =>
        t.node === NodeState.NODE_2_M_V_SAVIOUR ||
        (t.location && t.location.includes('Saviour')) ||
        (t.position && t.position.includes('M/V Saviour'))
    );
    return sortTanksNaturally(list);
  }, [fleetTanks]);

  const arunYardTanks = useMemo<FleetTankItem[]>(() => {
    if (!Array.isArray(fleetTanks)) return [];
    const list = fleetTanks.filter((t) => {
      const isArun =
        t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL ||
        (t.location && t.location.includes('Arun')) ||
        (t.position && t.position.includes('Arun'));

      const isStagedOrCertified =
        stagedForLoadingTankNos.has(t.tankNo) ||
        activeBatchRecords.some((r) => r.tankNo === t.tankNo) ||
        t.position === 'ARUN_STAGED_FOR_DEPARTURE';

      return isArun && !isStagedOrCertified;
    });
    return sortTanksNaturally(list);
  }, [fleetTanks, stagedForLoadingTankNos, activeBatchRecords]);

  // Quick Filtered Tank Lists (Strict Natural Sort)
  const filteredYardTanks = useMemo<FleetTankItem[]>(() => {
    if (!Array.isArray(arunYardTanks)) return [];
    const list = arunYardTanks.filter((t) => {
      const q = yardSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        (t.tankNo && t.tankNo.toLowerCase().includes(q)) ||
        (t.serialNo && t.serialNo.toLowerCase().includes(q))
      );
    });
    return sortTanksNaturally(list);
  }, [arunYardTanks, yardSearch]);

  const filteredSaviourTanks = useMemo<FleetTankItem[]>(() => {
    if (!Array.isArray(saviourCandidateTanks)) return [];
    const list = saviourCandidateTanks.filter((t) => {
      const q = yardSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        (t.tankNo && t.tankNo.toLowerCase().includes(q)) ||
        (t.serialNo && t.serialNo.toLowerCase().includes(q))
      );
    });
    return sortTanksNaturally(list);
  }, [saviourCandidateTanks, yardSearch]);

  // Selection Handlers
  const toggleSelectYardTank = useCallback((tankNo: string) => {
    setSelectedYardTanks((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) {
        next.delete(tankNo);
      } else {
        next.add(tankNo);
      }
      return next;
    });
  }, []);

  const toggleSelectSaviourTank = useCallback((tankNo: string) => {
    setSelectedSaviourTanks((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) {
        next.delete(tankNo);
      } else {
        next.add(tankNo);
      }
      return next;
    });
  }, []);

  const selectAllYard = useCallback(() => {
    if (selectedYardTanks.size === filteredYardTanks.length && filteredYardTanks.length > 0) {
      setSelectedYardTanks(new Set());
    } else {
      setSelectedYardTanks(new Set(filteredYardTanks.map((t) => t.tankNo)));
    }
  }, [selectedYardTanks.size, filteredYardTanks]);

  const selectAllSaviour = useCallback(() => {
    if (selectedSaviourTanks.size === filteredSaviourTanks.length && filteredSaviourTanks.length > 0) {
      setSelectedSaviourTanks(new Set());
    } else {
      setSelectedSaviourTanks(new Set(filteredSaviourTanks.map((t) => t.tankNo)));
    }
  }, [selectedSaviourTanks.size, filteredSaviourTanks]);

  // Logistics Actions
  const handleDischargeToArunYard = useCallback(() => {
    if (selectedSaviourTanks.size === 0) return;
    const targetTanks = Array.from(selectedSaviourTanks);
    batchTransitionTanks(targetTanks, NodeState.NODE_1_ARUN_PAG_TERMINAL);
    triggerToast(`Discharged ${targetTanks.length} empty tanks from M/V Saviour to PAGT Yard.`);
    setSelectedSaviourTanks(new Set());
    // Auto-switch view to PAGT Yard to display discharged tanks
    setLogisticsMode('STAGED_ARUN');
  }, [selectedSaviourTanks, batchTransitionTanks, triggerToast]);

  const handleProceedToLoad = useCallback(() => {
    if (selectedYardTanks.size === 0) return;
    const selectedArray = Array.from(selectedYardTanks);

    setStagedForLoadingTankNos((prev) => {
      const next = new Set(prev);
      selectedArray.forEach((t) => next.add(t));
      return next;
    });

    if (selectedArray.length > 0) {
      setActiveCandidateTankNo(selectedArray[0]);
    }

    triggerToast(`Staged ${selectedArray.length} ISO tanks for Batch Loading in Console.`);
    setSelectedYardTanks(new Set());
    setActiveTab('LOADING_COQ_ENTRY');
  }, [selectedYardTanks, triggerToast]);

  // Reactive KPI Calculations for Tab 1
  const tab1ReactiveKPIs = useMemo(() => {
    const isYard = logisticsMode === 'STAGED_ARUN';
    const activeTanks = isYard ? filteredYardTanks : filteredSaviourTanks;
    const totalCount = isYard ? (arunYardTanks?.length || 0) : (saviourCandidateTanks?.length || 0);
    const selectedCount = isYard ? (selectedYardTanks?.size || 0) : (selectedSaviourTanks?.size || 0);
    const selectedTankSet = isYard ? selectedYardTanks : selectedSaviourTanks;

    const evaluatedTanks =
      selectedCount > 0
        ? (activeTanks || []).filter((t) => selectedTankSet.has(t.tankNo))
        : (activeTanks || []);

    return computeTab1ReactiveKPIs(
      evaluatedTanks,
      totalCount,
      selectedCount,
      activeBatchRecords || []
    );
  }, [
    logisticsMode,
    filteredYardTanks,
    filteredSaviourTanks,
    arunYardTanks,
    saviourCandidateTanks,
    selectedYardTanks,
    selectedSaviourTanks,
    activeBatchRecords,
  ]);

  return {
    // Portal Data & Arrays with explicit fallback defaults
    fleetTanks: fleetTanks || [],
    certificateRecords: certificateRecords || [],
    activeBatchRecords: activeBatchRecords || [],
    activeBatch: activeBatchRecords || [],
    // Aliases
    selectedTankIds: Array.from(selectedYardTanks) || [],
    filteredTanks: filteredYardTanks || [],
    mvSaviourTanks: saviourCandidateTanks || [],
    pagtTanks: arunYardTanks || [],
    // Tabs & Modes
    activeTab,
    setActiveTab,
    logisticsMode,
    setLogisticsMode,
    // Search & Filters
    yardSearch,
    setYardSearch,
    historySearch,
    setHistorySearch,
    historyShipmentFilter,
    setHistoryShipmentFilter,
    historyDateFilter,
    setHistoryDateFilter,
    sortField,
    setSortField,
    sortAsc,
    setSortAsc,
    // Tank Collections
    saviourCandidateTanks: saviourCandidateTanks || [],
    arunYardTanks: arunYardTanks || [],
    filteredYardTanks: filteredYardTanks || [],
    filteredSaviourTanks: filteredSaviourTanks || [],
    // Selection Sets & Handlers
    selectedYardTanks: selectedYardTanks || new Set(),
    selectedSaviourTanks: selectedSaviourTanks || new Set(),
    toggleSelectYardTank,
    toggleSelectSaviourTank,
    selectAllYard,
    selectAllSaviour,
    // Actions
    handleDischargeToArunYard,
    handleProceedToLoad,
    addDeliveredMeasurement,
    setActiveBatchRecords,
    // Staged Loading Queue
    stagedForLoadingTankNos,
    activeCandidateTankNo,
    setActiveCandidateTankNo,
    // Modal & Toast
    selectedHeelAuditTankNo,
    setSelectedHeelAuditTankNo,
    toastMessage,
    triggerToast,
    // KPIs
    tab1ReactiveKPIs,
  };
}
