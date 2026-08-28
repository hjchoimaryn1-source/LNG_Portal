// src/components/locations/arun/ArunLoadingTab.tsx
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Ship,
  ShieldCheck,
  Flame,
  Truck,
  Gauge,
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { NodeState } from '../../../types/lng';
import { getTankPhysicalMetrics } from '../../../data/mockTankData';

interface ArunLoadingTabProps {
  activeBatchRecords?: any[];
  setActiveBatchRecords?: React.Dispatch<React.SetStateAction<any[]>>;
  onSuccessToast?: (msg: string) => void;
  onNavigateToLedger?: () => void;
}

const DEFAULT_FALLBACK_TANKS = Array.from({ length: 10 }).map((_, idx) => {
  const num = idx + 1;
  const tankNo = `ISOT-${String(num).padStart(3, '0')}`;
  const serialNo = `TRSU-8101${380 + num}`;
  const metrics = getTankPhysicalMetrics(tankNo, serialNo);
  const netMassKg = 13723 + (idx % 3) * 45;
  const tareKg = 11295;
  const grossKg = tareKg + netMassKg;
  const density = 442.02;
  const netVolM3 = Number((netMassKg / density).toFixed(2));
  const deliveredMmbtu = Number(((netMassKg * 52214.94) / 1000000).toFixed(2));

  return {
    tankNo,
    serialNo,
    cargoNo: `001-25-EPI-LN${String(num).padStart(2, '0')}`,
    tareKg,
    grossKg,
    netMassKg,
    densityKgM3: density,
    ghvBtuScf: 1056.4,
    deliveredGHV: 52214.94,
    ch4: 95.50,
    c2h6: 3.39,
    c3h8: 0.77,
    iC4: 0.12,
    nC4: 0.14,
    iC5: 0.03,
    nC5: 0.01,
    n2: 0.04,
    netVolM3,
    deliveredMmbtu,
    pressureMPa: metrics.pressureMPa || 0.31,
    tempC: metrics.tempC || -129.0,
    status: 'LOADED & LASHED',
  };
});

