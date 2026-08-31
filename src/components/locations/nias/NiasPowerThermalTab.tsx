'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Power,
  Flame,
  Fuel,
  Gauge,
  Thermometer,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Cpu,
  Layers,
  TrendingUp,
  Download,
  Info,
  Radio,
  Server,
  ZapOff,
  Table,
  Save,
  SlidersHorizontal,
  Edit3,
  Settings,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Container,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';
import { NodeState } from '@/types/lng';
import {
  PLTMG_MAN_ENGINE_SPEC,
  EngineSpecConfig,
  DEFAULT_ENGINE_SPEC_CONFIG,
  calcEngineGasFlowNm3h,
  calcAutonomyBufferHours,
} from '@/data/pltmgEngineSpec';

export interface GeneratorEngineState {
  id: number;
  name: string;
  tag: string;
  status: 'RUN' | 'STOP';
  fuelMode: 'GAS' | 'DIESEL';
  activePowerKw: number;       // kW (0 ~ MCR kW)
  gasPressInletBar: number;     // bar
  gasTempInletC: number;        // °C
  rpm: number;                  // RPM (500 RPM for MAN 7L 51/60 DF)
  exhaustTempC: number;         // °C
  frequencyHz: number;          // Hz
  voltageKv: number;            // kV
}

const STORAGE_KEY_PLTMG_LOGS = 'nias_pltmg_dispatch_logs_v1';
const STORAGE_KEY_SPEC_CONFIG = 'nias_man_engine_spec_config_v2';

const INITIAL_ENGINES: GeneratorEngineState[] = [
  {
    id: 1,
    name: 'Generator Engine 1',
    tag: 'GEN-01',
    status: 'RUN',
    fuelMode: 'GAS',
    activePowerKw: 5513, // 75% MCR Load Point
    gasPressInletBar: 2.18,
    gasTempInletC: 24.5,
    rpm: 500,
    exhaustTempC: 382,
    frequencyHz: 50.02,
    voltageKv: 11.0,
  },
  {
    id: 2,
    name: 'Generator Engine 2',
    tag: 'GEN-02',
    status: 'RUN',
    fuelMode: 'GAS',
    activePowerKw: 5513, // 75% MCR Load Point
    gasPressInletBar: 2.16,
    gasTempInletC: 24.2,
    rpm: 500,
    exhaustTempC: 379,
    frequencyHz: 50.01,
    voltageKv: 11.0,
  },
  {
    id: 3,
    name: 'Generator Engine 3',
    tag: 'GEN-03',
    status: 'RUN',
    fuelMode: 'GAS',
    activePowerKw: 5513, // 75% MCR Load Point
    gasPressInletBar: 2.20,
    gasTempInletC: 24.8,
    rpm: 500,
    exhaustTempC: 385,
    frequencyHz: 50.00,
    voltageKv: 11.0,
  },
  {
    id: 4,
    name: 'Generator Engine 4',
    tag: 'GEN-04',
    status: 'RUN',
    fuelMode: 'GAS',
    activePowerKw: 5513, // 75% MCR Load Point
    gasPressInletBar: 2.17,
    gasTempInletC: 24.4,
    rpm: 500,
    exhaustTempC: 381,
    frequencyHz: 50.02,
    voltageKv: 11.0,
  },
  {
    id: 5,
    name: 'Generator Engine 5',
    tag: 'GEN-05',
    status: 'STOP',
    fuelMode: 'DIESEL',
    activePowerKw: 0,
    gasPressInletBar: 0.00,
    gasTempInletC: 23.0,
    rpm: 0,
    exhaustTempC: 32,
    frequencyHz: 0.00,
    voltageKv: 0.0,
  },
];

