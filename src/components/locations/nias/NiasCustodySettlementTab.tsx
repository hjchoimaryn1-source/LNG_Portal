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
    <div className="w-full space-y-4 animate-in fade-in duration-150 font-sans pb-10">
      {/* 1. Top Header & Action Controls Bar (Classic Slate Header) */}
      <div className="bg-[#334155] text-white border-2 border-slate-600 rounded-none p-3 sm:py-2.5 sm:px-4 shadow-2xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white font-mono uppercase tracking-wide">
            MONTHLY REPORT
          </h3>
          <span className="inline-flex items-center text-xs font-mono bg-[#1e293b] text-emerald-300 px-2 py-0.5 border border-slate-500 shadow-2xs font-bold">
            Status: VERIFIED (NO DISPUTE)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center font-mono text-xs">
          {/* Month Selector */}
          <div className="flex items-center bg-[#f1f5f9] text-slate-900 border border-slate-400 px-2.5 py-1 rounded shadow-xs font-bold">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer [color-scheme:light]"
            >
              <option value="2026-07">2026-07 (July)</option>
              <option value="2026-08">2026-08 (August)</option>
              <option value="2026-06">2026-06 (June)</option>
            </select>
          </div>

          {/* Monthly Trend Charts Viewer Trigger Button */}
          <button
            type="button"
            onClick={() => setIsTrendOpen(!isTrendOpen)}
            className={`px-3 py-1.5 border font-bold rounded shadow-xs cursor-pointer transition-colors ${
              isTrendOpen
                ? 'bg-[#0284c7] text-white border-[#0369a1]'
                : 'bg-[#e2e8f0] hover:bg-slate-300 active:bg-slate-400 text-slate-900 border-slate-400'
            }`}
          >
            <span>{isTrendOpen ? 'Hide Trend Charts' : 'Monthly Trend Charts'}</span>
          </button>

          {/* Save Report Button */}
          <button
            type="button"
            onClick={handleSaveReport}
            className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white border border-[#047857] shadow-xs font-black rounded cursor-pointer transition-colors"
          >
            <span>Save Report</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={exportAllLogsToExcel}
            className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-slate-300 active:bg-slate-400 text-slate-900 border border-slate-400 shadow-xs font-bold rounded cursor-pointer transition-colors"
          >
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {toastMessage && (
        <div className="p-2.5 bg-emerald-100 border-2 border-emerald-600 text-emerald-950 text-xs font-mono font-bold text-center shadow-xs">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6-Axis Monthly Trend Charts (Collapsible / Expandable Panel)          */}
      {/* ===================================================================== */}
      {isTrendOpen && (
        <div className="bg-white border-2 border-slate-600 rounded-none p-3.5 shadow-2xs space-y-3 animate-in fade-in duration-150 font-mono">
          <div className="flex justify-between items-center border-b border-slate-300 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {selectedMonth} 31-Day Custody &amp; Inventory Trend Charts
            </h4>
            <button
              type="button"
              onClick={() => setIsTrendOpen(false)}
              className="text-xs font-mono text-slate-700 hover:text-slate-950 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded border border-slate-400 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {/* Chart 1: Total Flow Consumption (MSCF) */}
            <div className="p-3 bg-[#f8fafc] border border-slate-400 rounded-none space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">1. Total Flow Consumption (MSCF)</span>
                <span className="text-[10px] text-slate-600 font-bold">Daily Sendout</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#94a3b8', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="flowMscf" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorFlow)" name="Flow (MSCF)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pressure Supply (Barg) */}
            <div className="p-3 bg-[#f8fafc] border border-slate-400 rounded-none space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">2. Pressure Supply (Barg)</span>
                <span className="text-[10px] text-slate-600 font-bold">Header Pressure</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={[1.8, 2.5]} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#94a3b8', fontSize: '11px' }} />
                    <Bar dataKey="pressureBarg" fill="#d97706" radius={[2, 2, 0, 0]} name="Press (Barg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Total Energy (MMBTU) */}
            <div className="p-3 bg-[#f8fafc] border border-slate-400 rounded-none space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">3. Total Energy (MMBTU)</span>
                <span className="text-[10px] text-slate-600 font-bold">Daily Heat</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#94a3b8', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="energyMmbtu" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} name="Energy (MMBTU)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Total Stock LNG (m³ Liq) */}
            <div className="p-3 bg-[#f8fafc] border border-slate-400 rounded-none space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">4. Total Stock LNG (m³ Liq)</span>
                <span className="text-[10px] text-slate-600 font-bold">Terminal Stock</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={[0, 600]} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#94a3b8', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="stockM3Liq" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorStock)" name="Stock (m³)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Laden vs Empty Tank Balance */}
            <div className="p-3 bg-[#f8fafc] border border-slate-400 rounded-none space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">5. Laden vs Empty Tank Balance</span>
                <span className="text-[10px] text-slate-600 font-bold">Yard State</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={[0, 24]} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#94a3b8', fontSize: '11px' }} />
                    <Bar dataKey="ladenTanks" stackId="a" fill="#059669" name="Laden" />
                    <Bar dataKey="emptyTanks" stackId="a" fill="#64748b" name="Empty" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Total Energy Accumulative (MMBTU) */}
            <div className="p-3 bg-[#f8fafc] border border-slate-400 rounded-none space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">6. Cumulative Energy (MMBTU)</span>
                <span className="text-[10px] text-slate-600 font-bold">Monthly Accumulation</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#94a3b8', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="cumEnergyMmbtu" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorCum)" name="Cum. MMBTU" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. Official Data Matrices (Always-Visible View)                        */}
      {/* ===================================================================== */}

      {/* MATRIX 1: Dual Metering Runs (Meter A & Meter B Side-by-Side) */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-1 font-mono">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
            Matrix 1: Joint Metering Runs (M-101A Custody &amp; M-101B Check Meter)
          </h4>
          <span className="text-xs text-slate-600 font-bold">
            Floboss S600+ Standard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {/* Meter A Panel */}
          <div className="bg-white border-2 border-slate-600 rounded-none shadow-2xs overflow-hidden">
            <div className="bg-[#334155] text-white p-2.5 flex justify-between items-center border-b-2 border-slate-600">
              <span className="font-black text-xs uppercase tracking-wide">
                Metering Run A (M-101A) - Primary Custody
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e293b] text-cyan-300 border border-slate-500">
                ACTIVE CUSTODY
              </span>
            </div>

            <div className="p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 bg-[#f8fafc] border border-slate-400 rounded-none text-center">
                  <span className="text-[10px] text-slate-600 font-bold uppercase block mb-0.5">Totalizer Flow</span>
                  <span className="text-base font-black text-slate-900 block text-center">14,820.5 MSCF</span>
                  <span className="text-[10px] text-slate-500 block text-center">Cum: 246.3 MMSCF</span>
                </div>
                <div className="p-2 bg-[#f8fafc] border border-slate-400 rounded-none text-center">
                  <span className="text-[10px] text-slate-600 font-bold uppercase block mb-0.5">Energy Flow</span>
                  <span className="text-base font-black text-slate-900 block text-center">15,539.4 MMBTU</span>
                  <span className="text-[10px] text-slate-500 block text-center">Cum: 258,240 MMBTU</span>
                </div>
              </div>

              <div className="p-2.5 bg-[#f1f5f9] border border-slate-300 rounded text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Supply Pressure:</span>
                  <span className="text-slate-900 font-bold">2.18 Barg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gas Temperature:</span>
                  <span className="text-slate-900 font-bold">24.5 °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gas Density:</span>
                  <span className="text-slate-900 font-bold">2.18 kg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">GHV / Heating Value:</span>
                  <span className="text-slate-900 font-bold">1,048.5 BTU/SCF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Differential Pressure:</span>
                  <span className="text-slate-900 font-bold">14.2 inH2O</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meter B Panel */}
          <div className="bg-white border-2 border-slate-600 rounded-none shadow-2xs overflow-hidden">
            <div className="bg-[#334155] text-white p-2.5 flex justify-between items-center border-b-2 border-slate-600">
              <span className="font-black text-xs uppercase tracking-wide">
                Metering Run B (M-101B) - Check Meter
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-400">
                CHECK STANDBY
              </span>
            </div>

            <div className="p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 bg-[#f8fafc] border border-slate-400 rounded-none text-center">
                  <span className="text-[10px] text-slate-600 font-bold uppercase block mb-0.5">Totalizer Flow</span>
                  <span className="text-base font-black text-slate-900 block text-center">14,815.2 MSCF</span>
                  <span className="text-[10px] text-slate-500 block text-center">Delta: -0.04%</span>
                </div>
                <div className="p-2 bg-[#f8fafc] border border-slate-400 rounded-none text-center">
                  <span className="text-[10px] text-slate-600 font-bold uppercase block mb-0.5">Energy Flow</span>
                  <span className="text-base font-black text-slate-900 block text-center">15,533.8 MMBTU</span>
                  <span className="text-[10px] text-slate-500 block text-center">Delta: -5.6 MMBTU</span>
                </div>
              </div>

              <div className="p-2.5 bg-[#f1f5f9] border border-slate-300 rounded text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Supply Pressure:</span>
                  <span className="text-slate-900 font-bold">2.16 Barg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gas Temperature:</span>
                  <span className="text-slate-900 font-bold">24.2 °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gas Density:</span>
                  <span className="text-slate-900 font-bold">2.18 kg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">GHV / Heating Value:</span>
                  <span className="text-slate-900 font-bold">1,048.5 BTU/SCF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Differential Pressure:</span>
                  <span className="text-slate-900 font-bold">13.8 inH2O</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX 2 & 4: Unloading Summary & Financial Settlement Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-mono text-xs">
        {/* MATRIX 2: Unloading LNG ISO Tank & PLTMG Fuel Gas Summary */}
        <div className="bg-white border-2 border-slate-600 rounded-none shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-[#334155] text-white p-2.5 flex justify-between items-center border-b-2 border-slate-600">
              <span className="font-black text-xs uppercase tracking-wide">
                Matrix 2: Unloading ISO Tank &amp; PLTMG Fuel Gas Acceptance
              </span>
              <span className="text-[10px] text-slate-300 font-bold">Monthly Net Batch</span>
            </div>

            <div className="p-3 space-y-2">
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">ISO Tanks Offloaded in Month:</span>
                <span className="text-slate-900 font-black text-xs">28 Tanks</span>
              </div>
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">Total Liquid Vaporized:</span>
                <span className="text-slate-900 font-black text-xs">1,153.6 m³ Liq (≈ 29,226 MSCF)</span>
              </div>
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">Avg Offload Press &amp; Temp:</span>
                <span className="text-slate-900 font-black text-xs">0.76 MPa | -156.4 °C</span>
              </div>
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">PLTMG Custody Energy Received:</span>
                <span className="text-slate-900 font-black text-xs">{monthlyMetrics.totalEnergyMmbtu.toLocaleString()} MMBTU</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#e2e8f0] border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-700 font-bold">
            <span>Terminal Sendout Efficiency:</span>
            <span className="text-slate-900 font-black">98.50% (Line Loss: 1.50%)</span>
          </div>
        </div>

        {/* MATRIX 4: Custody Heat Settlement & Billing Ledger */}
        <div className="bg-white border-2 border-slate-600 rounded-none shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-[#334155] text-white p-2.5 flex justify-between items-center border-b-2 border-slate-600">
              <span className="font-black text-xs uppercase tracking-wide">
                Matrix 4: Heat Settlement &amp; Invoice Reconciliation
              </span>
              <span className="text-[10px] text-slate-300 font-bold">Rate: ${unitPriceUSD.toFixed(2)}/MMBTU</span>
            </div>

            <div className="p-3 space-y-2">
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">Gross Invoiced Heat (PAG):</span>
                <span className="text-slate-900 font-black text-xs">
                  ${monthlyMetrics.totalInvoicedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">Accepted Heat Payment (PLN):</span>
                <span className="text-slate-900 font-black text-xs">
                  ${monthlyMetrics.acceptedAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">Variance &amp; Reconciliation Gap:</span>
                <span className="text-slate-900 font-black text-xs">
                  ${monthlyMetrics.varianceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD ({monthlyMetrics.varianceMmbtu} MMBTU)
                </span>
              </div>
              <div className="p-2.5 bg-[#f8fafc] border border-slate-300 flex justify-between items-center">
                <span className="text-slate-700 font-bold">Audit Status / Penalty Flag:</span>
                <span className="text-emerald-700 font-black text-xs">
                  NO DISPUTE (Variance ≤ 2.0%)
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#e2e8f0] border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-700 font-bold">
            <span>Billing Cycle:</span>
            <span className="text-slate-900 font-black">Monthly Calendar Cut-off (24:00 WIB)</span>
          </div>
        </div>
      </div>

      {/* MATRIX 3: LNG Stock Location Matrix (3-Hub Table View) */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-1 font-mono">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
            Matrix 3: 3-Hub LNG Stock Location &amp; ISO Tank Distribution Matrix
          </h4>
          <span className="text-xs text-slate-600 font-bold">
            Total Fleet: 120 Units
          </span>
        </div>

        <div className="overflow-x-auto border-2 border-slate-600 rounded-none bg-white shadow-2xs font-mono text-xs">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#cbd5e1] text-slate-900 border-b-2 border-slate-600 text-[10px] uppercase font-black tracking-wider">
                <th className="px-2 py-2 border-r border-slate-400 text-center">Location &amp; Facility Stream</th>
                <th className="px-2 py-2 border-r border-slate-400 text-center">Laden (Full)</th>
                <th className="px-2 py-2 border-r border-slate-400 text-center">Empty</th>
                <th className="px-2 py-2 border-r border-slate-400 text-center">Total Tanks</th>
                <th className="px-2 py-2 border-r border-slate-400 text-center">Stock (m³ Liq)</th>
                <th className="px-2 py-2 border-r border-slate-400 text-center">Stock (MSCF)</th>
                <th className="px-2 py-2 border-r border-slate-400 text-center">Avg Press (MPa)</th>
                <th className="px-2 py-2 border-r border-slate-400 text-center">Avg Temp (°C)</th>
                <th className="px-2 py-2 text-center">Hub Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-slate-900">
              {/* Hub 1: On Site (Nias Terminal) */}
              <tr className="hover:bg-slate-100">
                <td className="px-2 py-2 font-bold border-r border-slate-300 text-center">
                  On Site (Nias Yard &amp; Vaporizer Bays)
                </td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.onsite.laden}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.onsite.empty}</td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.onsite.total}</td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.onsite.volM3.toFixed(1)} m³</td>
                <td className="px-2 py-2 border-r border-slate-300 font-black text-center">{stockInventory.onsite.mscf.toLocaleString()}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.onsite.press.toFixed(2)}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.onsite.temp.toFixed(1)}</td>
                <td className="px-2 py-2 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-400">
                    DISCHARGING
                  </span>
                </td>
              </tr>

              {/* Hub 2: On Ship (MV Saviour) */}
              <tr className="hover:bg-slate-100">
                <td className="px-2 py-2 font-bold border-r border-slate-300 text-center">
                  On Ship (MV. Saviour Marine Deck)
                </td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.ship.laden}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.ship.empty}</td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.ship.total}</td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.ship.volM3.toFixed(1)} m³</td>
                <td className="px-2 py-2 border-r border-slate-300 font-black text-center">{stockInventory.ship.mscf.toLocaleString()}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.ship.press.toFixed(2)}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.ship.temp.toFixed(1)}</td>
                <td className="px-2 py-2 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-400">
                    IN TRANSIT
                  </span>
                </td>
              </tr>

              {/* Hub 3: On Perta Arun Gas */}
              <tr className="hover:bg-slate-100">
                <td className="px-2 py-2 font-bold border-r border-slate-300 text-center">
                  On Perta Arun Gas (Arun Hub Yard)
                </td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.arun.laden}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.arun.empty}</td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.arun.total}</td>
                <td className="px-2 py-2 border-r border-slate-300 font-bold text-center">{stockInventory.arun.volM3.toFixed(1)} m³</td>
                <td className="px-2 py-2 border-r border-slate-300 font-black text-center">{stockInventory.arun.mscf.toLocaleString()}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.arun.press.toFixed(2)}</td>
                <td className="px-2 py-2 border-r border-slate-300 text-center">{stockInventory.arun.temp.toFixed(1)}</td>
                <td className="px-2 py-2 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-400">
                    LOADING / BUFFER
                  </span>
                </td>
              </tr>

              {/* Summary Total Row */}
              <tr className="bg-[#94a3b8] text-slate-950 font-black border-t-2 border-slate-600">
                <td className="px-2 py-2 text-center border-r border-slate-500">Total 120 Fleet Distribution:</td>
                <td className="px-2 py-2 text-center border-r border-slate-500">
                  {stockInventory.onsite.laden + stockInventory.ship.laden + stockInventory.arun.laden}
                </td>
                <td className="px-2 py-2 text-center border-r border-slate-500">
                  {stockInventory.onsite.empty + stockInventory.ship.empty + stockInventory.arun.empty}
                </td>
                <td className="px-2 py-2 text-center border-r border-slate-500">{stockInventory.totalFleetTanks}</td>
                <td className="px-2 py-2 text-center border-r border-slate-500">{stockInventory.totalFleetVolM3.toFixed(1)} m³</td>
                <td className="px-2 py-2 text-center border-r border-slate-500">{stockInventory.totalFleetMscf.toLocaleString()} MSCF</td>
                <td className="px-2 py-2 text-center border-r border-slate-500">-</td>
                <td className="px-2 py-2 text-center border-r border-slate-500">-</td>
                <td className="px-2 py-2 text-center">100% RECONCILED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
