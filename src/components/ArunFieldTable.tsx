// src/components/ArunFieldTable.tsx
"use client";

import React, { useMemo, useState } from 'react';
import { getTankPhysicalMetrics, FleetTankItem, LNG_LIQUID_DENSITY_KG_M3 } from '../data/mockTankData';
import { Search } from 'lucide-react';

interface ActiveBatchItem {
  tankNo: string;
  [key: string]: unknown;
}

type TankStatus = 'READY' | 'REPAIR';

interface ArunFieldTableProps {
  logisticsMode?: 'STAGED_ARUN' | 'SAVIOUR_CANDIDATES';
  setLogisticsMode?: (mode: 'STAGED_ARUN' | 'SAVIOUR_CANDIDATES') => void;
  yardSearch?: string;
  setYardSearch?: (val: string) => void;
  saviourCandidateTanks?: FleetTankItem[];
  arunYardTanks?: FleetTankItem[];
  filteredYardTanks?: FleetTankItem[];
  filteredSaviourTanks?: FleetTankItem[];
  selectedYardTanks?: Set<string>;
  selectedSaviourTanks?: Set<string>;
  toggleSelectYardTank?: (tankNo: string) => void;
  toggleSelectSaviourTank?: (tankNo: string) => void;
  selectAllYard?: () => void;
  selectAllSaviour?: () => void;
  handleDischargeToArunYard?: () => void;
  onProceedToLoad?: (tankStatusMap?: Record<string, TankStatus>) => void;
  setSelectedHeelAuditTankNo?: (tankNo: string | null) => void;
  activeBatchRecords?: ActiveBatchItem[];
  [key: string]: any;
}

