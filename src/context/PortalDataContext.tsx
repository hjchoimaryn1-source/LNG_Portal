// src/context/PortalDataContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ActiveBayState,
  BackhaulDepartureMetrics,
  DailyMasterRecord,
  DataIngestionStatus,
  DefectCategory,
  FleetTankItem,
  GasCompositionComparison,
  MaintenanceLocation,
  NodeState,
  OffloadHeelMetrics,
  SettlementLedgerEntry,
} from '../types/lng';
import { GasQualityMasterRecord } from '../types/gasQuality';
import { loadAllPortalData, parseRawCSV, transformRawToDomainData } from '../utils/csvParser';
import { exportAllTerminalLogsToExcel } from '../utils/excelExporter';
import {
  applyBayTelemetryUpdate,
  applyBatchTransitionTanks,
  applyMarkTankForMaintenance,
  applyMountTankToBay,
  applyReleaseTankFromMaintenance,
  applyTankUpdate,
  applyToggleBayRunning,
  applyUnmountBay,
  applyAuthorizeBackhaulClearance,
  calculateTankRelocation,
  processDailyInspectionEntry,
  TankRelocationParams,
  AddDepressPayload,
} from '../services/tankOperationsService';
import {
  applyConsumptionRecord,
  applyGasQualityRecord,
  createDeliveredMeasurement,
  createFlobossAndGCEntries,
  AddConsumptionPayload,
} from '../services/settlementService';
import { usePortalStorageSync } from '../hooks/usePortalStorageSync';

export type { TankRelocationParams };

export interface PortalDataContextType {
  fleetTanks: FleetTankItem[];
  dailyMasterRecords: DailyMasterRecord[];
  settlementRecords: SettlementLedgerEntry[];
  gasCompositions: GasCompositionComparison[];
  activeBays: ActiveBayState[];
  ingestionStatuses: DataIngestionStatus[];
  gasQualityRecords: GasQualityMasterRecord[];
  isLoading: boolean;
  error: string | null;
  // Actions
  saveGasQualityRecord: (record: GasQualityMasterRecord) => void;
  updateTankLog: (tankNo: string, updatedFields: Partial<FleetTankItem>) => void;
  moveTankLocation: (
    tankIdOrNo: string,
    newZone: string,
    slotNumber?: number,
    params?: TankRelocationParams
  ) => void;
  batchTransitionTanks: (tankNos: string[], targetNode: NodeState) => void;
  uploadCustomCSV: (fileKey: string, fileContent: string) => void;
  mountTankToBay: (bayId: string, tankNo: string) => void;
  unmountBay: (bayId: string) => void;
  toggleBayRunning: (bayId: string) => void;
  markTankForMaintenance: (
    tankNo: string,
    defect: DefectCategory,
    location: MaintenanceLocation,
    desc: string
  ) => void;
  releaseTankFromMaintenance: (tankNo: string, targetNode: NodeState) => void;
  recordPostRegasOffload: (bayIdOrTankNo: string, metrics: OffloadHeelMetrics) => void;
  authorizeBackhaulClearance: (tankNos: string[], metrics: BackhaulDepartureMetrics) => void;
  addDeliveredMeasurement: (
    record: Partial<SettlementLedgerEntry>,
    coq?: Partial<GasCompositionComparison>
  ) => void;
  addDailyMasterLog: (logs: Partial<FleetTankItem>[]) => void;
  saveDailyInspectionRecord: (record: DailyMasterRecord) => void;
  batchUpdateDailyMasterRecords: (records: DailyMasterRecord[]) => void;
  addConsumptionRecord: (consumption: AddConsumptionPayload) => void;
  addFlobossAndGCLog: (
    floboss: Partial<GasCompositionComparison>,
    gc: Partial<GasCompositionComparison>
  ) => void;
  addDepressurizationLog: (log: AddDepressPayload) => void;
  reloadAllData: () => Promise<void>;
  exportAllLogsToExcel: () => void;
}

