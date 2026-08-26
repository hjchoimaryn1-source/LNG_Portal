// src/components/locations/MvSaviourView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../../context/PortalDataContext';
import { DefectCategory, NodeState } from '../../types/lng';
import { exportToCSV } from '../../utils/exportCsv';
import {
  Ship,
  Gauge,
  Thermometer,
  Droplet,
  Search,
  CheckCircle2,
  Navigation,
  Anchor,
  Compass,
  Battery,
  Wrench,
  XCircle,
  RotateCcw,
  PlusCircle,
  Download,
} from 'lucide-react';

interface MvSaviourViewProps {
  initialSubTab?: 'VOYAGE_MONITORING' | 'MARINE_PRESSURE';
}

export default function MvSaviourView({ initialSubTab = 'VOYAGE_MONITORING' }: MvSaviourViewProps) {
  const {
    fleetTanks,
    batchTransitionTanks,
    updateTankLog,
    markTankForMaintenance,
    completeReturnCycle,
    addDailyMasterLog,
  } = usePortalData();

  const [subTab, setSubTab] = useState<'VOYAGE_MONITORING' | 'MARINE_PRESSURE'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTanks, setSelectedTanks] = useState<Set<string>>(new Set());
  const [mroModalTankNo, setMroModalTankNo] = useState<string | null>(null);
  const [defectCat, setDefectCat] = useState<DefectCategory>('VALVE_LEAK');
  const [defectDesc, setDefectDesc] = useState<string>('');
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Daily Inspection Form State
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logTargetTanks, setLogTargetTanks] = useState<'ALL_SAILING' | 'SELECTED'>('ALL_SAILING');
  const [inputPressure, setInputPressure] = useState<number>(0.77);
  const [inputTemp, setInputTemp] = useState<number>(-126.8);
  const [inputLevel, setInputLevel] = useState<number>(68);
  const [inputBattery, setInputBattery] = useState<number>(95);

  // Tanks currently sailing on MV. SAVIOUR (Node 2)
  const sailingTanks = useMemo(() => {
    return fleetTanks.filter(
      (t) => t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT && !t.isUnderMaintenance
    );
  }, [fleetTanks]);

  const filteredTanks = useMemo(() => {
    return sailingTanks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q)
      );
    });
  }, [sailingTanks, searchQuery]);

  const toggleSelectTank = (tankNo: string) => {
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

  // Discharge full tanks to Nias Laydown
  const handleDischargeToNias = () => {
    if (selectedTanks.size === 0) return;
    const count = selectedTanks.size;
    batchTransitionTanks(Array.from(selectedTanks), NodeState.NODE_3_NIAS_LAYDOWN_YARD);
    setSelectedTanks(new Set());
    setToastMessage(`Discharged ${count} tanks to Nias Laydown Yard 1`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Complete return cycle: Return empty tanks back to Arun Terminal
  const handleCompleteReturnCycle = () => {
    if (selectedTanks.size === 0) return;
    const count = selectedTanks.size;
    completeReturnCycle(Array.from(selectedTanks));
    setSelectedTanks(new Set());
    setToastMessage(`Returned ${count} empty tanks to Arun PAG Terminal (Cycle Complete)`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mroModalTankNo) return;
    markTankForMaintenance(mroModalTankNo, defectCat, 'ARUN_WORKSHOP', defectDesc || 'Marine voyage reported fault');
    setMroModalTankNo(null);
    setDefectDesc('');
    setToastMessage(`Tank ${mroModalTankNo} sent to Arun MRO Workshop`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDailyInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetTankList =
      logTargetTanks === 'ALL_SAILING'
        ? sailingTanks.map((t) => t.tankNo)
        : Array.from(selectedTanks);

    if (targetTankList.length === 0) {
      alert('Please select at least one tank or choose All Sailing Tanks.');
      return;
    }

    const updates = targetTankList.map((tNo) => ({
      tankNo: tNo,
      pressureMPa: inputPressure,
      tempC: inputTemp,
      level: inputLevel,
      battery: inputBattery,
      lastReportDate: logDate,
    }));

    addDailyMasterLog(updates);
    setIsDailyLogModalOpen(false);
    setToastMessage(`Logged Marine Deck Inspection for ${targetTankList.length} tanks (${logDate})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportMarineCSV = () => {
    exportToCSV(
      'MV_Saviour_Marine_Deck_Pressure_Log',
      filteredTanks.map((t) => ({
        TankNo: t.tankNo,
        SerialNo: t.serialNo,
        Position: t.position,
        Location: t.location,
        PressureMPa: t.pressureMPa,
        TempC: t.tempC,
        LevelPct: t.level,
        BatteryPct: t.battery,
        LastReportDate: t.lastReportDate || '2026-08-13',
        Remarks: t.remarks,
      }))
    );
  };

  const handleFieldChange = (
    tankNo: string,
    field: 'level' | 'pressureMPa' | 'tempC' | 'battery',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    updateTankLog(tankNo, { [field]: num });
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header with Sub-Tabs */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Ship className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">MV. Saviour Marine Transit Hub</h2>
          </div>
          <p className="text-xs text-slate-400">
            Dedicated offshore LNG shuttle monitoring between Arun PAG Port and Nias Gunungsitoli Jetty
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDailyLogModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Marine Deck Log</span>
          </button>

          <button
            onClick={handleExportMarineCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSubTab('VOYAGE_MONITORING')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                subTab === 'VOYAGE_MONITORING'
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Voyage Fleet ({sailingTanks.length})</span>
            </button>
            <button
              onClick={() => setSubTab('MARINE_PRESSURE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                subTab === 'MARINE_PRESSURE'
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>Marine Pressure Log</span>
            </button>
          </div>
        </div>
      </section>

      {/* Voyage Telemetry Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Vessel & Route
          </span>
          <span className="text-lg font-bold text-cyan-400 block mb-1">MV. SAVIOUR (LCT)</span>
          <span className="text-xs text-slate-500">Arun PAG ➔ Nias Island Jetty</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Sailing Cargo Volume
          </span>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{sailingTanks.length}</span>
            <span className="text-xs text-slate-400 font-mono">ISO Tanks On Deck</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">~{(sailingTanks.length * 850).toLocaleString()} MMBtu Equivalent</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Average Marine Pressure
          </span>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">0.77</span>
            <span className="text-xs text-slate-400 font-mono">MPa (Stable)</span>
          </div>
          <span className="text-xs text-slate-500">BOG Containment: Normal</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Voyage State
          </span>
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-base font-bold text-cyan-300">Underway Sailing</span>
          </div>
          <span className="text-xs text-slate-500">Shipment Code: N1</span>
        </div>
      </div>

      {/* Control Action Bar with Discharge & Closed Return Actions */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Sailing Tanks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium transition-colors"
          >
            {selectedTanks.size > 0 && selectedTanks.size === filteredTanks.length
              ? 'Deselect All'
              : 'Select All'}
          </button>

          {/* Discharge to Nias */}
          <button
            onClick={handleDischargeToNias}
            disabled={selectedTanks.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTanks.size > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Discharge to Nias ({selectedTanks.size})</span>
          </button>

          {/* Complete Return Cycle to Arun */}
          <button
            onClick={handleCompleteReturnCycle}
            disabled={selectedTanks.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTanks.size > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Arrived at Arun (Complete Return)</span>
          </button>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 1. VOYAGE MONITORING FLEET CARDS */}
      {/* ==================================================================== */}
      {subTab === 'VOYAGE_MONITORING' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 animate-in fade-in duration-200 font-sans">
          {filteredTanks.map((tank) => {
            const isSelected = selectedTanks.has(tank.tankNo);
            const isEmptyReturn = tank.position.includes('EMPTY') || tank.remarks.includes('Empty');

            return (
              <div
                key={tank.tankNo}
                onClick={() => toggleSelectTank(tank.tankNo)}
                className={`rounded-lg border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-md ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/40'
                    : 'bg-slate-900 border-slate-600 hover:border-slate-400'
                }`}
              >
                {/* Card Title Bar */}
                <div className="bg-slate-800 px-3 py-2 border-b border-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm text-white">
                      {tank.tankNo}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded border-slate-600 bg-slate-950 text-cyan-400 accent-cyan-500 cursor-pointer w-4 h-4"
                  />
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-300 font-mono font-semibold truncate">{tank.serialNo}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 border ${
                        isEmptyReturn
                          ? 'bg-purple-950/90 border-purple-500 text-purple-300'
                          : 'bg-cyan-950/90 border-cyan-500 text-cyan-300'
                      }`}
                    >
                      <Ship className="w-3 h-3" />
                      {isEmptyReturn ? 'Empty Return' : 'Sailing LNG'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1.5 border-t border-slate-700/80 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px] text-slate-300 font-bold font-sans">
                        <Droplet className="w-3.5 h-3.5 text-blue-400" /> Level:
                      </span>
                      <span className="font-black text-white">{tank.level}%</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px] text-slate-300 font-bold font-sans">
                        <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Pressure:
                      </span>
                      <span className="font-extrabold text-emerald-400">{tank.pressureMPa.toFixed(2)} MPa</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px] text-slate-300 font-bold font-sans">
                        <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Temp:
                      </span>
                      <span className="font-bold text-cyan-300">{tank.tempC.toFixed(1)} °C</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-700 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-bold truncate max-w-[100px]">
                    {tank.position}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMroModalTankNo(tank.tankNo);
                    }}
                    className="p-1 text-amber-400 hover:text-amber-300 font-bold font-sans flex items-center gap-1 cursor-pointer"
                  >
                    <Wrench className="w-3 h-3" /> MRO
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. MARINE PRESSURE TELEMETRY SPREADSHEET */}
      {/* ==================================================================== */}
      {subTab === 'MARINE_PRESSURE' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-200">
          <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[880px]">
              <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <tr className="border-b border-slate-800">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedTanks.size > 0 && selectedTanks.size === filteredTanks.length}
                      onChange={selectAll}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 accent-cyan-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Tank No / Serial</th>
                  <th className="p-3 text-right">Pressure (MPa)</th>
                  <th className="p-3 text-right">Temp (°C)</th>
                  <th className="p-3 text-right">Level (%)</th>
                  <th className="p-3 text-right">Battery (%)</th>
                  <th className="p-3">Position</th>
                  <th className="p-3 text-center">Fault / MRO</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/60 font-mono">
                {filteredTanks.map((tank) => {
                  const isSelected = selectedTanks.has(tank.tankNo);
                  return (
                    <tr
                      key={tank.tankNo}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : 'bg-transparent'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTank(tank.tankNo)}
                          className="rounded border-slate-700 bg-slate-950 text-cyan-500 accent-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-cyan-400 block">{tank.tankNo}</span>
                        <span className="text-[10px] text-slate-500">{tank.serialNo}</span>
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={tank.pressureMPa}
                          onChange={(e) => handleFieldChange(tank.tankNo, 'pressureMPa', e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-emerald-400 font-semibold focus:border-cyan-500 outline-none"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={tank.tempC}
                          onChange={(e) => handleFieldChange(tank.tankNo, 'tempC', e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-red-400 focus:border-cyan-500 outline-none"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={tank.level}
                          onChange={(e) => handleFieldChange(tank.tankNo, 'level', e.target.value)}
                          className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-slate-100 focus:border-cyan-500 outline-none"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1 text-slate-300">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{tank.battery}%</span>
                        </div>
                      </td>
                      <td className="p-3 font-sans text-slate-300">{tank.position}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setMroModalTankNo(tank.tankNo)}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded font-sans text-[11px] inline-flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3 text-amber-400" />
                          <span>MRO</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Daily Marine Deck Inspection Modal */}
      {isDailyLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-cyan-400" />
                Add Daily Marine Deck Inspection Log
              </h3>
              <button
                onClick={() => setIsDailyLogModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDailyInspectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Inspection Date:</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target ISO Tanks:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLogTargetTanks('ALL_SAILING')}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                      logTargetTanks === 'ALL_SAILING'
                        ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    All Sailing ({sailingTanks.length} Tanks)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogTargetTanks('SELECTED')}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                      logTargetTanks === 'SELECTED'
                        ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Selected Only ({selectedTanks.size} Tanks)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Pressure (MPa):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputPressure}
                    onChange={(e) => setInputPressure(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Temp (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputTemp}
                    onChange={(e) => setInputTemp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-red-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Level (%):</label>
                  <input
                    type="number"
                    value={inputLevel}
                    onChange={(e) => setInputLevel(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Battery (%):</label>
                  <input
                    type="number"
                    value={inputBattery}
                    onChange={(e) => setInputBattery(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDailyLogModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow-md shadow-cyan-500/20"
                >
                  Save Marine Inspection Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick MRO Modal */}
      {mroModalTankNo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Send {mroModalTankNo} to Arun MRO Workshop
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
                  <option value="VACUUM_LOSS">Vacuum Loss (High Marine BOG / Jacket loss)</option>
                  <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
                  <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
                  <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Lashing impact)</option>
                  <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Defect Description:</label>
                <textarea
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="Observed abnormal pressure rise or sensor failure during transit..."
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
                  Route to MRO Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
