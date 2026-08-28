'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  AlertCircle,
  TrendingUp,
  Radio,
  Boxes,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';
import { NodeState } from '@/types/lng';

interface NiasOperationalOverviewTabProps {
  onNavigateSubTab?: (targetTab: string, domain?: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM') => void;
}

type ProcessBlockId = 'BLOCK_1_ARUN' | 'BLOCK_2_SAVIOUR' | 'BLOCK_3_NIAS_YARD' | 'BLOCK_4_REGAS_PRSS' | 'BLOCK_5_NIAS_LAYDOWN_2' | 'BLOCK_5_PLTMG_PLANT';

export default function NiasOperationalOverviewTab({ onNavigateSubTab }: NiasOperationalOverviewTabProps) {
  const { fleetTanks, gasCompositions, activeBays, settlementRecords } = usePortalData();

  const [activeModalBlock, setActiveModalBlock] = useState<ProcessBlockId | null>(null);

  // ESC Key Listener for Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalBlock(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Real-Time Fleet & Gas Aggregations (Single Source of Truth from 120-Fleet Hub)
  const fleetMetrics = useMemo(() => {
    const totalFleet = fleetTanks.length || 120;

    // 1. Arun Hub (Node 1 / Aceh / Loading Terminal - Dynamic Reactive Calculation)
    const arunTanks = fleetTanks.filter(
      (t) =>
        t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL ||
        t.location === 'Aceh' ||
        t.location?.toUpperCase().includes('ARUN') ||
        t.position?.toUpperCase().includes('ARUN')
    );
    const arunEmptyCount = arunTanks.length;
    const arunBufferVolumeM3 = (arunEmptyCount * 1.0).toFixed(1);
    const arunTotalCount = arunTanks.length;

    // 2. MV Saviour Transit (Node 2 / Dedicated Marine Carrier - Dynamic Reactive Calculation)
    const saviourTanks = fleetTanks.filter(
      (t) =>
        t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT ||
        t.location === 'MV. Saviour' ||
        t.location?.toUpperCase().includes('SAVIOUR') ||
        t.position?.toUpperCase().includes('SAVIOUR')
    );
    const saviourTankCount = saviourTanks.length;
    const saviourTotalM3 = saviourTanks.reduce((sum, tank) => sum + (tank.levelM3 || 0), 0);
    const saviourHeelBufferVolumeM3 = (saviourTankCount * 1.0).toFixed(1);
    const saviourAvgPress =
      saviourTanks.length > 0
        ? saviourTanks.reduce((acc, t) => acc + (t.pressureMPa || 0.76), 0) / saviourTanks.length
        : 0.76;

    // 3. Active Feed Tank (Bay-mounted: ISOT-009 @ 49%)
    const activeRunningBay =
      activeBays.find((b) => b.status === 'RUNNING' && b.tankNo) ||
      activeBays.find((b) => b.tankNo) ||
      activeBays[0];
    const activeFeedTankTag = activeRunningBay?.tankNo || 'ISOT-009';
    const activeFeedTank = fleetTanks.find((t) => t.tankNo === activeFeedTankTag);
    const activeFeedLevelPct = activeRunningBay?.level ?? activeFeedTank?.level ?? 49.0;
    const activeFeedPressMPa = activeRunningBay?.pressure ?? activeFeedTank?.pressureMPa ?? 0.76;
    const activeBayRemainingNm3 = Math.round(nominalTankVolumeNm3 * (activeFeedLevelPct / 100));

    // 4. Nias Site / Yard (Nodes 3, 4, 5 / ORU Nias - Exactly 11 Units: 10 Laden + 1 Empty)
    const niasTanks = fleetTanks.filter(
      (t) =>
        t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
        t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
        t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
        t.location === 'ORU NIAS' ||
        t.location?.toUpperCase().includes('NIAS')
    );
    const niasTotalCount = niasTanks.length;

    // Ready Laden in Yard (9 Buffer Units excluding active ISOT-009)
    const niasLadenTanks = niasTanks.filter(
      (t) =>
        (t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
          t.position?.toLowerCase().includes('laydown 1') ||
          (t.level || 0) >= 50) &&
        t.tankNo !== activeFeedTankTag &&
        !t.isUnderMaintenance
    );
    const onsiteLadenCount = niasLadenTanks.length;
    const onsiteLadenGasNm3 = onsiteLadenCount * nominalTankVolumeNm3;

    // Empty / Heel stock in Yard (1 Unit: ISOT-064)
    const niasEmptyTanks = niasTanks.filter(
      (t) =>
        t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
        t.position?.toLowerCase().includes('laydown 2') ||
        t.position?.toLowerCase().includes('laydown 3') ||
        t.tankNo === 'ISOT-064' ||
        (t.level || 0) < 50
    );
    const onsiteEmptyCount = niasEmptyTanks.length;

    // Distribution Percentages
    const niasPct = totalFleet > 0 ? parseFloat(((niasTotalCount / totalFleet) * 100).toFixed(1)) : 9.2;
    const saviourPct = totalFleet > 0 ? parseFloat(((saviourTankCount / totalFleet) * 100).toFixed(1)) : 82.5;
    const arunPct = totalFleet > 0 ? parseFloat(((arunEmptyCount / totalFleet) * 100).toFixed(1)) : 8.3;

    // Autonomy Calculations
    const activeTankAutonomyHours = totalGasFlowNm3h > 0 ? activeBayRemainingNm3 / totalGasFlowNm3h : 0;
    const yardAutonomyHours = totalGasFlowNm3h > 0 ? ((onsiteLadenCount + 1) * nominalTankVolumeNm3) / totalGasFlowNm3h : 0;
    const yardAutonomyDays = yardAutonomyHours / 24;
    const safetyMarginPct = Math.round(((onsiteLadenCount + 1) / 10) * 100);
    const ch4Pct = 90.8;
    const ghvBtu = 1056.4;

    return {
      totalFleet,
      arunEmptyCount,
      arunBufferVolumeM3,
      arunTotalCount,
      saviourTankCount,
      saviourTotalM3,
      saviourHeelBufferVolumeM3,
      saviourAvgPress,
      activeFeedTankTag,
      activeFeedLevelPct,
      activeFeedPressMPa,
      activeBayRemainingNm3,
      onsiteLadenCount,
      onsiteLadenGasNm3,
      onsiteEmptyCount,
      niasTotalCount,
      niasPct,
      saviourPct,
      arunPct,
      activeTankAutonomyHours,
      yardAutonomyHours,
      yardAutonomyDays,
      safetyMarginPct,
      ch4Pct,
      ghvBtu,
    };
  }, [fleetTanks, activeBays, totalGasFlowNm3h]);

  const handleNavigate = (tab: string, domain: 'ISO_TANK_MGMT' | 'REGAS_SYSTEM' = 'REGAS_SYSTEM') => {
    setActiveModalBlock(null);
    if (onNavigateSubTab) {
      onNavigateSubTab(tab, domain);
    }
  };

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-200">
      {/* 1. SCADA Header Banner */}
      <div className="shrink-0 win-panel px-3 py-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-900 animate-pulse" />
          <h2 className="text-base sm:text-lg font-black text-blue-950">
            Nias LNG Terminal - Operational Overview
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-600 bg-white border border-slate-300 px-2.5 py-0.5 rounded-xs">
            2026-08-26 10:00 ~ 08-27 10:00  (24 hrs)
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ISO TANK FLOW DIAGRAM (5-BLOCK PIPELINE)                               */}
      {/* ========================================================================= */}
      <div className="shrink-0 win-panel overflow-hidden border border-slate-300">
        {/* Panel Header Bar (Deep Navy SCADA Theme) */}
        <div className="bg-[#0a2558] px-3 py-1.5 flex justify-between items-center text-white select-none">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              ISO Tank Flow Diagram
            </h4>
          </div>
        </div>