const PortalDataContext = createContext<PortalDataContextType | undefined>(undefined);

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
  const {
    loadInitialGasQuality,
    mergeStoredDomainData,
    persistDailyInspections,
    persistSettlementLogs,
    persistGCLogs,
    persistGasQualityRecords,
  } = usePortalStorageSync();

  const [fleetTanks, setFleetTanks] = useState<FleetTankItem[]>([]);
  const [dailyMasterRecords, setDailyMasterRecords] = useState<DailyMasterRecord[]>([]);
  const [settlementRecords, setSettlementRecords] = useState<SettlementLedgerEntry[]>([]);
  const [gasCompositions, setGasCompositions] = useState<GasCompositionComparison[]>([]);
  const [activeBays, setActiveBays] = useState<ActiveBayState[]>([]);
  const [ingestionStatuses, setIngestionStatuses] = useState<DataIngestionStatus[]>([]);
  const [gasQualityRecords, setGasQualityRecords] = useState<GasQualityMasterRecord[]>(loadInitialGasQuality);
  const [rawFileContents, setRawFileContents] = useState<Record<string, Record<string, string>[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const saveGasQualityRecord = useCallback((newRecord: GasQualityMasterRecord) => {
    setGasQualityRecords((prev) => {
      const updated = applyGasQualityRecord(prev, newRecord);
      persistGasQualityRecords(updated);
      return updated;
    });
  }, [persistGasQualityRecords]);

  const initData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadAllPortalData();
      const merged = mergeStoredDomainData(
        data.dailyMasterRecords,
        data.settlementRecords,
        data.gasCompositions
      );

      setFleetTanks(data.fleetTanks || []);
      setDailyMasterRecords(merged.mergedMasterRecords);
      setSettlementRecords(merged.mergedSettlement);
      setGasCompositions(merged.mergedGC);
      setActiveBays(data.activeBays);
      setIngestionStatuses(data.ingestionStatuses);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown data loading error';
      setError(msg);
      console.error('Data initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mergeStoredDomainData]);

  useEffect(() => {
    initData();
  }, [initData]);

  const updateTankLog = (tankNo: string, updatedFields: Partial<FleetTankItem>) => {
    setFleetTanks((prev) => applyTankUpdate(prev, tankNo, updatedFields));
    setActiveBays((prevBays) => applyBayTelemetryUpdate(prevBays, tankNo, updatedFields));
  };

  const mountTankToBay = (bayId: string, tankNo: string) => {
    const targetTank = fleetTanks.find((t) => t.tankNo === tankNo);
    if (!targetTank) return;

    setActiveBays((prev) => applyMountTankToBay(prev, targetTank, bayId));
    updateTankLog(tankNo, {
      node: NodeState.NODE_4_REGAS_ACTIVE_BAY,
      position: `REGAS ${bayId}`,
      isMountedToBay: bayId,
    });
  };

  const unmountBay = (bayId: string) => {
    setActiveBays((prev) => {
      const { updatedBays, unmountedTankNo } = applyUnmountBay(prev, bayId);
      if (unmountedTankNo) {
        updateTankLog(unmountedTankNo, {
          node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
          position: 'Laydown 2',
          isMountedToBay: null,
        });
      }
      return updatedBays;
    });
  };

  const toggleBayRunning = (bayId: string) => {
    setActiveBays((prev) => applyToggleBayRunning(prev, bayId));
  };

  const moveTankLocation = (
    tankIdOrNo: string,
    newZone: string,
    slotNumber?: number,
    params?: TankRelocationParams
  ) => {
    const relocation = calculateTankRelocation(
      fleetTanks,
      activeBays,
      tankIdOrNo,
      newZone,
      slotNumber,
      params
    );
    if (!relocation) return;

    if (relocation.mountToBayId) {
      mountTankToBay(relocation.mountToBayId, relocation.targetTankNo);
      return;
    }

    if (relocation.disconnectBayId) {
      setActiveBays((prev) => applyUnmountBay(prev, relocation.disconnectBayId!).updatedBays);
    }

    if (relocation.tankUpdatePayload) {
      updateTankLog(relocation.targetTankNo, relocation.tankUpdatePayload);
    }
  };

  const batchTransitionTanks = (tankNos: string[], targetNode: NodeState) => {
    setFleetTanks((prev) => applyBatchTransitionTanks(prev, tankNos, targetNode));
  };

  const markTankForMaintenance = (
    tankNo: string,
    defect: DefectCategory,
    location: MaintenanceLocation,
    desc: string
  ) => {
    const { updatedTanks, updatedBays } = applyMarkTankForMaintenance(
      fleetTanks,
      activeBays,
      tankNo,
      defect,
      location,
      desc
    );
    setActiveBays(updatedBays);
    setFleetTanks(updatedTanks);
  };

  const releaseTankFromMaintenance = (tankNo: string, targetNode: NodeState) => {
    setFleetTanks((prev) => applyReleaseTankFromMaintenance(prev, tankNo, targetNode));
  };

  const recordPostRegasOffload = (bayIdOrTankNo: string, metrics: OffloadHeelMetrics) => {
    const bay = activeBays.find((b) => b.bayId === bayIdOrTankNo);
    const targetTankNo = bay ? bay.tankNo : bayIdOrTankNo;
    if (!targetTankNo) return;

    updateTankLog(targetTankNo, {
      node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
      location: 'ORU NIAS',
      position: 'Laydown 2',
      level: metrics.heelLevelPct,
      levelM3: metrics.heelVolumeM3,
      levelMmH2O: metrics.heelMmH2O,
      pressureMPa: metrics.holdingPressureMPa,
      tempC: metrics.tempC,
      isMountedToBay: null,
      offloadHeelMetrics: metrics,
      remarks:
        metrics.remarks ||
        `Post-regas offload completed: ${metrics.heelLevelPct}% heel (${metrics.heelMassKg} kg, ${metrics.holdingPressureMPa} MPa) in Laydown Yard 2`,
    });

    if (bay) {
      setActiveBays((prev) => applyUnmountBay(prev, bay.bayId).updatedBays);
    }
  };

  const authorizeBackhaulClearance = (tankNos: string[], metrics: BackhaulDepartureMetrics) => {
    setFleetTanks((prev) => applyAuthorizeBackhaulClearance(prev, tankNos, metrics));
  };

  const addDeliveredMeasurement = (
    record: Partial<SettlementLedgerEntry>,
    coq?: Partial<GasCompositionComparison>
  ) => {
    const { newEntry, newCOQ, tankUpdate } = createDeliveredMeasurement(record, coq);
    setSettlementRecords((prev) => [newEntry, ...prev]);
    if (newCOQ) {
      setGasCompositions((prev) => [newCOQ, ...prev]);
    }
    updateTankLog(tankUpdate.tankNo, tankUpdate.fields);
  };

  const addDailyMasterLog = (logs: Partial<FleetTankItem>[]) => {
    logs.forEach((log) => {
      if (log.tankNo) {
        updateTankLog(log.tankNo, log);
      }
    });
  };

  const addDepressurizationLog = (payload: AddDepressPayload) => {
    updateTankLog(payload.tankNo, {
      pressBeforeMPa: payload.pressBeforeMPa,
      pressAfterMPa: payload.pressAfterMPa,
      pressureMPa: payload.pressAfterMPa,
      depress: 'Depressurized',
      remarks: payload.remarks || `BOG vented: ${payload.lossesKg} kg (${payload.lossesPercent}%)`,
    });
  };

  const saveDailyInspectionRecord = (record: DailyMasterRecord) => {
    const { nextRecords, tankUpdates, depressPayload } = processDailyInspectionEntry(
      record,
      dailyMasterRecords
    );
    setDailyMasterRecords(nextRecords);
    persistDailyInspections(nextRecords);
    updateTankLog(record.tankNo, tankUpdates);
    if (depressPayload) {
      addDepressurizationLog(depressPayload);
    }
  };

  const batchUpdateDailyMasterRecords = (records: DailyMasterRecord[]) => {
    records.forEach((r) => saveDailyInspectionRecord(r));
  };

  const addConsumptionRecord = (consumption: AddConsumptionPayload) => {
    setSettlementRecords((prev) => {
      const result = applyConsumptionRecord(prev, fleetTanks, consumption);
      persistSettlementLogs(result.updatedSettlement);

      if (result.unmountBayId) {
        unmountBay(result.unmountBayId);
      } else if (result.tankUpdate) {
        updateTankLog(result.tankUpdate.tankNo, result.tankUpdate.fields);
      }

      return result.updatedSettlement;
    });
  };

  const addFlobossAndGCLog = (
    floboss: Partial<GasCompositionComparison>,
    gc: Partial<GasCompositionComparison>
  ) => {
    const entries = createFlobossAndGCEntries(floboss, gc);
    setGasCompositions((prev) => {
      const next = [...entries, ...prev];
      persistGCLogs(next);
      return next;
    });
  };

  const uploadCustomCSV = (fileKey: string, fileContent: string) => {
    try {
      const parsed = parseRawCSV(fileContent);
      const updatedMap = {
        ...rawFileContents,
        [fileKey]: parsed,
      };
      setRawFileContents(updatedMap);

      const updatedStatuses = ingestionStatuses.map((s) => {
        if (s.fileKey === fileKey) {
          return {
            ...s,
            rowCount: parsed.length,
            lastLoaded: new Date().toLocaleTimeString(),
            status: 'LOADED' as const,
            sizeBytes: fileContent.length,
          };
        }
        return s;
      });
      setIngestionStatuses(updatedStatuses);

      const domainData = transformRawToDomainData(updatedMap, updatedStatuses);
      if (domainData.fleetTanks.length > 0) setFleetTanks(domainData.fleetTanks);
      if (domainData.settlementRecords.length > 0) setSettlementRecords(domainData.settlementRecords);
      if (domainData.gasCompositions.length > 0) setGasCompositions(domainData.gasCompositions);
    } catch (e) {
      console.error('Custom CSV parsing failed:', e);
      setIngestionStatuses((prev) =>
        prev.map((s) => (s.fileKey === fileKey ? { ...s, status: 'ERROR' } : s))
      );
    }
  };

  const exportAllLogsToExcel = useCallback(() => {
    exportAllTerminalLogsToExcel({
      inspectionLogs: dailyMasterRecords as unknown as Record<string, unknown>[],
      flobossLogs: gasCompositions.filter((g) => g.id.startsWith('FLO') || g.id.startsWith('FB')) as unknown as Record<string, unknown>[],
      gcLogs: gasCompositions.filter((g) => g.id.startsWith('GC') || g.id.startsWith('COQ')) as unknown as Record<string, unknown>[],
      settlementLogs: settlementRecords as unknown as Record<string, unknown>[],
      operatorName: 'Nias Field Terminal Operations (STATION 01)',
    });
  }, [dailyMasterRecords, gasCompositions, settlementRecords]);

  return (
    <PortalDataContext.Provider
      value={{
        fleetTanks,
        dailyMasterRecords,
        settlementRecords,
        gasCompositions,
        activeBays,
        ingestionStatuses,
        gasQualityRecords,
        isLoading,
        error,
        saveGasQualityRecord,
        updateTankLog,
        moveTankLocation,
        batchTransitionTanks,
        uploadCustomCSV,
        mountTankToBay,
        unmountBay,
        toggleBayRunning,
        markTankForMaintenance,
        releaseTankFromMaintenance,
        recordPostRegasOffload,
        authorizeBackhaulClearance,
        addDeliveredMeasurement,
        addDailyMasterLog,
        saveDailyInspectionRecord,
        batchUpdateDailyMasterRecords,
        addConsumptionRecord,
        addFlobossAndGCLog,
        addDepressurizationLog,
        reloadAllData: initData,
        exportAllLogsToExcel,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  );
}

export function usePortalData() {
  const ctx = useContext(PortalDataContext);
  if (!ctx) {
    throw new Error('usePortalData must be used within a PortalDataProvider');
  }
  return ctx;
}
