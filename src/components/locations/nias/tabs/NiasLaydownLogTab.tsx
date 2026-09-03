// src/components/locations/nias/tabs/NiasLaydownLogTab.tsx
"use client";

import React from 'react';
import { Calendar, Edit3, Trash2 } from 'lucide-react';
import type { DailyMasterRecord } from '@/types/lng';
import type { NiasTankAsset } from '../../NiasTerminalView';
import { exportDailyInspectionToExcel } from '@/utils/exportDailyInspectionExcel';

export interface NiasLaydownLogTabProps {
  tankInventory: NiasTankAsset[];
  dailyMasterRecords: DailyMasterRecord[];
  deletedRecordIds: Set<string>;
  dateQueryMode: 'ALL_DATA' | 'DAILY' | 'PERIOD_RANGE';
  setDateQueryMode: (mode: 'ALL_DATA' | 'DAILY' | 'PERIOD_RANGE') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  batchFilter: string;
  setBatchFilter: (batch: string) => void;
  availableBatches: string[];
  normalizeBatch?: (raw?: string) => string;
  zoneFilter: string;
  setZoneFilter: (zone: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setToastMessage: (msg: string | null) => void;
  calcVolumeFromMmH2O?: (mm: number) => number;
  calcMassTonFromVolume?: (volM3: number) => number;
  // Quick entry state & handlers
  isQuickEntryOpen: boolean;
  setIsQuickEntryOpen: (open: boolean) => void;
  handleSaveQuickEntry: (e?: React.FormEvent) => void;
  wsReportDate: string;
  setWsReportDate: (date: string) => void;
  wsTankNo: string;
  handleSelectTankForQuickEntry: (tankNo: string) => void;
  wsShipment: string;
  wsSelectedZone: 'LAYDOWN_1' | 'SKID' | 'LAYDOWN_2';
  wsPressureMPa: number;
  setWsPressureMPa: (val: number) => void;
  wsLevelMmH2O: number;
  handleMmH2OChange: (mm: number) => void;
  wsLevelM3: number;
  wsSmtPress: number;
  setWsSmtPress: (val: number) => void;
  wsSmtLevel: number;
  setWsSmtLevel: (val: number) => void;
  wsSmtTemp: number;
  setWsSmtTemp: (val: number) => void;
  wsSmtBattery: number;
  setWsSmtBattery: (val: number) => void;
  wsPressBefore: number;
  setWsPressBefore: (val: number) => void;
  wsPressAfter: number;
  setWsPressAfter: (val: number) => void;
  setWsBogVentedKg: (val: number) => void;
  // Table action callbacks
  handleOpenTankTrendModal: (tankNo: string) => void;
  handleEditRow: (record: DailyMasterRecord) => void;
  setRecordToDelete: React.Dispatch<React.SetStateAction<{ id: string; tankNo: string; serialNo: string; reportDate: string } | null>>;
}

const defaultCalcVolumeFromMmH2O = (mm: number): number => parseFloat(((mm / 950) * 44.0).toFixed(1));
const defaultCalcMassTonFromVolume = (volM3: number): number => parseFloat(((volM3 * 441.0) / 1000).toFixed(2));
const defaultNormalizeBatch = (raw?: string): string => {
  if (!raw) return '';
  const match = raw.match(/n-?(\d+)/i);
  if (match) return `N${match[1]}`;
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export default function NiasLaydownLogTab({
  tankInventory,
  dailyMasterRecords,
  deletedRecordIds,
  dateQueryMode,
  setDateQueryMode,
  selectedDate,
  setSelectedDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  batchFilter,
  setBatchFilter,
  availableBatches,
  normalizeBatch = defaultNormalizeBatch,
  zoneFilter,
  setZoneFilter,
  searchQuery,
  setSearchQuery,
  setToastMessage,
  calcVolumeFromMmH2O = defaultCalcVolumeFromMmH2O,
  calcMassTonFromVolume = defaultCalcMassTonFromVolume,
  isQuickEntryOpen,
  setIsQuickEntryOpen,
  handleSaveQuickEntry,
  wsReportDate,
  setWsReportDate,
  wsTankNo,
  handleSelectTankForQuickEntry,
  wsShipment,
  wsSelectedZone,
  wsPressureMPa,
  setWsPressureMPa,
  wsLevelMmH2O,
  handleMmH2OChange,
  wsLevelM3,
  wsSmtPress,
  setWsSmtPress,
  wsSmtLevel,
  setWsSmtLevel,
  wsSmtTemp,
  setWsSmtTemp,
  wsSmtBattery,
  setWsSmtBattery,
  wsPressBefore,
  setWsPressBefore,
  wsPressAfter,
  setWsPressAfter,
  setWsBogVentedKg,
  handleOpenTankTrendModal,
  handleEditRow,
  setRecordToDelete,
}: NiasLaydownLogTabProps) {
  const ld1Count = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_1').length || 9;
  const skidCount = tankInventory.filter((t) => t.currentZone?.startsWith('BAY')).length || 1;
  const ld2Count = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_2').length || 1;

  // 1. Filter master inspection list based on active filters (Date query mode, range, batch, zone, search query)
  const masterInspectionList = dailyMasterRecords.filter((rec) => {
    // Delete filter
    if (deletedRecordIds.has(rec.id || `rec-${rec.tankNo}`)) return false;

    // Date filter
    if (dateQueryMode === 'DAILY') {
      if (rec.reportDate !== selectedDate) return false;
    } else if (dateQueryMode === 'PERIOD_RANGE') {
      if (rec.reportDate < startDate || rec.reportDate > endDate) return false;
    }

    // Batch filter (Normalized)
    if (batchFilter !== 'ALL') {
      const recBatch = normalizeBatch(rec.shipment);
      const targetBatch = normalizeBatch(batchFilter);
      if (recBatch !== targetBatch) return false;
    }

    // Zone filter
    if (zoneFilter !== 'ALL') {
      const liveTank = tankInventory.find((t) => t.id === rec.tankNo);
      const pos = (rec.position || '').toLowerCase();
      const zone =
        liveTank?.currentZone === 'LAYDOWN_2' || pos.includes('laydown 2')
          ? 'LAYDOWN_2'
          : liveTank?.currentZone?.startsWith('BAY') || pos.includes('bay') || pos.includes('skid')
          ? 'SKID'
          : 'LAYDOWN_1';
      if (zone !== zoneFilter) return false;
    }

    // Search query filter (Tank ID / Serial No)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTank = (rec.tankNo || '').toLowerCase().includes(q);
      const matchSerial = (rec.serialNo || '').toLowerCase().includes(q);
      if (!matchTank && !matchSerial) return false;
    }

    return true;
  });

  // 2. Filter-Aware Excel Export Logic (Professional 2-Tier Grouped Report with Custom Styling)
  const handleExportExcel = async () => {
    if (masterInspectionList.length === 0) {
      setToastMessage('⚠️ No records found to export for the current filters');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    // 1. Map filtered dataset into structured export items
    const exportItems = masterInspectionList.map((item) => {
      const rawMmH2O = item.levelMmH2O || (item.level ? Math.round((item.level / 100) * 950) : 465);
      const calcVol = calcVolumeFromMmH2O(rawMmH2O);
      const calcMass = calcMassTonFromVolume(calcVol);
      const liveTank = tankInventory.find((t) => t.id === item.tankNo);
      const zone =
        liveTank?.currentZone === 'LAYDOWN_2' || (item.position || '').toLowerCase().includes('laydown 2')
          ? 'LD-2'
          : liveTank?.currentZone?.startsWith('BAY') || (item.position || '').toLowerCase().includes('bay')
          ? 'SKID'
          : 'LD-1';
      const isHighPress = (item.pressureMPa || 0) >= 0.74;
      const status = (item.lossesKg || 0) > 0 ? 'VENTED' : isHighPress ? 'HIGH P' : 'NORMAL';

      return {
        reportDate: item.reportDate,
        tankNo: item.tankNo,
        serialNo: item.serialNo,
        shipment: normalizeBatch(item.shipment) || 'N1',
        zone: zone,
        levelMmH2O: rawMmH2O,
        analogPressMPa: Number((item.pressureMPa || 0).toFixed(2)),
        calcVolM3: Number(calcVol.toFixed(1)),
        calcMassTon: Number(calcMass.toFixed(2)),
        smtPressMPa: Number((item.pressureMPa || 0.76).toFixed(2)),
        smtLevelPct: Number((item.level ?? parseFloat(((rawMmH2O / 950) * 100).toFixed(1))).toFixed(1)),
        smtTempC: Number(item.tempC !== undefined && item.tempC !== null ? item.tempC : -126.7),
        smtBatteryPct: Number(item.battery || 72),
        bogVentKg: Number(item.lossesKg || 0),
        status: status,
        remarks: item.remarks || (item.lossesKg && item.lossesKg > 0 ? `BOG Vented ${item.lossesKg} kg` : 'Normal daily inspection'),
      };
    });

    // 2. Determine filter description strings for filename
    let dateStr = 'All_Dates';
    if (dateQueryMode === 'DAILY') {
      dateStr = selectedDate || 'Daily';
    } else if (dateQueryMode === 'PERIOD_RANGE') {
      dateStr = `${startDate}_to_${endDate}`;
    }
    const batchStr = batchFilter === 'ALL' ? 'All_Batches' : `Batch_${batchFilter}`;
    const zoneStr = zoneFilter === 'ALL' ? 'All_Zones' : zoneFilter;

    try {
      const fileName = await exportDailyInspectionToExcel(exportItems, {
        dateFilterDesc: dateStr,
        batchFilterDesc: batchStr,
        zoneFilterDesc: zoneStr,
      });
      setToastMessage(`📊 Exported Styled Excel (${masterInspectionList.length} records): ${fileName}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error exporting daily inspection Excel:', err);
      setToastMessage('❌ Failed to export Excel report');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* 1. Unified Top Control Bar (Classic SCADA Sunken 3D Panel) */}
      <div className="bg-[#dfdbd1] border-t-2 border-l-2 border-[#8a8579] border-b-2 border-r-2 border-white rounded-xs p-1.5 shadow-inner flex flex-wrap items-center justify-between gap-4 w-full select-none">
        {/* Left: Logical Grouping & Micro-Labels */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Group 1: QUERY MODE */}
          <div className="flex flex-col gap-0.5">
            <span className="w-full text-center block mb-1 text-[11px] font-extrabold text-slate-700 uppercase tracking-tighter">
              QUERY MODE
            </span>
            <div className="flex items-center p-0.5 bg-[#c0bbb0] border-t border-l border-[#8a8579] border-b border-r border-white rounded-xs gap-0.5 shadow-inner h-7">
              <button
                type="button"
                onClick={() => setDateQueryMode('ALL_DATA')}
                className={`px-2.5 h-full flex items-center text-xs font-mono font-bold cursor-pointer transition-all border ${
                  dateQueryMode === 'ALL_DATA'
                    ? 'bg-[#002b4d] text-cyan-300 border-[#001e36] shadow-inner'
                    : 'bg-[#d4d0c8] hover:bg-[#dedad2] text-slate-800 border-slate-400'
                }`}
              >
                All Data
              </button>
              <button
                type="button"
                onClick={() => setDateQueryMode('DAILY')}
                className={`px-2.5 h-full flex items-center text-xs font-mono font-bold cursor-pointer transition-all border ${
                  dateQueryMode === 'DAILY'
                    ? 'bg-[#002b4d] text-cyan-300 border-[#001e36] shadow-inner'
                    : 'bg-[#d4d0c8] hover:bg-[#dedad2] text-slate-800 border-slate-400'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setDateQueryMode('PERIOD_RANGE')}
                className={`px-2.5 h-full flex items-center text-xs font-mono font-bold cursor-pointer transition-all border ${
                  dateQueryMode === 'PERIOD_RANGE'
                    ? 'bg-[#002b4d] text-cyan-300 border-[#001e36] shadow-inner'
                    : 'bg-[#d4d0c8] hover:bg-[#dedad2] text-slate-800 border-slate-400'
                }`}
              >
                Period Range
              </button>
            </div>
          </div>

          {/* Vertical 3D Separator */}
          <div className="h-8 border-r border-[#8a8579] border-l border-white mx-0.5 self-center hidden sm:block" />

          {/* Group 2: DATE SELECTION */}
          <div className="flex flex-col gap-0.5">
            <span className="w-full text-center block mb-1 text-[11px] font-extrabold text-slate-700 uppercase tracking-tighter">
              TARGET DATE
            </span>
            {dateQueryMode === 'DAILY' && (
              <div className="flex items-center gap-1.5 px-2 bg-white border-t border-l border-slate-600 border-b border-r border-slate-300 rounded-xs h-7 text-xs font-mono shadow-inner">
                <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold font-mono text-xs focus:outline-none cursor-pointer"
                />
              </div>
            )}
            {dateQueryMode === 'PERIOD_RANGE' && (
              <div className="flex items-center gap-1.5 px-2 bg-white border-t border-l border-slate-600 border-b border-r border-slate-300 rounded-xs h-7 text-xs font-mono shadow-inner">
                <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold font-mono text-xs focus:outline-none cursor-pointer"
                />
                <span className="text-slate-500 font-bold">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold font-mono text-xs focus:outline-none cursor-pointer"
                />
              </div>
            )}
            {dateQueryMode === 'ALL_DATA' && (
              <div className="flex items-center gap-1 px-2.5 bg-[#e8e4dc] border-t border-l border-slate-500 border-b border-r border-slate-300 rounded-xs h-7 text-xs font-mono text-slate-600 font-bold shadow-inner">
                <span>All Records Included</span>
              </div>
            )}
          </div>

          {/* Vertical 3D Separator */}
          <div className="h-8 border-r border-[#8a8579] border-l border-white mx-0.5 self-center hidden sm:block" />

          {/* Group 3: SHIPMENT BATCH */}
          <div className="flex flex-col gap-0.5">
            <span className="w-full text-center block mb-1 text-[11px] font-extrabold text-slate-700 uppercase tracking-tighter">
              BATCH FILTER
            </span>
            <div className="flex items-center">
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="bg-white border-t border-l border-slate-600 border-b border-r border-slate-300 text-slate-900 font-mono text-xs font-bold px-2 h-7 rounded-xs focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="ALL">All Batches</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    Shipment {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Classic 3D Excel Download Button */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-8 px-3.5 flex items-center gap-2 bg-[#f0f4f0] hover:bg-[#e2ede2] active:bg-[#d5e5d5] text-[#135223] font-extrabold text-xs rounded-sm border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#5a8a65] shadow-xs cursor-pointer select-none transition-colors"
            title="Download filtered inspection log as Excel (.xlsx)"
          >
            <span className="w-4 h-4 rounded-xs bg-[#107c41] text-white flex items-center justify-center font-mono text-[11px] font-bold shadow-xs">
              X
            </span>
            <span className="tracking-wide font-sans">Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. High-Density 3-Block SCADA Logging Console */}
      {isQuickEntryOpen && (
        <div className="bg-[#e8e4dc] border-2 border-[#b0aaa0] rounded-sm p-3 shadow-md mb-3 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          {/* Title Bar with Classic 3D SAVE Button */}
          <div className="bg-[#0a2540] text-white px-3 py-1.5 flex items-center justify-between rounded-t text-xs font-bold -mx-3 -mt-3 mb-2 border-b border-[#071a2e]">
            <span className="tracking-wider uppercase font-sans font-extrabold text-xs text-white">
              ISO TANK CONDITION LOG
            </span>
            <button
              type="button"
              onClick={handleSaveQuickEntry}
              className="h-7 px-4 flex items-center justify-center gap-1 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 text-xs font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none rounded-xs"
              title="Save Record to Database"
            >
              SAVE
            </button>
          </div>

          <form onSubmit={handleSaveQuickEntry} className="flex flex-col lg:flex-row gap-2 w-full items-stretch">
            {/* BLOCK 1: IDENTIFICATION (28% width on lg) */}
            <div className="w-full lg:w-[28%] min-w-[280px] h-full flex flex-col justify-between p-2.5 bg-[#f4f1ea] border border-[#b0aaa0] rounded-b-sm shadow-inner">
              <div className="bg-[#4a5568] text-white font-extrabold text-xs uppercase tracking-wider py-1.5 px-3 text-center border-t border-l border-[#718096] border-b-2 border-r-2 border-[#2d3748] shadow-xs select-none rounded-t-sm -mx-2.5 -mt-2.5 mb-2.5">
                IDENTIFICATION
              </div>

              <div className="grid grid-cols-12 gap-2 flex-1">
                {/* Row 1: Date (5 cols) & Tank ID (7 cols -> 1 : 1.4 ratio) */}
                <div className="col-span-5">
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    DATE
                  </label>
                  <input
                    type="date"
                    value={wsReportDate}
                    onChange={(e) => setWsReportDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-400 focus:border-[#4a5568] rounded-sm px-1 h-8 text-xs font-mono font-bold text-slate-900 text-center focus:outline-none shadow-inner"
                  />
                </div>

                <div className="col-span-7">
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    TANK ID
                  </label>
                  <select
                    value={wsTankNo}
                    onChange={(e) => handleSelectTankForQuickEntry(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-400 rounded-sm h-8 px-1.5 focus:border-[#4a5568] focus:outline-none cursor-pointer shadow-xs"
                  >
                    {tankInventory.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} ({t.serialNo || 'SIMU'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Batch (5 cols) & Zone (7 cols) */}
                <div className="col-span-5">
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    BATCH
                  </label>
                  <div className="w-full bg-[#e2ded4] text-slate-800 font-bold border border-slate-400 rounded-sm px-1 h-8 text-xs text-center font-mono flex items-center justify-center shadow-inner truncate">
                    {normalizeBatch(wsShipment) || 'N1'}
                  </div>
                </div>

                <div className="col-span-7">
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    ZONE
                  </label>
                  <div className="w-full bg-[#e2ded4] text-slate-800 font-bold border border-slate-400 rounded-sm px-1 h-8 text-xs text-center font-mono flex items-center justify-center shadow-inner truncate">
                    {wsSelectedZone === 'LAYDOWN_2' ? 'LD-2' : wsSelectedZone === 'SKID' ? 'SKID' : 'LD-1'}
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCK 2: FIELD MEASUREMENTS (48% width on lg) */}
            <div className="w-full lg:w-[48%] h-full flex flex-col justify-between p-2.5 bg-[#f4f1ea] border border-[#b0aaa0] rounded-b-sm shadow-inner">
              <div className="bg-[#4a5568] text-white font-extrabold text-xs uppercase tracking-wider py-1.5 px-3 text-center border-t border-l border-[#718096] border-b-2 border-r-2 border-[#2d3748] shadow-xs select-none rounded-t-sm -mx-2.5 -mt-2.5 mb-2.5">
                FIELD MEASUREMENTS
              </div>

              <div className="flex flex-col justify-between gap-2 flex-1">
                {/* Row 1: Analog Gauge (Press, Level, Calc Vol, Calc Mass) */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      PRESS (MPa)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={wsPressureMPa}
                      onChange={(e) => setWsPressureMPa(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-400 text-slate-900 focus:border-[#4a5568] rounded-sm px-1 h-8 text-sm font-mono font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      LEVEL (mmH2O)
                    </label>
                    <input
                      type="number"
                      value={wsLevelMmH2O}
                      onChange={(e) => handleMmH2OChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-400 text-slate-900 focus:border-[#4a5568] rounded-sm px-1 h-8 text-sm font-mono font-bold text-slate-900 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      CALC VOL (m³)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={wsLevelM3.toFixed(1)}
                      className="w-full bg-[#eef5fc] text-[#004a99] border border-[#cbe2fb] rounded-sm px-1 h-8 text-sm font-mono font-extrabold text-center cursor-not-allowed shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      CALC MASS (ton)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={calcMassTonFromVolume(wsLevelM3).toFixed(2)}
                      className="w-full bg-[#eef5fc] text-[#004a99] border border-[#cbe2fb] rounded-sm px-1 h-8 text-sm font-mono font-extrabold text-center cursor-not-allowed shadow-inner"
                    />
                  </div>
                </div>

                {/* Row 2: SMT Telemetry (Press, Level, Temp, Batt) */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#e2ded4]">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      PRESS (MPa)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.73"
                      value={wsSmtPress}
                      onChange={(e) => setWsSmtPress(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-400 text-slate-900 focus:border-[#4a5568] rounded-sm px-1 h-8 text-sm font-mono font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      LEVEL (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="63.0"
                      value={wsSmtLevel}
                      onChange={(e) => setWsSmtLevel(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-400 text-slate-900 focus:border-[#4a5568] rounded-sm px-1 h-8 text-sm font-mono font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      TEMP (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="-126.5"
                      value={wsSmtTemp}
                      onChange={(e) => setWsSmtTemp(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-400 text-slate-900 focus:border-[#4a5568] rounded-sm px-1 h-8 text-sm font-mono font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                      BATT (%)
                    </label>
                    <input
                      type="number"
                      placeholder="75"
                      value={wsSmtBattery}
                      onChange={(e) => setWsSmtBattery(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-slate-400 text-slate-900 focus:border-[#4a5568] rounded-sm px-1 h-8 text-sm font-mono font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCK 3: BOG VENTING (24% width on lg) */}
            <div className="w-full lg:w-[24%] h-full flex flex-col justify-between p-2.5 bg-[#f4f1ea] border border-[#b0aaa0] rounded-b-sm shadow-inner">
              <div className="bg-[#4a5568] text-white font-extrabold text-xs uppercase tracking-wider py-1.5 px-3 text-center border-t border-l border-[#718096] border-b-2 border-r-2 border-[#2d3748] shadow-xs select-none rounded-t-sm -mx-2.5 -mt-2.5 mb-2.5">
                BOG VENTING
              </div>

              <div className="grid grid-cols-2 gap-2 flex-1">
                {/* Row 1: Start & End */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    START (MPa)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.80"
                    value={wsPressBefore}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setWsPressBefore(val);
                      const dP = Math.max(0, parseFloat((val - wsPressAfter).toFixed(3)));
                      setWsBogVentedKg(Math.round(dP * 100 * 25.5));
                    }}
                    className="w-full bg-white border border-slate-400 text-slate-900 font-mono font-bold text-center focus:border-[#4a5568] focus:outline-none h-8 rounded-sm text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    END (MPa)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.73"
                    value={wsPressAfter}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setWsPressAfter(val);
                      const dP = Math.max(0, parseFloat((wsPressBefore - val).toFixed(3)));
                      setWsBogVentedKg(Math.round(dP * 100 * 25.5));
                    }}
                    className="w-full bg-white border border-slate-400 text-slate-900 font-mono font-bold text-center focus:border-[#4a5568] focus:outline-none h-8 rounded-sm text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Row 2: ΔP & BOG Loss */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    ΔP (MPa)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${Math.max(0, parseFloat((wsPressBefore - wsPressAfter).toFixed(3))).toFixed(2)}`}
                    className="w-full bg-[#eef5fc] text-[#004a99] border border-[#cbe2fb] font-mono font-extrabold text-center h-8 rounded-sm text-sm cursor-not-allowed shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 whitespace-nowrap mb-1 text-center truncate">
                    BOG LOSS (kg)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      Math.max(0, parseFloat((wsPressBefore - wsPressAfter).toFixed(3))) > 0
                        ? Math.round(Math.max(0, parseFloat((wsPressBefore - wsPressAfter).toFixed(3))) * 100 * 25.5)
                        : 0
                    }
                    className="w-full bg-[#eef5fc] text-[#004a99] border border-[#cbe2fb] font-mono font-extrabold text-center h-8 rounded-sm text-sm cursor-not-allowed shadow-inner"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 3. Master Log Table (Grouped 2-Tier Excel Grid - Polished 1:1 SCADA Palette) */}
      <div className="bg-white border border-[#bcb5a6] rounded-t overflow-hidden shadow-xs">
        {/* Top Navy Header Bar */}
        <div className="bg-[#0a2540] text-white px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#071a2e]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-extrabold text-xs uppercase tracking-wider text-white whitespace-nowrap">
              DAILY INSPECTION &amp; BOG LOG
            </span>
            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                onClick={() => setZoneFilter('ALL')}
                className={`cursor-pointer transition-all ${
                  zoneFilter === 'ALL'
                    ? 'bg-[#2a4d7d] text-white border-t-2 border-l-2 border-[#1a3356] border-b border-r border-[#648dbf] shadow-inner font-extrabold text-xs px-2.5 py-0.5 rounded-sm'
                    : 'bg-[#d4d0c8] hover:bg-[#e2ded6] text-slate-900 border-t border-l border-white border-b-2 border-r-2 border-[#706c64] shadow-xs font-bold text-xs px-2.5 py-0.5 rounded-sm select-none'
                }`}
              >
                ALL
              </button>
              <button
                type="button"
                onClick={() => setZoneFilter('LAYDOWN_1')}
                className={`cursor-pointer transition-all ${
                  zoneFilter === 'LAYDOWN_1'
                    ? 'bg-[#2a4d7d] text-white border-t-2 border-l-2 border-[#1a3356] border-b border-r border-[#648dbf] shadow-inner font-extrabold text-xs px-2.5 py-0.5 rounded-sm'
                    : 'bg-[#d4d0c8] hover:bg-[#e2ded6] text-slate-900 border-t border-l border-white border-b-2 border-r-2 border-[#706c64] shadow-xs font-bold text-xs px-2.5 py-0.5 rounded-sm select-none'
                }`}
              >
                LD-1 ({ld1Count})
              </button>
              <button
                type="button"
                onClick={() => setZoneFilter('SKID')}
                className={`cursor-pointer transition-all ${
                  zoneFilter === 'SKID'
                    ? 'bg-[#2a4d7d] text-white border-t-2 border-l-2 border-[#1a3356] border-b border-r border-[#648dbf] shadow-inner font-extrabold text-xs px-2.5 py-0.5 rounded-sm'
                    : 'bg-[#d4d0c8] hover:bg-[#e2ded6] text-slate-900 border-t border-l border-white border-b-2 border-r-2 border-[#706c64] shadow-xs font-bold text-xs px-2.5 py-0.5 rounded-sm select-none'
                }`}
              >
                SKID ({skidCount})
              </button>
              <button
                type="button"
                onClick={() => setZoneFilter('LAYDOWN_2')}
                className={`cursor-pointer transition-all ${
                  zoneFilter === 'LAYDOWN_2'
                    ? 'bg-[#2a4d7d] text-white border-t-2 border-l-2 border-[#1a3356] border-b border-r border-[#648dbf] shadow-inner font-extrabold text-xs px-2.5 py-0.5 rounded-sm'
                    : 'bg-[#d4d0c8] hover:bg-[#e2ded6] text-slate-900 border-t border-l border-white border-b-2 border-r-2 border-[#706c64] shadow-xs font-bold text-xs px-2.5 py-0.5 rounded-sm select-none'
                }`}
              >
                LD-2 ({ld2Count})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Classic 3D Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="search tank / serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white text-slate-900 text-xs px-2.5 py-1 rounded-sm border-t-2 border-l-2 border-[#7a7a7a] border-b border-r border-[#dfdfdf] placeholder-slate-400 focus:outline-none w-48 shadow-inner"
              />
            </div>

            {/* Classic 3D + New Entry Button (Matching Gray Style) */}
            <button
              type="button"
              onClick={() => setIsQuickEntryOpen(!isQuickEntryOpen)}
              className="bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 text-xs font-bold px-3 py-1 rounded-sm border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs select-none cursor-pointer"
            >
              {isQuickEntryOpen ? 'Close Entry' : '+ New Entry'}
            </button>
          </div>
        </div>

        {/* Direct Embedded CSS with !important for complete browser priority */}
        <style>{`
          .custom-calc-vol-hdr {
            background-color: #2b78c5 !important;
            color: #ffffff !important;
          }
          .custom-calc-vol-cell {
            background-color: #f0f7ff !important;
            color: #004a99 !important;
          }
        `}</style>
        <div className="max-h-[620px] overflow-y-auto custom-scada-scrollbar overflow-x-hidden">
          <table className="w-full table-fixed text-left border-collapse border border-[#bcb5a6] text-xs">
            <colgroup>
              <col className="w-[90px]" />
              <col className="w-[82px]" />
              <col className="w-[105px]" />
              <col className="w-[50px]" />
              <col className="w-[55px]" />
              <col className="w-[68px]" />
              <col className="w-[62px]" />
              <col className="w-[66px]" />
              <col className="w-[70px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[52px]" />
              <col className="w-[66px]" />
              <col className="w-[68px]" />
              <col className="w-[58px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 font-mono text-xs select-none shadow-xs">
              {/* Tier 1 Header (Row 1: #4e5d6e, border #8b9aa8) */}
              <tr className="text-[11px] font-extrabold uppercase">
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  DATE
                </th>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  TANK ID
                </th>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  SERIAL NO
                </th>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  BATCH
                </th>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  ZONE
                </th>
                {/* ANALOG GAUGE Group Header */}
                <th
                  colSpan={4}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  ANALOG GAUGE
                </th>
                {/* SMT TELEMETRY Group Header */}
                <th
                  colSpan={4}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  SMT TELEMETRY
                </th>
                {/* Process & Action Headers */}
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>BOG VENT</span>
                    <span className="text-[10px] text-slate-200 font-normal lowercase">(kg)</span>
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  STATUS
                </th>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: '#4e5d6e', color: '#f8fafc', borderBottom: '1px solid #8b9aa8' }}
                  className="font-extrabold text-xs uppercase py-2 px-1 text-center tracking-wider"
                >
                  ACTIONS
                </th>
              </tr>

              {/* Tier 2 Sub-Headers (Row 2: #5f6f82, highlight #2b78c5, border #8b9aa8) */}
              <tr className="uppercase text-xs font-bold">
                {/* ANALOG GAUGE Sub-headers */}
                <th
                  style={{ backgroundColor: '#5f6f82', color: '#f1f5f9', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-bold text-[11px] uppercase py-1.5 px-1 text-center tracking-wider"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>LEVEL</span>
                    <span className="text-[10px] text-slate-300 font-normal">(mmH2O)</span>
                  </div>
                </th>
                <th
                  style={{ backgroundColor: '#5f6f82', color: '#f1f5f9', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-bold text-[11px] uppercase py-1.5 px-1 text-center tracking-wider"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>PRESS</span>
                    <span className="text-[10px] text-slate-300 font-normal">(MPa)</span>
                  </div>
                </th>
                {/* Highlight Column: CALC VOL */}
                <th
                  style={{ backgroundColor: '#2b78c5', color: '#ffffff', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="custom-calc-vol-hdr font-black text-[11px] uppercase py-1.5 px-1 text-center"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>CALC VOL</span>
                    <span className="text-[10px] text-blue-100 font-normal">(m³)</span>
                  </div>
                </th>
                {/* Highlight Column: CALC MASS */}
                <th
                  style={{ backgroundColor: '#2b78c5', color: '#ffffff', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="custom-calc-vol-hdr font-black text-[11px] uppercase py-1.5 px-1 text-center"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>CALC MASS</span>
                    <span className="text-[10px] text-blue-100 font-normal">(ton)</span>
                  </div>
                </th>

                {/* SMT TELEMETRY Sub-headers */}
                <th
                  style={{ backgroundColor: '#5f6f82', color: '#f1f5f9', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-bold text-[11px] uppercase py-1.5 px-1 text-center tracking-wider"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>PRESS</span>
                    <span className="text-[10px] text-slate-300 font-normal">(MPa)</span>
                  </div>
                </th>
                <th
                  style={{ backgroundColor: '#5f6f82', color: '#f1f5f9', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-bold text-[11px] uppercase py-1.5 px-1 text-center tracking-wider"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>LEVEL</span>
                    <span className="text-[10px] text-slate-300 font-normal">(%)</span>
                  </div>
                </th>
                <th
                  style={{ backgroundColor: '#5f6f82', color: '#f1f5f9', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-bold text-[11px] uppercase py-1.5 px-1 text-center tracking-wider"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>TEMP</span>
                    <span className="text-[10px] text-slate-300 font-normal">(°C)</span>
                  </div>
                </th>
                <th
                  style={{ backgroundColor: '#5f6f82', color: '#f1f5f9', borderBottom: '1px solid #8b9aa8', borderRight: '1px solid #8b9aa8' }}
                  className="font-bold text-[11px] uppercase py-1.5 px-1 text-center tracking-wider"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>BATT</span>
                    <span className="text-[10px] text-slate-300 font-normal">(%)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-[#e8e4dc] font-mono">
              {masterInspectionList.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-500 font-mono">
                    No inspection records found for the selected filters.
                  </td>
                </tr>
              ) : (
                masterInspectionList.map((rec) => {
                  const isHighPress = (rec.pressureMPa || 0) >= 0.74;
                  const rawMmH2O = rec.levelMmH2O || (rec.level ? Math.round((rec.level / 100) * 950) : 465);
                  const calcVol = calcVolumeFromMmH2O(rawMmH2O);
                  const calcMassTon = calcMassTonFromVolume(calcVol);
                  const liveTank = tankInventory.find((t) => t.id === rec.tankNo);
                  const zoneBadge =
                    liveTank?.currentZone === 'LAYDOWN_2' || (rec.position || '').toLowerCase().includes('laydown 2')
                      ? 'LD-2'
                      : liveTank?.currentZone?.startsWith('BAY') || (rec.position || '').toLowerCase().includes('bay')
                      ? 'SKID'
                      : 'LD-1';

                  const smtPress = (rec.pressureMPa || 0.76);
                  const smtLevel = rec.level ?? parseFloat(((rawMmH2O / 950) * 100).toFixed(1));
                  const smtTemp = (rec.tempC !== undefined && rec.tempC !== null) ? rec.tempC.toFixed(1) : '-126.7';
                  const smtBatt = rec.battery || 72;
                  const normalizedBatch = normalizeBatch(rec.shipment) || 'N1';

                  return (
                    <tr
                      key={rec.id || `${rec.reportDate}-${rec.tankNo}`}
                      className="bg-white even:bg-[#fbfaf8] hover:bg-[#eaf2fb] transition-colors border-b border-[#e8e4dc]"
                    >
                      {/* 1. Date */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] text-slate-800 font-semibold text-xs truncate">
                        {rec.reportDate}
                      </td>

                      {/* 2. Tank ID */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] truncate">
                        <button
                          type="button"
                          onClick={() => handleOpenTankTrendModal(rec.tankNo)}
                          className="text-[#0055aa] font-extrabold underline underline-offset-2 cursor-pointer hover:text-blue-800 text-[13px] font-mono"
                          title="Open Large-Scale SCADA Historical Trend Analytics Console"
                        >
                          {rec.tankNo}
                        </button>
                      </td>

                      {/* 3. Serial No */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] font-mono text-slate-700 text-xs font-medium truncate">
                        {rec.serialNo}
                      </td>

                      {/* 4. Batch */}
                      <td className="py-1.5 px-1 text-center border-r border-[#e8e4dc]">
                        <span className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded text-xs font-bold font-mono">
                          {normalizedBatch}
                        </span>
                      </td>

                      {/* 5. Zone */}
                      <td className="py-1.5 px-1 text-center border-r border-[#e8e4dc]">
                        <span className="border border-sky-300 text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded text-xs font-bold font-mono">
                          {zoneBadge}
                        </span>
                      </td>

                      {/* ANALOG GAUGE 4 Columns */}
                      {/* 6. Level (mmH2O) */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] text-slate-950 font-bold text-sm font-mono">
                        {rawMmH2O}
                      </td>

                      {/* 7. Pressure (MPa) */}
                      <td
                        className={`py-1.5 px-2 text-center border-r border-[#e8e4dc] font-bold text-sm font-mono ${
                          isHighPress ? 'text-amber-600 bg-amber-50/70' : 'text-slate-950'
                        }`}
                      >
                        {(rec.pressureMPa || 0).toFixed(2)}
                      </td>

                      {/* 8. Highlight Column: Calc Volume (m³) */}
                      <td
                        style={{ backgroundColor: '#f0f7ff', color: '#004a99', borderRight: '1px solid #d4e6f8', borderBottom: '1px solid #e2ddd2' }}
                        className="custom-calc-vol-cell font-bold font-mono text-sm py-1.5 px-2 text-center"
                      >
                        {calcVol.toFixed(1)}
                      </td>

                      {/* 9. Highlight Column: Calc Mass (ton) */}
                      <td
                        style={{ backgroundColor: '#f0f7ff', color: '#004a99', borderRight: '1px solid #d4e6f8', borderBottom: '1px solid #e2ddd2' }}
                        className="custom-calc-vol-cell font-bold font-mono text-sm py-1.5 px-2 text-center"
                      >
                        {calcMassTon.toFixed(2)}
                      </td>

                      {/* SMT TELEMETRY 4 Columns */}
                      {/* 10. SMT Press (MPa) */}
                      <td
                        className={`py-1.5 px-2 text-center border-r border-[#e8e4dc] font-mono text-sm ${
                          smtPress >= 0.74 ? 'text-amber-600 bg-amber-50/70 font-bold' : 'text-slate-900 font-bold'
                        }`}
                      >
                        {smtPress.toFixed(2)}
                      </td>

                      {/* 11. SMT Level (%) */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold text-sm font-mono">
                        {smtLevel.toFixed(1)}%
                      </td>

                      {/* 12. SMT Temp (°C) */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] text-slate-800 font-bold text-sm font-mono">
                        {smtTemp}
                      </td>

                      {/* 13. SMT Batt (%) */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] text-slate-800 font-bold text-sm font-mono">
                        {smtBatt}%
                      </td>

                      {/* PROCESS & ACTIONS */}
                      {/* 14. BOG Vent (kg) */}
                      <td className="py-1.5 px-2 text-center border-r border-[#e8e4dc] text-slate-950 font-bold text-sm font-mono">
                        {rec.lossesKg || 0}
                      </td>

                      {/* 15. Status */}
                      <td className="py-1.5 px-1 text-center border-r border-[#e8e4dc]">
                        {(rec.lossesKg || 0) > 0 ? (
                          <span className="border border-amber-300 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
                            VENTED
                          </span>
                        ) : isHighPress ? (
                          <span className="border border-red-300 text-red-800 bg-red-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
                            HIGH P
                          </span>
                        ) : (
                          <span className="border border-emerald-300 text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
                            NORMAL
                          </span>
                        )}
                      </td>

                      {/* 16. Actions */}
                      <td className="py-1.5 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditRow(rec)}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-100 rounded cursor-pointer transition-colors"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRecordToDelete({
                                id: rec.id || `rec-${rec.tankNo}`,
                                tankNo: rec.tankNo,
                                serialNo: rec.serialNo || '',
                                reportDate: rec.reportDate,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
