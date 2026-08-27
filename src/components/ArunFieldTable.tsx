// src/components/ArunFieldTable.tsx
"use client";

import React from 'react';
import { getTankPhysicalMetrics, FleetTankItem, LNG_LIQUID_DENSITY_KG_M3 } from '../data/mockTankData';
import { Search } from 'lucide-react';

interface ActiveBatchItem {
  tankNo: string;
  [key: string]: unknown;
}

interface ArunFieldTableProps {
  logisticsMode: 'STAGED_ARUN' | 'SAVIOUR_CANDIDATES';
  setLogisticsMode: (mode: 'STAGED_ARUN' | 'SAVIOUR_CANDIDATES') => void;
  yardSearch: string;
  setYardSearch: (val: string) => void;
  saviourCandidateTanks: FleetTankItem[];
  arunYardTanks: FleetTankItem[];
  filteredYardTanks: FleetTankItem[];
  filteredSaviourTanks: FleetTankItem[];
  selectedYardTanks: Set<string>;
  selectedSaviourTanks: Set<string>;
  toggleSelectYardTank: (tankNo: string) => void;
  toggleSelectSaviourTank: (tankNo: string) => void;
  selectAllYard: () => void;
  selectAllSaviour: () => void;
  handleDischargeToArunYard: () => void;
  onProceedToLoad: () => void;
  setSelectedHeelAuditTankNo: (tankNo: string | null) => void;
  activeBatchRecords: ActiveBatchItem[];
}

