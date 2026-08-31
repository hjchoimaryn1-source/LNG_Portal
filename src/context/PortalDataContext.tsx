// src/context/PortalDataContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ActiveBayState,
  ArrivalHeelMetrics,
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
  VoyageHeelLoss,
} from '../types/lng';
import { GasQualityMasterRecord } from '../types/gasQuality';
import { INITIAL_GAS_QUALITY_MASTER_RECORDS } from '../data/gasQualityMasterData';
import {
  loadAllPortalData,
  parseRawCSV,
  transformRawToDomainData,
} from '../utils/csvParser';
import { exportAllTerminalLogsToExcel } from '../utils/excelExporter';

// LocalStorage Persistence Keys
export const STORAGE_KEYS = {
  FIELD_INSPECTION_LOGS: 'nias_field_inspection_logs',
  DAILY_FLOBOSS_LOGS: 'nias_daily_floboss_logs',
  GC_COMPOSITION_LOGS: 'nias_gc_composition_logs',
  PLN_REGAS_CONSUMPTION_LOGS: 'nias_pln_regas_consumption_logs',
  FLEET_TANKS_STATE: 'nias_fleet_tanks_state',
  SETTLEMENT_RECORDS: 'nias_settlement_records',
  GAS_QUALITY_MASTER_RECORDS: 'nias_gas_quality_master_records',
};

// Safe LocalStorage Getter
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`[LocalStorage] Failed to load ${key}:`, e);
    return fallback;
  }
}

