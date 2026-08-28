// src/hooks/useArunLogistics.ts
"use client";

import { useState, useMemo, useCallback } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { NodeState } from '../types/lng';
import { ArunSubTab } from '../components/HeaderNavigation';
import { FleetTankItem, getTankPhysicalMetrics } from '../data/mockTankData';
import { computeTab1ReactiveKPIs, sortTanksNaturally } from '../utils/scadaCalculations';

export function useArunLogistics(initialSubTab: ArunSubTab = 'OPERATIONS_YARD') {
  const portalData = usePortalData() || {};
  const fleetTanks: FleetTankItem[] = sortTanksNaturally(portalData.fleetTanks || []);
  const batchTransitionTanks = portalData.batchTransitionTanks || (() => {});
  const certificateRecords = (portalData as any).certificateRecords || portalData.settlementRecords || [];
  // Active Batch Certified Records (Tab 2)
  const [activeBatchRecords, setActiveBatchRecords] = useState<any[]>([]);
  // Tab 3 Vessel Deck Loading Manifest Records (Tab 3)
  const [tab3LoadingRecords, setTab3LoadingRecords] = useState<any[]>([]);

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
        t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT ||
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
        tab3LoadingRecords.some((r) => r.tankNo === t.tankNo) ||
        t.position === 'ARUN_STAGED_FOR_DEPARTURE';

      return isArun && !isStagedOrCertified;
    });
    return sortTanksNaturally(list);
  }, [fleetTanks, stagedForLoadingTankNos, activeBatchRecords, tab3LoadingRecords]);

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

  const handleProceedToLoad = useCallback(
    (tankStatusMap?: Record<string, string>) => {
      if (selectedYardTanks.size === 0) return;
      const selectedArray = Array.from(selectedYardTanks);
      const readyTankNos = selectedArray.filter((tankNo) => (tankStatusMap?.[tankNo] || 'READY') === 'READY');
      const repairTankNos = selectedArray.filter((tankNo) => tankStatusMap?.[tankNo] === 'REPAIR');

      const hasReady = readyTankNos.length > 0;
      const hasRepair = repairTankNos.length > 0;

      // 1. Ready 탱크들: Tab 2 (Custody & COQ) 충전/인증 대기열(stagedForLoadingTanks)로 등록
      if (hasReady) {
        setStagedForLoadingTankNos((prev) => {
          const next = new Set(prev);
          readyTankNos.forEach((t) => next.add(t));
          return next;
        });
        setActiveCandidateTankNo(readyTankNos[0]);
      }

      // 2. Repair 탱크들: Tab 2를 건너뛰고 Tab 3 (Loading) 선적 목록에 직접 주입
      // (Gross = PreLoadTare, Net Mass = 0 kg, Energy = 0.00 MMBtu, Status = Repair)
      if (hasRepair) {
        const repairRecords = repairTankNos.map((tankNo) => {
          const tank = fleetTanks.find((item) => item.tankNo === tankNo);
          const metrics = getTankPhysicalMetrics(tankNo, tank?.serialNo || '');
          const dryTare = tank?.arrivalHeelMetrics?.tareWeightKg || metrics.dryTareKg;
          const heelMass = tank?.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
          const preLoadTare = dryTare + heelMass;

          return {
            tankNo,
            serialNo: tank?.serialNo || 'N/A',
            cargoNo: tank?.cargoNo || `REPAIR-${tankNo}`,
            tareKg: preLoadTare,
            grossKg: preLoadTare, // Gross = PreLoadTare
            netMassKg: 0,        // Net Mass = 0 kg
            deliveredWeightKg: 0,
            deliveredVolumeM3: 0,
            netVolM3: 0,
            deliveredMmbtu: 0,  // Energy = 0.00 MMBtu
            deliveredMMBtu: 0,
            energyMMBtu: 0,
            densityKgM3: 0,
            liquidTempC: tank?.tempC || metrics.tempC || 0,
            pressureMPa: tank?.pressureMPa || metrics.pressureMPa || 0,
            status: 'Repair',   // Status = Repair
            repairStatus: 'EMPTY / REPAIR',
            source: 'DIRECT_REPAIR_ROUTE',
            batchId: 'Batch N-2',
            shipment: 'N-2',
            ghvBtuScf: 0,
            deliveredGHV: 0,
          };
        });

        setTab3LoadingRecords((prev) => {
          const merged = [...prev];
          repairRecords.forEach((record) => {
            const existingIndex = merged.findIndex((item) => item.tankNo === record.tankNo);
            if (existingIndex >= 0) {
              merged[existingIndex] = { ...merged[existingIndex], ...record };
            } else {
              merged.push(record);
            }
          });
          return merged;
        });
      }

      // 3. 전송 후: Tab 1 야드 목록에서 전송된 탱크 제거 / 선택 해제
      setSelectedYardTanks(new Set());

      // 4. 라우팅 & Toast 알림 로직
      if (hasReady && hasRepair) {
        // 둘 다 섞여 있을 경우 알림 토스트 표시 후 기본 Tab 2로 이동
        triggerToast(
          `Transferred ${readyTankNos.length} Ready tank(s) to Tab 2 (Custody & COQ) & ${repairTankNos.length} Repair tank(s) to Tab 3 (Loading).`
        );
        setActiveTab('CUSTODY_COQ');
      } else if (hasReady) {
        // Ready 탱크가 포함되어 있다면 Tab 2 (Custody & COQ)로 화면 이동
        triggerToast(`Staged ${readyTankNos.length} Ready ISO tank(s) for Custody & COQ.`);
        setActiveTab('CUSTODY_COQ');
      } else if (hasRepair) {
        // Repair 탱크만 있다면 Tab 3 (Loading)으로 화면 이동
        triggerToast(`Injected ${repairTankNos.length} Repair ISO tank(s) directly to Loading (Tab 3).`);
        setActiveTab('VESSEL_LOADING');
      }
    },
    [selectedYardTanks, fleetTanks, triggerToast, setActiveTab]
  );

  // Tab 2 -> Tab 3 Selective FIFO Pipeline Transfer & Tab 2 Ledger Cleanup
  const handleTransferTab2ToTab3 = useCallback(
    (recordsToTransfer?: any[]) => {
      const targets = Array.isArray(recordsToTransfer) && recordsToTransfer.length > 0
        ? recordsToTransfer
        : activeBatchRecords;

      if (!targets || targets.length === 0) return;

      const transferredTankNos = new Set(targets.map((r) => r.tankNo));

      // 1. Append selected tanks to Tab 3 manifest queue
      setTab3LoadingRecords((prev) => {
        const merged = [...prev];
        targets.forEach((record) => {
          const existingIndex = merged.findIndex((item) => item.tankNo === record.tankNo);
          if (existingIndex >= 0) {
            merged[existingIndex] = { ...merged[existingIndex], ...record };
          } else {
            merged.push(record);
          }
        });
        return merged;
      });

      // 2. Remove ONLY transferred tanks from Tab 2 activeBatchRecords (unselected tanks remain in Tab 2)
      setActiveBatchRecords((prev) => prev.filter((r) => !transferredTankNos.has(r.tankNo)));

      // 3. Clear transferred tanks from Tab 2 candidate queue (stagedForLoadingTankNos)
      setStagedForLoadingTankNos((prev) => {
        const next = new Set(prev);
        transferredTankNos.forEach((tankNo) => next.delete(tankNo));
        return next;
      });

      setActiveCandidateTankNo(null);

      // 4. Toast notification & switch to Tab 3
      triggerToast(
        `Transferred ${targets.length} selected tank(s) to Tab 3 (Loading).`
      );
      setActiveTab('VESSEL_LOADING');
    },
    [activeBatchRecords, triggerToast, setActiveTab]
  );

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
    handleSend: handleProceedToLoad,
    handleTransferTab2ToTab3,
    addDeliveredMeasurement,
    setActiveBatchRecords,
    tab3LoadingRecords,
    setTab3LoadingRecords,
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
