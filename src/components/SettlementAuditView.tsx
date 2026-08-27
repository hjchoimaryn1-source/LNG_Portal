// src/components/SettlementAuditView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { exportToCSV } from '../utils/exportCsv';
import {
  Scale,
  AlertTriangle,
  FileCheck,
  TrendingDown,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Download,
  PlusCircle,
  FlaskConical,
  XCircle,
  DollarSign,
  Zap,
  Activity,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

export default function SettlementAuditView() {
  const { settlementRecords, gasCompositions, addFlobossAndGCLog } = usePortalData();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'DISPUTE_ALERT'>('ALL');
  const [isGCModalOpen, setIsGCModalOpen] = useState<boolean>(false);
  const [unitPriceUSD, setUnitPriceUSD] = useState<number>(11.5);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New GC Form State
  const [gcSource, setGcSource] = useState<'Plant Gas GC M-101A/B' | 'FloBoss Gas Chromatograph'>('Plant Gas GC M-101A/B');
  const [gcDate, setGcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gcSamplePoint, setGcSamplePoint] = useState<string>('Gas Header to PLTMG Turbine M-101A');
  const [ch4, setCh4] = useState<number>(90.8);
  const [c2h6, setC2h6] = useState<number>(5.4);
  const [c3h8, setC3h8] = useState<number>(2.7);
  const [iC4, setIC4] = useState<number>(0.42);
  const [nC4, setNC4] = useState<number>(0.48);
  const [n2, setN2] = useState<number>(0.2);
  const [co2, setCo2] = useState<number>(0.0);
  const [ghv, setGhv] = useState<number>(1055.2);

  // Aggregate Energy & Financial Calculations
  const metrics = useMemo(() => {
    let totalDeliveredMMBtu = 0;
    let totalConsumedMMBtu = 0;
    let totalLossesKg = 0;
    let disputeAlertsCount = 0;

    settlementRecords.forEach((r) => {
      totalDeliveredMMBtu += r.deliveredMMBtu;
      totalConsumedMMBtu += r.consumedMMBtu;
      totalLossesKg += r.lossesKg;
      if (r.disputeStatus === 'DISPUTE_ALERT') disputeAlertsCount++;
    });

    // Simulated PLTMG FloBoss Total (~98.6% of vaporized)
    const totalFloBossMeteredMMBtu = totalConsumedMMBtu * 0.986;
    const netVarianceMMBtu = totalDeliveredMMBtu - totalConsumedMMBtu;
    const avgLossPercentage =
      totalDeliveredMMBtu > 0 ? (netVarianceMMBtu / totalDeliveredMMBtu) * 100 : 0;

    // Financial Settlements
    const totalInvoicedUSD = totalDeliveredMMBtu * unitPriceUSD;
    const totalAcceptedUSD = totalConsumedMMBtu * unitPriceUSD;
    const disputeVarianceUSD = netVarianceMMBtu * unitPriceUSD;

    return {
      totalDeliveredMMBtu,
      totalConsumedMMBtu,
      totalFloBossMeteredMMBtu,
      netVarianceMMBtu,
      totalLossesKg,
      avgLossPercentage,
      disputeAlertsCount,
      totalInvoicedUSD,
      totalAcceptedUSD,
      disputeVarianceUSD,
      totalRecords: settlementRecords.length,
    };
  }, [settlementRecords, unitPriceUSD]);

  // Weathering Molecular Analysis (Arun COQ vs Nias Plant GC)
  const weatheringAnalysis = useMemo(() => {
    const arunCOQ = gasCompositions.find((g) => g.source.includes('COQ') || g.source.includes('Arun')) || {
      methane: 90.24,
      ethane: 5.53,
      propane: 2.87,
      nitrogen: 0.26,
      ghv: 1056.4,
    };

    const plantGC = gasCompositions.find((g) => g.source.includes('Plant') || g.source.includes('GC')) || {
      methane: 90.8,
      ethane: 5.4,
      propane: 2.7,
      nitrogen: 0.2,
      ghv: 1055.2,
    };

    const floBoss = gasCompositions.find((g) => g.source.includes('Floboss') || g.source.includes('FloBoss')) || {
      methane: 91.1,
      ethane: 5.2,
      propane: 2.6,
      nitrogen: 0.18,
      ghv: 1054.8,
    };

    return {
      arunCOQ,
      plantGC,
      floBoss,
      deltaMethane: plantGC.methane - arunCOQ.methane,
      deltaEthane: plantGC.ethane - arunCOQ.ethane,
      deltaPropane: plantGC.propane - arunCOQ.propane,
      deltaNitrogen: plantGC.nitrogen - arunCOQ.nitrogen,
      deltaGHV: plantGC.ghv - arunCOQ.ghv,
    };
  }, [gasCompositions]);

  // Filtered Settlement Records
  const filteredRecords = useMemo(() => {
    return settlementRecords.filter((r) => {
      const matchFilter = statusFilter === 'ALL' || r.disputeStatus === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.tankNo.toLowerCase().includes(q) ||
        r.serialNo.toLowerCase().includes(q) ||
        r.shipment.toLowerCase().includes(q) ||
        r.remarks.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [settlementRecords, statusFilter, searchQuery]);

  const handleGCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gcSource === 'Plant Gas GC M-101A/B') {
      addFlobossAndGCLog(
        {},
        {
          source: gcSource,
          samplePoint: gcSamplePoint,
          reportDate: gcDate,
          methane: ch4,
          ethane: c2h6,
          propane: c3h8,
          iButane: iC4,
          nButane: nC4,
          nitrogen: n2,
          co2,
          ghv,
        }
      );
    } else {
      addFlobossAndGCLog(
        {
          source: gcSource,
          samplePoint: gcSamplePoint,
          reportDate: gcDate,
          methane: ch4,
          ethane: c2h6,
          propane: c3h8,
          iButane: iC4,
          nButane: nC4,
          nitrogen: n2,
          co2,
          ghv,
        },
        {}
      );
    }
    setIsGCModalOpen(false);
    setToastMessage(`Logged ${gcSource} analysis record for ${gcDate}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportLedger = () => {
    exportToCSV(
      'LNG_3Way_Settlement_Audit_Ledger',
      settlementRecords.map((r) => {
        const flobossVal = (r.consumedMMBtu * 0.986).toFixed(2);
        return {
          TankNo: r.tankNo,
          SerialNo: r.serialNo,
          Shipment: r.shipment,
          Date: r.date,
          ArunDeliveredMMBtu: r.deliveredMMBtu,
          NiasVaporizedMMBtu: r.consumedMMBtu,
          FloBossMeteredMMBtu: flobossVal,
          LossesKg: r.lossesKg,
          LossesPercent: r.lossesPercent,
          VarianceMMBtu: r.varianceMMBtu,
          DisputeStatus: r.disputeStatus,
          SettlementValueUSD: (r.consumedMMBtu * unitPriceUSD).toFixed(2),
          Remarks: r.remarks,
        };
      })
    );
  };

  const handleExportGC = () => {
    exportToCSV(
      'LNG_Gas_Chromatography_Matrix',
      gasCompositions.map((g) => ({
        Source: g.source,
        SamplePoint: g.samplePoint,
        ReportDate: g.reportDate,
        MethanePct: g.methane,
        EthanePct: g.ethane,
        PropanePct: g.propane,
        iButanePct: g.iButane,
        nButanePct: g.nButane,
        NitrogenPct: g.nitrogen,
        CO2Pct: g.co2,
        GHV_BTU_SCF: g.ghv,
      }))
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 rounded-none shadow-none backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-none p-5 sm:p-6 shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Scale className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">
              Nias PLTMG Supply & Commercial Heat Settlement Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            End-to-end 3-way Custody Transfer reconciliation: Arun PAG Baseline (MMBtu) ➔ Nias Tank Vaporized ➔ PLTMG FloBoss Metered Energy with molecular boil-off weathering audit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGCModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-none text-xs font-semibold shadow-none shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log FloBoss / GC Analysis</span>
          </button>

          <button
            onClick={handleExportLedger}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-none text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Settlement CSV</span>
          </button>
        </div>
      </section>

      {/* 1. PLTMG Commercial Settlement Summary Cards */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-none p-5 sm:p-6 shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">
              PLTMG Monthly Commercial Invoicing & Settlement Summary
            </h3>
          </div>

          {/* Configurable Unit Price Input */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-none border border-slate-800 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">LNG Contract Price:</span>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-emerald-400 font-bold">$</span>
              <input
                type="number"
                step="0.1"
                value={unitPriceUSD}
                onChange={(e) => setUnitPriceUSD(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-emerald-400 font-bold outline-none"
              />
              <span className="text-slate-500">/ MMBtu</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Arun Invoiced Energy */}
          <div className="p-4 rounded-none bg-slate-950/80 border border-blue-500/30">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-sans">
              1. Total Arun Invoiced Energy
            </span>
            <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-0.5">
              {metrics.totalDeliveredMMBtu.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
              <span className="text-xs text-slate-400">MMBtu</span>
            </div>
            <div className="text-xs text-slate-300 font-semibold">
              $ {metrics.totalInvoicedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
            </div>
          </div>

          {/* PLTMG Accepted Heat */}
          <div className="p-4 rounded-none bg-slate-950/80 border border-emerald-500/30">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-sans">
              2. Total PLTMG Accepted Heat
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mb-0.5">
              {metrics.totalConsumedMMBtu.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
              <span className="text-xs text-slate-400">MMBtu</span>
            </div>
            <div className="text-xs text-emerald-300 font-semibold">
              $ {metrics.totalAcceptedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
            </div>
          </div>

          {/* Net BOG Loss & Variance */}
          <div className="p-4 rounded-none bg-slate-950/80 border border-amber-500/30">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-sans">
              3. Net BOG & Transit Variance
            </span>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mb-0.5">
              {metrics.netVarianceMMBtu.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
              <span className="text-xs text-slate-400">MMBtu ({metrics.avgLossPercentage.toFixed(2)}%)</span>
            </div>
            <div className="text-xs text-slate-400">
              ~{metrics.totalLossesKg.toLocaleString()} Kg BOG Boil-Off
            </div>
          </div>

          {/* Disputed Amount / Tolerance */}
          <div
            className={`p-4 rounded-none border ${
              metrics.disputeAlertsCount > 0
                ? 'bg-red-950/30 border-red-500/50 text-red-400'
                : 'bg-slate-950/80 border-slate-800 text-slate-300'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider block mb-1 font-sans text-slate-400">
              4. Commercial Dispute Amount
            </span>
            <div className="text-xl sm:text-2xl font-bold mb-0.5 flex items-center gap-1.5">
              {metrics.disputeAlertsCount > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                  <span>${metrics.disputeVarianceUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </>
              ) : (
                <span className="text-emerald-400">$ 0.00 USD</span>
              )}
            </div>
            <div className="text-xs">
              {metrics.disputeAlertsCount > 0
                ? `${metrics.disputeAlertsCount} Tanks Exceed 5.0% Loss Threshold`
                : 'All shipments within contractual tolerance'}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Molecular Boil-Off Gas (BOG) & Weathering Shift Matrix */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-none overflow-hidden shadow-none">
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-400 shrink-0" />
              BOG Weathering Analysis: Arun COQ Baseline vs Nias Plant GC vs FloBoss
            </h3>
            <p className="text-xs text-slate-400">
              Molecular fraction tracking across supply chain stages to measure nitrogen/methane boil-off shifts
            </p>
          </div>
          <button
            onClick={handleExportGC}
            className="self-start sm:self-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-none text-xs text-slate-300 font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Export GC Matrix
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr className="border-b border-slate-800">
                <th className="p-3">Supply Chain Measurement Node</th>
                <th className="p-3 text-right">CH₄ (Methane)</th>
                <th className="p-3 text-right">C₂H₆ (Ethane)</th>
                <th className="p-3 text-right">C₃H₈ (Propane)</th>
                <th className="p-3 text-right">N₂ (Nitrogen)</th>
                <th className="p-3 text-right">GHV (BTU/SCF)</th>
                <th className="p-3 text-center">Weathering Shift Delta</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-800/60 font-mono">
              <tr className="bg-blue-950/10">
                <td className="p-3 font-sans">
                  <span className="font-bold text-blue-400 block">1. Arun PAG Lab COQ (Baseline)</span>
                  <span className="text-[10px] text-slate-400">Loading Certificate Lab Sample</span>
                </td>
                <td className="p-3 text-right font-bold text-slate-100">{weatheringAnalysis.arunCOQ.methane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-300">{weatheringAnalysis.arunCOQ.ethane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-300">{weatheringAnalysis.arunCOQ.propane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-400">{weatheringAnalysis.arunCOQ.nitrogen.toFixed(2)}%</td>
                <td className="p-3 text-right font-bold text-emerald-400">{weatheringAnalysis.arunCOQ.ghv.toFixed(1)}</td>
                <td className="p-3 text-center font-sans text-[11px] text-blue-400 font-semibold">Baseline (0.00%)</td>
              </tr>

              <tr className="bg-purple-950/10">
                <td className="p-3 font-sans">
                  <span className="font-bold text-purple-400 block">2. Nias Plant GC M-101A/B</span>
                  <span className="text-[10px] text-slate-400">PLTMG Gas Turbine Header</span>
                </td>
                <td className="p-3 text-right font-bold text-slate-100">{weatheringAnalysis.plantGC.methane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-300">{weatheringAnalysis.plantGC.ethane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-300">{weatheringAnalysis.plantGC.propane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-400">{weatheringAnalysis.plantGC.nitrogen.toFixed(2)}%</td>
                <td className="p-3 text-right font-bold text-emerald-400">{weatheringAnalysis.plantGC.ghv.toFixed(1)}</td>
                <td className="p-3 text-center font-mono text-[11px]">
                  <span className={weatheringAnalysis.deltaMethane >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {weatheringAnalysis.deltaMethane >= 0 ? `+${weatheringAnalysis.deltaMethane.toFixed(2)}%` : `${weatheringAnalysis.deltaMethane.toFixed(2)}%`} CH₄
                  </span>
                </td>
              </tr>

              <tr className="bg-emerald-950/10">
                <td className="p-3 font-sans">
                  <span className="font-bold text-emerald-400 block">3. PLTMG FloBoss Flow Computer</span>
                  <span className="text-[10px] text-slate-400">Custody Metering Skid A/B</span>
                </td>
                <td className="p-3 text-right font-bold text-slate-100">{weatheringAnalysis.floBoss.methane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-300">{weatheringAnalysis.floBoss.ethane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-300">{weatheringAnalysis.floBoss.propane.toFixed(2)}%</td>
                <td className="p-3 text-right text-slate-400">{weatheringAnalysis.floBoss.nitrogen.toFixed(2)}%</td>
                <td className="p-3 text-right font-bold text-emerald-400">{weatheringAnalysis.floBoss.ghv.toFixed(1)}</td>
                <td className="p-3 text-center font-mono text-[11px] text-emerald-400">
                  <span>{(weatheringAnalysis.floBoss.ghv - weatheringAnalysis.arunCOQ.ghv).toFixed(1)} BTU/SCF</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 3-Way Custody Transfer Reconciliation Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-none overflow-hidden shadow-none">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400 shrink-0" />
              3-Way Custody Transfer Reconciliation Table
            </h3>
            <p className="text-xs text-slate-400">
              Cross-validating 1) Arun Baseline MMBtu vs 2) Nias Tank Vaporized vs 3) PLTMG FloBoss Metered Energy
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Tank / Shipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-none text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-none border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-none transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-indigo-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({settlementRecords.length})
              </button>
              <button
                onClick={() => setStatusFilter('DISPUTE_ALERT')}
                className={`px-2.5 py-1 rounded-none transition-colors flex items-center gap-1 ${
                  statusFilter === 'DISPUTE_ALERT'
                    ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30'
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Disputes ({metrics.disputeAlertsCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('VERIFIED')}
                className={`px-2.5 py-1 rounded-none transition-colors ${
                  statusFilter === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Verified
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr className="border-b border-slate-800">
                <th className="p-3">Tank / Serial</th>
                <th className="p-3">Shipment / Date</th>
                <th className="p-3 text-right">1) Arun Delivered (MMBtu)</th>
                <th className="p-3 text-right">2) Nias Vaporized (MMBtu)</th>
                <th className="p-3 text-right">3) FloBoss Metered (MMBtu)</th>
                <th className="p-3 text-right">BOG Loss (Kg / %)</th>
                <th className="p-3 text-right">Variance (MMBtu)</th>
                <th className="p-3 text-right">Settlement (USD)</th>
                <th className="p-3 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-800/60 font-mono">
              {filteredRecords.map((rec) => {
                const isDispute = rec.disputeStatus === 'DISPUTE_ALERT';
                const flobossEst = (rec.consumedMMBtu * 0.986).toFixed(2);
                const settlementUSD = (rec.consumedMMBtu * unitPriceUSD).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                });

                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isDispute ? 'bg-red-950/15' : 'bg-transparent'
                    }`}
                  >
                    <td className="p-3">
                      <span className="font-bold text-blue-400 block">{rec.tankNo}</span>
                      <span className="text-[10px] text-slate-500">{rec.serialNo}</span>
                    </td>
                    <td className="p-3 font-sans">
                      <span className="text-slate-300 font-semibold block">{rec.shipment}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{rec.date}</span>
                    </td>
                    <td className="p-3 text-right text-blue-400 font-bold">
                      {rec.deliveredMMBtu.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-bold">
                      {rec.consumedMMBtu.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-purple-400 font-medium">
                      {flobossEst}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-semibold block ${
                          isDispute ? 'text-red-400' : 'text-slate-300'
                        }`}
                      >
                        {rec.lossesKg.toLocaleString()} kg
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isDispute ? 'text-red-400' : 'text-slate-500'
                        }`}
                      >
                        ({rec.lossesPercent.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-amber-400">
                      {rec.varianceMMBtu > 0 ? `+${rec.varianceMMBtu.toFixed(2)}` : rec.varianceMMBtu.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-200">
                      ${settlementUSD}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                          isDispute
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-none animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isDispute ? (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Dispute Alert (&gt;5%)
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-3 h-3" /> Verified OK
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 font-sans">
                    No settlement records found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log FloBoss / Plant GC Analysis Modal */}
      {isGCModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-none max-w-lg w-full p-6 shadow-none animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-400" />
                Log Gas Chromatography Analysis
              </h3>
              <button onClick={() => setIsGCModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGCSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Instrument Source:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGcSource('Plant Gas GC M-101A/B');
                      setGcSamplePoint('Gas Header to PLTMG Turbine M-101A');
                    }}
                    className={`py-2 px-3 rounded-none border text-center font-semibold transition-all ${
                      gcSource === 'Plant Gas GC M-101A/B'
                        ? 'bg-purple-600/20 text-purple-400 border-purple-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Plant Gas GC M-101A/B
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGcSource('FloBoss Gas Chromatograph');
                      setGcSamplePoint('Metering Skid Run A/B Flow Computer');
                    }}
                    className={`py-2 px-3 rounded-none border text-center font-semibold transition-all ${
                      gcSource === 'FloBoss Gas Chromatograph'
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    FloBoss Gas Meter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Report Date:</label>
                  <input
                    type="date"
                    value={gcDate}
                    onChange={(e) => setGcDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Sample Point:</label>
                  <input
                    type="text"
                    value={gcSamplePoint}
                    onChange={(e) => setGcSamplePoint(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-none border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block mb-1">Component Breakdown (%):</span>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="text-slate-400 text-[10px] block">CH₄ (Methane):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ch4}
                      onChange={(e) => setCh4(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">C₂H₆ (Ethane):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={c2h6}
                      onChange={(e) => setC2h6(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">C₃H₈ (Propane):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={c3h8}
                      onChange={(e) => setC3h8(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">i-C₄:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={iC4}
                      onChange={(e) => setIC4(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">n-C₄:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nC4}
                      onChange={(e) => setNC4(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">N₂ (Nitrogen):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={n2}
                      onChange={(e) => setN2(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">GHV (BTU/SCF):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={ghv}
                    onChange={(e) => setGhv(parseFloat(e.target.value) || 0)}
                    className="w-28 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-emerald-400 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGCModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-none font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-none font-semibold shadow-none shadow-indigo-500/20"
                >
                  Save GC Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