export default function ArunFieldTable({
  logisticsMode = 'STAGED_ARUN',
  setLogisticsMode = () => {},
  yardSearch = '',
  setYardSearch = () => {},
  saviourCandidateTanks = [],
  arunYardTanks = [],
  filteredYardTanks = [],
  filteredSaviourTanks = [],
  selectedYardTanks = new Set(),
  selectedSaviourTanks = new Set(),
  toggleSelectYardTank = () => {},
  toggleSelectSaviourTank = () => {},
  selectAllYard = () => {},
  selectAllSaviour = () => {},
  handleDischargeToArunYard = () => {},
  onProceedToLoad = () => {},
  setSelectedHeelAuditTankNo = () => {},
  activeBatchRecords = [],
  ...props
}: ArunFieldTableProps) {
  const [tankStatusMap, setTankStatusMap] = useState<Record<string, TankStatus>>({});
  const safeSaviourCandidateTanks = Array.isArray(saviourCandidateTanks) ? saviourCandidateTanks : [];
  const safeArunYardTanks = Array.isArray(arunYardTanks) ? arunYardTanks : [];
  const safeFilteredYardTanks = Array.isArray(filteredYardTanks) ? filteredYardTanks : [];
  const safeFilteredSaviourTanks = Array.isArray(filteredSaviourTanks) ? filteredSaviourTanks : [];
  const safeBatchRecords = Array.isArray(activeBatchRecords) ? activeBatchRecords : [];
  const safeSelectedYardTanks = selectedYardTanks instanceof Set ? selectedYardTanks : new Set();
  const safeSelectedSaviourTanks = selectedSaviourTanks instanceof Set ? selectedSaviourTanks : new Set();

  const isYard = logisticsMode === 'STAGED_ARUN';
  const activeTanks = isYard ? safeFilteredYardTanks : safeFilteredSaviourTanks;
  const activeSelection = isYard ? safeSelectedYardTanks : safeSelectedSaviourTanks;
  const toggleSelect = isYard ? toggleSelectYardTank : toggleSelectSaviourTank;
  const selectAll = isYard ? selectAllYard : selectAllSaviour;

  const getTankStatus = (tankNo: string): TankStatus => tankStatusMap[tankNo] || 'READY';
  const statusOptions: Array<{ value: TankStatus; label: string; className: string }> = [
    { value: 'READY', label: 'Ready', className: 'bg-sky-50 text-sky-800 border-sky-300 font-medium px-2 py-0.5 rounded text-xs' },
    { value: 'REPAIR', label: 'Repair', className: 'bg-amber-50 text-amber-900 border-amber-400 font-bold px-2 py-0.5 rounded text-xs' },
  ];

  const statusSelectClass = (status: TankStatus) => {
    const match = statusOptions.find((option) => option.value === status);
    return match?.className || 'bg-sky-50 text-sky-800 border-sky-300 font-medium px-2 py-0.5 rounded text-xs';
  };

  return (
    <div className="bg-white border border-slate-300 win-panel overflow-hidden rounded-t">
      <div className="bg-[#0a2558] text-white px-3 py-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 rounded-t">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-white font-bold text-sm tracking-wide uppercase">
            ISO Tank Condition
          </h3>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLogisticsMode('STAGED_ARUN')}
              className={`px-3 py-1 text-xs md:text-sm font-extrabold tracking-tight font-mono transition-all whitespace-nowrap ${logisticsMode === 'STAGED_ARUN'
                ? 'border-t-[#404040] border-l-[#404040] border-r-white border-b-white border-2 bg-[#c8c4bc] text-blue-900 shadow-inner'
                : 'border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 bg-[#d4d0c8] text-slate-800 hover:bg-[#dedad2] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white cursor-pointer'
                }`}
            >
              PAGT Yard ({safeArunYardTanks.length})
            </button>

            <button
              type="button"
              onClick={() => setLogisticsMode('SAVIOUR_CANDIDATES')}
              className={`px-3 py-1 text-xs md:text-sm font-extrabold tracking-tight font-mono transition-all whitespace-nowrap ${logisticsMode === 'SAVIOUR_CANDIDATES'
                ? 'border-t-[#404040] border-l-[#404040] border-r-white border-b-white border-2 bg-[#c8c4bc] text-blue-900 shadow-inner'
                : 'border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 bg-[#d4d0c8] text-slate-800 hover:bg-[#dedad2] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white cursor-pointer'
                }`}
            >
              M/V Saviour ({safeSaviourCandidateTanks.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {logisticsMode === 'SAVIOUR_CANDIDATES' && (
            <>
              <button
                type="button"
                onClick={selectAllSaviour}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-800 text-xs font-bold px-3 py-1 border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 cursor-pointer active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white transition-all whitespace-nowrap"
              >
                {safeSelectedSaviourTanks.size === safeFilteredSaviourTanks.length &&
                  safeFilteredSaviourTanks.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>

              <button
                type="button"
                disabled={safeSelectedSaviourTanks.size === 0}
                onClick={handleDischargeToArunYard}
                className={`text-xs font-bold px-3 py-1 border-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${safeSelectedSaviourTanks.size > 0
                  ? 'bg-[#155724] hover:bg-[#1e7e34] text-white border-t-emerald-400 border-l-emerald-400 border-r-[#0b2e13] border-b-[#0b2e13] cursor-pointer active:border-t-[#0b2e13] active:border-l-[#0b2e13] active:border-r-emerald-400 active:border-b-emerald-400'
                  : 'bg-[#d4d0c8] text-slate-400 border-[#a09c94] cursor-not-allowed opacity-60'
                  }`}
              >
                <span>Disch. to Arun ({safeSelectedSaviourTanks.size})</span>
              </button>
            </>
          )}

          {logisticsMode === 'STAGED_ARUN' && (
            <>
              <button
                type="button"
                onClick={selectAllYard}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-800 text-xs font-bold px-3 py-1 border-t-white border-l-white border-r-[#808080] border-b-[#808080] border-2 cursor-pointer active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white transition-all whitespace-nowrap"
              >
                {safeFilteredYardTanks.length > 0 && safeSelectedYardTanks.size === safeFilteredYardTanks.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>

              <button
                type="button"
                disabled={safeSelectedYardTanks.size === 0}
                onClick={() => onProceedToLoad(tankStatusMap)}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-slate-800 text-xs font-bold px-3 py-1 rounded-sm shadow-sm transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#d4d0c8]"
              >
                Send ({safeSelectedYardTanks.size})
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto overflow-x-auto border border-slate-300 border-t-0 bg-white">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-10 bg-[#e8e6df] text-[#0a2558] border-b border-[#a09e90]">
            <tr className="whitespace-nowrap">
              <th className="p-2.5 w-10 text-center whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={
                    activeSelection.size > 0 &&
                    activeSelection.size === activeTanks.length
                  }
                  onChange={selectAll}
                  className={`rounded-none border-slate-300 bg-white text-slate-900 cursor-pointer ${isYard ? 'accent-blue-600' : 'accent-emerald-600'
                    }`}
                />
              </th>
              <th className="p-2.5 whitespace-nowrap">TANK NO</th>
              <th className="p-2.5 whitespace-nowrap">SERIAL NO</th>
              <th className="p-2.5 text-right whitespace-nowrap">DRY TARE (KG)</th>
              <th className="p-2.5 text-right whitespace-nowrap">HEEL (KG / m³)</th>
              <th className="p-2.5 text-right bg-blue-100/60 text-blue-950 whitespace-nowrap">PRE-LOAD TARE (KG)</th>
              <th className="p-2.5 text-right whitespace-nowrap">PRESSURE</th>
              <th className="p-2.5 text-right whitespace-nowrap">TEMP</th>
              <th className="p-2.5 text-center whitespace-nowrap">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {activeTanks.map((tank) => {
              const isSelected = activeSelection.has(tank.tankNo);
              const isCertified =
                isYard &&
                (safeBatchRecords.some((r) => r.tankNo === tank.tankNo) ||
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
                  className={`hover:bg-blue-50/40 transition-colors whitespace-nowrap ${isSelected
                    ? 'bg-blue-50'
                    : isCertified
                      ? 'bg-cyan-50/50'
                      : 'bg-white'
                    }`}
                >
                  <td className="p-2.5 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(tank.tankNo)}
                      className={`rounded-none border-slate-300 bg-white text-slate-900 cursor-pointer ${isYard ? 'accent-blue-600' : 'accent-emerald-600'
                        }`}
                    />
                  </td>
                  <td className="p-2.5 font-bold flex items-center gap-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedHeelAuditTankNo(tank.tankNo)}
                      className="text-sm font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer font-mono whitespace-nowrap"
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
                  <td className="p-2.5 text-sm font-mono text-slate-800 whitespace-nowrap">{tank.serialNo}</td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900 font-semibold whitespace-nowrap">
                    {dryTare.toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900 font-semibold whitespace-nowrap">
                    <span className="text-slate-900 font-semibold whitespace-nowrap">{heelMass.toLocaleString()} kg</span>{' '}
                    <span className="text-blue-900 text-xs font-bold whitespace-nowrap">({heelVol.toFixed(2)} m³)</span>
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-blue-900 font-bold bg-blue-50/50 whitespace-nowrap">
                    {preLoadTare.toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900 whitespace-nowrap">
                    {pressMpa.toFixed(2)} MPa
                  </td>
                  <td className="p-2.5 text-right text-sm font-mono text-slate-900 whitespace-nowrap">
                    {tempC.toFixed(1)} °C
                  </td>
                  <td className="p-2.5 text-center font-sans whitespace-nowrap">
                    {isYard ? (
                      <select
                        value={getTankStatus(tank.tankNo)}
                        onChange={(event) => {
                          const nextStatus = event.target.value as TankStatus;
                          setTankStatusMap((prev) => ({ ...prev, [tank.tankNo]: nextStatus }));
                        }}
                        className={`text-[10px] font-bold border rounded shadow-sm appearance-none cursor-pointer min-w-[120px] text-center ${statusSelectClass(getTankStatus(tank.tankNo))}`}
                        title="Set tank pipeline status"
                        style={{ textAlign: 'center' }}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-none bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap">
                        Offload Ready
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {activeTanks.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-700 font-sans text-xs whitespace-nowrap">
                  {isYard
                    ? 'No ISO Tanks currently staged in Arun PAG Yard.'
                    : 'No candidate tanks found onboard M/V Saviour.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div >
  );
}
