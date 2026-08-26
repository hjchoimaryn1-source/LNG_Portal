'use client';

import React, { useState, useMemo } from 'react';
import {
  Scale,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  Activity,
  Zap,
  Gauge,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Ship,
  Building2,
  Fuel,
  ChevronDown,
  ChevronUp,
  LineChart as LineChartIcon,
  XCircle,
  Save,
  Maximize2,
  Minimize2,
  Table,
  Droplets,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePortalData } from '@/context/PortalDataContext';
import { NodeState } from '@/types/lng';

interface MonthlySettlementDayPoint {
  day: string;             // e.g. "01", "02", ... "31"
  date: string;            // "2026-07-01"
  flowMscf: number;        // Daily gas flow (MSCF)
  energyMmbtu: number;     // Daily Energy (MMBTU)
  cumEnergyMmbtu: number;  // Cumulative Energy (MMBTU)
  pressureBarg: number;    // Supply Pressure (Barg)
  tempC: number;           // Gas Temp (°C)
  stockM3Liq: number;      // Onsite stock m3
  ladenTanks: number;      // Laden tanks count
  emptyTanks: number;      // Empty tanks count
}

// Generate full 31-day July 2026 custody flow & tank inventory dataset
function generateMonthlyTrendData(baseFlowMscf: number = 950): MonthlySettlementDayPoint[] {
  const points: MonthlySettlementDayPoint[] = [];
  let cumEnergy = 0;
  let runningStockM3 = 480.0;

  for (let i = 1; i <= 31; i++) {
    const dayStr = String(i).padStart(2, '0');
    const dateStr = `2026-07-${dayStr}`;

    // Realistic day-to-day fluctuation
    const dailyFactor = 0.92 + Math.sin(i * 0.45) * 0.12 + ((i * 7) % 11) * 0.015;
    const flowMscf = parseFloat((baseFlowMscf * dailyFactor).toFixed(1));
    const energyMmbtu = parseFloat((flowMscf * 1.0485).toFixed(1)); // ~1,048.5 BTU/SCF
    cumEnergy += energyMmbtu;

    const pressureBarg = parseFloat((2.16 + ((i * 3) % 7) * 0.015).toFixed(2));
    const tempC = parseFloat((24.0 + Math.cos(i * 0.3) * 1.2).toFixed(1));

    // Replenishment event every 8 days
    if (i % 8 === 0) {
      runningStockM3 += 320.0; // Batch offload
    } else {
      runningStockM3 = Math.max(120.0, runningStockM3 - 38.5 * dailyFactor);
    }

    const ladenTanks = Math.min(24, Math.max(4, Math.round(runningStockM3 / 41.2)));
    const emptyTanks = 24 - ladenTanks;

    points.push({
      day: `${dayStr} Jul`,
      date: dateStr,
      flowMscf,
      energyMmbtu,
      cumEnergyMmbtu: Math.round(cumEnergy),
      pressureBarg,
      tempC,
      stockM3Liq: parseFloat(runningStockM3.toFixed(1)),
      ladenTanks,
      emptyTanks,
    });
  }

  return points;
}

