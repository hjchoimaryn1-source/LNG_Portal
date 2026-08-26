'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  Flame,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Edit3,
  Layers,
  ArrowRight,
  Ship,
  Building2,
  Cpu,
  Gauge,
  Thermometer,
  Droplets,
  ExternalLink,
  XCircle,
  TrendingUp,
  Info,
  ChevronRight,
  Database,
  BarChart2,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';
import { NodeState } from '@/types/lng';

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
    <div className="w-full space-y-5 animate-in fade-in duration-200 text-slate-100 font-sans">
      {/* 1. 최상단 상태 알림 바 (Daily Report Status Banner) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <Layers className="w-3.5 h-3.5" />
              DOMAIN 2 · SUB-TAB 1: OPERATIONAL OVERVIEW & PROCESS FLOW
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded border font-bold ${
                reportStatus === 'CONFIRMED'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  reportStatus === 'CONFIRMED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {reportStatus === 'CONFIRMED' ? '운전 일보 확정 완료 (CONFIRMED)' : '운전 일보 검토 중 (UNDER REVIEW)'}
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Cut-off: 2026-07-28 06:00 WIB
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Lead Shift Eng: Ahmad Fauzi
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 mt-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Nias 25MW PLTMG & Regas Terminal Integrated Process Flow & Daily Dispatch
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirmed daily operational telemetry across 5 major process streams: Arun PAG loading, Sea transit, Nias decanting, Regasification & MAN 7L power generation.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
          <button
            type="button"
            onClick={() => setReportStatus(reportStatus === 'CONFIRMED' ? 'REVIEW' : 'CONFIRMED')}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-mono transition-colors cursor-pointer"
          >
            Status: {reportStatus}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>일보 입력 바로가기 (Tab 3)</span>
          </button>
        </div>
      </div>

      {/* 2. 상단 4대 핵심 KPI 카드 영역 (Top Operational KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: 전력 생산 및 부하율 */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/30 shadow-lg space-y-2 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1. 전력 생산 & 부하율
            </span>
            <span className="text-[10px] text-slate-400">PLTMG Hall</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-slate-100">{totalPowerMw.toFixed(2)}</span>
              <span className="text-xs text-slate-400 ml-1">MW</span>
            </div>
            <span className="text-xs font-bold text-amber-300">{plantLoadPct.toFixed(1)}% MCR</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
            <span>당일 발전량: <strong className="text-slate-200">{dailyMwh.toFixed(1)} MWh</strong></span>
            <span>가동 기수: <strong className="text-emerald-400">{runningEngines.length}/5 기</strong></span>
          </div>
        </div>

        {/* KPI 2: 가스 소비 & 열효율 */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/30 shadow-lg space-y-2 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              2. 가스 소비 & 열효율
            </span>
            <span className="text-[10px] text-slate-400">Heat Rate</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-cyan-300">{(dailyGasFlowNm3 / 1000).toFixed(1)}k</span>
              <span className="text-xs text-slate-400 ml-1">Nm³/day</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">50.35% Eff</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
            <span>인입 열량: <strong className="text-slate-200">{Math.round(dailyHeatMmbtu).toLocaleString()} MMBtu</strong></span>
            <span>Heat Rate: <strong className="text-cyan-300">7,150 kJ/kWh</strong></span>
          </div>
        </div>

        {/* KPI 3: 공급망 재고 & 버퍼 */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-lg space-y-2 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              3. 공급망 재고 & 버퍼
            </span>
            <span className="text-[10px] text-slate-400">Autonomy</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-emerald-300">{yardAutonomyDays.toFixed(2)}</span>
              <span className="text-xs text-slate-400 ml-1">Days Buffer</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">{onsiteLadenTanksCount} Tanks</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
            <span>Bay 01 피드: <strong className="text-slate-200">88.5% ({activeTankAutonomyHours.toFixed(1)}h)</strong></span>
            <span>현장 재고: <strong className="text-emerald-400">354.7k Nm³</strong></span>
          </div>
        </div>

        {/* KPI 4: 정산 수불 일치율 (Audit) */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-purple-500/30 shadow-lg space-y-2 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              4. 정산 수불 일치율
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              AUDIT PASS
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-slate-100">±0.42</span>
              <span className="text-xs text-slate-400 ml-1">% Variance</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">≤ 2.0% Tol</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
            <span>당월 누적 차액: <strong className="text-cyan-300">$5,807 USD</strong></span>
            <span>FloBoss MMBtu: <strong className="text-slate-200">29,485</strong></span>
          </div>
        </div>
      </div>

      {/* 3. 중앙 공정 계통도 (Process Block Flow Diagram - 5 Interconnected Blocks) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm sm:text-base font-bold text-slate-100 font-sans">
              End-to-End LNG Virtual Pipeline Process Block Flow Diagram
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            💡 Click any block below to open full engineering inspection modal & telemetry details.
          </span>
        </div>

        {/* Process Flow 5-Block Grid with Interconnecting Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative pt-2">
          {/* Block 1: Arun Terminal */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_1_ARUN')}
            className="p-4 bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-2xl shadow-md transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.02]"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30">
                  NODE 1
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h5 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                1. Arun PAG Terminal
              </h5>
              <span className="text-[11px] text-slate-400 block mb-3">Loading & Staging Hub</span>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Laden Stock:</span>
                  <span className="text-emerald-400 font-bold">16 Tanks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Empty Return:</span>
                  <span className="text-slate-400 font-bold">32 Tanks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Methane (CH4):</span>
                  <span className="text-cyan-300 font-bold">90.24%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Inspect Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Block 2: MV Saviour Sea Transit */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_2_SAVIOUR')}
            className="p-4 bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/60 rounded-2xl shadow-md transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.02]"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/30">
                  NODE 2
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              </div>
              <h5 className="font-bold text-sm text-slate-100 group-hover:text-blue-300 transition-colors">
                2. MV Saviour Transit
              </h5>
              <span className="text-[11px] text-slate-400 block mb-3">Marine Deck Carrier</span>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Carrier Tanks:</span>
                  <span className="text-blue-400 font-bold">48 Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Liquid Mass:</span>
                  <span className="text-slate-200 font-bold">1,968 m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Voyage Status:</span>
                  <span className="text-emerald-400 font-bold">9.8 kts (ETA 18h)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">
              <span>Inspect Voyage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Block 3: Nias Yard & Decanting Bays */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_3_NIAS_YARD')}
            className="p-4 bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-2xl shadow-md transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.02]"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                  NODE 3 & 4
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h5 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                3. Nias Yard & Bays
              </h5>
              <span className="text-[11px] text-slate-400 block mb-3">Decanting & Laydown</span>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Bay Tank:</span>
                  <span className="text-emerald-400 font-bold">ISOT-009</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bay Tank Level:</span>
                  <span className="text-cyan-300 font-bold">88.5% (22.4k Nm³)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Yard Autonomy:</span>
                  <span className="text-emerald-400 font-bold">{yardAutonomyDays.toFixed(1)} Days</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              <span>Inspect Bays</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Block 4: Re-gas & PRSS / GC Station */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_4_REGAS_PRSS')}
            className="p-4 bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/60 rounded-2xl shadow-md transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.02]"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                  REGAS SKID
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <h5 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                4. Re-Gas & PRSS / GC
              </h5>
              <span className="text-[11px] text-slate-400 block mb-3">Vaporizers & Metering</span>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Header Pressure:</span>
                  <span className="text-emerald-400 font-bold">2.18 Barg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gas Temperature:</span>
                  <span className="text-slate-200 font-bold">+24.5 °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GC-01 Methane:</span>
                  <span className="text-cyan-300 font-bold">90.80%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition-transform">
              <span>Inspect Regas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Block 5: 25MW PLTMG Engine Hall */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_5_PLTMG_PLANT')}
            className="p-4 bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-2xl shadow-md transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.02]"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30">
                  PLTMG 25MW
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h5 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                5. PLTMG 5 × MAN 7L
              </h5>
              <span className="text-[11px] text-slate-400 block mb-3">Power Generation</span>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Output:</span>
                  <span className="text-amber-400 font-bold">{totalPowerMw.toFixed(2)} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Running Units:</span>
                  <span className="text-emerald-400 font-bold">4 / 5 Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gas Demand:</span>
                  <span className="text-cyan-300 font-bold">4,505 Nm³/h</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Inspect Engines</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 하단 세부 요약 영역 (2열 레이아웃) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 font-mono text-xs">
        {/* 좌측 패널: MAN 7L 51/60 DF 1~5호기 미니 상태 매트릭스 */}
        <div className="p-5 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <span className="text-sm font-bold text-amber-400 flex items-center gap-2 font-sans">
                <Cpu className="w-4 h-4 text-amber-400" />
                MAN 7L 51/60 DF Generator Dispatch Summary (#1 ~ #5)
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Tab 3</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                    <th className="py-2">Unit</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Power (kW)</th>
                    <th className="py-2 text-right">Load %</th>
                    <th className="py-2 text-right">Press (bar)</th>
                    <th className="py-2 text-right">Gas Flow (Nm³/h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {engines.map((eng) => (
                    <tr key={eng.id} className="hover:bg-slate-800/30">
                      <td className="py-2 font-bold text-slate-200">{eng.tag}</td>
                      <td className="py-2 text-center">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            eng.status === 'RUN'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {eng.status}
                        </span>
                      </td>
                      <td className="py-2 text-right font-black text-slate-100">{eng.powerKw.toLocaleString()}</td>
                      <td className="py-2 text-right text-amber-400">{eng.loadPct.toFixed(0)}%</td>
                      <td className="py-2 text-right text-cyan-300">{eng.pressBar > 0 ? eng.pressBar.toFixed(2) : '-'}</td>
                      <td className="py-2 text-right text-emerald-400">{eng.flowNm3h > 0 ? eng.flowNm3h.toFixed(0) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400">
            <span>Total MCR: <strong className="text-slate-200">36.75 MW</strong></span>
            <span>Total Gas Flow: <strong className="text-cyan-300">{totalGasFlowNm3h.toFixed(0)} Nm³/h</strong></span>
          </div>
        </div>

        {/* 우측 패널: 120개 ISO 탱크 3개 거점 분포 바 및 안전 재고 임계선 */}
        <div className="p-5 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-2 font-sans">
                <Database className="w-4 h-4 text-emerald-400" />
                120-Fleet ISO Tank Global Supply Distribution & Safety Threshold
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('CUSTODY_HEAT_SETTLEMENT', 'REGAS_SYSTEM')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Stock Tab 4</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Segmented Distribution Progress Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Fleet Active Allocation:</span>
                <span className="text-emerald-300 font-bold">120 Total Tanks (100%)</span>
              </div>
              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div style={{ width: '20%' }} className="bg-emerald-500 h-full" title="Nias Yard: 24 Tanks (20%)" />
                <div style={{ width: '40%' }} className="bg-blue-500 h-full" title="MV Saviour Transit: 48 Tanks (40%)" />
                <div style={{ width: '40%' }} className="bg-amber-500 h-full" title="PAG Arun Hub: 48 Tanks (40%)" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Nias Site: 24 (20%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> MV Saviour: 48 (40%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> PAG Arun: 48 (40%)</span>
              </div>
            </div>

            {/* Safety Stock Threshold Indicator */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Nias Onsite Safety Stock Buffer Margin
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  140% SAFE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Min Threshold (72h):</span>
                  <span className="font-bold text-amber-400">10 Full Tanks</span>
                </div>
                <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Current Onsite:</span>
                  <span className="font-bold text-emerald-300">{onsiteLadenTanksCount} Full Tanks ({yardAutonomyDays.toFixed(1)} Days)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
            <span>Next Marine Delivery (ETA):</span>
            <span className="text-blue-300 font-bold">MV Saviour +48 Laden Tanks (In ~18h)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. 블록별 세부 점검 팝업 모달 (Detail Modal per Process Block)             */}
      {/* ========================================================================= */}
      {activeModalBlock && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl animate-in zoom-in-95 font-sans space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30">
                  {activeModalBlock === 'BLOCK_1_ARUN' && <Building2 className="w-6 h-6 text-amber-400" />}
                  {activeModalBlock === 'BLOCK_2_SAVIOUR' && <Ship className="w-6 h-6 text-blue-400" />}
                  {activeModalBlock === 'BLOCK_3_NIAS_YARD' && <Droplets className="w-6 h-6 text-emerald-400" />}
                  {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && <Gauge className="w-6 h-6 text-cyan-400" />}
                  {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && <Cpu className="w-6 h-6 text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-100">
                    {activeModalBlock === 'BLOCK_1_ARUN' && 'Block 1: Arun Port & PAG Loading Terminal'}
                    {activeModalBlock === 'BLOCK_2_SAVIOUR' && 'Block 2: MV Saviour Marine Transit Carrier'}
                    {activeModalBlock === 'BLOCK_3_NIAS_YARD' && 'Block 3: Nias Laydown Yard & Decanting Bays'}
                    {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && 'Block 4: Re-gasification Skid & PRSS / GC Station'}
                    {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && 'Block 5: 25MW PLTMG Engine Hall (5 × MAN 7L 51/60 DF)'}
                  </h3>
                  <span className="text-xs font-mono text-cyan-400">Engineering Process Inspection (Read-Only)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalBlock(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body Content per Block */}
            <div className="space-y-4 font-mono text-xs">
              {/* BLOCK 1: Arun Terminal */}
              {activeModalBlock === 'BLOCK_1_ARUN' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Loading Batch ID:</span><span className="text-slate-100 font-bold">PAG-ARUN-2026-B08</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Arun Staging Yard Stock:</span><span className="text-amber-400 font-bold">16 Laden (Full) / 32 Empty Return</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Methane Purity (COQ):</span><span className="text-cyan-300 font-bold">90.24 mol%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Design Fuel Gas LHV:</span><span className="text-slate-200 font-bold">28,000 kJ/Nm³ (1,048.5 BTU/SCF)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Total Batch Energy:</span><span className="text-emerald-400 font-bold">40,845 MMBtu</span></div>
                  </div>
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px]">
                    ℹ️ Quality certificate (COQ) issued at Arun loading station is dynamically linked with Sub-Tab 2 and Sub-Tab 4.
                  </div>
                </div>
              )}

              {/* BLOCK 2: MV Saviour Transit */}
              {activeModalBlock === 'BLOCK_2_SAVIOUR' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Voyage Number:</span><span className="text-slate-100 font-bold">VOY-SAV-2026-07 (Laden Leg)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Vessel Deck Capacity:</span><span className="text-blue-400 font-bold">48 ISO Tanks (100% Laden)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Current Vessel Speed:</span><span className="text-emerald-400 font-bold">9.8 Knots (Fair Weather)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Estimated Arrival (ETA):</span><span className="text-cyan-300 font-bold">2026-07-29 02:00 WIB (~18h)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Avg Tank Pressure:</span><span className="text-slate-200 font-bold">0.18 MPa (Stable Cryogenic)</span></div>
                  </div>
                </div>
              )}

              {/* BLOCK 3: Nias Yard & Decanting */}
              {activeModalBlock === 'BLOCK_3_NIAS_YARD' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Active Bay Feed Tank:</span><span className="text-emerald-400 font-bold">ISOT-009 (Bay 01 / T-201)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Active Tank Level:</span><span className="text-cyan-300 font-bold">88.5% (22,421 Nm³ Usable)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Single Tank Autonomy:</span><span className="text-amber-400 font-bold">{activeTankAutonomyHours.toFixed(1)} Hours (~0.21 Days)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Onsite Ready Yard Tanks:</span><span className="text-emerald-300 font-bold">14 Full Units (354,690 Nm³)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Total Site Yard Autonomy:</span><span className="text-emerald-400 font-black">{yardAutonomyDays.toFixed(2)} Days ({yardAutonomyHours.toFixed(1)} Hours)</span></div>
                  </div>
                </div>
              )}

              {/* BLOCK 4: Regas & PRSS / GC */}
              {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Vaporizer Discharge Header:</span><span className="text-emerald-400 font-bold">2.18 Barg / +24.5 °C</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Metering Run A (M-101A):</span><span className="text-cyan-300 font-bold">14,820.5 MSCF (Active Custody)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Metering Run B (M-101B):</span><span className="text-slate-300 font-bold">14,815.2 MSCF (Check Standby)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Dual Metering Delta:</span><span className="text-emerald-400 font-bold">-0.04% (Within 0.25% Limit)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">GC-01 Composition:</span><span className="text-amber-400 font-bold">90.80% CH4 | 1,048.5 BTU/SCF</span></div>
                  </div>
                </div>
              )}

              {/* BLOCK 5: PLTMG Power Plant */}
              {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Engine Type:</span><span className="text-cyan-300 font-bold">MAN 7L 51/60 DF (5 Units)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Unit MCR / NCR:</span><span className="text-slate-200 font-bold">7,350 kW / 6,615 kW each</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Current Plant Dispatch:</span><span className="text-amber-400 font-bold">4 Units @ 4,410 kW (60% load) = 17.64 MW</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Base Gas Heat Rate:</span><span className="text-cyan-300 font-bold">7,150 kJ/kWh (50.35% Eff)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Total Fuel Gas Flow:</span><span className="text-emerald-400 font-black">{totalGasFlowNm3h.toFixed(0)} Nm³/h</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Bar (Deep Links) */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModalBlock(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
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
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
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
