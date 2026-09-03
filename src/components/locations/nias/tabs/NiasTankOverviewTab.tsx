// src/components/locations/nias/tabs/NiasTankOverviewTab.tsx
"use client";

import React from 'react';
import { GripVertical } from 'lucide-react';
import type { ActiveBayState, FleetTankItem } from '@/types/lng';
import type { NiasTankAsset, NiasZone } from '../../NiasTerminalView';

export interface NiasTankOverviewTabProps {
  zoneStats: {
    yard1: {
      tanks: NiasTankAsset[];
      count?: number;
      capacity?: number;
      avgPress?: number;
      normalCount?: number;
      highCount?: number;
    };
    yard2: {
      tanks: NiasTankAsset[];
      count?: number;
      capacity?: number;
      avgPress?: number;
      activeDepressCount?: number;
    };
    [key: string]: any;
  };
  activeBays: ActiveBayState[];
  tankInventory: NiasTankAsset[];
  fleetTanks: FleetTankItem[];
  draggingTankNo: string | null;
  dragOverTarget: string | null;
  handleDragStart: (e: React.DragEvent, tankNo: string, fromZone: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, targetId: string) => void;
  handleDragLeave: (targetId: string) => void;
  handleDrop: (
    e: React.DragEvent,
    targetZone: 'LAYDOWN_1' | 'LAYDOWN_2' | 'FOUR_BAY_REGAS' | 'LAYDOWN_3',
    slotNumber?: number,
    bayId?: string
  ) => void;
  setSelectedDetailTank: (tank: NiasTankAsset) => void;
  getRackTag?: (bayId: string) => string;
}

const defaultGetRackTag = (bayId: string): string => {
  if (bayId.includes('1') || bayId.toLowerCase().includes('01')) return 'T-201';
  if (bayId.includes('2') || bayId.toLowerCase().includes('02')) return 'T-202';
  if (bayId.includes('3') || bayId.toLowerCase().includes('03')) return 'T-203';
  if (bayId.includes('4') || bayId.toLowerCase().includes('04')) return 'T-204';
  return bayId;
};

