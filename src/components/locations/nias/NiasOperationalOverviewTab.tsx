'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  Flame,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Edit3,
  Layers,
  ArrowRight,
  Ship,
  Building2,
  Cpu,
  Gauge,
  Droplets,
  ExternalLink,
  XCircle,
  ChevronRight,
  Database,
  Table,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';

interface NiasOperationalOverviewTabProps {
  onNavigateSubTab?: (targetTab: string, domain?: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM') => void;
}

type ProcessBlockId = 'BLOCK_1_ARUN' | 'BLOCK_2_SAVIOUR' | 'BLOCK_3_NIAS_YARD' | 'BLOCK_4_REGAS_PRSS' | 'BLOCK_5_PLTMG_PLANT';

export default function NiasOperationalOverviewTab({ onNavigateSubTab }: NiasOperationalOverviewTabProps) {
  const { fleetTanks, gasCompositions } = usePortalData();

  // Daily Report Approval Status
  const [reportStatus, setReportStatus] = useState<'CONFIRMED' | 'REVIEW'>('CONFIRMED');
  const [activeModalBlock, setActiveModalBlock] = useState<ProcessBlockId | null>(null);

  // Engine Spec Constants (MAN 7L 51/60 DF)
  const engineMcrKw = 7350;
  const engineNcrKw = 6615;
  const heatRateKjKwh = 7150;
  const referenceLhvKjNm3 = 28000;
  const nominalTankVolumeNm3 = 25335;

  // 5 Engine Units Nominal Dispatch State (4 Running @ 60% Load = 4,410 kW, 1 Standby)
  const engines = useMemo(
    () => [
      { id: 1, name: 'Generator Engine 1', tag: 'GEN-01', status: 'RUN', fuelMode: 'GAS', powerKw: 4410, loadPct: 60.0, pressBar: 2.18, tempC: 24.5, rpm: 500, flowNm3h: 1126.3, mwh: 105.84 },
      { id: 2, name: 'Generator Engine 2', tag: 'GEN-02', status: 'RUN', fuelMode: 'GAS', powerKw: 4410, loadPct: 60.0, pressBar: 2.18, tempC: 24.5, rpm: 500, flowNm3h: 1126.3, mwh: 105.84 },
      { id: 3, name: 'Generator Engine 3', tag: 'GEN-03', status: 'RUN', fuelMode: 'GAS', powerKw: 4410, loadPct: 60.0, pressBar: 2.18, tempC: 24.5, rpm: 500, flowNm3h: 1126.3, mwh: 105.84 },
      { id: 4, name: 'Generator Engine 4', tag: 'GEN-04', status: 'RUN', fuelMode: 'GAS', powerKw: 4410, loadPct: 60.0, pressBar: 2.18, tempC: 24.5, rpm: 500, flowNm3h: 1126.3, mwh: 105.84 },
      { id: 5, name: 'Generator Engine 5', tag: 'GEN-05', status: 'STANDBY', fuelMode: 'GAS', powerKw: 0, loadPct: 0.0, pressBar: 0.0, tempC: 24.0, rpm: 0, flowNm3h: 0.0, mwh: 0.0 },
    ],
    []
  );

  // Aggregated KPI Calculations
  const runningEngines = engines.filter((e) => e.status === 'RUN');
  const totalPowerKw = runningEngines.reduce((acc, e) => acc + e.powerKw, 0);
  const totalPowerMw = totalPowerKw / 1000;
  const plantLoadPct = (totalPowerKw / (engineMcrKw * 5)) * 100;
  const dailyMwh = (totalPowerKw * 24) / 1000;

  const totalGasFlowNm3h = (totalPowerKw * heatRateKjKwh) / referenceLhvKjNm3;
  const dailyGasFlowNm3 = totalGasFlowNm3h * 24;
  const dailyHeatMmbtu = (dailyGasFlowNm3 * referenceLhvKjNm3) / 1055056;

  // Inventory & Autonomy Buffers
  const onsiteLadenTanksCount = 14;
  const onsiteLadenGasNm3 = onsiteLadenTanksCount * nominalTankVolumeNm3;
  const activeBayRemainingNm3 = Math.round(nominalTankVolumeNm3 * 0.885); // ISOT-009 @ 88.5%
  const activeTankAutonomyHours = totalGasFlowNm3h > 0 ? activeBayRemainingNm3 / totalGasFlowNm3h : 0;
  const yardAutonomyHours = totalGasFlowNm3h > 0 ? onsiteLadenGasNm3 / totalGasFlowNm3h : 0;
  const yardAutonomyDays = yardAutonomyHours / 24;

  const handleNavigate = (tab: string, domain: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM' = 'REGAS_SYSTEM') => {
    setActiveModalBlock(null);
    if (onNavigateSubTab) {
      onNavigateSubTab(tab, domain);
    }
  };

  return (
    <div className="w-full space-y-3.5 font-sans text-xs text-slate-100 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. 최상단 상태 알림 툴바: 운전 일보 확정 상태 및 시스템 메타데이터 바         */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-600 rounded-lg p-2.5 px-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        {/* Left Status Indicators */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${
            reportStatus === 'CONFIRMED'
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-600 text-white'
          }`}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {reportStatus === 'CONFIRMED' ? 'CONFIRMED (운전 일보 확정 완료)' : 'UNDER REVIEW (일보 검토 중)'}
          </span>

          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-600 text-slate-200 font-mono font-bold text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cut-off: 2026-07-28 06:00 WIB</span>
          </span>

          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-600 text-slate-200 font-mono font-bold text-xs flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lead Shift Eng: Ahmad Fauzi</span>
          </span>

          <span className="hidden xl:inline-block text-slate-300 font-semibold">
            Nias 25MW PLTMG & Regas Terminal Integrated Process Flow & Daily Dispatch
          </span>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setReportStatus(reportStatus === 'CONFIRMED' ? 'REVIEW' : 'CONFIRMED')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-500 text-xs font-bold cursor-pointer transition-colors"
          >
            Toggle: {reportStatus}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold border border-blue-400 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>일보 입력 바로가기 (Tab 3)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 상단 4대 핵심 KPI 요약 카드 (Solid Gray Border + Bright Neon Figures)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: 전력 생산 & 부하율 */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
          {/* Panel Title Bar */}
          <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-600 font-bold flex justify-between items-center text-slate-200">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1. 전력 생산 & 부하율
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400">PLTMG Hall</span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {totalPowerMw.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400 ml-1">MW</span>
              </div>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50">
                {plantLoadPct.toFixed(1)}% MCR
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700/80 flex justify-between text-xs font-mono text-slate-300">
              <span>당일 발전량: <strong className="text-white font-bold">{dailyMwh.toFixed(1)} MWh</strong></span>
              <span>가동 기수: <strong className="text-emerald-400 font-bold">{runningEngines.length}/5 기</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 2: 가스 소비 & 열효율 */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
          {/* Panel Title Bar */}
          <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-600 font-bold flex justify-between items-center text-slate-200">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              2. 가스 소비 & 열효율
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400">Heat Rate</span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black font-mono text-cyan-300">
                  {(dailyGasFlowNm3 / 1000).toFixed(1)}k
                </span>
                <span className="text-xs font-bold text-slate-400 ml-1">Nm³/day</span>
              </div>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                50.35% Eff
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700/80 flex justify-between text-xs font-mono text-slate-300">
              <span>인입 열량: <strong className="text-white font-bold">{Math.round(dailyHeatMmbtu).toLocaleString()} MMBtu</strong></span>
              <span>Heat Rate: <strong className="text-cyan-300 font-bold">7,150 kJ/kWh</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 3: 공급망 재고 & 버퍼 */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
          {/* Panel Title Bar */}
          <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-600 font-bold flex justify-between items-center text-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              3. 공급망 재고 & 버퍼
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400">Autonomy</span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black font-mono text-emerald-300">
                  {yardAutonomyDays.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400 ml-1">Days Buffer</span>
              </div>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                {onsiteLadenTanksCount} Tanks
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700/80 flex justify-between text-xs font-mono text-slate-300">
              <span>Bay 01 피드: <strong className="text-white font-bold">88.5% ({activeTankAutonomyHours.toFixed(1)}h)</strong></span>
              <span>현장 재고: <strong className="text-emerald-400 font-bold">354.7k Nm³</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 4: 정산 수불 일치율 (Audit) */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
          {/* Panel Title Bar */}
          <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-600 font-bold flex justify-between items-center text-slate-200">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              4. 정산 수불 일치율
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
              AUDIT PASS
            </span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black font-mono text-amber-300">
                  ±0.42
                </span>
                <span className="text-xs font-bold text-slate-400 ml-1">% Variance</span>
              </div>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/50">
                ≤ 2.0% Tol
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700/80 flex justify-between text-xs font-mono text-slate-300">
              <span>당월 누적 차액: <strong className="text-amber-300 font-bold">$5,807 USD</strong></span>
              <span>FloBoss: <strong className="text-white font-bold">29,485 MMBtu</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 중앙 5-Node PFD 파이프라인 패널 (Solid Gray Grid Box & 2-Col Key-Values) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
        {/* Panel Header Bar */}
        <div className="bg-slate-800/80 px-3.5 py-2 border-b border-slate-600 font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 text-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-black text-white">
              End-to-End LNG Virtual Pipeline Process Block Flow Diagram (5-Node SCADA Flow)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            💡 Click any process block to inspect engineering parameters & telemetry.
          </span>
        </div>

        {/* 5 Process Flow Node Grid */}
        <div className="p-3 grid grid-cols-1 md:grid-cols-5 gap-2.5">
          {/* Node 1: Arun Terminal */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_1_ARUN')}
            className="bg-slate-950 border border-slate-600 hover:border-amber-400 rounded-lg overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-slate-800/90 px-2.5 py-1 border-b border-slate-600 font-bold flex justify-between items-center text-amber-400">
                <span className="font-mono text-xs">Node 1: Arun Hub</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs text-slate-300">
                <div className="font-bold text-white mb-1">1. Arun PAG Terminal</div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Laden Stock:</span>
                  <span className="font-bold text-emerald-400">16 Tanks</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Empty Return:</span>
                  <span className="font-bold text-slate-300">32 Tanks</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Methane (CH4):</span>
                  <span className="font-bold text-cyan-300">90.24%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LHV:</span>
                  <span className="font-bold text-white">28,000 kJ/Nm³</span>
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1.5 border-t border-slate-800 text-[11px] font-bold text-amber-400 bg-slate-900 flex items-center justify-between">
              <span>Inspect Node 1</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 2: MV Saviour Transit */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_2_SAVIOUR')}
            className="bg-slate-950 border border-slate-600 hover:border-cyan-400 rounded-lg overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-slate-800/90 px-2.5 py-1 border-b border-slate-600 font-bold flex justify-between items-center text-cyan-400">
                <span className="font-mono text-xs">Node 2: Marine Sea</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs text-slate-300">
                <div className="font-bold text-white mb-1">2. MV Saviour Transit</div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Carrier Tanks:</span>
                  <span className="font-bold text-cyan-300">48 Units</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Liquid Mass:</span>
                  <span className="font-bold text-white">1,968 m³</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Speed / ETA:</span>
                  <span className="font-bold text-emerald-400">9.8 kts (~18h)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Pressure:</span>
                  <span className="font-bold text-white">0.18 MPa</span>
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1.5 border-t border-slate-800 text-[11px] font-bold text-cyan-400 bg-slate-900 flex items-center justify-between">
              <span>Inspect Node 2</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 3: Nias Yard & Bays */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_3_NIAS_YARD')}
            className="bg-slate-950 border border-slate-600 hover:border-emerald-400 rounded-lg overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-slate-800/90 px-2.5 py-1 border-b border-slate-600 font-bold flex justify-between items-center text-emerald-400">
                <span className="font-mono text-xs">Node 3 & 4: Yard</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs text-slate-300">
                <div className="font-bold text-white mb-1">3. Nias Yard & Bays</div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Active Feed:</span>
                  <span className="font-bold text-emerald-400">ISOT-009</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Feed Level:</span>
                  <span className="font-bold text-cyan-300">88.5% (22.4k Nm³)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Yard Ready:</span>
                  <span className="font-bold text-emerald-400">14 Tanks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Autonomy:</span>
                  <span className="font-bold text-emerald-300">{yardAutonomyDays.toFixed(2)} Days</span>
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1.5 border-t border-slate-800 text-[11px] font-bold text-emerald-400 bg-slate-900 flex items-center justify-between">
              <span>Inspect Node 3</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 4: Re-Gas & PRSS / GC */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_4_REGAS_PRSS')}
            className="bg-slate-950 border border-slate-600 hover:border-cyan-400 rounded-lg overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-slate-800/90 px-2.5 py-1 border-b border-slate-600 font-bold flex justify-between items-center text-cyan-400">
                <span className="font-mono text-xs">Node 4: Regas Skid</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs text-slate-300">
                <div className="font-bold text-white mb-1">4. Re-Gas & PRSS / GC</div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Discharge Press:</span>
                  <span className="font-bold text-emerald-400">2.18 Barg</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Gas Temp:</span>
                  <span className="font-bold text-white">+24.5 °C</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">GC-01 CH4:</span>
                  <span className="font-bold text-cyan-300">90.80%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metering Delta:</span>
                  <span className="font-bold text-emerald-400">-0.04%</span>
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1.5 border-t border-slate-800 text-[11px] font-bold text-cyan-400 bg-slate-900 flex items-center justify-between">
              <span>Inspect Node 4</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 5: 25MW PLTMG Plant */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_5_PLTMG_PLANT')}
            className="bg-slate-950 border border-slate-600 hover:border-amber-400 rounded-lg overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-slate-800/90 px-2.5 py-1 border-b border-slate-600 font-bold flex justify-between items-center text-amber-400">
                <span className="font-mono text-xs">Node 5: PLTMG</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs text-slate-300">
                <div className="font-bold text-white mb-1">5. PLTMG 5 × MAN 7L</div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Active Output:</span>
                  <span className="font-bold text-emerald-400">{totalPowerMw.toFixed(2)} MW</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Running Units:</span>
                  <span className="font-bold text-emerald-400">4 / 5 Units</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Gas Demand:</span>
                  <span className="font-bold text-cyan-300">4,505 Nm³/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heat Rate:</span>
                  <span className="font-bold text-white">7,150 kJ/kWh</span>
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1.5 border-t border-slate-800 text-[11px] font-bold text-amber-400 bg-slate-900 flex items-center justify-between">
              <span>Inspect Node 5</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 하단 2열 엔지니어링 데이터 그리드 (Spreadsheet Matrix & Stock Bar)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 좌측 패널: MAN 7L 51/60 DF Generator Dispatch Summary (GEN-01 ~ GEN-05) */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            {/* Panel Title Bar */}
            <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-600 font-bold flex justify-between items-center text-slate-200">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                MAN 7L 51/60 DF Generator Dispatch Summary (GEN-01 ~ GEN-05)
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Tab 3</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Classic Engineering Spreadsheet Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-600 text-slate-200 text-[11px] font-bold">
                    <th className="py-1.5 px-3 border-r border-slate-700">Unit</th>
                    <th className="py-1.5 px-2 text-center border-r border-slate-700">Status</th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-700">Power (kW)</th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-700">Load %</th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-700">Press (bar)</th>
                    <th className="py-1.5 px-3 text-right">Gas Flow (Nm³/h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/80 text-white font-medium">
                  {engines.map((eng, idx) => (
                    <tr
                      key={eng.id}
                      className={idx % 2 === 0 ? 'bg-slate-900 hover:bg-slate-800/80' : 'bg-slate-950 hover:bg-slate-800/80'}
                    >
                      <td className="py-1.5 px-3 font-bold border-r border-slate-700 text-slate-200">{eng.tag}</td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-700">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                            eng.status === 'RUN'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {eng.status}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-black border-r border-slate-700 text-emerald-400">{eng.powerKw.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-bold text-amber-300 border-r border-slate-700">{eng.loadPct.toFixed(0)}%</td>
                      <td className="py-1.5 px-2 text-right border-r border-slate-700 text-cyan-300">{eng.pressBar > 0 ? eng.pressBar.toFixed(2) : '-'}</td>
                      <td className="py-1.5 px-3 text-right font-bold text-emerald-300">{eng.flowNm3h > 0 ? eng.flowNm3h.toFixed(0) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-3 py-2 bg-slate-950 border-t border-slate-600 flex justify-between items-center text-xs font-mono font-bold text-slate-300">
            <span>Total Engine MCR: <strong className="text-white">36.75 MW</strong></span>
            <span>Total Fuel Gas Demand: <strong className="text-cyan-300">{totalGasFlowNm3h.toFixed(0)} Nm³/h</strong></span>
          </div>
        </div>

        {/* 우측 패널: 120-Fleet ISO Tank Global Supply Distribution & Safety Margin */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            {/* Panel Title Bar */}
            <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-600 font-bold flex justify-between items-center text-slate-200">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                120-Fleet ISO Tank Global Supply Distribution & Safety Margin
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('CUSTODY_HEAT_SETTLEMENT', 'REGAS_SYSTEM')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Stock Tab 4</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 space-y-3 font-mono text-xs">
              {/* Segmented Distribution Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Fleet Active Allocation:</span>
                  <span className="text-white">120 Total Tanks (100%)</span>
                </div>
                <div className="w-full h-4 rounded-sm overflow-hidden flex border border-slate-600">
                  <div style={{ width: '20%' }} className="bg-emerald-600 h-full" title="Nias Yard: 24 Tanks (20%)" />
                  <div style={{ width: '40%' }} className="bg-blue-600 h-full" title="MV Saviour Transit: 48 Tanks (40%)" />
                  <div style={{ width: '40%' }} className="bg-amber-500 h-full" title="PAG Arun Hub: 48 Tanks (40%)" />
                </div>
                <div className="flex justify-between text-[11px] font-semibold pt-0.5 text-slate-300">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Nias Site: 24 (20%)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> MV Saviour: 48 (40%)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> PAG Arun: 48 (40%)</span>
                </div>
              </div>

              {/* Safety Margin Grid Box */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-600 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Nias Onsite Safety Stock Buffer Margin
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                    140% SAFE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Min Safety Threshold (72h):</span>
                    <span className="font-bold text-amber-300 text-sm">10 Full Tanks</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Current Onsite Ready:</span>
                    <span className="font-bold text-emerald-400 text-sm">{onsiteLadenTanksCount} Full Tanks ({yardAutonomyDays.toFixed(2)} Days)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 py-2 bg-slate-950 border-t border-slate-600 flex justify-between items-center text-xs font-mono font-bold text-slate-300">
            <span>Next Marine Delivery (ETA):</span>
            <span className="text-cyan-300">MV Saviour +48 Laden Tanks (In ~18h)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. 블록별 세부 점검 팝업 모달 (Classic Read-Only Engineering Inspection)   */}
      {/* ========================================================================= */}
      {activeModalBlock && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-500 rounded-lg max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 font-sans text-slate-100">
            {/* Modal Title Bar */}
            <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-600 font-bold flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                {activeModalBlock === 'BLOCK_1_ARUN' && <Building2 className="w-4 h-4 text-amber-400" />}
                {activeModalBlock === 'BLOCK_2_SAVIOUR' && <Ship className="w-4 h-4 text-cyan-400" />}
                {activeModalBlock === 'BLOCK_3_NIAS_YARD' && <Droplets className="w-4 h-4 text-emerald-400" />}
                {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && <Gauge className="w-4 h-4 text-cyan-400" />}
                {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && <Cpu className="w-4 h-4 text-amber-400" />}
                <span className="text-xs sm:text-sm">
                  {activeModalBlock === 'BLOCK_1_ARUN' && 'Block 1: Arun Port & PAG Loading Terminal'}
                  {activeModalBlock === 'BLOCK_2_SAVIOUR' && 'Block 2: MV Saviour Marine Transit Carrier'}
                  {activeModalBlock === 'BLOCK_3_NIAS_YARD' && 'Block 3: Nias Laydown Yard & Decanting Bays'}
                  {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && 'Block 4: Re-gasification Skid & PRSS / GC Station'}
                  {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && 'Block 5: 25MW PLTMG Engine Hall (5 × MAN 7L 51/60 DF)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalBlock(null)}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Key-Value Table */}
            <div className="p-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded bg-slate-950 border border-slate-700 space-y-1.5">
                {activeModalBlock === 'BLOCK_1_ARUN' && (
                  <>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Loading Batch ID:</span><span className="font-bold text-white">PAG-ARUN-2026-B08</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Arun Staging Stock:</span><span className="font-bold text-amber-400">16 Laden / 32 Empty Return</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Methane Purity (COQ):</span><span className="font-bold text-cyan-300">90.24 mol%</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Fuel Gas LHV:</span><span className="font-bold text-white">28,000 kJ/Nm³ (1,048.5 BTU/SCF)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Batch Energy:</span><span className="font-bold text-emerald-400">40,845 MMBtu</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_2_SAVIOUR' && (
                  <>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Voyage Number:</span><span className="font-bold text-white">VOY-SAV-2026-07 (Laden Leg)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Vessel Deck Capacity:</span><span className="font-bold text-cyan-300">48 ISO Tanks (100% Laden)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Current Speed:</span><span className="font-bold text-emerald-400">9.8 Knots (Fair Weather)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Estimated Arrival (ETA):</span><span className="font-bold text-cyan-300">2026-07-29 02:00 WIB (~18h)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Avg Tank Pressure:</span><span className="font-bold text-white">0.18 MPa</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_3_NIAS_YARD' && (
                  <>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Active Bay Feed:</span><span className="font-bold text-emerald-400">ISOT-009 (Bay 01 / T-201)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Active Tank Level:</span><span className="font-bold text-cyan-300">88.5% (22,421 Nm³ Usable)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Single Tank Autonomy:</span><span className="font-bold text-amber-300">{activeTankAutonomyHours.toFixed(1)} Hours</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Onsite Ready Tanks:</span><span className="font-bold text-emerald-400">14 Full Units (354,690 Nm³)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Total Site Autonomy:</span><span className="font-black text-emerald-300">{yardAutonomyDays.toFixed(2)} Days ({yardAutonomyHours.toFixed(1)} Hours)</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && (
                  <>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Discharge Header:</span><span className="font-bold text-emerald-400">2.18 Barg / +24.5 °C</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Metering Run A:</span><span className="font-bold text-cyan-300">14,820.5 MSCF (Active Custody)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Metering Run B:</span><span className="font-bold text-slate-300">14,815.2 MSCF (Check Standby)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Dual Metering Delta:</span><span className="font-bold text-emerald-400">-0.04% (Tol ≤ 0.25%)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">GC-01 Quality:</span><span className="font-bold text-amber-300">90.80% CH4 | 1,048.5 BTU/SCF</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && (
                  <>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Engine Model:</span><span className="font-bold text-cyan-300">MAN 7L 51/60 DF (5 Units)</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Unit MCR / NCR:</span><span className="font-bold text-white">7,350 kW / 6,615 kW each</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Plant Dispatch:</span><span className="font-bold text-amber-400">4 Units @ 60% = 17.64 MW</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-400">Heat Rate:</span><span className="font-bold text-cyan-300">7,150 kJ/kWh (50.35% Eff)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Total Fuel Gas Flow:</span><span className="font-black text-emerald-400">{totalGasFlowNm3h.toFixed(0)} Nm³/h</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-4 py-2.5 bg-slate-800 border-t border-slate-600 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveModalBlock(null)}
                className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-500 text-xs font-bold cursor-pointer"
              >
                Close (닫기)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeModalBlock === 'BLOCK_1_ARUN' || activeModalBlock === 'BLOCK_4_REGAS_PRSS') {
                    handleNavigate('GC_GAS_QUALITY', 'REGAS_SYSTEM');
                  } else if (activeModalBlock === 'BLOCK_2_SAVIOUR') {
                    handleNavigate('NIAS_BAY_MOUNTED_TANKS', 'ISO_TANK_MGMT');
                  } else if (activeModalBlock === 'BLOCK_3_NIAS_YARD') {
                    handleNavigate('NIAS_BAY_MOUNTED_TANKS', 'ISO_TANK_MGMT');
                  } else if (activeModalBlock === 'BLOCK_5_PLTMG_PLANT') {
                    handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM');
                  }
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>해당 서브탭으로 이동 (Go to Sub-Tab)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
