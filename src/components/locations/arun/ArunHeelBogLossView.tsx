// src/components/locations/arun/ArunHeelBogLossView.tsx
"use client";

import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  FileCheck,
  X,
  Ship,
  TrendingDown,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { exportTransitLossAuditToExcel } from '../../../utils/exportTransitLossAuditExcel';

export default function ArunHeelBogLossView() {
  const portalData = usePortalData() || {};
  const fleetTanks = portalData.fleetTanks || [];
  const certificateRecords: any[] = (portalData as any).certificateRecords || portalData.settlementRecords || [];

  const [calibSearch, setCalibSearch] = useState('');
  const [calibVoyageFilter, setCalibVoyageFilter] = useState('ALL');
  const [calibStatusFilter, setCalibStatusFilter] = useState('ALL');

  const [activeLossAuditModal, setActiveLossAuditModal] = useState<{
    record: any;
    mode: 'NIAS_GROSS' | 'BOG_LOSS_SHEET';
  } | null>(null);

  const calibrationRecords = useMemo(() => {
    const baseSource = certificateRecords.length > 0 ? certificateRecords : fleetTanks.slice(0, 14);

    const list = baseSource.map((rec: any, idx: number) => {
      const BASE_DRY_TARE_KG = 10850;
      const LOADED_CARGO_BASE_KG = 18100;
      const MAX_DESIGN_LOSS_LIMIT_PCT = 1.78;

      const rawShipment = rec.shipment || rec.batchId || `N-${Math.floor(idx / 7) + 1}`;
      const voyageNo = String(rawShipment).startsWith('VOY-')
        ? String(rawShipment)
        : `VOY-2026-${String(rawShipment).replace(/^Batch\s+/i, '')}`;

      const tankNo = rec.tankNo || rec.isoTankNo || `ISOT-${String(idx + 1).padStart(3, '0')}`;
      const serialNo = rec.serialNo || `SN-${90100 + idx}`;

      const densityKgM3 = Number(rec.deliveredDensity ?? rec.densityKgM3 ?? rec.density ?? 442.02);
      const stage1HeelKg = Number(rec.offloadHeelMassKg ?? 310 + (idx % 6) * 18);
      const niasHeelM3 = Number((stage1HeelKg / densityKgM3).toFixed(2));
      const niasEstGrossKg = BASE_DRY_TARE_KG + stage1HeelKg;

      const arunWeighbridgeKg = Number(
        rec.preLoadTare ?? rec.tareKg ?? rec.arrivalGrossKg ?? (10980 + (idx % 5) * 35)
      );

      const transitLossKg = Math.max(0, niasEstGrossKg - arunWeighbridgeKg);
      const actualLossPct = Number(((transitLossKg / LOADED_CARGO_BASE_KG) * 100).toFixed(2));
      const status = actualLossPct <= MAX_DESIGN_LOSS_LIMIT_PCT ? 'PASS' : 'HIGH_LOSS';

      return {
        id: `reconcile-${tankNo}-${idx}`,
        tankNo,
        serialNo,
        voyageNo,
        shipment: rawShipment,
        niasInitPress: 8.0,
        niasTargetPress: 3.0,
        niasHeelM3,
        tempC: -126.5,
        densityKgM3,
        niasEstGrossKg,
        arunWeighbridgeKg,
        transitLossKg,
        actualLossPct,
        designLimitPct: MAX_DESIGN_LOSS_LIMIT_PCT,
        status,
      };
    });
    return list;
  }, [certificateRecords, fleetTanks]);

  const distinctVoyages = useMemo(() => {
    const list = calibrationRecords.map((r) => r.voyageNo);
    return Array.from(new Set(list));
  }, [calibrationRecords]);

  const filteredCalibrationRecords = useMemo(() => {
    return calibrationRecords.filter((r) => {
      const matchVoyage = calibVoyageFilter === 'ALL' || r.voyageNo === calibVoyageFilter;
      const matchStatus = calibStatusFilter === 'ALL' || r.status === calibStatusFilter;
      const matchSearch =
        !calibSearch ||
        r.tankNo.toLowerCase().includes(calibSearch.toLowerCase()) ||
        r.serialNo.toLowerCase().includes(calibSearch.toLowerCase()) ||
        r.voyageNo.toLowerCase().includes(calibSearch.toLowerCase());

      return matchVoyage && matchStatus && matchSearch;
    });
  }, [calibrationRecords, calibVoyageFilter, calibStatusFilter, calibSearch]);

  const calibSums = useMemo(() => {
    const totalCount = filteredCalibrationRecords.length;
    if (totalCount === 0) {
      return {
        totalNiasEstGross: 0,
        totalArunWeighbridge: 0,
        totalTransitLoss: 0,
        avgLossPct: 0,
        overallPass: true,
        passCount: 0,
        totalCount: 0,
        passRate: 100,
      };
    }
    const totalNiasEstGross = filteredCalibrationRecords.reduce((acc, r) => acc + r.niasEstGrossKg, 0);
    const totalArunWeighbridge = filteredCalibrationRecords.reduce((acc, r) => acc + r.arunWeighbridgeKg, 0);
    const totalTransitLoss = filteredCalibrationRecords.reduce((acc, r) => acc + r.transitLossKg, 0);
    const avgLossPct =
      filteredCalibrationRecords.reduce((acc, r) => acc + r.actualLossPct, 0) / totalCount;
    const passCount = filteredCalibrationRecords.filter((r) => r.status === 'PASS').length;
    const passRate = (passCount / totalCount) * 100;
    const overallPass = passCount === totalCount;

    return {
      totalNiasEstGross,
      totalArunWeighbridge,
      totalTransitLoss,
      avgLossPct,
      overallPass,
      passCount,
      totalCount,
      passRate,
    };
  }, [filteredCalibrationRecords]);

  const handleExportExcel = async () => {
    await exportTransitLossAuditToExcel(filteredCalibrationRecords);
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 w-full text-slate-900 font-bold overflow-hidden select-none animate-in fade-in duration-200">
      {/* 1. Header Navigation Bar */}
      <section className="shrink-0 win-panel px-3 py-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-blue-950 flex items-center gap-2">
            <span>PAGT (Arun) &gt; Heel &amp; BOG Loss Audit</span>
          </h2>
          <p className="text-xs text-slate-600 font-normal mt-0.5">
            Transit BOG Loss Reconciliation &amp; Nias DP vs Arun Weighbridge Gross Weight Audit Console
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="win-btn flex items-center gap-1.5 px-3 py-1.5 text-slate-900 text-xs font-bold cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-800" />
            <span>Export Audit Report (.XLSX)</span>
          </button>
        </div>
      </section>

      {/* 2. Top KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
        <div className="win-panel p-2.5 flex items-center justify-between bg-white">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Voyages</span>
            <span className="text-base md:text-lg font-black text-[#0a2558] font-mono">
              {distinctVoyages.length} Voyages
            </span>
          </div>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-sm">
            <Ship className="w-5 h-5 text-blue-800" />
          </div>
        </div>

        <div className="win-panel p-2.5 flex items-center justify-between bg-white">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Accumulated Transit Loss</span>
            <span className="text-base md:text-lg font-black text-amber-900 font-mono">
              {calibSums.totalTransitLoss.toLocaleString()} kg
            </span>
          </div>
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-sm">
            <TrendingDown className="w-5 h-5 text-amber-800" />
          </div>
        </div>

        <div className="win-panel p-2.5 flex items-center justify-between bg-white">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Overall Avg Loss Rate</span>
            <span className="text-base md:text-lg font-black text-blue-900 font-mono">
              {calibSums.avgLossPct.toFixed(2)} %
            </span>
          </div>
          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-sm">
            <Percent className="w-5 h-5 text-indigo-800" />
          </div>
        </div>

        <div className="win-panel p-2.5 flex items-center justify-between bg-white">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Audit PASS Rate</span>
            <span className="text-base md:text-lg font-black text-emerald-700 font-mono">
              {calibSums.passRate.toFixed(1)} % ({calibSums.passCount}/{calibSums.totalCount})
            </span>
          </div>
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
        </div>
      </div>

      {/* 3. Main Data Container & Toolbar */}
      <div className="bg-white border border-slate-300 rounded-none overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Toolbar Strip */}
        <div className="p-3 border-b border-slate-200 bg-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by Tank, Serial, Voyage..."
                value={calibSearch}
                onChange={(e) => setCalibSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-none text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Voyage Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 font-bold">Voyage:</span>
              <select
                value={calibVoyageFilter}
                onChange={(e) => setCalibVoyageFilter(e.target.value)}
                className="win-panel rounded-none px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
              >
                <option value="ALL">All Voyages</option>
                {distinctVoyages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 font-bold">Status:</span>
              <select
                value={calibStatusFilter}
                onChange={(e) => setCalibStatusFilter(e.target.value)}
                className="win-panel rounded-none px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PASS">PASS (&le; 1.78%)</option>
                <option value="HIGH_LOSS">HIGH_LOSS (&gt; 1.78%)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-600 font-bold">
              {filteredCalibrationRecords.length} of {calibrationRecords.length} Records
            </span>
          </div>
        </div>

        {/* Table Grid */}
        <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto">
          <table className="w-full table-fixed text-left border-collapse text-xs whitespace-nowrap">
            <thead className="sticky top-0 bg-[#e8e6df] text-[#0a2558] font-bold uppercase tracking-wider border-b border-[#a09e90] z-10 text-center leading-tight select-none text-xs md:text-sm">
              <tr>
                <th className="w-28 py-2.5 px-3 text-center whitespace-nowrap">VOYAGE NO</th>
                <th className="w-28 py-2.5 px-3 text-center whitespace-nowrap">ISO TANK NO</th>
                <th className="w-32 py-2.5 px-3 text-center whitespace-nowrap">SERIAL NO</th>
                <th className="w-36 py-2.5 px-3 text-right pr-4 whitespace-nowrap">
                  NIAS EST GROSS<br /><span className="text-[11px] text-slate-500 font-normal">(KG)</span>
                </th>
                <th className="w-36 py-2.5 px-3 text-right pr-4 whitespace-nowrap">
                  ARUN WEIGHBRIDGE<br /><span className="text-[11px] text-slate-500 font-normal">(KG)</span>
                </th>
                <th className="w-32 py-2.5 px-3 text-right pr-4 whitespace-nowrap">
                  TRANSIT LOSS<br /><span className="text-[11px] text-slate-500 font-normal">(KG)</span>
                </th>
                <th className="w-28 py-2.5 px-3 text-right pr-4 whitespace-nowrap">
                  ACTUAL LOSS<br /><span className="text-[11px] text-slate-500 font-normal">(%)</span>
                </th>
                <th className="w-24 py-2.5 px-3 text-center whitespace-nowrap">
                  DESIGN LIMIT<br /><span className="text-[11px] text-slate-500 font-normal">(%)</span>
                </th>
                <th className="w-24 py-2.5 px-3 text-center whitespace-nowrap">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-sm font-semibold">
              {filteredCalibrationRecords.map((r) => (
                <tr key={r.id} className="bg-white even:bg-[#f8fafc] hover:bg-blue-50/70 transition-colors whitespace-nowrap">
                  <td className="w-28 py-3 px-3 text-center text-slate-700 font-medium font-sans">{r.voyageNo}</td>
                  <td className="w-28 py-3 px-3 text-center font-mono font-bold text-slate-800 text-sm">{r.tankNo}</td>
                  <td className="w-32 py-3 px-3 text-center text-slate-700 font-sans">{r.serialNo}</td>
                  <td
                    onClick={() => setActiveLossAuditModal({ record: r, mode: 'NIAS_GROSS' })}
                    className="w-36 py-3 px-3 text-right pr-4 font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors text-sm"
                    title="Click to view Nias Est Gross calculation breakdown"
                  >
                    {r.niasEstGrossKg.toLocaleString()}
                  </td>
                  <td className="w-36 py-3 px-3 text-right pr-4 font-bold text-slate-800 text-sm">{r.arunWeighbridgeKg.toLocaleString()}</td>
                  <td
                    onClick={() => setActiveLossAuditModal({ record: r, mode: 'BOG_LOSS_SHEET' })}
                    className="w-32 py-3 px-3 text-right pr-4 text-amber-700 hover:text-blue-900 hover:underline cursor-pointer font-extrabold transition-colors text-sm"
                    title="Click to view BOG Loss Estimation Sheet audit"
                  >
                    {r.transitLossKg.toLocaleString()}
                  </td>
                  <td
                    onClick={() => setActiveLossAuditModal({ record: r, mode: 'BOG_LOSS_SHEET' })}
                    className="w-28 py-3 px-3 text-right pr-4 font-bold text-slate-900 hover:text-blue-900 hover:underline cursor-pointer transition-colors text-sm"
                    title="Click to view BOG Loss Estimation Sheet audit"
                  >
                    {r.actualLossPct.toFixed(2)}
                  </td>
                  <td className="w-24 py-3 px-3 text-center text-slate-500 font-medium text-sm font-sans">1.78</td>
                  <td className="w-24 py-3 px-3 text-center font-sans">
                    <span
                      onClick={() => setActiveLossAuditModal({ record: r, mode: 'BOG_LOSS_SHEET' })}
                      className={`inline-flex items-center justify-center rounded px-2.5 py-1 text-xs font-bold cursor-pointer transition-transform hover:scale-105 ${
                        r.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {r.status === 'PASS' ? 'PASS' : 'HIGH_LOSS'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#dfe6ee] text-[#0a2558] font-bold uppercase whitespace-nowrap text-center border-t-2 border-[#a09e90] text-sm">
                <td className="py-3 px-3 text-center font-extrabold font-sans" colSpan={3}>
                  SUM / AVG ({filteredCalibrationRecords.length} Tanks)
                </td>
                <td className="w-36 py-3 px-3 text-right pr-4 font-mono font-black text-blue-900 bg-blue-50/70 text-sm md:text-base">
                  {calibSums.totalNiasEstGross.toLocaleString()}
                </td>
                <td className="w-36 py-3 px-3 text-right pr-4 font-mono font-black text-slate-800 bg-slate-100/70 text-sm md:text-base">
                  {calibSums.totalArunWeighbridge.toLocaleString()}
                </td>
                <td className="w-32 py-3 px-3 text-right pr-4 font-mono font-black text-amber-900 bg-amber-100/60 text-sm md:text-base">
                  {calibSums.totalTransitLoss.toLocaleString()}
                </td>
                <td className="w-28 py-3 px-3 text-right pr-4 font-mono font-black text-blue-900 bg-blue-100/60 text-sm md:text-base">
                  {calibSums.avgLossPct.toFixed(2)}
                </td>
                <td className="w-24 py-3 px-3 text-center font-mono text-slate-600 text-sm">1.78</td>
                <td className="w-24 py-3 px-3 text-center font-sans">
                  <span
                    className={`inline-flex items-center justify-center rounded px-2.5 py-1 text-xs font-bold ${
                      calibSums.overallPass
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {calibSums.overallPass ? 'PASS' : 'HIGH_LOSS'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Large Loss Audit & Breakdown Modal */}
      {activeLossAuditModal && (() => {
        const rec = activeLossAuditModal.record;
        const initialPressure = rec.niasInitPress ?? 8.0;
        const targetPressure = rec.niasTargetPress ?? 3.0;
        const deltaP = initialPressure - targetPressure;
        const temp = rec.tempC ?? rec.temp ?? -126.5;
        const density = rec.densityKgM3 ?? rec.density ?? 442.02;

        const depressurizationLossNm3 = 45.5 * deltaP * 1.0;
        const tempCorrFactor = 288 / (273.15 + temp);
        const lossOfLiquidM3 = (depressurizationLossNm3 * tempCorrFactor) / 600;

        const baselineDryTare = 10850;
        const niasHeelVol = rec.niasHeelM3 ?? Number(((rec.niasEstGrossKg - baselineDryTare) / density).toFixed(2));
        const niasEstGrossKg = baselineDryTare + (niasHeelVol * density);
        const arunWeighbridgeKg = rec.arunWeighbridgeKg;
        const transitLossKg = Math.max(0, niasEstGrossKg - arunWeighbridgeKg);
        const actualLossPct = Number(((transitLossKg / 18100) * 100).toFixed(2));
        const isPass = actualLossPct <= 1.78;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-2xl w-[92vw] max-w-5xl flex flex-col max-h-[90vh] overflow-hidden select-none font-sans">
              {/* Modal Header */}
              <div className="bg-[#0a2558] text-white px-5 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3 font-bold text-base md:text-lg tracking-wide uppercase">
                  <FileCheck className="w-5 h-5 text-cyan-300" />
                  <span>
                    {activeLossAuditModal.mode === 'NIAS_GROSS'
                      ? `NIAS Est Gross Calculation Model - [${rec.tankNo}] (Serial: ${rec.serialNo})`
                      : `BOG LOSS ESTIMATION & AUDIT - [${rec.tankNo}] (Serial: ${rec.serialNo})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLossAuditModal(null)}
                  className="text-slate-300 hover:text-white font-bold p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 md:p-6 overflow-y-auto bg-white space-y-6 text-sm md:text-base text-slate-800 max-h-[calc(90vh-100px)]">
                {activeLossAuditModal.mode === 'NIAS_GROSS' ? (
                  <div className="space-y-5">
                    <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-md">
                      <h4 className="font-extrabold text-[#0a2558] text-base md:text-lg mb-1">
                        NIAS Est Gross Weight Breakdown - {rec.tankNo}
                      </h4>
                      <p className="text-slate-600 text-xs md:text-sm">
                        Calculated from Dry Tare baseline ({baselineDryTare.toLocaleString()} kg) plus real-time residual Heel volume ({niasHeelVol.toFixed(2)} m³ @ {density.toFixed(2)} kg/m³).
                      </p>
                    </div>

                    <div className="border border-slate-300 rounded-md overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#e8e6df] text-[#0a2558] font-bold text-sm md:text-base">
                          <tr>
                            <th className="py-3 px-4 border-b border-slate-300">Parameter / Component</th>
                            <th className="py-3 px-4 border-b border-slate-300 text-right">Value</th>
                            <th className="py-3 px-4 border-b border-slate-300">Unit / Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-sm md:text-base">
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Baseline Dry Tare Weight</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#0a2558]">{baselineDryTare.toLocaleString()}</td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">kg (Standard ISO Tank Spec)</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Heel Volume (Nias DP)</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#0a2558]">
                              {niasHeelVol.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">m³ (@ {targetPressure.toFixed(1)} barg)</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Liquid LNG Density</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#0a2558]">{density.toFixed(2)}</td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">kg/m³ (Standard Molecular Density)</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Residual Heel Fuel Mass</td>
                            <td className="py-3 px-4 text-right font-extrabold text-blue-900">
                              {Math.round(niasHeelVol * density).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">kg ({niasHeelVol.toFixed(2)} m³ × {density.toFixed(2)} kg/m³)</td>
                          </tr>
                          <tr className="bg-blue-50/70 font-bold">
                            <td className="py-3.5 px-4 font-sans text-[#0a2558] text-base md:text-lg">TOTAL NIAS EST GROSS</td>
                            <td className="py-3.5 px-4 text-right text-[#0a2558] font-black text-lg md:text-xl">
                              {Math.round(niasEstGrossKg).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-sans text-blue-900 font-bold text-xs md:text-sm">kg (Dry Tare + Heel Fuel)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-md text-amber-950 font-mono text-sm md:text-base font-bold shadow-sm">
                      <span className="font-extrabold font-sans text-[#0a2558] block mb-1">Calculation Formula:</span>
                      {baselineDryTare.toLocaleString()} kg (Dry Tare) + {Math.round(niasHeelVol * density).toLocaleString()} kg (Heel Fuel) = {Math.round(niasEstGrossKg).toLocaleString()} kg (Total Nias Est Gross)
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-md flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-base md:text-lg">
                          BOG LOSS ESTIMATION &amp; AUDIT - [{rec.tankNo}]
                        </h4>
                        <p className="text-emerald-800 text-xs md:text-sm mt-0.5">
                          Serial: {rec.serialNo} | Nias Departure Pressure: {initialPressure.toFixed(1)} barg &rarr; Target: {targetPressure.toFixed(1)} barg
                        </p>
                      </div>
                      <span
                        className={`px-4 py-1.5 text-xs md:text-sm font-extrabold rounded-md shadow-sm ${
                          isPass
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {isPass
                          ? 'PASS (Integrity Verified)'
                          : 'HIGH_LOSS / INSPECT REQUIRED'}
                      </span>
                    </div>

                    <div className="border border-slate-300 rounded-md overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0a2558] text-white font-bold text-sm md:text-base">
                          <tr>
                            <th className="py-3 px-4 border-b border-[#23457a]">Category / Audit Step</th>
                            <th className="py-3 px-4 border-b border-[#23457a] text-right">Metric Value</th>
                            <th className="py-3 px-4 border-b border-[#23457a]">Reference / Basis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-sm md:text-base">
                          {/* 1. Loaded LNG */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">1. LOADED SPECIFICATION</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Gross Container Volume</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">45.50</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">m³</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Filling Ratio Limit</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">90.00</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">% (IMO Safety Fill Limit)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Loaded LNG Volume</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-blue-900">40.95</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">m³ (45.5 × 90%)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Base Cargo Liquid Mass</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-blue-900">18,100</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg (@ 442.02 kg/m³)</td>
                          </tr>

                          {/* 2. Potential Leaked Loss */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">2. POTENTIAL LEAKED LOSS</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Valves &amp; Gasket Leakage Rate</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">0.20</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">% (approx. 0.082 m³ / 36.25 kg)</td>
                          </tr>

                          {/* 3. Depressurization Loss */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">3. DEPRESSURIZATION LOSS ({initialPressure.toFixed(1)} &rarr; {targetPressure.toFixed(1)} barg)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Loss of Natural Gas (Vapor)</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{depressurizationLossNm3.toFixed(2)}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">Nm³ (45.5 × {deltaP.toFixed(1)} barg)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Temp &amp; Density Correction Factor</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{tempCorrFactor.toFixed(2)}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">Ratio (288 K / (273.15 + {temp.toFixed(1)} °C))</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Loss of Liquid LNG Equivalent</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-amber-800">{lossOfLiquidM3.toFixed(3)}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">m³ (~{Math.round(lossOfLiquidM3 * density)} kg LNG)</td>
                          </tr>

                          {/* 4. Design Loss Benchmark */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">4. DESIGN LOSS BENCHMARK</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Nominal Total Design Loss</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">1.62</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">% of Loaded Cargo</td>
                          </tr>
                          <tr className="bg-amber-100/60 font-bold">
                            <td className="py-2.5 px-4 pl-6 font-sans text-amber-950 font-extrabold">Max Design Limit (10% Margin)</td>
                            <td className="py-2.5 px-4 text-right font-black text-amber-950 text-base">1.78</td>
                            <td className="py-2.5 px-4 font-sans text-amber-950 font-extrabold text-xs md:text-sm">% (Allowable Threshold)</td>
                          </tr>

                          {/* 5. Actual Verified Loss */}
                          <tr className="bg-blue-100/80 font-bold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">5. ACTUAL VERIFIED FIELD LOSS (RECONCILIATION)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Nias Est Gross Weight</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{Math.round(niasEstGrossKg).toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Arun Weighbridge Gross Weight</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{arunWeighbridgeKg.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Measured Transit Loss</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-amber-900">{transitLossKg.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg (Nias Gross - Arun Weighbridge)</td>
                          </tr>
                          <tr className="bg-emerald-100/80 font-black">
                            <td className="py-3 px-4 pl-6 font-sans text-emerald-950 text-base md:text-lg">ACTUAL VERIFIED LOSS RATE</td>
                            <td className="py-3 px-4 text-right text-emerald-950 font-black text-lg md:text-xl">{actualLossPct.toFixed(2)}</td>
                            <td className="py-3 px-4 font-sans text-emerald-900 font-extrabold text-xs md:text-sm">% (Loss / 18,100 kg × 100)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-3.5 bg-[#e8e6df] border-t border-slate-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLossAuditModal(null)}
                  className="bg-[#0a2558] hover:bg-[#16325c] text-white border border-t-blue-400 border-l-blue-400 border-r-[#051636] border-b-[#051636] text-sm font-bold px-6 py-2.5 rounded-sm shadow-md transition-all cursor-pointer"
                >
                  Close Audit Window
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
