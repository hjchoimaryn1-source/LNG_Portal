// src/components/FieldDesktopWorkspace.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { DefectCategory, NodeState } from '../types/lng';
import {
  Play,
  Square,
  Activity,
  Thermometer,
  Droplet,
  ArrowRightCircle,
  PlusCircle,
  XCircle,
  Save,
  Search,
  ArrowRight,
  Flame,
  Wrench,
} from 'lucide-react';

export default function FieldDesktopWorkspace() {
  const {
    activeBays,
    fleetTanks,
    updateTankLog,
    batchTransitionTanks,
    mountTankToBay,
    unmountBay,
    toggleBayRunning,
    markTankForMaintenance,
  } = usePortalData();

  const [selectedTanks, setSelectedTanks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mountModalBayId, setMountModalBayId] = useState<string | null>(null);
  const [mroModalTankNo, setMroModalTankNo] = useState<string | null>(null);
  const [defectCat, setDefectCat] = useState<DefectCategory>('VALVE_LEAK');
  const [defectDesc, setDefectDesc] = useState<string>('');
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null);

  // Available unmounted tanks
  const availableTanksForMount = useMemo(() => {
    return fleetTanks.filter(
      (t) =>
        (t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD || t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY) &&
        !t.isUnderMaintenance
    );
  }, [fleetTanks]);

  // Filtered rows for the batch spreadsheet
  const filteredTanks = useMemo(() => {
    return fleetTanks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q)
      );
    });
  }, [fleetTanks, searchQuery]);

  const toggleTankSelection = (tankNo: string) => {
    setSelectedTanks((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) next.delete(tankNo);
      else next.add(tankNo);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTanks.size === filteredTanks.length) {
      setSelectedTanks(new Set());
    } else {
      setSelectedTanks(new Set(filteredTanks.map((t) => t.tankNo)));
    }
  };

  const handleFieldChange = (
    tankNo: string,
    field: 'level' | 'pressureMPa' | 'tempC' | 'depress' | 'pressBeforeMPa' | 'pressAfterMPa',
    val: string | number
  ) => {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    updateTankLog(tankNo, { [field]: typeof val === 'string' && field === 'depress' ? val : num });
    setSaveIndicator(`Updated ${tankNo} ${field}`);
    setTimeout(() => setSaveIndicator(null), 2000);
  };

  const handleBatchTransition = (targetNode: NodeState) => {
    if (selectedTanks.size === 0) return;
    batchTransitionTanks(Array.from(selectedTanks), targetNode);
    setSelectedTanks(new Set());
    setSaveIndicator(`Moved selected tanks to next node`);
    setTimeout(() => setSaveIndicator(null), 2500);
  };

  const handleMroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mroModalTankNo) return;
    markTankForMaintenance(mroModalTankNo, defectCat, 'NIAS_MRO_BAY', defectDesc || 'Field inspection fault');
    setMroModalTankNo(null);
    setDefectDesc('');
    setSaveIndicator(`Tank ${mroModalTankNo} sent to MRO`);
    setTimeout(() => setSaveIndicator(null), 2500);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full text-slate-100">
      {/* Toast / Save indicator */}
      {saveIndicator && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600/90 text-white rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Save className="w-4 h-4" />
          {saveIndicator}
        </div>
      )}

      {/* 4-Bay Live Mount Panel */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              Active Regasification Bays (Vaporization Units 01 ~ 04)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Direct telemetry from mounted ISO Tanks to the Nias Power Plant Vaporizer manifolds
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ORU Nias Plant Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {activeBays.map((bay) => {
            const isRunning = bay.status === 'RUNNING';
            const isStandby = bay.status === 'STANDBY';
            const isConnected = !!bay.tankNo;

            return (
              <div
                key={bay.bayId}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isRunning
                    ? 'bg-slate-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                    : isStandby
                    ? 'bg-slate-900/70 border-blue-500/40'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                {/* Top Status Header */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-100">{bay.bayId}</span>
                      {bay.startTime && isRunning && (
                        <span className="text-[10px] text-slate-400 font-mono">Since {bay.startTime}</span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                        isRunning
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : isStandby
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {bay.status}
                    </span>
                  </div>

                  {/* Mounted Tank Info */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 sm:p-2.5 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        Mounted Tank
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-blue-400">
                        {bay.tankNo || 'Empty Bay (No Tank)'}
                      </span>
                      {bay.serialNo && (
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px] sm:max-w-none">
                          {bay.serialNo}
                        </span>
                      )}
                    </div>
                    {isConnected ? (
                      <button
                        onClick={() => unmountBay(bay.bayId)}
                        title="Unmount / Disconnect Tank"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setMountModalBayId(bay.bayId)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-400 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Mount
                      </button>
                    )}
                  </div>

                  {/* 4 Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                      <Activity className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                      <span className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-semibold">Pressure</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-200">
                        {bay.pressure.toFixed(2)} <span className="text-[9px] font-normal text-slate-500">MPa</span>
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                      <Thermometer className="w-3.5 h-3.5 text-red-400 mb-1" />
                      <span className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-semibold">Temp</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-200">
                        {bay.temp.toFixed(1)} <span className="text-[9px] font-normal text-slate-500">°C</span>
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                      <Droplet className="w-3.5 h-3.5 text-blue-400 mb-1" />
                      <span className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-semibold">Level</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-200">
                        {bay.level.toFixed(0)} <span className="text-[9px] font-normal text-slate-500">%</span>
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                      <ArrowRightCircle className="w-3.5 h-3.5 text-purple-400 mb-1" />
                      <span className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-semibold">Flow</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-200">
                        {bay.flowRate.toFixed(1)} <span className="text-[9px] font-normal text-slate-500">t/h</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bay Controls */}
                <div className="flex gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => toggleBayRunning(bay.bayId)}
                    disabled={!isConnected}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex justify-center items-center gap-1.5 transition-all ${
                      !isConnected
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : isRunning
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Square className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Start
                      </>
                    )}
                  </button>
                  {isConnected && (
                    <button
                      onClick={() => unmountBay(bay.bayId)}
                      className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      Cycle Out
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mount Modal */}
      {mountModalBayId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                Mount ISO Tank to {mountModalBayId}
              </h3>
              <button
                onClick={() => setMountModalBayId(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select an available ISO Tank from the Nias Laydown Yard (Node 3) to connect to {mountModalBayId}:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-6">
              {availableTanksForMount.map((tank) => (
                <div
                  key={tank.tankNo}
                  onClick={() => {
                    mountTankToBay(mountModalBayId, tank.tankNo);
                    setMountModalBayId(null);
                  }}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-blue-400">{tank.tankNo}</span>
                    <span className="text-xs text-slate-400 font-mono ml-2">({tank.serialNo})</span>
                    <span className="text-[10px] text-slate-500 block">{tank.position}</span>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-emerald-400 font-bold block">{tank.level}% Level</span>
                    <span className="text-slate-400">{tank.pressureMPa.toFixed(2)} MPa</span>
                  </div>
                </div>
              ))}
              {availableTanksForMount.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No tanks currently available in Nias Laydown Yard.
                </div>
              )}
            </div>

            <button
              onClick={() => setMountModalBayId(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Spreadsheet Batch-Entry Grid (Master DB logs) */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
        {/* Table Control Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              Field Master DB Batch-Entry Grid
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Live inline entry for Level, Pressure, Temp, and Depressurization values (auto-synced to FSM state)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Tank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Node Transition Buttons */}
            {selectedTanks.size > 0 && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
                <span className="text-[10px] sm:text-[11px] text-blue-400 font-semibold px-1.5 whitespace-nowrap">
                  {selectedTanks.size} Sel:
                </span>
                <button
                  onClick={() => handleBatchTransition(NodeState.NODE_3_NIAS_LAYDOWN_YARD)}
                  className="px-2 py-0.8 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] sm:text-[11px] font-semibold transition-colors flex items-center gap-0.5 whitespace-nowrap"
                >
                  Laydown <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleBatchTransition(NodeState.NODE_4_REGAS_ACTIVE_BAY)}
                  className="px-2 py-0.8 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] sm:text-[11px] font-semibold transition-colors flex items-center gap-0.5 whitespace-nowrap"
                >
                  Regas <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleBatchTransition(NodeState.NODE_5_EMPTY_RETURN_CYCLE)}
                  className="px-2 py-0.8 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] sm:text-[11px] font-semibold transition-colors flex items-center gap-0.5 whitespace-nowrap"
                >
                  Return <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* High-density Data Table */}
        <div className="overflow-x-auto max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
              <tr className="border-b border-slate-800">
                <th className="p-2.5 sm:p-3 w-8 sm:w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTanks.size > 0 && selectedTanks.size === filteredTanks.length}
                    onChange={selectAll}
                    className="rounded border-slate-700 bg-slate-900 text-blue-500 accent-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-2.5 sm:p-3">Tank / Serial</th>
                <th className="p-2.5 sm:p-3">Location & Node</th>
                <th className="p-2.5 sm:p-3 text-right">Level (%)</th>
                <th className="p-2.5 sm:p-3 text-right">Pressure (MPa)</th>
                <th className="p-2.5 sm:p-3 text-right">Temp (°C)</th>
                <th className="p-2.5 sm:p-3">Depress Status</th>
                <th className="p-2.5 sm:p-3 text-right">Press Before</th>
                <th className="p-2.5 sm:p-3 text-right">Press After</th>
                <th className="p-2.5 sm:p-3 text-center">MRO</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-800/60 font-mono">
              {filteredTanks.map((tank) => {
                const isSelected = selectedTanks.has(tank.tankNo);
                return (
                  <tr
                    key={tank.tankNo}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-blue-950/20' : 'bg-transparent'
                    }`}
                  >
                    <td className="p-2.5 sm:p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTankSelection(tank.tankNo)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 accent-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 sm:p-3">
                      <span className="font-bold text-blue-400 block">{tank.tankNo}</span>
                      <span className="text-[10px] text-slate-500">{tank.serialNo}</span>
                    </td>
                    <td className="p-2.5 sm:p-3 font-sans">
                      <span className="text-slate-300 font-medium block">{tank.location}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px] block">
                        {tank.position}
                      </span>
                    </td>
                    {/* Level inline input */}
                    <td className="p-2.5 sm:p-3 text-right">
                      <input
                        type="number"
                        value={tank.level}
                        onChange={(e) => handleFieldChange(tank.tankNo, 'level', e.target.value)}
                        className="w-14 sm:w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-right text-slate-100 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    {/* Pressure inline input */}
                    <td className="p-2.5 sm:p-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={tank.pressureMPa}
                        onChange={(e) => handleFieldChange(tank.tankNo, 'pressureMPa', e.target.value)}
                        className="w-16 sm:w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-right text-emerald-400 font-semibold focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    {/* Temp inline input */}
                    <td className="p-2.5 sm:p-3 text-right">
                      <input
                        type="number"
                        step="0.1"
                        value={tank.tempC}
                        onChange={(e) => handleFieldChange(tank.tankNo, 'tempC', e.target.value)}
                        className="w-16 sm:w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-right text-red-400 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    {/* Depress status input */}
                    <td className="p-2.5 sm:p-3 font-sans">
                      <input
                        type="text"
                        value={tank.depress}
                        onChange={(e) => handleFieldChange(tank.tankNo, 'depress', e.target.value)}
                        placeholder="-"
                        className="w-24 sm:w-28 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:border-blue-500 focus:outline-none text-xs"
                      />
                    </td>
                    {/* Press Before inline input */}
                    <td className="p-2.5 sm:p-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={tank.pressBeforeMPa}
                        onChange={(e) => handleFieldChange(tank.tankNo, 'pressBeforeMPa', e.target.value)}
                        className="w-14 sm:w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-right text-slate-300 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    {/* Press After inline input */}
                    <td className="p-2.5 sm:p-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={tank.pressAfterMPa}
                        onChange={(e) => handleFieldChange(tank.tankNo, 'pressAfterMPa', e.target.value)}
                        className="w-14 sm:w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-right text-slate-300 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <button
                        onClick={() => setMroModalTankNo(tank.tankNo)}
                        title="Report Fault / Send to MRO"
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded text-xs font-sans inline-flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        <span>MRO</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick MRO Modal */}
      {mroModalTankNo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Send {mroModalTankNo} to Nias MRO Field Bay
              </h3>
              <button
                onClick={() => setMroModalTankNo(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMroSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Defect Classification:</label>
                <select
                  value={defectCat}
                  onChange={(e) => setDefectCat(e.target.value as DefectCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
                  <option value="VACUUM_LOSS">Vacuum Loss (High BOG / Annular failure)</option>
                  <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
                  <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Corner casting)</option>
                  <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Defect Description:</label>
                <textarea
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="Observed leak, pressure drop, or sensor failure..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMroModalTankNo(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                >
                  Route to MRO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
