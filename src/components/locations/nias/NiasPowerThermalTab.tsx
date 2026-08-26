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
    <div className="w-full space-y-5 animate-in fade-in duration-200 text-white font-bold font-sans">
      {/* 1. Top Experion DCS Command Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-white font-bold border border-amber-500/30">
              <Zap className="w-3.5 h-3.5" />
              PLTMG GUNUNGSITOLI (5 × {(engineSpec.mcrKwPerUnit / 1000).toFixed(2)} MW = {summary.totalPlantMcrMw.toFixed(2)} MW)
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-white font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-white font-bold" />
              MAN 7L 51/60 DF (MCR {engineSpec.mcrKwPerUnit.toLocaleString()} kW | NCR {engineSpec.ncrKwPerUnit.toLocaleString()} kW)
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded border bg-slate-950 text-white font-bold border-emerald-500/30 font-bold">
              <Edit3 className="w-3.5 h-3.5 text-white font-bold" />
              Daily Operational Entry Mode
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white font-bold flex items-center gap-2 mt-2">
            <Cpu className="w-4 h-4 text-white font-bold" />
            MAN 7L 51/60 DF 5-Engine Generator Dispatch & Thermal Efficiency Log
          </h3>
          <p className="text-xs text-white font-bold mt-0.5">
            Live Feed: Active Discharging Tank <strong className="text-white font-bold">{activeDischargingTank.tankNo}</strong> ({activeDischargingTank.levelPct.toFixed(1)}% / {activeDischargingTank.remainingNm3.toLocaleString()} Nm³) | Yard Inventory: {yardInventorySummary.fullCount} Full Tanks ({(yardInventorySummary.totalRemainingNm3 / 1000).toFixed(1)}k Nm³).
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
          {/* Spec Settings Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              setDraftSpec({ ...engineSpec });
              setIsSpecModalOpen(true);
            }}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-amber-400 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-white font-bold" />
            <span>⚙️ MAN Spec Settings</span>
          </button>

          {/* Reference Table Button */}
          <button
            type="button"
            onClick={() => setShowSpecTable(!showSpecTable)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors ${
              showSpecTable
                ? 'bg-cyan-600/30 text-white font-bold border-cyan-500/50 shadow-sm'
                : 'bg-slate-950 hover:bg-slate-800 text-white font-bold border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-white font-bold" />
            <span>{showSpecTable ? 'Hide Spec Table' : '📊 MAN 7L Spec Table'}</span>
          </button>

          {/* Save Dispatch Log Button */}
          <button
            type="button"
            onClick={handleSaveDispatchLog}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Dispatch Log</span>
          </button>

          {/* Reset Engines Button */}
          <button
            type="button"
            onClick={() => setEngines(INITIAL_ENGINES)}
            title="Reset 5 Engines to Default Nominal Values"
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-white font-bold hover:text-white font-bold" />
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs font-mono text-white font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-white font-bold shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Top Summary KPI Cards (Power Usage Summary) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Combined Output */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/40 shadow-lg font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
                Total Combined Output
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-white font-bold border border-amber-500/30">
                {summary.runningCount}/5 RUN
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-bold">
                {summary.totalMw.toFixed(2)}
              </span>
              <span className="text-xs text-white font-bold font-bold">MW</span>
              <span className="text-xs text-white font-bold">({summary.totalKw.toLocaleString()} kW)</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
            <span className="text-white font-bold">Plant Load Factor:</span>
            <span className="text-white font-bold font-bold">
              {summary.loadFactorPct.toFixed(1)}% of {summary.totalPlantMcrMw.toFixed(2)} MW MCR
            </span>
          </div>
        </div>

        {/* Card 2: Power Usage by Gas */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-lg font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
                Power Usage by Gas (LNG)
              </span>
              <Flame className="w-4 h-4 text-white font-bold" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-bold">
                {summary.gasMw.toFixed(2)}
              </span>
              <span className="text-xs text-white font-bold font-bold">MW</span>
              <span className="text-xs text-white font-bold">({summary.gasKw.toLocaleString()} kW)</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
            <span className="text-white font-bold">Gas Dispatch Share:</span>
            <span className="text-white font-bold font-bold">
              {summary.totalKw > 0 ? ((summary.gasKw / summary.totalKw) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        {/* Card 3: Power Usage by Diesel */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
                Power Usage by Diesel (HSD)
              </span>
              <Fuel className="w-4 h-4 text-white font-bold" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-bold">
                {summary.dieselMw.toFixed(2)}
              </span>
              <span className="text-xs text-white font-bold font-bold">MW</span>
              <span className="text-xs text-white font-bold">({summary.dieselKw.toLocaleString()} kW)</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
            <span className="text-white font-bold">Diesel Backup Share:</span>
            <span className="text-white font-bold font-bold">
              {summary.totalKw > 0 ? ((summary.dieselKw / summary.totalKw) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        {/* Card 4: Specific Fuel Consumption & 2-Tier Autonomy Buffer */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/30 shadow-lg font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-white font-bold font-bold uppercase tracking-wider block">
                SFC & Autonomy Buffer
              </span>
              <TrendingUp className="w-4 h-4 text-white font-bold" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-bold">
                {summary.activeTankAutonomyHours.toFixed(1)}
              </span>
              <span className="text-xs text-white font-bold font-bold">Hours</span>
              <span className="text-[10px] text-white font-bold font-bold bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40">
                {activeDischargingTank.tankNo}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
            <span className="text-white font-bold">Total Yard ({yardInventorySummary.fullCount} Tanks):</span>
            <span className="text-white font-bold font-bold">
              {summary.yardTotalAutonomyHours.toFixed(1)} Hours
            </span>
          </div>
        </div>
      </div>

      {/* Optional: Official Reference Load Curve Table */}
      {showSpecTable && (
        <div className="p-4 sm:p-5 bg-slate-950/90 rounded-2xl border border-cyan-500/30 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 font-mono text-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-white font-bold" />
              <h4 className="font-bold text-white font-bold text-sm">
                Official MAN 7L 51/60 DF Engine Load & Autonomy Reference Table
              </h4>
            </div>
            <span className="text-[11px] text-white font-bold">
              MCR {engineSpec.mcrKwPerUnit.toLocaleString()} kW | NCR {engineSpec.ncrKwPerUnit.toLocaleString()} kW | Heat Rate {engineSpec.heatRateKjKwh.toLocaleString()} kJ/kWh | Gas LHV {engineSpec.referenceLhvKjNm3.toLocaleString()} kJ/Nm³ | Active Tank: {activeDischargingTank.tankNo} ({activeDischargingTank.remainingNm3.toLocaleString()} Nm³)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 text-[10px] uppercase font-bold text-center">
                  <th className="px-3 py-2 text-left">Load (% MCR)</th>
                  <th className="px-3 py-2 text-right text-white font-bold">Output (kW)</th>
                  <th className="px-3 py-2 text-right">Heat Rate (kJ/kWh)</th>
                  <th className="px-3 py-2 text-right text-white font-bold font-bold">Gas Flow (Nm³/h)</th>
                  <th className="px-3 py-2 text-right">SFC (Nm³/kWh)</th>
                  <th className="px-3 py-2 text-right text-white font-bold">Active Tank ({activeDischargingTank.tankNo})</th>
                  <th className="px-3 py-2 text-right text-white font-bold font-bold">{yardInventorySummary.fullCount} Yard Tanks Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-white font-bold">
                {[
                  { pct: 25, label: '25% (Min Load)' },
                  { pct: 50, label: '50% (Part Load)' },
                  { pct: 75, label: '75% (Base Load)' },
                  { pct: 90, label: '90% (NCR Rating)' },
                  { pct: 100, label: '100% (MCR 100%)' },
                ].map((item) => {
                  const kw = Math.round((engineSpec.mcrKwPerUnit * item.pct) / 100);
                  const flow = calcEngineGasFlowNm3h(kw, engineSpec.heatRateKjKwh, engineSpec.referenceLhvKjNm3);
                  const sfc = kw > 0 ? flow / kw : 0;
                  const tActive = flow > 0 ? activeDischargingTank.remainingNm3 / flow : 999;
                  const tYard = flow > 0 ? yardInventorySummary.totalRemainingNm3 / flow : 999;
                  return (
                    <tr key={item.pct} className="hover:bg-slate-900/50">
                      <td className="px-3 py-2 font-bold text-white font-bold">{item.label}</td>
                      <td className="px-3 py-2 text-right text-white font-bold font-bold">{kw.toLocaleString()} kW</td>
                      <td className="px-3 py-2 text-right text-white font-bold">{engineSpec.heatRateKjKwh.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-white font-bold font-bold">{flow.toFixed(1)} Nm³/h</td>
                      <td className="px-3 py-2 text-right text-white font-bold">{sfc.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right text-white font-bold font-bold">{tActive.toFixed(1)} h</td>
                      <td className="px-3 py-2 text-right text-white font-bold font-black">{tYard.toFixed(1)} h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. 5-Engine Grid Cards (Generator Engine 1 ~ 5) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
          <h4 className="text-xs sm:text-sm font-bold text-white font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-white font-bold" />
            <span>Honeywell Experion DCS Generator Engine Skid Units (MAN 7L 51/60 DF 1 ~ 5)</span>
          </h4>
          <span className="text-[11px] font-mono text-white font-bold">
            💡 Direct Dispatch Input: Type values or toggle Run/Stop & Fuel Mode
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
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
                className={`bg-slate-900/95 border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all duration-150 ${
                  isRunning
                    ? isGas
                      ? 'border-emerald-500/40 shadow-emerald-950/20'
                      : 'border-yellow-500/40 shadow-yellow-950/20'
                    : 'border-slate-800 opacity-80'
                }`}
              >
                {/* Engine Card Header */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-bold text-sm text-white font-bold">{eng.name}</h5>
                      <span className="text-[10px] text-white font-bold font-mono font-bold block">
                        {eng.tag} (MAN 7L 51/60 DF)
                      </span>
                    </div>

                    {/* Run / Stop Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleEngineStatus(eng.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border transition-all cursor-pointer flex items-center gap-1 ${
                        isRunning
                          ? 'bg-emerald-500/20 text-white font-bold border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-800 text-white font-bold border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                      <span>{eng.status}</span>
                    </button>
                  </div>

                  {/* Fuel Mode Selector (Gas vs Diesel) */}
                  <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center justify-between mb-3 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setEngineFuelMode(eng.id, 'GAS')}
                      className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isGas
                          ? 'bg-emerald-600/30 text-white font-bold border border-emerald-500/40 shadow-sm'
                          : 'text-white font-bold hover:text-white font-bold'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>Gas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEngineFuelMode(eng.id, 'DIESEL')}
                      className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        !isGas
                          ? 'bg-yellow-600/30 text-white font-bold border border-yellow-500/40 shadow-sm'
                          : 'text-white font-bold hover:text-white font-bold'
                      }`}
                    >
                      <Fuel className="w-3 h-3" />
                      <span>Diesel</span>
                    </button>
                  </div>

                  {/* Main Active Power Display & Load % */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 mb-3 font-mono">
                    <div className="flex justify-between items-center text-[10px] text-white font-bold mb-1">
                      <span>Active Output:</span>
                      <span className="text-white font-bold font-bold">
                        MCR {(engineSpec.mcrKwPerUnit / 1000).toFixed(2)} MW
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
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
                          className="w-24 bg-slate-900 text-white font-bold font-black text-lg px-1.5 py-0.5 rounded border border-slate-800 text-left focus:outline-none focus:border-amber-500 disabled:opacity-40"
                        />
                        <span className="text-[10px] text-white font-bold font-bold">kW</span>
                      </div>
                      <span className="text-xs font-bold text-white font-bold">
                        {engineLoadPct.toFixed(1)}% Load
                      </span>
                    </div>

                    {/* Gas Flow Rate Indicator */}
                    {isRunning && isGas && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex justify-between items-center text-[10px]">
                        <span className="text-white font-bold">Gas Flow:</span>
                        <span className="text-white font-bold font-bold">{engineGasFlow.toFixed(1)} Nm³/h</span>
                      </div>
                    )}
                  </div>

                  {/* Gas Inlet Parameters (Pressure & Temperature) */}
                  <div className="space-y-2 font-mono text-xs">
                    {/* Gas Press Inlet */}
                    <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800/60 flex justify-between items-center">
                      <span className="text-[10px] text-white font-bold flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-white font-bold" />
                        Gas Press Inlet:
                      </span>
                      <div className="flex items-center gap-1">
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
                          className="w-16 bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                        />
                        <span className="text-[10px] text-white font-bold font-bold">bar</span>
                      </div>
                    </div>

                    {/* Gas Temp Inlet */}
                    <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800/60 flex justify-between items-center">
                      <span className="text-[10px] text-white font-bold flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-white font-bold" />
                        Gas Temp Inlet:
                      </span>
                      <div className="flex items-center gap-1">
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
                          className="w-16 bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800 text-right text-xs font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                        />
                        <span className="text-[10px] text-white font-bold font-bold">°C</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engine Operating Telemetry Sub-panel */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 font-mono text-[10px] text-white font-bold space-y-1">
                  <div className="flex justify-between">
                    <span>Rated Speed:</span>
                    <span className="text-white font-bold font-bold">{eng.rpm} RPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exhaust Temp:</span>
                    <span className="text-white font-bold font-bold">{eng.exhaustTempC} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bus Frequency:</span>
                    <span className="text-white font-bold font-bold">{eng.frequencyHz.toFixed(2)} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generator Voltage:</span>
                    <span className="text-white font-bold font-bold">{eng.voltageKv.toFixed(1)} kV</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Tab 2 Linked Thermal Heat & Regas Reconciliation Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-white font-bold text-[10px] font-bold font-mono border border-amber-500/30">
              DOMAIN 1 & 2 LINKED RECONCILIATION
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-white font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-white font-bold" />
              PLTMG Fuel Gas Demand & Real-Time ISO Tank Inventory Autonomy
            </h4>
          </div>
          <span className="text-[11px] font-mono text-white font-bold">
            Active Feed Tank: <strong className="text-white font-bold">{activeDischargingTank.tankNo}</strong> ({activeDischargingTank.bayName})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {/* Item 1 */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-white font-bold block mb-1">Fuel Gas Flow Rate (Total)</span>
            <span className="text-lg font-black text-white font-bold block">
              {summary.totalGasFlowNm3h.toLocaleString(undefined, { maximumFractionDigits: 1 })} Nm³/h
            </span>
            <span className="text-[10px] text-white font-bold mt-0.5 block">
              ≈ {((summary.totalGasFlowNm3h * 35.3147) / 1000).toFixed(1)} kSCFH
            </span>
          </div>

          {/* Item 2 */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-white font-bold block mb-1">Daily Gas Heat Demand</span>
            <span className="text-lg font-black text-white font-bold block">
              {summary.deliveredMmbtuDay.toLocaleString(undefined, { maximumFractionDigits: 1 })} MMBtu/day
            </span>
            <span className="text-[10px] text-white font-bold mt-0.5 block">
              At {engineSpec.referenceLhvKjNm3.toLocaleString()} kJ/Nm³ LHV (1,048.5 BTU/SCF)
            </span>
          </div>

          {/* Item 3 */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-white font-bold block mb-1">LNG Mass Consumption</span>
            <span className="text-lg font-black text-white font-bold block">
              {summary.deliveredMassTonneDay.toFixed(2)} Tonne/day
            </span>
            <span className="text-[10px] text-white font-bold mt-0.5 block">
              ≈ {(summary.deliveredMassTonneDay * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/day
            </span>
          </div>

          {/* Item 4: 2-Tier Autonomy Buffer */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-white font-bold">Active Tank Autonomy:</span>
              <span className="text-white font-bold font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                {activeDischargingTank.tankNo} ({activeDischargingTank.levelPct.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-white font-bold">
                {summary.activeTankAutonomyHours.toFixed(1)} Hours
              </span>
              <span className="text-[11px] text-white font-bold">
                {activeDischargingTank.remainingNm3.toLocaleString()} Nm³
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
              <span className="text-white font-bold">Total Yard ({yardInventorySummary.fullCount} Tanks):</span>
              <span className="text-white font-bold font-bold">
                {summary.yardTotalAutonomyHours.toFixed(1)} Hours ({(yardInventorySummary.totalRemainingNm3 / 1000).toFixed(1)}k Nm³)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAN 7L 51/60 DF Dedicated Specification Configuration Modal (Wide View)   */}
      {/* ========================================================================= */}
      {isSpecModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-8 md:p-10 shadow-2xl animate-in zoom-in-95 font-sans space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                    <Settings className="w-7 h-7 text-white font-bold" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white font-bold">
                      MAN 7L 51/60 DF Engine Specification Settings
                    </h3>
                    <p className="text-sm text-white font-bold mt-1">
                      Fine-tune thermodynamic constants: MCR, NCR, gas consumption rate, reference LHV, and nominal ISO tank volume.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSpecModalOpen(false)}
                className="text-white font-bold hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Fixed Engine Model Banner */}
            <div className="py-3.5 px-6 bg-slate-950 rounded-2xl border border-cyan-500/30 flex items-center justify-between flex-wrap gap-3 font-mono text-sm">
              <span className="text-white font-bold font-bold tracking-wide">Locked Base Generator Engine:</span>
              <span className="text-base font-bold text-white font-bold px-4 py-1.5 bg-cyan-950/70 rounded-xl border border-cyan-500/40 flex items-center gap-2 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white font-bold" />
                MAN 7L 51/60 DF (Standard PLTMG Dual-Fuel Unit)
              </span>
            </div>

            {/* Modal Form Fields */}
            <form onSubmit={handleSaveEngineSpec} className="space-y-6 font-mono text-sm">
              {/* Row 1: MCR and NCR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Field 1: Unit MCR Power (kW) */}
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold tracking-wider text-white font-bold uppercase block">
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
                        ncrKwPerUnit: Math.round(newMcr * 0.9), // Auto-suggest 90% NCR
                      });
                    }}
                    className="w-full h-13 py-3 px-4 bg-slate-950 border border-slate-800 text-white font-bold text-xl md:text-2xl font-mono font-black rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                  />
                  <span className="text-xs text-white font-bold block pl-1">
                    Plant Total Capability (5 Units): <strong className="text-white font-bold">{((draftSpec.mcrKwPerUnit * 5) / 1000).toFixed(2)} MW</strong>
                  </span>
                </div>

                {/* Field 2: Unit NCR Power (kW) */}
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold tracking-wider text-white font-bold uppercase block">
                    Unit NCR Normal Continuous Rating (kW)
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
                    className="w-full h-13 py-3 px-4 bg-slate-950 border border-slate-800 text-white font-bold text-xl md:text-2xl font-mono font-black rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                  />
                  <span className="text-xs text-white font-bold block pl-1">
                    Continuous Target: <strong className="text-white font-bold">{draftSpec.mcrKwPerUnit > 0 ? ((draftSpec.ncrKwPerUnit / draftSpec.mcrKwPerUnit) * 100).toFixed(1) : 90}%</strong> of MCR ({((draftSpec.ncrKwPerUnit * 5) / 1000).toFixed(2)} MW Total)
                  </span>
                </div>
              </div>

              {/* Row 2: Heat Rate & Gas LHV */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Field 3: Gas Consumption Rate (kJ/kWh) */}
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold tracking-wider text-white font-bold uppercase block">
                    Gas Consumption Rate / Heat Rate (kJ/kWh)
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
                    className="w-full h-13 py-3 px-4 bg-slate-950 border border-slate-800 text-white font-bold text-xl md:text-2xl font-mono font-black rounded-2xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
                  />
                  <span className="text-xs text-white font-bold block pl-1">
                    Thermal Efficiency: <strong className="text-white font-bold">{draftSpec.heatRateKjKwh > 0 ? ((3600 / draftSpec.heatRateKjKwh) * 100).toFixed(2) : 0}%</strong> (LHV Electrical)
                  </span>
                </div>

                {/* Field 4: Reference Gas LHV (kJ/Nm3) */}
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold tracking-wider text-white font-bold uppercase block">
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
                    className="w-full h-13 py-3 px-4 bg-slate-950 border border-slate-800 text-white font-bold text-xl md:text-2xl font-mono font-black rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                  />
                  <span className="text-xs text-white font-bold block pl-1">
                    Equivalent Heating Value: <strong className="text-white font-bold">{(draftSpec.referenceLhvKjNm3 * 0.037446).toFixed(1)} BTU/SCF</strong>
                  </span>
                </div>
              </div>

              {/* Row 3: Nominal ISO Tank Volume */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-bold tracking-wider text-white font-bold uppercase block">
                  Nominal ISO Tank Usable Gas Volume (Default Baseline Nm³/tank)
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
                  className="w-full h-13 py-3 px-4 bg-slate-950 border border-slate-800 text-white font-bold text-xl md:text-2xl font-mono font-black rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                />
                <span className="text-xs text-white font-bold block pl-1 leading-relaxed">
                  💡 Used as fallback baseline when individual tank telemetry is unavailable. Actual real-time calculations prioritize active Bay tank live loaded volume & yard inventory.
                </span>
              </div>

              {/* Modal Action Buttons Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDraftSpec(DEFAULT_ENGINE_SPEC_CONFIG)}
                  className="w-full sm:w-auto h-12 px-6 bg-slate-950 hover:bg-slate-800 text-white font-bold hover:text-white rounded-2xl border border-slate-800 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-4 h-4 text-white font-bold" />
                  <span>Restore Official MAN</span>
                </button>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsSpecModalOpen(false)}
                    className="flex-1 sm:flex-none h-12 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-2xl text-base font-black shadow-xl shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Configuration</span>
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
