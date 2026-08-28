// src/components/locations/arun/ArunSaviorStowageTab.tsx
"use client";

import React, { useState, useMemo } from 'react';
import {
  Ship,
  Anchor,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
  Activity,
  Clock,
  Compass,
  ArrowUpDown,
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { NodeState } from '../../../types/lng';
import { FleetTankItem, getTankPhysicalMetrics } from '../../../data/mockTankData';

export interface StowedSlot {
  slotId: number; // 1 to 10
  slotLabel: string; // e.g. "SLOT 01"
  bay: string; // "BAY 01"
  side: 'PORT' | 'STARBOARD';
  tankData: any | null; // Stowed custody tank or null
}

interface ArunSaviorStowageTabProps {
  activeBatchRecords?: any[];
  onSuccessToast?: (msg: string) => void;
  onNavigateToLedger?: () => void;
}

// 10 Standard Fallback Demo Tanks matching Arun COQ Batch N-2
const DEFAULT_FALLBACK_TANKS = Array.from({ length: 10 }).map((_, idx) => {
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
    status: 'CERTIFIED / STAGED',
  };
});

export default function ArunSaviorStowageTab({
  activeBatchRecords = [],
  onSuccessToast,
  onNavigateToLedger,
}: ArunSaviorStowageTabProps) {
  const portalData = usePortalData() || {};
  const fleetTanks: FleetTankItem[] = portalData.fleetTanks || [];
  const batchTransitionTanks = portalData.batchTransitionTanks || (() => {});

  // Voyage Metadata State
  const [voyageNo, setVoyageNo] = useState<string>('Voy. 26.01');
  const [shipmentBatch, setShipmentBatch] = useState<string>('Batch N-2');
  const [etdDate, setEtdDate] = useState<string>('2026-08-28T16:00');
  const [etaDate, setEtaDate] = useState<string>('2026-08-30T08:00');
  const [isDeparted, setIsDeparted] = useState<boolean>(false);
  const [showDepartureModal, setShowDepartureModal] = useState<boolean>(false);

  // Source candidates: use live certified batch from Tab 2, or fallback to default 10 tanks
  const candidateBatchTanks = useMemo(() => {
    if (activeBatchRecords && activeBatchRecords.length > 0) {
      return activeBatchRecords;
    }
    return DEFAULT_FALLBACK_TANKS;
  }, [activeBatchRecords]);

  // 10 Deck Slots State initialized with candidate tanks
  const [stowedSlots, setStowedSlots] = useState<StowedSlot[]>(() => {
    return Array.from({ length: 10 }).map((_, idx) => {
      const slotId = idx + 1;
      const bayNum = Math.floor(idx / 2) + 1;
      const isPort = idx % 2 === 0;
      const initialTank = candidateBatchTanks[idx] || null;

      return {
        slotId,
        slotLabel: `SLOT ${String(slotId).padStart(2, '0')}`,
        bay: `BAY 0${bayNum}`,
        side: isPort ? 'PORT' : 'STARBOARD',
        tankData: initialTank,
      };
    });
  });

  // Keep slots in sync if candidate tanks change and slots are unassigned
  React.useEffect(() => {
    if (candidateBatchTanks.length > 0) {
      setStowedSlots((prev) =>
        prev.map((slot, idx) => {
          if (!slot.tankData && candidateBatchTanks[idx]) {
            return {
              ...slot,
              tankData: candidateBatchTanks[idx],
            };
          }
          return slot;
        })
      );
    }
  }, [candidateBatchTanks]);

  // Aggregated Manifest Metrics
  const stowedTanksList = useMemo(() => {
    return stowedSlots.map((s) => s.tankData).filter(Boolean);
  }, [stowedSlots]);

  const totalStowedCount = stowedTanksList.length;

  const totalNetMassKg = useMemo(() => {
    return stowedTanksList.reduce((acc, t) => acc + (t.netMassKg || t.deliveredWeightKg || 0), 0);
  }, [stowedTanksList]);

  const totalNetVolM3 = useMemo(() => {
    return stowedTanksList.reduce((acc, t) => acc + (t.netVolM3 || t.deliveredVolumeM3 || 0), 0);
  }, [stowedTanksList]);

  const totalEnergyMMBtu = useMemo(() => {
    return stowedTanksList.reduce((acc, t) => acc + (t.deliveredMmbtu || t.deliveredMMBtu || 0), 0);
  }, [stowedTanksList]);

  // Port vs Starboard Balance
  const portMassKg = useMemo(() => {
    return stowedSlots
      .filter((s) => s.side === 'PORT' && s.tankData)
      .reduce((acc, s) => acc + (s.tankData.netMassKg || s.tankData.deliveredWeightKg || 0), 0);
  }, [stowedSlots]);

  const stbdMassKg = useMemo(() => {
    return stowedSlots
      .filter((s) => s.side === 'STARBOARD' && s.tankData)
      .reduce((acc, s) => acc + (s.tankData.netMassKg || s.tankData.deliveredWeightKg || 0), 0);
  }, [stowedSlots]);

  const massDeltaKg = Math.abs(portMassKg - stbdMassKg);
  const isWellBalanced = massDeltaKg <= 3000;

  // Actions
  const handleAutoStowAll = () => {
    setStowedSlots((prev) =>
      prev.map((slot, idx) => ({
        ...slot,
        tankData: candidateBatchTanks[idx] || null,
      }))
    );
    if (onSuccessToast) {
      onSuccessToast('Auto-allocated all 10 certified batch tanks into MV. SAVIOUR deck slots.');
    }
  };

  const handleClearSlots = () => {
    setStowedSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        tankData: null,
      }))
    );
    if (onSuccessToast) {
      onSuccessToast('Cleared all deck stowage slots.');
    }
  };

  const handleSwapSlots = (fromIdx: number, toIdx: number) => {
    setStowedSlots((prev) => {
      const next = [...prev];
      const temp = next[fromIdx].tankData;
      next[fromIdx] = { ...next[fromIdx], tankData: next[toIdx].tankData };
      next[toIdx] = { ...next[toIdx], tankData: temp };
      return next;
    });
  };

  const handleConfirmDeparture = () => {
    if (totalStowedCount === 0) {
      alert('Please allocate at least 1 ISO tank to MV. SAVIOUR deck before confirming departure.');
      return;
    }

    const tankNos = stowedTanksList.map((t) => t.tankNo);
    batchTransitionTanks(tankNos, NodeState.NODE_2_MV_SAVIOUR_TRANSIT);
    setIsDeparted(true);
    setShowDepartureModal(true);

    if (onSuccessToast) {
      onSuccessToast(
        `🚢 MV. SAVIOUR departed with ${totalStowedCount} ISO Tanks (${totalEnergyMMBtu.toFixed(2)} MMBtu) en route to Nias Island!`
      );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 select-none">
      {/* ========================================================================= */}
      {/* A. Top Voyage & Vessel Metadata Banner                                     */}
      {/* ========================================================================= */}
      <div className="bg-[#0a2558] border-2 border-t-blue-400 border-l-blue-400 border-b-[#001030] border-r-[#001030] text-white p-3 shadow-md rounded-none">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-blue-800/80">
          {/* Left Title & Vessel Identification */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#051636] border border-blue-400/50 rounded shadow-inner">
              <Ship className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wider text-white">
                  MV. SAVIOUR
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/60 rounded">
                  {isDeparted ? 'SAILED / IN-TRANSIT' : 'LADEN / READY FOR SEA PASSAGE'}
                </span>
                <span className="text-xs text-slate-300 font-sans hidden sm:inline">
                  (IMO: 9876543 | Call Sign: YD-9901 | Flag: 🇮🇩 IDN)
                </span>
              </div>
              <p className="text-xs text-cyan-200/90 font-mono">
                Dedicated Cryogenic Marine Feeder Carrier (Capacity: 10 × 40ft/43m³ IMO Type 7 ISO Tanks)
              </p>
            </div>
          </div>

          {/* Right Hazardous DG IMDG Badge */}
          <div className="flex items-center gap-2 bg-[#04122b] border border-amber-500/50 px-3 py-1.5 rounded text-left">
            <Flame className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-amber-300 font-mono tracking-wide">
                IMDG CLASS 2.1 | UN 1972
              </div>
              <div className="text-[10px] text-slate-300 font-sans">
                METHANE, REFRIGERATED LIQUID (-160°C cryogenic)
              </div>
            </div>
          </div>
        </div>

        {/* Voyage Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 font-mono text-xs">
          {/* Voyage No */}
          <div className="bg-[#051636] border border-blue-900/80 p-2 text-center">
            <span className="text-[10px] text-blue-300 font-sans font-bold uppercase block mb-0.5">
              VOYAGE NUMBER
            </span>
            <input
              type="text"
              value={voyageNo}
              onChange={(e) => setVoyageNo(e.target.value)}
              className="w-full bg-[#0a2558] border border-blue-500/40 text-cyan-200 text-center font-bold text-xs py-1 focus:outline-none focus:border-cyan-300"
            />
          </div>

          {/* Target Shipment Batch */}
          <div className="bg-[#051636] border border-blue-900/80 p-2 text-center">
            <span className="text-[10px] text-blue-300 font-sans font-bold uppercase block mb-0.5">
              SHIPMENT BATCH TARGET
            </span>
            <input
              type="text"
              value={shipmentBatch}
              onChange={(e) => setShipmentBatch(e.target.value)}
              className="w-full bg-[#0a2558] border border-blue-500/40 text-cyan-200 text-center font-bold text-xs py-1 focus:outline-none focus:border-cyan-300"
            />
          </div>

          {/* ETD (Arun PAGT) */}
          <div className="bg-[#051636] border border-blue-900/80 p-2 text-center">
            <span className="text-[10px] text-blue-300 font-sans font-bold uppercase block mb-0.5">
              ETD (ARUN PAGT BERTH 2)
            </span>
            <input
              type="datetime-local"
              value={etdDate}
              onChange={(e) => setEtdDate(e.target.value)}
              className="w-full bg-[#0a2558] border border-blue-500/40 text-cyan-200 text-center font-bold text-[11px] py-0.5 px-1 focus:outline-none focus:border-cyan-300"
            />
          </div>

          {/* ETA (Nias / Gunung Sitoli) */}
          <div className="bg-[#051636] border border-blue-900/80 p-2 text-center">
            <span className="text-[10px] text-blue-300 font-sans font-bold uppercase block mb-0.5">
              ETA (NIAS JETTY LAYDOWN)
            </span>
            <input
              type="datetime-local"
              value={etaDate}
              onChange={(e) => setEtaDate(e.target.value)}
              className="w-full bg-[#0a2558] border border-blue-500/40 text-cyan-200 text-center font-bold text-[11px] py-0.5 px-1 focus:outline-none focus:border-cyan-300"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* B. Main Layout: 2-Column Split (Left 60% : Right 40%)                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* ========================================================================= */}
        {/* LEFT (60%): 10-Slot Deck Stowage Matrix (Vessel Hull Graphic Plan)        */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[60%] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2.5 flex flex-col justify-between gap-2.5 shadow-sm">
          <div>
            {/* Header & Quick Action Buttons */}
            <div className="bg-[#0a2558] text-white text-xs font-bold px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-cyan-300" />
                <span className="tracking-wider uppercase">
                  MV. SAVIOUR - MAIN DECK STOWAGE MATRIX (10 SLOTS)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoStowAll}
                  className="bg-[#ece9d8] hover:bg-[#dfdbce] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[10px] font-bold text-blue-950 px-2 py-0.5 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-blue-700" /> Auto-Stow Batch
                </button>
                <button
                  type="button"
                  onClick={handleClearSlots}
                  className="bg-[#ece9d8] hover:bg-[#dfdbce] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[10px] font-bold text-slate-800 px-2 py-0.5 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-600" /> Clear
                </button>
              </div>
            </div>

            {/* Vessel Hull Graphic Container */}
            <div className="mt-2.5 bg-[#1b2b48] border-2 border-[#0a2558] p-3 rounded-t-[40px] rounded-b-md shadow-inner relative overflow-hidden">
              {/* Nautical Bow & Stern Indicators */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-300 pb-2 border-b border-blue-900/60 mb-2.5">
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" /> ◄ FORE / BOW (FORWARD)
                </span>
                <span className="text-[10px] text-slate-300 font-sans">
                  PORT (LEFT) | STARBOARD (RIGHT)
                </span>
                <span>AFT / STERN (REAR) ►</span>
              </div>

              {/* 5 Rows x 2 Columns Grid (10 Slots) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono">
                {stowedSlots.map((slot, idx) => {
                  const isOccupied = !!slot.tankData;
                  const tank = slot.tankData;

                  return (
                    <div
                      key={slot.slotId}
                      className={`border-2 p-2 rounded transition-all shadow-sm flex flex-col justify-between ${
                        isOccupied
                          ? 'bg-[#f4f2e6] border-[#0a2558]'
                          : 'bg-[#122038]/80 border-dashed border-blue-700/60 text-slate-400'
                      }`}
                    >
                      {/* Slot Header Strip */}
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              slot.side === 'PORT'
                                ? 'bg-red-800 text-white'
                                : 'bg-emerald-800 text-white'
                            }`}
                          >
                            {slot.side === 'PORT' ? '🔴 PORT' : '🟢 STBD'}
                          </span>
                          <span className="text-xs font-black text-[#0a2558]">
                            {slot.slotLabel} ({slot.bay})
                          </span>
                        </div>
                        {isOccupied ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> LASHED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">[ EMPTY ]</span>
                        )}
                      </div>

                      {/* Card Content */}
                      {isOccupied ? (
                        <div className="space-y-1">
                          {/* Tank ID & Serial */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-blue-950 font-mono">
                              {tank.tankNo}
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 font-mono">
                              {tank.serialNo || 'TRSU-8101386'}
                            </span>
                          </div>

                          {/* Physical Metrics Pill */}
                          <div className="bg-[#e2dec9] px-1.5 py-0.5 rounded text-[11px] flex justify-between font-bold text-[#0a2558]">
                            <span>Net: {(tank.netMassKg || tank.deliveredWeightKg || 0).toLocaleString()} kg</span>
                            <span>P: {typeof tank.pressureMPa === 'number' ? tank.pressureMPa.toFixed(2) : '0.31'} MPa</span>
                            <span>T: {typeof tank.tempC === 'number' ? tank.tempC.toFixed(1) : '-129.0'}°C</span>
                          </div>

                          {/* Energy & Volume */}
                          <div className="flex justify-between items-center text-[10.5px] font-bold pt-0.5">
                            <span className="text-emerald-800">
                              ⚡ {(tank.deliveredMmbtu || tank.deliveredMMBtu || 0).toFixed(2)} MMBtu
                            </span>
                            <span className="text-blue-900">
                              {(tank.netVolM3 || tank.deliveredVolumeM3 || 0).toFixed(2)} m³ (95% Cap)
                            </span>
                          </div>

                          {/* Reorder / Swap Slot Controls */}
                          <div className="flex justify-between items-center pt-1 border-t border-slate-300 text-[10px]">
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> STOWED &amp; SECURED
                            </span>
                            {idx < stowedSlots.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleSwapSlots(idx, idx + 1)}
                                className="text-slate-600 hover:text-blue-900 font-bold flex items-center gap-0.5 cursor-pointer"
                                title="Swap with next slot"
                              >
                                <ArrowUpDown className="w-2.5 h-2.5" /> Swap
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            // Assign candidate if available
                            const unused = candidateBatchTanks.find(
                              (cand) => !stowedSlots.some((s) => s.tankData?.tankNo === cand.tankNo)
                            );
                            if (unused) {
                              setStowedSlots((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], tankData: unused };
                                return next;
                              });
                            }
                          }}
                          className="py-5 text-center cursor-pointer hover:bg-blue-950/40 rounded transition-colors"
                        >
                          <span className="text-xs text-cyan-300 font-mono font-bold block">
                            + Click to Assign Tank
                          </span>
                          <span className="text-[10px] text-slate-400">Available from Staged Batch</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT (40%): Voyage Manifest, Safety & Handover Panel                     */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[40%] flex flex-col justify-between gap-3">
          {/* 1. Aggregated Cargo Manifest Card */}
          <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-3 shadow-sm space-y-2.5">
            <div className="bg-[#0a2558] text-white text-xs font-bold px-2.5 py-1.5 flex items-center justify-between tracking-wide uppercase">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-300" />
                VOYAGE CARGO MANIFEST ({shipmentBatch})
              </span>
              <span className="text-cyan-300 font-mono">
                {totalStowedCount}/10 Stowed
              </span>
            </div>

            {/* Stowed Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold font-mono text-[#0a2558]">
                <span>DECK CAPACITY ALLOCATION:</span>
                <span>{totalStowedCount * 10}%</span>
              </div>
              <div className="w-full h-3 bg-[#d4d0c8] border border-[#a09e90] p-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    totalStowedCount === 10
                      ? 'bg-emerald-600'
                      : totalStowedCount >= 5
                      ? 'bg-blue-700'
                      : 'bg-amber-600'
                  }`}
                  style={{ width: `${(totalStowedCount / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Aggregated Totals Grid */}
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="bg-[#f4f2e6] border border-[#a09e90] p-2">
                <span className="text-[10px] text-slate-600 font-sans font-bold block uppercase">
                  TOTAL NET MASS
                </span>
                <div className="text-base font-black text-[#0a2558]">
                  {totalNetMassKg.toLocaleString()} kg
                </div>
              </div>
              <div className="bg-[#f4f2e6] border border-[#a09e90] p-2">
                <span className="text-[10px] text-slate-600 font-sans font-bold block uppercase">
                  TOTAL LIQUID VOLUME
                </span>
                <div className="text-base font-black text-blue-900">
                  {totalNetVolM3.toFixed(2)} m³
                </div>
              </div>
              <div className="col-span-2 bg-[#f4f2e6] border border-[#a09e90] p-2">
                <span className="text-[10px] text-slate-600 font-sans font-bold block uppercase">
                  TOTAL DELIVERED ENERGY (MMBTU)
                </span>
                <div className="text-xl font-black text-emerald-800">
                  {totalEnergyMMBtu.toFixed(2)} MMBtu
                </div>
              </div>
            </div>

            {/* Port vs Starboard Balance Indicator */}
            <div className="bg-[#dcd8c8] border border-[#a09e90] p-2 text-xs font-mono space-y-1">
              <div className="flex justify-between font-bold text-[#0a2558]">
                <span>PORT: {(portMassKg / 1000).toFixed(1)} t</span>
                <span className={`text-[11px] ${isWellBalanced ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {isWellBalanced ? '✓ TRIM BALANCED' : '⚠️ TRIM IMBALANCE'}
                </span>
                <span>STBD: {(stbdMassKg / 1000).toFixed(1)} t</span>
              </div>
              <div className="flex justify-center text-[10px] text-slate-600">
                Mass Difference: {(massDeltaKg / 1000).toFixed(2)} tonnes
              </div>
            </div>
          </div>

          {/* 2. Safety & Holding Time Assessment Card */}
          <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-3 shadow-sm space-y-2">
            <div className="bg-[#0a2558] text-white text-xs font-bold px-2.5 py-1.5 flex items-center justify-between tracking-wide uppercase">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                SAFETY &amp; HOLDING TIME ASSESSMENT
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between bg-white border border-[#a09e90] p-1.5">
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-700" /> Estimated Sea Transit:
                </span>
                <span className="font-bold text-[#0a2558]">~40.0 Hours (185 NM)</span>
              </div>
              <div className="flex items-center justify-between bg-white border border-[#a09e90] p-1.5">
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Max Safe Holding Time:
                </span>
                <span className="font-bold text-emerald-800">21.0 Days (504 Hours)</span>
              </div>
              <div className="flex items-center justify-between bg-white border border-[#a09e90] p-1.5">
                <span className="text-slate-600 font-bold">Safety Margin Factor:</span>
                <span className="font-bold text-emerald-800">12.6× Voyage Duration</span>
              </div>
              <div className="flex items-center justify-between bg-white border border-[#a09e90] p-1.5">
                <span className="text-slate-600 font-bold">PRV Relief Valve Setpoint:</span>
                <span className="font-bold text-slate-900">1.00 MPa (Live: ~0.31 MPa)</span>
              </div>
            </div>
          </div>

          {/* 3. Action Dispatch Trigger Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleConfirmDeparture}
              className="w-full bg-gradient-to-r from-emerald-700 via-[#12397a] to-[#0a2558] hover:from-emerald-600 hover:to-[#071a3d] text-white font-bold py-3 px-4 text-xs sm:text-sm rounded shadow-md border-2 border-t-emerald-300 border-l-emerald-300 border-b-[#001030] border-r-[#001030] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Ship className="w-4 h-4 text-cyan-300" />
              <span>🚢 Confirm Departure &amp; Transmit Manifest to Nias Unit →</span>
            </button>

            {onNavigateToLedger && (
              <button
                type="button"
                onClick={onNavigateToLedger}
                className="w-full py-1.5 text-xs font-bold text-blue-900 hover:text-blue-950 underline text-center cursor-pointer"
              >
                View Stored Manifest in Tab 4 (Master Custody Ledger) →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Departure Confirmation Modal                                              */}
      {/* ========================================================================= */}
      {showDepartureModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-4 max-w-lg w-full shadow-2xl space-y-3">
            <div className="bg-[#0a2558] text-white px-3 py-2 flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                VOYAGE DEPARTURE CONFIRMED
              </span>
              <button
                type="button"
                onClick={() => setShowDepartureModal(false)}
                className="text-white hover:text-cyan-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-white border border-[#a09e90] p-3 text-xs space-y-2 font-mono">
              <p className="text-slate-800 font-bold">
                MV. SAVIOUR ({voyageNo}) has officially cast off from Arun PAG Terminal Berth 2.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Total Stowed Cargo: <strong className="text-[#0a2558]">{totalStowedCount} ISO Tanks</strong></li>
                <li>Total Net Liquid Mass: <strong className="text-[#0a2558]">{totalNetMassKg.toLocaleString()} kg</strong></li>
                <li>Total Delivered Energy: <strong className="text-emerald-800">{totalEnergyMMBtu.toFixed(2)} MMBtu</strong></li>
                <li>Destination: <strong className="text-blue-900">Nias Island (Gunung Sitoli Regasification Unit)</strong></li>
                <li>Telemetry &amp; Custody Manifest transmitted downstream.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDepartureModal(false)}
                className="px-4 py-1.5 bg-[#d4d0c8] hover:bg-[#c0bcaf] text-slate-900 font-bold text-xs border border-[#808080] cursor-pointer"
              >
                Close
              </button>
              {onNavigateToLedger && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartureModal(false);
                    onNavigateToLedger();
                  }}
                  className="px-4 py-1.5 bg-[#0a2558] hover:bg-[#12397a] text-white font-bold text-xs border border-blue-400 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Go to Tab 4 (Master Ledger)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
