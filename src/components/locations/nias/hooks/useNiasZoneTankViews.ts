// src/components/locations/nias/hooks/useNiasZoneTankViews.ts
import { useMemo } from 'react';
import { ActiveBayState, FleetTankItem, NodeState } from '../../../../types/lng';
import { NiasTankAsset } from '../../NiasTerminalView';

interface UseNiasZoneTankViewsOptions {
  fleetTanks: FleetTankItem[];
  tankInventory: NiasTankAsset[];
  activeBays: ActiveBayState[];
  wsSelectedZoneFilter: string;
  searchQuery: string;
}

/**
 * Encapsulates the Nias zone/tank derived-view computations (yard/bay
 * categorization, workstation filtering, zone aggregations & search filter).
 * Extracted verbatim from NiasTerminalView (lines 682-804).
 */
export function useNiasZoneTankViews({
  fleetTanks,
  tankInventory,
  activeBays,
  wsSelectedZoneFilter,
  searchQuery,
}: UseNiasZoneTankViewsOptions) {
  // Tanks categorized by Nias operations
  const niasTerminalTanks = useMemo(() => {
    return fleetTanks.filter(
      (t) =>
        (t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
          t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
          t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
          t.location.includes('NIAS') ||
          t.position.includes('Laydown') ||
          t.position.includes('ORU')) &&
        !t.isUnderMaintenance
    );
  }, [fleetTanks]);

  const isTankInSelectedZone = (tank: NiasTankAsset, selectedZone: string) => {
    if (!tank) return false;
    if (selectedZone === 'LAYDOWN_1') return tank.currentZone === 'LAYDOWN_1';
    if (selectedZone === 'LAYDOWN_2') return tank.currentZone === 'LAYDOWN_2';
    return true;
  };

  const filteredWorkstationTanks = useMemo(() => {
    const rawFiltered = tankInventory.filter(t => isTankInSelectedZone(t, wsSelectedZoneFilter));

    const uniqueTanks: typeof rawFiltered = [];
    const seen = new Set<string>();
    for (const t of rawFiltered) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        uniqueTanks.push(t);
      }
    }
    return uniqueTanks;
  }, [tankInventory, wsSelectedZoneFilter]);

  const allLaydownTanks = useMemo(() => {
    return tankInventory.filter(
      (t) => t.currentZone === 'LAYDOWN_1' || t.currentZone === 'LAYDOWN_2'
    );
  }, [tankInventory]);

  const emptyReturnTanks = useMemo(() => {
    return fleetTanks.filter(
      (t) => t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE && !t.isUnderMaintenance
    );
  }, [fleetTanks]);

  // Multi-Zone Aggregations & Metrics
  const zoneStats = useMemo(() => {
    const activeBayTanksSet = new Set(activeBays.filter((b) => b.tankNo).map((b) => b.tankNo));

    // Laydown 2 is explicit
    const yard2 = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_2');
    const yard2TankIds = new Set(yard2.map((t) => t.id));

    // Laydown 1 should ONLY show tanks that are neither in Bay nor Laydown 2
    const yard1 = tankInventory.filter(
      (t) => !activeBayTanksSet.has(t.id) && !yard2TankIds.has(t.id) && !t.currentZone.startsWith('BAY')
    );

    const calcAvgPress = (tanks: NiasTankAsset[]) => {
      if (tanks.length === 0) return 0;
      const sum = tanks.reduce((acc, t) => acc + (t.pressureMpa || 0), 0);
      return parseFloat((sum / tanks.length).toFixed(2));
    };

    const depressCount = tankInventory.filter(
      (t) => t.pressureMpa >= 0.70 // Approximate logic for active depress / elevated pressure
    ).length;

    const runningBays = activeBays.filter((b) => b.status === 'RUNNING');
    const totalFlowRate = runningBays.reduce((acc, b) => acc + (b.flowRate || 0), 0);
    const totalFlowNm3h = totalFlowRate * 590; // approximate Nm3/h conversion

    return {
      totalNiasCount: tankInventory.length,
      totalCapacity: 40,
      laydownCount: yard1.length + yard2.length,
      overallAvgPress: calcAvgPress(yard1.concat(yard2)),
      depressCount,
      activeBaysCount: activeBays.filter((b) => !!b.tankNo).length,
      totalFlowRate,
      totalFlowNm3h,
      yard1: {
        tanks: yard1,
        count: yard1.length,
        capacity: 12,
        avgPress: calcAvgPress(yard1),
        normalCount: yard1.filter((t) => (t.pressureMpa || 0) < 0.70).length,
        highCount: yard1.filter((t) => (t.pressureMpa || 0) >= 0.70).length,
      },
      yard2: {
        tanks: yard2,
        count: yard2.length,
        capacity: 12,
        avgPress: calcAvgPress(yard2),
        activeDepressCount: yard2.filter((t) => (t.pressureMpa || 0) >= 0.50).length,
      },
      yard3: {
        tanks: [],
        count: 0,
        capacity: 12,
        avgPress: 0,
        mountReadyCount: 0,
      },
    };
  }, [tankInventory, activeBays]);

  // Filtered Laydown Tanks by Zone and Search
  const filteredLaydownTanks = useMemo(() => {
    return allLaydownTanks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.shipment.toLowerCase().includes(q) ||
        (t.currentZone || '').toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [allLaydownTanks, searchQuery]);

  return {
    niasTerminalTanks,
    filteredWorkstationTanks,
    allLaydownTanks,
    emptyReturnTanks,
    zoneStats,
    filteredLaydownTanks,
  };
}

export default useNiasZoneTankViews;
