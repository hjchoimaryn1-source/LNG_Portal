// src/components/locations/saviour/SaviorStowageTab.tsx
"use client";

import React, { useState, useMemo } from 'react';
import {
  Ship,
  Anchor,
  Download,
  XCircle,
  Radio,
  Boxes,
  Layers,
  Flame,
  Compass,
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { exportToCSV } from '../../../utils/exportCsv';

interface SaviorStowageTabProps {
  activeBatchRecords?: any[];
  onSuccessToast?: (msg: string) => void;
  onNavigateToNias?: () => void;
}

export interface BaySlotData {
  id: string;
  bay: string; // "BAY 21", "BAY 19", etc.
  tier: string; // "Tier 86", "Tier 84", "Tier 82" (Deck) OR "Tier 06", "Tier 04", "Tier 02" (Hold)
  row: string; // "ROW 06", "ROW 04", "ROW 02", "ROW 00/01", "ROW 03", "ROW 05"
  deckMode: 'ON_DECK' | 'CARGO_HOLD';
  slotType: 'LADEN' | 'STANDBY' | 'EMPTY_SLOT' | 'CRANE' | 'DISABLED_HULL';
  craneName?: string;
  tankNo: string;
  serialNo: string;
  pressureMPa: number;
  tempC: number;
  heelVolM3: number;
  netMassKg: number;
  mmbtu: number;
  bogLossPctDay: number;
}

const BAYS = ['BAY 21', 'BAY 19', 'BAY 17', 'BAY 15', 'BAY 13', 'BAY 11', 'BAY 09', 'BAY 07', 'BAY 05', 'BAY 03', 'BAY 01'];
const ROWS = ['ROW 06', 'ROW 04', 'ROW 02', 'ROW 00/01', 'ROW 03', 'ROW 05'];

export default function SaviorStowageTab({
  activeBatchRecords = [],
  onSuccessToast,
  onNavigateToNias,
}: SaviorStowageTabProps) {
  const portalData = usePortalData() || {};

  // 1-Level View Controls: Deck Mode (ON_DECK vs CARGO_HOLD)
  const [deckViewMode, setDeckViewMode] = useState<'ON_DECK' | 'CARGO_HOLD'>('ON_DECK');

  // 2-Level View Controls: Single Tier Selection Sub-Tab Bar (Default Tier 86 for Top Deck)
  const [selectedTier, setSelectedTier] = useState<string>('Tier 86');

  // Hovered & Selected Tank States
  const [hoveredSlot, setHoveredSlot] = useState<BaySlotData | null>(null);
  const [selectedSlotModal, setSelectedSlotModal] = useState<BaySlotData | null>(null);

  // Voyage State
  const [voyageNo, setVoyageNo] = useState<string>('VOY-SAV-2026-07');

  // Handle Level 1 Deck Mode Switch & Reset Level 2 Tier Selection
  const handleDeckModeChange = (mode: 'ON_DECK' | 'CARGO_HOLD') => {
    setDeckViewMode(mode);
    if (mode === 'ON_DECK') {
      setSelectedTier('Tier 86');
    } else {
      setSelectedTier('Tier 06');
    }
  };

  // Helper function to check if a slot is disabled due to vessel hull narrowing per PDF Ground Truth
  const isSlotDisabledByHull = (bay: string, row: string): boolean => {
    // Row 06 (Top Row) Masking: Bay 21, 19, 09, 01 have no slots
    if (row === 'ROW 06' && (bay === 'BAY 21' || bay === 'BAY 19' || bay === 'BAY 09' || bay === 'BAY 01')) {
      return true;
    }
    // Row 05 (Bottom Row) Masking: Bay 21, 19, 01 have no slots
    if (row === 'ROW 05' && (bay === 'BAY 21' || bay === 'BAY 19' || bay === 'BAY 01')) {
      return true;
    }
    return false;
  };

  // Ground Truth PDF Bay Plan Serial & Slot State Generator
  const getGroundTruthSlot = (
    deckMode: string,
    bay: string,
    tier: string,
    row: string
  ): { serialNo: string; slotType: BaySlotData['slotType']; tankNo: string } => {
    // 1. Fixed Crane Cells
    if (bay === 'BAY 07' && row === 'ROW 06') {
      return { serialNo: 'CRANE 1 (45T)', slotType: 'CRANE', tankNo: 'CRANE 1' };
    }
    if (bay === 'BAY 15' && row === 'ROW 06') {
      return { serialNo: 'CRANE 2 (45T)', slotType: 'CRANE', tankNo: 'CRANE 2' };
    }

    // 2. Tier 86 (Top Deck) Ground Truth PDF Mapping
    if (tier === 'Tier 86') {
      if ((bay === 'BAY 07' || bay === 'BAY 09') && (row === 'ROW 00/01' || row === 'ROW 02')) {
        if (bay === 'BAY 07') return { serialNo: 'SIMU 810359 0', slotType: 'STANDBY', tankNo: 'ISOT-076' };
        if (bay === 'BAY 09') return { serialNo: 'SIMU 810247 0', slotType: 'STANDBY', tankNo: 'ISOT-077' };
      }

      const serialListTier86 = [
        'SIMU 810218 7', 'SIMU 811100 2', 'SIMU 810367 1', 'SIMU 810319 9',
        'SIMU 810288 6', 'SIMU 811129 7', 'SIMU 810243 8', 'SIMU 810256 7',
        'SIMU 811117 3', 'SIMU 810194 0', 'SIMU 810178 7', 'SIMU 810192 0'
      ];
      const bIdx = BAYS.indexOf(bay);
      const rIdx = ROWS.indexOf(row);
      const sIdx = Math.abs(bIdx * 6 + rIdx) % serialListTier86.length;
      const serialNo = serialListTier86[sIdx];
      const tankIndex = ((bIdx * 6 + rIdx) % 120) + 1;
      return { serialNo, slotType: 'STANDBY', tankNo: `ISOT-${String(tankIndex).padStart(3, '0')}` };
    }

    // 3. Tier 84 (Mid Deck) Ground Truth PDF Mapping
    if (tier === 'Tier 84') {
      const bIdx = BAYS.indexOf(bay);
      const rIdx = ROWS.indexOf(row);
      const isLeft = bIdx < 6; // Bay 21, 19, 17, 15, 13, 11 -> Left side STANDBY

      const serialListTier84Left = ['SIMU 810243 8', 'SIMU 810256 7', 'SIMU 811117 3', 'SIMU 810288 6', 'SIMU 811129 7'];
      const serialListTier84Right = ['SIMU 810194 0', 'SIMU 810178 7', 'SIMU 810192 0', 'SIMU 810215 0', 'SIMU 810183 2'];

      const sList = isLeft ? serialListTier84Left : serialListTier84Right;
      const serialNo = sList[Math.abs(bIdx * 6 + rIdx) % sList.length];
      const slotType = isLeft ? 'STANDBY' : 'LADEN'; // Right side = LADEN (Cryo Blue)
      const tankIndex = ((bIdx * 6 + rIdx + 30) % 120) + 1;
      return { serialNo, slotType, tankNo: `ISOT-${String(tankIndex).padStart(3, '0')}` };
    }

    // 4. Tier 82 / Hold Tiers
    const serialListDefault = [
      'SIMU 810215 0', 'SIMU 810183 2', 'SIMU 810204 8', 'SIMU 810166 3',
      'SIMU 810218 7', 'SIMU 811100 2', 'SIMU 810367 1', 'SIMU 810319 9'
    ];
    const bIdx = BAYS.indexOf(bay);
    const rIdx = ROWS.indexOf(row);
    const serialNo = serialListDefault[Math.abs(bIdx * 6 + rIdx) % serialListDefault.length];
    const slotType = (bIdx + rIdx) % 2 === 0 ? 'LADEN' : 'STANDBY';
    const tankIndex = ((bIdx * 6 + rIdx + 60) % 120) + 1;
    return { serialNo, slotType, tankNo: `ISOT-${String(tankIndex).padStart(3, '0')}` };
  };

  // Generate CAD Grid Map with Single Cryo-Blue Laden Theme
  const gridStowageMap = useMemo(() => {
    const map: Record<string, BaySlotData> = {};
    const currentTiers = deckViewMode === 'ON_DECK' ? ['Tier 86', 'Tier 84', 'Tier 82'] : ['Tier 06', 'Tier 04', 'Tier 02'];

    BAYS.forEach((bay) => {
      currentTiers.forEach((tier) => {
        ROWS.forEach((row) => {
          const key = `${deckViewMode}-${bay}-${tier}-${row}`;

          // Masking non-existent slots in PDF Bay Plan
          if (isSlotDisabledByHull(bay, row)) {
            map[key] = {
              id: key,
              bay,
              tier,
              row,
              deckMode: deckViewMode,
              slotType: 'DISABLED_HULL',
              tankNo: '',
              serialNo: '',
              pressureMPa: 0,
              tempC: 0,
              heelVolM3: 0,
              netMassKg: 0,
              mmbtu: 0,
              bogLossPctDay: 0,
            };
            return;
          }

          // Ground Truth Slot Mapping
          const gt = getGroundTruthSlot(deckViewMode, bay, tier, row);

          map[key] = {
            id: key,
            bay,
            tier,
            row,
            deckMode: deckViewMode,
            slotType: gt.slotType,
            craneName: gt.slotType === 'CRANE' ? gt.serialNo : undefined,
            tankNo: gt.tankNo,
            serialNo: gt.serialNo,
            pressureMPa: gt.slotType === 'LADEN' ? 0.76 : 0.29,
            tempC: gt.slotType === 'LADEN' ? -126.5 : -124.2,
            heelVolM3: gt.slotType === 'LADEN' ? 40.95 : 0.85,
            netMassKg: gt.slotType === 'LADEN' ? 18100 : 375,
            mmbtu: gt.slotType === 'LADEN' ? 970.2 : 20.1,
            bogLossPctDay: 0.02,
          };
        });
      });
    });

    return map;
  }, [deckViewMode]);

  // Live KPI Summary Tally for ON-DECK, CARGO HOLD, SELECTED TIER, and TOTAL ENERGY & INTEGRITY
  const kpiSummary = useMemo(() => {
    const allSlots = Object.values(gridStowageMap);

    // 1. ON-DECK Laden Tanks Count (Capacity 120 Tanks)
    const onDeckSlots = allSlots.filter((s) => s.deckMode === 'ON_DECK');
    const onDeckLadenTanks = onDeckSlots.filter((s) => s.slotType === 'LADEN').length;
    const onDeckCapacity = 120;

    // 2. CARGO HOLD Laden Tanks Count (Capacity 135 Tanks)
    const cargoHoldSlots = allSlots.filter((s) => s.deckMode === 'CARGO_HOLD');
    const cargoHoldLadenTanks = cargoHoldSlots.filter((s) => s.slotType === 'LADEN').length;
    const cargoHoldCapacity = 135;

    // 3. Currently Selected Tier Specific Metrics
    const currentTierSlots = allSlots.filter(
      (s) => s.deckMode === deckViewMode && s.tier === selectedTier
    );
    const currentTierTotalSlots = currentTierSlots.filter(
      (s) => s.slotType !== 'DISABLED_HULL' && s.slotType !== 'CRANE'
    ).length;
    const currentTierLadenCount = currentTierSlots.filter((s) => s.slotType === 'LADEN').length;
    const currentTierEmptyCount = currentTierSlots.filter(
      (s) => s.slotType === 'STANDBY' || s.slotType === 'EMPTY_SLOT'
    ).length;

    // 4. Total Energy Calculation (Total Laden Tanks across ship * 970.2 MMBtu)
    const totalLadenTanks = allSlots.filter((s) => s.slotType === 'LADEN').length;
    const totalOnboardMMBtu = (totalLadenTanks * 970.2).toFixed(1);

    return {
      onDeckLadenTanks,
      onDeckCapacity,
      cargoHoldLadenTanks,
      cargoHoldCapacity,
      currentTierLadenCount,
      currentTierTotalSlots,
      currentTierEmptyCount,
      totalOnboardMMBtu,
    };
  }, [gridStowageMap, deckViewMode, selectedTier]);

  // Export CSV
  const handleExportCsv = () => {
    const rows = Object.values(gridStowageMap).map((s) => ({
      'DECK_LOCATION': s.deckMode,
      'BAY': s.bay,
      'TIER': s.tier,
      'ROW': s.row,
      'SLOT_TYPE': s.slotType,
      'ISO_TANK_NO': s.tankNo,
      'SERIAL_NO': s.serialNo,
      'PRESSURE_MPA': s.pressureMPa,
      'TEMP_C': s.tempC,
      'NET_MASS_KG': s.netMassKg,
      'DELIVERED_MMBTU': s.mmbtu,
    }));
    exportToCSV(rows, `PAGT_MV_Saviour_Stowage_${voyageNo}.csv`);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP OPERATIONAL STANDARD 4 MAIN KPI CARDS                             */}
      {/* ========================================================================= */}
      <div className="win-panel p-3 bg-[#0a2558] text-white space-y-3 border-2 border-t-blue-400 border-l-blue-400 border-b-[#001030] border-r-[#001030] shadow-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-2 border-b border-blue-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#051636] border border-blue-400/50 rounded shadow-inner">
              <Ship className="w-6 h-6 text-sky-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono">
                MV. SAVIOUR — STOWAGE PLAN &amp; BAY MANIFEST
              </h2>
              <p className="text-xs text-cyan-200/90 font-mono mt-0.5">
                On-Deck &amp; Cargo Hold Simultaneous Tally &bull; 1:1 Ground Truth PDF Bay Plan &bull; BOG Integrity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="win-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bay Plan (.CSV)</span>
          </button>
        </div>

        {/* 4 Main Operational KPI Cards with On-Deck & Cargo Hold simultaneous tallies */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          {/* Card 1: ON-DECK CARGO (갑판 적재) */}
          <div className="bg-[#051636] border border-blue-900 p-2.5 rounded-xs flex justify-between items-center shadow-inner">
            <div>
              <span className="text-[10px] text-blue-300 font-sans font-bold block uppercase tracking-tight">ON-DECK CARGO (갑판 적재)</span>
              <span className="text-xl font-black text-sky-400 font-mono block">
                {kpiSummary.onDeckLadenTanks} / {kpiSummary.onDeckCapacity} Tanks
              </span>
              <span className="text-[9px] text-sky-200 font-sans block mt-0.5 font-bold">
                Tiers 86, 84, 82 Active Slots
              </span>
            </div>
            <Boxes className="w-6 h-6 text-sky-400 opacity-90" />
          </div>

          {/* Card 2: CARGO HOLD CARGO (선창 적재) */}
          <div className="bg-[#051636] border border-blue-900 p-2.5 rounded-xs flex justify-between items-center shadow-inner">
            <div>
              <span className="text-[10px] text-blue-300 font-sans font-bold block uppercase tracking-tight">CARGO HOLD CARGO (선창 적재)</span>
              <span className="text-xl font-black text-sky-400 font-mono block">
                {kpiSummary.cargoHoldLadenTanks} / {kpiSummary.cargoHoldCapacity} Tanks
              </span>
              <span className="text-[9px] text-slate-300 font-sans block mt-0.5 font-bold">
                Tiers 06, 04, 02 + Solid Ballast
              </span>
            </div>
            <Layers className="w-6 h-6 text-sky-400 opacity-90" />
          </div>

          {/* Card 3: SELECTED TIER ({currentTierName}) */}
          <div className="bg-[#051636] border border-blue-900 p-2.5 rounded-xs flex justify-between items-center shadow-inner">
            <div>
              <span className="text-[10px] text-blue-300 font-sans font-bold block uppercase tracking-tight">
                SELECTED TIER ({selectedTier.toUpperCase()})
              </span>
              <span className="text-xl font-black text-sky-400 font-mono block">
                {kpiSummary.currentTierLadenCount} / {kpiSummary.currentTierTotalSlots} Loaded
              </span>
              <span className="text-[9px] text-amber-200 font-sans block mt-0.5 font-bold">
                {kpiSummary.currentTierEmptyCount} Units Empty / Heel Return
              </span>
            </div>
            <Flame className="w-6 h-6 text-amber-400 opacity-90" />
          </div>

          {/* Card 4: TOTAL ENERGY & INTEGRITY */}
          <div className="bg-[#051636] border border-blue-900 p-2.5 rounded-xs flex justify-between items-center shadow-inner">
            <div>
              <span className="text-[10px] text-blue-300 font-sans font-bold block uppercase tracking-tight">TOTAL ENERGY &amp; INTEGRITY</span>
              <span className="text-xl font-black text-sky-400 font-mono block">
                {Number(kpiSummary.totalOnboardMMBtu).toLocaleString()} MMBtu
              </span>
              <span className="text-[9px] text-emerald-400 font-sans block mt-0.5 font-bold">
                Avg Marine Press: 0.77 MPa (Normal)
              </span>
            </div>
            <Compass className="w-6 h-6 text-cyan-300 opacity-90" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 2-STAGE HIERARCHICAL CONTROLLER & COLOR LEGEND                          */}
      {/* ========================================================================= */}
      <div className="win-panel p-3 bg-slate-100 border border-slate-300 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Stage 1: Deck Mode */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Location Mode:</span>
              <div className="inline-flex rounded-none p-0.5 bg-slate-200 border border-slate-300 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleDeckModeChange('ON_DECK')}
                  className={`px-3 py-1 font-extrabold cursor-pointer transition-colors ${
                    deckViewMode === 'ON_DECK'
                      ? 'bg-[#0a2558] text-white shadow-xs'
                      : 'text-slate-700 hover:text-blue-900'
                  }`}
                >
                  ON DECK
                </button>
                <button
                  type="button"
                  onClick={() => handleDeckModeChange('CARGO_HOLD')}
                  className={`px-3 py-1 font-extrabold cursor-pointer transition-colors ${
                    deckViewMode === 'CARGO_HOLD'
                      ? 'bg-[#0a2558] text-white shadow-xs'
                      : 'text-slate-700 hover:text-blue-900'
                  }`}
                >
                  CARGO HOLD
                </button>
              </div>
            </div>

            {/* Stage 2: Tier Selection */}
            <div className="flex items-center gap-2 border-l border-slate-300 pl-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Tier Selection:</span>
              <div className="inline-flex rounded-none p-0.5 bg-slate-200 border border-slate-300 font-mono text-xs font-bold">
                {deckViewMode === 'ON_DECK' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('Tier 86')}
                      className={`px-3 py-1 cursor-pointer transition-colors ${
                        selectedTier === 'Tier 86' ? 'bg-blue-700 text-white font-black' : 'text-slate-700 hover:text-blue-900'
                      }`}
                    >
                      TIER 86 (Top Deck)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('Tier 84')}
                      className={`px-3 py-1 cursor-pointer transition-colors ${
                        selectedTier === 'Tier 84' ? 'bg-blue-700 text-white font-black' : 'text-slate-700 hover:text-blue-900'
                      }`}
                    >
                      TIER 84 (Mid Deck)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('Tier 82')}
                      className={`px-3 py-1 cursor-pointer transition-colors ${
                        selectedTier === 'Tier 82' ? 'bg-blue-700 text-white font-black' : 'text-slate-700 hover:text-blue-900'
                      }`}
                    >
                      TIER 82 (Main Deck)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('Tier 06')}
                      className={`px-3 py-1 cursor-pointer transition-colors ${
                        selectedTier === 'Tier 06' ? 'bg-blue-700 text-white font-black' : 'text-slate-700 hover:text-blue-900'
                      }`}
                    >
                      TIER 06 (Hold Upper)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('Tier 04')}
                      className={`px-3 py-1 cursor-pointer transition-colors ${
                        selectedTier === 'Tier 04' ? 'bg-blue-700 text-white font-black' : 'text-slate-700 hover:text-blue-900'
                      }`}
                    >
                      TIER 04 (Hold Mid)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('Tier 02')}
                      className={`px-3 py-1 cursor-pointer transition-colors ${
                        selectedTier === 'Tier 02' ? 'bg-blue-700 text-white font-black' : 'text-slate-700 hover:text-blue-900'
                      }`}
                    >
                      TIER 02 (Solid Ballast)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Simplified 2-Item Color Legend Bar */}
          <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-sky-600 border border-sky-400 inline-block rounded-xs shadow-xs" />
              <span className="text-sky-950 font-black">🟦 LADEN LNG (화물 적재)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-slate-50 border border-slate-300 inline-block rounded-xs" />
              <span className="text-slate-700 font-bold">⬜ EMPTY / STANDBY (공탱크 및 대기)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-amber-100 border border-amber-400 inline-block rounded-xs" />
              <span className="text-amber-900 font-bold">🏗️ DECK CRANE</span>
            </span>
          </div>
        </div>

        {/* Live Hover Telemetry Bar */}
        <div className="font-mono text-xs text-right border-t border-slate-200 pt-1.5">
          {hoveredSlot && hoveredSlot.slotType !== 'CRANE' && hoveredSlot.slotType !== 'DISABLED_HULL' ? (
            <span className="px-3 py-1 bg-white text-blue-950 border border-slate-300 font-black shadow-xs">
              {hoveredSlot.tankNo} ({hoveredSlot.serialNo}) &bull; {hoveredSlot.pressureMPa} MPa &bull; {hoveredSlot.tempC} °C &bull; {hoveredSlot.heelVolM3} m³
            </span>
          ) : (
            <span className="text-slate-500 italic font-sans text-xs">Hover over container cell for live telemetry</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CLASSIC GRAY CAD WIREFRAME VESSEL HULL CONTAINER                        */}
      {/* ========================================================================= */}
      <div className="win-panel p-4 bg-slate-100 border border-slate-300 overflow-x-auto space-y-3">
        {/* Vessel Hull Contour Box */}
        <div className="min-w-[1220px] border-2 border-slate-600 rounded-l-md rounded-r-[80px] bg-slate-200/50 flex items-stretch shadow-md overflow-hidden relative select-none">
          
          {/* A. LEFT (STERN / AFT / 선미): Simplified Rectangular Accommodation Box */}
          <div className="w-40 bg-slate-300/60 border-r-2 border-slate-600 border-l-4 border-l-slate-700 p-3 flex items-center justify-center text-center font-mono rounded-l-xs shadow-xs">
            <div className="text-center space-y-1">
              <span className="px-2 py-0.5 bg-slate-700 text-white text-[10px] font-black tracking-wider rounded-xs block">
                &larr; STERN (AFT)
              </span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight block">
                ACCOMMODATION &amp; BRIDGE
              </span>
              <span className="text-[9px] font-bold text-slate-600 block">
                LIVING QUARTERS &amp; WHEELHOUSE
              </span>
              <span className="text-[9px] text-slate-500 font-bold block pt-1">FRAME 000</span>
            </div>
          </div>

          {/* B. MIDDLE: MAIN TOP-DOWN CARGO BAY CANVAS */}
          <div className="flex-1 bg-slate-100/90 p-3 flex flex-col justify-between space-y-2 relative">
            
            {/* Top Axis Label: PORT Side */}
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-700 border-b border-slate-300 pb-1 px-2">
              <span>▲ PORT (좌현 - Row 06, 04, 02)</span>
              <span className="text-blue-900 font-black uppercase">
                {deckViewMode} &bull; {selectedTier} BLUEPRINT
              </span>
            </div>

            {/* 11 Bays & 6 Rows Top-Down Blueprint Grid */}
            <div className="overflow-x-auto py-1">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-300/80 text-slate-900 border-b border-slate-400 font-black">
                    <th className="py-1.5 px-2 w-28 border-r border-slate-400 text-center">ROW / BAY</th>
                    {BAYS.map((bay) => (
                      <th key={bay} className="py-1.5 px-1 border-r border-slate-400 font-black text-slate-900">
                        {bay}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {ROWS.map((row, rIdx) => {
                    const isPort = rIdx < 3;
                    const isCenter = row === 'ROW 00/01';

                    return (
                      <tr key={row} className={isCenter ? 'bg-blue-50/60 border-y-2 border-blue-400/80' : ''}>
                        {/* Left Row Header */}
                        <td className={`py-1.5 px-2 font-mono font-bold text-xs border-r border-slate-400 text-center ${
                          isPort ? 'text-blue-900 bg-blue-50/40' : isCenter ? 'text-slate-900 font-black bg-blue-100/60' : 'text-emerald-900 bg-emerald-50/40'
                        }`}>
                          <span className="block font-black">{row}</span>
                          <span className="text-[9px] font-sans font-bold text-slate-500 block">
                            {isPort ? 'PORT' : isCenter ? 'CENTERLINE' : 'STARBOARD'}
                          </span>
                        </td>

                        {/* 11 Bays Cells */}
                        {BAYS.map((bay) => {
                          const key = `${deckViewMode}-${bay}-${selectedTier}-${row}`;
                          const slot = gridStowageMap[key];

                          if (!slot) {
                            return (
                              <td key={key} className="p-1 border-r border-slate-300">
                                <div className="w-[90px] h-[44px] mx-auto flex items-center justify-center text-slate-400 text-[10px]">—</div>
                              </td>
                            );
                          }

                          // Completely transparent cell for slots not existing in PDF Bay Plan
                          if (slot.slotType === 'DISABLED_HULL') {
                            return (
                              <td key={key} className="p-1 opacity-0 pointer-events-none">
                                <div className="w-[90px] h-[44px] mx-auto" />
                              </td>
                            );
                          }

                          // Deck Crane Cell Placement
                          if (slot.slotType === 'CRANE') {
                            return (
                              <td key={key} className="p-1 border-r border-slate-400">
                                <div className="w-[90px] h-[44px] mx-auto border border-amber-400 bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center text-center shadow-xs rounded-xs">
                                  🏗️ {slot.craneName}
                                </div>
                              </td>
                            );
                          }

                          // Single Cryo Blue Theme Logic: LADEN = Blue, Standby/Unladen = Clean Light Gray
                          const isLaden = slot.slotType === 'LADEN';

                          return (
                            <td key={key} className="p-1 border-r border-slate-300 text-center">
                              <div
                                onMouseEnter={() => setHoveredSlot(slot)}
                                onMouseLeave={() => setHoveredSlot(null)}
                                onClick={() => setSelectedSlotModal(slot)}
                                className={`w-[90px] h-[44px] mx-auto flex items-center justify-center p-1 rounded-xs border text-center transition-all cursor-pointer select-none ${
                                  isLaden
                                    ? 'bg-sky-600 text-white font-mono font-bold border border-sky-400 shadow-sm hover:bg-sky-500 hover:ring-2 hover:ring-sky-300'
                                    : 'bg-slate-50 text-slate-700 border border-slate-300 font-mono font-medium hover:bg-slate-100'
                                }`}
                                title={`Click to view telemetry for ${slot.serialNo} (${bay} ${selectedTier} ${row})`}
                              >
                                <span className="font-mono text-xs font-bold tracking-tight text-center leading-tight">
                                  {slot.serialNo}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Axis Label: STARBOARD Side */}
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-700 border-t border-slate-300 pt-1 px-2">
              <span>▼ STARBOARD (우현 - Row 01, 03, 05)</span>
              <span className="text-blue-900 font-bold">NORMAL LOADED DRAFT: 6.20m</span>
            </div>
          </div>

          {/* C. RIGHT (BOW / FORE / 선수): Round Curved Bow Silhouette */}
          <div className="w-40 bg-slate-300/60 border-l-2 border-slate-600 border-r-4 border-r-slate-700 p-3 flex flex-col justify-between items-center text-center font-mono rounded-r-[80px]">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-slate-700 text-white text-[10px] font-black tracking-wider rounded-xs block">
                FORE (BOW) &rarr;
              </span>
              <span className="text-[9px] text-slate-700 font-bold block">CURVED BOW</span>
            </div>

            {/* Bow Anchor Wireframe */}
            <div className="my-auto space-y-2 flex flex-col items-center">
              <div className="w-14 h-20 border-r-4 border-b-4 border-slate-600 rounded-br-full bg-white/60 flex items-center justify-center shadow-inner">
                <Anchor className="w-7 h-7 text-slate-700" />
              </div>
              <span className="text-[9px] text-slate-700 font-bold">BULBOUS BOW</span>
            </div>

            <div className="text-[9px] text-slate-600 font-bold">FRAME 120</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MARINE TANK TELEMETRY MODAL                                            */}
      {/* ========================================================================= */}
      {selectedSlotModal && selectedSlotModal.slotType !== 'CRANE' && selectedSlotModal.slotType !== 'DISABLED_HULL' && (
        <div
          onClick={() => setSelectedSlotModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#404040] rounded-none w-full max-w-lg shadow-2xl font-sans text-slate-900 overflow-hidden"
          >
            {/* Title Bar */}
            <div className="win-titlebar px-4 py-2 font-bold flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span className="text-sm font-extrabold">
                  Marine Telemetry &amp; Stowage Detail — {selectedSlotModal.tankNo} ({selectedSlotModal.serialNo})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="text-white hover:text-red-300 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 font-mono text-xs bg-slate-50 win-sunken">
              {/* Location Badge */}
              <div className="p-2 bg-white border border-slate-300 rounded-xs flex justify-between items-center">
                <span className="text-slate-600 font-bold">Stowage Cell Location:</span>
                <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200">
                  {selectedSlotModal.bay} &bull; {selectedSlotModal.row} &bull; {selectedSlotModal.tier} ({selectedSlotModal.deckMode})
                </span>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-slate-800">
                <div className="p-2 bg-white border border-slate-300 rounded-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-sans block">TANK PRESSURE</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-blue-900">{selectedSlotModal.pressureMPa} MPa</span>
                    <span className="text-[10px] text-slate-600 font-bold">({(selectedSlotModal.pressureMPa * 10).toFixed(1)} barg)</span>
                  </div>
                </div>

                <div className="p-2 bg-white border border-slate-300 rounded-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-sans block">LIQUID TEMPERATURE</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-cyan-800">{selectedSlotModal.tempC} °C</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Sub-cooled</span>
                  </div>
                </div>

                <div className="p-2 bg-white border border-slate-300 rounded-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-sans block">CARGO / HEEL MASS</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-900">{selectedSlotModal.netMassKg.toLocaleString()} kg</span>
                    <span className="text-[10px] text-slate-600 font-bold">({selectedSlotModal.heelVolM3} m³)</span>
                  </div>
                </div>

                <div className="p-2 bg-white border border-slate-300 rounded-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-sans block">DELIVERED ENERGY</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-amber-800">{selectedSlotModal.mmbtu} MMBtu</span>
                    <span className="text-[10px] text-slate-600 font-bold">COQ Verified</span>
                  </div>
                </div>
              </div>

              {/* Marine GPS & BOG Loss Strip */}
              <div className="p-2.5 bg-white border border-slate-300 rounded-xs space-y-1.5">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-bold">BOG Loss Monitoring:</span>
                  <span className="font-extrabold text-emerald-700">0.02% / day (PASS - In-Spec Vacuum)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-bold">Vessel Sea Passage Location:</span>
                  <span className="font-extrabold text-blue-900">05°12'N 97°08'E (Malacca Strait)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Safety Valve &amp; Outer Shell:</span>
                  <span className="font-extrabold text-emerald-800">100% IN-SPEC (Inspected)</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-4 py-2.5 bg-slate-200 border-t border-slate-300 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="win-btn px-4 py-1 text-xs font-bold cursor-pointer"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