// Safe LocalStorage Setter
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[LocalStorage] Failed to save ${key}:`, e);
  }
}

// Data Validation Helper
export function validateInspectionRecord(record: Partial<DailyMasterRecord>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (record.level !== undefined && (record.level < 0 || record.level > 100)) {
    errors.push('Level must be between 0% and 100%');
  }
  if (record.pressureMPa !== undefined && record.pressureMPa < 0) {
    errors.push('Pressure must be >= 0 MPa');
  }
  if (record.tempC !== undefined && (record.tempC < -170 || record.tempC > 60)) {
    errors.push('Temperature must be between -170°C and 60°C');
  }
  return { isValid: errors.length === 0, errors };
}

interface AddConsumptionPayload {
  tankNo: string;
  consumedWeightKg: number;
  consumedVolumeM3: number;
  consumedMMBtu: number;
  consumedDensity: number;
  date: string;
  bayId?: string;
  lossesKg?: number;
  lossesPercent?: number;
}

interface AddDepressPayload {
  tankNo: string;
  pressBeforeMPa: number;
  pressAfterMPa: number;
  date?: string;
  ventDurationMin?: number;
  lossesKg?: number;
  lossesPercent?: number;
  remarks: string;
}

export interface TankRelocationParams {
  heelLevelPct?: number;
  heelPressureMPa?: number;
  heelTempC?: number;
  heelWeightKg?: number;
  depressActive?: boolean;
  remarks?: string;
}

interface PortalDataContextType {
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
  completeReturnCycle: (tankNos: string[]) => void;
  // Heel Closed-Loop Lifecycle Checkpoints
  recordPostRegasOffload: (bayIdOrTankNo: string, metrics: OffloadHeelMetrics) => void;
  authorizeBackhaulClearance: (tankNos: string[], metrics: BackhaulDepartureMetrics) => void;
  recordArunArrivalHeelInspection: (tankNo: string, arrival: ArrivalHeelMetrics) => void;
  // 7-CSV Domain New Record Generators
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
  const [fleetTanks, setFleetTanks] = useState<FleetTankItem[]>([]);
  const [dailyMasterRecords, setDailyMasterRecords] = useState<DailyMasterRecord[]>([]);
  const [settlementRecords, setSettlementRecords] = useState<SettlementLedgerEntry[]>([]);
  const [gasCompositions, setGasCompositions] = useState<GasCompositionComparison[]>([]);
  const [activeBays, setActiveBays] = useState<ActiveBayState[]>([]);
  const [ingestionStatuses, setIngestionStatuses] = useState<DataIngestionStatus[]>([]);
  const [gasQualityRecords, setGasQualityRecords] = useState<GasQualityMasterRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.GAS_QUALITY_MASTER_RECORDS, INITIAL_GAS_QUALITY_MASTER_RECORDS)
  );
  const [rawFileContents, setRawFileContents] = useState<Record<string, Record<string, string>[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const saveGasQualityRecord = useCallback((newRecord: GasQualityMasterRecord) => {
    setGasQualityRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.date === newRecord.date);
      let updated: GasQualityMasterRecord[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = newRecord;
      } else {
        updated = [newRecord, ...prev];
      }
      updated.sort((a, b) => (b.date > a.date ? 1 : -1));
      saveToStorage(STORAGE_KEYS.GAS_QUALITY_MASTER_RECORDS, updated);
      return updated;
    });
  }, []);

  const initData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadAllPortalData();

      // Seed operational sample states & heel metrics
      const initialFleet = (data.fleetTanks || []).map((t, idx) => {
        // Pre-seed Heel Lifecycle metrics for staged and returned tanks
        if (t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE || t.position.toLowerCase().includes('laydown 2') || t.position.toLowerCase().includes('laydown 3') || idx === 3 || idx === 7) {
          const offload: OffloadHeelMetrics = {
            offloadDate: '2026-08-13 16:30',
            heelLevelPct: 4.0,
            heelVolumeM3: 1.8,
            heelMmH2O: 36,
            heelMassKg: 350,
            holdingPressureMPa: 0.22,
            tempC: -135.0,
            bayId: 'Bay 02',
            remarks: 'Post-regas offload to Laydown 2 baseline verified',
          };
          const backhaul: BackhaulDepartureMetrics = {
            departureDate: '2026-08-14 08:00',
            departureLevelPct: 3.8,
            departureMassKg: 335,
            departurePressureMPa: 0.25,
            departureTempC: -132.0,
            manifestNo: 'BHM-202608-002',
            vesselName: 'MV. Saviour',
            safetyClearance: true,
            remarks: 'Safety valves sealed. Ready for backhaul voyage',
          };
          return {
            ...t,
            offloadHeelMetrics: offload,
            backhaulDepartureMetrics: backhaul,
          };
        }

        if (t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL && (idx === 0 || idx === 1 || idx === 2)) {
          const offload: OffloadHeelMetrics = {
            offloadDate: '2026-08-10 14:00',
            heelLevelPct: 4.2,
            heelVolumeM3: 1.9,
            heelMmH2O: 38,
            heelMassKg: 365,
            holdingPressureMPa: 0.21,
            tempC: -136.0,
            bayId: 'Bay 01',
            remarks: 'Post-regas offload completed at Nias ORU',
          };
          const departure: BackhaulDepartureMetrics = {
            departureDate: '2026-08-11 09:30',
            departureLevelPct: 4.0,
            departureMassKg: 350,
            departurePressureMPa: 0.24,
            departureTempC: -133.5,
            manifestNo: 'BHM-202608-001',
            vesselName: 'MV. Saviour',
            safetyClearance: true,
            remarks: 'Departure inspection verified',
          };
          const arrival: ArrivalHeelMetrics = {
            arrivalDate: '2026-08-13 11:15',
            arrivalMassKg: 332,
            arrivalPressureMPa: 0.31,
            arrivalTempC: -129.0,
            tareWeightKg: 10850,
            grossWeightKg: 11182,
            inspectorRemarks: 'Arun Pag arrival inspection: 332 kg cold heel intact.',
          };
          const loss: VoyageHeelLoss = {
            massLossKg: 18,
            pressureRiseMPa: 0.07,
            preservationEfficiencyPct: 94.9,
            heelCreditMMBtu: 17.26,
          };
          return {
            ...t,
            offloadHeelMetrics: offload,
            backhaulDepartureMetrics: departure,
            arrivalHeelMetrics: arrival,
            voyageHeelLoss: loss,
          };
        }

        return t;
      });

      // Load persisted records from LocalStorage and merge
      const storedInspection = loadFromStorage<DailyMasterRecord[]>(STORAGE_KEYS.FIELD_INSPECTION_LOGS, []);
      const storedSettlement = loadFromStorage<SettlementLedgerEntry[]>(STORAGE_KEYS.PLN_REGAS_CONSUMPTION_LOGS, []);
      const storedGC = loadFromStorage<GasCompositionComparison[]>(STORAGE_KEYS.GC_COMPOSITION_LOGS, []);

      const mergedMasterRecords = [
        ...storedInspection,
        ...(data.dailyMasterRecords || []).filter(
          (r) => !storedInspection.some((s) => s.id === r.id || (s.tankNo === r.tankNo && s.reportDate === r.reportDate))
        ),
      ];
      const mergedSettlement = [
        ...storedSettlement,
        ...(data.settlementRecords || []).filter((r) => !storedSettlement.some((s) => s.id === r.id)),
      ];
      const mergedGC = [
        ...storedGC,
        ...(data.gasCompositions || []).filter((r) => !storedGC.some((s) => s.id === r.id)),
      ];

      setFleetTanks(initialFleet);
      setDailyMasterRecords(mergedMasterRecords);
      setSettlementRecords(mergedSettlement);
      setGasCompositions(mergedGC);
      setActiveBays(data.activeBays);
      setIngestionStatuses(data.ingestionStatuses);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown data loading error';
      setError(msg);
      console.error('Data initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  // Update specific tank fields inline
  const updateTankLog = (tankNo: string, updatedFields: Partial<FleetTankItem>) => {
    setFleetTanks((prev) =>
      prev.map((t) => (t.tankNo === tankNo ? { ...t, ...updatedFields } : t))
    );

    setActiveBays((prevBays) =>
      prevBays.map((bay) => {
        if (bay.tankNo === tankNo) {
          return {
            ...bay,
            pressure: updatedFields.pressureMPa ?? bay.pressure,
            temp: updatedFields.tempC ?? bay.temp,
            level: updatedFields.level ?? bay.level,
          };
        }
        return bay;
      })
    );
  };

  // Concrete Tank Relocation Engine across Laydown 1, Laydown 2, 4-Bay (Bay 01~04), and Laydown 3
  const moveTankLocation = (
    tankIdOrNo: string,
    newZone: string,
    slotNumber?: number,
    params?: TankRelocationParams
  ) => {
    const targetTank = fleetTanks.find((t) => t.tankNo === tankIdOrNo || t.serialNo === tankIdOrNo);
    if (!targetTank) return;
    const tankNo = targetTank.tankNo;

    // Check if target is a Vaporizer Bay (Bay 01 ~ Bay 04)
    const isBayTarget =
      newZone.startsWith('Bay') ||
      newZone.startsWith('BAY') ||
      newZone.toLowerCase().includes('bay') ||
      newZone === 'FOUR_BAY_REGAS';

    if (isBayTarget) {
      // Find matching bay ID or default to first available
      const matchedBay =
        activeBays.find((b) => newZone.includes(b.bayId) || b.bayId === newZone) ||
        activeBays.find((b) => !b.tankNo) ||
        activeBays[0];

      if (matchedBay) {
        mountTankToBay(matchedBay.bayId, tankNo);
        return;
      }
    }

    // If tank was mounted to a bay, disconnect it first
    const mountedBay = activeBays.find((b) => b.tankNo === tankNo);
    if (mountedBay) {
      setActiveBays((prev) =>
        prev.map((b) =>
          b.bayId === mountedBay.bayId
            ? {
                ...b,
                tankNo: null,
                serialNo: undefined,
                pressure: 0,
                temp: 28.0,
                level: 0,
                flowRate: 0,
                status: 'DISCONNECTED',
                startTime: undefined,
              }
            : b
        )
      );
    }

    // Target: Laydown 1 (Receiving & BOG Venting Buffer)
    if (
      newZone.toLowerCase().includes('laydown 1') ||
      newZone.toLowerCase().includes('yard 1') ||
      newZone === 'LAYDOWN_1'
    ) {
      updateTankLog(tankNo, {
        node: NodeState.NODE_3_NIAS_LAYDOWN_YARD,
        position: slotNumber ? `Laydown 1 (Slot ${slotNumber})` : 'Laydown 1',
        isMountedToBay: null,
        location: 'ORU NIAS',
        remarks: params?.remarks || 'Relocated to Laydown Yard 1 (Receiving & BOG Buffer)',
      });
      return;
    }

    // Target: Laydown 2 (Empty Heel 4% Staging & Backhaul Buffer)
    if (
      newZone.toLowerCase().includes('laydown 2') ||
      newZone.toLowerCase().includes('yard 2') ||
      newZone === 'LAYDOWN_2' ||
      newZone.toLowerCase().includes('laydown 3') ||
      newZone === 'LAYDOWN_3'
    ) {
      const updatePayload: Partial<FleetTankItem> = {
        node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
        position: slotNumber ? `Laydown 2 (Slot ${slotNumber})` : 'Laydown 2',
        isMountedToBay: null,
        location: 'ORU NIAS',
        remarks: params?.remarks || `Relocated to Laydown Yard 2${slotNumber ? ` (Slot ${slotNumber})` : ''}`,
      };

      if (params?.heelLevelPct !== undefined) {
        updatePayload.level = params.heelLevelPct;
        updatePayload.levelM3 = parseFloat(((params.heelLevelPct / 100) * 45).toFixed(1));
      }
      if (params?.heelPressureMPa !== undefined) {
        updatePayload.pressureMPa = params.heelPressureMPa;
      }
      if (params?.heelTempC !== undefined) {
        updatePayload.tempC = params.heelTempC;
      }

      updateTankLog(tankNo, updatePayload);
      return;
    }

    // Fallback for custom or direct positions
    updateTankLog(tankNo, {
      position: newZone,
      isMountedToBay: null,
      location: 'ORU NIAS',
      remarks: params?.remarks || `Relocated to ${newZone}`,
    });
  };

  // Batch transition tanks across 5-Node FSM
  const batchTransitionTanks = (tankNos: string[], targetNode: NodeState) => {
    setFleetTanks((prev) =>
      prev.map((t) => {
        if (tankNos.includes(t.tankNo)) {
          let newLocation = t.location;
          let newPosition = t.position;
          if (targetNode === NodeState.NODE_1_ARUN_PAG_TERMINAL) {
            newLocation = 'Aceh';
            newPosition = 'LAYDOWN PAG';
          } else if (targetNode === NodeState.NODE_2_MV_SAVIOUR_TRANSIT) {
            newLocation = 'Ship';
            newPosition = 'MV. SAVIOUR';
          } else if (targetNode === NodeState.NODE_3_NIAS_LAYDOWN_YARD) {
            newLocation = 'ORU NIAS';
            newPosition = 'LAYDOWN 1';
          } else if (targetNode === NodeState.NODE_4_REGAS_ACTIVE_BAY) {
            newLocation = 'ORU NIAS';
            newPosition = 'REGAS BAY';
          } else if (targetNode === NodeState.NODE_5_EMPTY_RETURN_CYCLE) {
            newLocation = 'ORU NIAS';
            newPosition = 'LAYDOWN 1 (EMPTY)';
          }
          return {
            ...t,
            node: targetNode,
            location: newLocation,
            position: newPosition,
            isUnderMaintenance: false,
          };
        }
        return t;
      })
    );
  };

  // Mark tank for Emergency Maintenance / MRO
  const markTankForMaintenance = (
    tankNo: string,
    defect: DefectCategory,
    location: MaintenanceLocation,
    desc: string
  ) => {
    setActiveBays((prev) =>
      prev.map((bay) => {
        if (bay.tankNo === tankNo) {
          return {
            ...bay,
            tankNo: null,
            serialNo: undefined,
            pressure: 0,
            temp: 28.0,
            level: 0,
            flowRate: 0,
            status: 'DISCONNECTED',
          };
        }
        return bay;
      })
    );

    const nowStr = new Date().toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setFleetTanks((prev) =>
      prev.map((t) => {
        if (t.tankNo === tankNo) {
          return {
            ...t,
            node: NodeState.NODE_MAINTENANCE_MRO,
            isUnderMaintenance: true,
            defectCategory: defect,
            maintenanceLocation: location,
            defectDescription: desc,
            repairStartedAt: nowStr,
            location: location === 'ARUN_WORKSHOP' ? 'Aceh' : 'ORU NIAS',
            position: location === 'ARUN_WORKSHOP' ? 'ARUN MRO WORKSHOP' : 'NIAS MRO BAY',
            isMountedToBay: null,
          };
        }
        return t;
      })
    );
  };

  // Release tank from maintenance back into rotation
  const releaseTankFromMaintenance = (tankNo: string, targetNode: NodeState) => {
    setFleetTanks((prev) =>
      prev.map((t) => {
        if (t.tankNo === tankNo) {
          let newLocation = 'Aceh';
          let newPosition = 'LAYDOWN PAG';
          if (targetNode === NodeState.NODE_3_NIAS_LAYDOWN_YARD) {
            newLocation = 'ORU NIAS';
            newPosition = 'LAYDOWN 1';
          } else if (targetNode === NodeState.NODE_1_ARUN_PAG_TERMINAL) {
            newLocation = 'Aceh';
            newPosition = 'LAYDOWN PAG';
          }

          return {
            ...t,
            node: targetNode,
            isUnderMaintenance: false,
            defectCategory: undefined,
            maintenanceLocation: undefined,
            defectDescription: undefined,
            repairStartedAt: undefined,
            location: newLocation,
            position: newPosition,
            remarks: 'Released from MRO - Inspection Certified',
          };
        }
        return t;
      })
    );
  };

  // Complete return cycle: Move empty tanks back to Arun PAG loading (Node 1)
  const completeReturnCycle = (tankNos: string[]) => {
    setFleetTanks((prev) =>
      prev.map((t) => {
        if (tankNos.includes(t.tankNo)) {
          return {
            ...t,
            node: NodeState.NODE_1_ARUN_PAG_TERMINAL,
            location: 'Aceh',
            position: 'LAYDOWN PAG',
            remarks: 'ARUN_AWAITING_INSPECTION',
            isUnderMaintenance: false,
            level: 2,
            pressureMPa: 0.15,
            tempC: 25.0,
          };
        }
        return t;
      })
    );
  };

  // Mount tank to specific bay
  const mountTankToBay = (bayId: string, tankNo: string) => {
    const targetTank = fleetTanks.find((t) => t.tankNo === tankNo);
    if (!targetTank) return;

    setActiveBays((prev) =>
      prev.map((bay) => {
        if (bay.bayId === bayId) {
          return {
            ...bay,
            tankNo: targetTank.tankNo,
            serialNo: targetTank.serialNo,
            pressure: targetTank.pressureMPa || 0.78,
            temp: targetTank.tempC || -126.5,
            level: targetTank.level || 60,
            flowRate: 1700.0,
            status: 'RUNNING',
            startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        // If this tank was previously mounted to another bay, clear that bay
        if (bay.tankNo === tankNo) {
          return {
            ...bay,
            tankNo: null,
            serialNo: undefined,
            pressure: 0.0,
            temp: 28.0,
            level: 0,
            flowRate: 0.0,
            status: 'STANDBY',
            totalVaporizedM3: 0.0,
          };
        }
        return bay;
      })
    );

    updateTankLog(tankNo, {
      node: NodeState.NODE_4_REGAS_ACTIVE_BAY,
      position: `REGAS ${bayId}`,
      isMountedToBay: bayId,
    });
  };

  // Unmount bay
  const unmountBay = (bayId: string) => {
    const currentBay = activeBays.find((b) => b.bayId === bayId);
    if (currentBay && currentBay.tankNo) {
      updateTankLog(currentBay.tankNo, {
        node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
        position: 'Laydown 2',
        isMountedToBay: null,
      });
    }

    setActiveBays((prev) =>
      prev.map((bay) => {
        if (bay.bayId === bayId) {
          return {
            ...bay,
            tankNo: null,
            serialNo: undefined,
            pressure: 0,
            temp: 28.0,
            level: 0,
            flowRate: 0,
            status: 'DISCONNECTED',
            startTime: undefined,
          };
        }
        return bay;
      })
    );
  };

  // Toggle start / stop on a Bay
  const toggleBayRunning = (bayId: string) => {
    setActiveBays((prev) =>
      prev.map((bay) => {
        if (bay.bayId === bayId) {
          const nextStatus = bay.status === 'RUNNING' ? 'STANDBY' : 'RUNNING';
          return {
            ...bay,
            status: nextStatus,
            flowRate: nextStatus === 'RUNNING' ? 2.3 : 0.0,
          };
        }
        return bay;
      })
    );
  };

  // =========================================================================
  // Heel Closed-Loop Lifecycle Checkpoints (Nias ➔ Saviour ➔ Arun)
  // =========================================================================

  // Stage 1: Post-Regas Offload Condition Log (4-Bay ➔ Laydown 2)
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
      setActiveBays((prev) =>
        prev.map((b) =>
          b.bayId === bay.bayId
            ? {
                ...b,
                tankNo: null,
                serialNo: undefined,
                pressure: 0,
                temp: 28.0,
                level: 0,
                flowRate: 0,
                status: 'DISCONNECTED',
              }
            : b
        )
      );
    }
  };

  // Stage 2: Pre-Backhaul Inspection Log (Laydown 3 ➔ MV. Saviour)
  const authorizeBackhaulClearance = (tankNos: string[], metrics: BackhaulDepartureMetrics) => {
    setFleetTanks((prev) =>
      prev.map((t) => {
        if (tankNos.includes(t.tankNo)) {
          return {
            ...t,
            node: NodeState.NODE_2_MV_SAVIOUR_TRANSIT,
            location: 'Ship',
            position: 'MV. Saviour (Backhaul)',
            level: metrics.departureLevelPct,
            pressureMPa: metrics.departurePressureMPa,
            tempC: metrics.departureTempC,
            backhaulDepartureMetrics: metrics,
            remarks:
              metrics.remarks ||
              `Authorized for MV. Saviour backhaul manifest ${metrics.manifestNo} (${metrics.departureMassKg} kg heel, ${metrics.departurePressureMPa} MPa)`,
          };
        }
        return t;
      })
    );
  };

  // Stage 3: Arun PAG Pre-Loading Arrival Heel Inspection
  const recordArunArrivalHeelInspection = (
    tankNo: string,
    arrival: ArrivalHeelMetrics
  ) => {
    setFleetTanks((prev) =>
      prev.map((t) => {
        if (t.tankNo === tankNo) {
          const departureMass =
            t.backhaulDepartureMetrics?.departureMassKg ||
            t.offloadHeelMetrics?.heelMassKg ||
            350;
          const departurePress =
            t.backhaulDepartureMetrics?.departurePressureMPa ||
            t.offloadHeelMetrics?.holdingPressureMPa ||
            0.22;
          const massLossKg = Math.max(0, departureMass - arrival.arrivalMassKg);
          const pressureRiseMPa = parseFloat(
            Math.max(0, arrival.arrivalPressureMPa - departurePress).toFixed(3)
          );
          const preservationEfficiencyPct = parseFloat(
            ((arrival.arrivalMassKg / departureMass) * 100).toFixed(1)
          );
          // Pre-existing Heel MMBtu Credit
          const heelCreditMMBtu = parseFloat(
            ((arrival.arrivalMassKg * 52215) / 1000000 * 0.947817 * 0.001055).toFixed(2)
          );

          const lossMetrics: VoyageHeelLoss = {
            massLossKg,
            pressureRiseMPa,
            preservationEfficiencyPct,
            heelCreditMMBtu,
          };

          return {
            ...t,
            node: NodeState.NODE_1_ARUN_PAG_TERMINAL,
            location: 'Aceh',
            position: 'LAYDOWN PAG',
            level: parseFloat(((arrival.arrivalMassKg / 18500) * 100).toFixed(1)),
            pressureMPa: arrival.arrivalPressureMPa,
            tempC: arrival.arrivalTempC,
            arrivalHeelMetrics: arrival,
            voyageHeelLoss: lossMetrics,
            remarks:
              arrival.inspectorRemarks ||
              `Arun arrival heel verified: ${arrival.arrivalMassKg} kg (${preservationEfficiencyPct}% preserved, ${heelCreditMMBtu} MMBtu credit)`,
          };
        }
        return t;
      })
    );
  };

  // =========================================================================
  // 7-CSV Domain New Record Generators
  // =========================================================================

  // 1. Add Delivered Measurement & COQ
  const addDeliveredMeasurement = (
    record: Partial<SettlementLedgerEntry>,
    coq?: Partial<GasCompositionComparison>
  ) => {
    const tNo = record.tankNo || 'ISOT-001';
    const sNo = record.serialNo || 'TRSU-123456';
    const delMMBtu = record.deliveredMMBtu || 850.5;
    const conMMBtu = record.consumedMMBtu || 0;
    const lossPct = record.lossesPercent || 0;
    const dispute = lossPct > 5.0 ? 'DISPUTE_ALERT' : 'VERIFIED';

    const newEntry: SettlementLedgerEntry = {
      id: `DEL-${Date.now()}-${tNo}`,
      tankNo: tNo,
      serialNo: sNo,
      shipment: record.shipment || 'N1',
      date: record.date || new Date().toISOString().split('T')[0],
      deliveredWeightKg: record.deliveredWeightKg || 18500,
      deliveredVolumeM3: record.deliveredVolumeM3 || 41.8,
      deliveredDensity: record.deliveredDensity || 442.02,
      deliveredTempC: record.deliveredTempC || -160.0,
      deliveredGHV: record.deliveredGHV || 52214.94,
      deliveredMMBtu: delMMBtu,
      consumedWeightKg: record.consumedWeightKg || 0,
      consumedVolumeM3: record.consumedVolumeM3 || 0,
      consumedMMBtu: conMMBtu,
      consumedDensity: record.consumedDensity || 442.0,
      lossesKg: record.lossesKg || 0,
      lossesPercent: lossPct,
      varianceMMBtu: delMMBtu - conMMBtu,
      disputeStatus: dispute,
      remarks: record.remarks || 'New Arun Loading Record Logged',
    };

    setSettlementRecords((prev) => [newEntry, ...prev]);

    if (coq) {
      const newCOQ: GasCompositionComparison = {
        id: `COQ-${Date.now()}-${tNo}`,
        source: coq.source || 'Arun COQ Lab',
        samplePoint: coq.samplePoint || `${tNo} (${sNo})`,
        shipment: record.shipment || 'N-1',
        reportDate: coq.reportDate || new Date().toISOString().split('T')[0],
        methane: coq.methane ?? 90.24,
        ethane: coq.ethane ?? 5.53,
        propane: coq.propane ?? 2.87,
        iButane: coq.iButane ?? 0.44,
        nButane: coq.nButane ?? 0.54,
        iPentane: coq.iPentane ?? 0.08,
        nPentane: coq.nPentane ?? 0.04,
        nitrogen: coq.nitrogen ?? 0.26,
        co2: coq.co2 ?? 0.0,
        ghv: coq.ghv ?? 1056.4,
      };
      setGasCompositions((prev) => [newCOQ, ...prev]);
    }

    // Update fleet tank status to ARUN_STAGED_FOR_DEPARTURE
    updateTankLog(tNo, {
      location: 'Aceh',
      position: 'ARUN_STAGED_FOR_DEPARTURE',
      node: NodeState.NODE_1_ARUN_PAG_TERMINAL,
      level: 98,
      pressureMPa: 0.78,
      tempC: -160.0,
      shipment: record.shipment || 'N1',
      remarks: 'Loaded & Staged at Arun PAG',
    });
  };

  // 2. Add Daily Master Log / Inspection Handlers
  const addDailyMasterLog = (logs: Partial<FleetTankItem>[]) => {
    logs.forEach((log) => {
      if (log.tankNo) {
        updateTankLog(log.tankNo, log);
      }
    });
  };

  const saveDailyInspectionRecord = (record: DailyMasterRecord) => {
    // Validate record values
    const validation = validateInspectionRecord(record);
    if (!validation.isValid) {
      console.warn('Inspection record validation warnings:', validation.errors);
    }

    const localTimeWib = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }) + ' WIB';
    const recordWithMeta: DailyMasterRecord = {
      ...record,
      remarks: record.remarks ? `${record.remarks} [Logged: ${localTimeWib}]` : `Field Log [${localTimeWib}]`,
    };

    // 1. Update or prepend in dailyMasterRecords state & persist
    setDailyMasterRecords((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.tankNo === record.tankNo && r.reportDate === record.reportDate
      );
      let next: DailyMasterRecord[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...recordWithMeta };
      } else {
        const newRec: DailyMasterRecord = {
          ...recordWithMeta,
          id: record.id || `DM-${record.reportDate}-${record.tankNo}-${Date.now()}`,
        };
        next = [newRec, ...prev];
      }
      saveToStorage(STORAGE_KEYS.FIELD_INSPECTION_LOGS, next);
      return next;
    });

    // 2. Update active fleetTanks item
    updateTankLog(record.tankNo, {
      position: record.position,
      level: record.level,
      levelM3: record.levelM3,
      levelMmH2O: record.levelMmH2O,
      battery: record.battery,
      pressureMPa:
        record.pressAfterMPa > 0 && record.depress.toLowerCase().includes('depress')
          ? record.pressAfterMPa
          : record.pressureMPa,
      tempC: record.tempC,
      depress: record.depress,
      pressBeforeMPa: record.pressBeforeMPa,
      pressAfterMPa: record.pressAfterMPa,
      remarks: record.remarks,
      lastReportDate: record.reportDate,
    });

    // 3. If depressurized, also create/sync depressurization event
    if (
      record.depress.toLowerCase().includes('depress') ||
      (record.pressBeforeMPa > 0 &&
        record.pressAfterMPa > 0 &&
        record.pressBeforeMPa > record.pressAfterMPa)
    ) {
      const deltaP = Math.max(0, record.pressBeforeMPa - record.pressAfterMPa);
      const lossKg = record.lossesKg || Math.round(deltaP * 5500) || 426;
      const lossPct =
        record.lossesPercent || parseFloat(((lossKg / 18500) * 100).toFixed(2)) || 2.3;

      addDepressurizationLog({
        tankNo: record.tankNo,
        pressBeforeMPa: record.pressBeforeMPa,
        pressAfterMPa: record.pressAfterMPa,
        lossesKg: lossKg,
        lossesPercent: lossPct,
        remarks: record.remarks || `Controlled BOG Venting (${record.pressBeforeMPa} ➔ ${record.pressAfterMPa} MPa)`,
      });
    }
  };

  const batchUpdateDailyMasterRecords = (records: DailyMasterRecord[]) => {
    records.forEach((r) => saveDailyInspectionRecord(r));
  };

  // 3. Add Consumption Record (Nias Regas Terminal)
  const addConsumptionRecord = (consumption: AddConsumptionPayload) => {
    const { tankNo, consumedWeightKg, consumedVolumeM3, consumedMMBtu, consumedDensity, date, bayId, lossesKg = 0, lossesPercent = 0 } = consumption;

    // Recalculate settlement ledger entry
    setSettlementRecords((prev) => {
      const existingIdx = prev.findIndex((s) => s.tankNo === tankNo);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const variance = existing.deliveredMMBtu - consumedMMBtu;
        const lossPct = lossesPercent || (existing.deliveredWeightKg > 0 ? (lossesKg / existing.deliveredWeightKg) * 100 : 0);
        const dispute = lossPct > 5.0 ? 'DISPUTE_ALERT' : 'VERIFIED';

        const updated: SettlementLedgerEntry = {
          ...existing,
          date,
          consumedWeightKg,
          consumedVolumeM3,
          consumedMMBtu,
          consumedDensity,
          lossesKg,
          lossesPercent: parseFloat(lossPct.toFixed(2)),
          varianceMMBtu: parseFloat(variance.toFixed(2)),
          disputeStatus: dispute,
          remarks: `Consumed at ${bayId || 'Bay'} - ${date}`,
        };
        const next = [...prev];
        next[existingIdx] = updated;
        saveToStorage(STORAGE_KEYS.PLN_REGAS_CONSUMPTION_LOGS, next);
        return next;
      } else {
        const newEntry: SettlementLedgerEntry = {
          id: `CON-${Date.now()}-${tankNo}`,
          tankNo,
          serialNo: fleetTanks.find((t) => t.tankNo === tankNo)?.serialNo || 'TRSU-GEN',
          shipment: 'N1',
          date,
          deliveredWeightKg: consumedWeightKg + lossesKg,
          deliveredVolumeM3: consumedVolumeM3,
          deliveredDensity: consumedDensity,
          deliveredTempC: -160.0,
          deliveredGHV: 52214.94,
          deliveredMMBtu: consumedMMBtu * 1.02,
          consumedWeightKg,
          consumedVolumeM3,
          consumedMMBtu,
          consumedDensity,
          lossesKg,
          lossesPercent: parseFloat(lossesPercent.toFixed(2)),
          varianceMMBtu: parseFloat((consumedMMBtu * 0.02).toFixed(2)),
          disputeStatus: lossesPercent > 5.0 ? 'DISPUTE_ALERT' : 'VERIFIED',
          remarks: `Batch Regas at ${bayId || 'ORU Nias'}`,
        };
        const next = [newEntry, ...prev];
        saveToStorage(STORAGE_KEYS.PLN_REGAS_CONSUMPTION_LOGS, next);
        return next;
      }
    });

    // If bay was active, unmount and move to empty return
    if (bayId) {
      unmountBay(bayId);
    } else {
      updateTankLog(tankNo, {
        node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
        location: 'ORU NIAS',
        position: 'LAYDOWN 1 (EMPTY)',
        level: 2,
        remarks: 'Regasification Complete - Empty Staged',
        isMountedToBay: null,
      });
    }
  };

  // 4. Add FloBoss & Plant GC Log
  const addFlobossAndGCLog = (
    floboss: Partial<GasCompositionComparison>,
    gc: Partial<GasCompositionComparison>
  ) => {
    const entries: GasCompositionComparison[] = [];
    if (floboss.source) {
      entries.push({
        id: `FLO-${Date.now()}`,
        source: floboss.source || 'FloBoss Meter Run',
        samplePoint: floboss.samplePoint || 'Metering Skid A/B',
        reportDate: floboss.reportDate || new Date().toISOString().split('T')[0],
        methane: floboss.methane ?? 91.1,
        ethane: floboss.ethane ?? 5.2,
        propane: floboss.propane ?? 2.6,
        iButane: floboss.iButane ?? 0.4,
        nButane: floboss.nButane ?? 0.45,
        iPentane: floboss.iPentane ?? 0.05,
        nPentane: floboss.nPentane ?? 0.02,
        nitrogen: floboss.nitrogen ?? 0.18,
        co2: floboss.co2 ?? 0.0,
        ghv: floboss.ghv ?? 1054.8,
      });
    }
    if (gc.source) {
      entries.push({
        id: `GC-${Date.now()}`,
        source: gc.source || 'Plant Gas GC M-101A/B',
        samplePoint: gc.samplePoint || 'Gas Header to Turbine',
        reportDate: gc.reportDate || new Date().toISOString().split('T')[0],
        methane: gc.methane ?? 90.8,
        ethane: gc.ethane ?? 5.4,
        propane: gc.propane ?? 2.7,
        iButane: gc.iButane ?? 0.42,
        nButane: gc.nButane ?? 0.48,
        iPentane: gc.iPentane ?? 0.06,
        nPentane: gc.nPentane ?? 0.03,
        nitrogen: gc.nitrogen ?? 0.21,
        co2: gc.co2 ?? 0.0,
        ghv: gc.ghv ?? 1055.2,
      });
    }
    setGasCompositions((prev) => {
      const next = [...entries, ...prev];
      saveToStorage(STORAGE_KEYS.GC_COMPOSITION_LOGS, next);
      return next;
    });
  };

  // 5. Add Depressurization Log
  const addDepressurizationLog = (payload: AddDepressPayload) => {
    updateTankLog(payload.tankNo, {
      pressBeforeMPa: payload.pressBeforeMPa,
      pressAfterMPa: payload.pressAfterMPa,
      pressureMPa: payload.pressAfterMPa,
      depress: 'Depressurized',
      remarks: payload.remarks || `BOG vented: ${payload.lossesKg} kg (${payload.lossesPercent}%)`,
    });
  };

  // Manual CSV Upload support
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

  // Master Export Action
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
        completeReturnCycle,
        recordPostRegasOffload,
        authorizeBackhaulClearance,
        recordArunArrivalHeelInspection,
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
