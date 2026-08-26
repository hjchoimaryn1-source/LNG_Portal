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
  CheckSquare,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';
import { useTheme } from '@/context/ThemeContext';

interface NiasOperationalOverviewTabProps {
  onNavigateSubTab?: (targetTab: string, domain?: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM') => void;
}

type ProcessBlockId = 'BLOCK_1_ARUN' | 'BLOCK_2_SAVIOUR' | 'BLOCK_3_NIAS_YARD' | 'BLOCK_4_REGAS_PRSS' | 'BLOCK_5_PLTMG_PLANT';

export default function NiasOperationalOverviewTab({ onNavigateSubTab }: NiasOperationalOverviewTabProps) {
  const { fleetTanks, gasCompositions } = usePortalData();
  const { theme, isDark } = useTheme();

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
    <div className={`w-full space-y-4 font-sans text-xs transition-colors duration-150 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* ========================================================================= */}
      {/* 1. 상단 컴팩트 툴바: 운전 일보 확정 상태 및 메타데이터 바 (Single-Line Toolbar) */}
      {/* ========================================================================= */}
      <div className={`border rounded-lg p-2.5 px-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
        isDark
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-slate-300 shadow-sm'
      }`}>
        {/* Left Status Indicators */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${
            reportStatus === 'CONFIRMED'
              ? 'bg-emerald-700 text-white'
              : 'bg-amber-600 text-white'
          }`}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {reportStatus === 'CONFIRMED' ? 'CONFIRMED (운전 일보 확정 완료)' : 'UNDER REVIEW (일보 검토 중)'}
          </span>

