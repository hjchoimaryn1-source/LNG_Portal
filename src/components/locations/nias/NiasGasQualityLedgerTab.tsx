// src/components/locations/nias/NiasGasQualityLedgerTab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';
import { NodeState } from '@/types/lng';
import { GasQualityMasterRecord } from '@/types/gasQuality';
import { INITIAL_GAS_QUALITY_MASTER_RECORDS } from '@/data/gasQualityMasterData';
import * as XLSX from 'xlsx';

const ALL_MONTHS = [
  { value: 'ALL', label: 'All Months' },
  { value: '01', label: 'Jan (01)' },
  { value: '02', label: 'Feb (02)' },
  { value: '03', label: 'Mar (03)' },
  { value: '04', label: 'Apr (04)' },
  { value: '05', label: 'May (05)' },
  { value: '06', label: 'Jun (06)' },
  { value: '07', label: 'Jul (07)' },
  { value: '08', label: 'Aug (08)' },
  { value: '09', label: 'Sep (09)' },
  { value: '10', label: 'Oct (10)' },
  { value: '11', label: 'Nov (11)' },
  { value: '12', label: 'Dec (12)' },
];

export default function NiasGasQualityLedgerTab() {
  const portalData = usePortalData();
  const fleetTanks = portalData?.fleetTanks || [];
  const records = portalData?.gasQualityRecords || INITIAL_GAS_QUALITY_MASTER_RECORDS;

  // Filter States
  const [filterMode, setFilterMode] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('2026-07-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Filtered master records
  const filteredRecords = useMemo(() => {
    return (records || []).filter((rec) => {
      // 1. Date filter
      if (filterMode === 'MONTH') {
        const parts = (rec.date || '').split('-');
        if (parts.length >= 2) {
          const [y, m] = parts;
          if (selectedYear !== 'ALL' && y !== selectedYear) return false;
          if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;
        }
      } else {
        if (startDate && rec.date < startDate) return false;
        if (endDate && rec.date > endDate) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = (rec.date || '').toLowerCase().includes(q);
        const matchesTank = (rec.activeFeedTank || '').toLowerCase().includes(q);
        const matchesSerial = (rec.serialNo || '').toLowerCase().includes(q);
        if (!matchesDate && !matchesTank && !matchesSerial) return false;
      }

      return true;
    });
  }, [records, filterMode, selectedYear, selectedMonth, startDate, endDate, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const list = filteredRecords || [];
    const totalEnergy = list.reduce((sum, r) => sum + (r.dailyStation?.mmbtu || 0), 0);
    const totalVolMscf = list.reduce((sum, r) => sum + (r.dailyStation?.cvol || 0), 0);
    const totalMassTonne = list.reduce((sum, r) => sum + (r.dailyStation?.massTonne || 0), 0);
    const avgGhv =
      list.length > 0
        ? list.reduce((sum, r) => sum + (r.conditionMeterA?.ghv || 0), 0) / list.length
        : 1049.7;
    const avgMethane =
      list.length > 0
        ? list.reduce((sum, r) => sum + (r.gcMeterA?.ch4 || 0), 0) / list.length
        : 96.53;

    return {
      totalEnergy,
      totalVolMscf,
      totalMassTonne,
      avgGhv,
      avgMethane,
      recordCount: list.length,
    };
  }, [filteredRecords]);

  // Export to Excel handler (100% matched to Entry form Section 1~4 schema with Summary Row)
  const handleExportToExcel = () => {
    if (filteredRecords.length === 0) {
      alert('No records available to export.');
      return;
    }

    const dataToExport = filteredRecords.map((r) => ({
      Date: r.date,
      'Feed Tank': r.activeFeedTank,
      'Serial No': r.serialNo || '',
      // Section 1 & 2: M-101A (Run 1)
      '[Sec 1&2 M-101A] UVOL (MMCF)': r.dailyMeterA?.uvol || 0,
      '[Sec 1&2 M-101A] CVOL (MMCF)': r.dailyMeterA?.cvol || 0,
      '[Sec 1&2 M-101A] MASS (T)': r.dailyMeterA?.massTonne || 0,
      '[Sec 1&2 M-101A] ENERGY (MMBTU)': r.dailyMeterA?.mmbtu || 0,
      // Section 1 & 2: M-101B (Run 2)
      '[Sec 1&2 M-101B] UVOL (MMCF)': r.dailyMeterB?.uvol || 0,
      '[Sec 1&2 M-101B] CVOL (MMCF)': r.dailyMeterB?.cvol || 0,
      '[Sec 1&2 M-101B] MASS (T)': r.dailyMeterB?.massTonne || 0,
      '[Sec 1&2 M-101B] ENERGY (MMBTU)': r.dailyMeterB?.mmbtu || 0,
      // Section 1 & 2: Station (Total)
      '[Sec 1&2 Station] UVOL (MMCF)': r.dailyStation?.uvol || 0,
      '[Sec 1&2 Station] CVOL (MMCF)': r.dailyStation?.cvol || 0,
      '[Sec 1&2 Station] MASS (T)': r.dailyStation?.massTonne || 0,
      '[Sec 1&2 Station] ENERGY (MMBTU)': r.dailyStation?.mmbtu || 0,
      // Section 3: Gas Condition (M-101A)
      '[Sec 3 M-101A] PRESS (BARG)': r.conditionMeterA?.pressBarg || 0,
      '[Sec 3 M-101A] TEMP (℃)': r.conditionMeterA?.tempC || 0,
      '[Sec 3 M-101A] DENSITY (KG/㎥)': r.conditionMeterA?.lineDens || 0,
      '[Sec 3 M-101A] COMPRESS (ZF)': r.conditionMeterA?.lineZf || 0,
      '[Sec 3 M-101A] GHV (BTU/SCF)': r.conditionMeterA?.ghv || 0,
      // Section 3: Gas Condition (M-101B)
      '[Sec 3 M-101B] PRESS (BARG)': r.conditionMeterB?.pressBarg || 0,
      '[Sec 3 M-101B] TEMP (℃)': r.conditionMeterB?.tempC || 0,
      '[Sec 3 M-101B] DENSITY (KG/㎥)': r.conditionMeterB?.lineDens || 0,
      '[Sec 3 M-101B] COMPRESS (ZF)': r.conditionMeterB?.lineZf || 0,
      '[Sec 3 M-101B] GHV (BTU/SCF)': r.conditionMeterB?.ghv || 0,
      // Section 4: GC Molecular Composition
      '[Sec 4 GC] CH4 (%)': r.gcMeterA?.ch4 || 0,
      '[Sec 4 GC] C2H6 (%)': r.gcMeterA?.c2h6 || 0,
      '[Sec 4 GC] C3H8 (%)': r.gcMeterA?.c3h8 || 0,
      '[Sec 4 GC] i-C4 (%)': r.gcMeterA?.iC4 || 0,
      '[Sec 4 GC] n-C4 (%)': r.gcMeterA?.nC4 || 0,
      '[Sec 4 GC] i-C5 (%)': r.gcMeterA?.iC5 || 0,
      '[Sec 4 GC] n-C5 (%)': r.gcMeterA?.nC5 || 0,
      '[Sec 4 GC] N2 (%)': r.gcMeterA?.n2 || 0,
      '[Sec 4 GC] CO2 (%)': r.gcMeterA?.co2 || 0,
      '[Sec 4 GC] TOTAL (%)': 100.0,
      'Submitted At': r.submittedAt || '',
    }));

    // Append Summary Row to Excel Output (SUM for Flow/Energy, AVG for Conditions/Quality)
    const summaryRow = {
      Date: `TOTAL / AVG (${filteredRecords.length} ${filteredRecords.length === 1 ? 'Day' : 'Days'})`,
      'Feed Tank': '-',
      'Serial No': '-',
      '[Sec 1&2 M-101A] UVOL (MMCF)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.uvol || 0), 0).toFixed(2)),
      '[Sec 1&2 M-101A] CVOL (MMCF)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.cvol || 0), 0).toFixed(2)),
      '[Sec 1&2 M-101A] MASS (T)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.massTonne || 0), 0).toFixed(2)),
      '[Sec 1&2 M-101A] ENERGY (MMBTU)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.mmbtu || 0), 0).toFixed(1)),
      '[Sec 1&2 M-101B] UVOL (MMCF)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.uvol || 0), 0).toFixed(2)),
      '[Sec 1&2 M-101B] CVOL (MMCF)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.cvol || 0), 0).toFixed(2)),
      '[Sec 1&2 M-101B] MASS (T)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.massTonne || 0), 0).toFixed(2)),
      '[Sec 1&2 M-101B] ENERGY (MMBTU)': Number(filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.mmbtu || 0), 0).toFixed(1)),
      '[Sec 1&2 Station] UVOL (MMCF)': Number(filteredRecords.reduce((a, b) => a + (b.dailyStation?.uvol || 0), 0).toFixed(2)),
      '[Sec 1&2 Station] CVOL (MMCF)': Number(filteredRecords.reduce((a, b) => a + (b.dailyStation?.cvol || 0), 0).toFixed(2)),
      '[Sec 1&2 Station] MASS (T)': Number(summaryMetrics.totalMassTonne.toFixed(2)),
      '[Sec 1&2 Station] ENERGY (MMBTU)': Number(summaryMetrics.totalEnergy.toFixed(1)),
      '[Sec 3 M-101A] PRESS (BARG)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.pressBarg || 0), 0) / filteredRecords.length).toFixed(2)),
      '[Sec 3 M-101A] TEMP (℃)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.tempC || 0), 0) / filteredRecords.length).toFixed(1)),
      '[Sec 3 M-101A] DENSITY (KG/㎥)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.lineDens || 0), 0) / filteredRecords.length).toFixed(2)),
      '[Sec 3 M-101A] COMPRESS (ZF)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.lineZf || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 3 M-101A] GHV (BTU/SCF)': Number(summaryMetrics.avgGhv.toFixed(1)),
      '[Sec 3 M-101B] PRESS (BARG)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.pressBarg || 0), 0) / filteredRecords.length).toFixed(2)),
      '[Sec 3 M-101B] TEMP (℃)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.tempC || 0), 0) / filteredRecords.length).toFixed(1)),
      '[Sec 3 M-101B] DENSITY (KG/㎥)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.lineDens || 0), 0) / filteredRecords.length).toFixed(2)),
      '[Sec 3 M-101B] COMPRESS (ZF)': Number((filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.lineZf || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 3 M-101B] GHV (BTU/SCF)': Number(summaryMetrics.avgGhv.toFixed(1)),
      '[Sec 4 GC] CH4 (%)': Number(summaryMetrics.avgMethane.toFixed(4)),
      '[Sec 4 GC] C2H6 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.c2h6 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] C3H8 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.c3h8 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] i-C4 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.iC4 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] n-C4 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.nC4 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] i-C5 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.iC5 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] n-C5 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.nC5 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] N2 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.n2 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] CO2 (%)': Number((filteredRecords.reduce((a, b) => a + (b.gcMeterA?.co2 || 0), 0) / filteredRecords.length).toFixed(4)),
      '[Sec 4 GC] TOTAL (%)': 100.0,
      'Submitted At': 'SUMMARY',
    };

    const finalExport = [...dataToExport, summaryRow];
    const ws = XLSX.utils.json_to_sheet(finalExport);

    // Auto-fit column widths
    const colKeys = Object.keys(dataToExport[0]);
    ws['!cols'] = colKeys.map((k) => ({
      wch: Math.max(k.length + 3, 13),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gas Metering Master Ledger');
    XLSX.writeFile(wb, `NIAS_Gas_Metering_Master_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-3 font-sans pb-10">
      {/* 1. [TOP] Filter Bar & Export Actions (Exact Classic Gray #D4D0C8 Bar) */}
      <div className="p-3 sm:py-2.5 sm:px-4 bg-[#d4d0c8] border border-[#9a978d] rounded-none flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#bcbaa8] border border-[#9a978d] p-0.5 rounded font-mono text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterMode('MONTH')}
              className={`px-3 py-1 font-bold transition-all cursor-pointer rounded-xs ${
                filterMode === 'MONTH'
                  ? 'bg-[#334155] text-white shadow-xs'
                  : 'bg-[#d4d0c8] text-slate-900 hover:bg-[#eae6de]'
              }`}
            >
              Month Search
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('RANGE')}
              className={`px-3 py-1 font-bold transition-all cursor-pointer rounded-xs ml-0.5 ${
                filterMode === 'RANGE'
                  ? 'bg-[#334155] text-white shadow-xs'
                  : 'bg-[#d4d0c8] text-slate-900 hover:bg-[#eae6de]'
              }`}
            >
              Date Range
            </button>
          </div>

          {/* Date Range or Month Inputs */}
          {filterMode === 'RANGE' ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 bg-white text-slate-900 px-2.5 py-1 border border-[#8f8b83] rounded shadow-xs">
                <span className="text-slate-600 text-[10px] font-bold">FROM:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs [color-scheme:light]"
                />
              </div>
              <span className="text-slate-600 font-black">~</span>
              <div className="flex items-center gap-1.5 bg-white text-slate-900 px-2.5 py-1 border border-[#8f8b83] rounded shadow-xs">
                <span className="text-slate-600 text-[10px] font-bold">TO:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs [color-scheme:light]"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex items-center bg-white text-slate-900 px-2 py-1 border border-[#8f8b83] rounded shadow-xs">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div className="flex items-center bg-white text-slate-900 px-2 py-1 border border-[#8f8b83] rounded shadow-xs">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
                >
                  {ALL_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Controls: Search & Export Excel */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          <div className="flex items-center gap-1.5 bg-white text-slate-900 px-2.5 py-1 border border-[#8f8b83] rounded text-xs font-mono shadow-xs">
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search date / tank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-900 placeholder-slate-500 focus:outline-none text-xs w-32 sm:w-44 font-bold"
            />
          </div>

          {/* Export Excel Button (Classic Gray Button) */}
          <button
            type="button"
            onClick={handleExportToExcel}
            className="bg-[#e6e2d8] hover:bg-[#dedad0] active:bg-[#c8c4ba] text-slate-900 hover:text-black px-3 py-1 rounded border border-[#8f8b83] shadow-xs text-xs flex items-center space-x-1.5 font-mono font-bold cursor-pointer transition-colors"
            title="Export all records to Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* 2. [TOP BANNER] Summary Metrics (6 KPI Cards with Classic Slate Header) */}
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

      {/* 3. [MAIN GRID] Section 1~4 Replicated Master Daily Ledger Table */}
      <div className="bg-white border-2 border-slate-600 rounded-none shadow-2xs overflow-hidden">
        {/* Table Title Bar */}
        <div className="p-3 sm:py-2.5 sm:px-4 bg-[#334155] text-white border-b-2 border-slate-600 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase font-mono">
              NIAS G.C Report
            </h4>
            <span className="text-xs font-mono text-cyan-300 font-bold bg-[#1e293b] px-2 py-0.5 border border-slate-500 shadow-2xs">
              {filteredRecords.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[620px] scrollbar-thin scrollbar-thumb-slate-400">
          <table className="w-full text-xs text-center border-collapse font-mono">
            {/* 2-Tier Sticky Header: Light Blue-Gray SCADA Palette Replicating Section 1~4 */}
            <thead className="sticky top-0 z-30 shadow-none">
              {/* Tier 1 Group Headers */}
              <tr className="border-b-2 border-slate-600 text-[10px] uppercase font-bold tracking-wider text-slate-900">
                <th className="px-3 py-1.5 bg-[#94a3b8] text-slate-900 sticky left-0 z-40 border-r-2 border-slate-600 text-center font-black">
                  DATE
                </th>
                <th colSpan={4} className="px-2 py-1.5 bg-[#cbd5e1] text-slate-900 border-r-2 border-slate-600 text-center font-black">
                  M-101A ENERGY
                </th>
                <th colSpan={4} className="px-2 py-1.5 bg-[#b8c7db] text-slate-900 border-r-2 border-slate-600 text-center font-black">
                  M-101B ENERGY
                </th>
                <th colSpan={4} className="px-2 py-1.5 bg-[#94a3b8] text-slate-950 text-center font-black border-r-2 border-slate-600">
                  STATION (TOTAL) ENERGY
                </th>
                <th colSpan={5} className="px-2 py-1.5 bg-[#cbd5e1] text-slate-900 border-r-2 border-slate-600 text-center font-black">
                  M-101A GAS PROPERTIES
                </th>
                <th colSpan={5} className="px-2 py-1.5 bg-[#b8c7db] text-slate-900 border-r-2 border-slate-600 text-center font-black">
                  M-101B GAS PROPERTIES
                </th>
                <th colSpan={10} className="px-2 py-1.5 bg-[#94a3b8] text-slate-950 text-center font-black">
                  GAS COMPOSITION (% MOL)
                </th>
              </tr>

              {/* Tier 2 Column Headers: Exact Replicas of Section 1, 2, 3, 4 */}
              <tr className="bg-[#e2e8f0] text-slate-900 border-b-2 border-slate-600 text-[9px] uppercase font-bold text-center">
                {/* Date */}
                <th className="px-3 py-1.5 sticky left-0 z-40 bg-[#94a3b8] text-slate-900 border-r-2 border-slate-600 text-center font-black">
                  Date
                </th>

                {/* Section 1&2: M-101A */}
                <th className="px-1.5 py-1.5 border-r border-slate-400">UVOL (MMCF)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">CVOL (MMCF)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">MASS (T)</th>
                <th className="px-1.5 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#d5deea]">ENERGY (MMBTU)</th>

                {/* Section 1&2: M-101B */}
                <th className="px-1.5 py-1.5 border-r border-slate-400">UVOL (MMCF)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">CVOL (MMCF)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">MASS (T)</th>
                <th className="px-1.5 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#d5deea]">ENERGY (MMBTU)</th>

                {/* Section 1&2: Station Total */}
                <th className="px-1.5 py-1.5 border-r border-slate-400">UVOL (MMCF)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">CVOL (MMCF)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">MASS (T)</th>
                <th className="px-1.5 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#cbd5e1]">ENERGY (MMBTU)</th>

                {/* Section 3: M-101A Gas Condition */}
                <th className="px-1.5 py-1.5 border-r border-slate-400">PRESS (BARG)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">TEMP (℃)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">DENSITY (KG/㎥)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">COMPRESS (ZF)</th>
                <th className="px-1.5 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#d5deea]">GHV (BTU/SCF)</th>

                {/* Section 3: M-101B Gas Condition */}
                <th className="px-1.5 py-1.5 border-r border-slate-400">PRESS (BARG)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">TEMP (℃)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">DENSITY (KG/㎥)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">COMPRESS (ZF)</th>
                <th className="px-1.5 py-1.5 border-r-2 border-slate-600 font-black text-slate-950 bg-[#d5deea]">GHV (BTU/SCF)</th>

                {/* Section 4: GC Molecular Columns (Daniel 700 9 Components + Total) */}
                <th className="px-1.5 py-1.5 border-r border-slate-400">CH₄ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">C₂H₆ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">C₃H₈ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">i-C₄ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">n-C₄ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">i-C₅ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">n-C₅ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">N₂ (%)</th>
                <th className="px-1.5 py-1.5 border-r border-slate-400">CO₂ (%)</th>
                <th className="px-2 py-1.5 font-black bg-[#cbd5e1] text-slate-950">TOTAL (%)</th>
              </tr>
            </thead>

            {/* Table Body: Crisp Light Blue-Gray Grid matching Entry Tab */}
            <tbody className="divide-y-2 divide-slate-400">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={33}
                    className="p-8 text-center text-slate-500 font-mono"
                  >
                    No records found for the selected period / criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={r.date}
                      className={`transition-colors font-mono text-[11px] ${
                        isEven
                          ? 'bg-slate-100 hover:bg-slate-200/70'
                          : 'bg-slate-50 hover:bg-slate-200/70'
                      }`}
                    >
                      {/* Date (Clean Single Label) */}
                      <td className="px-3 py-1.5 sticky left-0 z-20 bg-inherit border-r-2 border-slate-600 whitespace-nowrap text-center font-bold text-slate-900">
                        {r.date}
                      </td>

                      {/* Section 1&2: M-101A Cells */}
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.dailyMeterA?.uvol?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-900 border-r border-slate-400">
                        {r.dailyMeterA?.cvol?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.dailyMeterA?.massTonne?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-black text-slate-950 bg-[#cbd5e1] border-r-2 border-slate-600 shadow-2xs">
                        {r.dailyMeterA?.mmbtu?.toFixed(1) ?? '0.0'}
                      </td>

                      {/* Section 1&2: M-101B Cells */}
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.dailyMeterB?.uvol?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-900 border-r border-slate-400">
                        {r.dailyMeterB?.cvol?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.dailyMeterB?.massTonne?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-black text-slate-950 bg-[#cbd5e1] border-r-2 border-slate-600 shadow-2xs">
                        {r.dailyMeterB?.mmbtu?.toFixed(1) ?? '0.0'}
                      </td>

                      {/* Section 1&2: Station Total Cells */}
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-900 border-r border-slate-400">
                        {r.dailyStation?.uvol?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-900 border-r border-slate-400">
                        {r.dailyStation?.cvol?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-900 border-r border-slate-400">
                        {r.dailyStation?.massTonne?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-black text-slate-950 bg-[#cbd5e1] border-r-2 border-slate-600 shadow-2xs">
                        {r.dailyStation?.mmbtu?.toFixed(1) ?? '0.0'}
                      </td>

                      {/* Section 3: M-101A Gas Condition Cells */}
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterA?.pressBarg?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterA?.tempC?.toFixed(1) ?? '0.0'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterA?.lineDens?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterA?.lineZf?.toFixed(4) ?? '1.0000'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-black text-slate-950 bg-[#cbd5e1] border-r-2 border-slate-600 shadow-2xs">
                        {r.conditionMeterA?.ghv?.toFixed(1) ?? '0.0'}
                      </td>

                      {/* Section 3: M-101B Gas Condition Cells */}
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterB?.pressBarg?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterB?.tempC?.toFixed(1) ?? '0.0'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterB?.lineDens?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-800 font-bold border-r border-slate-400">
                        {r.conditionMeterB?.lineZf?.toFixed(4) ?? '1.0000'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-black text-slate-950 bg-[#cbd5e1] border-r-2 border-slate-600 shadow-2xs">
                        {r.conditionMeterB?.ghv?.toFixed(1) ?? '0.0'}
                      </td>

                      {/* Section 4: GC Molecular Cells */}
                      <td className="px-1.5 py-1.5 text-center font-black text-slate-950 border-r border-slate-400 bg-white/60">
                        {r.gcMeterA?.ch4?.toFixed(4) ?? '0.0000'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.c2h6?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.c3h8?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.iC4?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.nC4?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.iC5?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.nC5?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.n2?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-slate-800 border-r border-slate-400">{r.gcMeterA?.co2?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-2 py-1.5 text-center font-black text-emerald-950 bg-[#cbd5e1] shadow-2xs">100.00 %</td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Totals & Averages (Unified bg-[#94a3b8] with Bright High-Contrast text-white values) */}
            {filteredRecords.length > 0 && (
              <tfoot className="bg-[#94a3b8] text-white font-black sticky bottom-0 z-30 border-t-2 border-slate-600 text-[11px]">
                <tr>
                  <td className="px-3 py-2 sticky left-0 z-40 bg-[#94a3b8] text-white border-r-2 border-slate-600 text-center font-black tracking-wide">
                    TOTAL / AVG ({filteredRecords.length} {filteredRecords.length === 1 ? 'Day' : 'Days'})
                  </td>

                  {/* Section 1&2: M-101A Flow & Energy Sums (TOTAL) */}
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.uvol || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.cvol || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.massTonne || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r-2 border-slate-600 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterA?.mmbtu || 0), 0).toFixed(1)}
                  </td>

                  {/* Section 1&2: M-101B Flow & Energy Sums (TOTAL) */}
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.uvol || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.cvol || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.massTonne || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r-2 border-slate-600 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyMeterB?.mmbtu || 0), 0).toFixed(1)}
                  </td>

                  {/* Section 1&2: Station Total Flow & Energy Sums (TOTAL) */}
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyStation?.uvol || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {filteredRecords.reduce((a, b) => a + (b.dailyStation?.cvol || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {summaryMetrics.totalMassTonne.toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center text-white border-r-2 border-slate-600 font-black">
                    {summaryMetrics.totalEnergy.toFixed(1)}
                  </td>

                  {/* Section 3: M-101A Gas Condition & Properties (AVG) */}
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.pressBarg || 0), 0) / filteredRecords.length).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.tempC || 0), 0) / filteredRecords.length).toFixed(1)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.lineDens || 0), 0) / filteredRecords.length).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterA?.lineZf || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r-2 border-slate-600 font-black text-white">
                    {summaryMetrics.avgGhv.toFixed(1)}
                  </td>

                  {/* Section 3: M-101B Gas Condition & Properties (AVG) */}
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.pressBarg || 0), 0) / filteredRecords.length).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.tempC || 0), 0) / filteredRecords.length).toFixed(1)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.lineDens || 0), 0) / filteredRecords.length).toFixed(2)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.conditionMeterB?.lineZf || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r-2 border-slate-600 font-black text-white">
                    {summaryMetrics.avgGhv.toFixed(1)}
                  </td>

                  {/* Section 4: Daniel 700 GC Molecular Composition (AVG) */}
                  <td className="px-1.5 py-2 text-center text-white border-r border-slate-500 font-black">
                    {summaryMetrics.avgMethane.toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.c2h6 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.c3h8 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.iC4 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.nC4 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.iC5 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.nC5 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.n2 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-500 font-black text-white">
                    {(filteredRecords.reduce((a, b) => a + (b.gcMeterA?.co2 || 0), 0) / filteredRecords.length).toFixed(4)}
                  </td>
                  <td className="px-2 py-2 text-center text-white font-black">
                    100.00 %
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