        {/* 5 Process Flow Block Grid */}
        <div className="p-1.5 grid grid-cols-1 md:grid-cols-5 gap-1.5">
          {/* Block 1: 1. PAGT (Arun) */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_1_ARUN')}
            className="win-panel border border-slate-300 hover:border-blue-600 rounded-none overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wide">1. PAGT (Arun)</span>
                <span className="w-2 h-2 rounded-none bg-emerald-400" title="Standby/Normal" />
              </div>

              <div className="p-1.5 space-y-0.5 font-mono text-[11px] text-slate-900">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Operational Mode:</span>
                  <span className="font-black text-slate-950">Standby &amp; Staging</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Empty Tanks On-Site:</span>
                  <span className="font-black text-slate-950">{fleetMetrics.arunEmptyCount} Units</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Heel Buffer Volume:</span>
                  <span className="font-black text-blue-950">{fleetMetrics.arunBufferVolumeM3} m³</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Heel Cold Condition:</span>
                  <span className="font-black text-slate-950">-126.5 °C / 3.0 barg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-bold">Next Batch Target:</span>
                  <span className="font-black text-slate-950">PAG-ARUN-2026-B09</span>
                </div>
              </div>
            </div>

            <div className="px-2 py-1 border-t border-slate-300 text-xs font-bold text-blue-700 bg-white hover:underline flex items-center justify-between">
              <span>Inspect Block 1 &gt;</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
            </div>
          </div>

          {/* Block 2: 2. M/V Saviour */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_2_SAVIOUR')}
            className="win-panel border border-slate-300 hover:border-blue-600 rounded-none overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wide">2. M/V Saviour</span>
                <span className="w-2 h-2 rounded-none bg-cyan-400 animate-pulse" />
              </div>

              <div className="p-1.5 space-y-0.5 font-mono text-[11px] text-slate-900">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Carrier Tanks:</span>
                  <span className="font-black text-slate-950">{fleetMetrics.saviourTankCount} Units</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Cargo State:</span>
                  <span className="font-black text-blue-950">{fleetMetrics.saviourTankCount} Empty Units</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Heel Retention:</span>
                  <span className="font-black text-slate-950">1.0 m³ (~{fleetMetrics.saviourHeelBufferVolumeM3} m³)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Speed / ETA:</span>
                  <span className="font-black text-slate-950">9.8 kts (~18h)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-bold">Avg Pressure:</span>
                  <span className="font-black text-slate-950">{fleetMetrics.saviourAvgPress.toFixed(2)} MPa</span>
                </div>
              </div>
            </div>

            <div className="px-2 py-1 border-t border-slate-300 text-xs font-bold text-blue-700 bg-white hover:underline flex items-center justify-between">
              <span>Inspect Block 2 &gt;</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
            </div>
          </div>

          {/* Block 3: 3. NIAS (Laydown 1) */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_3_NIAS_YARD')}
            className="win-panel border border-slate-300 hover:border-blue-600 rounded-none overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wide">3. NIAS (Laydown 1)</span>
                <span className="w-2 h-2 rounded-none bg-emerald-400" />
              </div>

              <div className="p-1.5 space-y-0.5 font-mono text-[11px] text-slate-900">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Full Stock:</span>
                  <span className="font-black text-slate-950">{fleetMetrics.onsiteLadenCount} Tanks</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Buffer Autonomy:</span>
                  <span className="font-black text-slate-950">{fleetMetrics.yardAutonomyDays.toFixed(2)} Days</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Safety Margin:</span>
                  <span className="font-black text-emerald-700">{fleetMetrics.safetyMarginPct}% SAFE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-bold">Avg Press:</span>
                  <span className="font-black text-slate-950">0.22 MPa</span>
                </div>
              </div>
            </div>

            <div className="px-2 py-1 border-t border-slate-300 text-xs font-bold text-blue-700 bg-white hover:underline flex items-center justify-between">
              <span>Inspect Block 3 &gt;</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
            </div>
          </div>

          {/* Block 4: 4. Regas & PRSS */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_4_REGAS_PRSS')}
            className="win-panel border border-slate-300 hover:border-blue-600 rounded-none overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wide">4. Regas & PRSS</span>
                <span className="w-2 h-2 rounded-none bg-cyan-400" />
              </div>

              <div className="p-1.5 space-y-0.5 font-mono text-[11px] text-slate-900">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Active Feed:</span>
                  <span className="font-black text-slate-950">{fleetMetrics.activeFeedTankTag} ({fleetMetrics.activeFeedLevelPct.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Discharge Press:</span>
                  <span className="font-black text-slate-950">2.18 Barg</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Gas Temp:</span>
                  <span className="font-black text-slate-950">+24.5 °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-bold">Metering Delta:</span>
                  <span className="font-black text-slate-950">-0.04%</span>
                </div>
              </div>
            </div>

            <div className="px-2 py-1 border-t border-slate-300 text-xs font-bold text-blue-700 bg-white hover:underline flex items-center justify-between">
              <span>Inspect Block 4 &gt;</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
            </div>
          </div>

          {/* Block 5: 5. NIAS (Laydown 2) */}
          <div
            onClick={() => setActiveModalBlock('BLOCK_5_NIAS_LAYDOWN_2')}
            className="win-panel border border-slate-300 hover:border-blue-600 rounded-none overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wide">5. NIAS (Laydown 2)</span>
                <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
              </div>

              <div className="p-1.5 space-y-0.5 font-mono text-[11px] text-slate-900">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Empty Tanks:</span>
                  <span className="font-black text-slate-950">{fleetMetrics.onsiteEmptyCount} Tanks</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Heel Retention:</span>
                  <span className="font-black text-slate-950">4.2% (1.0 m³ / 445 kg)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-700 font-bold">Holding Press:</span>
                  <span className="font-black text-slate-950">0.21 MPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-bold">Dispatch:</span>
                  <span className="font-black text-blue-950">Awaiting Backhaul</span>
                </div>
              </div>
            </div>

            <div className="px-2 py-1 border-t border-slate-300 text-xs font-bold text-blue-700 bg-white hover:underline flex items-center justify-between">
              <span>Inspect Block 5 &gt;</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DUAL-PANEL LOWER SCADA REDESIGN & BASELINE 1-UNIT AUTONOMY SIMULATOR   */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-1.5 overflow-hidden">
        {/* ======================================================================= */}
        {/* PANEL A (Left 50%): CUSTODY ENERGY & GAS CONVERSION                     */}
        {/* ======================================================================= */}
        <div className="win-panel overflow-hidden flex flex-col justify-between h-full min-h-0">
          <div className="flex flex-col h-full min-h-0 space-y-1 p-1">
            {/* Panel Title Bar */}
            <div className="win-titlebar shrink-0">
              <span className="flex items-center gap-1.5 text-white font-bold text-xs">
                <Scale className="w-3.5 h-3.5 text-cyan-300" />
                CUSTODY ENERGY & GAS CONVERSION (ARUN PAG → NIAS METERING)
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('CUSTODY_HEAT_SETTLEMENT', 'REGAS_SYSTEM')}
                className="text-xs font-bold win-tab-inactive flex items-center gap-1 cursor-pointer"
              >
                <span>Custody Tab 4</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Section 1 - Arun Custody Baseline */}
            <div className="p-1.5 bg-white border border-slate-300 rounded-xs space-y-1">
              <div className="flex justify-between items-center border-b border-slate-200 pb-0.5">
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-blue-950">
                  <Building2 className="w-3 h-3 text-cyan-600" />
                  1. ARUN CUSTODY BATCH BASELINE
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-bold">COQ Reference</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center font-mono pt-0.5">
                <div className="p-1 bg-slate-50 border border-slate-200 rounded-xs">
                  <span className="text-[9px] text-slate-600 block font-bold">Delivered Mass</span>
                  <span className="text-xs font-black text-slate-950">885.6 MT</span>
                  <span className="text-[9px] text-slate-500 block font-bold">Marine Parcel</span>
                </div>
                <div className="p-1 bg-slate-50 border border-slate-200 rounded-xs">
                  <span className="text-[9px] text-slate-600 block font-bold">Delivered Energy</span>
                  <span className="text-xs font-black text-slate-950">40,845 MMBtu</span>
                  <span className="text-[9px] text-slate-500 block font-bold">Gross Heat</span>
                </div>
                <div className="p-1 bg-slate-50 border border-slate-200 rounded-xs">
                  <span className="text-[9px] text-slate-600 block font-bold">Liquid Density</span>
                  <span className="text-xs font-black text-slate-950">442.02 kg/m³</span>
                  <span className="text-[9px] text-slate-500 block font-bold">@ -160.0 °C</span>
                </div>
              </div>
            </div>

            {/* Section 2 - Volumetric & Gas Phase Conversion */}
            <div className="p-1.5 bg-white border border-slate-300 rounded-xs space-y-1">
              <div className="flex justify-between items-center border-b border-slate-200 pb-0.5">
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-blue-950">
                  <Flame className="w-3 h-3 text-orange-600" />
                  2. VOLUMETRIC & GAS PHASE CONVERSION
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-bold">ISO 6976:2016</span>
              </div>
              <div className="space-y-0.5 font-mono text-[11px] text-slate-800">
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Total Standard Gas Volume:</span>
                  <span className="font-black text-slate-950">1,222,128 Nm³ <span className="text-[10px] text-slate-500 font-normal">(~1,380 Nm³/MT)</span></span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Gas Quality (GC Analysis):</span>
                  <span className="font-black text-slate-950">CH4 95.5 mol% | C2H6 3.39 mol%</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Gross Heating Value (GHV):</span>
                  <span className="font-black text-slate-950">39.42 MJ/Nm³ <span className="text-[10px] text-slate-500 font-normal">(1,056.4 BTU/SCF)</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Lower Heating Value (LHV):</span>
                  <span className="font-black text-slate-950">28,000 kJ/Nm³</span>
                </div>
              </div>
            </div>

            {/* Section 3 - Settlement & Metering Delta */}
            <div className="flex-1 min-h-0 p-1.5 bg-white border border-slate-300 rounded-xs flex flex-col justify-between space-y-1">
              <div className="flex justify-between items-center border-b border-slate-200 pb-0.5">
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-blue-950">
                  <Scale className="w-3 h-3 text-emerald-600" />
                  3. SETTLEMENT & DUAL METERING DELTA
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-emerald-700 text-white rounded-xs font-bold">
                  AUDIT PASS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <span className="text-[10px] text-slate-600 block font-bold">Custody Transfer Metering:</span>
                  <span className="font-black text-emerald-700 text-sm">±0.42% Variance</span>
                  <span className="text-[9px] text-slate-500 block font-bold">≤ 2.0% Tolerance Limit</span>
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <span className="text-[10px] text-slate-600 block font-bold">FloBoss Settled Base:</span>
                  <span className="font-black text-slate-950 text-sm">9,280 MMBtu</span>
                  <span className="text-[9px] text-emerald-700 block font-bold">MTD Var: $5,807 USD</span>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-2.5 py-1 win-panel border-t border-slate-300 flex justify-between items-center text-xs font-mono text-slate-900">
            <span>Thermodynamic Standard: <strong className="text-slate-950 font-black">ISO 6976:2016 / AGA-8</strong></span>
            <span>Compliance: <strong className="text-emerald-700 font-bold">PASS (Dual Run Delta ≤ 0.25%)</strong></span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* PANEL B (Right 50%): PLTMG POWER DEMAND & SITE AUTONOMY SIMULATOR       */}
        {/* ======================================================================= */}
        <div className="win-panel overflow-hidden flex flex-col justify-between h-full min-h-0">
          <div className="flex flex-col h-full min-h-0 space-y-1 p-1">
            {/* Panel Title Bar */}
            <div className="win-titlebar shrink-0">
              <span className="flex items-center gap-1.5 text-white font-bold text-xs">
                <Cpu className="w-3.5 h-3.5 text-yellow-300" />
                PLTMG POWER DEMAND & SITE AUTONOMY SIMULATOR
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('PLTMG_POWER_OUTPUT', 'REGAS_SYSTEM')}
                className="text-xs font-bold win-tab-inactive flex items-center gap-1 cursor-pointer"
              >
                <span>Power Tab 3</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Section 1 - Baseline Power Dispatch & Core Autonomy Display */}
            <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {/* Subcard 1: Baseline Power Dispatch (1 Unit @ 60% Load) */}
              <div className="p-1.5 bg-white border border-slate-300 rounded-xs space-y-1">
                <div className="flex justify-between items-center border-b border-slate-200 pb-0.5">
                  <span className="flex items-center gap-1 text-[11px] font-extrabold text-blue-950">
                    <Zap className="w-3 h-3 text-amber-500" />
                    BASELINE DISPATCH (1 × MAN 7L)
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 bg-emerald-700 text-white rounded-xs font-bold">
                    1/5 RUNNING
                  </span>
                </div>
                <div className="space-y-0.5 font-mono text-[11px] text-slate-800 pt-0.5">
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-600 font-bold">Active Power Output:</span>
                    <span className="font-black text-slate-950">4.41 MW (60.0% MCR)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-600 font-bold">Hourly Gas Burn Rate:</span>
                    <span className="font-black text-slate-950">1,126 Nm³/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Daily Burn / Heat Rate:</span>
                    <span className="font-black text-slate-950">27.02k Nm³/d (7,150 kJ/kWh)</span>
                  </div>
                </div>
              </div>

              {/* Subcard 2: Core Autonomy & Stock Display */}
              <div className="p-1.5 bg-white border border-slate-300 rounded-xs space-y-1">
                <div className="flex justify-between items-center border-b border-slate-200 pb-0.5">
                  <span className="flex items-center gap-1 text-[11px] font-extrabold text-blue-950">
                    <Droplets className="w-3 h-3 text-cyan-600" />
                    ONSITE STOCK & AUTONOMY
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-950 font-bold border border-emerald-300 rounded-xs">
                    100% SAFE
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-0.5">
                  <div>
                    <span className="text-xl font-black font-mono text-emerald-700">8.44</span>
                    <span className="text-xs font-bold text-slate-900 ml-1">Days Buffer</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-700 font-bold">
                    Stock: <strong className="text-slate-950">228.0k Nm³</strong>
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 flex justify-between border-t border-slate-100 pt-0.5">
                  <span>Run-Hours: <strong className="text-slate-950">202.5 Hours</strong></span>
                  <span>Safety (72h): <strong className="text-slate-950">10 Tanks Target</strong></span>
                </div>
              </div>
            </div>

            {/* Section 2 - Dynamic Scenario Matrix (Compact Sensitivity Strip) */}
            <div className="p-1.5 bg-slate-50 border border-slate-300 rounded-xs space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900 text-[11px]">
                <span className="flex items-center gap-1 text-blue-950 font-extrabold">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                  DYNAMIC POWER DEMAND SCENARIOS & AUTONOMY RUN-HOURS
                </span>
                <span className="text-[10px] font-mono text-slate-500">228.0k Nm³ Basis</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                <div className="p-1 bg-emerald-50 border-2 border-emerald-500 rounded-xs">
                  <span className="text-[9px] text-emerald-950 block font-bold">1 Unit @ 60% (4.4 MW)</span>
                  <span className="text-xs font-black text-emerald-800">8.44 Days (202.5h)</span>
                  <span className="text-[9px] text-emerald-700 block font-black">● Current Baseline</span>
                </div>
                <div className="p-1 bg-white border border-slate-300 rounded-xs">
                  <span className="text-[9px] text-slate-600 block font-bold">2 Units @ 60% (8.8 MW)</span>
                  <span className="text-xs font-black text-slate-950">4.22 Days (101.2h)</span>
                  <span className="text-[9px] text-slate-500 block font-bold">Burn: 2,252 Nm³/h</span>
                </div>
                <div className="p-1 bg-white border border-slate-300 rounded-xs">
                  <span className="text-[9px] text-slate-600 block font-bold">4 Units @ 60% (17.6 MW)</span>
                  <span className="text-xs font-black text-slate-950">2.11 Days (50.6h)</span>
                  <span className="text-[9px] text-slate-500 block font-bold">Burn: 4,505 Nm³/h</span>
                </div>
              </div>
            </div>

            {/* Section 3 - 120-Fleet ISO Tank Global Supply Distribution */}
            <div className="flex-1 min-h-0 bg-white border border-slate-300 rounded-xs p-1.5 flex flex-col justify-between space-y-1">
              <div className="space-y-0.5">
                <div className="flex justify-between font-bold text-slate-900 text-[11px]">
                  <span>120-Fleet ISO Tank Global Distribution:</span>
                  <span className="text-slate-950 font-black">{fleetMetrics.totalFleet} Total Tanks (100%)</span>
                </div>
                <div className="w-full h-3 rounded-xs overflow-hidden flex border border-slate-400">
                  <div style={{ width: `${fleetMetrics.niasPct}%` }} className="bg-emerald-600 h-full transition-all" title={`Nias Site: 11 Tanks (9%)`} />
                  <div style={{ width: `${fleetMetrics.saviourPct}%` }} className="bg-blue-600 h-full transition-all" title={`M/V Saviour: 99 Tanks (83%)`} />
                  <div style={{ width: `${fleetMetrics.arunPct}%` }} className="bg-amber-500 h-full transition-all" title={`PAG Arun: 10 Tanks (8%)`} />
                </div>
                <div className="flex justify-between text-[10px] font-bold pt-0.5 text-slate-900">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-emerald-600" /> Nias Site: 11 (9%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-blue-600" /> M/V Saviour: 99 (83%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-amber-500" /> PAG Arun: 10 (8%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-2.5 py-1 win-panel border-t border-slate-300 flex justify-between items-center text-xs font-mono text-slate-900">
            <span>Next Delivery (ETA): <strong className="text-slate-950 font-black">M/V Saviour +99 Laden Tanks (~18h)</strong></span>
            <span>Ledger: <strong className="text-slate-950 font-black">120 Total Units (100% SSOT Reconciled)</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. 블록별 세부 점검 팝업 모달 (2-Column Expanded Wide SCADA Modal)          */}
      {/* ========================================================================= */}
      {activeModalBlock && (
        <div
          onClick={() => setActiveModalBlock(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#404040] rounded-none w-[90vw] max-w-6xl h-[85vh] max-h-[820px] overflow-hidden shadow-2xl font-sans text-slate-900 flex flex-col justify-between"
          >
            {/* Modal Title Bar */}
            <div className="win-titlebar px-4 py-2 font-bold flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2.5">
                {activeModalBlock === 'BLOCK_1_ARUN' && <Building2 className="w-5 h-5 text-yellow-300" />}
                {activeModalBlock === 'BLOCK_2_SAVIOUR' && <Ship className="w-5 h-5 text-cyan-300" />}
                {activeModalBlock === 'BLOCK_3_NIAS_YARD' && <Droplets className="w-5 h-5 text-emerald-300" />}
                {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && <Gauge className="w-5 h-5 text-cyan-300" />}
                {(activeModalBlock === 'BLOCK_5_NIAS_LAYDOWN_2' || activeModalBlock === 'BLOCK_5_PLTMG_PLANT') && <Boxes className="w-5 h-5 text-yellow-300" />}
                <span className="text-sm sm:text-base font-extrabold tracking-wide">
                  {activeModalBlock === 'BLOCK_1_ARUN' && 'Block 1: PAGT (Arun) LNG Loading Terminal (Aceh, Indonesia)'}
                  {activeModalBlock === 'BLOCK_2_SAVIOUR' && 'Block 2: M/V Saviour Dedicated Marine Carrier (99 ISO Tanks)'}
                  {activeModalBlock === 'BLOCK_3_NIAS_YARD' && 'Block 3: NIAS (Laydown 1 - Laden Stock Yard & Autonomy)'}
                  {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && 'Block 4: Re-Gas & PRSS / Decanting Bays (Bay 01 ~ Bay 04)'}
                  {(activeModalBlock === 'BLOCK_5_NIAS_LAYDOWN_2' || activeModalBlock === 'BLOCK_5_PLTMG_PLANT') && 'Block 5: NIAS (Laydown 2 - Empty Return Staging & Backhaul)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalBlock(null)}
                className="text-white hover:text-red-300 p-1 cursor-pointer transition-colors"
                title="Close (ESC)"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2-Column Grid (Left: Precision Parameters | Right: 24-hr Trends & SCADA Logs) */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3.5 font-mono text-xs bg-slate-100 win-sunken">
              {/* ========================================================================= */}
              {/* BLOCK 1: ARUN HUB                                                         */}
              {/* ========================================================================= */}
              {activeModalBlock === 'BLOCK_1_ARUN' && (
                <div className="space-y-3.5">
                  {/* Top Status Banner */}
                  <div className="p-2.5 bg-white border border-slate-300 rounded-xs flex flex-wrap justify-between items-center gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-700 text-white text-[11px] font-bold rounded-xs">STANDBY &amp; TANK STAGING</span>
                      <span className="text-slate-900 font-bold">PAGT Terminal Yard Control &bull; Status: <strong className="text-blue-950 font-black">Normal Operation</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Last Dispatched Batch: <strong className="text-slate-950 font-bold">VOY-2026-N2 (12 Tanks Dispatched to Nias)</strong>
                    </div>
                  </div>

                  {/* 2-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Left Column (50%): Inventory & Cryo Parameters */}
                    <div className="space-y-3">
                      {/* Section 1: Yard Tank Inventory & Dispatch Status */}
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>1. YARD TANK INVENTORY &amp; DISPATCH STATUS</span>
                          <span className="text-[10px] text-slate-600 font-mono">12 Units Total</span>
                        </div>
                        <div className="space-y-1.5 text-slate-800">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Total Tanks on Site:</span>
                            <span className="text-sm font-bold text-slate-900 font-mono">12 Units Total</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Standby Empty (Ready):</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900 font-mono">10 Units</span>
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-xs">READY FOR LOADING</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Maintenance / Repair Quarantine:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-amber-900 font-mono">2 Units</span>
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold rounded-xs">QUARANTINED</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">Last Dispatched Batch:</span>
                            <span className="text-sm font-bold text-blue-900 font-mono">VOY-2026-N2 (12 Tanks)</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Retrograde Heel & Cryogenic Status */}
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>2. RETROGRADE HEEL &amp; CRYOGENIC STATUS</span>
                          <span className="text-[10px] text-slate-600 font-mono">Cold-Kept Status</span>
                        </div>
                        <div className="space-y-1.5 text-slate-800">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Aggregate Heel Volume:</span>
                            <span className="text-sm font-bold text-slate-900 font-mono">11.8 m³ (~5,215 kg Buffer)</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Average Tank Pressure:</span>
                            <span className="text-sm font-bold text-slate-900 font-mono">2.95 barg (Target: 3.0 barg)</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Average Cryo Temperature:</span>
                            <span className="text-sm font-bold text-blue-900 font-mono">-126.5 °C (Sub-cooled Liquid)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">Cold Condition Readiness:</span>
                            <span className="px-2 py-0.5 bg-emerald-700 text-white font-bold text-[10px] rounded-xs">100% QUALIFIED (Direct Load Ready)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (50%): Sensor Integrity & Maintenance Tracker */}
                    <div className="space-y-3">
                      {/* Section 3: Gauge & Sensor Health Integrity */}
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>3. GAUGE &amp; SENSOR HEALTH INTEGRITY</span>
                          <span className="text-[10px] text-slate-600 font-mono">Telemetry Verification</span>
                        </div>
                        <div className="space-y-1.5 text-slate-800">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">DP Level Gauges:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900 font-mono">12 / 12 Verified</span>
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-xs">&plusmn;1.5% Drift OK</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Pressure Transmitters:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900 font-mono">12 / 12 Calibrated</span>
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-xs">DUAL SENSOR OK</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-xs text-slate-500 font-medium">Temperature Probes (RTD):</span>
                            <span className="text-sm font-bold text-emerald-800 font-mono">Normal Operation</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">Calibration Drift Alarm:</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold rounded-xs">0 UNITS ALERTED (ALL NORMAL)</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Tank Maintenance & Quarantine Tracker */}
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>4. TANK MAINTENANCE &amp; QUARANTINE TRACKER</span>
                          <span className="text-[10px] text-slate-600 font-mono">2 Quarantined Tanks</span>
                        </div>
                        <div className="overflow-x-auto win-sunken border border-slate-200">
                          <table className="w-full text-left font-mono text-xs">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                                <th className="py-1.5 px-2 border-r border-slate-300">ISO Tank UID</th>
                                <th className="py-1.5 px-2 border-r border-slate-300">Serial No</th>
                                <th className="py-1.5 px-2 border-r border-slate-300">Maintenance Activity</th>
                                <th className="py-1.5 px-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-900">
                              <tr className="bg-white">
                                <td className="py-2 px-2 font-bold text-blue-900 border-r border-slate-300">ISOT-045</td>
                                <td className="py-2 px-2 border-r border-slate-300 font-medium">SIMU-8101489</td>
                                <td className="py-2 px-2 border-r border-slate-300 font-medium font-sans">Annual Relief Valve (PRV) Recertification</td>
                                <td className="py-2 px-2 text-center">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-xs">IN PROGRESS</span>
                                </td>
                              </tr>
                              <tr className="bg-slate-50">
                                <td className="py-2 px-2 font-bold text-blue-900 border-r border-slate-300">ISOT-072</td>
                                <td className="py-2 px-2 border-r border-slate-300 font-medium">SIMU-8101344</td>
                                <td className="py-2 px-2 border-r border-slate-300 font-medium font-sans">Outer Vacuum Integrity &amp; Shell Check</td>
                                <td className="py-2 px-2 text-center">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold rounded-xs">SCHEDULED</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BLOCK 2: MV SAVIOUR                                                       */}
              {/* ========================================================================= */}
              {activeModalBlock === 'BLOCK_2_SAVIOUR' && (
                <div className="space-y-3.5">
                  {/* Top Status Banner */}
                  <div className="p-2.5 bg-white border border-slate-300 rounded-xs flex flex-wrap justify-between items-center gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-700 text-white text-[11px] font-bold rounded-xs">UNDERWAY LADEN</span>
                      <span className="text-slate-900 font-bold">Voyage: <strong className="text-blue-950 font-black">VOY-SAV-2026-07</strong> (Arun → Nias Terminal)</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Estimated Arrival (ETA): <strong className="text-slate-950">2026-07-29 02:00 WIB (In ~18h)</strong>
                    </div>
                  </div>

                  {/* 2-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Left Column (50%): Navigation & Cargo Telemetry */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>1. NAVIGATION & VESSEL DYNAMICS</span>
                          <span className="text-[10px] text-slate-600 font-mono">AIS Live</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Current Speed:</span><span className="font-black text-slate-950">9.8 Knots (Cruising)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Heading / Course:</span><span className="font-black text-slate-950">182° SSW (Nias Route)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Sea State:</span><span className="font-black text-slate-950">Wave 1.2m / Wind 12 kts</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Remaining Distance:</span><span className="font-black text-slate-950">176.4 Nautical Miles</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">Fuel Efficiency:</span><span className="font-black text-slate-950">1.8 MT MGO/day</span></div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>2. {fleetMetrics.saviourTankCount} ISO TANK CARGO DECK TELEMETRY</span>
                          <span className="text-[10px] text-slate-600 font-mono">Cryogenic</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Deck Cargo Units:</span><span className="font-black text-slate-950">{fleetMetrics.saviourTankCount} ISO Tanks (Laden Marine Transit)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Liquid Mass:</span><span className="font-black text-slate-950">{Math.round(fleetMetrics.saviourTotalM3 || 0).toLocaleString()} m³ / {((fleetMetrics.saviourTotalM3 || 0) * 0.45).toFixed(1)} Metric Tons</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Average Tank Pressure:</span><span className="font-black text-slate-950">{fleetMetrics.saviourAvgPress.toFixed(2)} MPa ({(fleetMetrics.saviourAvgPress * 10).toFixed(2)} bar)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Peak Tank Pressure:</span><span className="font-black text-slate-950">0.22 MPa</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">Boil-off Rate:</span><span className="font-black text-emerald-700">&lt; 0.12%/day (Optimal)</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (50%): 24-Hr Track & Berth Arrival Log */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>24-HR VOYAGE TELEMETRY LOG</span>
                          <span className="text-[10px] text-slate-600 font-mono">Passage Status</span>
                        </div>
                        <div className="overflow-x-auto win-sunken border border-slate-200">
                          <table className="w-full text-left font-mono text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                                <th className="py-1 px-2 border-r border-slate-300">Time</th>
                                <th className="py-1 px-2 border-r border-slate-300">Speed</th>
                                <th className="py-1 px-2 border-r border-slate-300">Heading</th>
                                <th className="py-1 px-2 border-r border-slate-300">Avg Press</th>
                                <th className="py-1 px-2 text-right">Wave</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-900">
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">10:00</td><td className="py-1 px-2 border-r border-slate-300">9.8 kts</td><td className="py-1 px-2 border-r border-slate-300">182° SSW</td><td className="py-1 px-2 border-r border-slate-300">{fleetMetrics.saviourAvgPress.toFixed(2)} MPa</td><td className="py-1 px-2 text-right font-bold">1.2 m</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">06:00</td><td className="py-1 px-2 border-r border-slate-300">9.7 kts</td><td className="py-1 px-2 border-r border-slate-300">181° SSW</td><td className="py-1 px-2 border-r border-slate-300">0.18 MPa</td><td className="py-1 px-2 text-right font-bold">1.1 m</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">02:00</td><td className="py-1 px-2 border-r border-slate-300">9.9 kts</td><td className="py-1 px-2 border-r border-slate-300">183° SSW</td><td className="py-1 px-2 border-r border-slate-300">0.17 MPa</td><td className="py-1 px-2 text-right font-bold">1.3 m</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">22:00</td><td className="py-1 px-2 border-r border-slate-300">9.8 kts</td><td className="py-1 px-2 border-r border-slate-300">182° SSW</td><td className="py-1 px-2 border-r border-slate-300">0.17 MPa</td><td className="py-1 px-2 text-right font-bold">1.2 m</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">18:00</td><td className="py-1 px-2 border-r border-slate-300">9.8 kts</td><td className="py-1 px-2 border-r border-slate-300">182° SSW</td><td className="py-1 px-2 border-r border-slate-300">0.18 MPa</td><td className="py-1 px-2 text-right font-bold">1.2 m</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">14:00</td><td className="py-1 px-2 border-r border-slate-300">9.6 kts</td><td className="py-1 px-2 border-r border-slate-300">180° SSW</td><td className="py-1 px-2 border-r border-slate-300">0.18 MPa</td><td className="py-1 px-2 text-right font-bold">1.0 m</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>PORT ARRIVAL & JETTY READINESS</span>
                          <span className="text-[10px] text-slate-600 font-mono">Nias Port Terminal</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">⚓ Nias Jetty-01 Mooring Clearance</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">CLEARED</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">🏗️ Demag AC500 Mobile Crane Pre-Check</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">READY</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">🚛 Prime Mover 4-Trailer Fleet Dispatched</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">STANDBY</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BLOCK 3: NIAS YARD & BAYS                                                 */}
              {/* ========================================================================= */}
              {activeModalBlock === 'BLOCK_3_NIAS_YARD' && (
                <div className="space-y-3.5">
                  {/* Top Status Banner */}
                  <div className="p-2.5 bg-white border border-slate-300 rounded-xs flex flex-wrap justify-between items-center gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-700 text-white text-[11px] font-bold rounded-xs">ACTIVE FEEDING</span>
                      <span className="text-slate-900 font-bold">Active Decanting Bay: <strong className="text-blue-950 font-black">Bay 01 ({fleetMetrics.activeFeedTankTag} / T-201)</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Total Onsite Safety Buffer: <strong className="text-emerald-700 font-black">{fleetMetrics.yardAutonomyDays.toFixed(2)} Days ({fleetMetrics.yardAutonomyHours.toFixed(1)} Hours)</strong>
                    </div>
                  </div>

                  {/* 2-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Left Column (50%): Active Bay & Yard Stock Parameters */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>1. ACTIVE DECANTING BAY 01 TELEMETRY</span>
                          <span className="text-[10px] text-slate-600 font-mono">T-201 Connected</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Connected Tank Tag:</span><span className="font-black text-slate-950">{fleetMetrics.activeFeedTankTag}</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Liquid Level:</span><span className="font-black text-slate-950">{fleetMetrics.activeFeedLevelPct.toFixed(1)}% ({fleetMetrics.activeBayRemainingNm3.toLocaleString()} Nm³ Usable)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Discharge Flow Rate:</span><span className="font-black text-slate-950">{totalGasFlowNm3h.toFixed(0)} Nm³/h</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Single Tank Autonomy:</span><span className="font-black text-slate-950">{fleetMetrics.activeTankAutonomyHours.toFixed(1)} Hours</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">Switchover Ready:</span><span className="font-black text-blue-950">Bay 02 (ISOT-012 Armed)</span></div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>2. LAYDOWN YARD INVENTORY & HYDRAULICS</span>
                          <span className="text-[10px] text-slate-600 font-mono">{fleetMetrics.niasTotalCount} Tanks Onsite</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Laden Ready Stock:</span><span className="font-black text-slate-950">{fleetMetrics.onsiteLadenCount} Tanks ({fleetMetrics.onsiteLadenGasNm3.toLocaleString()} Nm³)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Empty Staging Buffer:</span><span className="font-black text-slate-950">{fleetMetrics.onsiteEmptyCount} Tanks</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">72-Hour Min Threshold:</span><span className="font-black text-slate-950">10 Full Tanks</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Heating Water Circ:</span><span className="font-black text-slate-950">42.5 m³/h @ 28.5 °C</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">ESD Valve Status:</span><span className="font-black text-emerald-700">ESD-201 OPEN / 100% HEALTH</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (50%): 24-Hr Decanting Log & Safety Events */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>24-HR DECANTING HOURLY LOG</span>
                          <span className="text-[10px] text-slate-600 font-mono">Bay 01 Flow</span>
                        </div>
                        <div className="overflow-x-auto win-sunken border border-slate-200">
                          <table className="w-full text-left font-mono text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                                <th className="py-1 px-2 border-r border-slate-300">Time</th>
                                <th className="py-1 px-2 border-r border-slate-300">Tank</th>
                                <th className="py-1 px-2 border-r border-slate-300">Level</th>
                                <th className="py-1 px-2 border-r border-slate-300">Rate (Nm³/h)</th>
                                <th className="py-1 px-2 text-right">Press (Barg)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-900">
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">10:00</td><td className="py-1 px-2 border-r border-slate-300">ISOT-009</td><td className="py-1 px-2 border-r border-slate-300">49.0%</td><td className="py-1 px-2 border-r border-slate-300">4,505</td><td className="py-1 px-2 text-right font-bold">2.35</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 border-r border-slate-300">06:00</td><td className="py-1 px-2 border-r border-slate-300">ISOT-009</td><td className="py-1 px-2 border-r border-slate-300">54.0%</td><td className="py-1 px-2 border-r border-slate-300">4,498</td><td className="py-1 px-2 text-right font-bold">2.36</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 border-r border-slate-300">02:00</td><td className="py-1 px-2 border-r border-slate-300">ISOT-009</td><td className="py-1 px-2 border-r border-slate-300">59.0%</td><td className="py-1 px-2 border-r border-slate-300">4,510</td><td className="py-1 px-2 text-right font-bold">2.34</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 border-r border-slate-300">22:00</td><td className="py-1 px-2 border-r border-slate-300">ISOT-009</td><td className="py-1 px-2 border-r border-slate-300">65.0%</td><td className="py-1 px-2 border-r border-slate-300">4,502</td><td className="py-1 px-2 text-right font-bold">2.35</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">18:00</td><td className="py-1 px-2 border-r border-slate-300">ISOT-008</td><td className="py-1 px-2 border-r border-slate-300">04.2%</td><td className="py-1 px-2 border-r border-slate-300">4,505</td><td className="py-1 px-2 text-right font-bold">2.30</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">14:00</td><td className="py-1 px-2 border-r border-slate-300">ISOT-008</td><td className="py-1 px-2 border-r border-slate-300">18.5%</td><td className="py-1 px-2 border-r border-slate-300">4,500</td><td className="py-1 px-2 text-right font-bold">2.35</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>BAY SAFETY & INTERLOCK MONITOR</span>
                          <span className="text-[10px] text-slate-600 font-mono">SCADA SIS</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">⚡ Bay 01 Grounding Static Clamp</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">VERIFIED</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">🛡️ Decanting Skid Pressure PCV-201 Modulating</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">NORMAL</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">🔄 Auto-Switchover Bay 02 Arm Standby</span>
                            <span className="px-1.5 py-0.2 bg-blue-700 text-white font-bold rounded-xs text-[10px]">ARMED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BLOCK 4: REGAS & PRSS / GC                                                */}
              {/* ========================================================================= */}
              {activeModalBlock === 'BLOCK_4_REGAS_PRSS' && (
                <div className="space-y-3.5">
                  {/* Top Status Banner */}
                  <div className="p-2.5 bg-white border border-slate-300 rounded-xs flex flex-wrap justify-between items-center gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-700 text-white text-[11px] font-bold rounded-xs">DUAL METERING PASS</span>
                      <span className="text-slate-900 font-bold">PRSS Header: <strong className="text-blue-950 font-black">2.18 Barg / +24.5 °C</strong> (Flow: 4,505 Nm³/h)</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Dual Metering Delta: <strong className="text-emerald-700 font-black">-0.04% (Tol ≤ 0.25%)</strong>
                    </div>
                  </div>

                  {/* 2-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Left Column (50%): Vaporizer Skid & Gas Quality */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>1. VAPORIZER SKID & DUAL METERING</span>
                          <span className="text-[10px] text-slate-600 font-mono">FloBoss 107</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Active Vaporizers:</span><span className="font-black text-slate-950">3 / 4 Units (AAV-01, 02, 03)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Defrost Cycle Unit:</span><span className="font-black text-slate-950">AAV-04 (Auto 4h Thaw)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Metering Run A (Duty):</span><span className="font-black text-slate-950">14,820.5 MSCF</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Metering Run B (Check):</span><span className="font-black text-slate-950">14,815.2 MSCF</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">Dual Run Variance:</span><span className="font-black text-emerald-700">-0.04% (Audit Compliant)</span></div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>2. ONLINE CHROMATOGRAPHY (GC-01)</span>
                          <span className="text-[10px] text-slate-600 font-mono">C1-C6 Analysis</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Methane (CH4):</span><span className="font-black text-slate-950">{fleetMetrics.ch4Pct} mol%</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Gross Heating Value:</span><span className="font-black text-slate-950">{fleetMetrics.ghvBtu.toFixed(1)} BTU/SCF</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Wobbe Index:</span><span className="font-black text-slate-950">49.82 MJ/Nm³ (Ideal 47-52)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Moisture Dewpoint:</span><span className="font-black text-slate-950">-45.0 °C</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">Odorant Level (THT):</span><span className="font-black text-slate-950">18.5 mg/Nm³</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (50%): 24-Hr Custody Log & Audit Trail */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>24-HR CUSTODY DISPATCH LOG</span>
                          <span className="text-[10px] text-slate-600 font-mono">Hourly FloBoss</span>
                        </div>
                        <div className="overflow-x-auto win-sunken border border-slate-200">
                          <table className="w-full text-left font-mono text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                                <th className="py-1 px-2 border-r border-slate-300">Time</th>
                                <th className="py-1 px-2 border-r border-slate-300">Run A (MSCF)</th>
                                <th className="py-1 px-2 border-r border-slate-300">Run B (MSCF)</th>
                                <th className="py-1 px-2 border-r border-slate-300">Delta</th>
                                <th className="py-1 px-2 text-right">GHV</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-900">
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">10:00</td><td className="py-1 px-2 border-r border-slate-300">14,820.5</td><td className="py-1 px-2 border-r border-slate-300">14,815.2</td><td className="py-1 px-2 border-r border-slate-300 text-emerald-700 font-bold">-0.04%</td><td className="py-1 px-2 text-right font-bold">1,048.5</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">06:00</td><td className="py-1 px-2 border-r border-slate-300">12,350.2</td><td className="py-1 px-2 border-r border-slate-300">12,346.0</td><td className="py-1 px-2 border-r border-slate-300 text-emerald-700 font-bold">-0.03%</td><td className="py-1 px-2 text-right font-bold">1,048.4</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">02:00</td><td className="py-1 px-2 border-r border-slate-300">09,880.1</td><td className="py-1 px-2 border-r border-slate-300">09,876.5</td><td className="py-1 px-2 border-r border-slate-300 text-emerald-700 font-bold">-0.04%</td><td className="py-1 px-2 text-right font-bold">1,048.6</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">22:00</td><td className="py-1 px-2 border-r border-slate-300">07,410.0</td><td className="py-1 px-2 border-r border-slate-300">07,407.2</td><td className="py-1 px-2 border-r border-slate-300 text-emerald-700 font-bold">-0.04%</td><td className="py-1 px-2 text-right font-bold">1,048.5</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">18:00</td><td className="py-1 px-2 border-r border-slate-300">04,940.3</td><td className="py-1 px-2 border-r border-slate-300">04,938.1</td><td className="py-1 px-2 border-r border-slate-300 text-emerald-700 font-bold">-0.04%</td><td className="py-1 px-2 text-right font-bold">1,048.5</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">14:00</td><td className="py-1 px-2 border-r border-slate-300">02,470.1</td><td className="py-1 px-2 border-r border-slate-300">02,469.0</td><td className="py-1 px-2 border-r border-slate-300 text-emerald-700 font-bold">-0.04%</td><td className="py-1 px-2 text-right font-bold">1,048.5</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>METERING AUDIT & QUALITY CERTIFICATION</span>
                          <span className="text-[10px] text-slate-600 font-mono">FloBoss Status</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">📋 AGA-8 Gross Heat Rate Calculation Check</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">VERIFIED</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">🧪 GC-01 Carrier Gas (He 99.999%) Pressure</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">NORMAL</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">📑 Daily PLN Reconciliation Statement Sign-off</span>
                            <span className="px-1.5 py-0.2 bg-blue-700 text-white font-bold rounded-xs text-[10px]">AUDITED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BLOCK 5: NIAS (LAYDOWN 2 - EMPTY RETURN)                                  */}
              {/* ========================================================================= */}
              {(activeModalBlock === 'BLOCK_5_NIAS_LAYDOWN_2' || activeModalBlock === 'BLOCK_5_PLTMG_PLANT') && (
                <div className="space-y-3.5">
                  {/* Top Status Banner */}
                  <div className="p-2.5 bg-white border border-slate-300 rounded-xs flex flex-wrap justify-between items-center gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-700 text-white text-[11px] font-bold rounded-xs">EMPTY RETURN BUFFER</span>
                      <span className="text-slate-900 font-bold">Nias Laydown 2 Staging: <strong className="text-blue-950 font-black">ISOT-064 (Empty ISOTANK)</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Last Cycle Log: <strong className="text-slate-950">2026-08-26 16:30 WIB (Awaiting Backhaul to M/V Saviour)</strong>
                    </div>
                  </div>

                  {/* 2-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Left Column (50%): Laydown 2 Empty Staging Parameters */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>1. LAYDOWN 2 EMPTY STAGING METRICS</span>
                          <span className="text-[10px] text-slate-600 font-mono">ISOT-064 Active</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Empty Tanks:</span><span className="font-black text-slate-950">1 Tanks (ISOT-064)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Heel Retention:</span><span className="font-black text-slate-950">4.2% (1.0 m³ / 445 kg Heel)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Holding Pressure:</span><span className="font-black text-slate-950">0.21 MPa (2.1 bar)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Shell Temperature:</span><span className="font-black text-slate-950">-135.0 °C (Cold Vacuum)</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">Dispatch Status:</span><span className="font-black text-blue-950">Awaiting Backhaul to M/V Saviour</span></div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>2. HEEL RETENTION & BACKHAUL CLEARANCE</span>
                          <span className="text-[10px] text-slate-600 font-mono">BHM-202608-002</span>
                        </div>
                        <div className="space-y-1 text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Cold Heel Mass:</span><span className="font-black text-slate-950">445 kg (1.0 m³ Thermal Retention Verified)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Boil-off Rate:</span><span className="font-black text-emerald-700">&lt; 0.14%/day (Closed Containment)</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Safety Relief Valves:</span><span className="font-black text-slate-950">Dual PSV-01/02 Sealed Intact</span></div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-600 font-bold">Backhaul Manifest:</span><span className="font-black text-slate-950">BHM-202608-002 (Ready)</span></div>
                          <div className="flex justify-between"><span className="text-slate-600 font-bold">Vessel Allocation:</span><span className="font-black text-blue-950">M/V Saviour Next Return Cycle</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (50%): 24-Hr Empty Staging Log & Audit Events */}
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>24-HR EMPTY STAGING TELEMETRY LOG</span>
                          <span className="text-[10px] text-slate-600 font-mono">Laydown 2</span>
                        </div>
                        <div className="overflow-x-auto win-sunken border border-slate-200">
                          <table className="w-full text-left font-mono text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                                <th className="py-1 px-2 border-r border-slate-300">Time</th>
                                <th className="py-1 px-2 border-r border-slate-300">Tank</th>
                                <th className="py-1 px-2 border-r border-slate-300">Heel Level</th>
                                <th className="py-1 px-2 border-r border-slate-300">Press (MPa)</th>
                                <th className="py-1 px-2 text-right">Temp (°C)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-900">
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">10:00</td><td className="py-1 px-2 border-r border-slate-300 font-bold">ISOT-064</td><td className="py-1 px-2 border-r border-slate-300">4.2% (1.9 m³)</td><td className="py-1 px-2 border-r border-slate-300">0.21</td><td className="py-1 px-2 text-right font-bold">-135.0</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">06:00</td><td className="py-1 px-2 border-r border-slate-300 font-bold">ISOT-064</td><td className="py-1 px-2 border-r border-slate-300">4.2% (1.9 m³)</td><td className="py-1 px-2 border-r border-slate-300">0.21</td><td className="py-1 px-2 text-right font-bold">-135.1</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">02:00</td><td className="py-1 px-2 border-r border-slate-300 font-bold">ISOT-064</td><td className="py-1 px-2 border-r border-slate-300">4.2% (1.9 m³)</td><td className="py-1 px-2 border-r border-slate-300">0.20</td><td className="py-1 px-2 text-right font-bold">-135.2</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">22:00</td><td className="py-1 px-2 border-r border-slate-300 font-bold">ISOT-064</td><td className="py-1 px-2 border-r border-slate-300">4.2% (1.9 m³)</td><td className="py-1 px-2 border-r border-slate-300">0.20</td><td className="py-1 px-2 text-right font-bold">-135.4</td></tr>
                              <tr className="bg-white"><td className="py-1 px-2 font-bold border-r border-slate-300">18:00</td><td className="py-1 px-2 border-r border-slate-300 font-bold">ISOT-064</td><td className="py-1 px-2 border-r border-slate-300">4.2% (1.9 m³)</td><td className="py-1 px-2 border-r border-slate-300">0.20</td><td className="py-1 px-2 text-right font-bold">-135.5</td></tr>
                              <tr className="bg-slate-50"><td className="py-1 px-2 font-bold border-r border-slate-300">14:00</td><td className="py-1 px-2 border-r border-slate-300 font-bold">ISOT-064</td><td className="py-1 px-2 border-r border-slate-300">4.2% (1.9 m³)</td><td className="py-1 px-2 border-r border-slate-300">0.19</td><td className="py-1 px-2 text-right font-bold">-135.6</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-300 rounded-xs space-y-2">
                        <div className="font-sans font-black text-xs text-blue-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>SCADA EMPTY STAGING & AUDIT LOG</span>
                          <span className="text-[10px] text-slate-600 font-mono">Clearance</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">✅ ISOT-064 Post-Regas Heel Depressurization</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">VERIFIED</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">✅ Laydown 2 Grounding & Safety Barrier Check</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">NORMAL</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">✅ Backhaul Customs & Maritime Manifest Clearance</span>
                            <span className="px-1.5 py-0.2 bg-blue-700 text-white font-bold rounded-xs text-[10px]">AUDITED</span>
                          </div>
                          <div className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-800">✅ Outer Jacket Vacuum Integrity</span>
                            <span className="px-1.5 py-0.2 bg-emerald-700 text-white font-bold rounded-xs text-[10px]">IN-SPEC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-2.5 bg-slate-200 border-t border-slate-300 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalBlock(null)}
                className="win-btn px-4 py-1 text-xs font-bold cursor-pointer"
              >
                Close (ESC)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeModalBlock === 'BLOCK_1_ARUN') {
                    if (onNavigateSubTab) onNavigateSubTab('ARUN_LOADING_COQ');
                  } else if (activeModalBlock === 'BLOCK_4_REGAS_PRSS') {
                    if (onNavigateSubTab) onNavigateSubTab('NIAS_GC_GAS_QUALITY', 'REGAS_SYSTEM');
                  } else if (activeModalBlock === 'BLOCK_2_SAVIOUR') {
                    if (onNavigateSubTab) onNavigateSubTab('SAVIOUR_VOYAGE_MONITORING');
                  } else if (activeModalBlock === 'BLOCK_3_NIAS_YARD') {
                    if (onNavigateSubTab) onNavigateSubTab('NIAS_TANK_OVERVIEW', 'ISO_TANK_MGMT');
                  } else if (activeModalBlock === 'BLOCK_5_NIAS_LAYDOWN_2' || activeModalBlock === 'BLOCK_5_PLTMG_PLANT') {
                    if (onNavigateSubTab) onNavigateSubTab('NIAS_LAYDOWN_1_2_LOG', 'ISO_TANK_MGMT');
                  }
                  setActiveModalBlock(null);
                }}
                className="win-btn px-4 py-1 text-xs font-bold text-blue-950 flex items-center gap-1.5 cursor-pointer hover:bg-blue-50"
              >
                <span>{activeModalBlock === 'BLOCK_1_ARUN' ? 'Go to Arun Operations' : 'Inspect Sub-Tab Detailed Analytics'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
