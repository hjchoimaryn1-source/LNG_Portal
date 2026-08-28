// src/components/locations/arun/ArunDispatchTab.tsx
"use client";

import React, { useMemo } from 'react';
import {
  Boxes,
  Ship,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Weight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { NodeState } from '../../../types/lng';
import { getTankPhysicalMetrics } from '../../../data/mockTankData';

interface ArunDispatchTabProps {
  activeBatchRecords?: any[];
  onSuccessToast?: (msg: string) => void;
  onNavigateToSaviour?: () => void;
  onNavigateToLoading?: () => void;
}

// 10 Standard Fallback Demo Tanks matching Arun COQ Batch N-2
const DEFAULT_STAGED_TANKS = Array.from({ length: 10 }).map((_, idx) => {
  const num = idx + 1;
  const tankNo = `ISOT-${String(num).padStart(3, '0')}`;
  const serialNo = `TRSU-8101${380 + num}`;
  const metrics = getTankPhysicalMetrics(tankNo, serialNo);
  const netMassKg = 13723 + (idx % 3) * 45;
  const density = 442.02;
  const netVolM3 = parseFloat((netMassKg / density).toFixed(2));
  const delivGhv = 52214.94;
  const deliveredMmbtu = parseFloat(((netMassKg * delivGhv) / 1000000).toFixed(2));

  return {
    tankNo,
    serialNo,
    cargoNo: `001-25-EPI-LN${String(num).padStart(2, '0')}`,
    tareKg: 11295,
    grossKg: 11295 + netMassKg,
    netMassKg,
    liquidTempC: -160.0,
    densityKgM3: density,
    ghvBtuScf: 1056.4,
    deliveredGHV: delivGhv,
    netVolM3,
    deliveredMmbtu,
    pressureMPa: metrics.pressureMPa || 0.31,
    tempC: metrics.tempC || -129.0,
    ch4: 95.50,
    c2h6: 3.39,
    c3h8: 0.77,
    iC4: 0.12,
    nC4: 0.14,
    iC5: 0.03,
    nC5: 0.01,
    n2: 0.04,
    certifiedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    status: 'STAGED AT BERTH 2 / READY FOR CRANE EMBARKATION',
  };
});

export default function ArunDispatchTab({
  activeBatchRecords = [],
  onSuccessToast,
  onNavigateToSaviour,
  onNavigateToLoading,
}: ArunDispatchTabProps) {
  const portalData = usePortalData() || {};
  const batchTransitionTanks = portalData.batchTransitionTanks || (() => {});

  // Staged tanks list: live certified from Tab 2 or realistic fallback
  const stagedTanks = useMemo(() => {
    if (activeBatchRecords && activeBatchRecords.length > 0) {
      return activeBatchRecords;
    }
    return DEFAULT_STAGED_TANKS;
  }, [activeBatchRecords]);

  const stagedCount = stagedTanks.length;

  const totalNetMassKg = useMemo(() => {
    return stagedTanks.reduce((acc, t) => acc + (t.netMassKg || t.deliveredWeightKg || 0), 0);
  }, [stagedTanks]);

  const totalNetVolM3 = useMemo(() => {
    return stagedTanks.reduce((acc, t) => acc + (t.netVolM3 || t.deliveredVolumeM3 || 0), 0);
  }, [stagedTanks]);

  const totalEnergyMMBtu = useMemo(() => {
    return stagedTanks.reduce((acc, t) => acc + (t.deliveredMmbtu || t.deliveredMMBtu || 0), 0);
  }, [stagedTanks]);

  const handleHandoverToSavior = () => {
    if (stagedCount === 0) {
      alert('No tanks currently staged at Berth 2.');
      return;
    }

    const tankNos = stagedTanks.map((t) => t.tankNo);
    batchTransitionTanks(tankNos, NodeState.NODE_2_MV_SAVIOUR_TRANSIT);

    if (onSuccessToast) {
      onSuccessToast(
        `🚢 Successfully handed over ${stagedCount} staged tanks (${totalEnergyMMBtu.toFixed(2)} MMBtu) to MV. SAVIOUR!`
      );
    }

    if (onNavigateToSaviour) {
      onNavigateToSaviour();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 select-none">
      {/* 1. Staging Hub Header Banner */}
      <div className="bg-[#0a2558] border-2 border-t-blue-400 border-l-blue-400 border-b-[#001030] border-r-[#001030] text-white p-3 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#051636] border border-blue-400/50 rounded shadow-inner">
              <Boxes className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wider text-white">
                  PAGT ARUN — BERTH 2 STAGING &amp; VESSEL DISPATCH
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/60 rounded">
                  BERTH 2 ACTIVE
                </span>
              </div>
              <p className="text-xs text-cyan-200/90 font-mono">
                Pre-Embarkation ISO Tank Buffer &amp; Custody Handover Hub for MV. SAVIOUR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="bg-[#051636] border border-blue-400/40 px-2.5 py-1 text-emerald-300 font-bold">
              {stagedCount}/10 Units Staged
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-center font-mono">
        <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2.5 shadow-sm">
          <span className="text-[10.5px] text-slate-600 font-sans font-bold block uppercase">
            STAGED BATCH BUFFER
          </span>
          <div className="text-xl font-black text-[#0a2558]">
            {stagedCount} / 10 Tanks
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Ready for Crane Lift</span>
        </div>

        <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2.5 shadow-sm">
          <span className="text-[10.5px] text-slate-600 font-sans font-bold block uppercase">
            TOTAL NET LIQUID MASS
          </span>
          <div className="text-xl font-black text-blue-950">
            {totalNetMassKg.toLocaleString()} kg
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Delivered Net Mass</span>
        </div>

        <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2.5 shadow-sm">
          <span className="text-[10.5px] text-slate-600 font-sans font-bold block uppercase">
            TOTAL LIQUID VOLUME
          </span>
          <div className="text-xl font-black text-blue-900">
            {totalNetVolM3.toFixed(2)} m³
          </div>
          <span className="text-[10px] text-slate-500 font-sans">~95% Safe Filling Cap</span>
        </div>

        <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2.5 shadow-sm">
          <span className="text-[10.5px] text-slate-600 font-sans font-bold block uppercase">
            TOTAL DELIVERED ENERGY
          </span>
          <div className="text-xl font-black text-emerald-800">
            {totalEnergyMMBtu.toFixed(2)} MMBtu
          </div>
          <span className="text-[10px] text-slate-500 font-sans">COQ Certified Energy</span>
        </div>
      </div>

      {/* 3. Staged Tank Batch Grid (10 Units) */}
      <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-3 shadow-sm space-y-3">
        <div className="bg-[#0a2558] text-white px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-300" />
            <span className="text-xs font-bold uppercase tracking-wide text-white">
              BERTH 2 STAGED TANK BATCH BUFFER ({stagedCount} UNITS)
            </span>
          </div>
          <div className="text-xs font-bold text-cyan-200 font-mono">
            Status: STAGED AT BERTH 2 / READY FOR CRANE EMBARKATION
          </div>
        </div>

        {/* 10-Grid of Staged Tank Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 font-mono">
          {stagedTanks.map((tank, idx) => (
            <div
              key={`${tank.tankNo}-${idx}`}
              className="bg-[#f4f2e6] border-2 border-[#0a2558] p-2.5 flex flex-col justify-between gap-1.5 shadow-sm rounded-none hover:bg-blue-50/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <span className="text-[10px] font-bold bg-[#0a2558] text-white px-1.5 py-0.2">
                  BAY #{String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">
                  READY
                </span>
              </div>

              {/* Tank Identifiers */}
              <div>
                <div className="text-sm font-black text-blue-950">{tank.tankNo}</div>
                <div className="text-[10.5px] text-slate-600 font-bold">{tank.serialNo || 'TRSU-ARUN'}</div>
              </div>

              {/* Physical Parameters */}
              <div className="bg-[#e5e1d0] p-1.5 text-[11px] font-bold text-[#0a2558] space-y-0.5">
                <div className="flex justify-between">
                  <span>Net:</span>
                  <span>{(tank.netMassKg || tank.deliveredWeightKg || 0).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>P: {typeof tank.pressureMPa === 'number' ? tank.pressureMPa.toFixed(2) : '0.31'} MPa</span>
                  <span>T: {typeof tank.tempC === 'number' ? tank.tempC.toFixed(1) : '-129.0'}°C</span>
                </div>
              </div>

              {/* Energy Readout */}
              <div className="text-[11px] font-black text-emerald-800 flex justify-between items-center pt-0.5">
                <span>⚡ {(tank.deliveredMmbtu || tank.deliveredMMBtu || 0).toFixed(2)} MMBtu</span>
                <span className="text-slate-600 font-normal text-[10px]">{(tank.netVolM3 || tank.deliveredVolumeM3 || 0).toFixed(1)} m³</span>
              </div>

              {/* Footer Status */}
              <div className="border-t border-slate-300 pt-1 text-[9.5px] text-slate-500 font-sans flex items-center justify-between">
                <span>Certified: {tank.certifiedAt || '10:00'}</span>
                <span className="text-emerald-700 font-bold">✓ Inspected</span>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Terminal Handover & Dispatch Action Bar */}
        <div className="pt-2 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs font-mono text-slate-700">
            <span className="font-bold text-[#0a2558]">Gantry Crane Status:</span> Active / Gantry #01 &amp; #02 ready for vessel lift-on.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateToLoading && (
              <button
                type="button"
                onClick={onNavigateToLoading}
                className="px-3 py-2 bg-[#d4d0c8] hover:bg-[#c0bcaf] text-slate-900 font-bold text-xs border border-[#808080] cursor-pointer"
              >
                ← Back to Loading
              </button>
            )}

            <button
              type="button"
              onClick={handleHandoverToSavior}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-700 via-[#12397a] to-[#0a2558] hover:from-emerald-600 hover:to-[#071a3d] text-white font-bold text-xs sm:text-sm rounded shadow-md border-2 border-t-emerald-300 border-l-emerald-300 border-b-[#001030] border-r-[#001030] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Ship className="w-4 h-4 text-cyan-300" />
              <span>🚢 Handover Batch to MV. SAVIOUR →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