export default function ArunFieldTable({
  logisticsMode,
  setLogisticsMode,
  yardSearch,
  setYardSearch,
  saviourCandidateTanks,
  arunYardTanks,
  filteredYardTanks,
  filteredSaviourTanks,
  selectedYardTanks,
  selectedSaviourTanks,
  toggleSelectYardTank,
  toggleSelectSaviourTank,
  selectAllYard,
  selectAllSaviour,
  handleDischargeToArunYard,
  onProceedToLoad,
  setSelectedHeelAuditTankNo,
  activeBatchRecords,
}: ArunFieldTableProps) {
  const isYard = logisticsMode === 'STAGED_ARUN';
  const activeTanks = isYard ? filteredYardTanks : filteredSaviourTanks;
  const activeSelection = isYard ? selectedYardTanks : selectedSaviourTanks;
  const toggleSelect = isYard ? toggleSelectYardTank : toggleSelectSaviourTank;
  const selectAll = isYard ? selectAllYard : selectAllSaviour;

  return (
    <div className="bg-white border border-slate-300 win-panel overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-2.5 border-b border-slate-300 bg-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-blue-900 font-bold text-sm tracking-wide">
            ISO Tank Condition
          </h3>

          {/* 2-Mode Logistics Segmented Toggle in Chronological Logistics Order (Classic 3D Bevel) */}
          <div className="flex items-center gap-1.5">
            {/* Mode 1: M/V Saviour (Incoming vessel inventory) */}
            <button
              type="button"
              onClick={() => setLogisticsMode('SAVIOUR_CANDIDATES')}
              className={`px-3 py-1 text-xs font-bold font-mono transition-all ${
                logisticsMode === 'SAVIOUR_CANDIDATES'
                  ? 'border-t-[#404040] border-l-[#404040] border-r-white border-b-white border-2 bg-[#c8c4bc] text-blue-900 shadow-inner'
                  : 'border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 bg-[#d4d0c8] text-slate-800 hover:bg-[#dedad2] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white cursor-pointer'
              }`}
            >
              M/V Saviour ({saviourCandidateTanks.length})
            </button>

            {/* Mode 2: PAGT (Staged yard inventory ready for loading) */}
            <button
              type="button"
              onClick={() => setLogisticsMode('STAGED_ARUN')}
              className={`px-3 py-1 text-xs font-bold font-mono transition-all ${
                logisticsMode === 'STAGED_ARUN'
                  ? 'border-t-[#404040] border-l-[#404040] border-r-white border-b-white border-2 bg-[#c8c4bc] text-blue-900 shadow-inner'
                  : 'border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 bg-[#d4d0c8] text-slate-800 hover:bg-[#dedad2] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white cursor-pointer'
              }`}
            >
              PAGT ({arunYardTanks.length})
            </button>
          </div>
        </div>

        {/* Search & Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tank / serial..."
              value={yardSearch}
              onChange={(e) => setYardSearch(e.target.value)}
              className="win-panel rounded-none pl-7 pr-2 py-0.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 w-44"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
          </div>

          {/* Mode A (M/V Saviour) Action Buttons */}
          {logisticsMode === 'SAVIOUR_CANDIDATES' && (
            <>
              <button
                type="button"
                onClick={selectAllSaviour}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-800 text-xs font-bold px-3 py-1 border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 cursor-pointer active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white transition-all"
              >
                {selectedSaviourTanks.size === filteredSaviourTanks.length &&
                filteredSaviourTanks.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>

              <button
                type="button"
                disabled={selectedSaviourTanks.size === 0}
                onClick={handleDischargeToArunYard}
                className={`text-xs font-bold px-3 py-1 border-2 transition-all flex items-center gap-1.5 ${
                  selectedSaviourTanks.size > 0
                    ? 'bg-[#155724] hover:bg-[#1e7e34] text-white border-t-emerald-400 border-l-emerald-400 border-r-[#0b2e13] border-b-[#0b2e13] cursor-pointer active:border-t-[#0b2e13] active:border-l-[#0b2e13] active:border-r-emerald-400 active:border-b-emerald-400'
                    : 'bg-[#d4d0c8] text-slate-400 border-[#a09c94] cursor-not-allowed opacity-60'
                }`}
              >
                <span>Disch. to Arun ({selectedSaviourTanks.size})</span>
              </button>
            </>
          )}

          {/* Mode B (PAGT) Action Buttons */}
          {logisticsMode === 'STAGED_ARUN' && (
            <>
              <button
                type="button"
                onClick={selectAllYard}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-800 text-xs font-bold px-3 py-1 border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 cursor-pointer active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white transition-all"
              >
                {selectedYardTanks.size === filteredYardTanks.length &&
                filteredYardTanks.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>

              <button
                type="button"
                disabled={selectedYardTanks.size === 0}
                onClick={onProceedToLoad}
                className={`text-xs font-bold px-3 py-1 border-2 transition-all flex items-center gap-1.5 ${
                  selectedYardTanks.size > 0
                    ? 'bg-[#0a2558] hover:bg-[#12397a] text-white border-t-blue-400 border-l-blue-400 border-r-[#001030] border-b-[#001030] cursor-pointer active:border-t-[#001030] active:border-l-[#001030] active:border-r-blue-400 active:border-b-blue-400 shadow-md'
                    : 'bg-[#d4d0c8] text-slate-400 border-[#a09c94] cursor-not-allowed opacity-60'
                }`}
              >
                <span>Proceed to Load ({selectedYardTanks.size}) -&gt;</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Unified Fleet Table Rendering with Auto-Scrolling and Sticky Header */}
      <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto border border-slate-300">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 bg-[#e8e6e1] z-10 text-slate-900 font-bold text-xs uppercase tracking-wider border-b border-slate-300">
            <tr>
              <th className="p-2.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    activeSelection.size > 0 &&
                    activeSelection.size === activeTanks.length
                  }
                  onChange={selectAll}
                  className={`rounded-none border-slate-300 bg-white text-slate-900 cursor-pointer ${
                    isYard ? 'accent-blue-600' : 'accent-emerald-600'
                  }`}
                />
              </th>
              <th className="p-2.5">TANK NO</th>
              <th className="p-2.5">SERIAL NO</th>
              <th className="p-2.5 text-right">DRY TARE (KG)</th>
              <th className="p-2.5 text-right">HEEL (KG / m³)</th>
              <th className="p-2.5 text-right bg-blue-100/60 text-blue-950">PRE-LOAD TARE (KG)</th>
              <th className="p-2.5 text-right">PRESSURE</th>
              <th className="p-2.5 text-right">TEMP</th>
              <th className="p-2.5 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {activeTanks.map((tank) => {
              const isSelected = activeSelection.has(tank.tankNo);
              const isCertified =
                isYard &&
                (activeBatchRecords.some((r) => r.tankNo === tank.tankNo) ||
                  tank.position === 'ARUN_STAGED_FOR_DEPARTURE');
              const metrics = getTankPhysicalMetrics(tank.tankNo, tank.serialNo);
              const dryTare = tank.arrivalHeelMetrics?.tareWeightKg || metrics.dryTareKg;
              const heelMass = tank.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
              const heelVol = metrics.heelVolumeM3 || (heelMass / LNG_LIQUID_DENSITY_KG_M3);
              const preLoadTare = dryTare + heelMass;
              const pressMpa = tank.pressureMPa || metrics.pressureMPa;
              const tempC = tank.tempC || metrics.tempC;

              return (
                <tr
                  key={tank.tankNo}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    isSelected
                      ? 'bg-blue-50'
                      : isCertified
                      ? 'bg-cyan-50/50'
                      : 'bg-white'
                  }`}
                >
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(tank.tankNo)}
                      className={`rounded-none border-slate-300 bg-white text-slate-900 cursor-pointer ${
                        isYard ? 'accent-blue-600' : 'accent-emerald-600'
                      }`}
                    />
                  </td>
                  <td className="p-2.5 font-bold flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedHeelAuditTankNo(tank.tankNo)}
                      className="text-sm font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer font-mono"
                      title="Open Heel Preservation & Transit Audit Console"
                    >
                      {tank.tankNo}
                    </button>
                    {isCertified && (
                      <span
                        className="w-1.5 h-1.5 rounded-none bg-cyan-500 inline-block animate-pulse"
                        title="Loaded & Staged for Marine Departure"
                      />
                    )}
                  </td>
                  <td className="p-2.5 text-sm font-mono text-slate-800">{tank.serialNo}</td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900 font-semibold">
                    {dryTare.toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900 font-semibold">
                    <span className="text-slate-900 font-semibold">{heelMass.toLocaleString()} kg</span>{' '}
                    <span className="text-blue-900 text-xs font-bold">({heelVol.toFixed(2)} m³)</span>
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-blue-900 font-bold bg-blue-50/50">
                    {preLoadTare.toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900">
                    {pressMpa.toFixed(2)} MPa
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900">
                    {tempC.toFixed(1)} °C
                  </td>
                  <td className="p-2.5 text-center font-sans">
                    {isYard ? (
                      isCertified ? (
                        <span className="px-2 py-0.5 rounded-none bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold inline-flex items-center gap-1">
                          Offloaded / Staged
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-none bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold inline-flex items-center gap-1">
                          Ready for Loading
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-none bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold inline-flex items-center gap-1">
                        Offload Ready
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {activeTanks.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-700 font-sans text-xs">
                  {isYard
                    ? 'No ISO Tanks currently staged in Arun PAG Yard.'
                    : 'No candidate tanks found onboard M/V Saviour.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