export default function NiasPowerThermalTab() {
  const { fleetTanks, activeBays } = usePortalData();

  // MAN 7L 51/60 DF Dynamic Engine Spec Configuration State
  const [engineSpec, setEngineSpec] = useState<EngineSpecConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_SPEC_CONFIG);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.mcrKwPerUnit && parsed.heatRateKjKwh) {
            return {
              ...DEFAULT_ENGINE_SPEC_CONFIG,
              ...parsed,
              modelName: 'MAN 7L 51/60 DF', // Locked
            };
          }
        }
      } catch (e) {
        console.warn('Could not read saved MAN Engine Spec Config:', e);
      }
    }
    return DEFAULT_ENGINE_SPEC_CONFIG;
  });

  // Modal Editing Draft State
  const [isSpecModalOpen, setIsSpecModalOpen] = useState<boolean>(false);
  const [draftSpec, setDraftSpec] = useState<EngineSpecConfig>(engineSpec);

  // 5 Engines State
  const [engines, setEngines] = useState<GeneratorEngineState[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_PLTMG_LOGS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 5) return parsed;
        }
      } catch (e) {
        console.warn('Could not read saved PLTMG dispatch logs:', e);
      }
    }
    return INITIAL_ENGINES;
  });

  const [showSpecTable, setShowSpecTable] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // =========================================================================
  // Domain 1 Live Active Bay Feed Tank Subscription & Yard Telemetry
  // =========================================================================
  const activeDischargingTank = useMemo(() => {
    // Check fleetTanks mounted to bay or with position 'Bay'
    const bayTank = fleetTanks.find(
      (t) =>
        t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
        t.isMountedToBay ||
        t.position?.toLowerCase().includes('bay')
    );

    if (bayTank) {
      const levelPct = bayTank.level > 0 ? bayTank.level : 88.5;
      const remainingNm3 = Math.round(engineSpec.isoTankGasVolumeNm3 * (levelPct / 100));
      return {
        tankNo: bayTank.tankNo,
        serialNo: bayTank.serialNo || 'SIMU-8101426',
        levelPct,
        remainingNm3,
        bayName: bayTank.isMountedToBay || bayTank.position || 'Bay 01 (T-201)',
        isLive: true,
      };
    }

    // Fallback: Default nominal tank ISOT-009
    return {
      tankNo: 'ISOT-009',
      serialNo: 'SIMU-8101426',
      levelPct: 88.5,
      remainingNm3: Math.round(engineSpec.isoTankGasVolumeNm3 * 0.885),
      bayName: 'Bay 01 (T-201)',
      isLive: false,
    };
  }, [fleetTanks, engineSpec.isoTankGasVolumeNm3]);

  // Terminal Yard Ready Full Tanks Inventory (Domain 1 Sync)
  const yardInventorySummary = useMemo(() => {
    const candidateTanks = fleetTanks.filter(
      (t) =>
        (t.level || 0) > 20 ||
        t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
        t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
        t.location?.toLowerCase().includes('nias')
    );

    const fullCount = candidateTanks.length > 0 ? candidateTanks.length : 8;
    const totalRemainingNm3 =
      candidateTanks.length > 0
        ? Math.round(
            candidateTanks.reduce(
              (acc, t) => acc + engineSpec.isoTankGasVolumeNm3 * ((t.level || 88.5) / 100),
              0
            )
          )
        : Math.round(fullCount * engineSpec.isoTankGasVolumeNm3 * 0.885);

    return {
      fullCount,
      totalRemainingNm3,
    };
  }, [fleetTanks, engineSpec.isoTankGasVolumeNm3]);

  // Engine State Updates
  const toggleEngineStatus = (id: number) => {
    setEngines((prev) =>
      prev.map((eng) => {
        if (eng.id !== id) return eng;
        const newStatus = eng.status === 'RUN' ? 'STOP' : 'RUN';
        const defaultNominalKw = Math.round(engineSpec.mcrKwPerUnit * 0.75); // 75% load
        return {
          ...eng,
          status: newStatus,
          activePowerKw: newStatus === 'RUN' ? defaultNominalKw : 0,
          rpm: newStatus === 'RUN' ? 500 : 0,
          frequencyHz: newStatus === 'RUN' ? 50.0 : 0.0,
          voltageKv: newStatus === 'RUN' ? 11.0 : 0.0,
          gasPressInletBar: newStatus === 'RUN' ? (eng.fuelMode === 'GAS' ? 2.18 : 0.0) : 0.0,
          exhaustTempC: newStatus === 'RUN' ? 380 : 32,
        };
      })
    );
  };

  const setEngineFuelMode = (id: number, mode: 'GAS' | 'DIESEL') => {
    setEngines((prev) =>
      prev.map((eng) => {
        if (eng.id !== id) return eng;
        return {
          ...eng,
          fuelMode: mode,
          gasPressInletBar: mode === 'GAS' && eng.status === 'RUN' ? 2.18 : 0.0,
        };
      })
    );
  };

  const updateEngineField = (id: number, field: keyof GeneratorEngineState, val: number) => {
    setEngines((prev) =>
      prev.map((eng) => {
        if (eng.id !== id) return eng;
        return { ...eng, [field]: val };
      })
    );
  };

  // Save current dispatch configuration to localStorage
  const handleSaveDispatchLog = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_PLTMG_LOGS, JSON.stringify(engines));
    }
    const timestamp = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta' });
    setToastMessage(`✓ PLTMG Generator Dispatch Log saved & synchronized successfully (${timestamp} WIB)!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Engine Spec Configuration from Modal
  const handleSaveEngineSpec = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDraft: EngineSpecConfig = {
      ...draftSpec,
      modelName: 'MAN 7L 51/60 DF', // Strictly Locked
    };
    setEngineSpec(cleanDraft);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_SPEC_CONFIG, JSON.stringify(cleanDraft));
    }
    setIsSpecModalOpen(false);
    setToastMessage(`✓ MAN 7L 51/60 DF Specification saved (MCR: ${cleanDraft.mcrKwPerUnit} kW, NCR: ${cleanDraft.ncrKwPerUnit} kW)!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculations for Gas / Diesel / Total Power & Dynamic MAN Spec Equations
  const summary = useMemo(() => {
    let gasKw = 0;
    let dieselKw = 0;
    let runningCount = 0;
    let totalGasFlowNm3h = 0;

    engines.forEach((eng) => {
      if (eng.status === 'RUN') {
        runningCount++;
        if (eng.fuelMode === 'GAS') {
          gasKw += eng.activePowerKw;
          // Gas Consumption Formula: (Power (kW) * heatRateKjKwh) / referenceLhvKjNm3
          totalGasFlowNm3h += calcEngineGasFlowNm3h(
            eng.activePowerKw,
            engineSpec.heatRateKjKwh,
            engineSpec.referenceLhvKjNm3
          );
        } else {
          dieselKw += eng.activePowerKw;
        }
      }
    });

    const totalKw = gasKw + dieselKw;
    const totalMw = totalKw / 1000;
    const gasMw = gasKw / 1000;
    const dieselMw = dieselKw / 1000;
    const totalPlantMcrMw = (engineSpec.mcrKwPerUnit * 5) / 1000;
    const totalPlantNcrMw = (engineSpec.ncrKwPerUnit * 5) / 1000;
    const loadFactorPct = (totalKw / (engineSpec.mcrKwPerUnit * 5)) * 100;

    // Specific Fuel Consumption (SFC) = Total Gas Flow / Gas kW
    const sfcNm3Kwh = gasKw > 0 ? totalGasFlowNm3h / gasKw : engineSpec.heatRateKjKwh / engineSpec.referenceLhvKjNm3;
    // Thermal Efficiency = 3600 / HeatRate (kJ/kWh)
    const thermalEfficiencyPct = (3600 / engineSpec.heatRateKjKwh) * 100;
    const heatRateBtuKwh = engineSpec.heatRateKjKwh * 0.947817; // kJ to BTU

    // 1. Active Discharging Tank Autonomy (Hours)
    const activeTankAutonomyHours =
      totalGasFlowNm3h > 0 ? activeDischargingTank.remainingNm3 / totalGasFlowNm3h : 999.0;

    // 2. Total Site Yard Autonomy (Hours)
    const yardTotalAutonomyHours =
      totalGasFlowNm3h > 0 ? yardInventorySummary.totalRemainingNm3 / totalGasFlowNm3h : 999.0;

    // MMBTU and Mass equivalents
    const deliveredMscfd = (totalGasFlowNm3h * 24 * 35.3147) / 1000;
    const deliveredMmbtuDay = (deliveredMscfd * 1048.5) / 1000;
    const deliveredMassTonneDay = totalGasFlowNm3h > 0 ? (totalGasFlowNm3h * 24 * 0.74) / 1000 : 0;

    return {
      gasKw,
      gasMw,
      dieselKw,
      dieselMw,
      totalKw,
      totalMw,
      totalPlantMcrMw,
      totalPlantNcrMw,
      loadFactorPct,
      runningCount,
      totalGasFlowNm3h,
      sfcNm3Kwh,
      heatRateBtuKwh,
      thermalEfficiencyPct,
      activeTankAutonomyHours,
      yardTotalAutonomyHours,
      deliveredMmbtuDay,
      deliveredMassTonneDay,
    };
  }, [engines, activeDischargingTank, yardInventorySummary, engineSpec]);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-150 font-sans pb-10">
      {/* 1. Top Experion DCS Command Banner (Classic Slate Header) */}
      <div className="bg-[#334155] text-white border-2 border-slate-600 rounded-none p-3 sm:py-2.5 sm:px-4 shadow-2xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white font-mono uppercase tracking-wide">
            PLTMG MONITOR
          </h3>
          <span className="inline-flex items-center text-xs font-mono bg-[#1e293b] text-emerald-300 px-2 py-0.5 border border-slate-500 shadow-2xs font-bold">
            Active Tank: <strong>{activeDischargingTank.tankNo}</strong> ({activeDischargingTank.levelPct.toFixed(1)}%)
          </span>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center font-mono text-xs">
          {/* Spec Settings Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              setDraftSpec({ ...engineSpec });
              setIsSpecModalOpen(true);
            }}
            className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-slate-300 active:bg-slate-400 text-slate-900 border border-slate-400 shadow-xs font-bold rounded cursor-pointer transition-colors"
          >
            <span>MAN Spec Settings</span>
          </button>

          {/* Reference Table Button */}
          <button
            type="button"
            onClick={() => setShowSpecTable(!showSpecTable)}
            className={`px-3 py-1.5 border font-bold rounded shadow-xs cursor-pointer transition-colors ${
              showSpecTable
                ? 'bg-[#0284c7] text-white border-[#0369a1]'
                : 'bg-[#e2e8f0] hover:bg-slate-300 active:bg-slate-400 text-slate-900 border-slate-400'
            }`}
          >
            <span>{showSpecTable ? 'Hide Spec Table' : 'MAN 7L Spec Table'}</span>
          </button>

          {/* Save Dispatch Log Button */}
          <button
            type="button"
            onClick={handleSaveDispatchLog}
            className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white border border-[#047857] shadow-xs font-black rounded cursor-pointer transition-colors"
          >
            <span>Save Dispatch Log</span>
          </button>

          {/* Reset Engines Button */}
          <button
            type="button"
            onClick={() => setEngines(INITIAL_ENGINES)}
            title="Reset 5 Engines to Nominal Values"
            className="px-2.5 py-1.5 bg-[#e2e8f0] hover:bg-slate-300 active:bg-slate-400 text-slate-900 border border-slate-400 shadow-xs font-bold rounded cursor-pointer transition-colors"
          >
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {toastMessage && (
        <div className="p-2.5 bg-emerald-100 border-2 border-emerald-600 text-emerald-950 text-xs font-mono font-bold text-center shadow-xs">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Top Summary: 4 Unified Consolidated KPI Cards (Classic SCADA Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: TOTAL GENERATION & LOAD */}
        <div className="bg-white border-2 border-slate-600 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider flex justify-between items-center">
            <span className="flex-1 text-center">TOTAL GENERATION &amp; LOAD</span>
            <span className="bg-[#1e293b] text-amber-300 px-1.5 py-0.2 border border-slate-500 text-[9px] font-bold">
              {summary.runningCount}/5 RUN
            </span>
          </div>
          <div className="p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block text-center">
              {summary.totalMw.toFixed(2)} <span className="text-xs font-bold text-slate-500">MW</span>
            </span>
            <span className="text-[11px] text-slate-600 font-bold mt-1 text-center">
              {summary.totalKw.toLocaleString()} kW ({summary.loadFactorPct.toFixed(1)}% of {summary.totalPlantMcrMw.toFixed(2)} MW)
            </span>
          </div>
        </div>

        {/* Card 2: FUEL POWER USAGE SHARE */}
        <div className="bg-white border-2 border-slate-600 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            FUEL POWER USAGE SHARE
          </div>
          <div className="p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 block text-center">
              {summary.totalKw > 0 ? ((summary.gasKw / summary.totalKw) * 100).toFixed(1) : '0.0'}% <span className="text-xs font-bold text-slate-500">Gas</span>
            </span>
            <span className="text-[11px] text-slate-600 font-bold mt-1 text-center">
              {summary.gasMw.toFixed(2)} MW Gas / {summary.dieselMw.toFixed(2)} MW Diesel
            </span>
          </div>
        </div>

        {/* Card 3: GAS DEMAND & CONSUMPTION */}
        <div className="bg-white border-2 border-slate-600 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            GAS DEMAND &amp; CONSUMPTION
          </div>
          <div className="p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block text-center">
              {summary.totalGasFlowNm3h.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xs font-bold text-slate-500">Nm³/h</span>
            </span>
            <span className="text-[11px] text-slate-600 font-bold mt-1 text-center">
              {summary.deliveredMmbtuDay.toLocaleString(undefined, { maximumFractionDigits: 1 })} MMBtu/d | {summary.deliveredMassTonneDay.toFixed(2)} T/d
            </span>
          </div>
        </div>

        {/* Card 4: AUTONOMY BUFFER (TANK & YARD) */}
        <div className="bg-white border-2 border-slate-600 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            AUTONOMY BUFFER (TANK &amp; YARD)
          </div>
          <div className="p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-cyan-800 block text-center">
              {summary.activeTankAutonomyHours.toFixed(1)} <span className="text-xs font-bold text-slate-500">Hours ({activeDischargingTank.tankNo})</span>
            </span>
            <span className="text-[11px] text-slate-600 font-bold mt-1 text-center">
              Yard Total: {summary.yardTotalAutonomyHours.toFixed(1)} Hours ({yardInventorySummary.fullCount} Tanks)
            </span>
          </div>
        </div>
      </div>

      {/* Optional: Official Reference Load Curve Table */}
      {showSpecTable && (
        <div className="bg-white border-2 border-slate-600 rounded-none p-3.5 shadow-2xs font-mono text-xs space-y-2.5">
          <div className="flex justify-between items-center border-b border-slate-300 pb-2">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
              MAN 7L 51/60 DF Engine Load &amp; Autonomy Reference Table
            </h4>
            <span className="text-[11px] text-slate-600 font-bold">
              MCR {engineSpec.mcrKwPerUnit.toLocaleString()} kW | Heat Rate {engineSpec.heatRateKjKwh.toLocaleString()} kJ/kWh
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-400">
            <table className="w-full text-xs text-center border-collapse font-mono">
              <thead>
                <tr className="bg-[#cbd5e1] text-slate-900 border-b border-slate-500 text-[10px] uppercase font-black">
                  <th className="px-2 py-1.5 border-r border-slate-400 text-center">Load (% MCR)</th>
                  <th className="px-2 py-1.5 border-r border-slate-400 text-center">Output (kW)</th>
                  <th className="px-2 py-1.5 border-r border-slate-400 text-center">Heat Rate (kJ/kWh)</th>
                  <th className="px-2 py-1.5 border-r border-slate-400 text-center">Gas Flow (Nm³/h)</th>
                  <th className="px-2 py-1.5 border-r border-slate-400 text-center">SFC (Nm³/kWh)</th>
                  <th className="px-2 py-1.5 border-r border-slate-400 text-center">Active Tank ({activeDischargingTank.tankNo})</th>
                  <th className="px-2 py-1.5 text-center">Yard ({yardInventorySummary.fullCount} Tanks)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-900">
                {[
                  { pct: 25, label: '25% (Min Load)' },
                  { pct: 50, label: '50% (Part Load)' },
                  { pct: 75, label: '75% (Base Load)' },
                  { pct: 90, label: '90% (NCR Rating)' },
                  { pct: 100, label: '100% (MCR)' },
                ].map((item) => {
                  const kw = Math.round((engineSpec.mcrKwPerUnit * item.pct) / 100);
                  const flow = calcEngineGasFlowNm3h(kw, engineSpec.heatRateKjKwh, engineSpec.referenceLhvKjNm3);
                  const sfc = kw > 0 ? flow / kw : 0;
                  const tActive = flow > 0 ? activeDischargingTank.remainingNm3 / flow : 999;
                  const tYard = flow > 0 ? yardInventorySummary.totalRemainingNm3 / flow : 999;
                  return (
                    <tr key={item.pct} className="hover:bg-slate-100">
                      <td className="px-2 py-1 border-r border-slate-300 font-bold text-center">{item.label}</td>
                      <td className="px-2 py-1 border-r border-slate-300 font-bold text-center">{kw.toLocaleString()} kW</td>
                      <td className="px-2 py-1 border-r border-slate-300 text-center">{engineSpec.heatRateKjKwh.toLocaleString()}</td>
                      <td className="px-2 py-1 border-r border-slate-300 font-bold text-center">{flow.toFixed(1)}</td>
                      <td className="px-2 py-1 border-r border-slate-300 text-center">{sfc.toFixed(4)}</td>
                      <td className="px-2 py-1 border-r border-slate-300 font-bold text-center">{tActive.toFixed(1)} h</td>
                      <td className="px-2 py-1 text-center font-bold">{tYard.toFixed(1)} h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. 5-Engine Grid Cards (Generator Engine 1 ~ 5) */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase font-mono tracking-wide">
            Generator Engine Skid Units (MAN 7L 51/60 DF 1 ~ 5)
          </h4>
          <span className="text-xs font-mono text-slate-600 font-bold">
            Total Rated Plant: {summary.totalPlantMcrMw.toFixed(2)} MW
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {engines.map((eng) => {
            const isRunning = eng.status === 'RUN';
            const isGas = eng.fuelMode === 'GAS';
            const engineLoadPct = (eng.activePowerKw / engineSpec.mcrKwPerUnit) * 100;
            const engineGasFlow = isRunning && isGas
              ? calcEngineGasFlowNm3h(eng.activePowerKw, engineSpec.heatRateKjKwh, engineSpec.referenceLhvKjNm3)
              : 0;

            return (
              <div
                key={eng.id}
                className="bg-white border-2 border-slate-600 rounded-none shadow-2xs flex flex-col justify-between overflow-hidden"
              >
                {/* Engine Card Header Strip */}
                <div className="bg-[#334155] text-white p-2.5 border-b-2 border-slate-600 font-mono space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h5 className="font-black text-xs text-white uppercase tracking-wide">
                      {eng.name.toUpperCase()} (GEN-{eng.id})
                    </h5>

                    {/* Run / Stop Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleEngineStatus(eng.id)}
                      className={`px-2 py-0.5 text-[10px] font-mono font-black border rounded cursor-pointer transition-colors ${
                        isRunning
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-slate-300 text-slate-800 border-slate-400 hover:bg-slate-400'
                      }`}
                    >
                      <span>{eng.status}</span>
                    </button>
                  </div>

                  {/* Centered Engine Spec without Parentheses */}
                  <div className="text-[9.5px] text-slate-300 font-bold text-center border-t border-slate-500/60 pt-1">
                    MAN 7L 51/60 DF - MCR {engineSpec.mcrKwPerUnit.toLocaleString()} kW | NCR {engineSpec.ncrKwPerUnit.toLocaleString()} kW
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-2.5 font-mono text-xs flex-1 flex flex-col justify-between">
                  {/* Fuel Mode Selector (Gas vs Diesel) */}
                  <div className="bg-[#cbd5e1] p-0.5 rounded border border-slate-400 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setEngineFuelMode(eng.id, 'GAS')}
                      className={`flex-1 py-1 font-bold text-center rounded transition-colors cursor-pointer ${
                        isGas
                          ? 'bg-[#047857] text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      <span>GAS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEngineFuelMode(eng.id, 'DIESEL')}
                      className={`flex-1 py-1 font-bold text-center rounded transition-colors cursor-pointer ${
                        !isGas
                          ? 'bg-[#b45309] text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      <span>DIESEL</span>
                    </button>
                  </div>

                  {/* Main Active Power Display & Load % */}
                  <div className="p-2.5 bg-[#f8fafc] border border-slate-400 rounded-none text-center">
                    <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">
                      Active Output (kW)
                    </span>
                    <input
                      type="number"
                      step="10"
                      disabled={!isRunning}
                      value={eng.activePowerKw === 0 ? '' : eng.activePowerKw}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateEngineField(eng.id, 'activePowerKw', val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      className="w-full bg-white text-slate-900 font-black text-base px-2 py-1 rounded border border-slate-400 text-center focus:outline-none focus:border-amber-600 disabled:opacity-40"
                    />
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mt-1.5 px-0.5">
                      <span>{engineLoadPct.toFixed(1)}% Load</span>
                      <span>{isRunning && isGas ? `${engineGasFlow.toFixed(1)} Nm³/h` : '-'}</span>
                    </div>
                  </div>

                  {/* Gas Inlet Parameters (Pressure & Temperature) */}
                  <div className="space-y-1.5 text-xs">
                    {/* Gas Press Inlet */}
                    <div className="p-1.5 bg-[#f1f5f9] border border-slate-300 rounded flex justify-between items-center">
                      <span className="text-[10px] text-slate-700 font-bold">Press (bar):</span>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!isRunning || !isGas}
                        value={eng.gasPressInletBar === 0 ? '' : eng.gasPressInletBar}
                        placeholder="0.00"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateEngineField(eng.id, 'gasPressInletBar', val === '' ? 0 : parseFloat(val) || 0);
                        }}
                        className="w-18 bg-white text-slate-900 font-bold px-1 py-0.5 rounded border border-slate-400 text-center text-xs focus:outline-none focus:border-cyan-600 disabled:opacity-40"
                      />
                    </div>

                    {/* Gas Temp Inlet */}
                    <div className="p-1.5 bg-[#f1f5f9] border border-slate-300 rounded flex justify-between items-center">
                      <span className="text-[10px] text-slate-700 font-bold">Temp (°C):</span>
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isRunning || !isGas}
                        value={eng.gasTempInletC === 0 ? '' : eng.gasTempInletC}
                        placeholder="0.0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateEngineField(eng.id, 'gasTempInletC', val === '' ? 0 : parseFloat(val) || 0);
                        }}
                        className="w-18 bg-white text-slate-900 font-bold px-1 py-0.5 rounded border border-slate-400 text-center text-xs focus:outline-none focus:border-emerald-600 disabled:opacity-40"
                      />
                    </div>
                  </div>

                  {/* Engine Operating Telemetry Sub-panel */}
                  <div className="p-2 bg-[#e2e8f0] border border-slate-300 rounded text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rated Speed:</span>
                      <span className="text-slate-900 font-bold">{eng.rpm} RPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Exhaust Temp:</span>
                      <span className="text-slate-900 font-bold">{eng.exhaustTempC} °C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Frequency:</span>
                      <span className="text-slate-900 font-bold">{eng.frequencyHz.toFixed(2)} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Voltage:</span>
                      <span className="text-slate-900 font-bold">{eng.voltageKv.toFixed(1)} kV</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* ========================================================================= */}
      {/* MAN 7L 51/60 DF Dedicated Specification Configuration Modal               */}
      {/* ========================================================================= */}
      {isSpecModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-700 rounded-none max-w-3xl w-full p-6 shadow-2xs font-mono text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-600 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                MAN 7L 51/60 DF Engine Specification Settings
              </h3>
              <button
                type="button"
                onClick={() => setIsSpecModalOpen(false)}
                className="text-slate-600 hover:text-slate-950 font-black text-sm px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Fields */}
            <form onSubmit={handleSaveEngineSpec} className="space-y-4 font-mono">
              {/* Row 1: MCR and NCR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field 1: Unit MCR Power (kW) */}
                <div className="p-3 bg-[#f8fafc] border border-slate-400 space-y-1.5 text-center">
                  <label className="text-[11px] font-bold text-slate-700 uppercase block">
                    Unit MCR Rated Power (kW)
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={draftSpec.mcrKwPerUnit === 0 ? '' : draftSpec.mcrKwPerUnit}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newMcr = val === '' ? 0 : parseFloat(val) || 0;
                      setDraftSpec({
                        ...draftSpec,
                        mcrKwPerUnit: newMcr,
                        ncrKwPerUnit: Math.round(newMcr * 0.9),
                      });
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-slate-400 text-slate-900 text-center text-lg font-black rounded focus:outline-none focus:border-amber-600"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    5 Units Plant: {((draftSpec.mcrKwPerUnit * 5) / 1000).toFixed(2)} MW
                  </span>
                </div>

                {/* Field 2: Unit NCR Power (kW) */}
                <div className="p-3 bg-[#f8fafc] border border-slate-400 space-y-1.5 text-center">
                  <label className="text-[11px] font-bold text-slate-700 uppercase block">
                    Unit NCR Rating (kW)
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={draftSpec.ncrKwPerUnit === 0 ? '' : draftSpec.ncrKwPerUnit}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftSpec({ ...draftSpec, ncrKwPerUnit: val === '' ? 0 : parseFloat(val) || 0 });
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-slate-400 text-slate-900 text-center text-lg font-black rounded focus:outline-none focus:border-amber-600"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    {draftSpec.mcrKwPerUnit > 0 ? ((draftSpec.ncrKwPerUnit / draftSpec.mcrKwPerUnit) * 100).toFixed(1) : 90}% of MCR
                  </span>
                </div>
              </div>

              {/* Row 2: Heat Rate & Gas LHV */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field 3: Heat Rate */}
                <div className="p-3 bg-[#f8fafc] border border-slate-400 space-y-1.5 text-center">
                  <label className="text-[11px] font-bold text-slate-700 uppercase block">
                    Heat Rate (kJ/kWh)
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={draftSpec.heatRateKjKwh === 0 ? '' : draftSpec.heatRateKjKwh}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftSpec({ ...draftSpec, heatRateKjKwh: val === '' ? 0 : parseFloat(val) || 0 });
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-slate-400 text-slate-900 text-center text-lg font-black rounded focus:outline-none focus:border-cyan-600"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Thermal Efficiency: {draftSpec.heatRateKjKwh > 0 ? ((3600 / draftSpec.heatRateKjKwh) * 100).toFixed(2) : 0}%
                  </span>
                </div>

                {/* Field 4: Gas LHV */}
                <div className="p-3 bg-[#f8fafc] border border-slate-400 space-y-1.5 text-center">
                  <label className="text-[11px] font-bold text-slate-700 uppercase block">
                    Design Fuel Gas LHV (kJ/Nm³)
                  </label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={draftSpec.referenceLhvKjNm3 === 0 ? '' : draftSpec.referenceLhvKjNm3}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftSpec({ ...draftSpec, referenceLhvKjNm3: val === '' ? 0 : parseFloat(val) || 0 });
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-slate-400 text-slate-900 text-center text-lg font-black rounded focus:outline-none focus:border-amber-600"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    ≈ {(draftSpec.referenceLhvKjNm3 * 0.037446).toFixed(1)} BTU/SCF
                  </span>
                </div>
              </div>

              {/* Row 3: Nominal ISO Tank Volume */}
              <div className="p-3 bg-[#f8fafc] border border-slate-400 space-y-1.5 text-center">
                <label className="text-[11px] font-bold text-slate-700 uppercase block">
                  Nominal ISO Tank Usable Gas Volume (Nm³/tank)
                </label>
                <input
                  type="number"
                  step="10"
                  required
                  value={draftSpec.isoTankGasVolumeNm3 === 0 ? '' : draftSpec.isoTankGasVolumeNm3}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraftSpec({ ...draftSpec, isoTankGasVolumeNm3: val === '' ? 0 : parseFloat(val) || 0 });
                  }}
                  className="w-full py-1.5 px-2 bg-white border border-slate-400 text-slate-900 text-center text-lg font-black rounded focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Modal Action Buttons Bar */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                <button
                  type="button"
                  onClick={() => setDraftSpec(DEFAULT_ENGINE_SPEC_CONFIG)}
                  className="px-4 py-2 bg-[#e2e8f0] hover:bg-slate-300 text-slate-900 font-bold rounded border border-slate-400 cursor-pointer transition-colors"
                >
                  Restore MAN Defaults
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSpecModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-black rounded border border-[#047857] cursor-pointer transition-colors shadow-xs"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
