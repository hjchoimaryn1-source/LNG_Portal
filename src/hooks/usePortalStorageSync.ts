// src/hooks/usePortalStorageSync.ts
import { DailyMasterRecord, GasCompositionComparison, SettlementLedgerEntry } from '../types/lng';
import { GasQualityMasterRecord } from '../types/gasQuality';
import { INITIAL_GAS_QUALITY_MASTER_RECORDS } from '../data/gasQualityMasterData';

export const STORAGE_KEYS = {
  FIELD_INSPECTION_LOGS: 'nias_field_inspection_logs',
  DAILY_FLOBOSS_LOGS: 'nias_daily_floboss_logs',
  GC_COMPOSITION_LOGS: 'nias_gc_composition_logs',
  PLN_REGAS_CONSUMPTION_LOGS: 'nias_pln_regas_consumption_logs',
  FLEET_TANKS_STATE: 'nias_fleet_tanks_state',
  SETTLEMENT_RECORDS: 'nias_settlement_records',
  GAS_QUALITY_MASTER_RECORDS: 'nias_gas_quality_master_records',
};

export function loadFromStorage<T>(key: string, fallback: T): T {
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

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[LocalStorage] Failed to save ${key}:`, e);
  }
}

export function usePortalStorageSync() {
  const loadInitialGasQuality = (): GasQualityMasterRecord[] => {
    return loadFromStorage(STORAGE_KEYS.GAS_QUALITY_MASTER_RECORDS, INITIAL_GAS_QUALITY_MASTER_RECORDS);
  };

  const mergeStoredDomainData = (
    csvDailyMaster: DailyMasterRecord[] = [],
    csvSettlement: SettlementLedgerEntry[] = [],
    csvGC: GasCompositionComparison[] = []
  ): {
    mergedMasterRecords: DailyMasterRecord[];
    mergedSettlement: SettlementLedgerEntry[];
    mergedGC: GasCompositionComparison[];
  } => {
    const storedInspection = loadFromStorage<DailyMasterRecord[]>(STORAGE_KEYS.FIELD_INSPECTION_LOGS, []);
    const storedSettlement = loadFromStorage<SettlementLedgerEntry[]>(STORAGE_KEYS.PLN_REGAS_CONSUMPTION_LOGS, []);
    const storedGC = loadFromStorage<GasCompositionComparison[]>(STORAGE_KEYS.GC_COMPOSITION_LOGS, []);

    const storedInspectionKeySet = new Set<string>();
    storedInspection.forEach((s) => {
      if (s.id) storedInspectionKeySet.add(s.id);
      if (s.tankNo && s.reportDate) storedInspectionKeySet.add(`${s.tankNo}_${s.reportDate}`);
    });

    const storedSettlementIdSet = new Set(storedSettlement.map((s) => s.id));
    const storedGCIdSet = new Set(storedGC.map((s) => s.id));

    const mergedMasterRecords = [
      ...storedInspection,
      ...csvDailyMaster.filter(
        (r) => !(r.id && storedInspectionKeySet.has(r.id)) && !storedInspectionKeySet.has(`${r.tankNo}_${r.reportDate}`)
      ),
    ];

    const mergedSettlement = [
      ...storedSettlement,
      ...csvSettlement.filter((r) => !storedSettlementIdSet.has(r.id)),
    ];

    const mergedGC = [
      ...storedGC,
      ...csvGC.filter((r) => !storedGCIdSet.has(r.id)),
    ];

    return { mergedMasterRecords, mergedSettlement, mergedGC };
  };

  const persistDailyInspections = (records: DailyMasterRecord[]) => {
    saveToStorage(STORAGE_KEYS.FIELD_INSPECTION_LOGS, records);
  };

  const persistSettlementLogs = (records: SettlementLedgerEntry[]) => {
    saveToStorage(STORAGE_KEYS.PLN_REGAS_CONSUMPTION_LOGS, records);
  };

  const persistGCLogs = (records: GasCompositionComparison[]) => {
    saveToStorage(STORAGE_KEYS.GC_COMPOSITION_LOGS, records);
  };

  const persistGasQualityRecords = (records: GasQualityMasterRecord[]) => {
    saveToStorage(STORAGE_KEYS.GAS_QUALITY_MASTER_RECORDS, records);
  };

  return {
    loadInitialGasQuality,
    mergeStoredDomainData,
    persistDailyInspections,
    persistSettlementLogs,
    persistGCLogs,
    persistGasQualityRecords,
  };
}
