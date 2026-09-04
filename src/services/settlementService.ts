// src/services/settlementService.ts
import {
  FleetTankItem,
  GasCompositionComparison,
  NodeState,
  SettlementLedgerEntry,
} from '../types/lng';
import { GasQualityMasterRecord } from '../types/gasQuality';

export interface AddConsumptionPayload {
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

export function createDeliveredMeasurement(
  record: Partial<SettlementLedgerEntry>,
  coq?: Partial<GasCompositionComparison>
): {
  newEntry: SettlementLedgerEntry;
  newCOQ?: GasCompositionComparison;
  tankUpdate: { tankNo: string; fields: Partial<FleetTankItem> };
} {
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

  let newCOQ: GasCompositionComparison | undefined;
  if (coq) {
    newCOQ = {
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
  }

  const tankUpdate = {
    tankNo: tNo,
    fields: {
      location: 'Aceh',
      position: 'ARUN_STAGED_FOR_DEPARTURE',
      node: NodeState.NODE_1_ARUN_PAG_TERMINAL,
      level: 98,
      pressureMPa: 0.78,
      tempC: -160.0,
      shipment: record.shipment || 'N1',
      remarks: 'Loaded & Staged at Arun PAG',
    },
  };

  return { newEntry, newCOQ, tankUpdate };
}

export function applyConsumptionRecord(
  prev: SettlementLedgerEntry[],
  fleetTanks: FleetTankItem[],
  consumption: AddConsumptionPayload
): {
  updatedSettlement: SettlementLedgerEntry[];
  unmountBayId?: string;
  tankUpdate?: { tankNo: string; fields: Partial<FleetTankItem> };
} {
  const { tankNo, consumedWeightKg, consumedVolumeM3, consumedMMBtu, consumedDensity, date, bayId, lossesKg = 0, lossesPercent = 0 } = consumption;

  let next: SettlementLedgerEntry[];
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
    next = [...prev];
    next[existingIdx] = updated;
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
    next = [newEntry, ...prev];
  }

  if (bayId) {
    return { updatedSettlement: next, unmountBayId: bayId };
  } else {
    return {
      updatedSettlement: next,
      tankUpdate: {
        tankNo,
        fields: {
          node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
          location: 'ORU NIAS',
          position: 'LAYDOWN 1 (EMPTY)',
          level: 2,
          remarks: 'Regasification Complete - Empty Staged',
          isMountedToBay: null,
        },
      },
    };
  }
}

export function applyGasQualityRecord(
  prev: GasQualityMasterRecord[],
  newRecord: GasQualityMasterRecord
): GasQualityMasterRecord[] {
  const existingIndex = prev.findIndex((r) => r.date === newRecord.date);
  let updated: GasQualityMasterRecord[];
  if (existingIndex >= 0) {
    updated = [...prev];
    updated[existingIndex] = newRecord;
  } else {
    updated = [newRecord, ...prev];
  }
  updated.sort((a, b) => (b.date > a.date ? 1 : -1));
  return updated;
}

export function createFlobossAndGCEntries(
  floboss: Partial<GasCompositionComparison>,
  gc: Partial<GasCompositionComparison>
): GasCompositionComparison[] {
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
  return entries;
}
