// src/components/locations/MvSaviourView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../../context/PortalDataContext';
import { DefectCategory, NodeState } from '../../types/lng';
import { exportToCSV } from '../../utils/exportCsv';
import {
  Search,
  CheckCircle2,
  Navigation,
  Anchor,
  Battery,
  Wrench,
  PlusCircle,
  Download,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import SaviorStowageTab from './saviour/SaviorStowageTab';

interface MvSaviourViewProps {
  initialSubTab?: 'STOWAGE_PLAN' | 'VOYAGE_PRESSURE' | 'DISCHARGE_NIAS';
}

export default function MvSaviourView({ initialSubTab = 'STOWAGE_PLAN' }: MvSaviourViewProps) {
  const {
    fleetTanks,
    batchTransitionTanks,
    updateTankLog,
    markTankForMaintenance,
    addDailyMasterLog,
  } = usePortalData();

  // Normalize tab keys
  const getNormalizedTab = (key?: string): 'STOWAGE_PLAN' | 'VOYAGE_PRESSURE' | 'DISCHARGE_NIAS' => {
    if (key === 'DISCHARGE_NIAS') return 'DISCHARGE_NIAS';
    if (key === 'VOYAGE_PRESSURE') return 'VOYAGE_PRESSURE';
    return 'STOWAGE_PLAN';
  };

  const [subTab, setSubTab] = useState<'STOWAGE_PLAN' | 'VOYAGE_PRESSURE' | 'DISCHARGE_NIAS'>(() =>
    getNormalizedTab(initialSubTab)
  );

  React.useEffect(() => {
    setSubTab(getNormalizedTab(initialSubTab));
  }, [initialSubTab]);

  const [selectedFleet, setSelectedFleet] = useState<'MV_SAVIOUR' | 'TUG_BARGE_01'>('MV_SAVIOUR');
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

  // Tanks currently sailing in transit on vessel (Node 2)
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

  const handleSelectAllForDischarge = () => {
    setSelectedTanks(new Set(sailingTanks.map((t) => t.tankNo)));
  };

  // Discharge full tanks to Nias Laydown Yard 1
  const handleDischargeToNias = () => {
    if (selectedTanks.size === 0) return;
    const count = selectedTanks.size;
    batchTransitionTanks(Array.from(selectedTanks), NodeState.NODE_3_NIAS_LAYDOWN_YARD);
    setSelectedTanks(new Set());
    setToastMessage(`Discharged ${count} tanks to Nias Laydown Yard 1 (LD-1)`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSingleDischarge = (tankNo: string) => {
    batchTransitionTanks([tankNo], NodeState.NODE_3_NIAS_LAYDOWN_YARD);
    setSelectedTanks((prev) => {
      const next = new Set(prev);
      next.delete(tankNo);
      return next;
    });
    setToastMessage(`Tank ${tankNo} discharged to Nias Laydown Yard 1`);
    setTimeout(() => setToastMessage(null), 3000);
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
      'Marine_Transit_Deck_Pressure_Log',
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
    <div className="h-full flex flex-col min-h-0 gap-3 w-full text-slate-900 font-bold overflow-hidden font-mono">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-bold rounded-xs shadow-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Information Banner (Classic Bright Gray Theme) */}
      <div className="bg-[#dcd8cf] text-slate-900 px-3 py-1.5 rounded-t-xs border-b border-[#b0aaa0] shadow-xs flex flex-wrap items-center justify-between gap-2.5 select-none font-mono">
        {/* Left: TRANSPORT MODE & Buttons Alone (No duplicate M/V SAVIOUR label) */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-xs font-bold text-slate-800 uppercase no-underline">TRANSPORT MODE:</span>
          <button
            type="button"
            onClick={() => setSelectedFleet('MV_SAVIOUR')}
            className={`px-3 py-1 text-xs font-mono rounded-xs transition-all cursor-pointer no-underline ${
              selectedFleet === 'MV_SAVIOUR'
                ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
            }`}
          >
            [ M/V SAVIOUR ]
          </button>
          <button
            type="button"
            onClick={() => setSelectedFleet('TUG_BARGE_01')}
            className={`px-3 py-1 text-xs font-mono rounded-xs transition-all cursor-pointer no-underline ${
              selectedFleet === 'TUG_BARGE_01'
                ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
            }`}
          >
            [ TUG &amp; BARGE ]
          </button>
        </div>
      </div>

      {/* Standby View for TUG & BARGE */}
      {selectedFleet === 'TUG_BARGE_01' ? (
        <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs p-8 text-center space-y-3 font-mono shadow-sm">
          <div className="text-sm font-black text-slate-800 uppercase tracking-wide">
            TUG &amp; BARGE - 01 (STANDBY FLEET)
          </div>
          <p className="text-xs text-slate-600 font-bold max-w-md mx-auto">
            Currently on secondary standby at Arun Marine Berth 02. No active laden voyage assigned.
          </p>
          <div className="inline-block bg-[#002b4d] text-cyan-300 px-3 py-1 rounded-xs text-xs font-black border border-blue-900">
            FLEET STATUS: STANDBY / COLD RESERVE
          </div>
        </div>
      ) : (
        <>
          {/* 2. M/V Saviour 3-Step Equal Width Workflow Tabs (33.3% each) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-[#dfdbd1] p-1.5 rounded-xs border border-[#8a8579] font-mono text-xs select-none">
            <button
              type="button"
              onClick={() => setSubTab('STOWAGE_PLAN')}
              className={`py-1.5 px-2 text-center text-xs rounded-xs font-mono truncate transition-all cursor-pointer no-underline ${
                subTab === 'STOWAGE_PLAN'
                  ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                  : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
              }`}
            >
              [ 1. STOWAGE PLAN ]
            </button>

            <button
              type="button"
              onClick={() => setSubTab('VOYAGE_PRESSURE')}
              className={`py-1.5 px-2 text-center text-xs rounded-xs font-mono truncate transition-all cursor-pointer no-underline ${
                subTab === 'VOYAGE_PRESSURE'
                  ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                  : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
              }`}
            >
              [ 2. VOYAGE TELEMETRY ]
            </button>

            <button
              type="button"
              onClick={() => setSubTab('DISCHARGE_NIAS')}
              className={`py-1.5 px-2 text-center text-xs rounded-xs font-mono truncate transition-all cursor-pointer no-underline ${
                subTab === 'DISCHARGE_NIAS'
                  ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                  : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
              }`}
            >
              [ 3. DISCHARGE ]
            </button>
          </div>

          {/* ==================================================================== */}
          {/* TAB 1: STOWAGE PLAN & BAY MANIFEST                                  */}
          {/* ==================================================================== */}
          {subTab === 'STOWAGE_PLAN' && (
            <SaviorStowageTab
              onSuccessToast={(msg) => {
                setTimeout(() => {
                  setToastMessage(msg);
                  setTimeout(() => setToastMessage(null), 3500);
                }, 0);
              }}
            />
          )}

          {/* ==================================================================== */}
          {/* TAB 2: VOYAGE TELEMETRY & MARINE PRESSURE LOG                        */}
          {/* ==================================================================== */}
          {subTab === 'VOYAGE_PRESSURE' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* 4 SCADA KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono">
                {/* Card 1 */}
                <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
                  <div className="bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">VESSEL &amp; ROUTE</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 bg-[#334155] text-slate-200 border border-[#64748b] rounded-xs">TRANSIT</span>
                  </div>
                  <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
                    <span className="text-base sm:text-lg font-black font-mono text-[#002b4d]">
                      M.V. SAVIOUR (LCT)
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">Arun PAG ➔ Nias Jetty</span>
                    <div className="pt-1.5 mt-1 border-t border-[#c8c2b5] w-full text-[9.5px] font-bold text-slate-500 text-center">
                      Shipment: N1 (VOY-2026-08)
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
                  <div className="bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">SAILING CARGO</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 bg-[#334155] text-slate-200 border border-[#64748b] rounded-xs">{sailingTanks.length} UNITS</span>
                  </div>
                  <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                      {sailingTanks.length} <span className="text-xs font-bold text-slate-600">TANKS</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 font-mono">
                      ~{(sailingTanks.length * 850).toLocaleString()} MMBtu
                    </span>
                    <div className="pt-1.5 mt-1 border-t border-[#c8c2b5] w-full text-[9.5px] font-bold text-slate-500 text-center">
                      On-Deck Secured
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
                  <div className="bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">AVERAGE PRESSURE</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 bg-blue-950/80 text-cyan-200 border border-blue-700 rounded-xs">STABLE</span>
                  </div>
                  <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
                    <span className="text-xl sm:text-2xl font-black font-mono text-[#0055aa]">
                      0.77 <span className="text-xs font-bold text-slate-600">MPa</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">BOG Containment: Normal</span>
                    <div className="pt-1.5 mt-1 border-t border-[#c8c2b5] w-full text-[9.5px] font-bold text-slate-500 text-center">
                      In-Spec Range (0.25 ~ 0.85 MPa)
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-[#f0f7ff] border-2 border-[#7ba4cc] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
                  <div className="bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">VOYAGE STATE</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 bg-emerald-950/80 text-emerald-200 border border-emerald-700 rounded-xs">UNDERWAY</span>
                  </div>
                  <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-700" />
                      <span className="text-base sm:text-lg font-black font-mono text-emerald-900">SAILING</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#004a99]">ETA Nias: In-Schedule</span>
                    <div className="pt-1.5 mt-1 border-t border-[#b8d2eb] w-full text-[9.5px] font-bold text-[#004a99] text-center">
                      Speed: 8.5 Knots
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#dfdbd1] p-2 rounded-xs border-2 border-[#8a8579] font-mono select-none">
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xs border-2 border-[#8a8579] shadow-inner max-w-full sm:max-w-[360px] w-full">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Tank ID, Serial, Position..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsDailyLogModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-xs text-xs font-bold font-mono bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs transition-all cursor-pointer select-none"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>[ ADD DECK LOG ]</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportMarineCSV}
                    className="flex items-center gap-1 px-3 py-1 rounded-xs text-xs font-bold font-mono bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs transition-all cursor-pointer select-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>[ EXPORT CSV ]</span>
                  </button>
                </div>
              </div>

              {/* Master Pressure Log Spreadsheet Table */}
              <div className="bg-white border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-md font-mono">
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scada-scrollbar">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-[#4e5d6e] text-white text-[11px] uppercase tracking-wider font-extrabold select-none">
                      <tr className="border-b border-[#8b9aa8]">
                        <th className="py-2 px-2 w-10 text-center border-r border-[#8b9aa8]">NO</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8]">TANK ID</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8]">SERIAL NO</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8]">PRESS (MPa)</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8]">TEMP (°C)</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8]">LEVEL (%)</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8]">BATTERY (%)</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8]">POSITION</th>
                        <th className="py-2 px-2">MRO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#cbd5e1] bg-white font-mono">
                      {filteredTanks.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500 font-bold">
                            No matching tanks found in active marine transit.
                          </td>
                        </tr>
                      ) : (
                        filteredTanks.map((tank, idx) => (
                          <tr
                            key={`${tank.tankNo}-${idx}`}
                            className="hover:bg-amber-50 transition-colors bg-white"
                          >
                            <td className="py-2 px-2 text-center border-r border-[#8b9aa8] text-slate-400 font-bold text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2 font-black text-[#0055aa] border-r border-[#8b9aa8] text-center">
                              {tank.tankNo}
                            </td>
                            <td className="py-2 px-2 font-bold text-slate-700 border-r border-[#8b9aa8] text-center">
                              {tank.serialNo}
                            </td>
                            <td className="py-2 px-2 border-r border-[#8b9aa8] text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={tank.pressureMPa}
                                onChange={(e) => handleFieldChange(tank.tankNo, 'pressureMPa', e.target.value)}
                                className="w-20 bg-white border border-[#8b9aa8] rounded-xs px-1.5 py-0.5 text-center font-bold text-[#0055aa] outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 border-r border-[#8b9aa8] text-center">
                              <input
                                type="number"
                                step="0.1"
                                value={tank.tempC}
                                onChange={(e) => handleFieldChange(tank.tankNo, 'tempC', e.target.value)}
                                className="w-20 bg-white border border-[#8b9aa8] rounded-xs px-1.5 py-0.5 text-center font-bold text-slate-800 outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 border-r border-[#8b9aa8] text-center">
                              <input
                                type="number"
                                value={tank.level}
                                onChange={(e) => handleFieldChange(tank.tankNo, 'level', e.target.value)}
                                className="w-16 bg-white border border-[#8b9aa8] rounded-xs px-1.5 py-0.5 text-center font-bold text-slate-800 outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 border-r border-[#8b9aa8] text-center">
                              <div className="inline-flex items-center justify-center gap-1 text-slate-800 font-bold">
                                <Battery className="w-3.5 h-3.5 text-slate-600" />
                                <span>{tank.battery}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 font-mono font-bold text-slate-700 border-r border-[#8b9aa8] text-center">
                              {tank.position}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => setMroModalTankNo(tank.tankNo)}
                                className="px-2 py-0.5 bg-[#d4d0c8] hover:bg-[#e0dcd4] border border-slate-500 rounded-xs text-slate-900 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>MRO</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 3: DISCHARGE TO NIAS JETTY                                       */}
          {/* ==================================================================== */}
          {subTab === 'DISCHARGE_NIAS' && (
            <div className="space-y-3 animate-in fade-in duration-200 font-mono">
              {/* Top Summary Settlement & Target Panel */}
              <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs p-3 shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#8a8579]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#002b4d] text-cyan-300 text-xs font-black rounded-xs">
                      DISCHARGE OPERATION
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      M.V. SAVIOUR ➔ NIAS GUNUNGSITOLI JETTY
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                    <span>ARRIVED AT JETTY: <strong className="text-slate-900">2026-08-30</strong></span>
                    <span>TARGET: <strong className="text-[#0055aa]">LAYDOWN YARD 1 (LD-1)</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-bold">TOTAL ONBOARD:</span>
                    <span className="font-black text-slate-900">{sailingTanks.length} TANKS</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-700 font-bold">SELECTED FOR DISCHARGE:</span>
                    <span className="font-black text-[#0055aa] bg-blue-100 px-2 py-0.5 border border-blue-300 rounded-xs">
                      {selectedTanks.size} / {sailingTanks.length} UNITS
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllForDischarge}
                      className="px-2.5 py-1 text-xs font-bold font-mono rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 shadow-xs transition-all cursor-pointer"
                    >
                      [ ARMED ALL ({sailingTanks.length}) ]
                    </button>
                    <button
                      type="button"
                      onClick={handleDischargeToNias}
                      disabled={selectedTanks.size === 0}
                      className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold font-mono rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs transition-all ${
                        selectedTanks.size > 0
                          ? 'bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white border-emerald-900 cursor-pointer'
                          : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Anchor className="w-3.5 h-3.5" />
                      <span>[ EXECUTE DISCHARGE TO YARD 1 ({selectedTanks.size}) ]</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#dfdbd1] p-2 rounded-xs border-2 border-[#8a8579] font-mono select-none">
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xs border-2 border-[#8a8579] shadow-inner max-w-full sm:max-w-[360px] w-full">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Vessel Stowage Tanks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-3 py-1 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs transition-all cursor-pointer font-mono bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600"
                  >
                    {selectedTanks.size > 0 && selectedTanks.size === filteredTanks.length
                      ? '[ DESELECT ALL ]'
                      : '[ SELECT ALL ]'}
                  </button>
                </div>
              </div>

              {/* 2-Tier Discharge Tally & Ledger Table */}
              <div className="bg-white border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-md font-mono">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scada-scrollbar">
                  <table className="w-full text-center border-collapse text-xs">
                    {/* Tier 1 Header */}
                    <thead className="sticky top-0 z-10 select-none">
                      <tr className="bg-[#4e5d6e] text-white font-extrabold uppercase text-[11px] tracking-wider border-b border-[#8b9aa8]">
                        <th colSpan={4} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#3e4d5e]">
                          [1] IDENTIFICATION
                        </th>
                        <th colSpan={4} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#3a506b]">
                          [2] PHYSICAL TELEMETRY
                        </th>
                        <th colSpan={2} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#475768]">
                          [3] LOGISTICS ROUTING
                        </th>
                        <th colSpan={1} className="py-2 px-2 text-center bg-[#2f855a]">
                          [4] ACTION
                        </th>
                      </tr>

                      {/* Tier 2 Header */}
                      <tr className="bg-[#5f6f82] text-[#f8fafc] font-bold text-[10px] tracking-tight border-b-2 border-[#8b9aa8]">
                        <th className="py-2 px-2 border-r border-[#8b9aa8] w-12 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTanks.size > 0 && selectedTanks.size === filteredTanks.length}
                            onChange={selectAll}
                            className="accent-[#002b4d] cursor-pointer w-3.5 h-3.5"
                          />
                        </th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">TANK ID</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">SERIAL NO</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">BATCH</th>

                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">VOL (m³)</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">MASS (kg)</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">PRESS (MPa)</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">TEMP (°C)</th>

                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">CURRENT STOWAGE</th>
                        <th className="py-2 px-2 border-r border-[#8b9aa8] text-center">DESTINATION YARD</th>

                        <th className="py-2 px-2 text-center">DISCHARGE</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-[#cbd5e1] bg-white font-mono">
                      {filteredTanks.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-500 font-bold">
                            All tanks discharged or no active cargo onboard M/V Saviour.
                          </td>
                        </tr>
                      ) : (
                        filteredTanks.map((tank, idx) => {
                          const isSelected = selectedTanks.has(tank.tankNo);
                          const isEven = idx % 2 === 0;

                          return (
                            <tr
                              key={`${tank.tankNo}-${idx}`}
                              className={`hover:bg-amber-50 transition-colors font-mono ${
                                isSelected ? (isEven ? 'bg-[#f5f9fc]' : 'bg-[#eef5fa]') : (isEven ? 'bg-[#faf9f6]' : 'bg-white')
                              }`}
                            >
                              <td className="py-2 px-1 border-r border-[#8b9aa8] text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectTank(tank.tankNo)}
                                    className="accent-[#002b4d] cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                                </div>
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-black text-[#0055aa] text-center">
                                {tank.tankNo}
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-bold text-slate-700 text-center">
                                {tank.serialNo}
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-black text-[#002b4d] text-center">
                                N1
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-bold text-slate-800 text-center">
                                40.9
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-bold text-slate-800 text-center">
                                17,500
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-black text-[#0055aa] text-center">
                                {tank.pressureMPa.toFixed(2)}
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-bold text-slate-800 text-center">
                                {tank.tempC.toFixed(1)}
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] font-bold text-slate-700 text-center">
                                {tank.position}
                              </td>

                              <td className="py-2 px-2 border-r border-[#8b9aa8] text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                                  <span>NIAS LD-1</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </td>

                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSingleDischarge(tank.tankNo)}
                                  className="px-2 py-0.5 bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white rounded-xs font-bold text-[10px] border border-emerald-900 cursor-pointer"
                                >
                                  [ DISCHARGE ]
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    {/* Total Sticky Footer */}
                    {filteredTanks.length > 0 && (
                      <tfoot className="sticky bottom-0 z-10 shadow-md">
                        <tr className="bg-[#e8e4dc] border-t-2 border-[#8a8579] font-mono font-bold text-xs text-slate-900 select-none">
                          <td colSpan={4} className="py-2.5 px-2 border-r border-[#8b9aa8] text-center font-black">
                            TOTAL ({selectedTanks.size} OF {sailingTanks.length} SELECTED)
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-900 text-center">
                            {(sailingTanks.length * 40.9).toFixed(1)}
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-900 text-center">
                            {(sailingTanks.length * 17500).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-[#0055aa] text-center">
                            0.77
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-800 text-center">
                            -126.8
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-700 text-center">
                            VESSEL STOWAGE
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-blue-900 text-center">
                            NIAS YARD 1
                          </td>
                          <td className="py-2.5 px-2 font-black text-[10px] text-emerald-800 text-center">
                            READY
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Daily Marine Deck Inspection Modal */}
      {isDailyLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="bg-white border-2 border-[#8a8579] rounded-xs max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-[#0a2540] text-white px-3.5 py-2.5 flex justify-between items-center border-b-2 border-[#071a2e]">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                ADD DAILY MARINE DECK INSPECTION LOG
              </h3>
              <button
                type="button"
                onClick={() => setIsDailyLogModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDailyInspectionSubmit} className="p-4 space-y-3 text-xs bg-[#f8fafc]">
              <div>
                <label className="block text-slate-800 font-bold mb-1">INSPECTION DATE:</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-900 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">TARGET ISO TANKS:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLogTargetTanks('ALL_SAILING')}
                    className={`py-1.5 px-3 rounded-xs border text-center font-bold transition-all cursor-pointer ${
                      logTargetTanks === 'ALL_SAILING'
                        ? 'bg-[#002b4d] text-cyan-300 border-blue-900'
                        : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border-slate-600'
                    }`}
                  >
                    All Sailing ({sailingTanks.length} Tanks)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogTargetTanks('SELECTED')}
                    className={`py-1.5 px-3 rounded-xs border text-center font-bold transition-all cursor-pointer ${
                      logTargetTanks === 'SELECTED'
                        ? 'bg-[#002b4d] text-cyan-300 border-blue-900'
                        : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border-slate-600'
                    }`}
                  >
                    Selected Only ({selectedTanks.size} Tanks)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-3 bg-white rounded-xs border border-[#8b9aa8]">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PRESSURE (MPa):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputPressure}
                    onChange={(e) => setInputPressure(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">TEMP (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputTemp}
                    onChange={(e) => setInputTemp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">LEVEL (%):</label>
                  <input
                    type="number"
                    value={inputLevel}
                    onChange={(e) => setInputLevel(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">BATTERY (%):</label>
                  <input
                    type="number"
                    value={inputBattery}
                    onChange={(e) => setInputBattery(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-900 font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#8a8579]/40">
                <button
                  type="button"
                  onClick={() => setIsDailyLogModalOpen(false)}
                  className="flex-1 py-1.5 bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 rounded-xs font-bold border border-slate-600 cursor-pointer"
                >
                  [ CANCEL ]
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-[#2f855a] hover:bg-[#38a169] text-white rounded-xs font-bold border border-emerald-800 cursor-pointer"
                >
                  [ SAVE DECK LOG ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick MRO Modal */}
      {mroModalTankNo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="bg-white border-2 border-[#8a8579] rounded-xs max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-[#0a2540] text-white px-3.5 py-2.5 flex justify-between items-center border-b-2 border-[#071a2e]">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-300" />
                SEND {mroModalTankNo} TO MRO WORKSHOP
              </h3>
              <button
                type="button"
                onClick={() => setMroModalTankNo(null)}
                className="text-slate-300 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMroSubmit} className="p-4 space-y-3 text-xs bg-[#f8fafc]">
              <div>
                <label className="block text-slate-800 font-bold mb-1">DEFECT CLASSIFICATION:</label>
                <select
                  value={defectCat}
                  onChange={(e) => setDefectCat(e.target.value as DefectCategory)}
                  className="w-full bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-900 font-bold outline-none"
                >
                  <option value="VACUUM_LOSS">Vacuum Loss (High Marine BOG / Jacket loss)</option>
                  <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
                  <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
                  <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Lashing impact)</option>
                  <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">DEFECT DESCRIPTION:</label>
                <textarea
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="Observed abnormal pressure rise or sensor failure during transit..."
                  rows={3}
                  className="w-full bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-900 font-bold outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#8a8579]/40">
                <button
                  type="button"
                  onClick={() => setMroModalTankNo(null)}
                  className="flex-1 py-1.5 bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 rounded-xs font-bold border border-slate-600 cursor-pointer"
                >
                  [ CANCEL ]
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-[#b7791f] hover:bg-[#d69e2e] text-white rounded-xs font-bold border border-amber-800 cursor-pointer"
                >
                  [ ROUTE TO MRO ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
