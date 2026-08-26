'use client';

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Droplet,
  Zap,
  Play,
  Pause,
  FlaskConical,
  Wind,
  Layers,
  Activity,
  ArrowRight,
  Gauge,
  Cpu,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';

interface NiasProcessPIDDiagramProps {
  onSelectEquipment?: (eqId: string) => void;
}

type VaporizerId = 'VAP-103' | 'VAP-104' | 'VAP-105' | 'VAP-106';

export default function NiasProcessPIDDiagram({ onSelectEquipment }: NiasProcessPIDDiagramProps) {
  const { activeBays, gasCompositions } = usePortalData();

  // Animation Toggle
  const [isAnimationActive, setIsAnimationActive] = useState<boolean>(true);

  // Interactive Vaporizer States (Train 2: VAP-103/104, Train 3: VAP-105/106)
  const [vaporizerStates, setVaporizerStates] = useState<Record<VaporizerId, 'RUNNING' | 'STANDBY'>>({
    'VAP-103': 'RUNNING',
    'VAP-104': 'RUNNING',
    'VAP-105': 'STANDBY',
    'VAP-106': 'STANDBY',
  });

  // Toggle single vaporizer status
  const toggleVaporizer = (id: VaporizerId) => {
    setVaporizerStates((prev) => ({
      ...prev,
      [id]: prev[id] === 'RUNNING' ? 'STANDBY' : 'RUNNING',
    }));
  };

  // Active vaporizers count
  const activeVapCount = useMemo(() => {
    return Object.values(vaporizerStates).filter((s) => s === 'RUNNING').length;
  }, [vaporizerStates]);

  // Total Daily Sendout Metrics (Reconciled Daily Report Benchmark)
  const totalDailySendoutTon = 50.9;
  const totalDailySendoutNm3 = 102000;
  const totalDailyGenMwh = 440.0;

  // Evenly distribute daily throughput among active vaporizers
  const perVapThroughputTon = activeVapCount > 0 ? (totalDailySendoutTon / activeVapCount).toFixed(1) : '0.0';

  // Dynamic Bay Readings from Context
  const bay1 = activeBays.find((b) => b.bayId === 'Bay 01');
  const bay2 = activeBays.find((b) => b.bayId === 'Bay 02');
  const bay3 = activeBays.find((b) => b.bayId === 'Bay 03');
  const bay4 = activeBays.find((b) => b.bayId === 'Bay 04');

  // Latest GC Data
  const latestGC = gasCompositions[0] || {
    methane: 95.7,
    ethane: 3.82,
    propane: 0.35,
    ghv: 1054.6,
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* 1. Header Bar: Full Width Overview */}
      <div className="w-full bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-white font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-white font-bold" />
              LNG Process & State Transformation Overview
            </h3>
          </div>
          <span className="text-white font-bold hidden sm:inline">|</span>
          <span className="text-xs text-white font-bold hidden md:inline">
            4-Hour Periodic Field Inspection & Daily Reconciled Operational Flow
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-white font-bold border border-slate-700">
            Click AAV to Toggle Duty / Standby
          </span>

          <button
            type="button"
            onClick={() => setIsAnimationActive(!isAnimationActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isAnimationActive
                ? 'bg-emerald-950/40 text-white font-bold border-emerald-600/40'
                : 'bg-slate-900 text-white font-bold border-slate-700'
            }`}
            title="Toggle animated process flow lines"
          >
            {isAnimationActive ? <Pause className="w-3.5 h-3.5 text-white font-bold" /> : <Play className="w-3.5 h-3.5 text-white font-bold" />}
            <span>{isAnimationActive ? 'Flow Active' : 'Flow Paused'}</span>
          </button>
        </div>
      </div>

      {/* 2. Process Flow Stage Legend Strip */}
      <div className="w-full bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap justify-between items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          {/* Phase 1: Liquid */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50" />
            <span className="text-white font-bold font-bold">Liquid Zone: Cryo LNG (-126.7°C • 8.1 bar)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-white font-bold hidden sm:block" />

          {/* Phase 2: Vaporization */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-white font-bold font-bold">Phase Transition: Latent Heat Absorption</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-white font-bold hidden sm:block" />

          {/* Phase 3: Gas */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-white font-bold font-bold">Gas Zone: Superheated Natural Gas (+28.0°C • 3.5 bar)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white font-bold">
          <span>Active Units: <strong className="text-white font-bold font-bold">{activeVapCount} / 4 AAV</strong></span>
          <span>•</span>
          <span>Duty Load: <strong className="text-white font-bold font-bold">18.5 MW</strong></span>
        </div>
      </div>

      {/* 3. Main Full-Width Responsive 4-Column Process Canvas */}
      <div className="relative w-full bg-[#080d1a] p-4 sm:p-6 select-none overflow-hidden min-h-[460px]">
        {/* Subtle Background Engineering Grid */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '24px 24px, 48px 48px, 48px 48px',
          }}
        />

        {/* 4-Section Full Width Flexible Layout */}
        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          
          {/* ========================================================================= */}
          {/* SECTION 1: ISO TANK 4-BAY SUPPLY (2x2 Matrix with 4-Hour Inspection Data) */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/90 border border-blue-500/30 shadow-lg relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-white font-bold" />
                <span className="font-mono font-bold text-xs text-white font-bold uppercase tracking-wider">
                  1. ISO Supply (4-Bay)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-white font-bold border border-blue-500/40">
                -126.7°C • 8.1 bar
              </span>
            </div>

            {/* 2x2 Matrix of Tank Cards */}
            <div className="grid grid-cols-2 gap-2.5 flex-1 mb-3">
              {/* Tank 1: T-201 (Bay 01) */}
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-blue-500/40 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">T-201 (Bay 01)</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-500/20 text-white font-bold border border-emerald-500/40">
                    {bay1?.status || 'RUNNING'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono my-1">
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">LEVEL</span>
                    <span className="text-white font-bold font-bold">{bay1?.level || 49}%</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">PRESS</span>
                    <span className="text-white font-bold font-bold">8.1 bar</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">TEMP</span>
                    <span className="text-white font-bold font-bold">-126.7°C</span>
                  </div>
                </div>
                <div className="text-[8px] font-mono text-white font-bold flex justify-between pt-0.5 border-t border-slate-800/80">
                  <span>{bay1?.tankNo || 'ISOT-009'}</span>
                  <span className="text-white font-bold">15,092 kg</span>
                </div>
              </div>

              {/* Tank 2: T-202 (Bay 02) */}
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">T-202 (Bay 02)</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-blue-500/20 text-white font-bold border border-blue-500/40">
                    {bay2?.status || 'STANDBY'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono my-1">
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">LEVEL</span>
                    <span className="text-white font-bold font-bold">{bay2?.level || 54}%</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">PRESS</span>
                    <span className="text-white font-bold font-bold">8.0 bar</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">TEMP</span>
                    <span className="text-white font-bold font-bold">-126.5°C</span>
                  </div>
                </div>
                <div className="text-[8px] font-mono text-white font-bold flex justify-between pt-0.5 border-t border-slate-800/80">
                  <span>{bay2?.tankNo || 'ISOT-014'}</span>
                  <span className="text-white font-bold">17,337 kg</span>
                </div>
              </div>

              {/* Tank 3: T-203 (Bay 03) */}
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">T-203 (Bay 03)</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-800 text-white font-bold border border-slate-700">
                    {bay3?.status || 'STANDBY'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono my-1">
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">LEVEL</span>
                    <span className="text-white font-bold font-bold">{bay3?.level || 63}%</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">PRESS</span>
                    <span className="text-white font-bold font-bold">7.9 bar</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">TEMP</span>
                    <span className="text-white font-bold font-bold">-126.8°C</span>
                  </div>
                </div>
                <div className="text-[8px] font-mono text-white font-bold flex justify-between pt-0.5 border-t border-slate-800/80">
                  <span>{bay3?.tankNo || 'ISOT-017'}</span>
                  <span className="text-white font-bold">17,896 kg</span>
                </div>
              </div>

              {/* Tank 4: T-204 (Bay 04) */}
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">T-204 (Bay 04)</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-800 text-white font-bold border border-slate-700">
                    {bay4?.status || 'STANDBY'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono my-1">
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">LEVEL</span>
                    <span className="text-white font-bold font-bold">{bay4?.level || 62}%</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">PRESS</span>
                    <span className="text-white font-bold font-bold">8.0 bar</span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                    <span className="text-white font-bold block text-[7px]">TEMP</span>
                    <span className="text-white font-bold font-bold">-126.6°C</span>
                  </div>
                </div>
                <div className="text-[8px] font-mono text-white font-bold flex justify-between pt-0.5 border-t border-slate-800/80">
                  <span>{bay4?.tankNo || 'ISOT-026'}</span>
                  <span className="text-white font-bold">17,942 kg</span>
                </div>
              </div>
            </div>

            {/* Bottom PBU Units Representation */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex-1 bg-slate-900 px-2 py-1 rounded-lg text-center border border-slate-800">
                <span className="text-[9px] font-mono font-bold text-white font-bold block">PBU-101 (Active)</span>
                <span className="text-[7px] text-white font-bold font-mono">Coil Self-Pressurization</span>
              </div>
              <div className="flex-1 bg-slate-900 px-2 py-1 rounded-lg text-center border border-slate-800">
                <span className="text-[9px] font-mono text-white font-bold block">PBU-102 (Standby)</span>
                <span className="text-[7px] text-white font-bold font-mono">Hot Backup Coil</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: AAV VAPORIZATION TRAINS (Interactive Click to Toggle Duty)      */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 shadow-lg relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-white font-bold" />
                <span className="font-mono font-bold text-xs text-white font-bold uppercase tracking-wider">
                  2. AAV Trains (2 & 3)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-white font-bold border border-emerald-500/40">
                {activeVapCount}/4 Units Active
              </span>
            </div>

            {/* 4 Interactive Vaporizer Cards */}
            <div className="space-y-2 flex-1 flex flex-col justify-between">
              {/* Train 2: VAP-103 */}
              <div
                onClick={() => toggleVaporizer('VAP-103')}
                className={`p-2.5 rounded-xl border bg-slate-900/80 transition-all cursor-pointer select-none ${
                  vaporizerStates['VAP-103'] === 'RUNNING'
                    ? 'border-amber-400/80 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/10'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">VAP 103 (Train 2)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                      vaporizerStates['VAP-103'] === 'RUNNING'
                        ? 'bg-emerald-500/20 text-white font-bold border border-emerald-500/40'
                        : 'bg-slate-800 text-white font-bold'
                    }`}
                  >
                    {vaporizerStates['VAP-103']}
                  </span>
                </div>
                <div className="flex justify-between items-center h-3.5 bg-gradient-to-r from-blue-900 via-amber-900 to-emerald-900 rounded px-1.5 border border-slate-800 mb-1">
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-103'] === 'RUNNING' ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-103'] === 'RUNNING' ? 'bg-amber-400' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-103'] === 'RUNNING' ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white font-bold">
                  <span>Daily Throughput:</span>
                  <span className={vaporizerStates['VAP-103'] === 'RUNNING' ? 'text-white font-bold font-bold' : 'text-white font-bold'}>
                    {vaporizerStates['VAP-103'] === 'RUNNING' ? `${perVapThroughputTon} ton/day` : '0.0 ton/d'}
                  </span>
                </div>
              </div>

              {/* Train 2: VAP-104 */}
              <div
                onClick={() => toggleVaporizer('VAP-104')}
                className={`p-2.5 rounded-xl border bg-slate-900/80 transition-all cursor-pointer select-none ${
                  vaporizerStates['VAP-104'] === 'RUNNING'
                    ? 'border-amber-400/80 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/10'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">VAP 104 (Train 2)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                      vaporizerStates['VAP-104'] === 'RUNNING'
                        ? 'bg-emerald-500/20 text-white font-bold border border-emerald-500/40'
                        : 'bg-slate-800 text-white font-bold'
                    }`}
                  >
                    {vaporizerStates['VAP-104']}
                  </span>
                </div>
                <div className="flex justify-between items-center h-3.5 bg-gradient-to-r from-blue-900 via-amber-900 to-emerald-900 rounded px-1.5 border border-slate-800 mb-1">
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-104'] === 'RUNNING' ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-104'] === 'RUNNING' ? 'bg-amber-400' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-104'] === 'RUNNING' ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white font-bold">
                  <span>Daily Throughput:</span>
                  <span className={vaporizerStates['VAP-104'] === 'RUNNING' ? 'text-white font-bold font-bold' : 'text-white font-bold'}>
                    {vaporizerStates['VAP-104'] === 'RUNNING' ? `${perVapThroughputTon} ton/day` : '0.0 ton/d'}
                  </span>
                </div>
              </div>

              {/* Train 3: VAP-105 */}
              <div
                onClick={() => toggleVaporizer('VAP-105')}
                className={`p-2.5 rounded-xl border bg-slate-900/80 transition-all cursor-pointer select-none ${
                  vaporizerStates['VAP-105'] === 'RUNNING'
                    ? 'border-amber-400/80 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/10'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">VAP 105 (Train 3)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                      vaporizerStates['VAP-105'] === 'RUNNING'
                        ? 'bg-emerald-500/20 text-white font-bold border border-emerald-500/40'
                        : 'bg-slate-800 text-white font-bold'
                    }`}
                  >
                    {vaporizerStates['VAP-105']}
                  </span>
                </div>
                <div className="flex justify-between items-center h-3.5 bg-slate-950 rounded px-1.5 border border-slate-800 mb-1">
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-105'] === 'RUNNING' ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-105'] === 'RUNNING' ? 'bg-amber-400' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-105'] === 'RUNNING' ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white font-bold">
                  <span>Daily Throughput:</span>
                  <span className={vaporizerStates['VAP-105'] === 'RUNNING' ? 'text-white font-bold font-bold' : 'text-white font-bold'}>
                    {vaporizerStates['VAP-105'] === 'RUNNING' ? `${perVapThroughputTon} ton/day` : '0.0 ton/d'}
                  </span>
                </div>
              </div>

              {/* Train 3: VAP-106 */}
              <div
                onClick={() => toggleVaporizer('VAP-106')}
                className={`p-2.5 rounded-xl border bg-slate-900/80 transition-all cursor-pointer select-none ${
                  vaporizerStates['VAP-106'] === 'RUNNING'
                    ? 'border-amber-400/80 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/10'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-white font-bold">VAP 106 (Train 3)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                      vaporizerStates['VAP-106'] === 'RUNNING'
                        ? 'bg-emerald-500/20 text-white font-bold border border-emerald-500/40'
                        : 'bg-slate-800 text-white font-bold'
                    }`}
                  >
                    {vaporizerStates['VAP-106']}
                  </span>
                </div>
                <div className="flex justify-between items-center h-3.5 bg-slate-950 rounded px-1.5 border border-slate-800 mb-1">
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-106'] === 'RUNNING' ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-106'] === 'RUNNING' ? 'bg-amber-400' : 'bg-slate-700'}`} />
                  <span className={`w-1 h-2.5 rounded-full ${vaporizerStates['VAP-106'] === 'RUNNING' ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white font-bold">
                  <span>Daily Throughput:</span>
                  <span className={vaporizerStates['VAP-106'] === 'RUNNING' ? 'text-white font-bold font-bold' : 'text-white font-bold'}>
                    {vaporizerStates['VAP-106'] === 'RUNNING' ? `${perVapThroughputTon} ton/day` : '0.0 ton/d'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: BUFFER TANK, GC STREAM & DUAL METERING SKID                     */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 shadow-lg relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-white font-bold" />
                <span className="font-mono font-bold text-xs text-white font-bold uppercase tracking-wider">
                  3. Buffer & Metering
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-white font-bold border border-emerald-500/40">
                Reg: 3.5 bar
              </span>
            </div>

            {/* Top GC Analyzer Box */}
            <div className="p-2.5 bg-slate-900/80 border border-cyan-500/40 rounded-xl mb-2.5 font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-white font-bold flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5 text-white font-bold" />
                  GC Analyzer (FloBoss)
                </span>
                <span className="text-[8px] font-bold text-white font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">ONLINE</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-white font-bold">
                  CH₄ {latestGC.methane}% <span className="text-[8px] text-white font-bold font-bold">Vol</span>
                </span>
                <span className="text-[10px] font-bold text-white font-bold">GHV: 1,054.6 BTU/Scf</span>
              </div>
            </div>

            {/* Middle: Buffer Surge Tank & Dual Flow Meters */}
            <div className="grid grid-cols-5 gap-2.5 items-center flex-1 mb-2.5">
              {/* Buffer Tank (2 cols) */}
              <div className="col-span-2 p-2.5 rounded-xl border border-emerald-500/40 bg-slate-900/80 flex flex-col justify-between items-center text-center h-full">
                <span className="text-[9px] font-mono font-bold text-white font-bold block">BUFFER TANK</span>
                <span className="text-[7px] text-white font-bold font-mono">V-301 Surge Drum</span>

                <div className="w-5 h-12 bg-gradient-to-t from-emerald-950 to-emerald-600/30 rounded-full border border-emerald-500/30 relative flex items-center justify-center my-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
                </div>

                <div>
                  <span className="text-[9px] font-mono font-bold text-white font-bold block">3.5 bar</span>
                  <span className="text-[7px] font-mono text-white font-bold">Dry Gas Buffer</span>
                </div>
              </div>

              {/* Dual Meters Skid (3 cols) */}
              <div className="col-span-3 space-y-2 flex flex-col justify-between h-full">
                {/* Meter A Duty */}
                <div className="p-2 rounded-xl border border-emerald-500/40 bg-slate-900/80">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[9px] font-mono font-bold text-white font-bold">FT 02A (Duty)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-xs font-mono font-bold text-white font-bold block">2.12 <span className="text-[8px] font-bold text-white font-bold">t/h</span></span>
                  <span className="text-[8px] font-mono text-white font-bold block">4,250 Nm³/h</span>
                </div>

                {/* Meter B Standby */}
                <div className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 opacity-60">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[9px] font-mono font-bold text-white font-bold">FT 02B (Stby)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  </div>
                  <span className="text-xs font-mono font-bold text-white font-bold block">0.00 <span className="text-[8px] font-bold text-white font-bold">t/h</span></span>
                  <span className="text-[8px] font-mono text-white font-bold block">HOT STANDBY</span>
                </div>
              </div>
            </div>

            {/* Bottom Atmospheric Vent Indicator */}
            <div className="flex items-center justify-between p-2 bg-slate-900/90 rounded-xl border border-slate-800 font-mono text-[9px]">
              <span className="text-white font-bold font-bold flex items-center gap-1">
                <Wind className="w-3 h-3 text-white font-bold" />
                VT-101 Vent Stack
              </span>
              <span className="text-white font-bold font-bold">Closed (0.0 kg/h)</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: PLTMG POWER PLANT (FINAL SENDOUT & GENERATION TARGET)           */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 shadow-lg relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-white font-bold" />
                <span className="font-mono font-bold text-xs text-white font-bold uppercase tracking-wider">
                  4. PLTMG 25MW Plant
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-white font-bold border border-amber-500/40">
                50.00 Hz Grid
              </span>
            </div>

            {/* Generation Telemetry Card */}
            <div className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-xl mb-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold font-sans text-white font-bold">Gunungsitoli Gas Turbines</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[10px] text-white font-bold font-mono block">Units: GT-01, GT-02 (GT-03 Stby)</span>
              </div>

              {/* Load Bar */}
              <div className="my-2 space-y-1 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-bold">Active Load:</span>
                  <span className="text-white font-bold font-bold">18.5 MW (74.0%)</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full w-[74%]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1.5 border-t border-slate-800">
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="text-white font-bold block text-[8px]">HEAT RATE</span>
                  <span className="text-white font-bold font-bold">36.1% Eff</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="text-white font-bold block text-[8px]">DAILY ENERGY</span>
                  <span className="text-white font-bold font-bold">440.0 MWh</span>
                </div>
              </div>
            </div>

            {/* Footer Summary in Sec 4 */}
            <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800 text-center font-mono text-[9px] text-white font-bold">
              <span className="text-white font-bold font-bold">3.5 bar</span> Direct Superheated Natural Gas Feed
            </div>
          </div>

        </div>
      </div>

      {/* 4. Full Width Daily Reconciled Operational KPI Bar (Bottom Grid) */}
      <div className="w-full bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Cumulative Daily Gas Sendout */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white font-bold block mb-1">
            금일 누적 가스 송출량 (FloBoss)
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white font-bold">
              {totalDailySendoutNm3.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-white font-bold font-bold">Nm³/day</span>
          </div>
          <span className="text-[10px] font-mono text-white font-bold block pt-1 border-t border-slate-800/80">
            LNG Mass: {totalDailySendoutTon} ton/day
          </span>
        </div>

        {/* KPI 2: Daily Power Generation */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white font-bold block mb-1">
            금일 일일 발전량 (PLTMG)
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white font-bold">
              {totalDailyGenMwh.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-white font-bold font-bold">MWh/day</span>
          </div>
          <span className="text-[10px] font-mono text-white font-bold block pt-1 border-t border-slate-800/80">
            Thermal Energy: 531.2 MMBtu/d
          </span>
        </div>

        {/* KPI 3: Operating Load & Efficiency */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white font-bold block mb-1">
            평균 가동 부하 / 열효율
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white font-bold">
              18.5 MW
            </span>
            <span className="text-xs font-mono text-white font-bold font-bold">@ 36.1%</span>
          </div>
          <span className="text-[10px] font-mono text-white font-bold block pt-1 border-t border-slate-800/80">
            Feed Pressure: 3.5 bar (Regulated)
          </span>
        </div>

        {/* KPI 4: Active Vaporizers & Unit Distribution */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white font-bold block mb-1">
            가동 기화기 수 & 안분 처리량
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white font-bold">
              {activeVapCount} / 4 Units
            </span>
            <span className="text-xs font-mono text-white font-bold font-bold">Active</span>
          </div>
          <span className="text-[10px] font-mono text-white font-bold block pt-1 border-t border-slate-800/80">
            Unit Load: ~{perVapThroughputTon} ton/day per unit
          </span>
        </div>
      </div>
    </div>
  );
}
