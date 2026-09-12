// src/components/locations/nias/utils/buildMasterInspectionList.ts
import type { DailyMasterRecord, FleetTankItem } from '@/types/lng';
import type { NiasTankAsset } from '../../NiasTerminalView';

export type NiasDateQueryMode = 'ALL_DATA' | 'DAILY' | 'PERIOD_RANGE';

export interface TankLossData {
  lossKg: number;
  lossPct: number;
  shipment: string;
}

export interface BuildMasterInspectionListParams {
  dailyMasterRecords: DailyMasterRecord[];
  deletedRecordIds: Set<string>;
  dateQueryMode: NiasDateQueryMode;
  selectedDate: string;
  startDate: string;
  endDate: string;
  batchFilter: string;
  zoneFilter: string;
  searchQuery: string;
  fleetTanks: FleetTankItem[];
  tankInventory: NiasTankAsset[];
  getTankLossData: (tankNo: string) => TankLossData;
  normalizeBatch: (raw?: string) => string;
}

export function buildMasterInspectionList({
  dailyMasterRecords,
  deletedRecordIds,
  dateQueryMode,
  selectedDate,
  startDate,
  endDate,
  batchFilter,
  zoneFilter,
  searchQuery,
  fleetTanks,
  tankInventory,
  getTankLossData,
  normalizeBatch,
}: BuildMasterInspectionListParams): DailyMasterRecord[] {
  let records = dailyMasterRecords.filter((r) => (r.id ? !deletedRecordIds.has(r.id) : true));

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
}