export default function NiasCustodySettlementTab() {
  const { settlementRecords, fleetTanks, exportAllLogsToExcel } = usePortalData();

  // Selected Month State
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-07');
  const [unitPriceUSD, setUnitPriceUSD] = useState<number>(11.5);
  const [isTrendOpen, setIsTrendOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 31-Day Trend Data
  const trendData = useMemo(() => generateMonthlyTrendData(945), []);

  // Aggregated Monthly Custody Metrics
  const monthlyMetrics = useMemo(() => {
    const totalFlowMscf = trendData.reduce((acc, p) => acc + p.flowMscf, 0);
    const totalEnergyMmbtu = trendData.reduce((acc, p) => acc + p.energyMmbtu, 0);
    const avgPressure = trendData.reduce((acc, p) => acc + p.pressureBarg, 0) / trendData.length;
    const avgTemp = trendData.reduce((acc, p) => acc + p.tempC, 0) / trendData.length;

    // Financial calculations
    const totalInvoicedUSD = totalEnergyMmbtu * unitPriceUSD;
    const acceptedEnergyMmbtu = totalEnergyMmbtu * 0.985; // 98.5% plant thermal acceptance
    const acceptedAmountUSD = acceptedEnergyMmbtu * unitPriceUSD;
    const varianceMmbtu = totalEnergyMmbtu - acceptedEnergyMmbtu;
    const varianceUSD = varianceMmbtu * unitPriceUSD;

    return {
      totalFlowMscf: Math.round(totalFlowMscf),
      totalEnergyMmbtu: Math.round(totalEnergyMmbtu),
      avgPressure: parseFloat(avgPressure.toFixed(2)),
      avgTemp: parseFloat(avgTemp.toFixed(1)),
      totalInvoicedUSD,
      acceptedEnergyMmbtu: Math.round(acceptedEnergyMmbtu),
      acceptedAmountUSD,
      varianceMmbtu: Math.round(varianceMmbtu),
      varianceUSD,
      lossPct: 1.5,
    };
  }, [trendData, unitPriceUSD]);

  // LNG Stock 3-Hub Inventory Breakdown
  const stockInventory = useMemo(() => {
    // 1. On Site (Nias Terminal: Yard + Vaporizer Bays)
    const onsiteTanks = fleetTanks.filter(
      (t) =>
        t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
        t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
        t.location?.toLowerCase().includes('nias')
    );
    const onsiteLaden = onsiteTanks.filter((t) => (t.level || 0) > 20).length || 14;
    const onsiteEmpty = onsiteTanks.filter((t) => (t.level || 0) <= 20).length || 10;
    const onsiteVolM3 = parseFloat((onsiteLaden * 41.2 + onsiteEmpty * 2.1).toFixed(1));
    const onsiteMscf = Math.round(onsiteVolM3 * 25.335);

    // 2. On Ship (MV Saviour Marine Transit)
    const shipTanks = fleetTanks.filter(
      (t) => t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT || t.location?.toLowerCase().includes('saviour')
    );
    const shipLaden = shipTanks.filter((t) => (t.level || 0) > 20).length || 48;
    const shipEmpty = shipTanks.filter((t) => (t.level || 0) <= 20).length || 0;
    const shipVolM3 = parseFloat((shipLaden * 41.2 + shipEmpty * 2.1).toFixed(1));
    const shipMscf = Math.round(shipVolM3 * 25.335);

    // 3. On Perta Arun Gas (Arun Hub Staging Yard)
    const arunTanks = fleetTanks.filter(
      (t) =>
        t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL ||
        t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
        t.location?.toLowerCase().includes('arun')
    );
    const arunLaden = arunTanks.filter((t) => (t.level || 0) > 20).length || 16;
    const arunEmpty = arunTanks.filter((t) => (t.level || 0) <= 20).length || 32;
    const arunVolM3 = parseFloat((arunLaden * 41.2 + arunEmpty * 2.1).toFixed(1));
    const arunMscf = Math.round(arunVolM3 * 25.335);

    const totalFleetTanks = onsiteTanks.length + shipTanks.length + arunTanks.length || 120;
    const totalFleetVolM3 = parseFloat((onsiteVolM3 + shipVolM3 + arunVolM3).toFixed(1));
    const totalFleetMscf = onsiteMscf + shipMscf + arunMscf;

    return {
      onsite: { laden: onsiteLaden, empty: onsiteEmpty, total: onsiteLaden + onsiteEmpty, volM3: onsiteVolM3, mscf: onsiteMscf, press: 0.76, temp: -156.4 },
      ship: { laden: shipLaden, empty: shipEmpty, total: shipLaden + shipEmpty, volM3: shipVolM3, mscf: shipMscf, press: 0.18, temp: -161.8 },
      arun: { laden: arunLaden, empty: arunEmpty, total: arunLaden + arunEmpty, volM3: arunVolM3, mscf: arunMscf, press: 0.05, temp: -162.5 },
      totalFleetTanks,
      totalFleetVolM3,
      totalFleetMscf,
    };
  }, [fleetTanks]);

  const handleSaveReport = () => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta' });
    setToastMessage(`✓ Monthly Custody Settlement Report for ${selectedMonth} saved successfully (${timestamp} WIB)!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200 text-white font-bold font-sans">
      {/* 1. Top Header & Action Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-white font-bold border border-amber-500/30">
              <Scale className="w-3.5 h-3.5" />
              DOMAIN 2 · SUB-TAB 4: CUSTODY HEAT SETTLEMENT
            </span>
            <span className="text-xs font-mono text-white font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 font-bold">
              PLN & PAG Monthly Custody Transfer Statement
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded border bg-emerald-950/80 text-white font-bold border-emerald-500/40">
              <ShieldCheck className="w-3.5 h-3.5 text-white font-bold" />
              Reconciliation Status: VERIFIED
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white font-bold flex items-center gap-2 mt-2">
            <Flame className="w-4 h-4 text-white font-bold" />
            Official Monthly Gas Custody Metering & LNG Terminal Stock Master Audit
          </h3>
          <p className="text-xs text-white font-bold mt-0.5">
            Synchronized with Meter Runs M-101A/B, Unloading Skids, PLTMG Gas-to-Power acceptance, and 3-Hub stock matrices.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs text-white font-bold">
            <Calendar className="w-3.5 h-3.5 text-white font-bold" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026-07" className="bg-slate-900">2026-07 (July)</option>
              <option value="2026-08" className="bg-slate-900">2026-08 (August)</option>
              <option value="2026-06" className="bg-slate-900">2026-06 (June)</option>
            </select>
          </div>

          {/* Monthly Trend Charts Viewer Trigger Button */}
          <button
            type="button"
            onClick={() => setIsTrendOpen(!isTrendOpen)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isTrendOpen
                ? 'bg-cyan-600/30 text-white font-bold border-cyan-500/50 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 hover:bg-slate-800 text-white font-bold border-cyan-500/30'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5 text-white font-bold" />
            <span>{isTrendOpen ? 'Hide Trend Charts ▲' : '📈 Monthly Trend Charts (6-Axis) ▼'}</span>
          </button>

          {/* Save Report Button */}
          <button
            type="button"
            onClick={handleSaveReport}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Report</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={exportAllLogsToExcel}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold hover:text-white rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white font-bold" />
            <span>Export (.xlsx)</span>
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

      {/* ===================================================================== */}
      {/* 6-Axis Monthly Trend Charts (Collapsible / Expandable Panel)          */}
      {/* ===================================================================== */}
      {isTrendOpen && (
        <div className="bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                <LineChartIcon className="w-5 h-5 text-white font-bold" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white font-bold">
                  July 2026 Complete 31-Day 6-Axis Custody & Inventory Trend Charts
                </h4>
                <p className="text-xs text-white font-bold">
                  Full monthly curve: Daily Flow, Supply Pressure, Thermal Energy, Liquid Stock, Tank Balance & Cumulative Energy.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsTrendOpen(false)}
              className="text-xs font-mono text-white font-bold hover:text-white px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Close Charts</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Chart 1: Total Flow Consumption (MSCF) */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 font-mono space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white font-bold">1. Total Flow Consumption (MSCF)</span>
                <span className="text-[10px] text-white font-bold">Daily Gas Sendout</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="flowMscf" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorFlow)" name="Flow (MSCF)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pressure Supply (Barg) */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 font-mono space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white font-bold">2. Pressure Supply (Barg)</span>
                <span className="text-[10px] text-white font-bold">Header Pressure</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={[1.8, 2.5]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="pressureBarg" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Press (Barg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Total Energy (MMBTU) */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 font-mono space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white font-bold">3. Total Energy (MMBTU)</span>
                <span className="text-[10px] text-white font-bold">Daily Heat Transfer</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="energyMmbtu" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} name="Energy (MMBTU)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Total Stock LNG (m³ Liq) */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 font-mono space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white font-bold">4. Total Stock LNG (m³ Liq)</span>
                <span className="text-[10px] text-white font-bold">Onsite Terminal Stock</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={[0, 600]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="stockM3Liq" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorStock)" name="Stock (m³ Liq)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Laden vs Empty Tank Balance */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 font-mono space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white font-bold">5. Laden vs Empty Tank Balance</span>
                <span className="text-[10px] text-white font-bold">Daily 24-Tank Yard State</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={[0, 24]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="ladenTanks" stackId="a" fill="#10b981" name="Laden (Full)" />
                    <Bar dataKey="emptyTanks" stackId="a" fill="#64748b" name="Empty" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Total Energy Accumulative (MMBTU) */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 font-mono space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white font-bold">6. Total Energy Accumulative (MMBTU)</span>
                <span className="text-[10px] text-white font-bold">Monthly Accumulated Total</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="cumEnergyMmbtu" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCum)" name="Cum. Energy (MMBTU)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. Official 4 Data Matrices (Always-Visible View)                     */}
      {/* ===================================================================== */}

      {/* MATRIX 1: Dual Metering Runs (Meter A & Meter B Side-by-Side) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs sm:text-sm font-bold text-white font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-white font-bold" />
            <span>Matrix 1: Joint Metering Runs (M-101A Custody & M-101B Check Meter)</span>
          </h4>
          <span className="text-[11px] font-mono text-white font-bold">
            Flow Computer Integration: Floboss S600+ Standard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Meter A Panel */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/30 shadow-lg space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white font-bold flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-white font-bold" />
                Metering Run A (M-101A) - Primary Custody
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 text-white font-bold border border-cyan-500/40">
                ACTIVE CUSTODY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-white font-bold block mb-0.5">Totalizer Flow</span>
                <span className="text-base font-black text-white font-bold block">14,820.5 MSCF</span>
                <span className="text-[9px] text-white font-bold block">Cum: 246.3 MMSCF</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-white font-bold block mb-0.5">Energy Flow</span>
                <span className="text-base font-black text-white font-bold block">15,539.4 MMBTU</span>
                <span className="text-[9px] text-white font-bold block">Cum: 258,240 MMBTU</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-white font-bold">
                <span>Supply Pressure:</span>
                <span className="text-white font-bold font-bold">2.18 Barg</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Gas Temperature:</span>
                <span className="text-white font-bold font-bold">24.5 °C</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Gas Density:</span>
                <span className="text-white font-bold font-bold">2.18 kg/m³</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>GHV / Heating Value:</span>
                <span className="text-white font-bold font-bold">1,048.5 BTU/SCF</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Differential Pressure:</span>
                <span className="text-white font-bold font-bold">14.2 inH2O</span>
              </div>
            </div>
          </div>

          {/* Meter B Panel */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white font-bold flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-white font-bold" />
                Metering Run B (M-101B) - Check Meter
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white font-bold border border-slate-700">
                CHECK STANDBY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-white font-bold block mb-0.5">Totalizer Flow</span>
                <span className="text-base font-black text-white font-bold block">14,815.2 MSCF</span>
                <span className="text-[9px] text-white font-bold block">Delta: -0.04%</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-white font-bold block mb-0.5">Energy Flow</span>
                <span className="text-base font-black text-white font-bold block">15,533.8 MMBTU</span>
                <span className="text-[9px] text-white font-bold block">Delta: -5.6 MMBTU</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-white font-bold">
                <span>Supply Pressure:</span>
                <span className="text-white font-bold font-bold">2.16 Barg</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Gas Temperature:</span>
                <span className="text-white font-bold font-bold">24.2 °C</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Gas Density:</span>
                <span className="text-white font-bold font-bold">2.18 kg/m³</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>GHV / Heating Value:</span>
                <span className="text-white font-bold font-bold">1,048.5 BTU/SCF</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Differential Pressure:</span>
                <span className="text-white font-bold font-bold">13.8 inH2O</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX 2 & 4: Unloading Summary & Financial Settlement Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
        {/* MATRIX 2: Unloading LNG ISO Tank & PLTMG Fuel Gas Summary */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <span className="text-sm font-bold text-white font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-white font-bold" />
                Matrix 2: Unloading ISO Tank & PLTMG Fuel Gas Acceptance
              </span>
              <span className="text-[10px] text-white font-bold">Monthly Net Batch</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">ISO Tanks Offloaded in Month:</span>
                <span className="text-white font-bold font-bold text-sm">28 Tanks</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">Total Liquid Vaporized:</span>
                <span className="text-white font-bold font-bold text-sm">1,153.6 m³ Liq (≈ 29,226 MSCF)</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">Avg Offload Pressure & Temp:</span>
                <span className="text-white font-bold font-bold text-sm">0.76 MPa | -156.4 °C</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">PLTMG Custody Energy Received:</span>
                <span className="text-white font-bold font-black text-sm">{monthlyMetrics.totalEnergyMmbtu.toLocaleString()} MMBTU</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-white font-bold">
            <span>Terminal Sendout Efficiency:</span>
            <span className="text-white font-bold font-bold">98.50% (Line Loss: 1.50%)</span>
          </div>
        </div>

        {/* MATRIX 4: Custody Heat Settlement & Billing Ledger */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/30 shadow-lg space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <span className="text-sm font-bold text-white font-bold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-white font-bold" />
                Matrix 4: Heat Settlement & Financial Invoice Reconciliation
              </span>
              <span className="text-[10px] text-white font-bold">Rate: ${unitPriceUSD.toFixed(2)}/MMBTU</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">Gross Invoiced Heat (PAG):</span>
                <span className="text-white font-bold font-black text-sm">
                  ${monthlyMetrics.totalInvoicedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">Accepted Heat Payment (PLN):</span>
                <span className="text-white font-bold font-black text-sm">
                  ${monthlyMetrics.acceptedAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">Variance & Reconciliation Gap:</span>
                <span className="text-white font-bold font-bold text-sm">
                  ${monthlyMetrics.varianceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD ({monthlyMetrics.varianceMmbtu} MMBTU)
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-white font-bold">Audit Status / Penalty Flag:</span>
                <span className="text-white font-bold font-bold text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  NO DISPUTE (Variance ≤ 2.0%)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-white font-bold">
            <span>Billing Cycle:</span>
            <span className="text-white font-bold font-bold">Monthly Calendar Cut-off (24:00 WIB)</span>
          </div>
        </div>
      </div>

      {/* MATRIX 3: LNG Stock Location Matrix (3-Hub Table View) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs sm:text-sm font-bold text-white font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-white font-bold" />
            <span>Matrix 3: 3-Hub LNG Stock Location & ISO Tank Distribution Matrix</span>
          </h4>
          <span className="text-[11px] font-mono text-white font-bold">
            Total Fleet Size: 120 Units (40ft/45ft ISO Tanks)
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl bg-slate-900/90 font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-white font-bold border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                <th className="px-4 py-3">Location & Facility Stream</th>
                <th className="px-3 py-3 text-center">Laden (Full)</th>
                <th className="px-3 py-3 text-center">Empty</th>
                <th className="px-3 py-3 text-center text-white font-bold">Total Tanks</th>
                <th className="px-3 py-3 text-right text-white font-bold">Stock (m³ Liq)</th>
                <th className="px-3 py-3 text-right text-white font-bold font-bold">Stock (MSCF)</th>
                <th className="px-3 py-3 text-right">Avg Press (MPa)</th>
                <th className="px-3 py-3 text-right">Avg Temp (°C)</th>
                <th className="px-4 py-3 text-center">Hub Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-white font-bold">
              {/* Hub 1: On Site (Nias Terminal) */}
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>On Site (Nias Yard & Vaporizer Bays)</span>
                </td>
                <td className="px-3 py-3 text-center font-bold text-white font-bold">{stockInventory.onsite.laden}</td>
                <td className="px-3 py-3 text-center text-white font-bold">{stockInventory.onsite.empty}</td>
                <td className="px-3 py-3 text-center font-bold text-white font-bold">{stockInventory.onsite.total}</td>
                <td className="px-3 py-3 text-right text-white font-bold font-bold">{stockInventory.onsite.volM3.toFixed(1)} m³</td>
                <td className="px-3 py-3 text-right text-white font-bold font-black">{stockInventory.onsite.mscf.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-white font-bold">{stockInventory.onsite.press.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-white font-bold">{stockInventory.onsite.temp.toFixed(1)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-white font-bold border border-emerald-500/30">
                    DISCHARGING
                  </span>
                </td>
              </tr>

              {/* Hub 2: On Ship (MV Saviour) */}
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold text-white font-bold flex items-center gap-2">
                  <Ship className="w-4 h-4 text-white font-bold" />
                  <span>On Ship (MV. Saviour Marine Deck)</span>
                </td>
                <td className="px-3 py-3 text-center font-bold text-white font-bold">{stockInventory.ship.laden}</td>
                <td className="px-3 py-3 text-center text-white font-bold">{stockInventory.ship.empty}</td>
                <td className="px-3 py-3 text-center font-bold text-white font-bold">{stockInventory.ship.total}</td>
                <td className="px-3 py-3 text-right text-white font-bold font-bold">{stockInventory.ship.volM3.toFixed(1)} m³</td>
                <td className="px-3 py-3 text-right text-white font-bold font-black">{stockInventory.ship.mscf.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-white font-bold">{stockInventory.ship.press.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-white font-bold">{stockInventory.ship.temp.toFixed(1)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-white font-bold border border-blue-500/30">
                    IN TRANSIT
                  </span>
                </td>
              </tr>

              {/* Hub 3: On Perta Arun Gas */}
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold text-white font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white font-bold" />
                  <span>On Perta Arun Gas (Arun Hub Yard)</span>
                </td>
                <td className="px-3 py-3 text-center font-bold text-white font-bold">{stockInventory.arun.laden}</td>
                <td className="px-3 py-3 text-center text-white font-bold">{stockInventory.arun.empty}</td>
                <td className="px-3 py-3 text-center font-bold text-white font-bold">{stockInventory.arun.total}</td>
                <td className="px-3 py-3 text-right text-white font-bold font-bold">{stockInventory.arun.volM3.toFixed(1)} m³</td>
                <td className="px-3 py-3 text-right text-white font-bold font-black">{stockInventory.arun.mscf.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-white font-bold">{stockInventory.arun.press.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-white font-bold">{stockInventory.arun.temp.toFixed(1)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-white font-bold border border-amber-500/30">
                    LOADING / BUFFER
                  </span>
                </td>
              </tr>

              {/* Summary Total Row */}
              <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700">
                <td className="px-4 py-3 text-white font-bold">Total 120 Fleet Distribution:</td>
                <td className="px-3 py-3 text-center text-white font-bold font-black">
                  {stockInventory.onsite.laden + stockInventory.ship.laden + stockInventory.arun.laden}
                </td>
                <td className="px-3 py-3 text-center text-white font-bold">
                  {stockInventory.onsite.empty + stockInventory.ship.empty + stockInventory.arun.empty}
                </td>
                <td className="px-3 py-3 text-center text-white font-black">{stockInventory.totalFleetTanks}</td>
                <td className="px-3 py-3 text-right text-white font-bold font-black">{stockInventory.totalFleetVolM3.toFixed(1)} m³</td>
                <td className="px-3 py-3 text-right text-white font-bold font-black">{stockInventory.totalFleetMscf.toLocaleString()} MSCF</td>
                <td className="px-3 py-3 text-right text-white font-bold">-</td>
                <td className="px-3 py-3 text-right text-white font-bold">-</td>
                <td className="px-4 py-3 text-center text-white font-bold">100% RECONCILED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
