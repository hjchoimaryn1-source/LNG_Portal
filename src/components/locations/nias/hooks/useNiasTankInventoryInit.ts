// src/components/locations/nias/hooks/useNiasTankInventoryInit.ts
import React from 'react';
import { DailyMasterRecord, FleetTankItem, NodeState } from '../../../../types/lng';
import { NiasTankAsset, NiasZone } from '../../NiasTerminalView';

interface UseNiasTankInventoryInitOptions {
  fleetTanks: FleetTankItem[];
  dailyMasterRecords: DailyMasterRecord[];
  tankInventory: NiasTankAsset[];
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
}

/**
 * Encapsulates the one-time seeding of the Unified Tank Inventory from global
 * fleet/daily-master-record state (zone resolution, slot assignment, telemetry
 * fallback defaults).
 * Extracted verbatim from NiasTerminalView (lines 283-391).
 */
export function useNiasTankInventoryInit({
  fleetTanks,
  dailyMasterRecords,
  tankInventory,
  setTankInventory,
}: UseNiasTankInventoryInitOptions) {
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
      const NIAS_YARD1_ORDER: Record<string, number> = {
        'ISOT-014': 1,
        'ISOT-017': 2,
        'ISOT-026': 3,
        'ISOT-031': 4,
        'ISOT-036': 5,
        'ISOT-086': 6,
        'ISOT-088': 7,
        'ISOT-103': 8,
        'ISOT-120': 9,
      };

      const initialInventory: NiasTankAsset[] = niasTanks.map((t, idx) => {
        let zone: NiasZone = 'LAYDOWN_1';
        if (
          t.tankNo === 'ISOT-064' ||
          t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
          t.position?.toLowerCase().includes('laydown 2') ||
          t.position?.toLowerCase().includes('yard 2') ||
          t.position?.toLowerCase().includes('laydown 3') ||
          t.remarks?.toLowerCase().includes('empty')
        ) {
          zone = 'LAYDOWN_2';
        } else if (
          t.tankNo === 'ISOT-009' ||
          t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
          t.position?.toLowerCase().includes('bay 01') ||
          t.position?.toLowerCase().includes('bay_01') ||
          t.isMountedToBay === 'Bay 01'
        ) {
          zone = 'BAY_01';
        } else if (t.position?.toLowerCase().includes('bay 02') || t.position?.toLowerCase().includes('bay_02') || t.isMountedToBay === 'Bay 02') {
          zone = 'BAY_02';
        } else if (t.position?.toLowerCase().includes('bay 03') || t.position?.toLowerCase().includes('bay_03') || t.isMountedToBay === 'Bay 03') {
          zone = 'BAY_03';
        } else if (t.position?.toLowerCase().includes('bay 04') || t.position?.toLowerCase().includes('bay_04') || t.isMountedToBay === 'Bay 04') {
          zone = 'BAY_04';
        } else {
          zone = 'LAYDOWN_1';
        }

        const existingRecord =
          dailyMasterRecords.find(r => r.tankNo === t.tankNo && r.reportDate === '2026-08-13') ||
          dailyMasterRecords.find(r => r.tankNo === t.tankNo);

        const assignedSlot =
          zone === 'LAYDOWN_2'
            ? t.tankNo === 'ISOT-064' ? 1 : (t.position?.includes('Slot') ? parseInt(t.position.match(/Slot\s*(\d+)/i)?.[1] || '1', 10) : 1)
            : zone === 'LAYDOWN_1'
              ? NIAS_YARD1_ORDER[t.tankNo] || (t.position?.includes('Slot') ? parseInt(t.position.match(/Slot\s*(\d+)/i)?.[1] || '1', 10) : (idx % 12) + 1)
              : 0;

        const resolvedLevel = (t.level && t.level > 0)
          ? t.level
          : (existingRecord?.level && existingRecord.level > 0)
            ? existingRecord.level
            : (zone === 'LAYDOWN_2' ? 4.0 : 50);

        const resolvedLevelM3 = (t.levelM3 && t.levelM3 > 0)
          ? t.levelM3
          : (existingRecord?.levelM3 && existingRecord.levelM3 > 0)
            ? existingRecord.levelM3
            : parseFloat(((resolvedLevel / 100) * 45).toFixed(1));

        const resolvedLevelMm = (t.levelMmH2O && t.levelMmH2O > 0)
          ? t.levelMmH2O
          : (existingRecord?.levelMmH2O && existingRecord.levelMmH2O > 0)
            ? existingRecord.levelMmH2O
            : Math.round(resolvedLevel * 10);

        const resolvedPressure = (t.pressureMPa && t.pressureMPa > 0)
          ? t.pressureMPa
          : (existingRecord?.pressureMPa && existingRecord.pressureMPa > 0)
            ? existingRecord.pressureMPa
            : (zone === 'LAYDOWN_2' ? 0.22 : 0.76);

        const resolvedTemp = (t.tempC && t.tempC !== 0)
          ? t.tempC
          : (existingRecord?.tempC && existingRecord.tempC !== 0)
            ? existingRecord.tempC
            : (zone === 'LAYDOWN_2' ? -135.0 : -126.5);

        return {
          id: t.tankNo,
          serialNo: t.serialNo,
          shipment: existingRecord?.shipment || 'N1',
          currentZone: zone,
          slotIndex: assignedSlot,
          levelPercent: resolvedLevel,
          levelM3: resolvedLevelM3,
          levelMmH2O: resolvedLevelMm,
          pressureMpa: resolvedPressure,
          tempC: resolvedTemp,
          batteryPercent: existingRecord?.battery || t.battery || 80,
        };
      });
      setTankInventory(initialInventory);
    }
  }, [fleetTanks, dailyMasterRecords]);
}

export default useNiasTankInventoryInit;