export default function ArunLoadingTab({
  activeBatchRecords = [],
  setActiveBatchRecords,
  onSuccessToast,
  onNavigateToLedger,
}: ArunLoadingTabProps) {
  const portalData = usePortalData() || {};
  const batchTransitionTanks = portalData.batchTransitionTanks || (() => {});
  const addDeliveredMeasurement = portalData.addDeliveredMeasurement || (() => {});

  const certifiedTanks = useMemo(() => {
    return Array.isArray(activeBatchRecords) ? activeBatchRecords : [];
  }, [activeBatchRecords]);

  const totalAvailableTanks = useMemo(() => {
    return certifiedTanks;
  }, [certifiedTanks]);

  const currentBatchId = useMemo(() => {
    if (certifiedTanks.length === 0) return 'Batch N-2';
    const raw = certifiedTanks[0]?.batchId || certifiedTanks[0]?.shipment || certifiedTanks[0]?.batch || 'Batch N-2';
    return String(raw).startsWith('Batch') ? raw : `Batch ${raw}`;
  }, [certifiedTanks]);

  const targetBatch = useMemo(() => {
    if (certifiedTanks.length === 0) return 'N-2';
    const raw = certifiedTanks[0]?.batchId || certifiedTanks[0]?.shipment || certifiedTanks[0]?.batch || 'N-2';
    return String(raw).startsWith('Batch') ? raw : `Batch ${raw}`;
  }, [certifiedTanks]);

  const densityKgM3 = useMemo(() => {
    if (certifiedTanks.length === 0) return 442.02;
    const value = certifiedTanks[0]?.densityKgM3 ?? certifiedTanks[0]?.density ?? 442.02;
    return Number(value) || 442.02;
  }, [certifiedTanks]);

  const coqGhvValue = useMemo(() => {
    if (certifiedTanks.length === 0) return 1056.4;
    const value = certifiedTanks[0]?.ghvBtuScf ?? certifiedTanks[0]?.deliveredGHV ?? 1056.4;
    return Number(value) || 1056.4;
  }, [certifiedTanks]);

  const embarkationRows = useMemo(() => {
    if (!certifiedTanks || certifiedTanks.length === 0) return [];
    return certifiedTanks.map((tank, idx) => {
      const statusText = String(
        tank?.status || tank?.repairStatus || tank?.pipelineStatus || 'CERTIFIED / STAGED'
      ).toUpperCase();
      const isRepair =
        statusText.includes('REPAIR') ||
        statusText.includes('EMPTY / REPAIR') ||
        tank?.repairStatus === 'EMPTY / REPAIR' ||
        tank?.status === 'EMPTY / REPAIR';
      const isCertified = !isRepair;
      const tareKg = Number(tank?.tareKg ?? tank?.weightBeforeKg ?? 11295);
      const grossKg = Number(tank?.grossKg ?? tank?.weightAfterKg ?? (isRepair ? tareKg : tareKg + (tank?.netMassKg ?? 0)));
      const netMassKg = isRepair ? 0 : Number(tank?.netMassKg ?? tank?.deliveredWeightKg ?? (grossKg > tareKg ? grossKg - tareKg : 0));
      const pressureMPa = Number(tank?.pressureMPa ?? 0.31);
      const tempC = Number(tank?.tempC ?? tank?.liquidTempC ?? -160.0);
      const density = Number(tank?.densityKgM3 ?? tank?.density ?? densityKgM3);
      const netVolM3 = isRepair ? 0 : Number(tank?.netVolM3 ?? tank?.deliveredVolumeM3 ?? (density > 0 ? (netMassKg / density).toFixed(2) : 0));
      const massGhv = Number(tank?.deliveredGHV ?? tank?.ghvBtuScf ?? 52214.94);
      const ch4 = Number(tank?.ch4 ?? tank?.methane ?? 95.50);
      const c2h6 = Number(tank?.c2h6 ?? tank?.ethane ?? 3.39);
      const c3h8 = Number(tank?.c3h8 ?? tank?.propane ?? 0.77);
      const iC4 = Number(tank?.iC4 ?? tank?.iButane ?? 0.12);
      const nC4 = Number(tank?.nC4 ?? tank?.nButane ?? 0.14);
      const iC5 = Number(tank?.iC5 ?? tank?.iPentane ?? 0.03);
      const nC5 = Number(tank?.nC5 ?? tank?.nPentane ?? 0.01);
      const n2 = Number(tank?.n2 ?? tank?.nitrogen ?? 0.04);
      const energyMMBtu = isRepair ? 0 : Number(
        tank?.deliveredMmbtu ??
          tank?.deliveredMMBtu ??
          tank?.energyMMBtu ??
          (netMassKg ? (netMassKg * massGhv) / 1000000 : 0)
      );

      return {
        no: idx + 1,
        tankId: tank?.tankNo ?? `ISOT-${String(idx + 1).padStart(3, '0')}`,
        serialNo: tank?.serialNo ?? `TRSU-8101${380 + idx + 1}`,
        tareKg,
        grossKg,
        netMassKg,
        pressureMPa,
        tempC,
        density,
        netVolM3,
        massGhv,
        ch4,
        c2h6,
        c3h8,
        iC4,
        nC4,
        iC5,
        nC5,
        n2,
        energyMMBtu,
        isRepair,
        isCertified,
        statusLabel: isRepair ? 'Repair' : 'Certified',
        selected: true,
      };
    });
  }, [certifiedTanks, densityKgM3]);

  const batchTargetCount = 10;

  const [selectedTanks, setSelectedTanks] = useState<Set<string>>(() =>
    new Set((certifiedTanks || []).map((tank) => tank.tankNo).filter(Boolean))
  );

  useEffect(() => {
    setSelectedTanks((prev) => {
      const next = new Set<string>();
      (certifiedTanks || []).forEach((tank) => {
        if (tank?.tankNo && (prev.has(tank.tankNo) || true)) {
          next.add(tank.tankNo);
        }
      });
      return next;
    });
  }, [certifiedTanks]);

  const toggleTankSelection = (tankId: string) => {
    setSelectedTanks((prev) => {
      const next = new Set(prev);
      if (next.has(tankId)) {
        next.delete(tankId);
      } else {
        next.add(tankId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTanks.size === embarkationRows.length) {
      setSelectedTanks(new Set());
    } else {
      setSelectedTanks(new Set(embarkationRows.map((row) => row.tankId)));
    }
  };

  const selectedRows = useMemo(
    () => embarkationRows.filter((row) => selectedTanks.has(row.tankId)),
    [embarkationRows, selectedTanks]
  );

  const selectedCount = selectedTanks.size;
  const totalCount = embarkationRows.length;
  const commercialRows = useMemo(
    () => selectedRows.filter((row) => !row.isRepair),
    [selectedRows]
  );
  const repairRows = useMemo(
    () => selectedRows.filter((row) => row.isRepair),
    [selectedRows]
  );
  const selectedCommercialCount = commercialRows.length;
  const selectedRepairCount = repairRows.length;
  const commercialCount = selectedCommercialCount;
  const repairCount = selectedRepairCount;

  const custodyStatusPct = useMemo(() => {
    if (!totalCount) return 0;
    return Math.round((selectedCount / totalCount) * 100);
  }, [selectedCount, totalCount]);

  const totalLoadedCount = selectedCount;

  // Commercial / Certified Only Aggregation (Excludes Repair Tanks)
  const selectedNetMassKg = useMemo(
    () => commercialRows.reduce((sum, row) => sum + (row.netMassKg || 0), 0),
    [commercialRows]
  );
  const selectedGrossKg = useMemo(
    () => commercialRows.reduce((sum, row) => sum + (row.grossKg || 0), 0),
    [commercialRows]
  );
  const selectedTareKg = useMemo(
    () => commercialRows.reduce((sum, row) => sum + (row.tareKg || 0), 0),
    [commercialRows]
  );
  const selectedVolumeM3 = useMemo(
    () => commercialRows.reduce((sum, row) => sum + Number((row.netVolM3 || 0).toFixed(2)), 0),
    [commercialRows]
  );
  const selectedMMBtu = useMemo(
    () => commercialRows.reduce((sum, row) => sum + (row.energyMMBtu || 0), 0),
    [commercialRows]
  );
  const avgDensity = useMemo(
    () =>
      commercialRows.length > 0
        ? commercialRows.reduce((sum, row) => sum + row.density, 0) / commercialRows.length
        : 442.02,
    [commercialRows]
  );
  const avgTemp = useMemo(
    () =>
      commercialRows.length > 0
        ? commercialRows.reduce((sum, row) => sum + row.tempC, 0) / commercialRows.length
        : -128.5,
    [commercialRows]
  );

  const totalNetMassKg = selectedNetMassKg;
  const totalGrossKg = selectedGrossKg;
  const totalTareKg = selectedTareKg;
  const totalVolumeM3 = selectedVolumeM3;
  const totalMMBtu = selectedMMBtu;

  const handleCompleteLoading = () => {
    const tankNos = selectedRows.map((row) => row.tankId);

    if (tankNos.length === 0) {
      if (onSuccessToast) {
        onSuccessToast('Please select at least one tank before dispatching to MV. SAVIOUR.');
      }
      return;
    }

    selectedRows.forEach((row) => {
      const tankSource = certifiedTanks.find((tank) => tank.tankNo === row.tankId) || {};
      const shipmentValue = String(
        tankSource.shipment || tankSource.batchId || tankSource.batch || 'N-2'
      ).replace(/^Batch\s+/i, '');

      addDeliveredMeasurement(
        {
          tankNo: row.tankId,
          serialNo: row.serialNo,
          shipment: shipmentValue,
          date: new Date().toISOString().split('T')[0],
          deliveredWeightKg: row.netMassKg,
          deliveredVolumeM3: row.netVolM3,
          deliveredDensity: row.density,
          deliveredTempC: row.tempC,
          deliveredGHV: row.massGhv,
          deliveredMMBtu: row.energyMMBtu,
          remarks: 'Dispatched to MV. SAVIOUR and archived to Ledger',
          ...(targetBatch ? { batchId: targetBatch } : {}),
        } as any,
        {
          source: 'Arun Terminal Dispatch',
          samplePoint: `${row.tankId} / ${row.serialNo}`,
          shipment: shipmentValue,
          reportDate: new Date().toISOString().split('T')[0],
          ghv: row.massGhv,
        } as any
      );
    });

    batchTransitionTanks(tankNos, NodeState.NODE_2_MV_SAVIOUR_TRANSIT);

    // Flush dispatched tanks from Tab 3 loading queue
    if (setActiveBatchRecords) {
      setActiveBatchRecords((prev) => prev.filter((r) => !tankNos.includes(r.tankNo)));
    }

    setSelectedTanks(new Set());

    if (onSuccessToast) {
      onSuccessToast(
        `${targetBatch || 'Batch N-2'} (${tankNos.length} tanks) archived to ledger and dispatched to MV. SAVIOUR.`
      );
    }

    if (onNavigateToLedger) {
      onNavigateToLedger();
    }
  };

  const handleOpenSaviourStowage = () => {
    if (typeof window !== 'undefined') {
      window.alert('Proceed to MV. SAVIOUR Stowage Management for final deck assignment and trim planning.');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="win-panel overflow-hidden border border-slate-300">
          <div className="bg-[#0a2558] text-white text-xs font-bold px-2.5 py-1 flex justify-between items-center">
            <span className="uppercase tracking-wider">1. BATCH COMPOSITION</span>
            <Ship className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="bg-white p-2.5 border border-[#cfccc0] text-slate-900">
            <div className="space-y-2 text-[11px] text-slate-700">
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Selected / Total:</span>
                <span className="font-black text-[#0a2558]">{selectedCount} / {totalCount} Units</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Target Batch:</span>
                <span className="font-bold text-slate-900">{targetBatch || 'Batch N-2'}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <span className="font-semibold text-slate-700">Cargo Breakdown:</span>
                <span className="font-bold text-emerald-700">{selectedCommercialCount} Certified | {selectedRepairCount} Repair</span>
              </div>
            </div>
          </div>
        </div>

        <div className="win-panel overflow-hidden border border-slate-300">
          <div className="bg-[#0a2558] text-white text-xs font-bold px-2.5 py-1 flex justify-between items-center">
            <span className="uppercase tracking-wider">2. NET DISPATCH MASS</span>
            <Truck className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="bg-white p-2.5 border border-[#cfccc0] text-slate-900">
            <div className="space-y-2 text-[11px] text-slate-700">
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Total Net Mass:</span>
                <span className="font-black text-[#0a2558]">{totalNetMassKg.toLocaleString()} kg</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Total Gross:</span>
                <span className="font-bold text-slate-900">{totalGrossKg.toLocaleString()} kg</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <span className="font-semibold text-slate-700">Tare Baseline:</span>
                <span className="font-bold text-slate-900">{totalTareKg.toLocaleString()} kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="win-panel overflow-hidden border border-slate-300">
          <div className="bg-[#0a2558] text-white text-xs font-bold px-2.5 py-1 flex justify-between items-center">
            <span className="uppercase tracking-wider">3. NET LIQUID VOLUME</span>
            <Gauge className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="bg-white p-2.5 border border-[#cfccc0] text-slate-900">
            <div className="space-y-2 text-[11px] text-slate-700">
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Liquid Volume:</span>
                <span className="font-black text-[#0a2558]">{totalVolumeM3.toFixed(2)} m³</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Avg Cargo Density:</span>
                <span className="font-bold text-slate-900">
                  {commercialRows.length > 0 ? `${avgDensity.toFixed(2)} kg/m³` : '--'}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <span className="font-semibold text-slate-700">Holding Temp:</span>
                <span className="font-bold text-slate-900">
                  {commercialRows.length > 0 ? `${avgTemp.toFixed(1)} °C` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="win-panel overflow-hidden border border-slate-300">
          <div className="bg-[#0a2558] text-white text-xs font-bold px-2.5 py-1 flex justify-between items-center">
            <span className="uppercase tracking-wider">4. DELIVERED ENERGY</span>
            <Flame className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="bg-white p-2.5 border border-[#cfccc0] text-slate-900">
            <div className="space-y-2 text-[11px] text-slate-700">
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Delivered Energy:</span>
                <span className="font-black text-[#0a2558]">{totalMMBtu.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MMBtu</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-700">Certified GHV:</span>
                <span className="font-bold text-slate-900">
                  {commercialRows.length > 0 ? '52,214.94 Btu/kg' : '--'}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <span className="font-semibold text-slate-700">Billing Status:</span>
                <span className={`font-bold ${commercialRows.length > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {commercialRows.length > 0 ? 'Certified Final' : 'Non-Commercial (N/A)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-3 shadow-sm">
        <div className="bg-[#0a2558] text-white px-3 py-1.5 flex justify-between items-center rounded-t text-xs font-bold uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PAGT (ARUN)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              type="button"
              onClick={handleCompleteLoading}
              className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-slate-800 shadow-sm font-bold text-xs px-3 py-1 cursor-pointer transition-all"
            >
              To M/V Saviour
            </button>
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto overflow-x-auto border border-[#a09e90] border-t-0 bg-white">
          <table className="w-full min-w-[1300px] border-collapse text-[11px] text-slate-800">
            <thead className="sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider select-none">
              <tr className="border-b border-[#a09e90] bg-[#e8e6df] text-[#0a2558] text-[10px] text-center font-bold">
                <th colSpan={1} rowSpan={2} className="border border-[#a09e90] px-2 py-2 text-center align-middle whitespace-nowrap bg-[#e8e6df] text-[#0a2558]">
                  <input
                    type="checkbox"
                    checked={selectedTanks.size > 0 && selectedTanks.size === embarkationRows.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 accent-emerald-600 cursor-pointer"
                    aria-label="Select all rows"
                    title="Select all"
                  />
                </th>
                <th colSpan={1} rowSpan={2} className="border border-[#a09e90] px-2 py-2 text-center align-middle whitespace-nowrap bg-[#e8e6df] text-[#0a2558]">
                  NO
                </th>
                <th colSpan={2} className="border border-[#a09e90] px-2 py-1 text-center whitespace-nowrap bg-[#e8e6df] text-[#0a2558]">Tank No.</th>
                <th colSpan={3} className="border border-[#a09e90] px-2 py-1 text-center whitespace-nowrap bg-[#e8e6df] text-[#0a2558]">Weight Scale</th>
                <th colSpan={3} className="border border-[#a09e90] px-2 py-1 text-center whitespace-nowrap bg-[#e8e6df] text-[#0a2558]">Properties</th>
                <th colSpan={8} className="border border-[#a09e90] px-2 py-1 text-center whitespace-nowrap bg-[#e8e6df] text-[#0a2558]">Component</th>
                <th colSpan={2} className="border border-[#a09e90] px-2 py-1 text-center whitespace-nowrap bg-[#e8e6df] text-[#0a2558]">Delivered</th>
                <th colSpan={1} rowSpan={2} className="border border-[#a09e90] px-1.5 py-1 text-center align-middle whitespace-nowrap bg-[#e8e6df] text-[#0a2558] text-xs">STATUS</th>
              </tr>
              <tr className="border-b border-[#a09e90] bg-[#e8e6df] text-[#0a2558] text-[11px] font-bold text-center leading-tight">
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">ISO TANK NO</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap min-w-[100px]">SERIAL NO</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  TARE<br/><span className="text-[10px] text-slate-500 font-normal">(KG)</span>
                </th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  GROSS<br/><span className="text-[10px] text-slate-500 font-normal">(KG)</span>
                </th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  NET MASS<br/><span className="text-[10px] text-slate-500 font-normal">(KG)</span>
                </th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  TEMP<br/><span className="text-[10px] text-slate-500 font-normal">(°C)</span>
                </th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  DENSITY<br/><span className="text-[10px] text-slate-500 font-normal">(KG/M³)</span>
                </th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  GHV<br/><span className="text-[10px] text-slate-500 font-normal">(BTU/KG)</span>
                </th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">CH₄</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">C₂H₆</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">C₃H₈</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">i-C₄</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">n-C₄</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">i-C₅</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">n-C₅</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center text-xs font-mono whitespace-nowrap">N₂</th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  NET VOL<br/><span className="text-[10px] text-slate-500 font-normal">(M³)</span>
                </th>
                <th className="border border-[#a09e90] px-1.5 py-1 text-center whitespace-nowrap">
                  ENERGY<br/><span className="text-[10px] text-slate-500 font-normal">(MMBTU)</span>
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px]">
              {embarkationRows.length === 0 ? (
                <tr>
                  <td colSpan={21} className="text-center py-10 text-slate-500 font-sans text-xs font-bold bg-[#fcfbf7]">
                    No tanks staged for loading.
                  </td>
                </tr>
              ) : (
                embarkationRows.map((row) => {
                  const isSelected = selectedTanks.has(row.tankId);
                  return (
                    <tr key={row.tankId} className="bg-white even:bg-[#f5f7fa] hover:bg-blue-50/70 transition-colors whitespace-nowrap">
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTankSelection(row.tankId)}
                          className="h-4 w-4 accent-emerald-600 cursor-pointer"
                          aria-label={`Select ${row.tankId}`}
                        />
                      </td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center font-bold whitespace-nowrap">{row.no}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center font-mono font-bold text-[#0a2558] whitespace-nowrap min-w-[90px]">{row.tankId}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center font-mono whitespace-nowrap min-w-[100px]">{row.serialNo}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center whitespace-nowrap">{row.tareKg.toLocaleString()}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center whitespace-nowrap">{row.grossKg.toLocaleString()}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center font-bold text-[#0a2558] bg-blue-50/40 whitespace-nowrap">{row.netMassKg.toLocaleString()}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center whitespace-nowrap">{row.tempC.toFixed(1)}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center whitespace-nowrap">{row.density.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center whitespace-nowrap">{row.massGhv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.ch4.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.c2h6.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.c3h8.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.iC4.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.nC4.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.iC5.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.nC5.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-1.5 py-1.5 text-center bg-slate-50/50 whitespace-nowrap">{row.n2.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center font-bold text-blue-900 bg-blue-50/40 whitespace-nowrap">{row.netVolM3.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center font-bold text-emerald-800 bg-emerald-50/40 whitespace-nowrap">{row.energyMMBtu.toFixed(2)}</td>
                      <td className="border border-[#dbe1ea] px-2 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center rounded px-2 py-0.5 font-bold ${
                            row.isRepair
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {row.isRepair ? 'Repair' : 'Certified'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#dfe6ee] text-[#0a2558] font-bold uppercase whitespace-nowrap">
                <td className="border border-[#b7c3d1] px-2 py-2 text-center font-black whitespace-nowrap" colSpan={2}>SUM</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center whitespace-nowrap" colSpan={2}>Selected Items</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center whitespace-nowrap">{totalTareKg.toLocaleString()}</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center whitespace-nowrap">{totalGrossKg.toLocaleString()}</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center font-black text-blue-950 bg-blue-100/50 whitespace-nowrap">{totalNetMassKg.toLocaleString()}</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center whitespace-nowrap" colSpan={3}>—</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center text-slate-600 font-normal bg-slate-100/50 whitespace-nowrap" colSpan={8}>Avg Spec Normalized</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center font-black text-blue-950 bg-blue-100/50 whitespace-nowrap">{totalVolumeM3.toFixed(2)}</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center font-black text-emerald-950 bg-emerald-100/50 whitespace-nowrap">{totalMMBtu.toFixed(2)}</td>
                <td className="border border-[#b7c3d1] px-2 py-2 text-center whitespace-nowrap">Selected</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