export default function NiasTankOverviewTab({
  zoneStats,
  activeBays,
  tankInventory,
  fleetTanks,
  draggingTankNo,
  dragOverTarget,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  setSelectedDetailTank,
  getRackTag = defaultGetRackTag,
}: NiasTankOverviewTabProps) {
  const yard1TanksList = zoneStats.yard1.tanks;
  const yard2TanksList = zoneStats.yard2.tanks;
  const yard1OccupancyPct = ((yard1TanksList.length / 34) * 100).toFixed(1);

  // Helper to match tank by slot index (1-indexed slot number)
  const getTankAtSlot = (list: typeof yard1TanksList, slotIdx: number): typeof yard1TanksList[0] | undefined => {
    const slotNum = slotIdx + 1;
    const exact = list.find((t) => t.slotIndex === slotNum);
    if (exact) return exact;

    const unassigned = list.filter((t) => !t.slotIndex || t.slotIndex === 0);
    let unassignedIdx = 0;
    for (let i = 0; i < slotIdx; i++) {
      const hasExact = list.some((t) => t.slotIndex === i + 1);
      if (!hasExact) unassignedIdx++;
    }
    return unassigned[unassignedIdx];
  };

  const mountedCount = activeBays.filter((b) => b.tankNo).length;
  const runningCount = activeBays.filter((b) => b.status === 'RUNNING').length;
  const totalActiveFlow = runningCount > 0 ? 1700 : 0;
  const yard1UsableMassTon = yard1TanksList.reduce(
    (acc, t) => acc + Math.max(0, (((t.levelPercent || 60) - 4) / 100) * 18.2),
    0
  );
  const yard1TotalEnergyMMBtu = Math.round((yard1UsableMassTon > 0 ? yard1UsableMassTon : 97.1) * 52.0);
  const yard1AutonomyDays = ((yard1UsableMassTon > 0 ? yard1UsableMassTon : 97.1) / 21.6).toFixed(1);

  const yard1HighPressCount = yard1TanksList.filter((t) => (t.pressureMpa || 0) >= 0.74).length;

  const activeRunningBay =
    activeBays.find((b) => b.status === 'RUNNING') || activeBays.find((b) => b.tankNo) || activeBays[0];
  const activeRackTag = getRackTag(activeRunningBay?.bayId || 'Bay 01');
  const activeTankNo = activeRunningBay?.tankNo || 'ISOT-009';
  const activeBayTankAsset = tankInventory.find((t) => t.id === activeRunningBay?.tankNo);
  const activeFleetTank = fleetTanks.find((t) => t.tankNo === activeRunningBay?.tankNo);
  const activeBayLevel = activeRunningBay?.level ?? activeBayTankAsset?.levelPercent ?? activeFleetTank?.level ?? 49.0;
  const activeBayMassTon = (activeBayLevel / 100) * 18.2;
  const currentTankMassKg = (activeBayLevel / 100) * 18200;
  const usableToHeelKg = Math.max(0, currentTankMassKg - 420);
  const remainHours = usableToHeelKg / 900;
  const targetDate = new Date(Date.now() + remainHours * 3600 * 1000);
  const targetTimeStr = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const yard2TotalHeelTon =
    yard2TanksList.length > 0
      ? yard2TanksList.reduce((acc, t) => acc + ((t.levelPercent || 4) / 100) * 18.2, 0)
      : 0.73;

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* 1. Top 3 Zone KPI Summary Strip (Engineering Autonomy & Energy SCADA Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 select-none">
        {/* Card 1: ORU ( LD - 1 ) */}
        <div className="win-panel overflow-hidden border border-slate-300 flex flex-col justify-between">
          <div className="bg-[#002b4d] px-3 py-2 flex justify-between items-center text-white border-b border-blue-900/60">
            <span className="text-slate-100 font-bold text-xs sm:text-sm tracking-wider uppercase flex-1 text-center">
              ORU ( LD - 1 )
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"
              title="Normal Cryo Ready Buffer"
            />
          </div>
          <div className="p-3 space-y-1.5 font-mono text-xs sm:text-sm text-slate-800 bg-white">
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Staged Tanks:</span>
              <strong className="text-slate-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {yard1TanksList.length} / 34 Slots ({yard1OccupancyPct}%)
              </strong>
            </div>
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Usable Net Mass:</span>
              <strong className="text-slate-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {yard1UsableMassTon.toFixed(1)} ton LNG
              </strong>
            </div>
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Total Energy:</span>
              <strong className="text-blue-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {yard1TotalEnergyMMBtu.toLocaleString()} MMBtu
              </strong>
            </div>
            <div className="flex items-center justify-between w-full pt-1">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Est. Autonomy:</span>
              <strong className="text-[#0284c7] font-extrabold text-sm font-mono text-right truncate pl-2">
                ~{yard1AutonomyDays} Days
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: ORU ( ISO TK - Skid ) */}
        <div className="win-panel overflow-hidden border border-slate-300 flex flex-col justify-between">
          <div className="bg-[#002b4d] px-3 py-2 flex justify-between items-center text-white border-b border-blue-900/60">
            <span className="text-slate-100 font-bold text-xs sm:text-sm tracking-wider uppercase flex-1 text-center">
              ORU ( ISO TK - Skid )
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                runningCount > 0 ? 'bg-[#10b981] animate-pulse' : 'bg-[#d97706]'
              }`}
              title={runningCount > 0 ? 'Active Vaporization Online' : 'Standby / Low Flow'}
            />
          </div>
          <div className="p-3 space-y-1.5 font-mono text-xs sm:text-sm text-slate-800 bg-white">
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Active Supply:</span>
              <strong className="text-slate-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {activeRackTag} ({activeTankNo})
              </strong>
            </div>
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Sendout Rate:</span>
              <strong
                className="text-blue-900 font-bold text-xs text-right truncate pl-2 font-mono"
                title="2-Vaporizer Train Sendout Rate: 1,700 Nm³/h (43.2 t/day)"
              >
                1,700 Nm³/h (43.2 t/d)
              </strong>
            </div>
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Active TK Mass:</span>
              <strong className="text-slate-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {activeBayMassTon.toFixed(1)} ton (~{activeBayLevel.toFixed(0)}%)
              </strong>
            </div>
            <div className="flex items-center justify-between w-full pt-1">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">1.0m³ Cutoff:</span>
              <strong className="text-[#f59e0b] font-extrabold text-sm font-mono text-right truncate pl-2">
                ~{remainHours.toFixed(1)}h (ETA: {targetTimeStr})
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: ORU ( LD - 2 ) */}
        <div className="win-panel overflow-hidden border border-slate-300 flex flex-col justify-between">
          <div className="bg-[#002b4d] px-3 py-2 flex justify-between items-center text-white border-b border-blue-900/60">
            <span className="text-slate-100 font-bold text-xs sm:text-sm tracking-wider uppercase flex-1 text-center">
              ORU ( LD - 2 )
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"
              title="Heel Buffer & Vacuum Intact"
            />
          </div>
          <div className="p-3 space-y-1.5 font-mono text-xs sm:text-sm text-slate-800 bg-white">
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Empty Staged:</span>
              <strong className="text-slate-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {yard2TanksList.length} / 16 Slots
              </strong>
            </div>
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Retained Heel:</span>
              <strong className="text-purple-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {yard2TotalHeelTon.toFixed(2)} ton (1.0 m³ Cutoff)
              </strong>
            </div>
            <div className="flex items-center justify-between w-full border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">Backhaul Target:</span>
              <strong className="text-blue-900 font-bold text-xs text-right truncate pl-2 font-mono">
                {yard2TanksList.length} / 10 Ready
              </strong>
            </div>
            <div className="flex items-center justify-between w-full pt-1">
              <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0">M/V Saviour:</span>
              <strong className="text-slate-800 font-bold text-xs text-right truncate pl-2 font-mono">
                Shipment N-2 Staged
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 3-Column Visual Yard Map (Equal Height Flow Layout: 1.3fr 1fr 1.3fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1.3fr] gap-2.5 items-stretch h-[calc(100vh-270px)] min-h-[660px] max-h-[calc(100vh-240px)]">
        {/* ================================================================= */}
        {/* COLUMN 1: LAYDOWN YARD 1 (RECEIVING & BOG BUFFER - 34 SLOTS)      */}
        {/* ================================================================= */}
        <div className="win-panel overflow-hidden border border-slate-300 flex flex-col h-full min-h-0 bg-[#d6d3c8]">
          {/* Navy Panel Header (Sticky Top) */}
          <div className="bg-[#002b4d] px-3 py-2 flex items-center justify-between text-white shrink-0 sticky top-0 z-20 shadow-xs border-b border-blue-900/60">
            <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wide truncate">
              ORU ( LD - 1 )
            </h4>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-black px-2 py-0.5 bg-blue-950/80 text-cyan-300 border border-blue-400/40 whitespace-nowrap">
                {yard1TanksList.length} / 34
              </span>
              <span
                className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                  yard1HighPressCount > 0 ? 'bg-[#d97706]' : 'bg-[#10b981]'
                }`}
              />
            </div>
          </div>

          {/* 34 Slots in 2 Columns with Custom Scrollbar */}
          <div className="p-2.5 bg-[#d6d3c8] grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden content-start custom-scada-scrollbar">
            {Array.from({ length: 34 }).map((_, slotIdx) => {
              const slotNum = slotIdx + 1;
              const tank = getTankAtSlot(yard1TanksList, slotIdx);
              const slotTargetId = `LAYDOWN_1-slot-${slotNum}`;
              const isDragOver = dragOverTarget === slotTargetId;

              if (tank) {
                const isDragging = draggingTankNo === tank.id;
                const isHighPress = (tank.pressureMpa || 0) >= 0.74;
                const massKg = ((tank.levelPercent / 100) * 18200).toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                });

                return (
                  <div
                    key={tank.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, tank.id, 'LAYDOWN_1')}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedDetailTank(tank)}
                    className={`relative p-2.5 pb-2 flex flex-col justify-between gap-1.5 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all rounded-xs border-2 select-none ${
                      isDragging
                        ? 'opacity-50 scale-95 ring-2 ring-blue-500 border-blue-500'
                        : isHighPress
                        ? 'border-amber-500 bg-gradient-to-b from-[#fef3c7]/60 to-[#fde68a]/40 hover:border-amber-600'
                        : 'border-[#64748b] bg-gradient-to-b from-[#e8edf2] to-[#dbe2ea] hover:border-[#0284c7]'
                    }`}
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    {/* 4 Corner Bolt Casting Marks (ISO Steel Detail) */}
                    <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-tl-xs pointer-events-none" />
                    <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-tr-xs pointer-events-none" />
                    <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-bl-xs pointer-events-none" />
                    <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-br-xs pointer-events-none" />

                    {/* [1. Top Header Row]: Serial (Left) | Status Badge (Right) */}
                    <div className="flex justify-between items-center px-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-[#002b4d] truncate">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{tank.serialNo || `SIMU-82010${slotNum}`}</span>
                      </div>
                      <div>
                        {isHighPress ? (
                          <span className="text-[8.5px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 border border-amber-500 rounded-xs shadow-2xs">
                            [HIGH PRESS]
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 border border-slate-300 rounded-xs shadow-2xs">
                            [VENTED]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* [2. Saddle / Tank Bed Bar]: ISOT Tank ID in Deep Navy Bold */}
                    <div className="text-center py-0.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-y border-slate-300 rounded-xs shadow-inner flex items-center justify-center gap-2">
                      <span className="w-2 h-0.5 bg-slate-400 rounded-full inline-block" />
                      <span className="text-[15px] font-mono font-black tracking-tight text-[#002b4d]">
                        {tank.id}
                      </span>
                      <span className="w-2 h-0.5 bg-slate-400 rounded-full inline-block" />
                    </div>

                    {/* [3. Physical 40ft Cylindrical Tank Visual & Liquid Level] */}
                    <div className="relative w-full h-[76px] flex items-center justify-center bg-slate-200/70 rounded-xs border border-slate-300/90 p-1 shadow-inner">
                      <svg viewBox="0 0 420 86" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`tankVessel-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f8fafc" />
                            <stop offset="50%" stopColor="#cbd5e1" />
                            <stop offset="100%" stopColor="#94a3b8" />
                          </linearGradient>
                          <linearGradient id={`gasVaporBg-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f1f5f9" />
                            <stop offset="60%" stopColor="#e2e8f0" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                          </linearGradient>
                          <linearGradient id={`liquidFill-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor="#0284c7" />
                            <stop offset="100%" stopColor="#0369a1" />
                          </linearGradient>
                          <pattern id={`gasPattern-${tank.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.75" strokeOpacity="0.3" />
                          </pattern>
                          <clipPath id={`innerWindowClip-${tank.id}`}>
                            <rect x="58" y="14" width="304" height="58" rx="8" />
                          </clipPath>
                        </defs>

                        {/* Outer Steel Skid Frame */}
                        <line x1="28" y1="12" x2="392" y2="12" stroke="#475569" strokeWidth="2.5" />
                        <line x1="28" y1="74" x2="392" y2="74" stroke="#475569" strokeWidth="3" />

                        {/* Left Vertical End Post */}
                        <rect x="24" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                        <rect x="22" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                        <rect x="22" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

                        {/* Right Vertical End Post */}
                        <rect x="388" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                        <rect x="386" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                        <rect x="386" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

                        {/* Diagonal Bottom Corner Gussets (Saddle Braces) */}
                        <polygon points="32,74 72,74 32,48" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                        <polygon points="388,74 348,74 388,48" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />

                        {/* Left Convex Dish End Dome */}
                        <path d="M 58 14 C 28 14, 28 72, 58 72 Z" fill={`url(#tankVessel-${tank.id})`} stroke="#475569" strokeWidth="2" />

                        {/* Right Convex Dish End Dome */}
                        <path d="M 362 14 C 392 14, 392 72, 362 72 Z" fill={`url(#tankVessel-${tank.id})`} stroke="#475569" strokeWidth="2" />

                        {/* Main Cylindrical Barrel Background */}
                        <rect x="56" y="12" width="308" height="62" fill={`url(#tankVessel-${tank.id})`} stroke="#475569" strokeWidth="1.5" />

                        {/* Inner Cut-out Viewing Window Border */}
                        <rect
                          x="58"
                          y="14"
                          width="304"
                          height="58"
                          rx="8"
                          fill="#f1f5f9"
                          stroke="#64748b"
                          strokeWidth="1.5"
                        />

                        {/* Dual-Phase Gas Space & Cryo Liquid Interior */}
                        <g clipPath={`url(#innerWindowClip-${tank.id})`}>
                          {/* [1. Upper Gas / Vapor Phase (BOG Headspace)] */}
                          <rect
                            x="58"
                            y="14"
                            width="304"
                            height="58"
                            fill={`url(#gasVaporBg-${tank.id})`}
                          />
                          {/* Gas Molecules Micro-Pattern */}
                          <rect
                            x="58"
                            y="14"
                            width="304"
                            height="58"
                            fill={`url(#gasPattern-${tank.id})`}
                          />
                          {/* Gas Space SCADA Annotation */}
                          <text
                            x="70"
                            y="25"
                            fill="#475569"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                            letterSpacing="0.8"
                          >
                            GAS / VAPOR (BOG)
                          </text>
                          <text
                            x="350"
                            y="25"
                            textAnchor="end"
                            fill="#64748b"
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                            letterSpacing="0.5"
                          >
                            HEADSPACE
                          </text>

                          {/* [2. Lower Liquid LNG Phase (Cryo Fill)] */}
                          {(() => {
                            const fillHeight = (tank.levelPercent / 100) * 58;
                            const fillY = 72 - fillHeight;
                            return (
                              <g>
                                <rect
                                  x="58"
                                  y={fillY}
                                  width="304"
                                  height={fillHeight}
                                  fill={`url(#liquidFill-${tank.id})`}
                                />
                                {/* Liquid-Gas Meniscus Wave Interface Line */}
                                <path
                                  d={`M 58 ${fillY} Q 134 ${fillY - 2}, 210 ${fillY} T 362 ${fillY}`}
                                  fill="none"
                                  stroke="#bae6fd"
                                  strokeWidth="2"
                                  strokeOpacity="0.95"
                                />
                                {/* Liquid LNG Label */}
                                {tank.levelPercent >= 25 && (
                                  <text
                                    x="70"
                                    y="66"
                                    fill="#ffffff"
                                    opacity="0.85"
                                    fontSize="8"
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                    letterSpacing="0.5"
                                  >
                                    LIQUID LNG
                                  </text>
                                )}
                              </g>
                            );
                          })()}
                        </g>

                        {/* Centered Percentage Level Overlay with White Halo for Maximum Legibility */}
                        <text
                          x="210"
                          y="49"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#002b4d"
                          fontSize="17"
                          fontWeight="900"
                          fontFamily="monospace"
                          letterSpacing="0.5"
                          style={{
                            paintOrder: 'stroke fill',
                            stroke: '#ffffff',
                            strokeWidth: '1.5px',
                            strokeLinejoin: 'round',
                          }}
                        >
                          {(tank.levelPercent || 50).toFixed(1)}%
                        </text>
                      </svg>
                    </div>

                    {/* [4. Bottom Telemetry Data Bar]: 4 Discrete Columns [ Pressure ➔ Temp ➔ Volume ➔ Mass ] */}
                    <div className="border border-slate-300 rounded-xs bg-white grid grid-cols-4 divide-x divide-slate-200 py-1.5 px-0.5 text-center shadow-2xs">
                      {/* 1. Pressure */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span
                          className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${
                            isHighPress ? 'text-amber-700 font-black' : 'text-[#0f172a]'
                          }`}
                        >
                          {(tank.pressureMpa || 0).toFixed(2)} <span className="text-[8.5px]">MPa</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Pressure
                        </span>
                      </div>

                      {/* 2. Temp */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {(tank.tempC ?? -160.0).toFixed(1)} <span className="text-[8.5px]">°C</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Temp
                        </span>
                      </div>

                      {/* 3. Volume */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {(tank.levelPercent * 0.44).toFixed(1)} <span className="text-[8.5px]">m³</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Volume
                        </span>
                      </div>

                      {/* 4. Mass */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {massKg} <span className="text-[8.5px]">kg</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Mass
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-y1-${slotNum}`}
                  onDragOver={(e) => handleDragOver(e, slotTargetId)}
                  onDragLeave={() => handleDragLeave(slotTargetId)}
                  onDrop={(e) => handleDrop(e, 'LAYDOWN_1', slotNum)}
                  className={`min-h-[160px] p-2 flex items-center justify-center text-center transition-all cursor-pointer rounded-xs border-2 border-dashed ${
                    isDragOver
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400'
                      : 'bg-[#f1efea] border-slate-300 hover:border-slate-400 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {isDragOver ? 'Drop Tank' : '+ Empty Slot'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUMN 2: ISO TK - SKID (PLTMG ACTIVE SENDOUT - 4 RACKS: T-201~T-204) */}
        {/* ================================================================= */}
        <div className="win-panel overflow-hidden border border-slate-300 flex flex-col h-full min-h-0 bg-[#d6d3c8]">
          {/* Navy Panel Header (Sticky Top) */}
          <div className="bg-[#002b4d] px-3 py-2 flex items-center justify-between text-white shrink-0 sticky top-0 z-20 shadow-xs border-b border-blue-900/60">
            <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wide truncate">
              ORU ( ISO TK - Skid )
            </h4>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[11px] font-mono font-black px-2 py-0.5 bg-blue-950/80 text-emerald-300 border border-emerald-500/40 whitespace-nowrap"
                title="2-Vaporizer Train Nominal Flow Rate"
              >
                {totalActiveFlow > 0 ? `${totalActiveFlow.toLocaleString()} Nm³/h` : '0 Nm³/h'}
              </span>
              <span
                className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                  mountedCount > 0 ? 'bg-[#10b981]' : 'bg-[#d97706]'
                }`}
              />
            </div>
          </div>

          {/* 4 Skid Rack Cards with Custom Scrollbar */}
          <div className="p-2.5 bg-[#d6d3c8] grid grid-cols-1 gap-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden content-start custom-scada-scrollbar">
            {activeBays.map((bay) => {
              const isDragOver = dragOverTarget === bay.bayId;
              const tank = fleetTanks.find((t) => t.tankNo === bay.tankNo);
              const isRunning = bay.status === 'RUNNING';

              if (bay.tankNo) {
                const bayTankAsset = tankInventory.find((t) => t.id === bay.tankNo);
                const levelPercent =
                  bay.level !== undefined && bay.level !== null && bay.level > 0
                    ? bay.level
                    : bayTankAsset?.levelPercent !== undefined && bayTankAsset.levelPercent > 0
                    ? bayTankAsset.levelPercent
                    : tank?.level !== undefined && tank.level > 0
                    ? tank.level
                    : 49.0;
                const pressureMpa =
                  bay.pressure !== undefined && bay.pressure !== null && bay.pressure > 0
                    ? bay.pressure
                    : bayTankAsset?.pressureMpa !== undefined && bayTankAsset.pressureMpa > 0
                    ? bayTankAsset.pressureMpa
                    : tank?.pressureMPa || 0.76;
                const tempC =
                  bay.temp !== undefined && bay.temp !== null && bay.temp < 0
                    ? bay.temp
                    : bayTankAsset?.tempC !== undefined && bayTankAsset.tempC < 0
                    ? bayTankAsset.tempC
                    : tank?.tempC || -126.7;
                const serialNo = bayTankAsset?.serialNo || tank?.serialNo || bay.serialNo || 'SIMU-8101426';
                const volumeM3 = (levelPercent * 0.44).toFixed(1);
                const rawMassKg = (levelPercent / 100) * 18200;
                const bayMassKg = rawMassKg.toLocaleString('en-US', { maximumFractionDigits: 0 });
                const rackTag = getRackTag(bay.bayId);
                const isLiquidFeed = rackTag === 'T-201' || rackTag === 'T-202';
                const isPbuRack = rackTag === 'T-203' || rackTag === 'T-204';
                const isSwapReq = isLiquidFeed && rawMassKg <= 13222;
                const isPbuReq = isPbuRack && rawMassKg <= 15151;
                const flowRate = isRunning ? 1700 : 0;
                const bayKey = `bay_${bay.bayId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

                return (
                  <div
                    key={bay.bayId}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, bay.tankNo!, bay.bayId)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      const bayZoneKey = bay.bayId.replace(' ', '_').toUpperCase() as NiasZone;
                      const assetToSelect: NiasTankAsset = bayTankAsset
                        ? {
                            ...bayTankAsset,
                            currentZone: bayZoneKey,
                            levelPercent,
                            pressureMpa,
                            tempC,
                            levelMmH2O: bayTankAsset.levelMmH2O || 180,
                          }
                        : {
                            id: bay.tankNo!,
                            serialNo: serialNo,
                            shipment: 'Shipment N-1',
                            currentZone: bayZoneKey,
                            slotIndex: 1,
                            levelPercent,
                            levelM3: parseFloat((levelPercent * 0.44).toFixed(1)),
                            levelMmH2O: 180,
                            pressureMpa,
                            tempC,
                            batteryPercent: 88,
                          };
                      setSelectedDetailTank(assetToSelect);
                    }}
                    className="relative p-2.5 pb-2 flex flex-col justify-between gap-1.5 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all rounded-xs border-2 select-none border-[#059669] bg-gradient-to-b from-[#e8edf2] to-[#dbe2ea]"
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    {/* 4 Corner Bolt Casting Marks */}
                    <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-tl-xs pointer-events-none" />
                    <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-tr-xs pointer-events-none" />
                    <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-bl-xs pointer-events-none" />
                    <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-br-xs pointer-events-none" />

                    {/* [1. Top Header Rows]: 2 Rows (Row 1: Rack & Serial | Row 2: Status Badges) */}
                    <div className="flex flex-col gap-1.5 w-full px-0.5">
                      {/* Row 1: Rack Tag (Left) & Serial (Right) */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="bg-[#002b4d] text-emerald-300 px-1.5 py-0.5 rounded-xs text-xs font-mono font-bold whitespace-nowrap shadow-2xs">
                            {rackTag}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                          {serialNo}
                        </span>
                      </div>

                      {/* Row 2: Alarm Badges (Left) & Sendout Status (Right) */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">
                          {isSwapReq && (
                            <span
                              className="px-1.5 py-0.5 uppercase bg-amber-500 text-slate-950 font-bold text-[10px] font-mono border border-amber-600 rounded-xs animate-pulse shadow-xs whitespace-nowrap"
                              title="SOP Rev.0 Liquid Feed Threshold: Mass ≤ 13,222 kg (Swap to Standby Skid Required)"
                            >
                              SWAP REQ
                            </span>
                          )}
                          {isPbuReq && (
                            <span
                              className="px-1.5 py-0.5 uppercase bg-amber-500 text-slate-950 font-bold text-[10px] font-mono border border-amber-600 rounded-xs animate-pulse shadow-xs whitespace-nowrap"
                              title="SOP Rev.0 PBU Pressure Build-up Threshold: Mass ≤ 15,151 kg (PBU Cycle Required)"
                            >
                              PBU REQ
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 uppercase border rounded-xs font-bold text-[10px] font-mono flex items-center gap-1 shadow-2xs whitespace-nowrap ${
                            isRunning
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                              : 'bg-slate-100 text-slate-700 border-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isRunning ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          {isRunning ? `SENDING (${flowRate.toLocaleString()} Nm³/h)` : 'STANDBY'}
                        </span>
                      </div>
                    </div>

                    {/* [2. Saddle / Tank Bed Bar]: Mounted Tank ID */}
                    <div className="text-center py-0.5 bg-gradient-to-r from-emerald-100 via-slate-100 to-emerald-100 border-y border-emerald-300 rounded-xs shadow-inner flex items-center justify-center gap-2">
                      <span className="w-2 h-0.5 bg-emerald-500/60 rounded-full inline-block" />
                      <span className="text-[15px] font-mono font-black tracking-tight text-[#002b4d]">
                        {bay.tankNo}
                      </span>
                      <span className="w-2 h-0.5 bg-emerald-500/60 rounded-full inline-block" />
                    </div>

                    {/* [3. Physical 40ft Cylindrical Tank Visual & Liquid Level] */}
                    <div className="relative w-full h-[76px] flex items-center justify-center bg-slate-200/70 rounded-xs border border-slate-300/90 p-1 shadow-inner">
                      <svg viewBox="0 0 420 86" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`tankVessel-${bayKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f8fafc" />
                            <stop offset="50%" stopColor="#cbd5e1" />
                            <stop offset="100%" stopColor="#94a3b8" />
                          </linearGradient>
                          <linearGradient id={`gasVaporBg-${bayKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f1f5f9" />
                            <stop offset="60%" stopColor="#e2e8f0" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                          </linearGradient>
                          <linearGradient id={`liquidFill-${bayKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor="#0284c7" />
                            <stop offset="100%" stopColor="#0369a1" />
                          </linearGradient>
                          <pattern id={`gasPattern-${bayKey}`} width="8" height="8" patternUnits="userSpaceOnUse">
                            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.75" strokeOpacity="0.3" />
                          </pattern>
                          <clipPath id={`innerWindowClip-${bayKey}`}>
                            <rect x="58" y="14" width="304" height="58" rx="8" />
                          </clipPath>
                        </defs>

                        {/* Outer Steel Skid Frame */}
                        <line x1="28" y1="12" x2="392" y2="12" stroke="#475569" strokeWidth="2.5" />
                        <line x1="28" y1="74" x2="392" y2="74" stroke="#475569" strokeWidth="3" />

                        {/* Left Vertical End Post */}
                        <rect x="24" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                        <rect x="22" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                        <rect x="22" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

                        {/* Right Vertical End Post */}
                        <rect x="388" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                        <rect x="386" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                        <rect x="386" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

                        {/* Diagonal Bottom Corner Gussets (Saddle Braces) */}
                        <polygon points="32,74 72,74 32,48" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                        <polygon points="388,74 348,74 388,48" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />

                        {/* Left Convex Dish End Dome */}
                        <path d="M 58 14 C 28 14, 28 72, 58 72 Z" fill={`url(#tankVessel-${bayKey})`} stroke="#475569" strokeWidth="2" />

                        {/* Right Convex Dish End Dome */}
                        <path d="M 362 14 C 392 14, 392 72, 362 72 Z" fill={`url(#tankVessel-${bayKey})`} stroke="#475569" strokeWidth="2" />

                        {/* Main Cylindrical Barrel Background */}
                        <rect x="56" y="12" width="308" height="62" fill={`url(#tankVessel-${bayKey})`} stroke="#475569" strokeWidth="1.5" />

                        {/* Inner Cut-out Viewing Window Border */}
                        <rect
                          x="58"
                          y="14"
                          width="304"
                          height="58"
                          rx="8"
                          fill="#f1f5f9"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                        />

                        {/* Dual-Phase Gas Space & Cryo Liquid Interior */}
                        <g clipPath={`url(#innerWindowClip-${bayKey})`}>
                          {/* [1. Upper Gas / Vapor Phase (BOG Headspace)] */}
                          <rect
                            x="58"
                            y="14"
                            width="304"
                            height="58"
                            fill={`url(#gasVaporBg-${bayKey})`}
                          />
                          {/* Gas Molecules Micro-Pattern */}
                          <rect
                            x="58"
                            y="14"
                            width="304"
                            height="58"
                            fill={`url(#gasPattern-${bayKey})`}
                          />
                          {/* Gas Space SCADA Annotation */}
                          <text
                            x="70"
                            y="25"
                            fill="#475569"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                            letterSpacing="0.8"
                          >
                            GAS / VAPOR (BOG)
                          </text>
                          <text
                            x="350"
                            y="25"
                            textAnchor="end"
                            fill="#64748b"
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                            letterSpacing="0.5"
                          >
                            HEADSPACE
                          </text>

                          {/* [2. Lower Liquid LNG Phase (Unified Cryo Blue Fill)] */}
                          {(() => {
                            const fillHeight = (levelPercent / 100) * 58;
                            const fillY = 72 - fillHeight;
                            return (
                              <g>
                                <rect
                                  x="58"
                                  y={fillY}
                                  width="304"
                                  height={fillHeight}
                                  fill={`url(#liquidFill-${bayKey})`}
                                />
                                {/* Liquid-Gas Meniscus Wave Interface Line */}
                                <path
                                  d={`M 58 ${fillY} Q 134 ${fillY - 2}, 210 ${fillY} T 362 ${fillY}`}
                                  fill="none"
                                  stroke="#bae6fd"
                                  strokeWidth="2"
                                  strokeOpacity="0.95"
                                />
                                {/* Liquid LNG Label */}
                                {levelPercent >= 25 && (
                                  <text
                                    x="70"
                                    y="66"
                                    fill="#ffffff"
                                    opacity="0.85"
                                    fontSize="8"
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                    letterSpacing="0.5"
                                  >
                                    LIQUID LNG
                                  </text>
                                )}
                              </g>
                            );
                          })()}
                        </g>

                        {/* Centered Percentage Level Overlay with White Halo for Maximum Legibility */}
                        <text
                          x="210"
                          y="49"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#002b4d"
                          fontSize="17"
                          fontWeight="900"
                          fontFamily="monospace"
                          letterSpacing="0.5"
                          style={{
                            paintOrder: 'stroke fill',
                            stroke: '#ffffff',
                            strokeWidth: '1.5px',
                            strokeLinejoin: 'round',
                          }}
                        >
                          {levelPercent.toFixed(1)}%
                        </text>
                      </svg>
                    </div>

                    {/* [4. Bottom Telemetry Data Bar]: 4 Discrete Columns [ Pressure ➔ Temp ➔ Volume ➔ Mass ] */}
                    <div className="border border-slate-300 rounded-xs bg-white grid grid-cols-4 divide-x divide-slate-200 py-1.5 px-0.5 text-center shadow-2xs">
                      {/* 1. Pressure */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {pressureMpa.toFixed(2)} <span className="text-[8.5px]">MPa</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Pressure
                        </span>
                      </div>

                      {/* 2. Temp */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {tempC.toFixed(1)} <span className="text-[8.5px]">°C</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Temp
                        </span>
                      </div>

                      {/* 3. Volume */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {volumeM3} <span className="text-[8.5px]">m³</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Volume
                        </span>
                      </div>

                      {/* 4. Mass */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {bayMassKg} <span className="text-[8.5px]">kg</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Mass
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={bay.bayId}
                  onDragOver={(e) => handleDragOver(e, bay.bayId)}
                  onDragLeave={() => handleDragLeave(bay.bayId)}
                  onDrop={(e) => handleDrop(e, 'FOUR_BAY_REGAS', undefined, bay.bayId)}
                  className={`min-h-[160px] p-3 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer rounded-xs border-2 border-dashed ${
                    isDragOver
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400'
                      : 'bg-[#f1efea] border-slate-300 hover:border-slate-400 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {getRackTag(bay.bayId)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {isDragOver ? 'Drop Tank to Mount' : 'Standby - Empty Rack'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUMN 3: LAYDOWN YARD 2 (EMPTY HEEL 1.0 m³ STAGING - 16 SLOTS)   */}
        {/* ================================================================= */}
        <div className="win-panel overflow-hidden border border-slate-300 flex flex-col h-full min-h-0 bg-[#d6d3c8]">
          {/* Navy Panel Header (Sticky Top) */}
          <div className="bg-[#002b4d] px-3 py-2 flex items-center justify-between text-white shrink-0 sticky top-0 z-20 shadow-xs border-b border-blue-900/60">
            <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wide truncate">
              ORU ( LD - 2 )
            </h4>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-black px-2 py-0.5 bg-blue-950/80 text-cyan-300 border border-blue-400/40 whitespace-nowrap">
                {yard2TanksList.length} / 16
              </span>
              <span className="w-2 h-2 rounded-full inline-block shrink-0 bg-[#10b981]" />
            </div>
          </div>

          {/* 16 Slots in 2 Columns with Custom Scrollbar */}
          <div className="p-2.5 bg-[#d6d3c8] grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden content-start custom-scada-scrollbar">
            {Array.from({ length: 16 }).map((_, slotIdx) => {
              const slotNum = slotIdx + 1;
              const tank = getTankAtSlot(yard2TanksList, slotIdx);
              const slotTargetId = `LAYDOWN_2-slot-${slotNum}`;
              const isDragOver = dragOverTarget === slotTargetId;

              if (tank) {
                const isDragging = draggingTankNo === tank.id;
                const massKg = ((tank.levelPercent / 100) * 18200).toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                });

                return (
                  <div
                    key={tank.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, tank.id, 'LAYDOWN_2')}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedDetailTank(tank)}
                    className={`relative p-2.5 pb-2 flex flex-col justify-between gap-1.5 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all rounded-xs border-2 select-none ${
                      isDragging
                        ? 'opacity-50 scale-95 ring-2 ring-purple-500 border-purple-500'
                        : 'border-[#64748b] bg-gradient-to-b from-[#e8edf2] to-[#dbe2ea] hover:border-[#7c3aed]'
                    }`}
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    {/* 4 Corner Bolt Casting Marks */}
                    <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-tl-xs pointer-events-none" />
                    <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-tr-xs pointer-events-none" />
                    <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-bl-xs pointer-events-none" />
                    <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-br-xs pointer-events-none" />

                    {/* [1. Top Header Row]: Serial (Left) | Heel 1.0m³ Status (Right) */}
                    <div className="flex justify-between items-center px-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#002b4d] truncate">
                        <span className="truncate text-[11px] font-semibold text-slate-700">
                          {tank.serialNo || `SIMU-82020${slotNum}`}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`text-[8.5px] font-mono font-bold px-2 py-0.5 border rounded-xs shadow-2xs ${
                            (tank.levelPercent || 4) <= 5
                              ? 'bg-purple-100 text-purple-950 border-purple-300'
                              : 'bg-emerald-100 text-emerald-950 border-emerald-400'
                          }`}
                        >
                          {(tank.levelPercent || 4) <= 5
                            ? 'HEEL 1.0m³'
                            : `${tank.levelPercent.toFixed(0)}% LADEN`}
                        </span>
                      </div>
                    </div>

                    {/* [2. Saddle / Tank Bed Bar]: ISOT Tank ID */}
                    <div className="text-center py-0.5 bg-gradient-to-r from-purple-100 via-slate-100 to-purple-100 border-y border-purple-300 rounded-xs shadow-inner flex items-center justify-center gap-2">
                      <span className="w-2 h-0.5 bg-purple-400 rounded-full inline-block" />
                      <span className="text-[15px] font-mono font-black tracking-tight text-[#002b4d]">
                        {tank.id}
                      </span>
                      <span className="w-2 h-0.5 bg-purple-400 rounded-full inline-block" />
                    </div>

                    {/* [3. Physical 40ft Cylindrical Tank Visual & Liquid Level] */}
                    <div className="relative w-full h-[76px] flex items-center justify-center bg-slate-200/70 rounded-xs border border-slate-300/90 p-1 shadow-inner">
                      <svg viewBox="0 0 420 86" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`tankVessel-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f8fafc" />
                            <stop offset="50%" stopColor="#cbd5e1" />
                            <stop offset="100%" stopColor="#94a3b8" />
                          </linearGradient>
                          <linearGradient id={`gasVaporBg-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f1f5f9" />
                            <stop offset="60%" stopColor="#e2e8f0" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                          </linearGradient>
                          <linearGradient id={`liquidFill-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor="#0284c7" />
                            <stop offset="100%" stopColor="#0369a1" />
                          </linearGradient>
                          <pattern id={`gasPattern-${tank.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.75" strokeOpacity="0.3" />
                          </pattern>
                          <clipPath id={`innerWindowClip-${tank.id}`}>
                            <rect x="58" y="14" width="304" height="58" rx="8" />
                          </clipPath>
                        </defs>

                        {/* Outer Steel Skid Frame */}
                        <line x1="28" y1="12" x2="392" y2="12" stroke="#475569" strokeWidth="2.5" />
                        <line x1="28" y1="74" x2="392" y2="74" stroke="#475569" strokeWidth="3" />

                        {/* Left Vertical End Post */}
                        <rect x="24" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                        <rect x="22" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                        <rect x="22" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

                        {/* Right Vertical End Post */}
                        <rect x="388" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                        <rect x="386" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                        <rect x="386" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

                        {/* Diagonal Bottom Corner Gussets (Saddle Braces) */}
                        <polygon points="32,74 72,74 32,48" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                        <polygon points="388,74 348,74 388,48" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />

                        {/* Left Convex Dish End Dome */}
                        <path d="M 58 14 C 28 14, 28 72, 58 72 Z" fill={`url(#tankVessel-${tank.id})`} stroke="#475569" strokeWidth="2" />

                        {/* Right Convex Dish End Dome */}
                        <path d="M 362 14 C 392 14, 392 72, 362 72 Z" fill={`url(#tankVessel-${tank.id})`} stroke="#475569" strokeWidth="2" />

                        {/* Main Cylindrical Barrel Background */}
                        <rect x="56" y="12" width="308" height="62" fill={`url(#tankVessel-${tank.id})`} stroke="#475569" strokeWidth="1.5" />

                        {/* Inner Cut-out Viewing Window Border */}
                        <rect
                          x="58"
                          y="14"
                          width="304"
                          height="58"
                          rx="8"
                          fill="#f1f5f9"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                        />

                        {/* Dual-Phase Gas Space & Heel Liquid Interior */}
                        <g clipPath={`url(#innerWindowClip-${tank.id})`}>
                          {/* [1. Upper Gas / Vapor Phase (BOG Headspace)] */}
                          <rect
                            x="58"
                            y="14"
                            width="304"
                            height="58"
                            fill={`url(#gasVaporBg-${tank.id})`}
                          />
                          {/* Gas Molecules Micro-Pattern */}
                          <rect
                            x="58"
                            y="14"
                            width="304"
                            height="58"
                            fill={`url(#gasPattern-${tank.id})`}
                          />
                          {/* Gas Space SCADA Annotation */}
                          <text
                            x="70"
                            y="25"
                            fill="#475569"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                            letterSpacing="0.8"
                          >
                            GAS / VAPOR (BOG)
                          </text>
                          <text
                            x="350"
                            y="25"
                            textAnchor="end"
                            fill="#64748b"
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                            letterSpacing="0.5"
                          >
                            HEADSPACE
                          </text>

                          {/* [2. Lower Liquid LNG Phase (Unified Cryo Blue Heel Fill)] */}
                          {(() => {
                            const fillHeight = Math.max(4, ((tank.levelPercent || 4) / 100) * 58);
                            const fillY = 72 - fillHeight;
                            return (
                              <g>
                                <rect
                                  x="58"
                                  y={fillY}
                                  width="304"
                                  height={fillHeight}
                                  fill={`url(#liquidFill-${tank.id})`}
                                />
                                {/* Liquid-Gas Meniscus Wave Interface Line */}
                                <path
                                  d={`M 58 ${fillY} Q 134 ${fillY - 2}, 210 ${fillY} T 362 ${fillY}`}
                                  fill="none"
                                  stroke="#bae6fd"
                                  strokeWidth="2"
                                  strokeOpacity="0.95"
                                />
                              </g>
                            );
                          })()}
                        </g>

                        {/* Centered Percentage Level Overlay with White Halo for Maximum Legibility */}
                        <text
                          x="210"
                          y="49"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#002b4d"
                          fontSize="17"
                          fontWeight="900"
                          fontFamily="monospace"
                          letterSpacing="0.5"
                          style={{
                            paintOrder: 'stroke fill',
                            stroke: '#ffffff',
                            strokeWidth: '1.5px',
                            strokeLinejoin: 'round',
                          }}
                        >
                          {(tank.levelPercent || 4.0).toFixed(1)}%
                        </text>
                      </svg>
                    </div>

                    {/* [4. Bottom Telemetry Data Bar]: 4 Discrete Columns [ Pressure ➔ Temp ➔ Volume ➔ Mass ] */}
                    <div className="border border-slate-300 rounded-xs bg-white grid grid-cols-4 divide-x divide-slate-200 py-1.5 px-0.5 text-center shadow-2xs">
                      {/* 1. Pressure */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {(tank.pressureMpa || 0.22).toFixed(2)} <span className="text-[8.5px]">MPa</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Pressure
                        </span>
                      </div>

                      {/* 2. Temp */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {(tank.tempC ?? -135.0).toFixed(1)} <span className="text-[8.5px]">°C</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Temp
                        </span>
                      </div>

                      {/* 3. Volume */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {((tank.levelPercent || 4.0) * 0.44).toFixed(1)} <span className="text-[8.5px]">m³</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Volume
                        </span>
                      </div>

                      {/* 4. Mass */}
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                          {massKg} <span className="text-[8.5px]">kg</span>
                        </span>
                        <span className="font-sans text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                          Mass
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-y2-heel-${slotNum}`}
                  onDragOver={(e) => handleDragOver(e, slotTargetId)}
                  onDragLeave={() => handleDragLeave(slotTargetId)}
                  onDrop={(e) => handleDrop(e, 'LAYDOWN_2', slotNum)}
                  className={`min-h-[160px] p-2 flex items-center justify-center text-center transition-all cursor-pointer rounded-xs border-2 border-dashed ${
                    isDragOver
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400'
                      : 'bg-[#f1efea] border-slate-300 hover:border-slate-400 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {isDragOver ? 'Drop Tank' : '+ Empty Slot'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
