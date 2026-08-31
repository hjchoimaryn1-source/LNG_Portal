// src/components/locations/nias/NiasGasQualityTab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Calendar,
  CheckCircle2,
  Gauge,
  Save,
  RotateCcw,
  Thermometer,
  Clock,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';
import { NodeState } from '@/types/lng';
import {
  MeterCumulativeFlow,
  MeterDailyFlow,
  MeterGasCondition,
  GasMolecularComposition,
} from '@/types/gasQuality';
import { INITIAL_GAS_QUALITY_MASTER_RECORDS } from '@/data/gasQualityMasterData';

export default function NiasGasQualityTab() {
  const portalData = usePortalData();
  const fleetTanks = portalData?.fleetTanks || [];
  const gasQualityRecords = portalData?.gasQualityRecords || INITIAL_GAS_QUALITY_MASTER_RECORDS;
  const saveGasQualityRecord = portalData?.saveGasQualityRecord;

  // In-Place Form State
  const [entryDate, setEntryDate] = useState<string>('2026-08-30');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Section 1: Cumulative
  const [cumMeterA, setCumMeterA] = useState<MeterCumulativeFlow>({
    uvol: 8.92,
    cvol: 8.94,
    massTonne: 178.50,
    mmbtu: 9371.25,
  });
  const [cumMeterB, setCumMeterB] = useState<MeterCumulativeFlow>({
    uvol: 9.85,
    cvol: 9.86,
    massTonne: 197.10,
    mmbtu: 10347.80,
  });
  const [cumStation, setCumStation] = useState<MeterCumulativeFlow>({
    uvol: 18.77,
    cvol: 18.80,
    massTonne: 375.60,
    mmbtu: 28741.05,
  });

  // Section 2: Daily
  const [dailyMeterA, setDailyMeterA] = useState<MeterDailyFlow>({
    uvol: 0.25,
    cvol: 0.25,
    massTonne: 5.02,
    mmbtu: 263.50,
  });
  const [dailyMeterB, setDailyMeterB] = useState<MeterDailyFlow>({
    uvol: 0.26,
    cvol: 0.26,
    massTonne: 5.21,
    mmbtu: 273.45,
  });
  const [dailyStation, setDailyStation] = useState<MeterDailyFlow>({
    uvol: 0.51,
    cvol: 0.51,
    massTonne: 10.23,
    mmbtu: 536.95,
  });

  // Section 3: Condition
  const [conditionMeterA, setConditionMeterA] = useState<MeterGasCondition>({
    pressBarg: 2.18,
    tempC: 24.5,
    lineDens: 2.18,
    lineZf: 0.9942,
    ghv: 1049.85,
  });
  const [conditionMeterB, setConditionMeterB] = useState<MeterGasCondition>({
    pressBarg: 2.16,
    tempC: 24.2,
    lineDens: 2.16,
    lineZf: 0.9945,
    ghv: 1049.85,
  });

  // Section 4: GC Molecular
  const [gcActiveTank, setGcActiveTank] = useState<GasMolecularComposition>({
    ch4: 96.5341,
    c2h6: 2.7050,
    c3h8: 0.5096,
    iC4: 0.0750,
    nC4: 0.0820,
    iC5: 0.0050,
    nC5: 0.0050,
    n2: 0.0301,
    co2: 0.0000,
  });
  const [gcMeterA, setGcMeterA] = useState<GasMolecularComposition>({
    ch4: 96.5341,
    c2h6: 2.7050,
    c3h8: 0.5096,
    iC4: 0.0750,
    nC4: 0.0820,
    iC5: 0.0050,
    nC5: 0.0050,
    n2: 0.0301,
    co2: 0.0000,
  });
  const [gcMeterB, setGcMeterB] = useState<GasMolecularComposition>({
    ch4: 96.5341,
    c2h6: 2.7050,
    c3h8: 0.5096,
    iC4: 0.0750,
    nC4: 0.0820,
    iC5: 0.0050,
    nC5: 0.0050,
    n2: 0.0301,
    co2: 0.0000,
  });

  // Active feeding tank
  const primaryActiveTank = useMemo(() => {
    const active = (fleetTanks || []).find(
      (t) =>
        t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
        Boolean(t.isMountedToBay) ||
        (t.location && t.location.includes('BAY'))
    );
    return {
      tankNo: active?.tankNo || 'ISOT-009',
      serialNo: active?.serialNo || 'IT-99201',
      bayTag: active?.isMountedToBay || 'BAY-01',
    };
  }, [fleetTanks]);

  // Summary Metrics from Portal masterRecords
  const summaryMetrics = useMemo(() => {
    const records = gasQualityRecords || [];
    const totalEnergy = records.reduce((sum, r) => sum + (r.dailyStation?.mmbtu || 0), 0);
    const totalVolMscf = records.reduce((sum, r) => sum + (r.dailyStation?.cvol || 0), 0);
    const totalMassTonne = records.reduce((sum, r) => sum + (r.dailyStation?.massTonne || 0), 0);
    const avgGhv =
      records.length > 0
        ? records.reduce((sum, r) => sum + (r.conditionMeterA?.ghv || 0), 0) / records.length
        : 1049.7;
    const avgMethane =
      records.length > 0
        ? records.reduce((sum, r) => sum + (r.gcMeterA?.ch4 || 0), 0) / records.length
        : 96.53;

    return {
      totalEnergy,
      totalVolMscf,
      totalMassTonne,
      avgGhv,
      avgMethane,
      recordCount: records.length,
    };
  }, [gasQualityRecords]);

  // Populate from date
  const populateFormFromDate = (targetDate: string) => {
    setEntryDate(targetDate);
    const found = gasQualityRecords.find((r) => r.date === targetDate);
    if (found) {
      setCumMeterA(found.cumMeterA);
      setCumMeterB(found.cumMeterB);
      setCumStation(found.cumStation);
      setDailyMeterA(found.dailyMeterA);
      setDailyMeterB(found.dailyMeterB);
      setDailyStation(found.dailyStation);
      setConditionMeterA(found.conditionMeterA);
      setConditionMeterB(found.conditionMeterB);
      setGcActiveTank(found.gcActiveTank);
      setGcMeterA(found.gcMeterA);
      setGcMeterB(found.gcMeterB);
      showToast(`Loaded log entry for ${targetDate}`);
    } else {
      showToast(`Ready to record fresh daily entry for ${targetDate}`);
    }
  };

  // Functional Reset Handler (Preserves Arun Feed Tank data)
  const resetDailyGasForm = React.useCallback(() => {
    // Reset manual entry variables to clean zeros
    setCumMeterA({ uvol: 0, cvol: 0, massTonne: 0, mmbtu: 0 });
    setCumMeterB({ uvol: 0, cvol: 0, massTonne: 0, mmbtu: 0 });
    setCumStation({ uvol: 0, cvol: 0, massTonne: 0, mmbtu: 0 });
    setDailyMeterA({ uvol: 0, cvol: 0, massTonne: 0, mmbtu: 0 });
    setDailyMeterB({ uvol: 0, cvol: 0, massTonne: 0, mmbtu: 0 });
    setDailyStation({ uvol: 0, cvol: 0, massTonne: 0, mmbtu: 0 });
    setConditionMeterA({ pressBarg: 0, tempC: 0, lineDens: 0, lineZf: 1.0, ghv: 0 });
    setConditionMeterB({ pressBarg: 0, tempC: 0, lineDens: 0, lineZf: 1.0, ghv: 0 });
    // gcActiveTank is preserved (Arun Terminal origin data)
    setGcMeterA({ ch4: 0, c2h6: 0, c3h8: 0, iC4: 0, nC4: 0, iC5: 0, nC5: 0, n2: 0, co2: 0 });
    setGcMeterB({ ch4: 0, c2h6: 0, c3h8: 0, iC4: 0, nC4: 0, iC5: 0, nC5: 0, n2: 0, co2: 0 });

    // Also reset any uncontrolled DOM fields except Feed Tank fields
    if (typeof document !== 'undefined') {
      const formInputs = document.querySelectorAll(
        '#daily-gas-form input:not(.feed-tank-field), #daily-gas-form select:not(.feed-tank-field)'
      );
      formInputs.forEach((input: any) => {
        if (input.type !== 'date' && input.type !== 'submit' && input.type !== 'button') {
          input.value = '';
        }
      });
    }

    showToast('✓ Daily Gas Metering manual entries have been reset (Feed Tank preserved).');
    console.log('Daily Gas Metering manual entries reset (Feed Tank preserved).');
  }, []);

  // Expose reset handler globally for external/DOM invocation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetDailyGasForm = resetDailyGasForm;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).resetDailyGasForm;
      }
    };
  }, [resetDailyGasForm]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveGasQualityRecord) {
      saveGasQualityRecord({
        date: entryDate,
        status: 'DELIVERED',
        activeFeedTank: primaryActiveTank.tankNo,
        serialNo: primaryActiveTank.serialNo,
        cumMeterA,
        cumMeterB,
        cumStation,
        dailyMeterA,
        dailyMeterB,
        dailyStation,
        conditionMeterA,
        conditionMeterB,
        gcActiveTank,
        gcMeterA,
        gcMeterB,
        submittedAt: `${new Date().toLocaleTimeString('en-GB')} WIB`,
      });
    }
    showToast(`✓ Daily Gas Metering & GC Report for ${entryDate} saved successfully!`);
  };

  return (
    <div className="space-y-3 font-sans pb-10">
      {/* 1. [TOP BANNER] Summary Metrics (6 KPI Cards with Dark Navy Ribbon) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Card 1: Daily Delivered Energy */}
        <div className="bg-white border border-slate-300 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            DAILY DELIVERED ENERGY
          </div>
          <div className="p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-xl font-black text-slate-900 block">
              {summaryMetrics.totalEnergy.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
              MMBTU <span className="text-slate-400 font-normal">(Daily Station Total)</span>
            </span>
          </div>
        </div>

        {/* Card 2: Daily Gas Volume */}
        <div className="bg-white border border-slate-300 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            DAILY GAS VOLUME
          </div>
          <div className="p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-xl font-black text-slate-900 block">
              {summaryMetrics.totalVolMscf.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
              MMCF <span className="text-slate-400 font-normal">(Daily Station CVOL)</span>
            </span>
          </div>
        </div>

        {/* Card 3: Daily LNG Mass */}
        <div className="bg-white border border-slate-300 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            DAILY LNG MASS
          </div>
          <div className="p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-xl font-black text-slate-900 block">
              {summaryMetrics.totalMassTonne.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
              Tonne <span className="text-slate-400 font-normal">(Daily Total Mass)</span>
            </span>
          </div>
        </div>

        {/* Card 4: Daily Avg GHV */}
        <div className="bg-white border border-slate-300 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            DAILY AVG GHV
          </div>
          <div className="p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-xl font-black text-slate-900 block">
              {summaryMetrics.avgGhv.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
              BTU/Scf <span className="text-slate-400 font-normal">(Daily Average Quality)</span>
            </span>
          </div>
        </div>

        {/* Card 5: Daily Avg Methane */}
        <div className="bg-white border border-slate-300 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            DAILY AVG METHANE (CH₄)
          </div>
          <div className="p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-xl font-black text-slate-900 block">
              {summaryMetrics.avgMethane.toFixed(2)} %
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
              Mol % <span className="text-slate-400 font-normal">(Daily Methane Spec)</span>
            </span>
          </div>
        </div>

        {/* Card 6: Active Feed */}
        <div className="bg-white border border-slate-300 rounded-none overflow-hidden font-mono flex flex-col justify-between shadow-2xs">
          <div className="bg-[#2d3748] text-white py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            ACTIVE FEED
          </div>
          <div className="p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-xl font-black text-slate-900 block">
              {primaryActiveTank.tankNo}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
              Feed: <strong className="text-slate-800">{primaryActiveTank.tankNo}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. [MAIN FORM] Daily Gas Metering (Scrollable Container) */}
      <form
        id="daily-gas-form"
        onSubmit={handleSaveDailyLog}
        className="bg-white border border-slate-300 rounded-none shadow-2xs overflow-hidden flex flex-col max-h-[calc(100vh-210px)]"
      >
        {/* Form Title & Control Bar (Clean Engineering Header) */}
        <div className="p-3 sm:py-2 sm:px-4 bg-[#334155] text-white border-b border-slate-600 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="text-sm font-black text-white tracking-wider uppercase font-mono">
              DAILY GAS METERING
            </h4>

            {/* Active Feed Badge (Simplified) */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono font-bold bg-[#1e293b] text-emerald-300 border border-slate-500 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Active Feed: <strong>{primaryActiveTank.tankNo}</strong>
              </span>
            </span>

            {/* Gas Day Reference Window Badge (Moved next to Active Feed) */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono font-bold bg-[#1e293b] text-cyan-300 border border-slate-500 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Gas Day: <strong>00:00 ~ 00:00</strong>
              </span>
            </span>
          </div>

          {/* Right Controls: Single Date Picker + Reset Button (Classic Gray SCADA Style) */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {/* Classic Light Gray Date Picker */}
            <input
              type="date"
              id="gas-metering-date"
              value={entryDate}
              onChange={(e) => populateFormFromDate(e.target.value)}
              className="bg-[#f1f5f9] hover:bg-white text-slate-900 border border-slate-400 px-2.5 py-1 rounded text-xs font-mono font-bold focus:outline-none cursor-pointer [color-scheme:light] shadow-xs transition-colors"
            />

            {/* Classic Light Gray Reset Form Button */}
            <button
              type="button"
              id="reset-daily-gas-btn"
              onClick={resetDailyGasForm}
              className="bg-[#e2e8f0] hover:bg-slate-300 active:bg-slate-400 text-slate-900 hover:text-black px-3 py-1 rounded border border-slate-400 shadow-xs text-xs flex items-center space-x-1.5 font-mono font-bold cursor-pointer transition-colors"
            >
              <span>↺ Reset Form</span>
            </button>
          </div>
        </div>

        {/* Form Body: High-Contrast Slate Sections (Scrollable Area) */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-400">
          {/* ========================================================================= */}
          {/* [SECTION 1 & 2] Unified Cumulative & Daily Metering Matrix                 */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-none bg-[#334155] text-white border border-[#1e293b] text-[10px] font-bold font-mono shadow-2xs">
                SECTION 1 &amp; 2
              </span>
              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                <Gauge className="w-3.5 h-3.5 text-slate-700" />
                Station &amp; Dual Meter Runs (Cumulative &amp; Daily Flow/Energy)
              </h5>
            </div>

            <div className="overflow-x-auto rounded-none border-2 border-slate-600 bg-white shadow-2xs">
              <table className="w-full text-xs text-center border-collapse font-mono">
                <thead>
                  {/* Tier 1 Header: Clean Light Blue-Gray Stream Blocks with Strong Separators */}
                  <tr className="border-b-2 border-slate-600 text-[10px] uppercase font-bold text-slate-900">
                    <th className="px-3 py-2 bg-[#94a3b8] text-slate-900 border-r-2 border-slate-600 w-28 text-center font-black">
                      FLOW TYPE
                    </th>
                    <th colSpan={4} className="px-3 py-2 bg-[#cbd5e1] text-slate-900 border-r-2 border-slate-600 text-center tracking-wider font-black">
                      M-101A (RUN 1)
                    </th>
                    <th colSpan={4} className="px-3 py-2 bg-[#b8c7db] text-slate-900 border-r-2 border-slate-600 text-center tracking-wider font-black">
                      M-101B (RUN 2)
                    </th>
                    <th colSpan={4} className="px-3 py-2 bg-[#94a3b8] text-slate-950 text-center font-black tracking-wider">
                      STATION (TOTAL)
                    </th>
                  </tr>
                  {/* Tier 2 Sub-columns: Distinct Grid Borders with Clear Contrast */}
                  <tr className="bg-[#e2e8f0] text-slate-900 border-b-2 border-slate-600 text-[9px] uppercase font-bold text-center">
                    <th className="px-2 py-1.5 bg-[#94a3b8] text-slate-900 border-r-2 border-slate-600 text-center font-black">PERIOD</th>
                    {/* M-101A */}
                    <th className="px-1.5 py-1.5 border-r border-slate-400">UVOL (MMCF)</th>
                    <th className="px-1.5 py-1.5 border-r border-slate-400">CVOL (MMCF)</th>
                    <th className="px-1.5 py-1.5 border-r border-slate-400">MASS (T)</th>
                    <th className="px-1.5 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#d5deea]">ENERGY (MMBTU)</th>
                    {/* M-101B */}
                    <th className="px-1.5 py-1.5 border-r border-slate-400">UVOL (MMCF)</th>
                    <th className="px-1.5 py-1.5 border-r border-slate-400">CVOL (MMCF)</th>
                    <th className="px-1.5 py-1.5 border-r border-slate-400">MASS (T)</th>
                    <th className="px-1.5 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#d5deea]">ENERGY (MMBTU)</th>
                    {/* STATION */}
                    <th className="px-1.5 py-1.5 border-r border-slate-400">UVOL (MMCF)</th>
                    <th className="px-1.5 py-1.5 border-r border-slate-400">CVOL (MMCF)</th>
                    <th className="px-1.5 py-1.5 border-r border-slate-400">MASS (T)</th>
                    <th className="px-1.5 py-1.5 font-black text-slate-950 bg-[#cbd5e1]">ENERGY (MMBTU)</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-400">
                  {/* Row 1: Cumulative */}
                  <tr className="bg-slate-100 hover:bg-slate-200/60">
                    <td className="px-2.5 py-1.5 bg-[#cbd5e1] border-r-2 border-slate-600 text-center font-black text-slate-900 whitespace-nowrap">
                      CUMULATIVE
                    </td>
                    {/* M-101A Cumulative */}
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterA.uvol}
                        onChange={(e) => setCumMeterA({ ...cumMeterA, uvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterA.cvol}
                        onChange={(e) => setCumMeterA({ ...cumMeterA, cvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterA.massTonne}
                        onChange={(e) => setCumMeterA({ ...cumMeterA, massTonne: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r-2 border-slate-600">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterA.mmbtu}
                        onChange={(e) => setCumMeterA({ ...cumMeterA, mmbtu: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>

                    {/* M-101B Cumulative */}
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterB.uvol}
                        onChange={(e) => setCumMeterB({ ...cumMeterB, uvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterB.cvol}
                        onChange={(e) => setCumMeterB({ ...cumMeterB, cvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterB.massTonne}
                        onChange={(e) => setCumMeterB({ ...cumMeterB, massTonne: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r-2 border-slate-600">
                      <input
                        type="number"
                        step="0.01"
                        value={cumMeterB.mmbtu}
                        onChange={(e) => setCumMeterB({ ...cumMeterB, mmbtu: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>

                    {/* STATION Cumulative */}
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumStation.uvol}
                        onChange={(e) => setCumStation({ ...cumStation, uvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumStation.cvol}
                        onChange={(e) => setCumStation({ ...cumStation, cvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={cumStation.massTonne}
                        onChange={(e) => setCumStation({ ...cumStation, massTonne: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="0.01"
                        value={cumStation.mmbtu}
                        onChange={(e) => setCumStation({ ...cumStation, mmbtu: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-950 font-black px-1.5 py-1 rounded-none border border-slate-500 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                  </tr>

                  {/* Row 2: Daily */}
                  <tr className="bg-slate-100 hover:bg-slate-200/60">
                    <td className="px-2.5 py-1.5 bg-[#cbd5e1] border-r-2 border-slate-600 text-center font-black text-slate-900 whitespace-nowrap">
                      DAILY
                    </td>
                    {/* M-101A Daily */}
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterA.uvol}
                        onChange={(e) => setDailyMeterA({ ...dailyMeterA, uvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterA.cvol}
                        onChange={(e) => setDailyMeterA({ ...dailyMeterA, cvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterA.massTonne}
                        onChange={(e) => setDailyMeterA({ ...dailyMeterA, massTonne: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r-2 border-slate-600">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterA.mmbtu}
                        onChange={(e) => setDailyMeterA({ ...dailyMeterA, mmbtu: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>

                    {/* M-101B Daily */}
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterB.uvol}
                        onChange={(e) => setDailyMeterB({ ...dailyMeterB, uvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterB.cvol}
                        onChange={(e) => setDailyMeterB({ ...dailyMeterB, cvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterB.massTonne}
                        onChange={(e) => setDailyMeterB({ ...dailyMeterB, massTonne: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r-2 border-slate-600">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyMeterB.mmbtu}
                        onChange={(e) => setDailyMeterB({ ...dailyMeterB, mmbtu: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>

                    {/* STATION Daily */}
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyStation.uvol}
                        onChange={(e) => setDailyStation({ ...dailyStation, uvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyStation.cvol}
                        onChange={(e) => setDailyStation({ ...dailyStation, cvol: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyStation.massTonne}
                        onChange={(e) => setDailyStation({ ...dailyStation, massTonne: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="0.01"
                        value={dailyStation.mmbtu}
                        onChange={(e) => setDailyStation({ ...dailyStation, mmbtu: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-950 font-black px-1.5 py-1 rounded-none border border-slate-500 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* [SECTION 3] Gas Condition & Physical Properties                           */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-none bg-[#334155] text-white border border-[#1e293b] text-[10px] font-bold font-mono shadow-2xs">
                SECTION 3
              </span>
              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                <Thermometer className="w-3.5 h-3.5 text-slate-700" />
                Gas Condition &amp; Physical Properties (Pressure, Temp, Density &amp; GHV)
              </h5>
            </div>

            <div className="overflow-x-auto rounded-none border-2 border-slate-600 bg-white shadow-2xs">
              <table className="w-full text-xs text-center border-collapse font-mono">
                <thead>
                  <tr className="border-b-2 border-slate-600 text-[10px] uppercase font-bold text-slate-900">
                    <th colSpan={5} className="px-3 py-2 bg-[#cbd5e1] text-slate-900 border-r-2 border-slate-600 text-center tracking-wider font-black">
                      M-101A (RUN 1)
                    </th>
                    <th colSpan={5} className="px-3 py-2 bg-[#b8c7db] text-slate-900 text-center tracking-wider font-black">
                      M-101B (RUN 2)
                    </th>
                  </tr>
                  <tr className="bg-[#e2e8f0] text-slate-900 border-b-2 border-slate-600 text-[9px] uppercase font-bold text-center">
                    {/* M-101A */}
                    <th className="px-2 py-1.5 border-r border-slate-400">PRESS (BARG)</th>
                    <th className="px-2 py-1.5 border-r border-slate-400">TEMP (℃)</th>
                    <th className="px-2 py-1.5 border-r border-slate-400">DENSITY (KG/㎥)</th>
                    <th className="px-2 py-1.5 border-r border-slate-400">COMPRESS (ZF)</th>
                    <th className="px-2 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#d5deea]">GHV (BTU/SCF)</th>
                    {/* M-101B */}
                    <th className="px-2 py-1.5 border-r border-slate-400">PRESS (BARG)</th>
                    <th className="px-2 py-1.5 border-r border-slate-400">TEMP (℃)</th>
                    <th className="px-2 py-1.5 border-r border-slate-400">DENSITY (KG/㎥)</th>
                    <th className="px-2 py-1.5 border-r border-slate-400">COMPRESS (ZF)</th>
                    <th className="px-2 py-1.5 font-black text-slate-950 bg-[#d5deea]">GHV (BTU/SCF)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-100 hover:bg-slate-200/60 font-mono">
                    {/* M-101A Inputs */}
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterA.pressBarg}
                        onChange={(e) => setConditionMeterA({ ...conditionMeterA, pressBarg: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterA.tempC}
                        onChange={(e) => setConditionMeterA({ ...conditionMeterA, tempC: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterA.lineDens}
                        onChange={(e) => setConditionMeterA({ ...conditionMeterA, lineDens: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={conditionMeterA.lineZf}
                        onChange={(e) => setConditionMeterA({ ...conditionMeterA, lineZf: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5 border-r-2 border-slate-600">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterA.ghv}
                        onChange={(e) => setConditionMeterA({ ...conditionMeterA, ghv: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#cbd5e1] text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>

                    {/* M-101B Inputs */}
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterB.pressBarg}
                        onChange={(e) => setConditionMeterB({ ...conditionMeterB, pressBarg: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterB.tempC}
                        onChange={(e) => setConditionMeterB({ ...conditionMeterB, tempC: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterB.lineDens}
                        onChange={(e) => setConditionMeterB({ ...conditionMeterB, lineDens: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={conditionMeterB.lineZf}
                        onChange={(e) => setConditionMeterB({ ...conditionMeterB, lineZf: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-1 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={conditionMeterB.ghv}
                        onChange={(e) => setConditionMeterB({ ...conditionMeterB, ghv: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#cbd5e1] text-slate-900 font-black px-1.5 py-1 rounded-none border border-slate-400 text-center focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs shadow-2xs transition-colors"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* [SECTION 4] Daniel 700 GC Molecular Composition Analysis                  */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-none bg-[#334155] text-white border border-[#1e293b] text-[10px] font-bold font-mono shadow-2xs">
                SECTION 4
              </span>
              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                <FlaskConical className="w-3.5 h-3.5 text-slate-700" />
                Gas Chromatography Molecular Composition (% Mol)
              </h5>
            </div>

            <div className="overflow-x-auto rounded-none border-2 border-slate-600 bg-white shadow-2xs">
              <table className="w-full text-xs text-center border-collapse font-mono">
                <thead>
                  <tr className="bg-[#cbd5e1] text-slate-900 border-b-2 border-slate-600 text-[9px] uppercase font-bold text-center">
                    <th className="px-3 py-2 text-center border-r-2 border-slate-600 min-w-[200px] font-black bg-[#94a3b8]">
                      STREAM / NODE
                    </th>
                    <th className="px-2 py-2 border-r border-slate-400">CH₄ (%)</th>
                    <th className="px-2 py-2 border-r border-slate-400">C₂H₆ (%)</th>
                    <th className="px-2 py-2 border-r border-slate-400">C₃H₈ (%)</th>
                    <th className="px-2 py-2 border-r border-slate-400">i-C₄ (%)</th>
                    <th className="px-2 py-2 border-r border-slate-400">n-C₄ (%)</th>
                    <th className="px-2 py-2 border-r border-slate-400">i-C₅ (%)</th>
                    <th className="px-2 py-2 border-r border-slate-400">n-C₅ (%)</th>
                    <th className="px-2 py-2 border-r border-slate-400">N₂ (%)</th>
                    <th className="px-2 py-2 border-r-2 border-slate-600">CO₂ (%)</th>
                    <th className="px-2.5 py-2 bg-[#94a3b8] text-slate-950 font-black">
                      TOTAL (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-400">
                  {/* Row 1: Active Feed Tank */}
                  <tr className="bg-slate-100 hover:bg-slate-200/60">
                    <td className="px-3 py-1.5 border-r-2 border-slate-600 text-center font-bold text-slate-900 whitespace-nowrap bg-[#cbd5e1]">
                      Feed Tank ({primaryActiveTank.tankNo})
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcActiveTank.ch4}
                        onChange={(e) => setGcActiveTank({ ...gcActiveTank, ch4: parseFloat(e.target.value) || 0 })}
                        className="feed-tank-field w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r border-slate-400">{gcActiveTank.c2h6.toFixed(4)}</td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r border-slate-400">{gcActiveTank.c3h8.toFixed(4)}</td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r border-slate-400">{gcActiveTank.iC4.toFixed(4)}</td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r border-slate-400">{gcActiveTank.nC4.toFixed(4)}</td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r border-slate-400">{gcActiveTank.iC5.toFixed(4)}</td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r border-slate-400">{gcActiveTank.nC5.toFixed(4)}</td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r border-slate-400">{gcActiveTank.n2.toFixed(4)}</td>
                    <td className="px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-200 border-r-2 border-slate-600">{gcActiveTank.co2.toFixed(4)}</td>
                    <td className="px-2.5 py-1 text-center font-black text-emerald-950 bg-[#cbd5e1] border-l border-slate-400 shadow-2xs">
                      100.00 %
                    </td>
                  </tr>

                  {/* Row 2: Meter M-101A */}
                  <tr className="bg-slate-100 hover:bg-slate-200/60">
                    <td className="px-3 py-1.5 border-r-2 border-slate-600 text-center font-bold text-slate-900 whitespace-nowrap bg-[#cbd5e1]">
                      Discharge Header M-101A
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.ch4}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, ch4: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.c2h6}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, c2h6: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.c3h8}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, c3h8: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.iC4}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, iC4: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.nC4}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, nC4: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.iC5}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, iC5: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.nC5}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, nC5: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.n2}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, n2: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r-2 border-slate-600">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterA.co2}
                        onChange={(e) => setGcMeterA({ ...gcMeterA, co2: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="px-2.5 py-1 text-center font-black text-slate-950 bg-[#cbd5e1] border-l border-slate-400 shadow-2xs">
                      {(gcMeterA.ch4 + gcMeterA.c2h6 + gcMeterA.c3h8 + gcMeterA.iC4 + gcMeterA.nC4 + gcMeterA.iC5 + gcMeterA.nC5 + gcMeterA.n2 + gcMeterA.co2).toFixed(2)} %
                    </td>
                  </tr>

                  {/* Row 3: Meter M-101B */}
                  <tr className="bg-slate-100 hover:bg-slate-200/60">
                    <td className="px-3 py-1.5 border-r-2 border-slate-600 text-center font-bold text-slate-900 whitespace-nowrap bg-[#cbd5e1]">
                      Discharge Header M-101B
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.ch4}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, ch4: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.c2h6}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, c2h6: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.c3h8}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, c3h8: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.iC4}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, iC4: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.nC4}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, nC4: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.iC5}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, iC5: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.nC5}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, nC5: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.n2}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, n2: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="p-1 border-r-2 border-slate-600">
                      <input
                        type="number"
                        step="0.0001"
                        value={gcMeterB.co2}
                        onChange={(e) => setGcMeterB({ ...gcMeterB, co2: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-none border border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-center focus:outline-none text-xs transition-colors shadow-2xs"
                      />
                    </td>
                    <td className="px-2.5 py-1 text-center font-black text-slate-950 bg-[#cbd5e1] border-l border-slate-400 shadow-2xs">
                      {(gcMeterB.ch4 + gcMeterB.c2h6 + gcMeterB.c3h8 + gcMeterB.iC4 + gcMeterB.nC4 + gcMeterB.iC5 + gcMeterB.nC5 + gcMeterB.n2 + gcMeterB.co2).toFixed(2)} %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Notifications & Save Action Inside Form (Fixed Form Footer) */}
        <div className="shrink-0 bg-[#f8fafc] border-t border-slate-300 p-3 sm:px-5 flex flex-col sm:flex-row justify-between items-center gap-3 z-20 shadow-xs">
          {toastMessage ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-none text-xs font-mono text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          ) : (
            <span className="text-[11px] font-mono text-slate-500">
              ⚡ Saving synchronizes all 4 normalized sections with local database storage.
            </span>
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={resetDailyGasForm}
              title="Reset all form inputs"
              className="px-3.5 py-1.5 bg-[#e2e8f0] hover:bg-slate-300 active:bg-slate-400 text-slate-900 rounded border border-slate-400 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>↺ Reset Form</span>
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-1.5 bg-[#334155] hover:bg-[#1e293b] active:bg-[#0f172a] text-white rounded border border-slate-500 text-xs font-bold font-mono shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-200" />
              <span>💾 Save / Submit Daily Report</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