          <span className={`px-2 py-1 rounded border font-mono font-bold text-xs flex items-center gap-1 ${
            isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Cut-off: 2026-07-28 06:00 WIB</span>
          </span>

          <span className={`px-2 py-1 rounded border font-mono font-bold text-xs flex items-center gap-1 ${
            isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}>
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Lead Shift Eng: Ahmad Fauzi</span>
          </span>

          <span className={`hidden xl:inline-block font-semibold ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Nias 25MW PLTMG & Regas Terminal Integrated Process Flow & Daily Dispatch
          </span>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setReportStatus(reportStatus === 'CONFIRMED' ? 'REVIEW' : 'CONFIRMED')}
            className={`px-2.5 py-1 rounded border text-xs font-bold cursor-pointer transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            Toggle: {reportStatus}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM')}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>일보 입력 바로가기 (Tab 3)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 상단 4대 핵심 KPI 요약 카드 영역 (Classic ERP 4-Grid Layout)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: 전력 생산 & 부하율 */}
        <div className={`border rounded-lg overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          {/* Panel Title Bar */}
          <div className={`px-3 py-1.5 border-b font-bold flex justify-between items-center ${
            isDark ? 'bg-slate-800/90 border-slate-700 text-amber-400' : 'bg-slate-200 border-slate-300 text-slate-800'
          }`}>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              1. 전력 생산 & 부하율
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wide opacity-80">PLTMG Hall</span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {totalPowerMw.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-600 ml-1">MW</span>
              </div>
              <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded border ${
                isDark ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {plantLoadPct.toFixed(1)}% MCR
              </span>
            </div>
            <div className={`pt-2 border-t flex justify-between text-xs font-mono ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
            }`}>
              <span>당일 발전량: <strong className={isDark ? 'text-slate-100' : 'text-slate-950'}>{dailyMwh.toFixed(1)} MWh</strong></span>
              <span>가동 기수: <strong className="text-emerald-700 font-black">{runningEngines.length}/5 기</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 2: 가스 소비 & 열효율 */}
        <div className={`border rounded-lg overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          {/* Panel Title Bar */}
          <div className={`px-3 py-1.5 border-b font-bold flex justify-between items-center ${
            isDark ? 'bg-slate-800/90 border-slate-700 text-sky-400' : 'bg-slate-200 border-slate-300 text-slate-800'
          }`}>
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-sky-600" />
              2. 가스 소비 & 열효율
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wide opacity-80">Heat Rate</span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {(dailyGasFlowNm3 / 1000).toFixed(1)}k
                </span>
                <span className="text-xs font-bold text-slate-600 ml-1">Nm³/day</span>
              </div>
              <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded border ${
                isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                50.35% Eff
              </span>
            </div>
            <div className={`pt-2 border-t flex justify-between text-xs font-mono ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
            }`}>
              <span>인입 열량: <strong className={isDark ? 'text-slate-100' : 'text-slate-950'}>{Math.round(dailyHeatMmbtu).toLocaleString()} MMBtu</strong></span>
              <span>Heat Rate: <strong className="text-sky-700 font-bold">7,150 kJ/kWh</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 3: 공급망 재고 & 버퍼 */}
        <div className={`border rounded-lg overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          {/* Panel Title Bar */}
          <div className={`px-3 py-1.5 border-b font-bold flex justify-between items-center ${
            isDark ? 'bg-slate-800/90 border-slate-700 text-emerald-400' : 'bg-slate-200 border-slate-300 text-slate-800'
          }`}>
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-emerald-600" />
              3. 공급망 재고 & 버퍼
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wide opacity-80">Autonomy</span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {yardAutonomyDays.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-600 ml-1">Days Buffer</span>
              </div>
              <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded border ${
                isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {onsiteLadenTanksCount} Tanks
              </span>
            </div>
            <div className={`pt-2 border-t flex justify-between text-xs font-mono ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
            }`}>
              <span>Bay 01 피드: <strong className={isDark ? 'text-slate-100' : 'text-slate-950'}>88.5% ({activeTankAutonomyHours.toFixed(1)}h)</strong></span>
              <span>현장 재고: <strong className="text-emerald-700 font-bold">354.7k Nm³</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 4: 정산 수불 일치율 (Audit) */}
        <div className={`border rounded-lg overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          {/* Panel Title Bar */}
          <div className={`px-3 py-1.5 border-b font-bold flex justify-between items-center ${
            isDark ? 'bg-slate-800/90 border-slate-700 text-indigo-400' : 'bg-slate-200 border-slate-300 text-slate-800'
          }`}>
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              4. 정산 수불 일치율
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
              isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-emerald-700 text-white'
            }`}>
              AUDIT PASS
            </span>
          </div>
          {/* Panel Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  ±0.42
                </span>
                <span className="text-xs font-bold text-slate-600 ml-1">% Variance</span>
              </div>
              <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded border ${
                isDark ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40' : 'bg-indigo-100 text-indigo-900 border-indigo-300'
              }`}>
                ≤ 2.0% Tol
              </span>
            </div>
            <div className={`pt-2 border-t flex justify-between text-xs font-mono ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
            }`}>
              <span>당월 누적 차액: <strong className="text-indigo-700 font-bold">$5,807 USD</strong></span>
              <span>FloBoss: <strong className={isDark ? 'text-slate-100' : 'text-slate-950'}>29,485 MMBtu</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 중앙 5-Node PFD 파이프라인 패널 (Clear Border Desktop Grid)              */}
      {/* ========================================================================= */}
      <div className={`border rounded-lg overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
      }`}>
        {/* Panel Main Header Bar */}
        <div className={`px-3.5 py-2 border-b font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 ${
          isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-200 border-slate-300 text-slate-900'
        }`}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs sm:text-sm font-black">
              End-to-End LNG Virtual Pipeline Process Block Flow Diagram (5-Node SCADA Flow)
            </h4>
          </div>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            💡 Click any process block to inspect engineering parameters & telemetry.
          </span>
        </div>

        {/* 5 Process Flow Node Grid */}
        <div className="p-3 grid grid-cols-1 md:grid-cols-5 gap-2.5">
          {/* Node 1: Arun Terminal */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_1_ARUN')}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-amber-600 hover:shadow-md flex flex-col justify-between ${
              isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div>
              <div className={`px-2.5 py-1 border-b font-bold flex justify-between items-center ${
                isDark ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-slate-200 border-slate-300 text-slate-800'
              }`}>
                <span className="font-mono text-xs">Node 1: Arun Hub</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs">
                <div className="font-bold text-slate-900 mb-1">1. Arun PAG Terminal</div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Laden Stock:</span>
                  <span className="font-bold text-emerald-700">16 Tanks</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Empty Return:</span>
                  <span className="font-bold text-slate-700">32 Tanks</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Methane (CH4):</span>
                  <span className="font-bold text-sky-700">90.24%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">LHV:</span>
                  <span className="font-bold text-slate-900">28,000 kJ/Nm³</span>
                </div>
              </div>
            </div>

            <div className={`px-2.5 py-1.5 border-t text-[11px] font-bold flex items-center justify-between transition-colors ${
              isDark ? 'border-slate-800 text-amber-400 bg-slate-900' : 'border-slate-300 text-amber-800 bg-slate-100'
            }`}>
              <span>Inspect Node 1</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 2: MV Saviour Transit */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_2_SAVIOUR')}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-blue-600 hover:shadow-md flex flex-col justify-between ${
              isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div>
              <div className={`px-2.5 py-1 border-b font-bold flex justify-between items-center ${
                isDark ? 'bg-slate-900 border-slate-700 text-blue-400' : 'bg-slate-200 border-slate-300 text-slate-800'
              }`}>
                <span className="font-mono text-xs">Node 2: Marine Sea</span>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs">
                <div className="font-bold text-slate-900 mb-1">2. MV Saviour Transit</div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Carrier Tanks:</span>
                  <span className="font-bold text-blue-700">48 Units</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Liquid Mass:</span>
                  <span className="font-bold text-slate-900">1,968 m³</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Speed / ETA:</span>
                  <span className="font-bold text-emerald-700">9.8 kts (~18h)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Avg Pressure:</span>
                  <span className="font-bold text-slate-900">0.18 MPa</span>
                </div>
              </div>
            </div>

            <div className={`px-2.5 py-1.5 border-t text-[11px] font-bold flex items-center justify-between transition-colors ${
              isDark ? 'border-slate-800 text-blue-400 bg-slate-900' : 'border-slate-300 text-blue-800 bg-slate-100'
            }`}>
              <span>Inspect Node 2</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 3: Nias Yard & Bays */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_3_NIAS_YARD')}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-emerald-600 hover:shadow-md flex flex-col justify-between ${
              isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div>
              <div className={`px-2.5 py-1 border-b font-bold flex justify-between items-center ${
                isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-slate-200 border-slate-300 text-slate-800'
              }`}>
                <span className="font-mono text-xs">Node 3 & 4: Yard</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs">
                <div className="font-bold text-slate-900 mb-1">3. Nias Yard & Bays</div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Active Feed:</span>
                  <span className="font-bold text-emerald-700">ISOT-009</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Feed Level:</span>
                  <span className="font-bold text-sky-700">88.5% (22.4k Nm³)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Yard Ready:</span>
                  <span className="font-bold text-emerald-700">14 Tanks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Autonomy:</span>
                  <span className="font-bold text-emerald-700">{yardAutonomyDays.toFixed(2)} Days</span>
                </div>
              </div>
            </div>

            <div className={`px-2.5 py-1.5 border-t text-[11px] font-bold flex items-center justify-between transition-colors ${
              isDark ? 'border-slate-800 text-emerald-400 bg-slate-900' : 'border-slate-300 text-emerald-800 bg-slate-100'
            }`}>
              <span>Inspect Node 3</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 4: Re-Gas & PRSS / GC */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_4_REGAS_PRSS')}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-sky-600 hover:shadow-md flex flex-col justify-between ${
              isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div>
              <div className={`px-2.5 py-1 border-b font-bold flex justify-between items-center ${
                isDark ? 'bg-slate-900 border-slate-700 text-sky-400' : 'bg-slate-200 border-slate-300 text-slate-800'
              }`}>
                <span className="font-mono text-xs">Node 4: Regas Skid</span>
                <span className="w-2 h-2 rounded-full bg-sky-600" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs">
                <div className="font-bold text-slate-900 mb-1">4. Re-Gas & PRSS / GC</div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Discharge Press:</span>
                  <span className="font-bold text-emerald-700">2.18 Barg</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Gas Temp:</span>
                  <span className="font-bold text-slate-900">+24.5 °C</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">GC-01 CH4:</span>
                  <span className="font-bold text-sky-700">90.80%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Metering Delta:</span>
                  <span className="font-bold text-emerald-700">-0.04%</span>
                </div>
              </div>
            </div>

            <div className={`px-2.5 py-1.5 border-t text-[11px] font-bold flex items-center justify-between transition-colors ${
              isDark ? 'border-slate-800 text-sky-400 bg-slate-900' : 'border-slate-300 text-sky-800 bg-slate-100'
            }`}>
              <span>Inspect Node 4</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Node 5: 25MW PLTMG Plant */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_5_PLTMG_PLANT')}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-amber-600 hover:shadow-md flex flex-col justify-between ${
              isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div>
              <div className={`px-2.5 py-1 border-b font-bold flex justify-between items-center ${
                isDark ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-slate-200 border-slate-300 text-slate-800'
              }`}>
                <span className="font-mono text-xs">Node 5: PLTMG</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              </div>

              <div className="p-2.5 space-y-1.5 font-mono text-xs">
                <div className="font-bold text-slate-900 mb-1">5. PLTMG 5 × MAN 7L</div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Active Output:</span>
                  <span className="font-bold text-amber-700">{totalPowerMw.toFixed(2)} MW</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Running Units:</span>
                  <span className="font-bold text-emerald-700">4 / 5 Units</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-600">Gas Demand:</span>
                  <span className="font-bold text-sky-700">4,505 Nm³/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Heat Rate:</span>
                  <span className="font-bold text-slate-900">7,150 kJ/kWh</span>
                </div>
              </div>
            </div>

            <div className={`px-2.5 py-1.5 border-t text-[11px] font-bold flex items-center justify-between transition-colors ${
              isDark ? 'border-slate-800 text-amber-400 bg-slate-900' : 'border-slate-300 text-amber-800 bg-slate-100'
            }`}>
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
        <div className={`border rounded-lg overflow-hidden flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div>
            {/* Panel Title Bar */}
            <div className={`px-3 py-1.5 border-b font-bold flex justify-between items-center ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-200 border-slate-300 text-slate-900'
            }`}>
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-600" />
                MAN 7L 51/60 DF Generator Dispatch Summary (GEN-01 ~ GEN-05)
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Tab 3</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Classic Engineering Spreadsheet Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-bold ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}>
                    <th className="py-1.5 px-3 border-r border-slate-200/50">Unit</th>
                    <th className="py-1.5 px-2 text-center border-r border-slate-200/50">Status</th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-200/50">Power (kW)</th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-200/50">Load %</th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-200/50">Press (bar)</th>
                    <th className="py-1.5 px-3 text-right">Gas Flow (Nm³/h)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-900'
                }`}>
                  {engines.map((eng, idx) => (
                    <tr
                      key={eng.id}
                      className={
                        idx % 2 === 0
                          ? isDark ? 'bg-slate-900/60 hover:bg-slate-800/60' : 'bg-white hover:bg-slate-100/60'
                          : isDark ? 'bg-slate-950/60 hover:bg-slate-800/60' : 'bg-slate-50 hover:bg-slate-100/60'
                      }
                    >
                      <td className="py-1.5 px-3 font-bold border-r border-slate-200/50">{eng.tag}</td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200/50">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                            eng.status === 'RUN'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-500 text-white'
                          }`}
                        >
                          {eng.status}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-black border-r border-slate-200/50">{eng.powerKw.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-bold text-amber-700 border-r border-slate-200/50">{eng.loadPct.toFixed(0)}%</td>
                      <td className="py-1.5 px-2 text-right border-r border-slate-200/50">{eng.pressBar > 0 ? eng.pressBar.toFixed(2) : '-'}</td>
                      <td className="py-1.5 px-3 text-right font-bold text-emerald-800">{eng.flowNm3h > 0 ? eng.flowNm3h.toFixed(0) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`px-3 py-2 border-t flex justify-between items-center text-xs font-mono font-bold ${
            isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}>
            <span>Total Engine MCR: <strong>36.75 MW</strong></span>
            <span>Total Fuel Gas Demand: <strong className="text-blue-700">{totalGasFlowNm3h.toFixed(0)} Nm³/h</strong></span>
          </div>
        </div>

        {/* 우측 패널: 120-Fleet ISO Tank Global Supply Distribution & Safety Margin */}
        <div className={`border rounded-lg overflow-hidden flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div>
            {/* Panel Title Bar */}
            <div className={`px-3 py-1.5 border-b font-bold flex justify-between items-center ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-200 border-slate-300 text-slate-900'
            }`}>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                120-Fleet ISO Tank Global Supply Distribution & Safety Margin
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('CUSTODY_HEAT_SETTLEMENT', 'REGAS_SYSTEM')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Stock Tab 4</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 space-y-3 font-mono text-xs">
              {/* Segmented Distribution Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">Fleet Active Allocation:</span>
                  <span className="text-slate-950">120 Total Tanks (100%)</span>
                </div>
                <div className="w-full h-4 rounded-sm overflow-hidden flex border border-slate-400">
                  <div style={{ width: '20%' }} className="bg-emerald-700 h-full" title="Nias Yard: 24 Tanks (20%)" />
                  <div style={{ width: '40%' }} className="bg-blue-700 h-full" title="MV Saviour Transit: 48 Tanks (40%)" />
                  <div style={{ width: '40%' }} className="bg-amber-600 h-full" title="PAG Arun Hub: 48 Tanks (40%)" />
                </div>
                <div className="flex justify-between text-[11px] font-semibold pt-0.5 text-slate-700">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-700" /> Nias Site: 24 (20%)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-700" /> MV Saviour: 48 (40%)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-600" /> PAG Arun: 48 (40%)</span>
                </div>
              </div>

              {/* Safety Margin Grid Box */}
              <div className={`p-2.5 rounded border space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Nias Onsite Safety Stock Buffer Margin
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold">
                    140% SAFE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded border ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                  }`}>
                    <span className="text-slate-600 block text-[10px]">Min Safety Threshold (72h):</span>
                    <span className="font-bold text-amber-700">10 Full Tanks</span>
                  </div>
                  <div className={`p-2 rounded border ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                  }`}>
                    <span className="text-slate-600 block text-[10px]">Current Onsite Ready:</span>
                    <span className="font-bold text-emerald-700">{onsiteLadenTanksCount} Full Tanks ({yardAutonomyDays.toFixed(2)} Days)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`px-3 py-2 border-t flex justify-between items-center text-xs font-mono font-bold ${
            isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}>
            <span>Next Marine Delivery (ETA):</span>
            <span className="text-blue-700">MV Saviour +48 Laden Tanks (In ~18h)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. 블록별 세부 점검 팝업 모달 (Classic Read-Only Engineering Inspection)   */}
      {/* ========================================================================= */}
      {activeModalBlock && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-lg max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 font-sans ${
            isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'bg-white border-slate-400 text-slate-900'
          }`}>
            {/* Modal Title Bar */}
            <div className={`px-4 py-2.5 border-b font-bold flex justify-between items-center ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'
            }`}>
              <div className="flex items-center gap-2">
                {activeModalBlock === 'BLOCK_1_ARUN' && <Building2 className="w-4 h-4 text-amber-600" />}
                {activeModalBlock === 'BLOCK_2_SAVIOUR' && <Ship className="w-4 h-4 text-blue-600" />}
                {activeModalBlock === 'BLOCK_3_NIAS_YARD' && <Droplets className="w-4 h-4 text-emerald-600" />}
                {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && <Gauge className="w-4 h-4 text-sky-600" />}
                {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && <Cpu className="w-4 h-4 text-amber-600" />}
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
                className="text-slate-600 hover:text-slate-900 p-0.5 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Key-Value Table */}
            <div className="p-4 space-y-3 font-mono text-xs">
              <div className={`p-3 rounded border space-y-1.5 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
              }`}>
                {activeModalBlock === 'BLOCK_1_ARUN' && (
                  <>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Loading Batch ID:</span><span className="font-bold text-slate-950">PAG-ARUN-2026-B08</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Arun Staging Stock:</span><span className="font-bold text-amber-700">16 Laden / 32 Empty Return</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Methane Purity (COQ):</span><span className="font-bold text-sky-700">90.24 mol%</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Fuel Gas LHV:</span><span className="font-bold text-slate-950">28,000 kJ/Nm³ (1,048.5 BTU/SCF)</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Batch Energy:</span><span className="font-bold text-emerald-700">40,845 MMBtu</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_2_SAVIOUR' && (
                  <>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Voyage Number:</span><span className="font-bold text-slate-950">VOY-SAV-2026-07 (Laden Leg)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Vessel Deck Capacity:</span><span className="font-bold text-blue-700">48 ISO Tanks (100% Laden)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Current Speed:</span><span className="font-bold text-emerald-700">9.8 Knots (Fair Weather)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Estimated Arrival (ETA):</span><span className="font-bold text-sky-700">2026-07-29 02:00 WIB (~18h)</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Avg Tank Pressure:</span><span className="font-bold text-slate-950">0.18 MPa</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_3_NIAS_YARD' && (
                  <>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Active Bay Feed:</span><span className="font-bold text-emerald-700">ISOT-009 (Bay 01 / T-201)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Active Tank Level:</span><span className="font-bold text-sky-700">88.5% (22,421 Nm³ Usable)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Single Tank Autonomy:</span><span className="font-bold text-amber-700">{activeTankAutonomyHours.toFixed(1)} Hours</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Onsite Ready Tanks:</span><span className="font-bold text-emerald-700">14 Full Units (354,690 Nm³)</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Total Site Autonomy:</span><span className="font-black text-emerald-700">{yardAutonomyDays.toFixed(2)} Days ({yardAutonomyHours.toFixed(1)} Hours)</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && (
                  <>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Discharge Header:</span><span className="font-bold text-emerald-700">2.18 Barg / +24.5 °C</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Metering Run A:</span><span className="font-bold text-sky-700">14,820.5 MSCF (Active Custody)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Metering Run B:</span><span className="font-bold text-slate-700">14,815.2 MSCF (Check Standby)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Dual Metering Delta:</span><span className="font-bold text-emerald-700">-0.04% (Tol ≤ 0.25%)</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">GC-01 Quality:</span><span className="font-bold text-amber-700">90.80% CH4 | 1,048.5 BTU/SCF</span></div>
                  </>
                )}

                {activeModalBlock === 'BLOCK_5_PLTMG_PLANT' && (
                  <>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Engine Model:</span><span className="font-bold text-sky-700">MAN 7L 51/60 DF (5 Units)</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Unit MCR / NCR:</span><span className="font-bold text-slate-950">7,350 kW / 6,615 kW each</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Plant Dispatch:</span><span className="font-bold text-amber-700">4 Units @ 60% = 17.64 MW</span></div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1"><span className="text-slate-600">Heat Rate:</span><span className="font-bold text-sky-700">7,150 kJ/kWh (50.35% Eff)</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Total Fuel Gas Flow:</span><span className="font-black text-emerald-700">{totalGasFlowNm3h.toFixed(0)} Nm³/h</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className={`px-4 py-2.5 border-t flex justify-between items-center ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setActiveModalBlock(null)}
                className={`px-3 py-1.5 rounded border text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                }`}
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
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
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
